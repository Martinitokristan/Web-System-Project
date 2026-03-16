import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import FilterBar from '../shared/FilterBar';
import Pagination from '../shared/Pagination';
import Modal from '../shared/Modal';

export default function SupplierCatalog() {
    const { showToast } = useToast();
    const [products, setProducts] = useState({ data: [], total: 0 });
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [supplierFilter, setSupplierFilter] = useState('');
    const [promotedOnly, setPromotedOnly] = useState(false);
    const [viewProduct, setViewProduct] = useState(null);
    const [orderQty, setOrderQty] = useState(1);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => { fetchProducts(); }, [page, search, categoryFilter, supplierFilter, promotedOnly]);
    useEffect(() => {
        axios.get('/categories').then(r => setCategories(r.data.data || [])).catch(() => {});
        axios.get('/suppliers').then(r => {
            const d = r.data.data;
            setSuppliers(Array.isArray(d) ? d : d?.data || []);
        }).catch(() => {});
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = { page, per_page: 20 };
            if (search) params.search = search;
            if (categoryFilter) params.category_id = categoryFilter;
            if (supplierFilter) params.supplier_id = supplierFilter;
            if (promotedOnly) params.promoted = 1;
            const res = await axios.get('/supplier-catalog', { params });
            setProducts(res.data.data);
        } catch (e) {
            showToast('Failed to load supplier catalog', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOrder = async () => {
        if (!viewProduct || orderQty < (viewProduct.min_order_qty || 1)) {
            showToast('Please enter a valid quantity.', 'error');
            return;
        }
        setActionLoading(true);
        try {
            await axios.post('/purchase-orders', {
                supplier_id: viewProduct.supplier_id,
                items: [{
                    supplier_product_id: viewProduct.id,
                    quantity: orderQty,
                    unit_cost: viewProduct.price
                }]
            });
            showToast('Order request sent to supplier!', 'success');
            setViewProduct(null);
            setOrderQty(1);
        } catch (e) {
            showToast(e.response?.data?.message || 'Failed to place order.', 'error');
        } finally {
            setActionLoading(false);
        }
    };


    return (
        <div>
            <div className="page-header mb-2">
                <h2 className="page-title">Supplier Product Catalog</h2>
                <p style={{ color: 'var(--text2)', fontSize: '0.875rem', marginTop: 4 }}>
                    Browse products promoted by your suppliers. Create POs directly from here.
                </p>
            </div>

            <FilterBar
                search={search}
                onSearchChange={v => { setSearch(v); setPage(1); }}
                filters={[
                    {
                        value: categoryFilter,
                        onChange: v => { setCategoryFilter(v); setPage(1); },
                        options: [
                            { value: '', label: 'All Categories' },
                            ...categories.map(c => ({ value: c.id, label: c.name }))
                        ]
                    },
                    {
                        value: supplierFilter,
                        onChange: v => { setSupplierFilter(v); setPage(1); },
                        options: [
                            { value: '', label: 'All Suppliers' },
                            ...suppliers.map(s => ({ value: s.id, label: s.name }))
                        ]
                    },
                ]}
            />

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                    <input type="checkbox" checked={promotedOnly}
                        onChange={e => { setPromotedOnly(e.target.checked); setPage(1); }}
                        style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
                    Show Promoted Products Only
                </label>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div>
            ) : products.data?.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '4rem 2rem', background: 'var(--surface)',
                    borderRadius: 16, border: '1px solid var(--border)'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏪</div>
                    <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No Supplier Products Found</h3>
                    <p style={{ color: 'var(--text2)' }}>Suppliers haven't added any products yet.</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: '1.25rem',
                }}>
                    {products.data.map(p => (
                        <div key={p.id} onClick={() => setViewProduct(p)} style={{
                            background: 'var(--surface)', borderRadius: 16,
                            border: p.is_promoted ? '2px solid var(--accent)' : '1px solid var(--border)',
                            overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: p.is_promoted ? '0 4px 20px rgba(255,107,53,0.12)' : '0 2px 8px rgba(0,0,0,0.04)',
                        }}>
                            <div style={{
                                height: 180, background: 'var(--surface2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                position: 'relative', overflow: 'hidden',
                            }}>
                                {p.image_path ? (
                                    <img src={`/storage/${p.image_path}`} alt={p.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontSize: '3rem', opacity: 0.3 }}>📦</span>
                                )}
                                {p.is_promoted && (
                                    <div style={{
                                        position: 'absolute', top: 0, left: 0, right: 0,
                                        background: 'linear-gradient(135deg, var(--accent), #ff8f66)',
                                        color: '#fff', textAlign: 'center', padding: '4px 0',
                                        fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
                                    }}>PROMOTED BY SUPPLIER</div>
                                )}
                            </div>
                            <div style={{ padding: '1rem 1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{p.name}</div>
                                </div>
                                <div style={{ color: 'var(--text2)', fontSize: '0.8rem', marginBottom: 6 }}>
                                    {p.supplier?.name || 'Unknown Supplier'}
                                </div>
                                <div style={{ color: 'var(--text2)', fontSize: '0.8rem', marginBottom: 8 }}>
                                    {p.category?.name || 'Uncategorized'} • {p.variants?.length || 0} variant{p.variants?.length !== 1 ? 's' : ''}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '1.15rem' }}>
                                        ₱{Number(p.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                    {p.min_order_qty > 1 && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text2)', fontWeight: 500 }}>
                                            Min: {p.min_order_qty} units
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Pagination page={page} total={products.total} perPage={20} onChange={setPage} />

            {/* Product Detail Modal */}
            <Modal isOpen={!!viewProduct} onClose={() => setViewProduct(null)}
                title={viewProduct?.name || 'Product Details'} size="lg" hideFooter>
                {viewProduct && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div style={{
                                borderRadius: 12, overflow: 'hidden', background: 'var(--surface2)',
                                height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {viewProduct.image_path ? (
                                    <img src={`/storage/${viewProduct.image_path}`} alt={viewProduct.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontSize: '4rem', opacity: 0.2 }}>📦</span>
                                )}
                            </div>
                            <div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supplier</div>
                                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{viewProduct.supplier?.name}</div>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</div>
                                    <div>{viewProduct.category?.name || 'Uncategorized'}</div>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Base Price</div>
                                    <div style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--accent)' }}>
                                        ₱{Number(viewProduct.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Min Order Qty</div>
                                    <div>{viewProduct.min_order_qty || 1} units</div>
                                </div>
                                {viewProduct.sku && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>SKU</div>
                                        <div className="font-semi">{viewProduct.sku}</div>
                                    </div>
                                )}
                                {viewProduct.description && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Description</div>
                                        <p className="product-description" style={{ color: 'var(--text)', lineHeight: 1.6 }}>{viewProduct.description}</p>
                                    </div>
                                )}
                                <div className="order-actions-box mt-4 p-3 bg-light rounded" style={{
                                    background: 'var(--surface2)', borderRadius: 12, padding: '1rem', marginTop: '1.5rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem', display: 'block' }}>Quantity to Order</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                min={viewProduct.min_order_qty || 1}
                                                value={orderQty}
                                                onChange={(e) => setOrderQty(parseInt(e.target.value) || 1)}
                                                style={{
                                                    width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border)',
                                                    borderRadius: 8, background: 'var(--input-bg)', color: 'var(--text)',
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: 2, display: 'flex', alignItems: 'flex-end' }}>
                                            <button
                                                className="btn btn--primary"
                                                onClick={handleOrder}
                                                disabled={actionLoading}
                                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 8 }}
                                            >
                                                {actionLoading ? 'Sending...' : `Order from Supplier (₱${(viewProduct.price * orderQty).toLocaleString(undefined, { minimumFractionDigits: 2 })})`}
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* Variants */}
                        {viewProduct.variants?.length > 0 && (
                            <div style={{ marginTop: '1.5rem' }}>
                                <h4 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Available Variants</h4>
                                <div className="table-wrap">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Size</th>
                                                <th>Color</th>
                                                <th>Weight</th>
                                                <th>Stock</th>
                                                <th>Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewProduct.variants.map(v => (
                                                <tr key={v.id}>
                                                    <td>{v.size || '-'}</td>
                                                    <td>
                                                        {v.color ? (
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <span style={{
                                                                    width: 14, height: 14, borderRadius: '50%',
                                                                    background: v.color.startsWith('#') ? v.color : v.color,
                                                                    border: '1px solid var(--border)', flexShrink: 0,
                                                                }} />
                                                                {v.color}
                                                            </span>
                                                        ) : '-'}
                                                    </td>
                                                    <td>{v.weight || '-'}</td>
                                                    <td>
                                                        <span className={`badge ${v.stock > 0 ? 'badge--green' : 'badge--red'}`}>
                                                            {v.stock > 0 ? `${v.stock} in stock` : 'Out of stock'}
                                                        </span>
                                                    </td>
                                                    <td className="font-bold">
                                                        {v.price_override ? `₱${Number(v.price_override).toFixed(2)}` : 'Base price'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn--ghost" onClick={() => setViewProduct(null)}>Close</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
