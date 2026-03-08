import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import FilterBar from '../shared/FilterBar';
import Pagination from '../shared/Pagination';
import Modal from '../shared/Modal';

export default function StockTab() {
    const { showToast } = useToast();
    const [inventory, setInventory] = useState({ data: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState(''); // '' or 'low'
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

    // Adjustment Modal
    const [adjModal, setAdjModal] = useState({ open: false, product: null });
    const [adjForm, setAdjForm] = useState({ type: 'add', quantity: 1, reason: 'Manual audit' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchStock = () => {
            if (!isMounted) return;
            setLoading(true);
            axios.get('/inventory', { params: { page, search, filter } })
                .then(res => {
                    const paginated = res.data.data;
                    if (isMounted) {
                        setInventory({
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
        const debounce = setTimeout(fetchStock, 400);
        return () => {
            clearTimeout(debounce);
            isMounted = false;
        };
    }, [page, search, filter, refreshTrigger]);

    const handleAdjust = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post('/inventory/adjust', {
                product_id: adjModal.product.product_id,
                variant_id: adjModal.product.variant_id,
                ...adjForm
            });
            showToast('Stock adjusted successfully');
            setAdjModal({ open: false, product: null });
            triggerRefresh();
        } catch (err) {
            showToast(err.response?.data?.message || 'Error adjusting stock', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <FilterBar 
                search={search} onSearchChange={v => { setSearch(v); setPage(1); }}
                filters={[
                    {
                        value: filter, onChange: v => { setFilter(v); setPage(1); },
                        options: [
                            { value: '', label: 'All Items' },
                            { value: 'low', label: 'Low Stock Only' }
                        ]
                    }
                ]}
            />

            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Product Name</th>
                            <th>Size</th>
                            <th>Color</th>
                            <th>Weight</th>
                            <th>Current Stock</th>
                            <th>Unit</th>
                            <th>Threshold</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="11" className="text-center py-4"><div className="spinner"/></td></tr>
                        ) : inventory.data.length === 0 ? (
                            <tr><td colSpan="11" className="text-center py-4 text-muted">No inventory found</td></tr>
                        ) : inventory.data.map(item => {
                            const isLow = item.current_stock <= item.reorder_threshold;
                            return (
                                <tr key={item.id}>
                                    <td className="font-semi text-sm">{item.sku}</td>
                                    <td>
                                        <div className="font-semi">{item.name}</div>
                                        <div className="text-muted text-sm">{item.supplier}</div>
                                    </td>
                                    <td>{item.size}</td>
                                    <td>{item.color}</td>
                                    <td>{item.weight}</td>
                                    <td className="td-amount font-bold text-lg">{item.current_stock}</td>
                                    <td className="text-muted">{item.unit}</td>
                                    <td className="td-amount">{item.reorder_threshold}</td>
                                    <td>
                                        {isLow 
                                            ? <span className="badge badge--red">Low Stock</span> 
                                            : <span className="badge badge--green">Optimal</span>}
                                    </td>
                                    <td>
                                        <button className="btn btn--sm btn--ghost" onClick={() => {
                                            setAdjForm({ type: 'add', quantity: 1, reason: 'Manual audit' });
                                            setAdjModal({ open: true, product: item });
                                        }}>
                                            Adjust Stock
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Pagination page={page} total={inventory.total} perPage={15} onChange={setPage} />

            <Modal 
                isOpen={adjModal.open} 
                onClose={() => setAdjModal({open: false, product: null})} 
                title={`Adjust Stock: ${adjModal.product?.name} ${adjModal.product?.is_variant ? `[${adjModal.product.sku}]` : ''}`} 
                size="sm"
            >
                <form onSubmit={handleAdjust}>
                    <div className="form-group">
                        <label>Adjustment Type</label>
                        <select value={adjForm.type} onChange={e => setAdjForm({...adjForm, type: e.target.value})}>
                            <option value="add">Add Stock (+)</option>
                            <option value="subtract">Deduct Stock (-)</option>
                            <option value="set">Set Exact Amount (=)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Quantity</label>
                        <input type="number" min="0" required value={adjForm.quantity} onChange={e => setAdjForm({...adjForm, quantity: e.target.value})} />
                    </div>
                    <div className="form-group mb-3">
                        <label>Reason / Note</label>
                        <input type="text" required value={adjForm.reason} onChange={e => setAdjForm({...adjForm, reason: e.target.value})} placeholder="e.g. Audit correction, Damaged goods" />
                    </div>
                    <button className="btn btn-primary w-full justify-center" disabled={submitting}>
                        {submitting ? 'Saving...' : 'Confirm Adjustment'}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
