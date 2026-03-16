import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import ProductDetailModal from "./ProductDetailModal";
import Modal from "../shared/Modal";

import "leaflet/dist/leaflet.css";
import "../../../sass/CustomerOrder.scss";

export default function CustomerOrder() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuth();

    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Review, 2: Invoice & Location
    const [customerProfile, setCustomerProfile] = useState(null);

    const [address, setAddress] = useState("");
    const [payment, setPayment] = useState("cod");

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [orderSuccess, setOrderSuccess] = useState(false);

    const updateCartItem = (product, options) => {
        const qty = options.qty || 1;
        const variants = options.variants || {};
        const price = options.price || product.sell_price;
        const variant_id = options.variant_id || null;

        const variantLabels = Object.values(variants)
            .filter(Boolean)
            .map((v) => v.label);
        const variantString = variantLabels.join(", ");
        const cartId = variantString
            ? `${product.id}-${variantString}`
            : product.id;

        const newCart = cart.map((item) => {
            if (item.cartId === product.cartId) {
                return {
                    ...item,
                    qty,
                    selectedVariants: variants,
                    sell_price: price,
                    cartId,
                    variantString,
                    variant_id,
                };
            }
            return item;
        });

        setCart(newCart);
        localStorage.setItem("hrms_cart", JSON.stringify(newCart));
    };

    useEffect(() => {
        const saved = localStorage.getItem("hrms_cart");
        if (saved) {
            const cartData = JSON.parse(saved);
            // ONLY show items selected in the cart page
            const selectedOnly = cartData.filter(item => item.selectedForCheckout);
            if (selectedOnly.length === 0) {
                navigate("/shop/cart");
                return;
            }
            setCart(selectedOnly);
        } else {
            navigate("/shop");
        }

        // Fetch customer profile for location
        axios
            .get("/customer/profile")
            .then((res) => {
                setCustomerProfile(res.data.data);
                if (res.data.data?.address) {
                    const profile = res.data.data;
                    setAddress(
                        `${profile.address}, ${profile.municipality}, ${profile.province}`,
                    );
                }
            })
            .catch(() => console.log("Could not fetch profile"));
    }, [navigate]);

    const removeFromCart = (cartId) => {
        const saved = JSON.parse(localStorage.getItem("hrms_cart") || "[]");
        const newSaved = saved.filter(item => item.cartId !== cartId);
        localStorage.setItem("hrms_cart", JSON.stringify(newSaved));
        
        const newCart = cart.filter(item => item.cartId !== cartId);
        setCart(newCart);
        if (newCart.length === 0) {
            navigate("/shop");
        }
    };

    const total = cart.reduce(
        (sum, item) => sum + item.sell_price * item.qty,
        0,
    );

    const handleCheckout = async (e) => {
        e.preventDefault();

        // Validate address
        if (!address || address.trim().length < 5) {
            showToast("Please enter a valid delivery address (at least 5 characters).", "error");
            return;
        }

        // Validate cart has items
        if (cart.length === 0) {
            showToast("Your cart is empty.", "error");
            return;
        }

        setLoading(true);

        try {
            await axios.post("/sales", {
                address: address.trim(),
                payment_method: payment,
                customer_id: user?.id,
                items: cart.map((i) => ({
                    product_id: i.id,
                    product_variant_id: i.variant_id || null,
                    quantity: i.qty,
                    price: i.sell_price,
                    variants: i.selectedVariants || {},
                })),
            });

            // Remove placed items from localStorage cart
            const saved = JSON.parse(localStorage.getItem("hrms_cart") || "[]");
            const cartIdsToRemove = cart.map(i => i.cartId);
            const remainingCart = saved.filter(item => !cartIdsToRemove.includes(item.cartId));
            
            if (remainingCart.length > 0) {
                localStorage.setItem("hrms_cart", JSON.stringify(remainingCart));
            } else {
                localStorage.removeItem("hrms_cart");
            }
            setOrderSuccess(true);
        } catch (err) {
            showToast(
                err.response?.data?.message || "Failed to place order. Please try again.",
                "error",
            );
            setLoading(false);
        }
    };

    if (cart.length === 0) return null;

    // Invoice/Confirmation Step
    if (step === 2) {
        const hasLocation =
            customerProfile?.latitude && customerProfile?.longitude;
        const position = hasLocation
            ? [customerProfile.latitude, customerProfile.longitude]
            : [7.0707, 125.608];

        return (
            <div className="customer-order-bg">
                <div className="customer-order-container">
                    <div className="customer-order-card">
                        <h2 className="page-title text-2xl mb-4">
                            📄 Order Invoice & Confirmation
                        </h2>
                        <div className="customer-order-progress">
                            <div
                                className="customer-order-step"
                                style={{ opacity: 0.6 }}
                            >
                                <div
                                    className="customer-order-step-circle"
                                    style={{
                                        background: "var(--green)",
                                        color: "#fff",
                                    }}
                                >
                                    ✓
                                </div>
                                <span className="text-sm">Review Items</span>
                            </div>
                            <div className="customer-order-divider" />
                            <div className="customer-order-step">
                                <div className="customer-order-step-circle customer-order-step-2 active">
                                    2
                                </div>
                                <span className="text-sm font-bold">
                                    Confirm & Pay
                                </span>
                            </div>
                        </div>
                        <div className="customer-order-grid">
                            {/* INVOICE CARD */}
                            <div className="invoice-card customer-order-form" style={{ padding: '2rem' }}>
                                <div className="d-flex justify-between align-center mb-4 pb-3 border-bottom">
                                    <div>
                                        <h3
                                            className="font-bold"
                                            style={{ fontSize: "1.75rem", marginBottom: '0.5rem' }}
                                        >
                                            INVOICE
                                        </h3>
                                        <div style={{ fontSize: '1rem', color: '#666' }}>
                                            HRMS Hardware Store
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div style={{ fontSize: '1rem', color: '#666' }}>
                                            Date
                                        </div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                                            {new Date().toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div style={{ fontSize: '1rem', color: '#666', marginBottom: '0.5rem' }}>
                                        Bill To:
                                    </div>
                                    <div style={{ fontSize: '1.15rem', fontWeight: 600 }}>
                                        {user?.name}
                                    </div>
                                    <div style={{ fontSize: '1rem', color: '#666' }}>
                                        {user?.email}
                                    </div>
                                    <div style={{ fontSize: '1rem', color: '#666' }}>
                                        {user?.phone}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div style={{ fontSize: '1rem', color: '#666', marginBottom: '0.5rem' }}>
                                        Delivery Address:
                                    </div>
                                    <div style={{ fontSize: '1.05rem' }}>
                                        {address || "No address provided"}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div style={{ fontSize: '1rem', color: '#666', marginBottom: '0.5rem' }}>
                                        Payment Method:
                                    </div>
                                    <div
                                        className="badge badge--blue"
                                        style={{ textTransform: "uppercase", fontSize: '1rem', padding: '0.5rem 1rem' }}
                                    >
                                        {payment === "cod"
                                            ? "💵 Cash on Delivery"
                                            : payment === "gcash"
                                              ? "📱 GCash"
                                              : payment === "bank_transfer"
                                                ? "🏦 Bank Transfer"
                                                : "💳 In-Store Payment"}
                                    </div>
                                </div>

                                <div className="border-top pt-3">
                                    <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>
                                        Order Items
                                    </h4>
                                    {cart.map((item) => (
                                        <div
                                            key={item.cartId}
                                            style={{
                                                display: 'flex',
                                                gap: '1rem',
                                                padding: '1rem 0',
                                                fontSize: '1.05rem',
                                                borderBottom: '1px solid #f0f0f0',
                                                alignItems: 'flex-start',
                                            }}
                                        >
                                            {/* Product Image */}
                                            <div style={{
                                                width: '70px',
                                                height: '70px',
                                                borderRadius: '8px',
                                                background: '#f8fafc',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.5rem',
                                                flexShrink: 0,
                                            }}>
                                                {item.image_path ? (
                                                    <img 
                                                        src={`/storage/${item.image_path}`} 
                                                        alt={item.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                                                    />
                                                ) : (
                                                    '📦'
                                                )}
                                            </div>

                                            <div style={{ flex: 1 }}>
                                                <span style={{ fontWeight: 600 }}>
                                                    {item.qty}x
                                                </span>{" "}
                                                {item.name}
                                                {item.variantString && (
                                                    <div style={{ fontSize: '0.95rem', color: '#666', marginTop: '0.25rem' }}>
                                                        [{item.variantString}]
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                ₱
                                                {(
                                                    item.sell_price * item.qty
                                                ).toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-top pt-3 mt-3">
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '1.1rem',
                                        marginBottom: '0.75rem',
                                    }}>
                                        <span style={{ color: '#666' }}>
                                            Subtotal
                                        </span>
                                        <span>
                                            ₱
                                            {total.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '1.1rem',
                                        marginBottom: '0.75rem',
                                    }}>
                                        <span style={{ color: '#666' }}>
                                            VAT (12%)
                                        </span>
                                        <span>
                                            ₱
                                            {(total * 0.12).toLocaleString(
                                                undefined,
                                                {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                },
                                            )}
                                        </span>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '1.1rem',
                                        marginBottom: '0.75rem',
                                    }}>
                                        <span style={{ color: '#666' }}>
                                            Shipping
                                        </span>
                                        <span style={{ color: '#10b981', fontWeight: 600 }}>FREE</span>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontWeight: 700,
                                        fontSize: '1.5rem',
                                        marginTop: '1rem',
                                        paddingTop: '1rem',
                                        borderTop: '2px solid #e0e0e0',
                                    }}>
                                        <span>Total Amount</span>
                                        <span style={{ color: 'var(--accent)' }}>
                                            ₱
                                            {(total * 1.12).toLocaleString(
                                                undefined,
                                                {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                },
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* LOCATION CONFIRMATION */}
                            <div
                                className="location-confirm-card p-4"
                                style={{
                                    background: "none",
                                    border: "none",
                                    borderRadius: 0,
                                    boxShadow: "none",
                                    padding: 0,
                                }}
                            >
                                <h3 className="section-title mb-3">
                                    📍 Delivery Location
                                </h3>

                                {hasLocation ? (
                                    <>
                                        <div
                                            className="map-container mb-3"
                                            style={{
                                                height: 200,
                                                borderRadius: 12,
                                                overflow: "hidden",
                                            }}
                                        >
                                            <MapContainer
                                                center={position}
                                                zoom={16}
                                                style={{
                                                    height: "100%",
                                                    width: "100%",
                                                }}
                                            >
                                                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                                <Marker position={position} />
                                            </MapContainer>
                                        </div>

                                        <div className="location-info bg-amber-light p-3 rounded mb-3">
                                            <div className="d-flex align-center gap-2 mb-1">
                                                <span>📍</span>
                                                <span className="font-semi text-sm">
                                                    Your Registered Location
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted">
                                                {customerProfile?.latitude?.toFixed(
                                                    6,
                                                )}
                                                ,{" "}
                                                {customerProfile?.longitude?.toFixed(
                                                    6,
                                                )}
                                            </div>
                                        </div>

                                        <div className="alert alert-info text-sm mb-3">
                                            <strong>
                                                📌 Delivery Confirmation:
                                            </strong>
                                            <br />
                                            Your order will be delivered to the
                                            location shown above. Please ensure
                                            this is correct before placing your
                                            order.
                                        </div>
                                    </>
                                ) : (
                                    <div className="alert alert-warning text-sm mb-3">
                                        <strong>⚠️ No Location Data:</strong>
                                        <br />
                                        Your account doesn't have GPS
                                        coordinates. The rider may need to
                                        contact you for directions.
                                    </div>
                                )}

                                <div className="form-group mb-3">
                                    <label className="text-sm font-semi">
                                        Confirm or Edit Delivery Address:
                                    </label>
                                    <textarea
                                        className="w-full mt-1"
                                        rows={3}
                                        value={address}
                                        onChange={(e) =>
                                            setAddress(e.target.value)
                                        }
                                        placeholder="Enter complete delivery address"
                                        style={{
                                            padding: "0.75rem",
                                            borderRadius: 8,
                                            border: "1px solid var(--border)",
                                        }}
                                    />
                                </div>

                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn--ghost flex-1"
                                        onClick={() => setStep(1)}
                                        disabled={loading}
                                        style={{
                                            textAlign: 'center',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                        }}
                                    >
                                        <span>←</span> Back
                                    </button>
                                    <button
                                        className="btn btn-primary flex-1 justify-center"
                                        onClick={handleCheckout}
                                        disabled={loading}
                                        style={{ 
                                            padding: "0.75rem",
                                            textAlign: 'center',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                        }}
                                    >
                                        {loading
                                            ? "Processing..."
                                            : "Place Order"}
                                    </button>
                                </div>
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
                <Modal
                    isOpen={orderSuccess}
                    onClose={() => navigate("/shop/history")}
                    title=""
                    size="sm"
                    hideFooter
                >
                    <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                        <div style={{ 
                            width: '100px', 
                            height: '100px', 
                            background: '#f0fdf4', 
                            borderRadius: '35%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            margin: '0 auto 2rem',
                            transform: 'rotate(10deg)',
                            boxShadow: '0 20px 40px rgba(34, 197, 94, 0.15)'
                        }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>

                        <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#111827', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                            Order Placed!
                        </h2>
                        
                        <p style={{ fontSize: '1.1rem', color: '#6b7280', lineHeight: 1.6, marginBottom: '2.5rem', maxWidth: '300px', margin: '0 auto 2.5rem' }}>
                            Your order has been successfully processed and our team is now on it.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <button
                                onClick={() => navigate("/shop/history")}
                                style={{
                                    background: '#111827',
                                    color: '#fff',
                                    padding: '1.25rem',
                                    borderRadius: '16px',
                                    border: 'none',
                                    fontSize: '1.1rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                }}
                            >
                                Track Order <span>→</span>
                            </button>
                            <button
                                onClick={() => navigate("/shop")}
                                style={{
                                    background: 'transparent',
                                    color: '#6b7280',
                                    padding: '1rem',
                                    border: 'none',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Back to Shop
                            </button>
                        </div>
                    </div>
                </Modal>

                <style>{`
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

    // Step 1: Review Items - Simplified to show only Order Summary
    return (
        <div className="customer-order-bg">
            <div className="customer-order-container">
                <div className="customer-order-card">
                    <h2 className="page-title" style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>Checkout</h2>
                    <div className="customer-order-progress">
                        <div className="customer-order-step">
                            <div className="customer-order-step-circle customer-order-step-1">
                                1
                            </div>
                            <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                                Review Items
                            </span>
                        </div>

                        <div className="customer-order-divider" />

                        <div
                            className="customer-order-step"
                            style={{ opacity: 0.6 }}
                        >
                            <div className="customer-order-step-circle customer-order-step-2">
                                2
                            </div>
                            <span style={{ fontSize: '1.1rem' }}>Confirm & Pay</span>
                        </div>
                    </div>

                    {/* ORDER SUMMARY ONLY */}
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <div
                            className="summary-card"
                            style={{
                                background: "#fff",
                                border: "1px solid #e8eaed",
                                borderRadius: 16,
                                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                                padding: '1.5rem',
                            }}
                        >
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#111827' }}>Order Summary</h3>
                                <p style={{ fontSize: '0.95rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                    Review the items you've selected from your cart.
                                </p>
                            </div>

                            <div className="items-list mb-4">
                                {cart.map((item) => (
                                    <div
                                        key={item.cartId || item.id}
                                        className="summary-item"
                                        style={{
                                            padding: '1.25rem',
                                            borderBottom: '1px solid #f8fafc',
                                            display: 'flex',
                                            gap: '1.25rem',
                                            alignItems: 'center',
                                            transition: 'background 0.2s'
                                        }}
                                    >

                                        {/* Product Image */}
                                        <div style={{
                                            width: '80px',
                                            height: '80px',
                                            borderRadius: '10px',
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
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
                                                />
                                            ) : (
                                                '📦'
                                            )}
                                        </div>

                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                                {item.name}
                                            </div>
                                            {item.variantString && (
                                                <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.25rem' }}>
                                                    {item.variantString}
                                                </div>
                                            )}
                                            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                                Qty: {item.qty} × ₱{item.sell_price.toLocaleString()}
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                {item.product_variants?.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedProduct(item)}
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            color: 'var(--accent)',
                                                            fontWeight: 600,
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            padding: 0,
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(item.cartId)}
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        color: '#ef4444',
                                                        fontWeight: 600,
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        padding: 0,
                                                    }}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ fontSize: '1.1rem', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                            ₱{(item.sell_price * item.qty).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                    paddingTop: '1rem',
                                    borderTop: '2px solid #e0e0e0',
                                    color: 'var(--accent)',
                                }}
                            >
                                <span>Total</span>
                                <span>
                                    ₱{(total * 1.12).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '0.875rem', color: '#888', marginTop: '0.5rem' }}>
                                Includes VAT (12%)
                            </div>
                        </div>

                        {/* BUTTONS */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button
                                type="button"
                                className="btn btn-primary w-full justify-center"
                                onClick={() => setStep(2)}
                                style={{
                                    padding: "0.875rem",
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                    background: "var(--accent)",
                                    color: "#fff",
                                    borderRadius: 10,
                                    border: "none",
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                }}
                            >
                                Review Invoice & Location <span>→</span>
                            </button>

                            <button
                                type="button"
                                className="btn btn--ghost w-full justify-center"
                                style={{
                                    padding: '0.75rem',
                                    fontSize: '0.95rem',
                                    fontWeight: 500,
                                    background: '#f8f9fa',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 10,
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                }}
                                onClick={() => navigate("/shop")}
                            >
                                <span>←</span> Back to Shop
                            </button>
                        </div>
                    </div>

                    <ProductDetailModal
                        isOpen={!!selectedProduct}
                        onClose={() => setSelectedProduct(null)}
                        product={selectedProduct}
                        onAddToCart={(prod, opts) => updateCartItem(prod, opts)}
                    />
                </div>
            </div>
        </div>
    );
}
