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
    const [categoryFilter, setCategoryFilter] = useState('');
    const [categories, setCategories] = useState([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

    // Variant filters
    const [sizeFilter, setSizeFilter] = useState('');
    const [colorFilter, setColorFilter] = useState('');
    const [weightFilter, setWeightFilter] = useState('');
    const [variantMeta, setVariantMeta] = useState({ sizes: [], colors: [], weights: [] });

    const [unitTypes, setUnitTypes] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [transferForm, setTransferForm] = useState({ name: '', sku: '', category_id: '', unit_type_id: '', sell_price: '', description: '' });

    useEffect(() => {
        axios.get('/settings').then(res => {
            setCategories(res.data.data?.categories || []);
            setUnitTypes(res.data.data?.unitTypes || []);
        }).catch(() => {});
        axios.get('/suppliers').then(res => {
            setSuppliers(res.data.data || []);
        }).catch(() => {});
    }, []);

    useEffect(() => {
        let isMounted = true;
        const fetchStock = () => {
            if (!isMounted) return;
            setLoading(true);
            const params = { page, search };
            if (categoryFilter) params.category_id = categoryFilter;
            if (sizeFilter) params.size = sizeFilter;
            if (colorFilter) params.color = colorFilter;
            if (weightFilter) params.weight = weightFilter;
            axios.get('/inventory', { params })
                .then(res => {
                    const paginated = res.data.data;
                    if (isMounted) {
                        setInventory({
                            data: paginated.data || [],
                            total: paginated.total || 0,
                            current_page: paginated.current_page || 1
                        });
                        if (res.data.variant_meta) {
                            setVariantMeta(res.data.variant_meta);
                        }
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
    }, [page, search, categoryFilter, sizeFilter, colorFilter, weightFilter, refreshTrigger]);

    const handleTransfer = async () => {
        const qty = Number(transferModal.qty);
        const available = Number(transferModal.item.warehouse_stock);

        if (!transferModal.item || isNaN(qty) || qty < 1 || qty > available) {
            showToast('Invalid transfer quantity', 'error');
            return;
        }

        setTransferLoading(true);
        try {
            const isOrphan = !transferModal.item.product_id && !transferModal.item.is_variant;
            await axios.post('/inventory/transfer', {
                inventory_id: transferModal.item.raw_id,
                quantity: qty,
                product_data: isOrphan ? transferForm : null
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

    const openTransferModal = (item) => {
        const isOrphan = !item.product_id && !item.is_variant;
        if (isOrphan) {
            setTransferForm({
                name: (item.name || '').replace(' (Warehouse Only)', ''),
                sku: item.sku || '',
                category_id: item.category_id || '',
                unit_type_id: item.unit_type_id || 1,
                sell_price: (item.purchase_price || 0) * 1.2,
                description: item.description || ''
            });
        }
        setTransferModal({ show: true, item, qty: '1' });
    };

    const formatNum = (num) => Number(num || 0).toLocaleString();

    return (
        <div>
            <FilterBar 
                search={search} onSearchChange={v => { setSearch(v); setPage(1); }}
                filters={[
                    {
                        value: categoryFilter, onChange: v => { setCategoryFilter(v); setPage(1); },
                        options: [
                            { value: '', label: 'All Categories' },
                            ...categories.map(c => ({ value: c.id, label: c.name }))
                        ]
                    },
                    ...(variantMeta.sizes?.length > 0 ? [{
                        value: sizeFilter, onChange: v => { setSizeFilter(v); setPage(1); },
                        options: [
                            { value: '', label: 'All Sizes' },
                            ...variantMeta.sizes.map(s => ({ value: s, label: s }))
                        ]
                    }] : []),
                    ...(variantMeta.colors?.length > 0 ? [{
                        value: colorFilter, onChange: v => { setColorFilter(v); setPage(1); },
                        options: [
                            { value: '', label: 'All Colors' },
                            ...variantMeta.colors.map(c => ({ value: c, label: c }))
                        ]
                    }] : []),
                    ...(variantMeta.weights?.length > 0 ? [{
                        value: weightFilter, onChange: v => { setWeightFilter(v); setPage(1); },
                        options: [
                            { value: '', label: 'All Weights' },
                            ...variantMeta.weights.map(w => ({ value: w, label: w }))
                        ]
                    }] : []),
                ]}
            />

            <div className="table-wrap">
                <table className="data-table" style={{ textAlign: 'center' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'center' }}>SKU</th>
                            <th style={{ textAlign: 'left' }}>Product Name</th>
                            <th style={{ textAlign: 'center' }}>Variant</th>
                            <th style={{ textAlign: 'center' }}>Warehouse</th>
                            <th style={{ textAlign: 'center' }}>Storefront</th>
                            <th style={{ textAlign: 'center' }}>Sold</th>
                            <th style={{ textAlign: 'center' }}>Imported</th>
                            <th style={{ textAlign: 'center' }}>Unit</th>
                            <th style={{ textAlign: 'center' }}>Threshold</th>
                            <th style={{ textAlign: 'center' }}>Status</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="11" style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner"/></td></tr>
                        ) : inventory.data.length === 0 ? (
                            <tr><td colSpan="11" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No inventory found</td></tr>
                        ) : inventory.data.map(item => {
                            const isLow = item.current_stock <= item.reorder_threshold;
                            const variantParts = [];
                            if (item.size && item.size !== '-') variantParts.push(item.size);
                            if (item.color && item.color !== '-') variantParts.push(item.color);
                            if (item.weight && item.weight !== '-') variantParts.push(item.weight);
                            const variantLabel = item.is_variant ? (variantParts.join(' / ') || '-') : 'Base Product';

                            return (
                                <tr key={item.id}>
                                    <td style={{ textAlign: 'center', fontSize: '0.82rem', fontWeight: 600 }}>{item.sku}</td>
                                    <td style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{item.supplier}</div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>{variantLabel}</td>
                                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#ea580c' }}>{formatNum(item.warehouse_stock)}</td>
                                    <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.05rem' }}>{formatNum(item.current_stock)}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={{ fontWeight: 600, color: item.total_sold > 0 ? '#16a34a' : '#94a3b8' }}>
                                            {formatNum(item.total_sold)}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={{ fontWeight: 600, color: item.total_imported > 0 ? '#3b82f6' : '#94a3b8' }}>
                                            {formatNum(item.total_imported)}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center', color: '#94a3b8' }}>{item.unit}</td>
                                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{formatNum(item.reorder_threshold)}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        {isLow 
                                            ? <span className="badge badge--red">Low Stock</span> 
                                            : <span className="badge badge--green">Optimal</span>}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {item.warehouse_stock > 0 && (
                                            <button 
                                                className="btn btn--sm btn--primary"
                                                onClick={() => openTransferModal(item)}
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

                        {/* Orphan Product Form */}
                        {(!transferModal.item.product_id && !transferModal.item.is_variant) && (
                            <div className="bg-surface p-4 border-radius-lg border mb-4">
                                <h4 className="text-sm font-bold mb-3 border-bottom pb-2">Setup Storefront Product Details</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="form-group col-span-2">
                                        <label className="text-xs font-bold uppercase mb-1 d-block">Store Name</label>
                                        <input type="text" className="form-control w-full" value={transferForm.name}
                                            onChange={e => setTransferForm({...transferForm, name: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label className="text-xs font-bold uppercase mb-1 d-block">SKU</label>
                                        <input type="text" className="form-control w-full" value={transferForm.sku}
                                            onChange={e => setTransferForm({...transferForm, sku: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label className="text-xs font-bold uppercase mb-1 d-block">Category</label>
                                        <select className="form-control w-full" value={transferForm.category_id}
                                            onChange={e => setTransferForm({...transferForm, category_id: e.target.value})}>
                                            <option value="">Select Category</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="text-xs font-bold uppercase mb-1 d-block">Unit Type</label>
                                        <select className="form-control w-full" value={transferForm.unit_type_id}
                                            onChange={e => setTransferForm({...transferForm, unit_type_id: e.target.value})}>
                                            <option value="">Select Unit</option>
                                            {unitTypes.map(u => <option key={u.id} value={u.id}>{u.purchase_unit} / {u.sell_unit}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="text-xs font-bold uppercase mb-1 d-block">Selling Price (₱)</label>
                                        <input type="number" step="0.01" className="form-control w-full" value={transferForm.sell_price}
                                            onChange={e => setTransferForm({...transferForm, sell_price: e.target.value})} />
                                    </div>
                                    <div className="form-group col-span-2">
                                        <label className="text-xs font-bold uppercase mb-1 d-block">Description</label>
                                        <textarea className="form-control w-full" rows="2" value={transferForm.description}
                                            onChange={e => setTransferForm({...transferForm, description: e.target.value})}></textarea>
                                    </div>
                                </div>
                            </div>
                        )}

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
