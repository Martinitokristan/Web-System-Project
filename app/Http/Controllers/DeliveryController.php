<?php

namespace App\Http\Controllers;

use App\Models\Delivery;
use App\Models\RiderProfile;
use Illuminate\Http\Request;

class DeliveryController extends Controller
{
    public function index(Request $request)
    {
        $query = Delivery::with(['sale.customer', 'sale.items.product', 'rider'])
            ->when($request->status && $request->status !== 'all', fn($q) => $q->where('status', $request->status))
            ->when($request->rider_id === 'me' && $request->user(), fn($q) => $q->where('rider_id', $request->user()->id))
            ->when($request->rider_id && $request->rider_id !== 'me', fn($q) => $q->where('rider_id', $request->rider_id));

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('tracking_number', 'like', "%{$request->search}%")
                  ->orWhere('address', 'like', "%{$request->search}%")
                  ->orWhereHas('sale', function ($sq) use ($request) {
                      $sq->where('order_number', 'like', "%{$request->search}%")
                         ->orWhereHas('customer', function ($cq) use ($request) {
                             $cq->where('name', 'like', "%{$request->search}%");
                         });
                  })
                  ->orWhereHas('rider', function ($rq) use ($request) {
                      $rq->where('name', 'like', "%{$request->search}%");
                  });
            });
        }

        $deliveries = $query->latest()->paginate($request->get('per_page', 15));

        $today = now()->toDateString();
        $stats = [
            'total' => Delivery::count(),
            'pending' => Delivery::where('status', 'pending')->count(),
            'in_progress' => Delivery::where('status', 'in_progress')->count(),
            'delivered' => Delivery::where('status', 'delivered')->count(),
            'failed' => Delivery::where('status', 'failed')->count(),
            'today_delivered' => Delivery::where('status', 'delivered')->whereDate('updated_at', $today)->count(),
        ];

        return response()->json([
            'data'   => $deliveries,
            'stats'  => $stats,
            'status' => 'success',
        ]);
    }

    public function show($id)
    {
        $delivery = Delivery::with(['sale.customer', 'sale.items.product', 'rider'])->findOrFail($id);
        return response()->json(['data' => $delivery, 'status' => 'success']);
    }

    public function destroy($id)
    {
        $delivery = Delivery::findOrFail($id);
        if ($delivery->status !== 'pending') {
            return response()->json(['message' => 'Only pending deliveries can be deleted.', 'status' => 'error'], 422);
        }
        $delivery->delete();
        return response()->json(['status' => 'success']);
    }

    public function assignRider(Request $request, $id)
    {
        $delivery = Delivery::findOrFail($id);
        $request->validate(['rider_id' => 'required|exists:users,id']);

        $delivery->update([
            'rider_id' => $request->rider_id,
            'status'   => 'in_progress',
        ]);

        // Update rider profile availability
        RiderProfile::where('user_id', $request->rider_id)
            ->update(['availability' => 'on_delivery']);

        return response()->json([
            'data'    => $delivery->fresh()->load(['sale', 'rider']),
            'message' => 'Rider assigned successfully',
            'status'  => 'success',
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $delivery = Delivery::findOrFail($id);
        $request->validate(['status' => 'required|in:pending,in_progress,delivered,failed']);

        $updates = ['status' => $request->status];

        if ($request->status === 'in_progress') {
            $updates['pickup_at'] = now();
        }

        if ($request->status === 'delivered') {
            $updates['delivered_at'] = now();
            // Update sale status
            $delivery->sale->update(['status' => 'delivered']);
            // Update rider stats
            if ($delivery->rider_id) {
                $profile = RiderProfile::where('user_id', $delivery->rider_id)->first();
                if ($profile) {
                    $profile->increment('total_deliveries');
                    $profile->on_time_count += 1;
                    $profile->availability = 'available';
                    $profile->save();
                }
            }
        }

        if ($request->status === 'failed') {
            // Free up the rider
            if ($delivery->rider_id) {
                RiderProfile::where('user_id', $delivery->rider_id)
                    ->update(['availability' => 'available']);
            }
        }

        $delivery->update($updates);

        return response()->json([
            'data'    => $delivery->fresh()->load(['sale', 'rider']),
            'message' => 'Delivery status updated',
            'status'  => 'success',
        ]);
    }
}
