import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import FilterBar from '../shared/FilterBar';
import Pagination from '../shared/Pagination';
import Modal from '../shared/Modal';
import { StatusBadge } from '../shared/Badge';

export default function PurchaseTab() {
    const { showToast } = useToast();
    const [pos, setPos] = useState({ data: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

    const [viewPo, setViewPo] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchPos = () => {
            if (!isMounted) return;
            setLoading(true);
            axios.get('/purchase-orders', { params: { page, search, status: statusFilter } })
                .then(res => {
                    const paginatedData = res.data.data;
                    if (isMounted) {
                        setPos({
                            data: paginatedData.data ? paginatedData.data : paginatedData,
                            total: paginatedData.total || paginatedData.length || 0
                        });
                    }
                })
                .finally(() => {
                    if (isMounted) setLoading(false);
                });
        };
        const debounce = setTimeout(fetchPos, 400);
        return () => {
            clearTimeout(debounce);
            isMounted = false;
        };
    }, [page, search, statusFilter, refreshTrigger]);

    const handleAction = async (poId, action) => {
        const confirmMsg = action === 'approve' 
            ? 'Approve this PO?' 
            : 'Mark as received? This will automatically increase your inventory stock for all items in this PO.';
        
        if (!confirm(confirmMsg)) return;

        setActionLoading(true);
        try {
            await axios.post(`/purchase-orders/${poId}/${action}`);
            showToast(`PO ${action}d successfully`);
            triggerRefresh();
            setViewPo(null);
        } catch (err) {
            showToast(err.response?.data?.message || `Failed to ${action} PO`, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div>
            <div className="d-flex justify-between align-center mb-3">
                <FilterBar 
                    search={search} onSearchChange={v => { setSearch(v); setPage(1); }}
                    filters={[
                        {
                            value: statusFilter, onChange: v => { setStatusFilter(v); setPage(1); },
                            options: [
                                { value: '', label: 'All Statuses' },
                                { value: 'draft', label: 'Draft' },
                                { value: 'pending', label: 'Pending Approval' },
                                { value: 'approved', label: 'Approved (Awaiting Delivery)' },
                                { value: 'received', label: 'Received (Stock Added)' },
                            ]
                        }
                    ]}
                />
            </div>

            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>PO Number</th>
                            <th>Date</th>
                            <th>Supplier</th>
                            <th>Total Cost</th>
                            <th>Items</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" className="text-center py-4"><div className="spinner"/></td></tr>
                        ) : pos.data.length === 0 ? (
                            <tr><td colSpan="7" className="text-center py-4 text-muted">No purchase orders found</td></tr>
                        ) : pos.data.map(po => (
                            <tr key={po.id}>
                                <td className="font-semi text-accent">{po.po_number}</td>
                                <td>{new Date(po.created_at).toLocaleDateString()}</td>
                                <td>
                                    <div className="font-semi">{po.supplier?.name}</div>
                                    <div className="text-sm text-muted">{po.supplier?.email}</div>
                                </td>
                                <td className="font-bold text-red">₱{Number(po.total_amount).toFixed(2)}</td>
                                <td>{po.items?.length || 0} items</td>
                                <td><StatusBadge status={po.status} /></td>
                                <td>
                                    <button className="btn btn--sm btn--primary" onClick={() => setViewPo(po)}>Review</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination page={page} total={pos.total} perPage={15} onChange={setPage} />

            <Modal isOpen={!!viewPo} onClose={() => setViewPo(null)} title={`Purchase Order ${viewPo?.po_number}`} size="md">
                {viewPo && (
                    <div>
                        <div className="d-flex justify-between mb-3 p-3 bg-surface2 rounded" style={{borderRadius: 8}}>
                            <div>
                                <div className="text-sm text-muted">Supplier</div>
                                <div className="font-semi">{viewPo.supplier?.name}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-muted">Status</div>
                                <StatusBadge status={viewPo.status} />
                            </div>
                        </div>

                        <h4 className="section-title mb-2">Requested Items</h4>
                        <div className="table-wrap mb-4">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Qty</th>
                                        <th>Unit Cost</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewPo.items?.map(i => (
                                        <tr key={i.id}>
                                            <td>{i.product?.name} <span className="text-sm text-muted">({i.product?.sku})</span></td>
                                            <td className="font-bold">{i.quantity}</td>
                                            <td>₱{Number(i.unit_cost).toFixed(2)}</td>
                                            <td className="font-semi">₱{Number(i.subtotal).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td colSpan="3" className="text-right font-semi">Total PO Cost:</td>
                                        <td className="font-bold text-lg text-red">₱{Number(viewPo.total_amount).toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="d-flex gap-2">
                            {viewPo.status === 'pending' && (
                                <button className="btn btn-primary flex-1 justify-center" disabled={actionLoading} onClick={() => handleAction(viewPo.id, 'approve')}>
                                    Approve PO
                                </button>
                            )}
                            {viewPo.status === 'approved' && (
                                <button className="btn btn--green flex-1 justify-center" disabled={actionLoading} onClick={() => handleAction(viewPo.id, 'receive')}>
                                    Mark as Received (Add to Stock)
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
