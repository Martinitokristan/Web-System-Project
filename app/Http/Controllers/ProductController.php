<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\InventoryAdjustment;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\POItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'unitType', 'supplier', 'inventory', 'productVariants.sizeValue', 'productVariants.colorValue', 'productVariants.weightValue'])
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('sku', 'like', "%{$request->search}%"))
            ->when($request->category_id, fn($q) => $q->where('category_id', $request->category_id))
            ->when($request->status !== null, fn($q) => $q->where('is_active', $request->status === 'active'));

        $perPage = $request->get('per_page', 15);
        $products = $query->paginate($perPage);

        return response()->json([
            'data'   => $products,
            'status' => 'success',
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'sku'            => 'required|string|max:50|unique:products,sku',
            'name'           => 'required|string|max:150',
            'category_id'    => 'required|exists:categories,id',
            'unit_type_id'   => 'required|exists:unit_types,id',
            'supplier_id'    => 'nullable|exists:suppliers,id',
            'purchase_price' => 'required|numeric|min:0',
            'sell_price'     => 'required|numeric|min:0',
            'image'          => 'nullable|image|max:2048',
            'initial_stock'  => 'nullable|numeric|min:0',
            'reorder_threshold' => 'nullable|numeric|min:0',
            'description'    => 'nullable|string',
            'variants'       => 'nullable|string', // JSON string for variants
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $data['image_path'] = $path;
        }

        $product = DB::transaction(function () use ($data, $request) {
            $product = Product::create($data);
            
            Inventory::create([
                'product_id'        => $product->id,
                'current_stock'     => $data['initial_stock'] ?? 0,
                'reorder_threshold' => $data['reorder_threshold'] ?? 10,
            ]);

            if ($request->has('variants')) {
                $variants = json_decode($request->variants, true);
                if (is_array($variants)) {
                    foreach ($variants as $v) {
                        $priceOverride = isset($v['price_override']) && $v['price_override'] !== '' ? $v['price_override'] : null;
                    $product->productVariants()->create([
                            'size_value_id'   => $v['size_value_id'] ?? null,
                            'color_value_id'  => $v['color_value_id'] ?? null,
                            'weight_value_id' => $v['weight_value_id'] ?? null,
                            'stock'           => $v['stock'] ?? 0,
                            'price_override'  => $priceOverride,
                            'sku_suffix'      => $v['sku_suffix'] !== '' ? ($v['sku_suffix'] ?? null) : null,
                        ]);
                    }
                }
                $product->syncStockWithVariants();
            }

            return $product;
        });

        return response()->json([
            'data'    => $product->load(['category', 'unitType', 'supplier', 'inventory']),
            'message' => 'Product created successfully',
            'status'  => 'success',
        ], 201);
    }

    public function show($id)
    {
        $product = Product::with(['category', 'unitType', 'supplier', 'inventory', 'productVariants.sizeValue', 'productVariants.colorValue', 'productVariants.weightValue'])->findOrFail($id);
        return response()->json(['data' => $product, 'status' => 'success']);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $data = $request->validate([
            'sku'            => "required|string|max:50|unique:products,sku,{$id}",
            'name'           => 'required|string|max:150',
            'category_id'    => 'required|exists:categories,id',
            'unit_type_id'   => 'required|exists:unit_types,id',
            'supplier_id'    => 'nullable|exists:suppliers,id',
            'purchase_price' => 'required|numeric|min:0',
            'sell_price'     => 'required|numeric|min:0',
            'image'          => 'nullable|image|max:2048',
            'is_active'      => 'nullable',
            'description'    => 'nullable|string',
            'variants'       => 'nullable|string',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $data['image_path'] = $path;
        }

        $product->update($data);

        if ($request->has('reorder_threshold')) {
            $product->inventory()->update(['reorder_threshold' => $request->reorder_threshold]);
        }

        if ($request->has('variants')) {
            $product->productVariants()->delete();
            $variants = json_decode($request->variants, true);
            if (is_array($variants)) {
                foreach ($variants as $v) {
                    $priceOverride = isset($v['price_override']) && $v['price_override'] !== '' ? $v['price_override'] : null;
                    $product->productVariants()->create([
                        'size_value_id'   => $v['size_value_id'] ?? null,
                        'color_value_id'  => $v['color_value_id'] ?? null,
                        'weight_value_id' => $v['weight_value_id'] ?? null,
                        'stock'           => $v['stock'] ?? 0,
                        'price_override'  => $priceOverride,
                        'sku_suffix'      => $v['sku_suffix'] !== '' ? ($v['sku_suffix'] ?? null) : null,
                    ]);
                }
                $product->syncStockWithVariants();
            }
        }

        return response()->json([
            'data'    => $product->load(['category', 'unitType', 'supplier', 'inventory', 'productVariants.sizeValue', 'productVariants.colorValue', 'productVariants.weightValue']),
            'message' => 'Product updated successfully',
            'status'  => 'success',
        ]);
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return response()->json(['message' => 'Product deleted', 'status' => 'success']);
    }
}
