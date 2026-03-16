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
            ? 'Approve and send this PO to the supplier?' 
            : action === 'decline'
            ? 'Are you sure you want to decline/cancel this PO?'
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
                                { value: '',                   label: 'All Statuses' },
                                { value: 'pending',            label: 'Pending' },
                                { value: 'pending_supplier',   label: 'Approved / Sent' },
                                { value: 'accepted',           label: 'Accepted' },
                                { value: 'rejected',           label: 'Rejected' },
                                { value: 'supplier_delivered', label: 'Delivered' },
                                { value: 'received',           label: 'Received' },
                                { value: 'cancelled',          label: 'Declined' },
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
                                <td className="font-bold text-red">₱{Number(po.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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

            <style>{`
                .premium-modal {
                    font-family: 'Inter', system-ui, sans-serif;
                }
                .po-card-main {
                    background: #fff;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                    overflow: hidden;
                }
                .po-header-section {
                    background: #f8fafc;
                    padding: 24px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .po-body-section {
                    padding: 24px;
                }
                .po-footer-section {
                    background: #f8fafc;
                    padding: 20px 24px;
                    border-top: 1px solid #e2e8f0;
                }
                .btn--system-orange {
                    background: #FF6B35 !important;
                    color: white !important;
                    border: none;
                    font-weight: 700;
                    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.25);
                }
                .btn--system-orange:hover {
                    background: #fa5a1e !important;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(255, 107, 53, 0.35);
                }
                .btn--white-decline {
                    background: #fff !important;
                    color: #dc2626 !important;
                    border: 1px solid #fecaca !important;
                    font-weight: 600;
                }
                .btn--white-decline:hover {
                    background: #fff5f5 !important;
                    border-color: #ef4444 !important;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                }
                .system-orange-text { color: #FF6B35 !important; }
            `}</style>

            <Modal 
                isOpen={!!viewPo} 
                onClose={() => setViewPo(null)} 
                title={`Purchase Order Analysis - ${viewPo?.po_number}`} 
                size="xl"
            >
                {viewPo && (
                    <div className="premium-modal">
                        <div className="po-card-main">
                            {/* Unified Header */}
                            <div className="po-header-section">
                                <div className="d-flex justify-between align-center">
                                    <div className="d-flex gap-3 align-center">
                                        <div className="p-3 bg-white rounded-circle shadow-sm border border-light">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted font-bold uppercase tracking-widest mb-1">Logistics Partner</div>
                                            <div className="font-bold text-xl text-dark" style={{letterSpacing: '-0.02em'}}>{viewPo.supplier?.name}</div>
                                            <div className="text-sm font-semi system-orange-text">{viewPo.supplier?.email}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-muted font-bold uppercase tracking-widest mb-1">Current Status</div>
                                        <StatusBadge status={viewPo.status} />
                                    </div>
                                </div>

                                <div className="info-grid mt-4 pt-4 border-top">
                                    <div>
                                        <div className="text-xs text-muted font-bold uppercase tracking-wider mb-1">Authorizing Agent</div>
                                        <div className="font-bold text-dark">{viewPo.creator?.name || 'System'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted font-bold uppercase tracking-wider mb-1">Creation Date</div>
                                        <div className="font-semi text-dark">{new Date(viewPo.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
                                    </div>
                                    {viewPo.expected_date && (
                                        <div>
                                            <div className="text-xs text-muted font-bold uppercase tracking-wider mb-1">Target Fulfillment</div>
                                            <div className="font-bold system-orange-text">{new Date(viewPo.expected_date).toLocaleDateString()}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Main Body (Single Table) */}
                            <div className="po-body-section">
                                <div className="d-flex justify-between align-center mb-3">
                                    <h3 className="m-0 font-bold text-dark" style={{fontSize: '1rem'}}>Itemized Purchase Inventory</h3>
                                    <span className="text-xs font-bold px-2 py-1 bg-light border rounded text-muted uppercase">{viewPo.items?.length || 0} Line Items</span>
                                </div>
                                <div className="table-responsive border rounded overflow-hidden">
                                    <table className="table mb-0">
                                        <thead className="bg-light text-muted" style={{fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>
                                            <tr>
                                                <th className="px-4 py-3 border-0">Product / SKU</th>
                                                <th className="px-4 py-3 border-0 text-center">Qty</th>
                                                <th className="px-4 py-3 border-0 text-right">Unit rate</th>
                                                <th className="px-4 py-3 border-0 text-right">Total Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewPo.items?.map(i => {
                                                const productName = i.product?.name || i.supplier_product?.name || 'Loading Name...';
                                                const sku = i.product?.sku || i.supplier_product?.sku || 'N/A';
                                                
                                                return (
                                                    <tr key={i.id}>
                                                        <td className="px-4 py-4 border-top">
                                                            <div className="font-bold text-dark mb-1">{productName}</div>
                                                            <div className="text-xs bg-light text-muted d-inline-block px-1 rounded font-mono">SKU: {sku}</div>
                                                            {i.product_variant && (
                                                                <div className="text-xs system-orange-text font-bold mt-1">
                                                                    ({[i.product_variant.size_value?.label, i.product_variant.color_value?.label].filter(Boolean).join(' ')})
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4 border-top text-center font-bold text-lg">{i.quantity}</td>
                                                        <td className="px-4 py-4 border-top text-right text-muted font-semi">
                                                            ₱{Number(i.unit_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-4 py-4 border-top text-right font-bold text-dark">
                                                            ₱{Number(i.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot className="bg-light border-top">
                                            <tr>
                                                <td colSpan="3" className="px-4 py-4 text-right font-bold text-muted border-0">Purchase Order Value:</td>
                                                <td className="px-4 py-4 text-right font-bold text-2xl system-orange-text border-0">
                                                    ₱{Number(viewPo.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Exception Messaging */}
                                {viewPo.status === 'rejected' && viewPo.rejection_reason && (
                                    <div className="mt-4 p-4 rounded bg-red-white border border-red-100 d-flex gap-3 align-center">
                                        <svg width="24" height="24" fill="none" stroke="#dc2626" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                        <div>
                                            <div className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Supplier Rejection Logic</div>
                                            <div className="text-sm text-dark">{viewPo.rejection_reason}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Unified Footer Actions */}
                            <div className="po-footer-section">
                                <div className="d-flex justify-between align-center">
                                    <div className="text-xs font-bold text-muted uppercase font-mono">System Integrity Verified</div>
                                    <div className="d-flex gap-2">
                                        {viewPo.status === 'pending' && (
                                            <>
                                                <button 
                                                    className="btn btn--system-orange py-2 px-5 rounded shadow-sm"
                                                    disabled={actionLoading} 
                                                    onClick={() => handleAction(viewPo.id, 'approve')}
                                                >
                                                    Authorize PO
                                                </button>
                                                <button 
                                                    className="btn btn--white-decline py-2 px-5 rounded"
                                                    disabled={actionLoading} 
                                                    onClick={() => handleAction(viewPo.id, 'decline')}
                                                >
                                                    Decline Request
                                                </button>
                                            </>
                                        )}

                                        {viewPo.status === 'supplier_delivered' && (
                                            <button 
                                                className="btn btn--system-orange py-2 px-5 rounded"
                                                disabled={actionLoading} 
                                                onClick={() => handleAction(viewPo.id, 'receive')}
                                            >
                                                Confirm & Add to Stock
                                            </button>
                                        )}

                                        {['pending_supplier', 'accepted'].includes(viewPo.status) && (
                                            <div className="d-flex align-center gap-2 px-4 py-2 bg-white border rounded font-bold text-muted text-xs uppercase tracking-tighter shadow-sm">
                                                <div className="spinner-border spinner-border-sm system-orange-text"></div>
                                                Awaiting Fulfillment
                                            </div>
                                        )}

                                        {viewPo.status === 'received' && (
                                            <div className="px-4 py-2 bg-green-light border border-green-200 rounded text-green-700 font-bold text-xs uppercase d-flex align-center gap-2">
                                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                Inventory Synchronized
                                            </div>
                                        )}

                                        {viewPo.status === 'cancelled' && (
                                            <div className="px-4 py-2 bg-red-white border border-red-200 rounded text-red-600 font-bold text-xs uppercase d-flex align-center gap-2">
                                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                Request Voided
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

        </div>
    );
}
