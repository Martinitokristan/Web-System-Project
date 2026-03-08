<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $currentMonth = now()->startOfMonth();

        $query = User::where('role', 'customer')
            ->withCount(['sales'])
            ->withSum('sales', 'total_amount')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%")
                ->orWhere('email', 'like', "%{$request->search}%"))
            ->latest();

        return response()->json([
            'data'   => $query->paginate($request->get('per_page', 15)),
            'counts' => [
                'total'         => User::where('role', 'customer')->count(),
                'active_month'  => User::where('role', 'customer')
                    ->whereHas('sales', fn($q) => $q->where('created_at', '>=', $currentMonth))
                    ->count(),
                'suspended'     => User::where('role', 'customer')->where('status', 'suspended')->count(),
            ],
            'status' => 'success',
        ]);
    }

    public function myOrders(Request $request)
    {
        $orders = \App\Models\Sale::with(['items.product', 'delivery.rider'])
            ->where('customer_id', $request->user()->id)
            ->latest()
            ->get();
        return response()->json(['data' => $orders, 'status' => 'success']);
    }
}
