<?php

namespace App\Http\Controllers;

use App\Models\Delivery;
use App\Models\Inventory;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    public function index(Request $request)
    {
        $query = Sale::with(['customer', 'items.product', 'delivery'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->search, fn($q) => $q->where('order_number', 'like', "%{$request->search}%")
                ->orWhereHas('customer', fn($cq) => $cq->where('name', 'like', "%{$request->search}%")))
            ->when($request->from, fn($q) => $q->whereDate('created_at', '>=', $request->from))
            ->when($request->to, fn($q) => $q->whereDate('created_at', '<=', $request->to))
            ->latest();

        return response()->json([
            'data'   => $query->paginate($request->get('per_page', 15)),
            'status' => 'success',
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_id'    => 'required|exists:users,id',
            'items'          => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.product_variant_id' => 'nullable|exists:product_variants,id',
            'items.*.quantity'   => 'required|numeric|min:1',
            'items.*.price'      => 'nullable|numeric|min:0',
            'items.*.variants'   => 'nullable|array',
            'payment_method'     => 'required|in:cod,cash,gcash,bank_transfer',
            'discount_pct'   => 'nullable|numeric|between:0,100',
            'notes'          => 'nullable|string',
            'address'        => 'nullable|string',
        ]);

        $sale = DB::transaction(function () use ($data, $request) {
            $total = 0;
            $itemsData = [];

            foreach ($data['items'] as $item) {
                $product = \App\Models\Product::findOrFail($item['product_id']);
                
                // Use provided price (from cart), or fall back to product price
                $unitPrice = $item['price'] ?? $product->sell_price;
                $subtotal = $item['quantity'] * $unitPrice;
                $total += $subtotal;
                
                $itemsData[] = [
                    'product_id' => $item['product_id'],
                    'product_variant_id' => $item['product_variant_id'] ?? null,
                    'quantity'   => $item['quantity'],
                    'unit_price' => $unitPrice,
                    'subtotal'   => $subtotal,
                    'variants'   => $item['variants'] ?? null,
                ];

                // Deduct stock
                if (!empty($item['product_variant_id'])) {
                    // Deduct from Specific Variant
                    $variant = \App\Models\ProductVariant::find($item['product_variant_id']);
                    if ($variant) {
                        $variant->decrement('stock', $item['quantity']);
                        $product->syncStockWithVariants();
                    }
                } else {
                    // Deduct from Main Inventory (Generic)
                    $inv = Inventory::where('product_id', $item['product_id'])->first();
                    if ($inv) {
                        $inv->decrement('current_stock', $item['quantity']);
                    }
                }
            }

            if (!empty($data['discount_pct'])) {
                $total = $total * (1 - $data['discount_pct'] / 100);
            }

            $sale = Sale::create([
                'order_number'   => 'ORD-' . str_pad(Sale::count() + 1, 4, '0', STR_PAD_LEFT),
                'customer_id'    => $data['customer_id'],
                'processed_by'   => $request->user()->id,
                'discount_pct'   => $data['discount_pct'] ?? null,
                'total_amount'   => round($total, 2),
                'payment_method' => $data['payment_method'],
                'status'         => 'pending',
                'notes'          => $data['notes'] ?? null,
            ]);

            foreach ($itemsData as $item) {
                $sale->items()->create($item);
            }

            // Auto-create delivery if address provided or payment method is cod
            if (!empty($data['address']) || $data['payment_method'] === 'cod') {
                Delivery::create([
                    'sale_id' => $sale->id,
                    'status'  => 'pending',
                    'address' => $data['address'] ?? 'TBD',
                ]);
            }

            return $sale;
        });

        return response()->json([
            'data'    => $sale->load(['customer', 'items.product', 'delivery']),
            'message' => 'Order created successfully',
            'status'  => 'success',
        ], 201);
    }

    public function show($id)
    {
        $sale = Sale::with(['customer', 'processedBy', 'items.product', 'delivery.rider'])->findOrFail($id);
        return response()->json(['data' => $sale, 'status' => 'success']);
    }

    public function processReturn(Request $request, $id)
    {
        $sale = Sale::findOrFail($id);
        $sale->update(['status' => 'returned']);

        // Restore stock
        foreach ($sale->items as $item) {
            if ($item->product_variant_id) {
                $variant = \App\Models\ProductVariant::find($item->product_variant_id);
                if ($variant) {
                    $variant->increment('stock', $item->quantity);
                    $item->product->syncStockWithVariants();
                }
            } else {
                $inv = Inventory::where('product_id', $item->product_id)->first();
                if ($inv) {
                    $inv->increment('current_stock', $item->quantity);
                }
            }
        }

        return response()->json([
            'data'    => $sale->fresh(),
            'message' => 'Order returned successfully',
            'status'  => 'success',
        ]);
    }

    public function summary(Request $request)
    {
        $today = now()->toDateString();

        $totalRevenue = Sale::whereIn('status', ['confirmed', 'out_for_delivery', 'delivered'])
            ->sum('total_amount');

        $ordersToday = Sale::whereDate('created_at', $today)->count();

        $lowStockCount = Inventory::whereRaw('current_stock <= reorder_threshold')->count();

        $activeRiders = \App\Models\User::where('role', 'rider')
            ->where('status', 'active')
            ->whereHas('riderProfile', fn($q) => $q->where('availability', 'on_delivery'))
            ->count();

        $recentOrders = Sale::with(['customer', 'items'])
            ->latest()->limit(10)->get();

        $lowStockProducts = Inventory::with(['product.category'])
            ->whereRaw('current_stock <= reorder_threshold')
            ->limit(5)->get();

        return response()->json([
            'data' => [
                'total_revenue'     => $totalRevenue,
                'orders_today'      => $ordersToday,
                'low_stock_count'   => $lowStockCount,
                'active_riders'     => $activeRiders,
                'recent_orders'     => $recentOrders,
                'low_stock_products' => $lowStockProducts,
            ],
            'status' => 'success',
        ]);
    }
}
