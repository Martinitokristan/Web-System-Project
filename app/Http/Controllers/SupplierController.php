<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index()
    {
        return response()->json([
            'data'   => Supplier::all(),
            'status' => 'success',
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'         => 'required|string|max:100',
            'contact_name' => 'nullable|string|max:100',
            'email'        => 'nullable|email|max:150',
            'phone'        => 'nullable|string|max:20',
            'address'      => 'nullable|string',
        ]);

        $supplier = Supplier::create($data);

        return response()->json(['data' => $supplier, 'status' => 'success'], 201);
    }

    public function show($id)
    {
        $supplier = Supplier::with(['products', 'purchaseOrders'])->findOrFail($id);
        return response()->json(['data' => $supplier, 'status' => 'success']);
    }

    public function update(Request $request, $id)
    {
        $supplier = Supplier::findOrFail($id);
        $data = $request->validate([
            'name'         => 'required|string|max:100',
            'contact_name' => 'nullable|string|max:100',
            'email'        => 'nullable|email|max:150',
            'phone'        => 'nullable|string|max:20',
            'address'      => 'nullable|string',
        ]);

        $supplier->update($data);

        return response()->json(['data' => $supplier, 'status' => 'success']);
    }

    public function destroy($id)
    {
        $supplier = Supplier::findOrFail($id);
        
        // Prevent deletion if supplier has products or POs
        if ($supplier->products()->count() > 0 || $supplier->purchaseOrders()->count() > 0) {
            return response()->json(['message' => 'Cannot delete supplier with active products or purchase orders', 'status' => 'error'], 422);
        }

        $supplier->delete();
        return response()->json(['status' => 'success']);
    }
}
