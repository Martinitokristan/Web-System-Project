<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function sales(Request $request)
    {
        $period = $request->get('period', 'month');
        $from = now();
        $to = now();

        if ($period === 'week') {
            $from = now()->subDays(7);
        } elseif ($period === 'year') {
            $from = now()->subYear();
        } else { // month
            $from = now()->subDays(30);
        }

        $sales = Sale::whereBetween(DB::raw('DATE(created_at)'), [$from->toDateString(), $to->toDateString()])
            ->selectRaw('DATE(created_at) as date, SUM(total_amount) as revenue')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $summaryData = Sale::whereBetween(DB::raw('DATE(created_at)'), [$from->toDateString(), $to->toDateString()])
            ->selectRaw('
                COUNT(*) as total_orders,
                SUM(total_amount) as total_revenue,
                SUM(CASE WHEN status = "delivered" THEN 1 ELSE 0 END) as delivered_orders,
                SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending_orders,
                SUM(CASE WHEN status = "returned" THEN 1 ELSE 0 END) as returned_orders
            ')->first();

        $totalRevenue = $summaryData->total_revenue ?? 0;
        $totalOrders = $summaryData->total_orders ?? 0;
        $avgOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

        return response()->json([
            'data' => [
                'chart_data' => $sales,
                'summary' => [
                    'total_revenue'        => round($totalRevenue, 2),
                    'total_orders'         => $totalOrders,
                    'average_order_value'  => round($avgOrderValue, 2),
                    'delivered_orders'     => $summaryData->delivered_orders ?? 0,
                    'pending_orders'       => $summaryData->pending_orders ?? 0,
                    'returned_orders'      => $summaryData->returned_orders ?? 0,
                ]
            ],
            'status' => 'success',
        ]);
    }

    public function inventory(Request $request)
    {
        $items = Inventory::with(['product.category'])
            ->join('products', 'inventory.product_id', '=', 'products.id')
            ->selectRaw('inventory.*, products.name, products.sku')
            ->paginate($request->get('per_page', 20));

        return response()->json(['data' => $items, 'status' => 'success']);
    }

    public function export(Request $request)
    {
        $type = $request->get('type', 'csv');
        $from = $request->get('from', now()->startOfMonth()->toDateString());
        $to   = $request->get('to', now()->toDateString());

        $sales = Sale::with(['customer', 'items.product'])
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
            ->get();

        if ($type === 'csv') {
            $csv = "Order Number,Customer,Total,Status,Date\n";
            foreach ($sales as $sale) {
                $csv .= "\"{$sale->order_number}\",\"{$sale->customer->name}\",{$sale->total_amount},{$sale->status},{$sale->created_at}\n";
            }

            return response($csv, 200, [
                'Content-Type'        => 'text/csv',
                'Content-Disposition' => "attachment; filename=\"sales_report_{$from}_{$to}.csv\"",
            ]);
        }

        // For PDF — return JSON (client can use browser print)
        return response()->json([
            'data'   => $sales,
            'status' => 'success',
        ]);
    }
}
