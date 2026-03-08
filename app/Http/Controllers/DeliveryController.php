<?php

namespace App\Http\Controllers;

use App\Models\Delivery;
use App\Models\RiderProfile;
use Illuminate\Http\Request;

class DeliveryController extends Controller
{
    public function index(Request $request)
    {
        $deliveries = Delivery::with(['sale.customer', 'sale.items.product', 'rider'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->rider_id === 'me' && $request->user(), fn($q) => $q->where('rider_id', $request->user()->id))
            ->when($request->rider_id && $request->rider_id !== 'me', fn($q) => $q->where('rider_id', $request->rider_id))
            ->latest()
            ->get();

        return response()->json([
            'data'   => $deliveries,
            'status' => 'success',
        ]);
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
