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

    // Create PO Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [createLoading, setCreateLoading] = useState(false);
    const [productsLoading, setProductsLoading] = useState(false);
    const [poForm, setPoForm] = useState({
        supplier_id: '',
        items: []
    });

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

    // Fetch suppliers and products when create modal opens
    useEffect(() => {
        let isMounted = true;
        if (showCreateModal) {
            const fetchData = async () => {
                setProductsLoading(true);
                try {
                    console.log('Fetching suppliers and products for PO creation...');
                    const [suppliersRes, productsRes] = await Promise.all([
                        axios.get('/suppliers', { params: { no_pagination: 1 } }),
                        axios.get('/products')
                    ]);
                    
                    console.log('Suppliers API response:', suppliersRes.data);
                    console.log('Products API response:', productsRes.data);
                    
                    if (isMounted) {
                        // Handle suppliers data - could be direct array or nested in .data
                        let suppliersData = suppliersRes.data.data || suppliersRes.data || [];
                        if (!Array.isArray(suppliersData)) {
                            suppliersData = [];
                        }
                        
                        // Handle products data - products API returns paginated structure
                        // productsRes.data = { data: { data: [...], meta: {...} }, status: 'success' }
                        let productsData = [];
                        const productsResponse = productsRes.data;
                        
                        if (productsResponse.data && Array.isArray(productsResponse.data)) {
                            // Direct array: productsRes.data.data = [...]
                            productsData = productsResponse.data;
                        } else if (productsResponse.data && productsResponse.data.data && Array.isArray(productsResponse.data.data)) {
                            // Nested array: productsRes.data.data.data = [...]
                            productsData = productsResponse.data.data;
                        } else if (Array.isArray(productsResponse)) {
                            // Direct response: productsRes.data = [...]
                            productsData = productsResponse;
                        }
                        
                        console.log('Extracted suppliers:', suppliersData);
                        console.log('Extracted products:', productsData);
                        console.log('Is suppliers array?', Array.isArray(suppliersData));
                        console.log('Is products array?', Array.isArray(productsData));
                        
                        setSuppliers(suppliersData);
                        setProducts(productsData);
                    }
                } catch (err) {
                    console.error('Failed to fetch data for PO creation:', err);
                    console.error('Error details:', err.response?.data || err.message);
                    if (isMounted) {
                        showToast('Failed to load suppliers or products', 'error');
                    }
                } finally {
                    if (isMounted) {
                        setProductsLoading(false);
                    }
                }
            };
            fetchData();
        }
        return () => { 
            isMounted = false;
            setProductsLoading(false);
        };
    }, [showCreateModal]);

    const handleAction = async (poId, action) => {
        const confirmMsg = action === 'approve' 
            ? 'Approve this PO?' 
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

    // Create PO Item Management Functions
    const addItem = () => {
        setPoForm({
            ...poForm,
            items: [...poForm.items, {
                product_id: '',
                product_variant_id: '', // Added variant selection
                quantity: 1,
                unit_cost: 0
            }]
        });
    };

    const updateItem = (index, field, value) => {
        const updatedItems = [...poForm.items];
        updatedItems[index][field] = value;
        
        // If product changes, reset variant
        if (field === 'product_id') {
            updatedItems[index]['product_variant_id'] = '';
        }
        
        setPoForm({ ...poForm, items: updatedItems });
    };

    const removeItem = (index) => {
        setPoForm({
            ...poForm,
            items: poForm.items.filter((_, i) => i !== index)
        });
    };

    const calculateTotal = () => {
        return poForm.items.reduce((sum, item) => {
            return sum + (Number(item.quantity) * Number(item.unit_cost));
        }, 0);
    };

    const submitPO = async () => {
        // Validation
        if (!poForm.supplier_id) {
            showToast('Please select a supplier', 'error');
            return;
        }
        if (poForm.items.length === 0) {
            showToast('Please add at least one item', 'error');
            return;
        }
        const invalidItems = poForm.items.filter(item =>
            !item.product_id || item.quantity <= 0 || item.unit_cost <= 0
        );
        if (invalidItems.length > 0) {
            showToast('All items must have a product, quantity > 0, and cost > 0', 'error');
            return;
        }

        setCreateLoading(true);
        try {
            await axios.post('/purchase-orders', {
                supplier_id: poForm.supplier_id,
                items: poForm.items.map(item => ({
                    product_id: item.product_id,
                    product_variant_id: item.product_variant_id || null, // Send variant
                    quantity: Number(item.quantity),
                    unit_cost: Number(item.unit_cost)
                }))
            });
            showToast('Purchase Order created successfully!');
            setShowCreateModal(false);
            setPoForm({ supplier_id: '', items: [] });
            triggerRefresh();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to create Purchase Order', 'error');
        } finally {
            setCreateLoading(false);
        }
    };

    const resetCreateForm = () => {
        setPoForm({ supplier_id: '', items: [] });
        setShowCreateModal(false);
    };

    // Debug function to test dropdown
    const debugDropdown = () => {
        console.log('=== PO Form Debug Info ===');
        console.log('showCreateModal:', showCreateModal);
        console.log('productsLoading:', productsLoading);
        console.log('suppliers:', suppliers);
        console.log('products:', products);
        console.log('poForm:', poForm);
        console.log('========================');
    };

    // Call debug function when modal opens
    useEffect(() => {
        if (showCreateModal) {
            setTimeout(debugDropdown, 1000); // Debug after 1 second
        }
    }, [showCreateModal, products, suppliers]);

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
                                { value: 'pending',            label: 'Pending (Draft)' },
                                { value: 'pending_supplier',   label: 'Sent to Supplier' },
                                { value: 'accepted',           label: 'Accepted by Supplier' },
                                { value: 'rejected',           label: 'Rejected by Supplier' },
                                { value: 'supplier_delivered', label: 'Delivered by Supplier' },
                                { value: 'received',           label: 'Received (Stock Added)' },
                            ]
                        }
                    ]}
                />
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    Create Purchase Order
                </button>
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
                                <td className="font-bold text-red">₱{Number(po.total_amount).toFixed(2)}</td>
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

            <Modal isOpen={!!viewPo} onClose={() => setViewPo(null)} title={`Purchase Order ${viewPo?.po_number}`} size="md">
                {viewPo && (
                    <div>
                        {console.log('DEBUG: Modal opened, viewPo:', viewPo)}
                        {console.log('DEBUG: viewPo.status:', viewPo.status, 'type:', typeof viewPo.status)}
                        <div className="d-flex justify-between mb-3 p-3 bg-surface2 rounded" style={{borderRadius: 8}}>
                            <div>
                                <div className="text-sm text-muted">Supplier</div>
                                <div className="font-semi">{viewPo.supplier?.name}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-muted">Status</div>
                                <StatusBadge status={viewPo.status} />
                            </div>
                        </div>

                        <h4 className="section-title mb-2">Requested Items</h4>
                        <div className="table-wrap mb-4">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Qty</th>
                                        <th>Unit Cost</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewPo.items?.map(i => {
                                        const variant = i.product_variant;
                                        const variantLabel = variant 
                                            ? `(${variant.size_value?.label || ''} ${variant.color_value?.label || ''})`.trim()
                                            : '';
                                        return (
                                            <tr key={i.id}>
                                                <td>
                                                    {i.product?.name} 
                                                    {variantLabel && <span className="ml-1 text-sm font-semi text-primary">{variantLabel}</span>}
                                                    <span className="text-sm text-muted ml-1">({i.product?.sku})</span>
                                                </td>
                                                <td className="font-bold">{i.quantity}</td>
                                                <td>₱{Number(i.unit_cost).toFixed(2)}</td>
                                                <td className="font-semi">₱{Number(i.subtotal).toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                    <tr>
                                        <td colSpan="3" className="text-right font-semi">Total PO Cost:</td>
                                        <td className="font-bold text-lg text-red">₱{Number(viewPo.total_amount).toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Rejection Reason — shown prominently at top if rejected */}
                        {viewPo.status === 'rejected' && viewPo.rejection_reason && (
                            <div className="mb-3 p-3 rounded" style={{borderRadius: 8, background: '#fef2f2', borderLeft: '4px solid #ef4444'}}>
                                <div className="font-semi mb-1" style={{color:'#ef4444'}}>⚠ Supplier Rejected this PO</div>
                                <div className="text-sm text-muted mb-1">Reason from supplier:</div>
                                <div className="text-sm" style={{whiteSpace: 'pre-wrap'}}>{viewPo.rejection_reason}</div>
                            </div>
                        )}

                        <div className="d-flex gap-2">
                            {viewPo.status === 'pending' && (
                                <button className="btn btn-primary flex-1 justify-center" disabled={actionLoading} onClick={() => handleAction(viewPo.id, 'approve')}>
                                    ✉ Send to Supplier
                                </button>
                            )}
                            {viewPo.status === 'pending_supplier' && (
                                <div className="text-center text-muted flex-1">
                                    <p>⏳ Waiting for supplier to accept or reject...</p>
                                </div>
                            )}
                            {viewPo.status === 'accepted' && (
                                <div className="text-center flex-1" style={{color:'#16a34a'}}>
                                    <p>✔ Supplier accepted — awaiting delivery.</p>
                                </div>
                            )}
                            {viewPo.status === 'rejected' && (
                                <div className="text-center text-muted flex-1">
                                    <p>You may create a new PO to reorder from another supplier.</p>
                                </div>
                            )}
                            {viewPo.status === 'supplier_delivered' && (
                                <button className="btn btn--green flex-1 justify-center" disabled={actionLoading} onClick={() => handleAction(viewPo.id, 'receive')}>
                                    Mark as Received (Add to Stock)
                                </button>
                            )}
                        </div>

                        {/* Delivery Info */}
                        {viewPo.status === 'supplier_delivered' && viewPo.delivered_at && (
                            <div className="mt-3 p-3 bg-surface2 rounded" style={{borderRadius: 8, borderLeft: '4px solid #f97316'}}>
                                <div className="text-sm text-muted mb-1">Delivery Information</div>
                                <div className="font-semi">Delivered: {new Date(viewPo.delivered_at).toLocaleString()}</div>
                                {viewPo.delivery_notes && (
                                    <div className="text-sm mt-2"><strong>Notes:</strong> {viewPo.delivery_notes}</div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Create PO Modal */}
            <Modal isOpen={showCreateModal} onClose={resetCreateForm} title="Create Purchase Order" size="lg">
                <div className="po-create-form">
                    {/* Supplier Selection */}
                    <div className="form-group mb-3">
                        <label className="form-label">Supplier *</label>
                        <select 
                            className="form-control"
                            value={poForm.supplier_id}
                            onChange={(e) => setPoForm({...poForm, supplier_id: e.target.value})}
                            disabled={productsLoading}
                        >
                            <option value="">
                                {productsLoading ? 'Loading suppliers...' : 'Select a supplier...'}
                            </option>
                            {!productsLoading && suppliers.length === 0 && (
                                <option value="">No suppliers available</option>
                            )}
                            {!productsLoading && suppliers.map(supplier => (
                                <option key={supplier.id} value={supplier.id}>
                                    {supplier.name}
                                </option>
                            ))}
                        </select>
                        {productsLoading && (
                            <div className="text-xs text-muted mt-1">Loading suppliers...</div>
                        )}
                        {!productsLoading && suppliers.length === 0 && (
                            <div className="text-xs text-danger mt-1">No suppliers found. Please add suppliers first.</div>
                        )}
                    </div>

                    {/* Items Section */}
                    <div className="po-items-section mb-3">
                        <div className="d-flex justify-between align-center mb-2">
                            <h4 className="section-title">Order Items</h4>
                            <button 
                                type="button"
                                className="btn btn--sm btn--secondary"
                                onClick={addItem}
                            >
                                + Add Item
                            </button>
                        </div>

                        {poForm.items.length === 0 && (
                            <div className="text-center py-3 text-muted">
                                No items added. Click "Add Item" to add products.
                            </div>
                        )}

                        {poForm.items.map((item, index) => (
                            <div key={index} className="po-item-row">
                                <div className="po-item-product">
                                    <select
                                        className="form-control"
                                        value={item.product_id}
                                        onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                                        disabled={productsLoading}
                                    >
                                        <option value="">
                                            {productsLoading ? 'Loading products...' : 'Select product...'}
                                        </option>
                                        {!productsLoading && products.length === 0 && (
                                            <option value="">No products available</option>
                                        )}
                                        {!productsLoading && products.map(product => (
                                            <option key={product.id} value={product.id}>
                                                {product.name} ({product.sku})
                                            </option>
                                        ))}
                                    </select>
                                    {productsLoading && (
                                        <div className="text-xs text-muted mt-1">Loading products...</div>
                                    )}
                                    {!productsLoading && products.length === 0 && (
                                        <div className="text-xs text-danger mt-1">No products found. Please check your product catalog.</div>
                                    )}
                                </div>
                                
                                <div className="po-item-variant flex-1" style={{minWidth: '150px'}}>
                                    {(() => {
                                        const selectedProduct = products.find(p => String(p.id) === String(item.product_id));
                                        const hasVariants = selectedProduct?.product_variants?.length > 0;
                                        
                                        if (hasVariants) {
                                            return (
                                                <select
                                                    className="form-control"
                                                    value={item.product_variant_id}
                                                    onChange={(e) => updateItem(index, 'product_variant_id', e.target.value)}
                                                >
                                                    <option value="">Select Variant...</option>
                                                    {selectedProduct.product_variants.map(v => (
                                                        <option key={v.id} value={v.id}>
                                                            {v.size_value?.label || ''} {v.color_value?.label || ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            );
                                        }
                                        return (
                                            <select className="form-control" disabled>
                                                <option>No variants</option>
                                            </select>
                                        );
                                    })()}
                                </div>
                                <div className="po-item-qty">
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Qty"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                    />
                                </div>
                                <div className="po-item-cost">
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Cost"
                                        min="0"
                                        step="0.01"
                                        value={item.unit_cost}
                                        onChange={(e) => updateItem(index, 'unit_cost', e.target.value)}
                                    />
                                </div>
                                <div className="po-item-subtotal">
                                    ₱{(Number(item.quantity) * Number(item.unit_cost)).toFixed(2)}
                                </div>
                                <div className="po-item-action">
                                    <button 
                                        type="button"
                                        className="btn btn--sm btn--danger"
                                        onClick={() => removeItem(index)}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Total */}
                    <div className="po-total mb-3">
                        <div className="d-flex justify-between">
                            <span>Total Items: {poForm.items.length}</span>
                            <span className="font-bold text-lg">Total: ₱{calculateTotal().toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="d-flex gap-2">
                        <button 
                            type="button"
                            className="btn btn--secondary flex-1"
                            onClick={resetCreateForm}
                            disabled={createLoading}
                        >
                            Cancel
                        </button>
                        <button 
                            type="button"
                            className="btn btn-primary flex-1"
                            onClick={submitPO}
                            disabled={createLoading}
                        >
                            {createLoading ? 'Creating...' : 'Create Purchase Order'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
