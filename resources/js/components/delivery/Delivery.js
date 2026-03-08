// Delivery.js — Modernized Admin Dashboard

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import StatCard from '../shared/StatCard';
import FilterBar from '../shared/FilterBar';
import Pagination from '../shared/Pagination';
import ConfirmModal from '../shared/ConfirmModal';
import DeliveryViewModal from './DeliveryViewModal';
import { StatusBadge } from '../shared/Badge';

// Status configuration with icons and colors
const STATUS_CONFIG = {
    pending: { label: 'Pending', color: '#F59E0B', bgColor: '#FEF3C7', icon: '⏳' },
    in_progress: { label: 'In Progress', color: '#3B82F6', bgColor: '#EFF6FF', icon: '🚚' },
    delivered: { label: 'Delivered', color: '#22C55E', bgColor: '#F0FDF4', icon: '✅' },
    failed: { label: 'Failed', color: '#EF4444', bgColor: '#FEF2F2', icon: '❌' }
};

export default function Delivery() {
    const { showToast } = useToast();
    const [deliveries, setDeliveries] = useState([]);
    const [riders, setRiders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Pagination & Modal states
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, delivered: 0, failed: 0, today_delivered: 0 });
    
    const [viewDeliveryId, setViewDeliveryId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    
    const [selectedDeliveries, setSelectedDeliveries] = useState([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showBulkAssign, setShowBulkAssign] = useState(false);
    const [bulkRiderId, setBulkRiderId] = useState('');
    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

    // Fetch data
    useEffect(() => {
        let isMounted = true;
        const debounce = setTimeout(async () => {
            setLoading(true);
            try {
                const [deliveriesRes, ridersRes] = await Promise.all([
                    axios.get('/deliveries', { 
                        params: { search, page, status: statusFilter !== 'all' ? statusFilter : undefined } 
                    }),
                    axios.get('/riders/available')
                ]);

                if (!isMounted) return;

                const data = deliveriesRes.data;
                const dData = data.data?.data || data.data || [];
                setDeliveries(dData);
                setTotal(data.data?.total || dData.length);
                if (data.stats) {
                    setStats(data.stats);
                }
                setRiders(ridersRes.data.data || []);
            } catch (err) {
                if (isMounted) showToast('Failed to fetch delivery data', 'error');
            } finally {
                if (isMounted) setLoading(false);
            }
        }, 300);

        return () => {
            isMounted = false;
            clearTimeout(debounce);
        };
    }, [search, statusFilter, page, refreshTrigger]);

    // Actions
    const handleAssign = async (deliveryId, riderId) => {
        if (!riderId) return;
        try {
            await axios.put(`/deliveries/${deliveryId}/assign`, { rider_id: riderId });
            showToast('✅ Rider assigned successfully');
            triggerRefresh();
        } catch (err) {
            showToast('❌ Assignment failed', 'error');
        }
    };

    const handleStatus = async (deliveryId, status) => {
        try {
            await axios.put(`/deliveries/${deliveryId}/status`, { status });
            const statusLabel = STATUS_CONFIG[status]?.label || status;
            showToast(`✅ Delivery marked as ${statusLabel}`);
            triggerRefresh();
        } catch (err) {
            showToast('❌ Status update failed', 'error');
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await axios.delete(`/deliveries/${deleteId}`);
            showToast('✅ Delivery deleted successfully');
            triggerRefresh();
        } catch (err) {
            showToast(err.response?.data?.message || '❌ Delete failed', 'error');
        } finally {
            setDeleteId(null);
        }
    };

    const handleBulkAssign = async () => {
        if (!bulkRiderId || selectedDeliveries.length === 0) return;
        
        try {
            await Promise.all(
                selectedDeliveries.map(id => 
                    axios.put(`/deliveries/${id}/assign`, { rider_id: bulkRiderId })
                )
            );
            showToast(`✅ Assigned ${selectedDeliveries.length} deliveries to rider`);
            setSelectedDeliveries([]);
            setShowBulkAssign(false);
            setBulkRiderId('');
            triggerRefresh();
        } catch (err) {
            showToast('❌ Bulk assignment failed', 'error');
        }
    };

    const toggleSelection = (id) => {
        setSelectedDeliveries(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAllSelection = () => {
        if (selectedDeliveries.length > 0 && selectedDeliveries.length === deliveries.filter(d => d.status === 'pending').length) {
            setSelectedDeliveries([]);
        } else {
            setSelectedDeliveries(deliveries.filter(d => d.status === 'pending').map(d => d.id));
        }
    };

    const formatTime = (date) => new Date(date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

    return (
        <div className="delivery-dashboard">
            {/* Page Header */}
            <div className="page-header-modern">
                <div className="header-content">
                    <div>
                        <h2 className="page-title">🚚 Delivery Management</h2>
                        <p className="page-subtitle">Track, assign and manage all deliveries in real-time</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn btn-secondary" onClick={triggerRefresh}>🔄 Refresh</button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid-modern">
                <StatCard label="Total Deliveries" value={stats.total} icon="📦" accentColor="accent" />
                <StatCard label="Pending" value={stats.pending} icon="⏳" accentColor="amber" />
                <StatCard label="In Progress" value={stats.in_progress} icon="🚚" accentColor="blue" />
                <StatCard label="Delivered Today" value={stats.today_delivered} icon="✅" accentColor="green" />
                <StatCard label="Failed" value={stats.failed} icon="❌" accentColor="red" />
            </div>

            {/* Bulk Actions Bar */}
            {selectedDeliveries.length > 0 && (
                <div className="bulk-actions-bar">
                    <span className="selection-count">{selectedDeliveries.length} delivery(s) selected</span>
                    <div className="bulk-actions">
                        {!showBulkAssign ? (
                            <button className="btn btn-primary" onClick={() => setShowBulkAssign(true)}>👤 Assign Rider</button>
                        ) : (
                            <div className="bulk-assign-form d-flex gap-2">
                                <select className="form-control" value={bulkRiderId} onChange={(e) => setBulkRiderId(e.target.value)}>
                                    <option value="">Select Rider...</option>
                                    {riders.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                                <button className="btn btn-success btn-sm" onClick={handleBulkAssign} disabled={!bulkRiderId}>Assign</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => { setShowBulkAssign(false); setBulkRiderId(''); }}>Cancel</button>
                            </div>
                        )}
                        <button className="btn btn-ghost" onClick={() => setSelectedDeliveries([])}>Clear Selection</button>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="filters-section">
                <FilterBar
                    search={search}
                    onSearchChange={(v) => { setSearch(v); setPage(1); }}
                    placeholder="Search by tracking #, order #, customer, or address..."
                />
                <div className="status-filters">
                    {[
                        { key: 'all', label: 'All', count: stats.total },
                        { key: 'pending', label: 'Pending', count: stats.pending },
                        { key: 'in_progress', label: 'In Progress', count: stats.in_progress },
                        { key: 'delivered', label: 'Delivered', count: stats.delivered },
                        { key: 'failed', label: 'Failed', count: stats.failed }
                    ].map(({ key, label, count }) => (
                        <button
                            key={key}
                            className={`status-filter-btn ${statusFilter === key ? 'active' : ''}`}
                            onClick={() => { setStatusFilter(key); setPage(1); }}
                        >
                            {label}
                            <span className="count">{count}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Header */}
            <div className="results-header d-flex justify-between align-center mb-2">
                <span className="results-count">Showing {deliveries.length} of {total} deliveries</span>
                {riders.length > 0 && <span className="riders-available">🚴 {riders.length} riders available</span>}
            </div>

            {/* Deliveries Table */}
            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th width="40">
                                <input 
                                    type="checkbox" 
                                    onChange={toggleAllSelection}
                                    checked={deliveries.length > 0 && selectedDeliveries.length === deliveries.filter(d => d.status === 'pending').length}
                                    disabled={deliveries.filter(d => d.status === 'pending').length === 0}
                                />
                            </th>
                            <th>Tracking / Order</th>
                            <th>Customer & Address</th>
                            <th>Rider</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-4"><div className="spinner" /></td></tr>
                        ) : deliveries.length === 0 ? (
                            <tr>
                                <td colSpan="6">
                                    <div className="empty-state-modern py-4 my-2 border-0">
                                        <div className="empty-icon-large">📭</div>
                                        <h3>No deliveries found</h3>
                                        <p>Try adjusting your filters or search criteria</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            deliveries.map(d => {
                                const isSelected = selectedDeliveries.includes(d.id);
                                const canSelect = d.status === 'pending';
                                return (
                                    <tr key={d.id} className={isSelected ? 'bg-primary-light' : ''}>
                                        <td>
                                            {canSelect && (
                                                <input 
                                                    type="checkbox" 
                                                    checked={isSelected}
                                                    onChange={() => toggleSelection(d.id)}
                                                />
                                            )}
                                        </td>
                                        <td>
                                            <div className="font-semi">{d.tracking_number}</div>
                                            <div className="text-sm text-muted">Order #{d.sale?.order_number}</div>
                                        </td>
                                        <td>
                                            <div className="font-semi">👤 {d.sale?.customer?.name || 'Walk-in Customer'}</div>
                                            <div className="text-sm text-truncate" style={{maxWidth: '250px'}} title={d.address}>📍 {d.address}</div>
                                        </td>
                                        <td>
                                            {d.rider ? (
                                                <div className="font-semi text-sm">🚴 {d.rider.name}</div>
                                            ) : (
                                                <span className="text-muted text-sm">Unassigned</span>
                                            )}
                                            {d.status !== 'delivered' && d.status !== 'failed' && (
                                                <select
                                                    value={d.rider_id || ''}
                                                    onChange={(e) => handleAssign(d.id, e.target.value)}
                                                    className="form-control form-control-sm mt-1"
                                                    style={{ width: '130px', fontSize: '0.8rem', padding: '0.1rem 0.5rem' }}
                                                >
                                                    <option value="">{d.rider ? 'Change Rider...' : 'Assign Rider...'}</option>
                                                    {riders.map(r => (
                                                        <option key={r.id} value={r.id}>{r.name} ({r.active_deliveries_count || 0} active)</option>
                                                    ))}
                                                </select>
                                            )}
                                        </td>
                                        <td>
                                            <StatusBadge status={d.status} />
                                            <div className="text-sm text-muted mt-1">{formatTime(d.updated_at)}</div>
                                        </td>
                                        <td>
                                            <div className="d-flex flex-wrap gap-1">
                                                <button className="btn btn-sm btn-ghost me-1 mb-1" onClick={() => setViewDeliveryId(d.id)}>👁️ View</button>
                                                {d.status === 'pending' && d.rider_id && (
                                                    <button className="btn btn-primary btn-sm me-1 mb-1" onClick={() => handleStatus(d.id, 'in_progress')}>🚀 Start</button>
                                                )}
                                                {d.status === 'in_progress' && (
                                                    <>
                                                        <button className="btn btn-success btn-sm me-1 mb-1" onClick={() => handleStatus(d.id, 'delivered')}>✅ Delivered</button>
                                                        <button className="btn btn-danger btn-sm mb-1" onClick={() => { if(confirm('Mark as failed?')) handleStatus(d.id, 'failed'); }}>❌ Failed</button>
                                                    </>
                                                )}
                                                {d.status === 'pending' && (
                                                    <button className="btn btn-danger btn-sm mb-1" onClick={() => setDeleteId(d.id)}>🗑️</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!loading && deliveries.length > 0 && (
                <Pagination page={page} total={total} perPage={15} onChange={setPage} />
            )}

            {/* Modals */}
            <DeliveryViewModal isOpen={!!viewDeliveryId} onClose={() => setViewDeliveryId(null)} deliveryId={viewDeliveryId} />
            
            <ConfirmModal
                isOpen={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={handleDelete}
                message="Are you sure you want to delete this delivery? Only pending deliveries can be deleted."
            />
        </div>
    );
}