// Suppliers.js — Modernized Supplier Management

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import FilterBar from '../shared/FilterBar';
import Pagination from '../shared/Pagination';
import StatCard from '../shared/StatCard';
import Modal from '../shared/Modal';
import ConfirmModal from '../shared/ConfirmModal';
import SupplierForm from './SupplierForm';
import SupplierViewModal from './SupplierViewModal';

// Status badge component
const SupplierStatusBadge = ({ status }) => {
    const config = {
        active: { color: '#22C55E', bg: '#F0FDF4', label: 'Active', icon: '✓' },
        inactive: { color: '#6B7280', bg: '#F3F4F6', label: 'Inactive', icon: '○' },
        preferred: { color: '#3B82F6', bg: '#EFF6FF', label: 'Preferred', icon: '★' },
        blacklisted: { color: '#EF4444', bg: '#FEF2F2', label: 'Blacklisted', icon: '⚠' }
    };
    const c = config[status] || config.inactive;
    return (
        <span className="status-badge" style={{ background: c.bg, color: c.color }}>
            {c.icon} {c.label}
        </span>
    );
};

// Removed SupplierCard component since we are using Table view instead

export default function Suppliers() {
    const { showToast } = useToast();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [viewSupplierId, setViewSupplierId] = useState(null);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/suppliers', { params: { search, page, status: statusFilter !== 'all' ? statusFilter : undefined } });
            setSuppliers(res.data.data?.data || res.data.data || []);
            setTotal(res.data.data?.total || res.data.data?.length || 0);
        } catch (error) {
            showToast('Error fetching suppliers', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const debounce = setTimeout(() => {
            if (isMounted) fetchSuppliers();
        }, 400);
        return () => {
            clearTimeout(debounce);
            isMounted = false;
        };
    }, [search, page, statusFilter, refreshTrigger]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await axios.delete(`/suppliers/${deleteId}`);
            if (res.data.status === 'success') {
                showToast('Supplier deleted successfully');
                triggerRefresh();
            } else {
                showToast(res.data.message || 'Error deleting supplier', 'error');
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Error deleting supplier';
            showToast(msg, 'error');
        } finally {
            setDeleteId(null);
        }
    };

    const handleEdit = (supplier) => {
        setSelectedSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedSupplier(null);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedSupplier(null);
    };

    const handleSaveSuccess = () => {
        triggerRefresh();
        setIsModalOpen(false);
        setSelectedSupplier(null);
    };

    // Stats calculation
    const stats = useMemo(() => ({
        total: total,
        active: suppliers.filter(s => (s.status || 'active') === 'active').length,
        preferred: suppliers.filter(s => s.status === 'preferred').length,
        withProducts: suppliers.filter(s => (s.products_count || 0) > 0).length
    }), [suppliers, total]);

    return (
        <div className="suppliers-dashboard">
            {/* Page Header */}
            <div className="page-header-modern">
                <div className="header-content">
                    <div>
                        <h2 className="page-title">🏢 Supplier Management</h2>
                        <p className="page-subtitle">Manage your vendor partnerships and track supplier performance</p>
                    </div>
                    <button className="btn btn-primary btn-lg" onClick={handleAdd}>
                        <span>+</span> Add New Supplier
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid-modern">
                <StatCard 
                    label="Total Suppliers" 
                    value={stats.total} 
                    icon="🏢" 
                    accentColor="accent" 
                />
                <StatCard 
                    label="Active Partners" 
                    value={stats.active} 
                    icon="✓" 
                    accentColor="green" 
                />
                <StatCard 
                    label="Preferred Suppliers" 
                    value={stats.preferred} 
                    icon="★" 
                    accentColor="blue" 
                />
                <StatCard 
                    label="With Products" 
                    value={stats.withProducts} 
                    icon="📦" 
                    accentColor="purple" 
                />
            </div>

            {/* Filters & Controls */}
            <div className="controls-section">
                <div className="filters-row">
                    <FilterBar 
                        search={search} 
                        onSearchChange={(v) => { setSearch(v); setPage(1); }}
                        placeholder="Search suppliers by name, contact, email..."
                    />
                    <div className="status-filters">
                        {[
                            { key: 'all', label: 'All', count: stats.total },
                            { key: 'active', label: 'Active', count: stats.active },
                            { key: 'preferred', label: 'Preferred', count: stats.preferred },
                            { key: 'inactive', label: 'Inactive', count: stats.total - stats.active - stats.preferred }
                        ].map(({ key, label, count }) => (
                            <button
                                key={key}
                                className={`status-pill ${statusFilter === key ? 'active' : ''}`}
                                onClick={() => { setStatusFilter(key); setPage(1); }}
                            >
                                {label}
                                <span className="count">{count}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results Count */}
            <div className="results-bar">
                <span className="results-text">
                    Showing {suppliers.length} of {total} suppliers
                </span>
                {loading && <span className="loading-text">Loading...</span>}
            </div>

            {/* Suppliers Table */}
            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Supplier</th>
                            <th>Contact Person</th>
                            <th>Contact Info</th>
                            <th>Performance</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-4"><div className="spinner"/></td></tr>
                        ) : suppliers.length === 0 ? (
                            <tr>
                                <td colSpan="6">
                                    <div className="empty-state-modern py-4 my-2 border-0">
                                        <div className="empty-icon-large">🏢</div>
                                        <h3>No suppliers found</h3>
                                        <p>{search || statusFilter !== 'all' ? 'Try adjusting your filters or search terms' : 'Add your first supplier to get started with vendor management'}</p>
                                        <button className="btn btn-primary" onClick={handleAdd}>
                                            + Add Your First Supplier
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : suppliers.map(supplier => {
                            const initials = supplier.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                            return (
                                <tr key={supplier.id}>
                                    <td>
                                        <div className="d-flex align-center gap-2">
                                            <div className="supplier-avatar text-white d-flex align-center justify-center font-bold" style={{width: '36px', height: '36px', fontSize: '0.8rem', borderRadius: '50%', background: 'var(--accent)'}}>{initials}</div>
                                            <div>
                                                <div className="font-semi">{supplier.name}</div>
                                                <div className="text-muted text-sm">ID: #{supplier.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="font-semi">{supplier.contact_name || '-'}</div>
                                    </td>
                                    <td>
                                        <div className="text-sm">{supplier.email || '-'}</div>
                                        <div className="text-sm">{supplier.phone || '-'}</div>
                                    </td>
                                    <td>
                                        <div className="text-sm">
                                            📦 <span className="font-semi">{supplier.products_count || 0}</span> Products
                                        </div>
                                        <div className="text-sm">
                                            🛒 <span className="font-semi">{supplier.purchase_orders_count || 0}</span> Orders
                                        </div>
                                    </td>
                                    <td>
                                        <SupplierStatusBadge status={supplier.status || 'active'} />
                                    </td>
                                    <td>
                                        <button className="btn btn-sm btn-ghost me-1" onClick={() => setViewSupplierId(supplier.id)}>
                                            👁️ View
                                        </button>
                                        <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(supplier.id)}>
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!loading && suppliers.length > 0 && (
                <Pagination page={page} total={total} perPage={15} onChange={setPage} />
            )}

            {/* Modals */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                title={selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                size="md"
            >
                <SupplierForm
                    supplier={selectedSupplier}
                    onSuccess={handleSaveSuccess}
                    onCancel={handleModalClose}
                />
            </Modal>

            <ConfirmModal
                isOpen={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={handleDelete}
                message="Are you sure you want to delete this supplier? This action cannot be undone."
            />

            <SupplierViewModal 
                isOpen={!!viewSupplierId} 
                onClose={() => setViewSupplierId(null)} 
                supplierId={viewSupplierId} 
                onEdit={(supplier) => { setViewSupplierId(null); handleEdit(supplier); }}
            />

            {/* Styles */}
            <style>{`
                .suppliers-dashboard {
                    padding: 1.5rem;
                    max-width: 1600px;
                    margin: 0 auto;
                }

                .page-header-modern {
                    margin-bottom: 1.5rem;
                }

                .header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 1rem;
                }

                .page-title {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--text);
                    margin-bottom: 0.25rem;
                }

                .page-subtitle {
                    color: var(--text2);
                    font-size: 0.9rem;
                }

                .btn-lg {
                    padding: 0.75rem 1.5rem;
                    font-size: 1rem;
                }

                .btn-lg span {
                    margin-right: 0.5rem;
                    font-size: 1.25rem;
                }

                .stats-grid-modern {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .controls-section {
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 1rem 1.5rem;
                    margin-bottom: 1rem;
                }

                .filters-row {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                .status-filters {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }

                .status-pill {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    border: 1px solid var(--border);
                    border-radius: 20px;
                    background: var(--bg);
                    color: var(--text2);
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .status-pill:hover {
                    border-color: var(--accent);
                    color: var(--accent);
                }

                .status-pill.active {
                    background: var(--accent);
                    border-color: var(--accent);
                    color: white;
                }

                .status-pill .count {
                    background: var(--surface);
                    padding: 0.15rem 0.5rem;
                    border-radius: 10px;
                    font-size: 0.75rem;
                }

                .status-pill.active .count {
                    background: rgba(255,255,255,0.3);
                }

                .view-controls {
                    display: flex;
                    gap: 0.5rem;
                }

                .view-btn {
                    padding: 0.5rem 1rem;
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    background: var(--bg);
                    color: var(--text2);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .view-btn:hover {
                    border-color: var(--accent);
                    color: var(--accent);
                }

                .view-btn.active {
                    background: var(--accent);
                    border-color: var(--accent);
                    color: white;
                }

                .results-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    padding: 0 0.5rem;
                }

                .results-text {
                    color: var(--text2);
                    font-size: 0.9rem;
                }

                .loading-text {
                    color: var(--accent);
                    font-size: 0.9rem;
                }

                .suppliers-container {
                    display: grid;
                    gap: 1rem;
                }

                .suppliers-container.grid {
                    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
                }

                .suppliers-container.list {
                    grid-template-columns: 1fr;
                }

                .loading-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
                    gap: 1rem;
                }

                .skeleton-card {
                    height: 350px;
                    background: linear-gradient(90deg, var(--surface2) 25%, var(--surface) 50%, var(--surface2) 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                    border-radius: 12px;
                }

                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }

                /* Supplier Card */
                .supplier-card {
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    overflow: hidden;
                    transition: all 0.2s ease;
                }

                .supplier-card:hover {
                    box-shadow: var(--shadow-md);
                    transform: translateY(-2px);
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1.25rem;
                    background: var(--bg);
                    border-bottom: 1px solid var(--border);
                }

                .supplier-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: var(--accent);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 1rem;
                }

                .supplier-info {
                    flex: 1;
                }

                .supplier-name {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--text);
                    margin: 0;
                }

                .supplier-id {
                    font-size: 0.8rem;
                    color: var(--text3);
                }

                .status-badge {
                    padding: 0.35rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .card-body {
                    padding: 1.25rem;
                }

                .info-section {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    margin-bottom: 1.25rem;
                }

                .info-row {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.75rem;
                }

                .info-icon {
                    font-size: 1rem;
                    margin-top: 0.1rem;
                }

                .info-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .info-label {
                    font-size: 0.7rem;
                    color: var(--text3);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .info-value {
                    font-size: 0.9rem;
                    color: var(--text);
                    font-weight: 500;
                }

                .info-value.address {
                    font-size: 0.8rem;
                    color: var(--text2);
                    line-height: 1.4;
                }

                .info-link {
                    font-size: 0.9rem;
                    color: var(--blue);
                    text-decoration: none;
                }

                .info-link:hover {
                    text-decoration: underline;
                }

                .supplier-metrics {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                    padding: 1rem;
                    background: var(--bg);
                    border-radius: 8px;
                }

                .metric {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }

                .metric-icon {
                    font-size: 1.25rem;
                    margin-bottom: 0.25rem;
                }

                .metric-value {
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--text);
                }

                .metric-label {
                    font-size: 0.7rem;
                    color: var(--text3);
                    text-transform: uppercase;
                }

                .card-footer {
                    padding: 1rem 1.25rem;
                    border-top: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .profile-completeness {
                    flex: 1;
                }

                .completeness-bar {
                    height: 6px;
                    background: var(--bg);
                    border-radius: 3px;
                    overflow: hidden;
                    margin-bottom: 0.25rem;
                }

                .completeness-fill {
                    height: 100%;
                    border-radius: 3px;
                    transition: width 0.3s ease;
                }

                .completeness-text {
                    font-size: 0.7rem;
                    color: var(--text3);
                }

                .card-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .btn-sm {
                    padding: 0.5rem 0.75rem;
                    font-size: 0.85rem;
                }

                .btn-ghost {
                    background: transparent;
                    border: 1px solid var(--border);
                    color: var(--text2);
                }

                .btn-ghost:hover {
                    background: var(--bg);
                    color: var(--text);
                }

                .btn-danger {
                    background: #FEE2E2;
                    border: 1px solid #FECACA;
                    color: #DC2626;
                }

                .btn-danger:hover {
                    background: #FECACA;
                }

                /* Empty State */
                .empty-state-modern {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 4rem 2rem;
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                }

                .empty-icon-large {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                    opacity: 0.5;
                }

                .empty-state-modern h3 {
                    color: var(--text);
                    margin-bottom: 0.5rem;
                }

                .empty-state-modern p {
                    color: var(--text2);
                    margin-bottom: 1.5rem;
                    max-width: 400px;
                    margin-left: auto;
                    margin-right: auto;
                }

                @media (max-width: 1200px) {
                    .stats-grid-modern {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .suppliers-container.grid {
                        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                    }
                }

                @media (max-width: 768px) {
                    .header-content {
                        flex-direction: column;
                        text-align: center;
                    }

                    .stats-grid-modern {
                        grid-template-columns: 1fr;
                    }

                    .suppliers-container.grid {
                        grid-template-columns: 1fr;
                    }

                    .filters-row {
                        flex-direction: column;
                    }

                    .supplier-metrics {
                        grid-template-columns: 1fr;
                    }

                    .card-footer {
                        flex-direction: column;
                        gap: 1rem;
                    }

                    .card-actions {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
}
