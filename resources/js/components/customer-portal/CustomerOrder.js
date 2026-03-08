import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import ProductDetailModal from './ProductDetailModal';

export default function CustomerOrder() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuth();
    
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [address, setAddress] = useState('');
    const [payment, setPayment] = useState('cod');

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [orderSuccess, setOrderSuccess] = useState(false);

    const updateCartItem = (product, options) => {
        const qty = options.qty || 1;
        const variants = options.variants || {};
        const price = options.price || product.sell_price;
        const variant_id = options.variant_id || null;

        const variantLabels = Object.values(variants).filter(Boolean).map(v => v.label);
        const variantString = variantLabels.join(', ');
        const cartId = variantString ? `${product.id}-${variantString}` : product.id;

        const newCart = cart.map(item => {
            if (item.cartId === product.cartId) {
                return { ...item, qty, selectedVariants: variants, sell_price: price, cartId, variantString, variant_id };
            }
            return item;
        });

        setCart(newCart);
        localStorage.setItem('hrms_cart', JSON.stringify(newCart));
    };
    
    useEffect(() => {
        const saved = localStorage.getItem('hrms_cart');
        if (saved) setCart(JSON.parse(saved));
        else navigate('/shop');
    }, [navigate]);

    const total = cart.reduce((sum, item) => sum + (item.sell_price * item.qty), 0);

    const handleCheckout = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.post('/sales', {
                address: address,
                payment_method: payment,
                customer_id: user?.id,
                items: cart.map(i => ({ 
                    product_id: i.id, 
                    product_variant_id: i.variant_id,
                    quantity: i.qty,
                    price: i.sell_price,
                    variants: i.selectedVariants 
                }))
            });

            localStorage.removeItem('hrms_cart');
            setOrderSuccess(true);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to place order', 'error');
            setLoading(false);
        }
    };

    if (cart.length === 0) return null;

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '4rem 5%' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <h2 className="page-title text-2xl mb-4">Checkout</h2>
                
                <div className="grid-2" style={{ gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                    
                    <form onSubmit={handleCheckout} className="form-card bg-surface p-4 border rounded" style={{borderRadius: 12}}>
                        <h3 className="section-title">Delivery Details</h3>
                        <div className="form-group">
                            <label>Complete Shipping Address*</label>
                            <textarea 
                                required placeholder="House No., Street, Barangay, City"
                                value={address} onChange={e => setAddress(e.target.value)}
                            />
                        </div>

                        <h3 className="section-title mt-4">Payment Method</h3>
                        <div className="form-group">
                            <select value={payment} onChange={e => setPayment(e.target.value)} className="w-full">
                                <option value="cod">Cash on Delivery (COD)</option>
                                <option value="cash">In-Store Payment</option>
                                <option value="gcash">GCash</option>
                                <option value="bank_transfer">Bank Transfer</option>
                            </select>
                        </div>

                        <button className="btn btn-primary w-full justify-center mt-4" disabled={loading} style={{padding: '0.875rem'}}>
                            {loading ? 'Processing...' : `Place Order (₱${total.toFixed(2)})`}
                        </button>
                        <button type="button" className="btn btn--ghost w-full justify-center mt-2" onClick={() => navigate('/shop')}>
                            Back to Shop
                        </button>
                    </form>

                    <div className="summary-card bg-surface p-4 border rounded" style={{borderRadius: 12, height: 'fit-content'}}>
                        <h3 className="section-title">Order Summary</h3>
                        <div className="items-list mb-4">
                            {cart.map(item => (
                                <div key={item.cartId || item.id} className="summary-item py-2 border-bottom">
                                    <div className="d-flex justify-between text-sm">
                                        <div>
                                            <div className="font-semi">{item.qty}x {item.name}</div>
                                            {item.variantString && (
                                                <div className="text-xs text-muted">[{item.variantString}]</div>
                                            )}
                                            {item.product_variants?.length > 0 && (
                                                <button 
                                                    type="button"
                                                    className="btn btn--link text-xs p-0 mt-1" 
                                                    style={{ color: 'var(--accent)', fontWeight: 600 }}
                                                    onClick={() => setSelectedProduct(item)}
                                                >
                                                    Edit Details
                                                </button>
                                            )}
                                        </div>
                                        <div className="font-semi">₱{(item.sell_price * item.qty).toFixed(2)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="d-flex justify-between font-bold text-lg text-accent pt-2">
                            <span>Total</span>
                            <span>₱{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <ProductDetailModal 
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                product={selectedProduct}
                onAddToCart={(prod, opts) => updateCartItem(prod, opts)}
            />

            {/* Shopee-style Success Modal */}
            {orderSuccess && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, backdropFilter: 'blur(4px)'
                }}>
                    <div className="bg-surface p-8 text-center" style={{
                        width: '90%', maxWidth: 400, borderRadius: 20,
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                        animation: 'modalSlideUp 0.3s ease-out'
                    }}>
                        <div style={{
                            width: 80, height: 80, background: '#ecfdf5', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.5rem', color: '#10b981'
                        }}>
                            <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Order Successful!</h2>
                        <p className="text-muted mb-6">Thank you for your purchase. Your order has been placed and is being processed.</p>
                        
                        <div className="d-flex flex-column gap-2">
                            <button 
                                className="btn btn-primary w-full justify-center py-3" 
                                style={{ background: 'var(--accent)', borderRadius: 12 }}
                                onClick={() => navigate('/shop/history')}
                            >
                                View Order History
                            </button>
                            <button 
                                className="btn btn--link w-full justify-center py-2" 
                                style={{ color: 'var(--accent)' }}
                                onClick={() => navigate('/shop')}
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes modalSlideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
