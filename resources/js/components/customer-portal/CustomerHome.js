import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FilterBar from '../shared/FilterBar';
import ProductDetailModal from './ProductDetailModal';

export default function CustomerHome() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const [cart, setCart] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);
    
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        axios.get('/categories').then(res => setCategories(res.data.data));
    }, []);

    useEffect(() => {
        setLoading(true);
        axios.get('/products', { params: { search, category_id: categoryFilter, page: 1 } })
            .then(res => {
                const paginatedData = res.data.data;
                setProducts(paginatedData.data ? paginatedData.data : paginatedData);
            })
            .finally(() => setLoading(false));
    }, [search, categoryFilter]);

    const addToCart = (product, options = {}) => {
        const qty = options.qty || 1;
        const variants = options.variants || {};
        const price = options.price || product.sell_price;
        const variant_id = options.variant_id || null;
        const isUpdate = options.isUpdate || false;

        const variantLabels = Object.values(variants).filter(Boolean).map(v => v.label);
        const variantString = variantLabels.join(', ');
        const cartId = variantString ? `${product.id}-${variantString}` : product.id;

        setCart(prev => {
            // If it's an update, we should probably remove the old cartId first if it changed
            // Actually, if cartId is the same, we just override. If it changed, it's like a swap.
            
            if (isUpdate && product.cartId !== cartId) {
                // Variants changed, remove the old one if it's there
                const filtered = prev.filter(i => i.cartId !== product.cartId);
                const existing = filtered.find(i => i.cartId === cartId);
                if (existing) {
                    return filtered.map(i => i.cartId === cartId ? { ...i, qty: i.qty + qty } : i);
                }
                return [...filtered, { ...product, sell_price: price, cartId, qty, variantString, selectedVariants: variants, variant_id }];
            }

            const existing = prev.find(i => i.cartId === cartId);
            if (existing) {
                // If it's an update and same cartId, we override qty. If it's a fresh add, we increment.
                return prev.map(i => i.cartId === cartId ? { ...i, qty: isUpdate ? qty : i.qty + qty, selectedVariants: variants, sell_price: price } : i);
            }
            return [...prev, { ...product, sell_price: price, cartId, qty, variantString, selectedVariants: variants, variant_id }];
        });
        setCartOpen(true);
    };

    const updateQty = (cartId, delta) => {
        setCart(prev => prev.map(i => {
            if (i.cartId === cartId) {
                const newQty = Math.max(0, i.qty + delta);
                return newQty === 0 ? null : { ...i, qty: newQty };
            }
            return i;
        }).filter(Boolean));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.sell_price * item.qty), 0);

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '4rem' }}>
            <header className="topbar" style={{ left: 0, padding: '0 5%' }}>
                <div className="topbar__title" style={{ fontSize: '1.25rem' }}>HRMS <span>Store</span></div>
                <div className="topbar__actions">
                    <button className="btn btn--ghost" onClick={() => setCartOpen(true)}>
                        🛒 {cart.length > 0 && <span className="badge badge--accent ml-2">{cart.reduce((s,i)=>s+i.qty,0)}</span>}
                    </button>
                    {user ? (
                        <>
                            <Link to="/shop/history" className="btn btn--ghost">My Orders</Link>
                            <button className="btn btn--ghost" onClick={() => { logout(); navigate('/'); }}>Logout</button>
                        </>
                    ) : (
                        <Link to="/login" className="btn btn-primary">Sign In</Link>
                    )}
                </div>
            </header>

            <main className="main-content" style={{ marginLeft: 0, marginTop: 64, padding: '2rem 5%' }}>
                <div className="section-header mb-4">
                    <h1 className="page-title text-3xl mb-2">Hardware Supplies</h1>
                    <p className="text-muted text-lg">Browse our catalog of premium building materials and tools.</p>
                </div>

                <FilterBar 
                    search={search} onSearchChange={v => setSearch(v)}
                    filters={[{
                        value: categoryFilter, onChange: v => setCategoryFilter(v),
                        options: [
                            { value: '', label: 'All Categories' },
                            ...categories.map(c => ({ value: c.id, label: c.name }))
                        ]
                    }]}
                />

                {loading ? <div className="spinner my-5" /> : (
                    <div className="grid-4 mt-4" style={{ gap: '1.5rem' }}>
                        {products.map(p => {
                            const totalVariantStock = p.product_variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
                            const inStock = p.product_variants?.length > 0 
                                ? totalVariantStock > 0 
                                : (p.inventory?.current_stock || 0) > 0;
                            const imgSrc = p.image_path ? `/storage/${p.image_path}` : null;
                            return (
                                <div key={p.id} className="product-card" onClick={() => setSelectedProduct(p)} style={{ cursor: 'pointer' }}>
                                    <div className="product-card__img">
                                        {imgSrc ? <img src={imgSrc} alt={p.name} style={{objectFit: 'cover'}} /> : <div className="placeholder">📦</div>}
                                    </div>
                                    <div className="product-card__name text-lg font-bold hover-text-accent">{p.name}</div>
                                    <div className="product-card__sku">{p.category?.name}</div>
                                    <div className="product-card__footer" onClick={e => e.stopPropagation()}>
                                        <div className="product-card__price">₱{Number(p.sell_price).toFixed(2)}</div>
                                        <button 
                                            className={`btn btn--sm ${inStock ? 'btn-primary' : 'btn--ghost'}`}
                                            disabled={!inStock}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (p.product_variants?.length > 0) {
                                                    const first = p.product_variants.find(v => (v.stock || 0) > 0);
                                                    if (first) {
                                                        addToCart(p, {
                                                            variant_id: first.id,
                                                            price: first.price_override || p.sell_price,
                                                            variants: {
                                                                Size: first.size_value,
                                                                Color: first.color_value,
                                                                Weight: first.weight_value
                                                            }
                                                        });
                                                    }
                                                } else {
                                                    addToCart(p);
                                                }
                                            }}
                                        >
                                            {inStock ? 'Add to Cart' : 'Out of Stock'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                
                <ProductDetailModal 
                    isOpen={!!selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    product={selectedProduct}
                    onAddToCart={addToCart}
                />
            </main>

            {/* Cart Sidebar */}
            {cartOpen && <div className="modal-backdrop" onClick={() => setCartOpen(false)} style={{ zIndex: 399 }} />}
            <div className={`cart-sidebar ${cartOpen ? 'open' : ''}`}>
                <div className="cart-sidebar__header">
                    <h3>Your Cart</h3>
                    <button className="close-btn" onClick={() => setCartOpen(false)}>✕</button>
                </div>
                
                <div className="cart-sidebar__body">
                    {cart.length === 0 ? (
                        <div className="text-center text-muted mt-5">Your cart is empty</div>
                    ) : cart.map(item => (
                        <div key={item.cartId} className="cart-item">
                            <div className="cart-item__info">
                                <div className="cart-item__name">{item.name}</div>
                                {item.variantString && (
                                    <div className="cart-item__variant text-xs text-muted">[{item.variantString}]</div>
                                )}
                                <div className="cart-item__price">₱{Number(item.sell_price).toFixed(2)} / ea</div>
                                {item.product_variants?.length > 0 && (
                                    <button 
                                        className="btn btn--link text-xs p-0 mt-1" 
                                        style={{ color: 'var(--accent)', fontWeight: 600 }}
                                        onClick={() => setSelectedProduct(item)}
                                    >
                                        Edit Details
                                    </button>
                                )}
                            </div>
                            <div className="cart-item__qty">
                                <button onClick={() => updateQty(item.cartId, -1)}>-</button>
                                <span>{item.qty}</span>
                                <button onClick={() => updateQty(item.cartId, 1)}>+</button>
                            </div>
                        </div>
                    ))}
                </div>

                {cart.length > 0 && (
                    <div className="cart-sidebar__footer">
                        <div className="total">
                            <span>Total</span>
                            <span className="text-accent text-xl">₱{cartTotal.toFixed(2)}</span>
                        </div>
                        <button 
                            className="btn btn-primary w-full justify-center py-3 text-base"
                            onClick={() => {
                                localStorage.setItem('hrms_cart', JSON.stringify(cart));
                                navigate('/shop/order');
                            }}
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
