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
                setCart(JSON.parse(savedCart));
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
        if (cart.length === 0) {
            showToast('Your cart is empty', 'error');
            return;
        }
        navigate('/shop/order');
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
                            style={{
                                background: '#fff',
                                borderRadius: '16px',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                                padding: '1.5rem',
                                marginBottom: '1rem',
                                display: 'flex',
                                gap: '1rem',
                                alignItems: 'flex-start',
                            }}
                        >
                            {/* Product Image */}
                            <div style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '12px',
                                background: '#f8fafc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem',
                                flexShrink: 0,
                            }}>
                                {item.image_path ? (
                                    <img 
                                        src={`/storage/${item.image_path}`} 
                                        alt={item.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
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
                                    marginBottom: '0.5rem',
                                }}>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                                        {item.name}
                                    </h3>
                                    <button
                                        onClick={() => removeItem(item.cartId)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            fontSize: '1.2rem',
                                            padding: '0.25rem',
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Variant Info - Display all variants without brackets */}
                                {item.variantString && (
                                    <div style={{ 
                                        fontSize: '1rem', 
                                        fontWeight: 600, 
                                        color: '#333',
                                        marginBottom: '0.75rem',
                                    }}>
                                        {item.variantString}
                                    </div>
                                )}

                                {/* All Available Variants with Stock Info */}
                                {item.product_variants?.length > 0 && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem', fontWeight: 500 }}>
                                            Available Options:
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {item.product_variants.map((variant) => {
                                                const isSelected = item.variant_id === variant.id;
                                                const inStock = (variant.stock || 0) > 0;
                                                const variantLabel = variant.size_value?.label || variant.size_value || 
                                                                    variant.color_value?.label || variant.color_value ||
                                                                    variant.weight_value?.label || variant.weight_value ||
                                                                    'Variant';
                                                
                                                return (
                                                    <button
                                                        key={variant.id}
                                                        onClick={() => inStock && switchVariant(item, variant)}
                                                        disabled={!inStock}
                                                        style={{
                                                            padding: '0.5rem 0.75rem',
                                                            borderRadius: '8px',
                                                            border: isSelected ? '2px solid var(--accent)' : '1px solid #e0e0e0',
                                                            background: isSelected ? '#fff5f0' : inStock ? '#fff' : '#f5f5f5',
                                                            color: inStock ? (isSelected ? 'var(--accent)' : '#333') : '#999',
                                                            fontSize: '0.875rem',
                                                            fontWeight: isSelected ? 700 : 500,
                                                            cursor: inStock ? 'pointer' : 'not-allowed',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.4rem',
                                                            transition: 'all 0.2s ease',
                                                        }}
                                                        title={inStock ? `${variant.stock} in stock` : 'Out of stock'}
                                                    >
                                                        <span>{variantLabel}</span>
                                                        {inStock ? (
                                                            <span style={{ 
                                                                fontSize: '0.7rem', 
                                                                color: isSelected ? 'var(--accent)' : '#10b981',
                                                                fontWeight: 600 
                                                            }}>
                                                                {variant.stock} left
                                                            </span>
                                                        ) : (
                                                            <span style={{ 
                                                                fontSize: '0.7rem', 
                                                                color: '#ef4444',
                                                                fontWeight: 600 
                                                            }}>
                                                                Out
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Price per unit */}
                                <div style={{ fontSize: '1rem', color: '#666', marginBottom: '0.75rem' }}>
                                    ₱{Number(item.sell_price).toFixed(2)} each
                                </div>

                                {/* Quantity Controls and Total */}
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                }}>
                                    {/* Quantity Controls */}
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.5rem',
                                        background: '#f8fafc',
                                        borderRadius: '10px',
                                        padding: '0.5rem',
                                    }}>
                                        <button
                                            onClick={() => updateQty(item.cartId, -1)}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '8px',
                                                border: '1px solid #e0e0e0',
                                                background: '#fff',
                                                cursor: 'pointer',
                                                fontSize: '1.2rem',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            −
                                        </button>
                                        <span style={{ 
                                            fontWeight: 700, 
                                            fontSize: '1.1rem',
                                            minWidth: '40px',
                                            textAlign: 'center',
                                        }}>
                                            {item.qty}
                                        </span>
                                        <button
                                            onClick={() => updateQty(item.cartId, 1)}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '8px',
                                                border: '1px solid #e0e0e0',
                                                background: '#fff',
                                                cursor: 'pointer',
                                                fontSize: '1.2rem',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            +
                                        </button>
                                    </div>

                                    {/* Item Total */}
                                    <div style={{ 
                                        fontSize: '1.25rem', 
                                        fontWeight: 700, 
                                        color: 'var(--accent)',
                                    }}>
                                        ₱{(item.sell_price * item.qty).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
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
