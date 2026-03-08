import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../shared/Badge';

export default function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/customer/orders')
            .then(res => setOrders(res.data.data))
            .finally(() => setLoading(false));
    }, []);

    const getTrackerSteps = (status) => {
        const steps = ['pending', 'confirmed', 'out_for_delivery', 'delivered'];
        let currentIndex = steps.indexOf(status);
        if (status === 'returned') return steps.map(() => 'failed');
        if (currentIndex === -1) currentIndex = 0;

        return steps.map((s, i) => i <= currentIndex ? 'active' : 'pending');
    };

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '2rem 5%' }}>
            <div className="page-header mb-4">
                <div>
                    <h2 className="page-title text-2xl">My Order History</h2>
                    <p className="text-muted">Track your past and active orders.</p>
                </div>
                <Link to="/shop" className="btn btn--ghost">Back to Shop</Link>
            </div>

            {loading ? <div className="spinner my-5" /> : orders.length === 0 ? (
                <div className="text-center text-muted py-5 bg-surface border rounded" style={{borderRadius: 12}}>
                    <div className="text-4xl mb-3">📦</div>
                    You haven't placed any orders yet.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {orders.map(order => (
                        <div key={order.id} className="bg-surface border rounded p-4" style={{borderRadius: 12}}>
                            <div className="d-flex justify-between align-center mb-3 pb-3 border-bottom flex-wrap gap-2">
                                <div>
                                    <h3 className="font-bold text-accent mb-1">Order #{order.order_number}</h3>
                                    <div className="text-sm text-muted">Placed on {new Date(order.created_at).toLocaleDateString()}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-lg mb-1">₱{Number(order.total_amount).toFixed(2)}</div>
                                    <StatusBadge status={order.status} />
                                </div>
                            </div>

                            {/* Status Tracker */}
                            {order.status !== 'returned' && (
                                <div className="d-flex justify-between align-center my-4 py-2 relative" style={{ maxWidth: 600, margin: '0 auto' }}>
                                    <div style={{position:'absolute', top:'50%', left:0, right:0, height:2, background:'var(--border)', zIndex:0}} />
                                    {getTrackerSteps(order.status).map((state, idx) => (
                                        <div key={idx} style={{
                                            position:'relative', zIndex:1, width:20, height:20, borderRadius:'50%',
                                            background: state === 'active' ? 'var(--green)' : 'var(--surface)',
                                            border: `2px solid ${state === 'active' ? 'var(--green)' : 'var(--border)'}`,
                                            transition: 'var(--transition)'
                                        }} />
                                    ))}
                                </div>
                            )}

                            {order.delivery && order.delivery.status === 'out_for_delivery' && (
                                <div className="bg-amber-light p-3 text-amber-dark text-sm rounded mb-3 flex align-center gap-2">
                                    <span>🛵</span> Your rider <b>{order.delivery.rider?.name}</b> is on the way! ETA: ~30 mins.
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-bold text-muted mb-2 text-uppercase">Items</h4>
                                {order.items?.map(i => (
                                    <div key={i.id} className="item-row py-1">
                                        <div className="d-flex justify-between text-sm">
                                            <div>
                                                {i.quantity}x {i.product?.name}
                                                {i.variants && Object.keys(i.variants).length > 0 && (
                                                    <div className="text-xs text-muted" style={{marginLeft: '1.5rem'}}>
                                                        [{Object.entries(i.variants)
                                                            .filter(([k, v]) => v && v.label)
                                                            .map(([k, v]) => v.label)
                                                            .join(', ')}]
                                                    </div>
                                                )}
                                            </div>
                                            <div>₱{Number(i.subtotal).toFixed(2)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
