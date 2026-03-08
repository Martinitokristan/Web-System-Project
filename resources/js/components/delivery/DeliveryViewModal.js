import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import Modal from '../shared/Modal';
import { StatusBadge } from '../shared/Badge';

export default function DeliveryViewModal({ isOpen, onClose, deliveryId }) {
    const { showToast } = useToast();
    const [delivery, setDelivery] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !deliveryId) return;
        
        let isMounted = true;
        setLoading(true);
        axios.get(`/deliveries/${deliveryId}`)
            .then(res => {
                if (isMounted) {
                    setDelivery(res.data.data);
                    setLoading(false);
                }
            })
            .catch(err => {
                if (isMounted) {
                    showToast('Failed to load delivery details', 'error');
                    setLoading(false);
                }
            });

        return () => { isMounted = false; };
    }, [isOpen, deliveryId]);

    if (!isOpen) return null;

    const formatCurrency = (val) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val || 0);
    const formatTime = (date) => date ? new Date(date).toLocaleString() : '-';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Delivery ${delivery?.tracking_number || ''}`} size="lg">
            {loading ? (
                <div className="py-4 text-center"><div className="spinner" /></div>
            ) : delivery ? (
                <div>
                    <div className="grid-2 mb-3">
                        <div>
                            <div className="text-sm text-muted mb-1">Customer Info</div>
                            <h3 className="font-bold text-lg mb-1">{delivery.sale?.customer?.name || 'Walk-in Customer'}</h3>
                            <div className="text-sm"><strong>Phone:</strong> {delivery.sale?.customer?.phone || '-'}</div>
                            <div className="text-sm mt-2"><strong>Delivery Address:</strong><br/>{delivery.address || '-'}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted mb-1">Delivery Status</div>
                            <div className="d-flex justify-between mb-1">
                                <span>Status:</span>
                                <StatusBadge status={delivery.status} />
                            </div>
                            <div className="d-flex justify-between mb-1">
                                <span>Rider:</span>
                                <span className="font-semi">{delivery.rider ? delivery.rider.name : 'Unassigned'}</span>
                            </div>
                            <div className="d-flex justify-between mb-1">
                                <span>Order Number:</span>
                                <span className="font-semi">#{delivery.sale?.order_number}</span>
                            </div>
                            <div className="d-flex justify-between mt-2 pt-2 border-top">
                                <span>Amount Due:</span>
                                <span className="font-bold">
                                    {formatCurrency(delivery.sale?.total_amount)}
                                    {delivery.sale?.payment_method === 'cod' && <span className="badge badge--amber ms-2">COD</span>}
                                </span>
                            </div>
                        </div>
                    </div>

                    <h4 className="section-title mb-2">Order Items</h4>
                    <div className="table-wrap mb-4">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Qty</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!delivery.sale?.items || delivery.sale.items.length === 0 ? (
                                    <tr><td colSpan="3" className="text-center text-muted py-3">No items found.</td></tr>
                                ) : (
                                    delivery.sale.items.map(item => (
                                        <tr key={item.id}>
                                            <td className="font-semi">{item.product?.name || 'Unknown Product'}</td>
                                            <td>{item.quantity}</td>
                                            <td>{formatCurrency(item.subtotal)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <h4 className="section-title mb-2">Delivery Timeline</h4>
                    <div className="bg-surface p-3 br-8 border mb-2">
                        <div className="d-flex justify-between mb-2">
                            <span className="text-muted text-sm">Created At</span>
                            <span className="font-semi text-sm">{formatTime(delivery.created_at)}</span>
                        </div>
                        <div className="d-flex justify-between mb-2">
                            <span className="text-muted text-sm">Picked Up At</span>
                            <span className="font-semi text-sm">{formatTime(delivery.pickup_at)}</span>
                        </div>
                        <div className="d-flex justify-between">
                            <span className="text-muted text-sm">Delivered At</span>
                            <span className="font-semi text-sm">{formatTime(delivery.delivered_at)}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-4 text-muted">Failed to load delivery details.</div>
            )}
        </Modal>
    );
}
