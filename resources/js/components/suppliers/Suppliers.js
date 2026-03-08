import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import FilterBar from '../shared/FilterBar';
import Pagination from '../shared/Pagination';
import StatCard from '../shared/StatCard';
import Modal from '../shared/Modal';
import ConfirmModal from '../shared/ConfirmModal';
import SupplierForm from './SupplierForm';

export default function Suppliers() {
    const { showToast } = useToast();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/suppliers', { params: { search, page } });
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
    }, [search, page, refreshTrigger]);

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

    const renderIcon = (d) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={d} />
        </svg>
    );

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2 className="page-title">Suppliers</h2>
                    <p className="text-muted text-sm">Manage your product sourcing and vendor partnerships</p>
                </div>
                <button className="btn btn-primary" onClick={handleAdd}>
                    + Add New Supplier
                </button>
            </div>

            <div className="grid-3 mb-4">
                <StatCard 
                    label="Total Suppliers" 
                    value={total} 
                    icon="🏢" 
                    accentColor="accent" 
                />
                <StatCard 
                    label="Active Partners" 
                    value={suppliers.filter(s => s.email && s.phone).length} 
                    icon="✓" 
                    accentColor="green" 
                />
                <StatCard 
                    label="With Complete Info" 
                    value={suppliers.filter(s => s.name && s.contact_name && s.email && s.phone && s.address).length} 
                    icon="📋" 
                    accentColor="blue" 
                />
            </div>

            <FilterBar 
                search={search} 
                onSearchChange={(v) => { setSearch(v); setPage(1); }}
            />

            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Company</th>
                            <th>Contact Person</th>
                            <th>Contact Info</th>
                            <th>Address</th>
                            <th style={{ width: 120 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="text-center py-4">
                                    <div className="spinner" />
                                </td>
                            </tr>
                        ) : suppliers.length === 0 ? (
                            <tr>
                                <td colSpan="5">
                                    <div className="empty-state">
                                        <div className="empty-icon">🏢</div>
                                        <div className="empty-text">No suppliers found</div>
                                        <div className="empty-sub">
                                            {search ? 'Try adjusting your search terms' : 'Add your first supplier to get started'}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            suppliers.map(s => (
                                <tr key={s.id}>
                                    <td>
                                        <div className="td-user">
                                            <div className="avatar">
                                                {s.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="user-name">{s.name}</div>
                                                <div className="user-email">ID: #{s.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="font-semi">{s.contact_name || '—'}</div>
                                    </td>
                                    <td>
                                        <div className="text-sm">
                                            {s.email && <div className="text-muted">{s.email}</div>}
                                            {s.phone && <div className="text-muted">{s.phone}</div>}
                                            {!s.email && !s.phone && <span className="text-muted">—</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-sm text-muted max-w-xs truncate">
                                            {s.address || '—'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="td-actions">
                                            <button 
                                                className="btn btn--sm btn--ghost" 
                                                onClick={() => handleEdit(s)}
                                                title="Edit"
                                            >
                                                {renderIcon('M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z')}
                                                <span>Edit</span>
                                            </button>
                                            <button 
                                                className="btn btn--sm btn--danger text-white" 
                                                onClick={() => setDeleteId(s.id)}
                                                title="Delete"
                                            >
                                                {renderIcon('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination page={page} total={total} perPage={15} onChange={setPage} />

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
        </div>
    );
}
