import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useSupplierAuth } from '../../context/SupplierAuthContext';

export default function SupplierDashboard() {
    const { supplier } = useSupplierAuth();
    const [stats, setStats] = useState({ pending: 0, approved: 0, delivered: 0, total: 0, totalRevenue: 0, productCount: 0 });
    const [recentPos, setRecentPos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchDashboardData(); }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [posRes, prodsRes] = await Promise.all([
                axios.get('/supplier/purchase-orders?per_page=5'),
                axios.get('/supplier/products?per_page=1').catch(() => ({ data: { data: { total: 0 } } })),
            ]);
            const pos = posRes.data.data.data || [];
            setRecentPos(pos);

            const allTotal = posRes.data.data.total || 0;
            const revenue = pos.reduce((s, p) => s + Number(p.total_cost || 0), 0);
            setStats({
                pending: pos.filter(p => p.status === 'draft').length,
                approved: pos.filter(p => p.status === 'approved').length,
                delivered: pos.filter(p => p.status === 'supplier_delivered').length,
                total: allTotal,
                totalRevenue: revenue,
                productCount: prodsRes.data.data.total || 0,
            });
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            draft: { bg: '#f1f5f9', color: '#64748b', label: 'Draft' },
            approved: { bg: '#dbeafe', color: '#2563eb', label: 'Approved' },
            supplier_delivered: { bg: '#fff7ed', color: '#ea580c', label: 'Delivered' },
            received: { bg: '#dcfce7', color: '#16a34a', label: 'Received' },
        };
        const b = badges[status] || badges.draft;
        return <span style={{ background: b.bg, color: b.color, padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>{b.label}</span>;
    };

    if (loading) return <div className="loading-page"><div className="spinner" /></div>;

    const statCards = [
        { label: 'Total Revenue', value: `₱${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: '💰', color: '#10b981', bg: '#ecfdf5' },
        { label: 'Total Orders', value: stats.total, icon: '🧾', color: '#3b82f6', bg: '#eff6ff' },
        { label: 'My Products', value: stats.productCount, icon: '📦', color: '#8b5cf6', bg: '#f5f3ff' },
        { label: 'Pending Delivery', value: stats.approved, icon: '🚚', color: '#f59e0b', bg: '#fffbeb' },
    ];

    return (
        <div style={{ padding: '0' }}>
            {/* Welcome Banner */}
            <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                borderRadius: 16, padding: '2rem 2.5rem', marginBottom: '1.5rem',
                color: '#fff', position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>
                        Welcome back,
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                        {supplier?.name || 'Supplier'}
                    </h2>
                    <p style={{ fontSize: '0.9rem', opacity: 0.7, maxWidth: 500 }}>
                        Manage your products, track purchase orders, and grow your business with HRMS Pro.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                        <Link to="/supplier/products" className="btn btn--sm" style={{ background: 'var(--accent)', color: '#fff', borderRadius: 8, padding: '0.5rem 1.25rem' }}>
                            Manage Products
                        </Link>
                        <Link to="/supplier/orders" className="btn btn--sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 8, padding: '0.5rem 1.25rem', border: '1px solid rgba(255,255,255,0.2)' }}>
                            View Orders
                        </Link>
                    </div>
                </div>
                <div style={{ position: 'absolute', right: 30, top: '50%', transform: 'translateY(-50%)', fontSize: '6rem', opacity: 0.1 }}>📊</div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {statCards.map((s, i) => (
                    <div key={i} style={{
                        background: '#fff', borderRadius: 14, padding: '1.25rem 1.5rem',
                        border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem',
                    }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 12, background: s.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0,
                        }}>{s.icon}</div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
                {/* Recent Orders */}
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>Recent Purchase Orders</h3>
                        <Link to="/supplier/orders" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                            View All →
                        </Link>
                    </div>
                    {recentPos.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🧾</div>
                            <p>No purchase orders yet</p>
                        </div>
                    ) : (
                        <div>
                            {recentPos.map((po, i) => (
                                <div key={po.id} style={{
                                    padding: '1rem 1.5rem', display: 'flex', alignItems: 'center',
                                    gap: '1rem', borderBottom: i < recentPos.length - 1 ? '1px solid #f8fafc' : 'none',
                                }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 10,
                                        background: '#f1f5f9', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: '1rem', flexShrink: 0,
                                    }}>🧾</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent)' }}>{po.po_number}</div>
                                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                            {new Date(po.created_at).toLocaleDateString()} • {po.items?.length || 0} items
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                                        ₱{Number(po.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                    {getStatusBadge(po.status)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Quick Actions */}
                    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 1rem 0' }}>Quick Actions</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <Link to="/supplier/products" style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem',
                                borderRadius: 10, background: '#f8fafc', textDecoration: 'none', color: 'inherit',
                                transition: 'all 0.15s', border: '1px solid transparent',
                            }}>
                                <span style={{ fontSize: '1.25rem' }}>➕</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Add New Product</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>List products for admin to purchase</div>
                                </div>
                            </Link>
                            <Link to="/supplier/orders" style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem',
                                borderRadius: 10, background: '#f8fafc', textDecoration: 'none', color: 'inherit',
                            }}>
                                <span style={{ fontSize: '1.25rem' }}>📋</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Check Orders</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Review and manage POs</div>
                                </div>
                            </Link>
                            <Link to="/supplier/settings" style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem',
                                borderRadius: 10, background: '#f8fafc', textDecoration: 'none', color: 'inherit',
                            }}>
                                <span style={{ fontSize: '1.25rem' }}>⚙️</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Account Settings</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Update profile & preferences</div>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* How It Works */}
                    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 1rem 0' }}>How It Works</h3>
                        {[
                            { step: '1', title: 'Approved POs', desc: 'Admin creates POs for your products' },
                            { step: '2', title: 'Deliver Goods', desc: 'Mark PO as delivered when shipped' },
                            { step: '3', title: 'Confirmed', desc: 'Admin receives and updates inventory' },
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: i < 2 ? '0.75rem' : 0, alignItems: 'flex-start' }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)',
                                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.75rem', fontWeight: 800, flexShrink: 0,
                                }}>{item.step}</div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.title}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
