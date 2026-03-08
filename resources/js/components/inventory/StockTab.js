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

    const [transferModal, setTransferModal] = useState({ show: false, item: null, qty: '1' }); // Qty as string to handle inputs
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

        if (!transferModal.item || isNaN(qty) || qty < 1 || qty > available) {
            showToast('Invalid transfer quantity', 'error');
            return;
        }

        setTransferLoading(true);
        try {
            await axios.post('/inventory/transfer', {
                product_id: transferModal.item.product_id,
                variant_id: transferModal.item.variant_id || null,
                quantity: qty,
            });
            showToast('Stock transferred to storefront successfully!');
            setTransferModal({ show: false, item: null, qty: '1' });
            triggerRefresh();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to transfer stock', 'error');
        } finally {
            setTransferLoading(false);
        }
    };

    const formatNum = (num) => Number(num || 0).toLocaleString();

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
                                    <td className="font-bold text-orange">{formatNum(item.warehouse_stock)}</td>
                                    <td className="font-bold text-lg">{formatNum(item.current_stock)}</td>
                                    <td className="text-muted">{item.unit}</td>
                                    <td className="td-amount">{formatNum(item.reorder_threshold)}</td>
                                    <td>
                                        {isLow 
                                            ? <span className="badge badge--red">Low Stock</span> 
                                            : <span className="badge badge--green">Optimal</span>}
                                    </td>
                                    <td>
                                        {item.warehouse_stock > 0 && (
                                            <button 
                                                className="btn btn--sm btn--primary"
                                                onClick={() => setTransferModal({ show: true, item, qty: '1' })}
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

            <Modal 
                isOpen={transferModal.show} 
                onClose={() => setTransferModal({ show: false, item: null, qty: '1' })} 
                title="Transfer to Storefront"
                size="sm"
            >
                {transferModal.item && (
                    <div className="po-create-form" style={{padding: 0}}>
                        <p className="mb-4 text-sm leading-relaxed">
                            Moving stock for <strong className="text-primary">{transferModal.item.name}</strong> 
                            {transferModal.item.is_variant ? ` (${transferModal.item.size}/${transferModal.item.color})` : ''} 
                            from Warehouse to Storefront.
                        </p>
                        
                        <div className="bg-surface2 p-3 border-radius-lg mb-4">
                            <label className="text-xs font-bold text-muted uppercase d-block mb-1">Available in Warehouse</label>
                            <div className="text-xl font-bold">{formatNum(transferModal.item.warehouse_stock)} <small className="text-muted">{transferModal.item.unit}</small></div>
                        </div>

                        <div className="form-group mb-4">
                            <label className="form-label">Quantity to Transfer</label>
                            <input 
                                type="number" 
                                className="form-control form-control-lg w-full" 
                                min="1" 
                                max={transferModal.item.warehouse_stock}
                                value={transferModal.qty}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    // Handle leading zeros and empty string
                                    if (val === '') {
                                        setTransferModal({ ...transferModal, qty: '' });
                                    } else {
                                        const num = parseInt(val);
                                        setTransferModal({ ...transferModal, qty: isNaN(num) ? '1' : num.toString() });
                                    }
                                }}
                                onBlur={() => {
                                    if (transferModal.qty === '' || parseInt(transferModal.qty) < 1) {
                                        setTransferModal({ ...transferModal, qty: '1' });
                                    }
                                }}
                            />
                        </div>

                        <div className="d-flex gap-2">
                            <button 
                                className="btn btn--ghost flex-1" 
                                onClick={() => setTransferModal({ show: false, item: null, qty: '1' })}
                                disabled={transferLoading}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-primary flex-1" 
                                onClick={handleTransfer}
                                disabled={transferLoading || !transferModal.qty}
                            >
                                {transferLoading ? 'Transferring...' : 'Confirm Transfer'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
