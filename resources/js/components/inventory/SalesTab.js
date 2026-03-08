import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import FilterBar from '../shared/FilterBar';
import Pagination from '../shared/Pagination';
import Modal from '../shared/Modal';
import { StatusBadge } from '../shared/Badge';

export default function SalesTab() {
    const { showToast } = useToast();
    const [sales, setSales] = useState({ data: [], total: 0, current_page: 1 });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

    const [viewOrder, setViewOrder] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const fetchProds = () => {
            if (!isMounted) return;
            setLoading(true);
            axios.get('/sales', { params: { page, search, status: statusFilter } })
                .then(res => {
                    const paginated = res.data.data;
                    if (isMounted) {
                        setSales({
                            data: paginated.data || [],
                            total: paginated.total || 0,
                            current_page: paginated.current_page || 1
                        });
                    }
                })
                .finally(() => {
                    if (isMounted) setLoading(false);
                });
        };
        const debounce = setTimeout(fetchProds, 400);
        return () => {
            clearTimeout(debounce);
            isMounted = false;
        };
    }, [page, search, statusFilter, refreshTrigger]);

    const handleReturn = async (saleId) => {
        if (!confirm('Are you sure you want to mark this sale as returned? Stock will be added back to inventory.')) return;
        try {
            await axios.post(`/sales/${saleId}/return`);
            showToast('Order returned and stock restored');
            triggerRefresh();
            setViewOrder(null);
        } catch (err) {
            showToast('Failed to return order', 'error');
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
                                { value: 'pending', label: 'Pending' },
                                { value: 'confirmed', label: 'Confirmed' },
                                { value: 'out_for_delivery', label: 'Out for Delivery' },
                                { value: 'delivered', label: 'Delivered' },
                                { value: 'returned', label: 'Returned' },
                            ]
                        }
                    ]}
                />
                
                <button className="btn btn-primary" onClick={() => {/* Trigger POS Modal or redirect to portal */ alert('POS feature coming soon')}}>
                    + New Sale
                </button>
            </div>

            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Order No.</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Total Amount</th>
                            <th>Payment</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" className="text-center py-4"><div className="spinner"/></td></tr>
                        ) : sales.data.length === 0 ? (
                            <tr><td colSpan="7" className="text-center py-4 text-muted">No sales orders found</td></tr>
                        ) : sales.data.map(sale => (
                            <tr key={sale.id}>
                                <td><div className="font-semi text-accent">{sale.order_number}</div></td>
                                <td>{new Date(sale.created_at).toLocaleDateString()}</td>
                                <td>
                                    <div className="font-semi">{sale.customer?.name}</div>
                                    <div className="text-sm text-muted">{sale.customer?.email}</div>
                                </td>
                                <td><div className="font-bold">₱{Number(sale.total_amount).toFixed(2)}</div></td>
                                <td><span className="badge badge--gray">{sale.payment_method}</span></td>
                                <td><StatusBadge status={sale.status} /></td>
                                <td>
                                    <button className="btn btn--sm btn--ghost" onClick={() => setViewOrder(sale)}>View Items</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination page={page} total={sales.total} perPage={15} onChange={setPage} />

            <Modal isOpen={!!viewOrder} onClose={() => setViewOrder(null)} title={`Order ${viewOrder?.order_number}`} size="md">
                {viewOrder && (
                    <div>
                        <div className="grid-2 mb-3">
                            <div>
                                <div className="text-sm text-muted mb-1">Customer Details</div>
                                <div className="font-semi">{viewOrder.customer?.name}</div>
                                <div className="text-sm">{viewOrder.customer?.phone}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted mb-1">Order Summary</div>
                                <div className="d-flex justify-between mb-1"><span>Status:</span> <StatusBadge status={viewOrder.status} /></div>
                                <div className="d-flex justify-between mb-1"><span>Payment:</span> <span className="font-semi">{viewOrder.payment_method.toUpperCase()}</span></div>
                                <div className="d-flex justify-between font-bold text-lg mt-2 pt-2 border-top"><span>Total:</span> <span>₱{Number(viewOrder.total_amount).toFixed(2)}</span></div>
                            </div>
                        </div>

                        <h4 className="section-title mb-2">Order Items</h4>
                        <div className="table-wrap mb-3">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Qty</th>
                                        <th>Unit Price</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewOrder.items?.map(i => (
                                        <tr key={i.id}>
                                            <td>{i.product?.name} <span className="text-sm text-muted">({i.product?.sku})</span></td>
                                            <td className="font-bold">{i.quantity}</td>
                                            <td>₱{Number(i.unit_price).toFixed(2)}</td>
                                            <td className="font-semi">₱{Number(i.subtotal).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {viewOrder.status !== 'returned' && (
                            <button className="btn btn--danger w-full justify-center" onClick={() => handleReturn(viewOrder.id)}>
                                Mark as Returned & Restock
                            </button>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
