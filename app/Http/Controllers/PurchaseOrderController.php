<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use App\Models\POItem;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseOrder::with(['supplier', 'creator', 'items.product'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->search, fn($q) => $q->where('po_number', 'like', "%{$request->search}%"))
            ->latest();

        return response()->json([
            'data'   => $query->paginate($request->get('per_page', 15)),
            'status' => 'success',
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'supplier_id'    => 'required|exists:suppliers,id',
            'items'          => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|numeric|min:1',
            'items.*.unit_cost'  => 'required|numeric|min:0',
            'expected_date'  => 'nullable|date',
        ]);

        $po = DB::transaction(function () use ($data, $request) {
            $total = 0;
            $po = PurchaseOrder::create([
                'po_number'     => 'PO-' . str_pad(PurchaseOrder::count() + 1, 4, '0', STR_PAD_LEFT),
                'supplier_id'   => $data['supplier_id'],
                'created_by'    => $request->user()->id,
                'is_auto'       => false,
                'status'        => 'draft',
                'expected_date' => $data['expected_date'] ?? null,
                'total_cost'    => 0,
            ]);

            foreach ($data['items'] as $item) {
                $subtotal = $item['quantity'] * $item['unit_cost'];
                $total += $subtotal;
                POItem::create([
                    'purchase_order_id' => $po->id,
                    'product_id'        => $item['product_id'],
                    'quantity'          => $item['quantity'],
                    'unit_cost'         => $item['unit_cost'],
                    'subtotal'          => $subtotal,
                ]);
            }

            $po->update(['total_cost' => $total]);
            return $po;
        });

        return response()->json([
            'data'    => $po->load(['supplier', 'items.product']),
            'message' => 'Purchase order created',
            'status'  => 'success',
        ], 201);
    }

    public function show($id)
    {
        $po = PurchaseOrder::with(['supplier', 'creator', 'items.product'])->findOrFail($id);
        return response()->json(['data' => $po, 'status' => 'success']);
    }

    public function approve($id)
    {
        $po = PurchaseOrder::findOrFail($id);
        $po->update(['status' => 'submitted']);

        return response()->json([
            'data'    => $po,
            'message' => 'Purchase order approved',
            'status'  => 'success',
        ]);
    }

    public function markReceived($id)
    {
        $po = PurchaseOrder::with('items')->findOrFail($id);

        DB::transaction(function () use ($po) {
            // Add stock for each item
            foreach ($po->items as $item) {
                $inv = Inventory::where('product_id', $item->product_id)->first();
                if ($inv) {
                    $inv->increment('current_stock', $item->quantity);
                    $inv->last_adjusted_at = now();
                    $inv->updated_at = now();
                    $inv->save();
                }
            }
            $po->update(['status' => 'received']);
        });

        return response()->json([
            'data'    => $po->fresh()->load(['supplier', 'items.product']),
            'message' => 'Purchase order marked as received. Stock updated.',
            'status'  => 'success',
        ]);
    }
}
