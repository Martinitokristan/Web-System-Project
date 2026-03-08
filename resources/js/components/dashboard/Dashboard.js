import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import StatCard from '../shared/StatCard';
import { StatusBadge } from '../shared/Badge';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/sales/summary').then(res => {
            setStats(res.data.data);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="loading-page"><div className="spinner" /></div>;

    const formatCurr = (val) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2 className="page-title">Overview</h2>
                    <p className="text-muted mt-1">Here's what's happening in your store today.</p>
                </div>
                <div className="d-flex gap-2">
                    <Link to="/inventory/sales" className="btn btn--ghost">View All Orders</Link>
                    <Link to="/products" className="btn btn--primary">Manage Products</Link>
                </div>
            </div>

            <div className="grid-4 mb-3">
                <StatCard 
                    label="Today's Revenue" 
                    value={formatCurr(stats.total_revenue || 0)} 
                    trend="12.5%" trendUp={true} 
                    icon="💰" accentColor="green" 
                />
                <StatCard 
                    label="Orders Today" 
                    value={stats.orders_today} 
                    trend="4.2%" trendUp={true} 
                    icon="🏷️" accentColor="blue" 
                />
                <StatCard 
                    label="Low Stock Items" 
                    value={stats.low_stock_count} 
                    trend="Action needed" trendUp={false} 
                    icon="⚠️" accentColor="amber" 
                />
                <StatCard 
                    label="Active Riders" 
                    value={stats.active_riders} 
                    trend="On delivery" trendUp={true} 
                    icon="🛵" accentColor="accent" 
                />
            </div>

            <div className="grid-2">
                <div className="table-wrap">
                    <div className="p-4 border-bottom d-flex justify-between align-center">
                        <h3 className="section-title mb-0">Recent Orders</h3>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Total</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recent_orders?.map(order => (
                                <tr key={order.id}>
                                    <td className="font-semi text-accent">{order.order_number}</td>
                                    <td>
                                        <div className="font-semi">{order.customer?.name}</div>
                                        <div className="text-muted text-sm">{order.items?.length || 0} items</div>
                                    </td>
                                    <td className="td-amount">{formatCurr(order.total_amount)}</td>
                                    <td><StatusBadge status={order.status} /></td>
                                </tr>
                            ))}
                            {stats.recent_orders?.length === 0 && (
                                <tr><td colSpan="4" className="text-center text-muted py-4">No recent orders</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="alert-card">
                    <div className="alert-card__header">
                        <h4>Low Stock Alerts</h4>
                        <Link to="/inventory" className="btn btn--sm btn--ghost">View Inventory</Link>
                    </div>
                    <div className="alert-list">
                        {stats.low_stock_products?.map(inv => (
                            <div className="alert-item" key={inv.product_id}>
                                <div>
                                    <div className="name">{inv.product?.name}</div>
                                    <div className="text-sm text-muted">SKU: {inv.product?.sku}</div>
                                </div>
                                <div className="text-right">
                                    <div className="stock">{inv.current_stock} left</div>
                                    <div className="text-sm text-muted">Min: {inv.reorder_threshold}</div>
                                </div>
                            </div>
                        ))}
                        {stats.low_stock_products?.length === 0 && (
                            <div className="text-muted text-sm py-2">All stock levels are optimal.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
