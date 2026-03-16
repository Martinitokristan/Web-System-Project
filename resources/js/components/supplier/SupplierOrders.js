// SupplierOrders.js - Supplier PO Management
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import FilterBar from '../shared/FilterBar';
import Pagination from '../shared/Pagination';
import Modal from '../shared/Modal';
import { StatusBadge } from '../shared/Badge';

export default function SupplierOrders() {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [orders, setOrders] = useState({ data: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [deliveryNotes, setDeliveryNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Reject modal state
    const [rejectModal, setRejectModal] = useState(null); // holds the order to reject
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectError, setRejectError] = useState('');

    useEffect(() => {
        console.log("SupplierOrders component version: 1.0.1 (Accept/Reject Live)");
        fetchOrders();
    }, [page, statusFilter]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = { page, per_page: 15 };
            if (statusFilter) params.status = statusFilter;
            
            const res = await axios.get('/supplier/purchase-orders', { params });
            setOrders(res.data.data);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
            showToast('Failed to load orders', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (order) => {
        if (!confirm(`Accept PO ${order.po_number}? This confirms you have the stock available.`)) return;
        setSubmitting(true);
        try {
            await axios.post(`/supplier/purchase-orders/${order.id}/accept`);
            showToast(`PO ${order.po_number} accepted! You can now mark it as delivered when ready.`, 'success');
            fetchOrders();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to accept PO', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const openRejectModal = (order) => {
        setRejectModal(order);
        setRejectionReason('');
        setRejectError('');
    };

    const handleReject = async () => {
        if (!rejectionReason.trim() || rejectionReason.trim().length < 10) {
            setRejectError('Please provide a reason of at least 10 characters.');
            return;
        }
        setSubmitting(true);
        try {
            await axios.post(`/supplier/purchase-orders/${rejectModal.id}/reject`, {
                rejection_reason: rejectionReason.trim(),
            });
            showToast(`PO ${rejectModal.po_number} rejected. The admin has been notified.`, 'success');
            setRejectModal(null);
            setRejectionReason('');
            fetchOrders();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to reject PO', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeliver = async () => {
        if (!selectedOrder) return;
        
        setSubmitting(true);
        try {
            await axios.post(`/supplier/purchase-orders/${selectedOrder.id}/deliver`, {
                delivery_notes: deliveryNotes
            });
            showToast('Order marked as delivered successfully!');
            setSelectedOrder(null);
            setDeliveryNotes('');
            fetchOrders();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to mark as delivered', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending:            { class: 'badge--gray',   label: 'Pending Admin Approval' },
            pending_supplier:   { class: 'badge--orange', label: 'Awaiting Your Response' },
            accepted:           { class: 'badge--blue',   label: 'Accepted – Ready to Deliver' },
            rejected:           { class: 'badge--red',    label: 'Rejected' },
            supplier_delivered: { class: 'badge--purple', label: 'Delivered' },
            received:           { class: 'badge--green',  label: 'Received' },
        };
        const badge = badges[status] || badges.pending;
        return <span className={`badge ${badge.class}`}>{badge.label}</span>;
    };

    const canAcceptOrReject = (status) => status === 'pending_supplier';
    const canDeliver = (status) => status === 'accepted';

    return (
        <div style={{ padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontWeight: 800, fontSize: '1.5rem', margin: 0 }}>Purchase Orders</h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>Track and manage your purchase orders</p>
                </div>
            </div>

            {/* Filters */}
            <FilterBar
                filters={[
                    {
                        value: statusFilter,
                        onChange: setStatusFilter,
                        options: [
                            { value: '',                   label: 'All Statuses' },
                            { value: 'pending_supplier',   label: 'Awaiting Your Response' },
                            { value: 'accepted',           label: 'Accepted' },
                            { value: 'rejected',           label: 'Rejected' },
                            { value: 'supplier_delivered', label: 'Delivered' },
                            { value: 'received',           label: 'Received' },
                        ]
                    }
                ]}
            />

            {/* Orders Table */}
            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>PO Number</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Items</th>
                            <th>Total Amount</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-4"><div className="spinner"/></td></tr>
                        ) : orders.data?.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-4 text-muted">No purchase orders found</td></tr>
                        ) : orders.data?.map(order => (
                            <tr key={order.id}>
                                <td className="font-semi">{order.po_number}</td>
                                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                <td>{getStatusBadge(order.status)}</td>
                                <td>{order.items?.length || 0} items</td>
                                <td className="font-bold">₱{Number(order.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td>
                                    <button 
                                        className="btn btn--sm btn--primary"
                                        style={{ background: '#FF6B35' }}
                                        onClick={() => setSelectedOrder(order)}
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination 
                page={page} 
                total={orders.total} 
                perPage={15} 
                onChange={setPage} 
            />

            <style>{`
                .order-document {
                    font-family: 'Inter', system-ui, sans-serif;
                    color: #1e293b;
                }
                .btn--system-orange {
                    background: #FF6B35 !important;
                    color: white !important;
                    border: none;
                    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.2);
                }
                .btn--system-orange:hover {
                    background: #fa5a1e !important;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(255, 107, 53, 0.3);
                }
                .system-orange-text { 
                    color: #FF6B35 !important; 
                }
                .last-border-0:last-child {
                    border-bottom: none !important;
                }
                .order-document table thead th {
                    background: #f8fafc;
                    color: #64748b;
                    letter-spacing: 0.025em;
                }
                .order-document .row h6 {
                    letter-spacing: 0.05em;
                }
            `}</style>

            {/* Reject PO Modal */}
            <Modal
                isOpen={!!rejectModal}
                onClose={() => !submitting && setRejectModal(null)}
                title={`Reject PO: ${rejectModal?.po_number}`}
                size="md"
            >
                {rejectModal && (
                    <div>
                        <div className="p-3 mb-3 bg-surface2 rounded" style={{borderLeft: '4px solid #ef4444', borderRadius: 8}}>
                            <div className="font-semi text-sm mb-1">⚠ You are rejecting this Purchase Order.</div>
                            <div className="text-sm text-muted">
                                The admin will be notified with your reason. This action cannot be undone.
                            </div>
                        </div>

                        <div className="mb-3">
                            <div className="text-sm text-muted mb-1">Order Summary</div>
                            <div className="font-semi">{rejectModal.po_number} — {rejectModal.items?.length || 0} items</div>
                            <div className="text-sm text-muted">Total: ₱{Number(rejectModal.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>

                        <div className="form-group mb-4">
                            <label className="form-label font-bold text-xs uppercase tracking-wider text-muted">
                                Reason for Rejection <span style={{color:'#ef4444'}}>*</span>
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => { setRejectionReason(e.target.value); setRejectError(''); }}
                                placeholder="e.g., We currently don't have sufficient stock for items requested. Please reorder in 2 weeks..."
                                rows="4"
                                className="form-control"
                                style={rejectError ? {borderColor: '#ef4444', height: '120px'} : {height: '120px'}}
                            />
                            {rejectError && (
                                <div className="text-sm" style={{color:'#ef4444', marginTop: 4}}>{rejectError}</div>
                            )}
                            <div className="text-xs text-muted mt-1">{rejectionReason.length} characters (minimum 10 required)</div>
                        </div>

                        <div className="d-flex gap-2">
                            <button 
                                className="btn btn--ghost flex-1"
                                onClick={() => setRejectModal(null)}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn--system-orange flex-1"
                                onClick={handleReject}
                                disabled={submitting}
                            >
                                {submitting ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Order Details / Deliver Modal */}
            <Modal
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                title={selectedOrder?.action === 'deliver' ? 'Fulfillment Confirmation' : `Order Details - ${selectedOrder?.po_number}`}
                size="xl"
            >
                {selectedOrder && (
                    <div className="p-3">
                        {selectedOrder.action === 'deliver' ? (
                            <div className="p-2">
                                <h4 className="font-bold mb-3">Confirm Dispatch</h4>
                                <p className="text-muted mb-4">You are marking order <strong>{selectedOrder.po_number}</strong> as ready for delivery. Please confirm the items below are packed.</p>
                                
                                <div className="border rounded bg-light p-3 mb-4">
                                    {selectedOrder.items?.map(item => (
                                        <div key={item.id} className="d-flex justify-between py-2 border-bottom last-border-0">
                                            <span className="font-semi">{item.product?.name || item.supplier_product?.name}</span>
                                            <span className="font-bold text-dark">× {item.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="form-group mb-4">
                                    <label className="form-label font-bold small text-uppercase text-muted mb-2">Delivery Notes (Optional)</label>
                                    <textarea
                                        value={deliveryNotes}
                                        onChange={(e) => setDeliveryNotes(e.target.value)}
                                        placeholder="Add any delivery details or tracking information..."
                                        rows="3"
                                        className="form-control"
                                    />
                                </div>

                                <div className="d-flex gap-2">
                                    <button className="btn btn--white flex-1 py-2" onClick={() => setSelectedOrder(null)} disabled={submitting}>Back</button>
                                    <button className="btn btn--system-orange flex-1 py-2 font-bold" onClick={handleDeliver} disabled={submitting}>
                                        {submitting ? 'Processing...' : 'Confirm Delivery'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="order-document">
                                {/* Header Info */}
                                <div className="d-flex justify-between border-bottom pb-4 mb-4">
                                    <div>
                                        <h2 className="font-bold text-dark mb-1">Order {selectedOrder.po_number}</h2>
                                        <div className="text-muted small">Issued on {new Date(selectedOrder.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="small font-bold text-muted uppercase mb-1">Status</div>
                                        <StatusBadge status={selectedOrder.status} />
                                    </div>
                                </div>

                                {/* Bill To / Order Info */}
                                <div className="row mb-5">
                                    <div className="col-md-6">
                                        <h6 className="text-muted font-bold small text-uppercase mb-2">Purchaser</h6>
                                        <div className="font-bold text-dark">HRMS Central Warehouse</div>
                                        <div className="text-muted">Procurement Department</div>
                                    </div>
                                    <div className="col-md-6 text-md-right">
                                        <h6 className="text-muted font-bold small text-uppercase mb-2">Order Information</h6>
                                        <div className="text-dark">PO Number: <strong>{selectedOrder.po_number}</strong></div>
                                        <div className="text-dark">Date: {new Date(selectedOrder.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="mb-4">
                                    <table className="table">
                                        <thead>
                                            <tr className="bg-light">
                                                <th className="border-0 small font-bold text-uppercase px-3">Product Description</th>
                                                <th className="border-0 small font-bold text-uppercase text-center">QTY</th>
                                                <th className="border-0 small font-bold text-uppercase text-right">Unit Price</th>
                                                <th className="border-0 small font-bold text-uppercase text-right px-3">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrder.items?.map(item => (
                                                <tr key={item.id}>
                                                    <td className="px-3 py-3 border-top">
                                                        <div className="font-bold text-dark">{item.product?.name || item.supplier_product?.name}</div>
                                                        <div className="small text-muted">SKU: {item.product?.sku || item.supplier_product?.sku || 'N/A'}</div>
                                                    </td>
                                                    <td className="py-3 border-top text-center align-middle font-semi">{item.quantity}</td>
                                                    <td className="py-3 border-top text-right align-middle">
                                                        ₱{Number(item.unit_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-3 py-3 border-top text-right align-middle font-bold text-dark">
                                                        ₱{Number(item.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="border-top">
                                            <tr>
                                                <td colSpan="3" className="text-right py-3 border-0 font-bold text-muted">Grand Total</td>
                                                <td className="text-right py-3 pr-3 border-0 font-bold text-xl system-orange-text">
                                                    ₱{Number(selectedOrder.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Notes/Reason */}
                                {selectedOrder.status === 'rejected' && selectedOrder.rejection_reason && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded mb-4">
                                        <div className="font-bold text-red-600 small text-uppercase mb-1">Rejection Reason</div>
                                        <div className="text-dark">{selectedOrder.rejection_reason}</div>
                                    </div>
                                )}

                                {selectedOrder.delivery_notes && (
                                    <div className="p-3 bg-blue-50 border border-blue-100 rounded mb-4">
                                        <div className="font-bold text-blue-600 small text-uppercase mb-1">Delivery Notes</div>
                                        <div className="text-dark italic">"{selectedOrder.delivery_notes}"</div>
                                    </div>
                                )}

                                {/* Modal Footer Actions */}
                                <div className="border-top pt-4 mt-5 d-flex justify-content-end gap-2">
                                    {canAcceptOrReject(selectedOrder.status) && (
                                        <>
                                            <button
                                                className="btn btn--system-orange px-4 py-2 font-bold"
                                                onClick={async () => { const o = selectedOrder; setSelectedOrder(null); await handleAccept(o); }}
                                                disabled={submitting}
                                            >
                                                Accept Order
                                            </button>
                                            <button
                                                className="btn btn--outline-danger px-4 py-2 font-bold"
                                                onClick={() => { const o = selectedOrder; setSelectedOrder(null); openRejectModal(o); }}
                                                disabled={submitting}
                                            >
                                                Decline Order
                                            </button>
                                        </>
                                    )}
                                    {canDeliver(selectedOrder.status) && (
                                        <button
                                            className="btn btn--system-orange px-4 py-2 font-bold"
                                            onClick={() => setSelectedOrder({...selectedOrder, action: 'deliver'})}
                                        >
                                            Mark as Delivered
                                        </button>
                                    )}
                                    <button className="btn btn-light px-4 py-2" onClick={() => setSelectedOrder(null)}>Close</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
