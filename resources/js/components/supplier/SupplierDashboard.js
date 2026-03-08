// SupplierDashboard.js - Supplier Portal Dashboard
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useSupplierAuth } from '../../context/SupplierAuthContext';
import { useToast } from '../../context/ToastContext';

export default function SupplierDashboard() {
    const { supplier, logout } = useSupplierAuth();
    const { showToast } = useToast();
    const [stats, setStats] = useState({
        pending: 0,
        approved: 0,
        delivered: 0,
        total: 0
    });
    const [recentPos, setRecentPos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/supplier/purchase-orders?per_page=5');
            const pos = res.data.data.data || [];
            setRecentPos(pos);

            // Calculate stats
            const stats = {
                pending: pos.filter(p => p.status === 'draft').length,
                approved: pos.filter(p => p.status === 'approved').length,
                delivered: pos.filter(p => p.status === 'supplier_delivered').length,
                total: res.data.data.total || 0
            };
            setStats(stats);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            draft: { class: 'badge--gray', label: 'Draft' },
            approved: { class: 'badge--blue', label: 'Approved' },
            supplier_delivered: { class: 'badge--orange', label: 'Delivered' },
            received: { class: 'badge--green', label: 'Received' }
        };
        const badge = badges[status] || badges.draft;
        return <span className={`badge ${badge.class}`}>{badge.label}</span>;
    };

    return (
        <div className="supplier-dashboard">
            {/* Header */}
            <header className="supplier-header">
                <div className="header-content">
                    <h1>Supplier Portal</h1>
                    <div className="header-actions">
                        <span className="supplier-name">{supplier?.name}</span>
                        <button className="btn btn--sm btn--ghost" onClick={logout}>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{stats.approved}</div>
                    <div className="stat-label">Pending Delivery</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.delivered}</div>
                    <div className="stat-label">Awaiting Receipt</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total Orders</div>
                </div>
            </div>

            {/* Recent POs */}
            <div className="dashboard-section">
                <div className="section-header">
                    <h2>Recent Purchase Orders</h2>
                    <Link to="/supplier/orders" className="btn btn--sm btn--primary">
                        View All Orders
                    </Link>
                </div>

                {loading ? (
                    <div className="loading-spinner">Loading...</div>
                ) : recentPos.length === 0 ? (
                    <div className="empty-state">
                        <p>No purchase orders yet.</p>
                    </div>
                ) : (
                    <div className="po-list">
                        {recentPos.map(po => (
                            <div key={po.id} className="po-card">
                                <div className="po-header">
                                    <div className="po-number">{po.po_number}</div>
                                    {getStatusBadge(po.status)}
                                </div>
                                <div className="po-details">
                                    <div className="po-info">
                                        <span className="label">Date:</span>
                                        <span>{new Date(po.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="po-info">
                                        <span className="label">Items:</span>
                                        <span>{po.items?.length || 0} products</span>
                                    </div>
                                    <div className="po-info">
                                        <span className="label">Total:</span>
                                        <span className="amount">₱{Number(po.total_cost).toFixed(2)}</span>
                                    </div>
                                </div>
                                {po.status === 'approved' && (
                                    <Link to={`/supplier/orders/${po.id}`} className="btn btn--sm btn--primary">
                                        Mark as Delivered
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="info-section">
                <h3>How It Works</h3>
                <ol>
                    <li><strong>Approved POs</strong> - Review and prepare orders marked as "Approved"</li>
                    <li><strong>Mark Delivered</strong> - When you deliver the goods, mark the PO as "Delivered"</li>
                    <li><strong>Admin Receipt</strong> - Admin will verify and mark as "Received" to update stock</li>
                </ol>
            </div>
        </div>
    );
}
