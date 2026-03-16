import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import FilterBar from '../shared/FilterBar';
import Pagination from '../shared/Pagination';
import Modal from '../shared/Modal';

export default function SupplierProducts() {
    const { showToast } = useToast();
    const [products, setProducts] = useState({ data: [], total: 0 });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: '', sku: '', description: '', category_id: '',
        price: '', min_order_qty: '1', is_promoted: false, image: null,
    });
    const [variants, setVariants] = useState([]);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => { fetchProducts(); }, [page, search, categoryFilter]);
    useEffect(() => { fetchCategories(); }, []);

    const fetchCategories = async () => {
        try {
            const res = await axios.get('/supplier/categories');
            setCategories(res.data.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = { page, per_page: 15 };
            if (search) params.search = search;
            if (categoryFilter) params.category_id = categoryFilter;
            const res = await axios.get('/supplier/products', { params });
            setProducts(res.data.data);
        } catch (e) {
            showToast('Failed to load products', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', sku: '', description: '', category_id: '', price: '', min_order_qty: '1', is_promoted: false, image: null });
        setVariants([]);
        setImagePreview(null);
        setFormOpen(true);
    };

    const openEdit = (product) => {
        setEditing(product);
        setForm({
            name: product.name, sku: product.sku || '', description: product.description || '',
            category_id: product.category_id || '', price: product.price,
            min_order_qty: product.min_order_qty || '1', is_promoted: product.is_promoted, image: null,
        });
        setVariants((product.variants || []).map(v => ({
            size: v.size || '', color: v.color || '', weight: v.weight || '',
            stock: v.stock || 0, price_override: v.price_override || '', sku_suffix: v.sku_suffix || '',
        })));
        setImagePreview(product.image_path ? `/storage/${product.image_path}` : null);
        setFormOpen(true);
    };

    const addVariant = () => {
        setVariants(prev => [...prev, { size: '', color: '', weight: '', stock: 0, price_override: '', sku_suffix: '' }]);
    };

    const removeVariant = (idx) => {
        setVariants(prev => prev.filter((_, i) => i !== idx));
    };

    const updateVariant = (idx, field, val) => {
        setVariants(prev => prev.map((v, i) => i === idx ? { ...v, [field]: val } : v));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setForm({ ...form, image: file });
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setImagePreview(ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('name', form.name);
            fd.append('sku', form.sku);
            fd.append('description', form.description);
            if (form.category_id) fd.append('category_id', form.category_id);
            fd.append('price', form.price);
            fd.append('min_order_qty', form.min_order_qty);
            fd.append('is_promoted', form.is_promoted ? '1' : '0');
            if (form.image) fd.append('image', form.image);
            if (variants.length > 0) fd.append('variants', JSON.stringify(variants));

            if (editing) {
                fd.append('_method', 'PUT');
                await axios.post(`/supplier/products/${editing.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                showToast('Product updated!', 'success');
            } else {
                await axios.post('/supplier/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                showToast('Product created!', 'success');
            }
            setFormOpen(false);
            fetchProducts();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to save product', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await axios.delete(`/supplier/products/${deleteConfirm.id}`);
            showToast('Product deleted', 'success');
            setDeleteConfirm(null);
            fetchProducts();
        } catch (err) {
            showToast('Failed to delete product', 'error');
        }
    };

    // FULLSCREEN PRODUCT FORM
    if (formOpen) {
        return (
            <div style={{ padding: 0 }}>
                {/* Form Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem',
                }}>
                    <div>
                        <button type="button" onClick={() => !submitting && setFormOpen(false)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 600, fontSize: '0.85rem', padding: 0, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            ← Back to Products
                        </button>
                        <h2 style={{ fontWeight: 800, fontSize: '1.5rem', margin: 0 }}>
                            {editing ? 'Edit Product' : 'Add New Product'}
                        </h2>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        {editing && (
                            <button type="button" className="btn btn--danger btn--sm"
                                onClick={() => { setFormOpen(false); setDeleteConfirm(editing); }}>
                                Delete
                            </button>
                        )}
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setFormOpen(false)} disabled={submitting}>Cancel</button>
                        <button type="button" className="btn btn-primary btn--sm" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Saving...' : (editing ? 'Update Product' : 'Create Product')}
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem' }}>
                        {/* Left: Form Fields */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Basic Info */}
                            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>Product Information</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                                        <label>Product Name *</label>
                                        <input type="text" required value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter product name" />
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>SKU</label>
                                        <input type="text" value={form.sku}
                                            onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="Auto-generated if empty" />
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>Category</label>
                                        <select value={form.category_id}
                                            onChange={e => setForm({ ...form, category_id: e.target.value })}>
                                            <option value="">Select Category</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                                        <label>Description</label>
                                        <textarea rows="4" value={form.description}
                                            onChange={e => setForm({ ...form, description: e.target.value })}
                                            placeholder="Describe your product features, materials, etc." />
                                    </div>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>Pricing & Quantity</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>Base Price (₱) *</label>
                                        <input type="number" step="0.01" required value={form.price}
                                            onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label>Min Order Qty</label>
                                        <input type="number" min="1" value={form.min_order_qty}
                                            onChange={e => setForm({ ...form, min_order_qty: e.target.value })} />
                                    </div>
                                    <div className="form-group" style={{ margin: 0, display: 'flex', alignItems: 'flex-end' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                            <input type="checkbox" checked={form.is_promoted}
                                                onChange={e => setForm({ ...form, is_promoted: e.target.checked })}
                                                style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} />
                                            Promote to Admin
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Variants */}
                            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>Product Variants</h3>
                                    <button type="button" className="btn btn--sm btn--outline-primary" onClick={addVariant}>+ Add Variant</button>
                                </div>

                                {variants.length === 0 ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: 10, border: '1px dashed #e2e8f0' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>No variants added yet. Add variants for size, color, or weight options.</p>
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px 100px 40px', gap: '0.5rem', marginBottom: '0.5rem', padding: '0 0.75rem' }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Size</span>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Color</span>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Weight</span>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Stock</span>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Price</span>
                                            <span></span>
                                        </div>
                                        {variants.map((v, idx) => (
                                            <div key={idx} style={{
                                                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px 100px 40px',
                                                gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem',
                                                padding: '0.75rem', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0',
                                            }}>
                                                <input type="text" placeholder="e.g. 1inch" value={v.size}
                                                    onChange={e => updateVariant(idx, 'size', e.target.value)} style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: 6 }} />
                                                <input type="text" placeholder="e.g. Red" value={v.color}
                                                    onChange={e => updateVariant(idx, 'color', e.target.value)} style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: 6 }} />
                                                <input type="text" placeholder="e.g. 500g" value={v.weight}
                                                    onChange={e => updateVariant(idx, 'weight', e.target.value)} style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: 6 }} />
                                                <input type="number" placeholder="0" value={v.stock}
                                                    onChange={e => updateVariant(idx, 'stock', e.target.value)} style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: 6 }} />
                                                <input type="number" step="0.01" placeholder="₱" value={v.price_override}
                                                    onChange={e => updateVariant(idx, 'price_override', e.target.value)} style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: 6 }} />
                                                <button type="button" onClick={() => removeVariant(idx)} style={{
                                                    width: 32, height: 32, borderRadius: 8, border: '1px solid #fecaca',
                                                    background: '#fef2f2', color: '#ef4444', cursor: 'pointer', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem',
                                                }}>✕</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Image & Preview */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Product Image</h3>
                                <div style={{
                                    width: '100%', aspectRatio: '1', borderRadius: 12,
                                    background: '#f8fafc', border: '2px dashed #e2e8f0',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    overflow: 'hidden', marginBottom: '1rem', position: 'relative',
                                }}>
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📷</div>
                                            <div style={{ fontSize: '0.85rem' }}>Upload product image</div>
                                        </div>
                                    )}
                                </div>
                                <label className="btn btn--ghost w-full justify-center" style={{ cursor: 'pointer', border: '1px solid var(--border)' }}>
                                    Choose Image
                                    <input type="file" accept="image/*" onChange={handleImageChange}
                                        style={{ display: 'none' }} />
                                </label>
                            </div>

                            {/* Status */}
                            {editing && (
                                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '1.5rem' }}>
                                    <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem' }}>Status</h3>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        padding: '0.75rem', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0',
                                    }}>
                                        <span style={{ fontSize: '1.25rem' }}>✅</span>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#16a34a' }}>Active</div>
                                            <div style={{ fontSize: '0.75rem', color: '#4ade80' }}>Product is visible</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        );
    }

    // PRODUCT LIST VIEW
    return (
        <div style={{ padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontWeight: 800, fontSize: '1.5rem', margin: 0 }}>Product Catalog</h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>Manage and organize your products</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>+ Add Product</button>
            </div>

            <FilterBar
                search={search}
                onSearchChange={v => { setSearch(v); setPage(1); }}
                filters={[{
                    value: categoryFilter,
                    onChange: v => { setCategoryFilter(v); setPage(1); },
                    options: [
                        { value: '', label: 'All Categories' },
                        ...categories.map(c => ({ value: c.id, label: c.name }))
                    ]
                }]}
            />

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div>
            ) : products.data?.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '4rem 2rem', background: '#fff',
                    borderRadius: 16, border: '1px solid #e2e8f0',
                }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📦</div>
                    <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.25rem' }}>No Products Yet</h3>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Start adding products to promote to admin buyers.</p>
                    <button className="btn btn-primary" onClick={openCreate}>+ Add Your First Product</button>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: '1rem',
                }}>
                    {products.data.map(p => (
                        <div key={p.id} style={{
                            background: '#fff', borderRadius: 14,
                            border: '1px solid #e2e8f0', overflow: 'hidden',
                            transition: 'all 0.2s', cursor: 'pointer',
                        }} onClick={() => openEdit(p)}>
                            <div style={{
                                height: 160, background: '#f8fafc',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                            }}>
                                {p.image_path ? (
                                    <img src={`/storage/${p.image_path}`} alt={p.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontSize: '2.5rem', opacity: 0.2 }}>📦</span>
                                )}
                                {p.is_promoted && (
                                    <span style={{
                                        position: 'absolute', top: 8, right: 8,
                                        background: 'var(--accent)', color: '#fff',
                                        padding: '3px 8px', borderRadius: 6, fontSize: '0.65rem',
                                        fontWeight: 700, letterSpacing: '0.05em',
                                    }}>PROMOTED</span>
                                )}
                            </div>
                            <div style={{ padding: '1rem 1.25rem' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 3 }}>{p.name}</div>
                                <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginBottom: 8 }}>
                                    {p.category?.name || 'Uncategorized'} • {p.variants?.length || 0} variants
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '1.05rem' }}>
                                        ₱{Number(p.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                    <span style={{
                                        fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                                        background: p.status === 'active' ? '#dcfce7' : '#fef2f2',
                                        color: p.status === 'active' ? '#16a34a' : '#ef4444',
                                    }}>{p.status || 'active'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Pagination page={page} total={products.total} perPage={15} onChange={setPage} />

            {/* Delete Confirm */}
            <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Product?" size="sm" hideFooter>
                <p style={{ marginBottom: '1.5rem' }}>
                    Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn--ghost" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
                    <button className="btn btn--danger" style={{ flex: 1 }} onClick={handleDelete}>Delete</button>
                </div>
            </Modal>
        </div>
    );
}
