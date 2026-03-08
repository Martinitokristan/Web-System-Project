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
    const [flyingItem, setFlyingItem] = useState(null);
    
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('hrms_cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error('Error loading cart from localStorage:', e);
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('hrms_cart', JSON.stringify(cart));
    }, [cart]);

    // Trigger cart bump animation when flying item reaches cart
    useEffect(() => {
        if (flyingItem) {
            const timer = setTimeout(() => {
                const cartBtn = document.getElementById('cart-icon-btn');
                const badge = document.getElementById('cart-count-badge');
                if (cartBtn) {
                    cartBtn.classList.add('cart-bump');
                    setTimeout(() => cartBtn.classList.remove('cart-bump'), 300);
                }
                if (badge) {
                    badge.classList.add('badge-pulse');
                    setTimeout(() => badge.classList.remove('badge-pulse'), 400);
                }
            }, 600); // Trigger when item reaches cart (before animation ends)
            return () => clearTimeout(timer);
        }
    }, [flyingItem]);

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
                    <button id="cart-icon-btn" className="btn btn--ghost" onClick={() => navigate('/shop/cart')}>
                        🛒 {cart.length > 0 && <span id="cart-count-badge" className="badge badge--accent ml-2">{cart.reduce((s,i)=>s+i.qty,0)}</span>}
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
                                            id={`add-to-cart-${p.id}`}
                                            className={`btn btn--sm ${inStock ? 'btn-primary' : 'btn--ghost'}`}
                                            disabled={!inStock}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Trigger fly animation
                                                const productImg = e.currentTarget.closest('.product-card').querySelector('.product-card__img');
                                                const cartBtn = document.getElementById('cart-icon-btn');
                                                if (productImg && cartBtn) {
                                                    const startRect = productImg.getBoundingClientRect();
                                                    const endRect = cartBtn.getBoundingClientRect();
                                                    setFlyingItem({
                                                        id: p.id,
                                                        img: p.image_path ? `/storage/${p.image_path}` : null,
                                                        startX: startRect.left + startRect.width / 2,
                                                        startY: startRect.top + startRect.height / 2,
                                                        endX: endRect.left + endRect.width / 2,
                                                        endY: endRect.top + endRect.height / 2,
                                                    });
                                                    setTimeout(() => setFlyingItem(null), 800);
                                                }
                                                
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

            {/* Flying Item Animation */}
            {flyingItem && (
                <div
                    style={{
                        '--start-x': `${flyingItem.startX}px`,
                        '--start-y': `${flyingItem.startY}px`,
                        '--end-x': `${flyingItem.endX}px`,
                        '--end-y': `${flyingItem.endY}px`,
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: '#fff',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        zIndex: 9999,
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        animation: 'flyToCart 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                    }}
                >
                    {flyingItem.img ? (
                        <img 
                            src={flyingItem.img} 
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                        />
                    ) : (
                        '📦'
                    )}
                </div>
            )}

            {/* CSS for fly animation */}
            <style>{`
                @keyframes flyToCart {
                    0% {
                        transform: translate(calc(var(--start-x) - 50%), calc(var(--start-y) - 50%)) scale(1);
                        opacity: 1;
                    }
                    50% {
                        transform: translate(calc((var(--start-x) + var(--end-x)) / 2 - 50%), calc((var(--start-y) + var(--end-y)) / 2 - 50%)) scale(0.8);
                        opacity: 0.9;
                    }
                    100% {
                        transform: translate(calc(var(--end-x) - 50%), calc(var(--end-y) - 50%)) scale(0.3);
                        opacity: 0;
                    }
                }
                
                @keyframes cartBump {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }
                
                .cart-bump {
                    animation: cartBump 0.3s ease;
                }
                
                @keyframes badgePulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.3); }
                    100% { transform: scale(1); }
                }
                
                .badge-pulse {
                    animation: badgePulse 0.4s ease;
                }
            `}</style>
        </div>
    );
}
