<?php

namespace App\Http\Controllers;

use App\Models\Delivery;
use App\Models\RiderProfile;
use App\Models\User;
use Illuminate\Http\Request;

class RiderController extends Controller
{
    public function index(Request $request)
    {
        $query = User::where('role', 'rider')
            ->with('riderProfile')
            ->withCount(['deliveries'])
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->when($request->availability, fn($q) => $q->whereHas('riderProfile',
                fn($rq) => $rq->where('availability', $request->availability)))
            ->latest();

        return response()->json([
            'data'   => $query->paginate($request->get('per_page', 15)),
            'counts' => [
                'total'       => User::where('role', 'rider')->count(),
                'available'   => RiderProfile::where('availability', 'available')->count(),
                'on_delivery' => RiderProfile::where('availability', 'on_delivery')->count(),
                'off_duty'    => RiderProfile::where('availability', 'off_duty')->count(),
            ],
            'status' => 'success',
        ]);
    }

    public function stats($id)
    {
        $user = User::with('riderProfile')->findOrFail($id);
        $profile = $user->riderProfile;

        $completedDeliveries = Delivery::where('rider_id', $id)->where('status', 'delivered')->count();
        $activeOrders = Delivery::where('rider_id', $id)->where('status', 'in_progress')->count();

        return response()->json([
            'data' => [
                'user'                  => $user,
                'profile'               => $profile,
                'completed_deliveries'  => $completedDeliveries,
                'active_orders'         => $activeOrders,
                'on_time_rate'          => $profile ? $profile->on_time_rate : 0,
            ],
            'status' => 'success',
        ]);
    }

    public function myDeliveries(Request $request)
    {
        $deliveries = \App\Models\Delivery::with(['sale.customer', 'sale.items.product'])
            ->where('rider_id', $request->user()->id)
            ->latest()
            ->get();
        return response()->json(['data' => $deliveries, 'status' => 'success']);
    }

    public function toggleStatus(Request $request)
    {
        $profile = \App\Models\RiderProfile::where('user_id', $request->user()->id)->first();
        if ($profile) {
            $profile->availability = $profile->availability === 'off_duty' ? 'available' : 'off_duty';
            $profile->save();
        }
        return response()->json(['status' => 'success']);
    }
    public function availableRiders()
    {
        $riders = User::where('role', 'rider')
            // Remove manual off_duty check as per request ("always online if logged in")
            ->with('riderProfile')
            ->withCount(['deliveries as active_deliveries_count' => function ($q) {
                $q->whereIn('status', ['pending', 'in_progress']);
            }])
            ->get();
            
        return response()->json([
            'data'   => $riders,
            'status' => 'success'
        ]);
    }

    public function dashboard(Request $request)
    {
        $riderId = $request->user()->id;
        $today = now()->startOfDay();

        $stats = [
            'total'     => \App\Models\Delivery::where('rider_id', $riderId)->where('created_at', '>=', $today)->count(),
            'done'      => \App\Models\Delivery::where('rider_id', $riderId)->where('created_at', '>=', $today)->where('status', 'delivered')->count(),
            'active'    => \App\Models\Delivery::where('rider_id', $riderId)->whereIn('status', ['pending', 'in_progress'])->count(),
            'failed'    => \App\Models\Delivery::where('rider_id', $riderId)->where('created_at', '>=', $today)->where('status', 'failed')->count(),
            'quota'     => 10000,
            'collected' => \App\Models\Delivery::where('rider_id', $riderId)->where('created_at', '>=', $today)->where('status', 'delivered')->with('sale')->get()->sum(fn($d) => optional($d->sale)->payment_method === 'cod' ? $d->sale->total_amount : 0),
        ];

        $deliveries = \App\Models\Delivery::with(['sale.customer.customerProfile', 'sale.items.product'])
            ->where('rider_id', $riderId)
            ->latest()
            ->get();

        $nearby = \App\Models\Delivery::with(['sale.customer.customerProfile', 'sale.items.product'])
            ->whereNull('rider_id')
            ->where('status', 'pending')
            ->latest()
            ->get()
            ->map(function($d) {
                // Use real coordinates from customer profile, or fallback to mock
                $profile = $d->sale->customer->customerProfile;
                
                $d->latitude = $profile->latitude ?? (7.07 + (rand(-10, 10) / 1000));
                $d->longitude = $profile->longitude ?? (125.60 + (rand(-10, 10) / 1000));
                $d->distance = round(rand(5, 45) / 10, 1) . ' km';
                
                return $d;
            });

        return response()->json([
            'data' => [
                'stats'     => $stats,
                'nearby'    => $nearby,
                'my_jobs'   => $deliveries->whereIn('status', ['pending', 'in_progress'])->values(),
                'completed' => $deliveries->whereIn('status', ['delivered', 'failed'])->take(20)->values(),
            ],
            'status' => 'success'
        ]);
    }
}
