import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import FilterBar from '../shared/FilterBar';
import Pagination from '../shared/Pagination';

export default function StockTab() {
    const { showToast } = useToast();
    const [inventory, setInventory] = useState({ data: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState(''); // '' or 'low'
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

    const [transferModal, setTransferModal] = useState({ show: false, item: null, qty: 1 });
    const [transferLoading, setTransferLoading] = useState(false);

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

    const handleTransfer = async () => {
        const qty = Number(transferModal.qty);
        const available = Number(transferModal.item.warehouse_stock);

        if (!transferModal.item || qty < 1 || qty > available) {
            showToast('Invalid transfer quantity', 'error');
            return;
        }

        setTransferLoading(true);
        try {
            await axios.post('/inventory/transfer', {
                product_id: transferModal.item.product_id,
                variant_id: transferModal.item.variant_id || null,
                quantity: transferModal.qty,
            });
            showToast('Stock transferred to storefront successfully!');
            setTransferModal({ show: false, item: null, qty: 1 });
            triggerRefresh();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to transfer stock', 'error');
        } finally {
            setTransferLoading(false);
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
                            <th>Variant (Size/Color)</th>
                            <th>Warehouse Stock</th>
                            <th>Storefront Stock</th>
                            <th>Unit</th>
                            <th>Threshold</th>
                            <th>Status (Storefront)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="10" className="text-center py-4"><div className="spinner"/></td></tr>
                        ) : inventory.data.length === 0 ? (
                            <tr><td colSpan="10" className="text-center py-4 text-muted">No inventory found</td></tr>
                        ) : inventory.data.map(item => {
                            const isLow = item.current_stock <= item.reorder_threshold;
                            const variantLabel = item.is_variant ? `${item.size !== '-' ? item.size : ''} ${item.color !== '-' ? item.color : ''}`.trim() : 'Base Product';

                            return (
                                <tr key={item.id}>
                                    <td className="font-semi text-sm">{item.sku}</td>
                                    <td>
                                        <div className="font-semi">{item.name}</div>
                                        <div className="text-muted text-sm">{item.supplier}</div>
                                    </td>
                                    <td>{variantLabel || '-'}</td>
                                    <td className="font-bold text-orange">{item.warehouse_stock}</td>
                                    <td className="font-bold text-lg">{item.current_stock}</td>
                                    <td className="text-muted">{item.unit}</td>
                                    <td className="td-amount">{item.reorder_threshold}</td>
                                    <td>
                                        {isLow 
                                            ? <span className="badge badge--red">Low Stock</span> 
                                            : <span className="badge badge--green">Optimal</span>}
                                    </td>
                                    <td>
                                        {item.warehouse_stock > 0 && (
                                            <button 
                                                className="btn btn--sm btn--primary"
                                                onClick={() => setTransferModal({ show: true, item, qty: 1 })}
                                            >
                                                Transfer to Store
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Pagination page={page} total={inventory.total} perPage={15} onChange={setPage} />

            {/* Transfer Modal */}
            {transferModal.show && transferModal.item && (
                <div className="modal-backdrop">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Transfer to Storefront</h3>
                            <button className="modal-close" onClick={() => setTransferModal({ show: false, item: null, qty: 1 })}>×</button>
                        </div>
                        <div className="modal-body">
                            <p className="mb-3">
                                Transfer stock for <strong>{transferModal.item.name}</strong> 
                                {transferModal.item.is_variant ? ` (${transferModal.item.size}/${transferModal.item.color})` : ''} 
                                from Warehouse to Storefront.
                            </p>
                            
                            <div className="form-group mb-3">
                                <label className="form-label">Available in Warehouse</label>
                                <input type="number" className="form-control" value={transferModal.item.warehouse_stock} disabled />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Quantity to Transfer</label>
                                <input 
                                    type="number" 
                                    className="form-control" 
                                    min="1" 
                                    value={transferModal.qty}
                                    onChange={(e) => setTransferModal({ ...transferModal, qty: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="modal-footer d-flex justify-end gap-2">
                            <button 
                                className="btn btn--secondary" 
                                onClick={() => setTransferModal({ show: false, item: null, qty: 1 })}
                                disabled={transferLoading}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleTransfer}
                                disabled={transferLoading}
                            >
                                {transferLoading ? 'Transferring...' : 'Confirm Transfer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
