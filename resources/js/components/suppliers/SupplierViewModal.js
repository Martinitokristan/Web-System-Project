import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import Modal from '../shared/Modal';
import { StatusBadge } from '../shared/Badge';

export default function SupplierViewModal({ isOpen, onClose, supplierId }) {
    const { showToast } = useToast();
    const [supplier, setSupplier] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !supplierId) return;
        
        let isMounted = true;
        setLoading(true);
        axios.get(`/suppliers/${supplierId}`)
            .then(res => {
                if (isMounted) {
                    setSupplier(res.data.data);
                    setLoading(false);
                }
            })
            .catch(err => {
                if (isMounted) {
                    showToast('Failed to load supplier details', 'error');
                    setLoading(false);
                }
            });

        return () => { isMounted = false; };
    }, [isOpen, supplierId]);

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Supplier Details" size="lg">
            {loading ? (
                <div className="py-4 text-center"><div className="spinner" /></div>
            ) : supplier ? (
                <div>
                    <div className="grid-2 mb-3">
                        <div>
                            <div className="text-sm text-muted mb-1">Company Info</div>
                            <h3 className="font-bold text-lg mb-1">{supplier.name}</h3>
                            <div className="mb-2"><span className="badge">{supplier.status}</span></div>
                            <div className="text-sm"><strong>Contact:</strong> {supplier.contact_name || '-'}</div>
                            <div className="text-sm"><strong>Email:</strong> {supplier.email || '-'}</div>
                            <div className="text-sm"><strong>Phone:</strong> {supplier.phone || '-'}</div>
                            <div className="text-sm mt-2"><strong>Address:</strong><br/>{supplier.address || '-'}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted mb-1">Performance</div>
                            <div className="d-flex justify-between mb-1">
                                <span>Total Products:</span>
                                <span className="font-semi">{supplier.products?.length || 0}</span>
                            </div>
                            <div className="d-flex justify-between mb-1">
                                <span>Purchase Orders:</span>
                                <span className="font-semi">{supplier.purchase_orders?.length || 0}</span>
                            </div>
                        </div>
                    </div>

                    <h4 className="section-title mb-2">Recent Purchase Orders</h4>
                    <div className="table-wrap mb-3">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>PO Number</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!supplier.purchase_orders || supplier.purchase_orders.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center text-muted py-3">No purchase orders found.</td></tr>
                                ) : (
                                    supplier.purchase_orders.slice(0, 5).map(po => (
                                        <tr key={po.id}>
                                            <td className="font-semi">{po.po_number}</td>
                                            <td>{new Date(po.created_at).toLocaleDateString()}</td>
                                            <td>₱{Number(po.total_amount).toFixed(2)}</td>
                                            <td><StatusBadge status={po.status} /></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-4 text-muted">Failed to load supplier.</div>
            )}
        </Modal>
    );
}
