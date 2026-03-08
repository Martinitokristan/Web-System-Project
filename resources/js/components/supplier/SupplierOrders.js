// SupplierOrders.js - Supplier PO Management
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSupplierAuth } from '../../context/SupplierAuthContext';
import { useToast } from '../../context/ToastContext';
import FilterBar from '../shared/FilterBar';
import Pagination from '../shared/Pagination';
import Modal from '../shared/Modal';

export default function SupplierOrders() {
    const { supplier, logout } = useSupplierAuth();
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
        <div className="supplier-orders">
            {/* Header */}
            <header className="supplier-header">
                <div className="header-content">
                    <div className="header-left">
                        <Link to="/supplier/dashboard" className="back-link">← Dashboard</Link>
                        <h1>My Purchase Orders</h1>
                    </div>
                    <div className="header-actions">
                        <span className="supplier-name">{supplier?.name}</span>
                        <button className="btn btn--sm btn--ghost" onClick={logout}>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

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
                                <td className="font-bold">₱{Number(order.total_cost).toFixed(2)}</td>
                                <td>
                                    <button 
                                        className="btn btn--sm btn--primary"
                                        onClick={() => setSelectedOrder(order)}
                                    >
                                        View Details
                                    </button>
                                    {canAcceptOrReject(order.status) && (
                                        <>
                                            <button 
                                                className="btn btn--sm btn--green ml-2"
                                                onClick={() => handleAccept(order)}
                                                disabled={submitting}
                                            >
                                                Accept
                                            </button>
                                            <button 
                                                className="btn btn--sm btn--danger ml-2"
                                                onClick={() => openRejectModal(order)}
                                                disabled={submitting}
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    {canDeliver(order.status) && (
                                        <button 
                                            className="btn btn--sm btn--secondary ml-2"
                                            onClick={() => setSelectedOrder({...order, action: 'deliver' })}
                                        >
                                            Mark Delivered
                                        </button>
                                    )}
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
                            <div className="text-sm text-muted">Total: ₱{Number(rejectModal.total_cost).toFixed(2)}</div>
                        </div>

                        <div className="form-group mb-3">
                            <label className="form-label">
                                Reason for Rejection <span style={{color:'#ef4444'}}>*</span>
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => { setRejectionReason(e.target.value); setRejectError(''); }}
                                placeholder="e.g., We currently don't have sufficient stock for items requested. Please reorder in 2 weeks..."
                                rows="4"
                                className="form-control"
                                style={rejectError ? {borderColor: '#ef4444'} : {}}
                            />
                            {rejectError && (
                                <div className="text-sm" style={{color:'#ef4444', marginTop: 4}}>{rejectError}</div>
                            )}
                            <div className="text-xs text-muted mt-1">{rejectionReason.length} / 1000 characters (min. 10)</div>
                        </div>

                        <div className="d-flex gap-2">
                            <button 
                                className="btn btn--secondary flex-1"
                                onClick={() => setRejectModal(null)}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn--danger flex-1"
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
                title={selectedOrder?.action === 'deliver' ? 'Confirm Delivery' : `Order Details: ${selectedOrder?.po_number}`}
                size="md"
            >
                {selectedOrder && (
                    <div>
                        {selectedOrder.action === 'deliver' ? (
                            <div>
                                <p className="mb-3">
                                    You are about to mark <strong>{selectedOrder.po_number}</strong> as delivered.
                                    This indicates that you have shipped or delivered the following items:
                                </p>
                                
                                <div className="items-list mb-3">
                                    {selectedOrder.items?.map(item => (
                                        <div key={item.id} className="item-row">
                                            <span>{item.product?.name}</span>
                                            <span className="font-bold">Qty: {item.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="form-group mb-3">
                                    <label>Delivery Notes (optional)</label>
                                    <textarea
                                        value={deliveryNotes}
                                        onChange={(e) => setDeliveryNotes(e.target.value)}
                                        placeholder="e.g., Tracking number, delivery date, special instructions..."
                                        rows="3"
                                        className="form-control"
                                    />
                                </div>

                                <div className="d-flex gap-2">
                                    <button 
                                        className="btn btn--secondary flex-1"
                                        onClick={() => setSelectedOrder(null)}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        className="btn btn-primary flex-1"
                                        onClick={handleDeliver}
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Processing...' : 'Confirm Delivery'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="po-info-grid mb-3">
                                    <div className="info-item">
                                        <span className="label">PO Number:</span>
                                        <span className="value">{selectedOrder.po_number}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">Status:</span>
                                        <span className="value">{getStatusBadge(selectedOrder.status)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">Date:</span>
                                        <span className="value">{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">Total:</span>
                                        <span className="value font-bold">₱{Number(selectedOrder.total_cost).toFixed(2)}</span>
                                    </div>
                                </div>

                                <h4 className="mb-2">Order Items</h4>
                                <div className="items-table">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Quantity</th>
                                                <th>Unit Cost</th>
                                                <th>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrder.items?.map(item => (
                                                <tr key={item.id}>
                                                    <td>{item.product?.name}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>₱{Number(item.unit_cost).toFixed(2)}</td>
                                                    <td className="font-bold">₱{Number(item.subtotal).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Show rejection reason if rejected */}
                                {selectedOrder.status === 'rejected' && selectedOrder.rejection_reason && (
                                    <div className="mt-3 p-3 rounded" style={{borderRadius: 8, background: '#fef2f2', borderLeft: '4px solid #ef4444'}}>
                                        <div className="font-semi text-sm mb-1" style={{color:'#ef4444'}}>Rejection Reason</div>
                                        <p className="text-sm">{selectedOrder.rejection_reason}</p>
                                    </div>
                                )}

                                {selectedOrder.delivery_notes && (
                                    <div className="delivery-notes mt-3">
                                        <h4>Delivery Notes</h4>
                                        <p>{selectedOrder.delivery_notes}</p>
                                    </div>
                                )}

                                {/* Quick actions within details modal */}
                                <div className="d-flex gap-2 mt-3">
                                    {canAcceptOrReject(selectedOrder.status) && (
                                        <>
                                            <button
                                                className="btn btn--green flex-1"
                                                onClick={() => { setSelectedOrder(null); handleAccept(selectedOrder); }}
                                                disabled={submitting}
                                            >
                                                Accept PO
                                            </button>
                                            <button
                                                className="btn btn--danger flex-1"
                                                onClick={() => { setSelectedOrder(null); openRejectModal(selectedOrder); }}
                                                disabled={submitting}
                                            >
                                                Reject PO
                                            </button>
                                        </>
                                    )}
                                    {canDeliver(selectedOrder.status) && (
                                        <button
                                            className="btn btn-primary flex-1"
                                            onClick={() => setSelectedOrder({...selectedOrder, action: 'deliver'})}
                                        >
                                            Mark as Delivered
                                        </button>
                                    )}
                                    <button 
                                        className="btn btn--secondary flex-1"
                                        onClick={() => setSelectedOrder(null)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
