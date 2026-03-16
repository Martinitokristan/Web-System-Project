import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import ProductDetailModal from './ProductDetailModal';
import Modal from '../shared/Modal';

export default function CartPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuth();
    
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('hrms_cart');
        if (savedCart) {
            try {
                const parsed = JSON.parse(savedCart);
                // Ensure all items have a selectedForCheckout property
                const updated = parsed.map(item => ({
                    ...item,
                    selectedForCheckout: item.selectedForCheckout !== undefined ? item.selectedForCheckout : true
                }));
                setCart(updated);
            } catch (e) {
                console.error('Error parsing cart:', e);
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('hrms_cart', JSON.stringify(cart));
    }, [cart]);

    const updateQty = (cartId, delta) => {
        setCart(prev => {
            const updated = prev.map(item => {
                if (item.cartId === cartId) {
                    const newQty = Math.max(1, item.qty + delta);
                    return { ...item, qty: newQty };
                }
                return item;
            });
            return updated;
        });
    };

    const removeItem = (cartId) => {
        setCart(prev => prev.filter(item => item.cartId !== cartId));
        showToast('Item removed from cart', 'success');
    };

    const clearCart = () => {
        setCart([]);
        setShowClearConfirm(false);
        showToast('Cart cleared', 'success');
    };

    const updateCartItem = (product, options) => {
        const qty = options.qty || 1;
        const variants = options.variants || {};
        const price = options.price || product.sell_price;
        const variant_id = options.variant_id || null;

        const variantLabels = Object.values(variants)
            .filter(Boolean)
            .map(v => v.label);
        const variantString = variantLabels.join(', ');
        const newCartId = variantString ? `${product.id}-${variantString}` : product.id;

        // Remove old item and add updated one
        setCart(prev => {
            const filtered = prev.filter(i => i.cartId !== product.cartId);
            const existing = filtered.find(i => i.cartId === newCartId);
            if (existing) {
                return filtered.map(i => i.cartId === newCartId ? { ...i, qty: i.qty + qty } : i);
            }
            return [...filtered, { ...product, sell_price: price, cartId: newCartId, qty, variantString, selectedVariants: variants, variant_id }];
        });
        setSelectedProduct(null);
        showToast('Item updated', 'success');
    };

    const switchVariant = (item, newVariant) => {
        // Check if new variant is in stock
        if ((newVariant.stock || 0) <= 0) {
            showToast('This variant is out of stock', 'error');
            return;
        }

        const variantLabels = [];
        if (newVariant.size_value) variantLabels.push(newVariant.size_value.label || newVariant.size_value);
        if (newVariant.color_value) variantLabels.push(newVariant.color_value.label || newVariant.color_value);
        if (newVariant.weight_value) variantLabels.push(newVariant.weight_value.label || newVariant.weight_value);
        
        const variantString = variantLabels.join(', ');
        const newCartId = variantString ? `${item.id}-${variantString}` : item.id;
        const newPrice = newVariant.price_override || item.sell_price;

        setCart(prev => {
            // Check if this variant already exists in cart
            const existing = prev.find(i => i.cartId === newCartId && i.cartId !== item.cartId);
            if (existing) {
                // Merge quantities
                const filtered = prev.filter(i => i.cartId !== item.cartId);
                return filtered.map(i => 
                    i.cartId === newCartId 
                        ? { ...i, qty: i.qty + item.qty }
                        : i
                );
            }
            
            // Update to new variant
            return prev.map(i => 
                i.cartId === item.cartId 
                    ? { 
                        ...i, 
                        cartId: newCartId,
                        variant_id: newVariant.id,
                        variantString,
                        sell_price: newPrice,
                        selectedVariants: {
                            Size: newVariant.size_value,
                            Color: newVariant.color_value,
                            Weight: newVariant.weight_value
                        }
                    }
                    : i
            );
        });
        showToast(`Switched to ${variantString}`, 'success');
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.sell_price * item.qty), 0);
    const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

    const handleCheckout = () => {
        const selectedCount = cart.filter(item => item.selectedForCheckout).length;
        if (selectedCount === 0) {
            showToast('Please select at least one item to checkout', 'error');
            return;
        }
        navigate('/shop/order');
    };

    const toggleSelection = (cartId) => {
        setCart(prev => prev.map(item => 
            item.cartId === cartId ? { ...item, selectedForCheckout: !item.selectedForCheckout } : item
        ));
    };

    if (cart.length === 0) {
        return (
            <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '2rem' }}>
                {/* Header */}
                <header style={{ 
                    background: '#fff', 
                    borderBottom: '1px solid #e8eaed',
                    padding: '1rem 5%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                        <Link to="/shop" style={{ textDecoration: 'none', color: 'var(--text1)' }}>
                            ← Back to Shop
                        </Link>
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>My Cart</h1>
                    <div style={{ width: '100px' }}></div>
                </header>

                {/* Empty Cart */}
                <div style={{ 
                    maxWidth: '600px', 
                    margin: '4rem auto', 
                    textAlign: 'center',
                    padding: '3rem 2rem',
                    background: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
                        Your cart is empty
                    </h2>
                    <p style={{ fontSize: '1rem', color: '#666', marginBottom: '2rem' }}>
                        Looks like you haven't added any items yet.
                    </p>
                    <button
                        onClick={() => navigate('/shop')}
                        style={{
                            padding: '0.875rem 2rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            background: 'var(--accent)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                        }}
                    >
                        Start Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '2rem' }}>
            {/* Header */}
            <header style={{ 
                background: '#fff', 
                borderBottom: '1px solid #e8eaed',
                padding: '1rem 5%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 100,
            }}>
                <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                    <Link to="/shop" style={{ textDecoration: 'none', color: 'var(--text1)' }}>
                        ← Back to Shop
                    </Link>
                </div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>My Cart ({cartCount})</h1>
                <button
                    onClick={() => setShowClearConfirm(true)}
                    style={{
                        fontSize: '0.9rem',
                        color: '#ef4444',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 500,
                    }}
                >
                    Clear Cart
                </button>
            </header>

            <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
                {/* Cart Items */}
                <div style={{ marginBottom: '1.5rem' }}>
                    {cart.map((item, index) => (
                        <div
                            key={item.cartId}
                            onClick={() => toggleSelection(item.cartId)}
                            style={{
                                background: '#fff',
                                borderRadius: '24px',
                                boxShadow: item.selectedForCheckout 
                                    ? '0 10px 25px rgba(99, 102, 241, 0.12)' 
                                    : '0 4px 6px -1px rgba(0,0,0,0.02)',
                                padding: '1.5rem',
                                marginBottom: '1.25rem',
                                display: 'flex',
                                gap: '1.5rem',
                                alignItems: 'center',
                                border: item.selectedForCheckout ? '2px solid #6366f1' : '2px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                transform: item.selectedForCheckout ? 'translateY(-2px)' : 'none',
                            }}
                        >
                            {/* Selection Indicator (Premium Dot) */}
                            {item.selectedForCheckout && (
                                <div style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    width: '24px',
                                    height: '24px',
                                    backgroundColor: '#6366f1',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)'
                                }}>
                                    ✓
                                </div>
                            )}

                            {/* Product Image */}
                            <div style={{
                                width: '110px',
                                height: '110px',
                                borderRadius: '20px',
                                background: '#f8fafc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2.5rem',
                                flexShrink: 0,
                                overflow: 'hidden',
                                border: '1px solid #f1f5f9'
                            }}>
                                {item.image_path ? (
                                    <img 
                                        src={`/storage/${item.image_path}`} 
                                        alt={item.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    '📦'
                                )}
                            </div>

                            {/* Product Info */}
                            <div style={{ flex: 1 }}>
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'flex-start',
                                    marginBottom: '0.4rem',
                                }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#111827', letterSpacing: '-0.01em' }}>
                                        {item.name}
                                    </h3>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeItem(item.cartId);
                                        }}
                                        aria-label="Remove item"
                                        style={{
                                            background: '#fee2e2',
                                            border: 'none',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.85rem',
                                            transition: 'transform 0.2s',
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>

                                {item.variantString && (
                                    <div style={{ 
                                        fontSize: '0.9rem', 
                                        fontWeight: 600, 
                                        color: '#6366f1',
                                        marginBottom: '0.75rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        {item.variantString}
                                    </div>
                                )}

                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'flex-end',
                                    marginTop: '1rem'
                                }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.75rem',
                                        background: '#f8fafc',
                                        borderRadius: '12px',
                                        padding: '0.4rem',
                                        border: '1px solid #f1f5f9'
                                    }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); updateQty(item.cartId, -1); }}
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: '#fff',
                                                cursor: 'pointer',
                                                fontSize: '1rem',
                                                fontWeight: 700,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                            }}
                                        >
                                            −
                                        </button>
                                        <span style={{ fontWeight: 800, fontSize: '1rem', minWidth: '30px', textAlign: 'center' }}>
                                            {item.qty}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); updateQty(item.cartId, 1); }}
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: '#fff',
                                                cursor: 'pointer',
                                                fontSize: '1rem',
                                                fontWeight: 700,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                            }}
                                        >
                                            +
                                        </button>
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '2px' }}>
                                            ₱{Number(item.sell_price).toFixed(2)}
                                        </div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>
                                            ₱{(item.sell_price * item.qty).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Checkout Button */}
                <button
                    onClick={handleCheckout}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        background: 'var(--accent)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        marginBottom: '1rem',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                    }}
                >
                    Proceed to Checkout <span>→</span>
                </button>

                {/* Continue Shopping */}
                <button
                    onClick={() => navigate('/shop')}
                    style={{
                        width: '100%',
                        padding: '0.875rem',
                        fontSize: '1rem',
                        fontWeight: 600,
                        background: '#f8fafc',
                        color: '#666',
                        border: '2px solid #e0e0e0',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                    }}
                >
                    <span>←</span> Continue Shopping
                </button>
            </div>

            {/* Product Detail Modal for Editing */}
            <ProductDetailModal
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                product={selectedProduct}
                onAddToCart={(prod, opts) => updateCartItem(prod, opts)}
            />

            {/* Clear Cart Confirmation */}
            <Modal
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                title="Clear Cart?"
                size="sm"
                hideFooter
            >
                <div style={{ padding: '1rem 0' }}>
                    <p style={{ fontSize: '1rem', color: '#666', marginBottom: '1.5rem' }}>
                        Are you sure you want to remove all items from your cart?
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => setShowClearConfirm(false)}
                            style={{
                                flex: 1,
                                padding: '0.875rem',
                                fontSize: '1rem',
                                fontWeight: 600,
                                background: '#f8fafc',
                                border: '1px solid #e0e0e0',
                                borderRadius: '10px',
                                cursor: 'pointer',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={clearCart}
                            style={{
                                flex: 1,
                                padding: '0.875rem',
                                fontSize: '1rem',
                                fontWeight: 600,
                                background: '#ef4444',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: 'pointer',
                            }}
                        >
                            Clear Cart
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
