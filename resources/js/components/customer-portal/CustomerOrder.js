import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import ProductDetailModal from './ProductDetailModal';
import 'leaflet/dist/leaflet.css';

export default function CustomerOrder() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuth();
    
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Review, 2: Invoice & Location
    const [customerProfile, setCustomerProfile] = useState(null);
    
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

        // Fetch customer profile for location
        axios.get('/customer/profile')
            .then(res => {
                setCustomerProfile(res.data.data);
                // Pre-fill address if available
                if (res.data.data?.address) {
                    const profile = res.data.data;
                    setAddress(`${profile.address}, ${profile.municipality}, ${profile.province}`);
                }
            })
            .catch(() => console.log('Could not fetch profile'));
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

    // Invoice/Confirmation Step
    if (step === 2) {
        const hasLocation = customerProfile?.latitude && customerProfile?.longitude;
        const position = hasLocation ? [customerProfile.latitude, customerProfile.longitude] : [7.0707, 125.6080];

        return (
            <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '4rem 5%' }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <h2 className="page-title text-2xl mb-4">📄 Order Invoice & Confirmation</h2>
                    
                    {/* Progress Steps */}
                    <div className="d-flex align-center gap-3 mb-4">
                        <div className="d-flex align-center gap-2" style={{opacity: 0.6}}>
                            <div style={{width: 28, height: 28, borderRadius: '50%', background: 'var(--green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14}}>✓</div>
                            <span className="text-sm">Review Items</span>
                        </div>
                        <div style={{flex: 1, height: 2, background: 'var(--border)'}} />
                        <div className="d-flex align-center gap-2">
                            <div style={{width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14}}>2</div>
                            <span className="text-sm font-bold">Confirm & Pay</span>
                        </div>
                    </div>

                    <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        
                        {/* INVOICE CARD */}
                        <div className="invoice-card bg-surface p-4 border rounded" style={{borderRadius: 12}}>
                            <div className="d-flex justify-between align-center mb-4 pb-3 border-bottom">
                                <div>
                                    <h3 className="font-bold text-lg">INVOICE</h3>
                                    <div className="text-xs text-muted">HRMS Hardware Store</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-muted">Date</div>
                                    <div className="font-semi">{new Date().toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="text-xs text-muted mb-1">Bill To:</div>
                                <div className="font-semi">{user?.name}</div>
                                <div className="text-sm text-muted">{user?.email}</div>
                                <div className="text-sm text-muted">{user?.phone}</div>
                            </div>

                            <div className="mb-4">
                                <div className="text-xs text-muted mb-1">Delivery Address:</div>
                                <div className="text-sm">{address || 'No address provided'}</div>
                            </div>

                            <div className="mb-4">
                                <div className="text-xs text-muted mb-1">Payment Method:</div>
                                <div className="badge badge--blue" style={{textTransform: 'uppercase'}}>
                                    {payment === 'cod' ? '💵 Cash on Delivery' : 
                                     payment === 'gcash' ? '📱 GCash' : 
                                     payment === 'bank_transfer' ? '🏦 Bank Transfer' : '💳 In-Store Payment'}
                                </div>
                            </div>

                            <div className="border-top pt-3">
                                <h4 className="text-sm font-bold mb-3">Order Items</h4>
                                {cart.map(item => (
                                    <div key={item.cartId} className="d-flex justify-between py-2 text-sm">
                                        <div>
                                            <span className="font-semi">{item.qty}x</span> {item.name}
                                            {item.variantString && (
                                                <div className="text-xs text-muted">[{item.variantString}]</div>
                                            )}
                                        </div>
                                        <div className="font-semi">₱{(item.sell_price * item.qty).toFixed(2)}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-top pt-3 mt-3">
                                <div className="d-flex justify-between text-sm mb-1">
                                    <span className="text-muted">Subtotal</span>
                                    <span>₱{total.toFixed(2)}</span>
                                </div>
                                <div className="d-flex justify-between text-sm mb-1">
                                    <span className="text-muted">Shipping</span>
                                    <span className="text-green">FREE</span>
                                </div>
                                <div className="d-flex justify-between font-bold text-lg mt-2 pt-2 border-top">
                                    <span>Total Amount</span>
                                    <span className="text-accent">₱{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* LOCATION CONFIRMATION */}
                        <div className="location-confirm-card bg-surface p-4 border rounded" style={{borderRadius: 12}}>
                            <h3 className="section-title mb-3">📍 Delivery Location</h3>
                            
                            {hasLocation ? (
                                <>
                                    <div className="map-container mb-3" style={{height: 200, borderRadius: 12, overflow: 'hidden'}}>
                                        <MapContainer center={position} zoom={16} style={{height: '100%', width: '100%'}}>
                                            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                            <Marker position={position} />
                                        </MapContainer>
                                    </div>
                                    
                                    <div className="location-info bg-amber-light p-3 rounded mb-3">
                                        <div className="d-flex align-center gap-2 mb-1">
                                            <span>📍</span>
                                            <span className="font-semi text-sm">Your Registered Location</span>
                                        </div>
                                        <div className="text-xs text-muted">
                                            {customerProfile?.latitude?.toFixed(6)}, {customerProfile?.longitude?.toFixed(6)}
                                        </div>
                                    </div>

                                    <div className="alert alert-info text-sm mb-3">
                                        <strong>📌 Delivery Confirmation:</strong><br/>
                                        Your order will be delivered to the location shown above. 
                                        Please ensure this is correct before placing your order.
                                    </div>
                                </>
                            ) : (
                                <div className="alert alert-warning text-sm mb-3">
                                    <strong>⚠️ No Location Data:</strong><br/>
                                    Your account doesn't have GPS coordinates. The rider may need to contact you for directions.
                                </div>
                            )}

                            <div className="form-group mb-3">
                                <label className="text-sm font-semi">Confirm or Edit Delivery Address:</label>
                                <textarea 
                                    className="w-full mt-1"
                                    rows={3}
                                    value={address} 
                                    onChange={e => setAddress(e.target.value)}
                                    placeholder="Enter complete delivery address"
                                    style={{padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)'}}
                                />
                            </div>

                            <div className="d-flex gap-2">
                                <button 
                                    className="btn btn--ghost flex-1" 
                                    onClick={() => setStep(1)}
                                    disabled={loading}
                                >
                                    ← Back
                                </button>
                                <button 
                                    className="btn btn-primary flex-1 justify-center" 
                                    onClick={handleCheckout}
                                    disabled={loading}
                                    style={{padding: '0.75rem'}}
                                >
                                    {loading ? 'Processing...' : `Place Order (₱${total.toFixed(2)})`}
                                </button>
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

                {/* Success Modal */}
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
                    .invoice-card { box-shadow: var(--shadow-sm); }
                    .location-confirm-card { box-shadow: var(--shadow-sm); }
                    .bg-amber-light { background: #fffbeb; }
                    .text-amber-dark { color: #92400e; }
                    .alert { padding: 12px 16px; border-radius: 8px; }
                    .alert-info { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; }
                    .alert-warning { background: #fef3c7; border: 1px solid #fcd34d; color: #92400e; }
                `}</style>
            </div>
        );
    }

    // Step 1: Review Items (Original checkout form)
    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '4rem 5%' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <h2 className="page-title text-2xl mb-4">Checkout</h2>
                
                {/* Progress Steps */}
                <div className="d-flex align-center gap-3 mb-4">
                    <div className="d-flex align-center gap-2">
                        <div style={{width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14}}>1</div>
                        <span className="text-sm font-bold">Review Items</span>
                    </div>
                    <div style={{flex: 1, height: 2, background: 'var(--border)'}} />
                    <div className="d-flex align-center gap-2" style={{opacity: 0.6}}>
                        <div style={{width: 28, height: 28, borderRadius: '50%', background: 'var(--surface)', border: '2px solid var(--border)', color: 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14}}>2</div>
                        <span className="text-sm">Confirm & Pay</span>
                    </div>
                </div>

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

                        <button 
                            type="button"
                            className="btn btn-primary w-full justify-center mt-4" 
                            onClick={() => setStep(2)}
                            style={{padding: '0.875rem'}}
                        >
                            Review Invoice & Location →
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
