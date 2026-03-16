import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
    const [searchOpen, setSearchOpen] = useState(false);
    const searchRef = useRef(null);

    // Notifications
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notiOpen, setNotiOpen] = useState(false);

    // Load cart from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('hrms_cart');
        if (saved) try { setCart(JSON.parse(saved)); } catch (e) {}
    }, []);

    useEffect(() => { localStorage.setItem('hrms_cart', JSON.stringify(cart)); }, [cart]);

    // Cart bump animation
    useEffect(() => {
        if (flyingItem) {
            const t = setTimeout(() => {
                const btn = document.getElementById('cart-icon-btn');
                const badge = document.getElementById('cart-count-badge');
                if (btn) { btn.classList.add('cart-bump'); setTimeout(() => btn.classList.remove('cart-bump'), 300); }
                if (badge) { badge.classList.add('badge-pulse'); setTimeout(() => badge.classList.remove('badge-pulse'), 400); }
            }, 600);
            return () => clearTimeout(t);
        }
    }, [flyingItem]);

    // Fetch categories
    useEffect(() => { axios.get('/categories').then(r => setCategories(r.data.data || [])).catch(() => {}); }, []);

    // Fetch products
    useEffect(() => {
        setLoading(true);
        const params = { page: 1, per_page: 40 };
        if (search) params.search = search;
        if (categoryFilter) params.category_id = categoryFilter;
        axios.get('/products', { params })
            .then(r => { const d = r.data.data; setProducts(d.data ? d.data : d); })
            .finally(() => setLoading(false));
    }, [search, categoryFilter]);

    // Poll notifications
    useEffect(() => {
        if (!user) return;
        const fetchNoti = () => {
            axios.get('/customer/notifications').then(r => {
                setNotifications(r.data.data || []);
                setUnreadCount(r.data.unread || 0);
            }).catch(() => {});
        };
        fetchNoti();
        const interval = setInterval(fetchNoti, 10000);
        return () => clearInterval(interval);
    }, [user]);

    const markRead = () => {
        if (unreadCount > 0) {
            axios.post('/customer/notifications/read').then(() => {
                setUnreadCount(0);
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            });
        }
    };

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
            if (isUpdate && product.cartId !== cartId) {
                const filtered = prev.filter(i => i.cartId !== product.cartId);
                const existing = filtered.find(i => i.cartId === cartId);
                if (existing) return filtered.map(i => i.cartId === cartId ? { ...i, qty: i.qty + qty } : i);
                return [...filtered, { ...product, sell_price: price, cartId, qty, variantString, selectedVariants: variants, variant_id }];
            }
            const existing = prev.find(i => i.cartId === cartId);
            if (existing) return prev.map(i => i.cartId === cartId ? { ...i, qty: isUpdate ? qty : i.qty + qty, selectedVariants: variants, sell_price: price } : i);
            return [...prev, { ...product, sell_price: price, cartId, qty, variantString, selectedVariants: variants, variant_id }];
        });
    };

    const cartCount = cart.reduce((s, i) => s + i.qty, 0);

    return (
        <div className="shop-premium" style={{ background: '#fdfdfd' }}>
            {/* ===== STICKY HEADER ===== */}
            <header className="shop-header">
                <div className="shop-header__inner">
                    <div className="shop-header__brand" onClick={() => navigate('/shop')}>
                        <span className="brand-icon">H</span>
                        <div className="brand-name" style={{ color: '#111827', fontWeight: 900, fontSize: '1.25rem' }}>HRMS <span style={{ color: '#FF6B35' }}>Pro</span></div>
                    </div>

                    <div className="shop-header__search">
                        <span className="search-icon-inner">🔍</span>
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Find professional tools..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && <button className="clear-btn" onClick={() => setSearch('')}>✕</button>}
                    </div>

                    <div className="shop-header__actions">
                        <button id="cart-icon-btn" className="icon-btn cart-btn" onClick={() => navigate('/shop/cart')} style={{ background: '#111827', color: '#fff' }}>
                            🛒
                            {cartCount > 0 && <span id="cart-count-badge" className="cart-badge">{cartCount}</span>}
                        </button>

                        {user ? (
                            <div className="user-menu">
                                <div className="user-avatar" style={{ background: '#111827' }}>{user.name?.charAt(0)}</div>
                                <div className="user-dropdown">
                                    <Link to="/shop/history">My Orders</Link>
                                    <button onClick={() => { logout(); navigate('/'); }}>Sign Out</button>
                                </div>
                            </div>
                        ) : (
                            <Link to="/login" className="sign-in-btn">Sign In</Link>
                        )}
                    </div>
                </div>
            </header>

            {/* ===== CATEGORY STRIP ===== */}
            <div className="category-strip">
                <div className="category-strip__inner">
                    <button
                        className={`cat-pill ${!categoryFilter ? 'active' : ''}`}
                        onClick={() => setCategoryFilter('')}
                    >All Tools</button>
                    {categories.map(c => (
                        <button
                            key={c.id}
                            className={`cat-pill ${categoryFilter == c.id ? 'active' : ''}`}
                            onClick={() => setCategoryFilter(categoryFilter == c.id ? '' : c.id)}
                        >{c.name}</button>
                    ))}
                </div>
            </div>

            {/* ===== PRODUCT GRID ===== */}
            <main className="shop-main">
                <div className="shop-section-header">
                    <h2>{categoryFilter ? categories.find(c => c.id == categoryFilter)?.name || 'Products' : 'Hardware Catalog'}</h2>
                    <span className="product-count">{products.length} Professional Items</span>
                </div>

                {loading ? (
                    <div className="product-grid">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="product-skeleton">
                                <div className="skeleton" style={{ aspectRatio: '1.1' }} />
                                <div style={{ padding: '2rem' }}>
                                    <div className="skeleton" style={{ height: '1rem', width: '40%', marginBottom: '1rem' }} />
                                    <div className="skeleton" style={{ height: '1.5rem', width: '80%', marginBottom: '1.5rem' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div className="skeleton" style={{ height: '2rem', width: '30%' }} />
                                        <div className="skeleton" style={{ height: '2.5rem', width: '20%', borderRadius: '14px' }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="shop-empty">
                        <div className="shop-empty__icon">🔧</div>
                        <h3>No equipment found</h3>
                        <p>We couldn't find any products matching your specific hardware requirements.</p>
                        <button className="btn-shop-primary" onClick={() => { setSearch(''); setCategoryFilter(''); }}>Reset Catalog</button>
                    </div>
                ) : (
                    <div className="product-grid">
                        {products.map(p => {
                            const totalVariantStock = p.product_variants?.reduce((s, v) => s + (v.stock || 0), 0) || 0;
                            const inStock = p.product_variants?.length > 0 ? totalVariantStock > 0 : (p.inventory?.current_stock || 0) > 0;
                            const imgSrc = p.image_path ? `/storage/${p.image_path}` : null;
                            const hasVariants = p.product_variants?.length > 0;

                            return (
                                <div key={p.id} className="pcard" onClick={() => setSelectedProduct(p)}>
                                    <div className="pcard__img">
                                        {imgSrc
                                            ? <img src={imgSrc} alt={p.name} loading="lazy" />
                                            : <div className="pcard__placeholder">🏗️</div>
                                        }
                                        {!inStock && <div className="pcard__oos">SOLD OUT</div>}
                                    </div>
                                    <div className="pcard__body">
                                        <div className="pcard__cat">{p.category?.name || 'Supply'}</div>
                                        <div className="pcard__name">{p.name}</div>
                                        <div className="pcard__bottom">
                                            <div className="pcard__price">
                                                <span className="price-main">₱{Number(p.sell_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <button
                                                className={`pcard__cart-btn ${!inStock ? 'disabled' : ''}`}
                                                disabled={!inStock}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const img = e.currentTarget.closest('.pcard').querySelector('.pcard__img');
                                                    const cartBtn = document.getElementById('cart-icon-btn');
                                                    if (img && cartBtn) {
                                                        const s = img.getBoundingClientRect();
                                                        const d = cartBtn.getBoundingClientRect();
                                                        setFlyingItem({
                                                            id: p.id, img: imgSrc,
                                                            startX: s.left + s.width / 2, startY: s.top + s.height / 2,
                                                            endX: d.left + d.width / 2, endY: d.top + d.height / 2,
                                                        });
                                                        setTimeout(() => setFlyingItem(null), 800);
                                                    }
                                                    if (hasVariants) {
                                                        const first = p.product_variants.find(v => (v.stock || 0) > 0);
                                                        if (first) {
                                                            addToCart(p, {
                                                                variant_id: first.id,
                                                                price: first.price_override || p.sell_price,
                                                                variants: { Size: first.size_value, Color: first.color_value, Weight: first.weight_value }
                                                            });
                                                        }
                                                    } else {
                                                        addToCart(p);
                                                    }
                                                }}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <ProductDetailModal
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                product={selectedProduct}
                onAddToCart={addToCart}
            />

            {/* Flying Item Animation */}
            {flyingItem && (
                <div className="flying-item" style={{
                    '--start-x': `${flyingItem.startX}px`, '--start-y': `${flyingItem.startY}px`,
                    '--end-x': `${flyingItem.endX}px`, '--end-y': `${flyingItem.endY}px`,
                }}>
                    {flyingItem.img ? <img src={flyingItem.img} alt="" /> : '🛠️'}
                </div>
            )}
        </div>
    );
}
