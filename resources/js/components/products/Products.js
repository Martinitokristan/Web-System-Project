import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import FilterBar from '../shared/FilterBar';
import Pagination from '../shared/Pagination';
import ConfirmModal from '../shared/ConfirmModal';
import ProductForm from './ProductForm';

export default function Products() {
    const [products, setProducts] = useState({ data: [], total: 0, current_page: 1 });
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [unitTypes, setUnitTypes] = useState([]);
    const [allVariants, setAllVariants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);
    
    // Filters & Pagination
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    
    // View: 'list' | 'form'
    const [view, setView] = useState('list');
    const [editingProduct, setEditingProduct] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const { showToast } = useToast();

    const openCreate = () => { setEditingProduct(null); setView('form'); };
    const openEdit   = (p) => { setEditingProduct(p);    setView('form'); };
    const closeForm  = () => { setEditingProduct(null); setView('list'); };

    useEffect(() => {
        let isMounted = true;
        const fetchDependencies = async () => {
            try {
                const [cats, sups, units, settingsData] = await Promise.all([
                    axios.get('/categories'),
                    axios.get('/suppliers', { params: { no_pagination: 1 } }),
                    axios.get('/unit-types'),
                    axios.get('/settings')
                ]);
                if (isMounted) {
                    setCategories(cats.data.data);
                    setSuppliers(sups.data.data);
                    setUnitTypes(units.data.data);
                    setAllVariants(settingsData.data.data.variants || []);
                }
            } catch (err) {}
        };
        fetchDependencies();
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        let isMounted = true;
        const fetchProds = () => {
            if (!isMounted) return;
            setLoading(true);
            axios.get('/products', { params: { page, search, category_id: categoryFilter } })
                .then(res => {
                    const paginated = res.data.data;
                    if (isMounted) {
                        setProducts({
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
    }, [page, search, categoryFilter, refreshTrigger]);

    const handleEdit = (product) => openEdit(product);

    const handleDelete = async () => {
        try {
            await axios.delete(`/products/${deleteId}`);
            if (showToast) showToast('Product deleted successfully');
            triggerRefresh();
        } catch (err) {
            showToast('Failed to delete product', 'error');
        } finally {
            setDeleteId(null);
        }
    };

    // If form view, render ProductForm filling the content area
    if (view === 'form') {
        return (
            <ProductForm
                product={editingProduct}
                categories={categories}
                suppliers={suppliers}
                unitTypes={unitTypes}
                variants={allVariants}
                onSuccess={() => { closeForm(); triggerRefresh(); }}
                onCancel={closeForm}
            />
        );
    }

    return (
        <div>
            <div className="page-header">
                <h2 className="page-title">Products Masterlist</h2>
                {/* Manual creation removed — products are created via Inventory Transfer */}
            </div>

            <FilterBar 
                search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
                filters={[
                    {
                        value: categoryFilter,
                        onChange: (v) => { setCategoryFilter(v); setPage(1); },
                        options: [
                            { value: '', label: 'All Categories' },
                            ...categories.map(c => ({ value: c.id, label: c.name }))
                        ]
                    }
                ]}
            />

            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>SKU / Image</th>
                            <th>Product Name</th>
                            <th>Category</th>
                            <th>Supply Price</th>
                            <th>Retail Price</th>
                            <th>Margin</th>
                            <th>Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" className="text-center py-4"><div className="spinner" /></td></tr>
                        ) : products.data.length === 0 ? (
                            <tr><td colSpan="7" className="text-center py-4 text-muted">No products found.</td></tr>
                        ) : products.data.map(p => {
                            const margin = p.sell_price > 0 ? ((p.sell_price - p.purchase_price) / p.sell_price * 100).toFixed(1) : 0;
                            return (
                                <tr key={p.id}>
                                    <td>
                                        <div className="d-flex align-center gap-2">
                                            {(() => {
                                                const firstImg = p.product_variants?.find(v => v.image_path)?.image_path;
                                                return firstImg
                                                    ? <img src={`/storage/${firstImg}`} alt={p.name} width="40" height="40" style={{borderRadius: 6, objectFit: 'cover'}} />
                                                    : <div style={{width: 40, height: 40, borderRadius: 6, background: 'var(--surface2)', display: 'grid', placeItems:'center'}}>📦</div>;
                                            })()}
                                            <div className="font-semi text-sm">{p.sku}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="font-semi">{p.name}</div>
                                        <div className="text-muted text-sm">{p.supplier?.name}</div>
                                    </td>
                                    <td>
                                        <span className="badge badge--gray">{p.category?.name}</span>
                                    </td>
                                    <td className="td-amount">₱{Number(p.purchase_price).toFixed(2)}</td>
                                    <td className="td-amount text-accent">₱{Number(p.sell_price).toFixed(2)}</td>
                                    <td><span className={`badge ${margin > 20 ? 'badge--green' : 'badge--amber'}`}>{margin}%</span></td>
                                    <td>
                                        <div className="font-semi">
                                            {p.product_variants?.length > 0 ? (
                                                <>
                                                    {p.product_variants.reduce((sum, v) => sum + (v.stock || 0), 0)} pcs 
                                                    <div className="text-xs text-muted">({p.product_variants.length} variants)</div>
                                                </>
                                            ) : (
                                                `${p.inventory?.current_stock || 0} pcs`
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="td-actions">
                                            <button className="btn btn--sm btn--ghost" onClick={() => openEdit(p)}>Edit</button>
                                            <button className="btn btn--sm btn--danger text-white" onClick={() => setDeleteId(p.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Pagination page={page} total={products.total} perPage={15} onChange={setPage} />

            {/* ProductModal removed — list + form are now view-switched */}

            <ConfirmModal 
                isOpen={!!deleteId}
                onCancel={() => setDeleteId(null)}
                onConfirm={handleDelete}
                message="Are you sure you want to delete this product? This action cannot be undone."
            />
        </div>
    );
}
