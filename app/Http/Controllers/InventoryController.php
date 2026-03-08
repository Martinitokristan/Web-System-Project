<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\InventoryAdjustment;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\POItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        // We query Products because we want to show variants if they exist
        $query = Product::with(['category', 'unitType', 'supplier', 'inventory', 'productVariants.sizeValue', 'productVariants.colorValue', 'productVariants.weightValue'])
            ->when($request->search, function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('sku', 'like', "%{$request->search}%");
            });

        if ($request->filter === 'low') {
            $query->where(function ($q) {
                $q->whereHas('inventory', function ($iq) {
                    $iq->whereRaw('current_stock <= reorder_threshold');
                })->orWhereHas('productVariants', function ($vq) {
                    $vq->where('stock', '<=', 10);
                });
            });
        }

        $perPage = $request->get('per_page', 15);
        $products = $query->paginate($perPage);

        $flattened = [];
        foreach ($products as $p) {
            if ($p->productVariants->count() > 0) {
                foreach ($p->productVariants as $v) {
                    $flattened[] = [
                        'id' => "v-{$v->id}", // Virtual ID for key
                        'product_id' => $p->id,
                        'variant_id' => $v->id,
                        'sku' => $p->sku . ($v->sku_suffix ? "-{$v->sku_suffix}" : ""),
                        'name' => $p->name,
                        'supplier' => $p->supplier ? $p->supplier->name : '-',
                        'category' => $p->category ? $p->category->name : '-',
                        'unit' => $p->unitType ? $p->unitType->abbreviation : '-',
                        'current_stock' => $v->stock,
                        'reorder_threshold' => ($p->inventory && $p->inventory->reorder_threshold) ? $p->inventory->reorder_threshold : 10,
                        'size' => ($v->sizeValue && $v->sizeValue->label) ? $v->sizeValue->label : '-',
                        'color' => ($v->colorValue && $v->colorValue->label) ? $v->colorValue->label : '-',
                        'weight' => ($v->weightValue && $v->weightValue->label) ? $v->weightValue->label : '-',
                        'is_variant' => true
                    ];
                }
            } else {
                $flattened[] = [
                    'id' => "p-{$p->id}",
                    'product_id' => $p->id,
                    'variant_id' => null,
                    'sku' => $p->sku,
                    'name' => $p->name,
                    'supplier' => $p->supplier ? $p->supplier->name : '-',
                    'category' => $p->category ? $p->category->name : '-',
                    'unit' => $p->unitType ? $p->unitType->abbreviation : '-',
                    'current_stock' => $p->inventory ? $p->inventory->current_stock : 0,
                    'reorder_threshold' => $p->inventory ? $p->inventory->reorder_threshold : 10,
                    'size' => '-',
                    'color' => '-',
                    'weight' => '-',
                    'is_variant' => false
                ];
            }
        }

        $responseData = $products->toArray();
        $responseData['data'] = $flattened;

        return response()->json([
            'data'     => $responseData,
            'low_stock_count' => Inventory::whereRaw('current_stock <= reorder_threshold')->count(),
            'status'   => 'success',
        ]);
    }

    public function adjust(Request $request)
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'type'       => 'required|in:add,subtract,set',
            'quantity'   => 'required|numeric|min:0',
            'reason'     => 'nullable|string',
        ]);

        $product = Product::findOrFail($data['product_id']);
        
        DB::transaction(function () use ($product, $data, $request) {
            if ($data['variant_id']) {
                $variant = \App\Models\ProductVariant::findOrFail($data['variant_id']);
                if ($data['type'] === 'add') {
                    $variant->increment('stock', $data['quantity']);
                } elseif ($data['type'] === 'subtract') {
                    $variant->decrement('stock', $data['quantity']);
                } else {
                    $variant->update(['stock' => $data['quantity']]);
                }
                $product->syncStockWithVariants();
            } else {
                $inventory = Inventory::where('product_id', $product->id)->firstOrFail();
                if ($data['type'] === 'add') {
                    $inventory->increment('current_stock', $data['quantity']);
                } elseif ($data['type'] === 'subtract') {
                    $inventory->decrement('current_stock', $data['quantity']);
                } else {
                    $inventory->update(['current_stock' => $data['quantity']]);
                }
                $inventory->last_adjusted_at = now();
                $inventory->save();
            }

            InventoryAdjustment::create([
                'product_id' => $product->id,
                'user_id'    => $request->user()->id,
                'type'       => $data['type'],
                'quantity'   => $data['quantity'],
                'note'       => $data['reason'] ?? null,
                'created_at' => now(),
            ]);
        });

        return response()->json([
            'message' => 'Stock adjusted successfully',
            'status'  => 'success',
        ]);
    }

    public function reorder(Request $request, $id)
    {
        $product = Product::with(['supplier'])->findOrFail($id);
        $inventory = Inventory::where('product_id', $id)->firstOrFail();

        if (!$product->supplier_id) {
            return response()->json([
                'message' => 'Product has no supplier assigned.',
                'status'  => 'error',
            ], 422);
        }

        $reorderQty = $inventory->reorder_threshold * 2;
        $po = DB::transaction(function () use ($product, $reorderQty, $request) {
            $po = PurchaseOrder::create([
                'po_number'     => 'PO-' . str_pad(PurchaseOrder::count() + 1, 4, '0', STR_PAD_LEFT),
                'supplier_id'   => $product->supplier_id,
                'created_by'    => $request->user()->id,
                'is_auto'       => true,
                'status'        => 'draft',
                'total_cost'    => $reorderQty * $product->purchase_price,
            ]);

            POItem::create([
                'purchase_order_id' => $po->id,
                'product_id'        => $product->id,
                'quantity'          => $reorderQty,
                'unit_cost'         => $product->purchase_price,
                'subtotal'          => $reorderQty * $product->purchase_price,
            ]);

            return $po;
        });

        return response()->json([
            'data'    => $po->load(['supplier', 'items.product']),
            'message' => 'Reorder PO created successfully',
            'status'  => 'success',
        ], 201);
    }
}
