import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { StatusBadge } from "../shared/Badge";

export default function OrderHistory() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ratingOrder, setRatingOrder] = useState(null);
    const [ratingValue, setRatingValue] = useState(0);
    const [ratingHover, setRatingHover] = useState(0);
    const [ratingComment, setRatingComment] = useState("");
    const [submittingRating, setSubmittingRating] = useState(false);
    const [cancellingId, setCancellingId] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = () => {
        setLoading(true);
        axios
            .get("/customer/orders")
            .then((res) => setOrders(res.data.data))
            .finally(() => setLoading(false));
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return;
        setCancellingId(orderId);
        try {
            await axios.post(`/customer/orders/${orderId}/cancel`);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
        } catch (err) {
            alert(err.response?.data?.message || "Failed to cancel order");
        } finally {
            setCancellingId(null);
        }
    };

    const handleSubmitRating = async () => {
        if (!ratingOrder || ratingValue === 0) return;
        setSubmittingRating(true);
        try {
            await axios.post(`/deliveries/${ratingOrder.delivery.id}/rate`, {
                rating: ratingValue,
                comment: ratingComment,
            });
            // Update local state
            setOrders(prev => prev.map(o => {
                if (o.id === ratingOrder.id && o.delivery) {
                    return { ...o, delivery: { ...o.delivery, rating: ratingValue, rating_comment: ratingComment } };
                }
                return o;
            }));
            setRatingOrder(null);
            setRatingValue(0);
            setRatingComment("");
        } catch (err) {
            alert(err.response?.data?.message || "Failed to submit rating");
        } finally {
            setSubmittingRating(false);
        }
    };

    const STATUS_MAP = {
        pending: { label: "Pending", color: "#eab308", step: 0 },
        confirmed: { label: "Confirmed", color: "#3b82f6", step: 1 },
        out_for_delivery: { label: "Out for Delivery", color: "#6366f1", step: 2 },
        delivered: { label: "Delivered", color: "#10b981", step: 3 },
        returned: { label: "Returned", color: "#ef4444", step: -1 },
        cancelled: { label: "Cancelled", color: "#6b7280", step: -1 },
    };

    const steps = [
        { key: "pending", label: "Ordered" },
        { key: "confirmed", label: "Confirmed" },
        { key: "out_for_delivery", label: "In Transit" },
        { key: "delivered", label: "Arrived" },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "3rem 1rem" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
                    <div>
                        <h1 style={{ fontSize: "2.25rem", fontWeight: 900, color: "#111827", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
                            My Orders
                        </h1>
                        <p style={{ color: "#6b7280", fontSize: "1.1rem" }}>Track and manage your purchase history.</p>
                    </div>
                    <Link to="/shop" style={{ textDecoration: "none", color: "#6366f1", fontWeight: 700, fontSize: "1rem" }}>
                        ← Back to Shopping
                    </Link>
                </div>

                {orders.length === 0 ? (
                    <div style={{ 
                        textAlign: "center", 
                        padding: "5rem 2rem", 
                        background: "#fff", 
                        borderRadius: "32px", 
                        boxShadow: "0 10px 30px rgba(0,0,0,0.04)"
                    }}>
                        <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>📦</div>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: "0.75rem" }}>No orders yet</h2>
                        <p style={{ color: "#6b7280", marginBottom: "2rem" }}>When you place an order, it will appear here.</p>
                        <button onClick={() => navigate("/shop")} className="btn btn-primary" style={{ padding: "0.875rem 2rem", borderRadius: "14px" }}>
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
                        {orders.map((order) => {
                            const currentStatus = STATUS_MAP[order.status] || STATUS_MAP.pending;
                            const currentStep = currentStatus.step;
                            const isDelivered = order.status === 'delivered';
                            const isPending = order.status === 'pending';
                            const isCancelled = order.status === 'cancelled';
                            const hasRating = order.delivery?.rating;

                            return (
                                <div
                                    key={order.id}
                                    style={{
                                        background: "#fff",
                                        borderRadius: "32px",
                                        boxShadow: "0 15px 40px rgba(0,0,0,0.06)",
                                        overflow: "hidden",
                                        border: isCancelled ? "1px solid #fecaca" : "1px solid #f1f5f9",
                                        transition: "transform 0.3s ease",
                                        opacity: isCancelled ? 0.7 : 1,
                                    }}
                                >
                                    {/* Order Header Card */}
                                    <div style={{ padding: "2rem", borderBottom: "1px solid #f8fafc", background: isCancelled ? "#fef2f2" : "#fafafa" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                                                    <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                                        Order #{order.order_number}
                                                    </span>
                                                    <StatusBadge status={order.status} />
                                                </div>
                                                <div style={{ fontSize: "0.95rem", color: "#6b7280" }}>
                                                    Purchased on {new Date(order.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                                </div>
                                                {order.delivery?.tracking_number && (
                                                    <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>
                                                        Tracking: <span style={{ fontWeight: 700, color: "#6366f1" }}>{order.delivery.tracking_number}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#111827" }}>
                                                    ₱{Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </div>
                                                <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>{order.items?.length} Items Total</div>
                                                <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "2px", textTransform: "uppercase" }}>
                                                    {order.payment_method === 'cod' ? '💵 COD' : order.payment_method === 'gcash' ? '📱 GCash' : order.payment_method === 'bank_transfer' ? '🏦 Bank' : '💳 Cash'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ padding: "2rem" }}>
                                        {/* Delivery Tracker */}
                                        {currentStep >= 0 && (
                                            <div style={{ marginBottom: "3rem" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", position: "relative", marginBottom: "1rem" }}>
                                                    {/* Background Line */}
                                                    <div style={{ position: "absolute", top: "12px", left: "10%", right: "10%", height: "2px", background: "#f1f5f9", zIndex: 0 }}></div>
                                                    {/* Progress Line */}
                                                    <div style={{ 
                                                        position: "absolute", 
                                                        top: "12px", 
                                                        left: "10%", 
                                                        width: `${(currentStep / (steps.length - 1)) * 80}%`, 
                                                        height: "2px", 
                                                        background: "#6366f1", 
                                                        zIndex: 1,
                                                        transition: "width 0.5s ease" 
                                                    }}></div>

                                                    {steps.map((step, idx) => (
                                                        <div key={idx} style={{ position: "relative", zIndex: 2, textAlign: "center", width: "25%" }}>
                                                            <div style={{
                                                                width: "24px",
                                                                height: "24px",
                                                                borderRadius: "50%",
                                                                background: idx <= currentStep ? "#6366f1" : "#fff",
                                                                border: idx <= currentStep ? "4px solid #e0e7ff" : "2px solid #e2e8f0",
                                                                margin: "0 auto 0.75rem",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                color: "#fff",
                                                                fontSize: "0.7rem",
                                                                transition: "all 0.3s ease",
                                                                boxShadow: idx === currentStep ? "0 0 0 6px rgba(99, 102, 241, 0.1)" : "none"
                                                            }}>
                                                                {idx < currentStep ? "✓" : ""}
                                                            </div>
                                                            <span style={{ 
                                                                fontSize: "0.85rem", 
                                                                fontWeight: idx <= currentStep ? 800 : 500, 
                                                                color: idx <= currentStep ? "#111827" : "#94a3b8",
                                                                transition: "color 0.3s ease"
                                                            }}>
                                                                {step.label}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Cancelled Banner */}
                                        {isCancelled && (
                                            <div style={{
                                                background: "#fef2f2",
                                                border: "1px solid #fecaca",
                                                borderRadius: "16px",
                                                padding: "1.25rem",
                                                marginBottom: "2rem",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.75rem"
                                            }}>
                                                <span style={{ fontSize: "1.5rem" }}>❌</span>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: "#dc2626", marginBottom: "0.25rem" }}>Order Cancelled</div>
                                                    <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>This order has been cancelled and stock has been restored.</div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Rider Component */}
                                        {order.delivery?.rider && (
                                            <div style={{ 
                                                background: "#f8faff", 
                                                borderRadius: "24px", 
                                                padding: "1.5rem", 
                                                display: "flex", 
                                                alignItems: "center", 
                                                gap: "1.25rem",
                                                border: "1px solid #eef2ff",
                                                marginBottom: "2rem"
                                            }}>
                                                <div style={{ position: "relative" }}>
                                                    <img 
                                                        src={order.delivery.rider.photo ? (order.delivery.rider.photo.startsWith('http') ? order.delivery.rider.photo : `/storage/${order.delivery.rider.photo}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(order.delivery.rider.name)}&background=6366f1&color=fff&size=80`} 
                                                        alt="" 
                                                        style={{ width: "64px", height: "64px", borderRadius: "20px", objectFit: "cover", border: "2px solid #fff", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}
                                                    />
                                                    <div style={{ position: "absolute", bottom: "-4px", right: "-4px", width: "16px", height: "16px", background: "#10b981", border: "3px solid #fff", borderRadius: "50%" }}></div>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                                                        {order.status === 'out_for_delivery' ? '🚀 Out for Delivery' : '👤 Assigned Rider'}
                                                    </div>
                                                    <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111827" }}>{order.delivery.rider.name}</div>
                                                    {order.delivery.rider.phone && (
                                                        <div style={{ fontSize: "0.95rem", color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "2px" }}>
                                                            <span>📞</span> {order.delivery.rider.phone}
                                                        </div>
                                                    )}
                                                </div>
                                                <a href={`tel:${order.delivery.rider.phone}`} style={{ 
                                                    padding: "1rem", 
                                                    background: "#6366f1", 
                                                    color: "#fff", 
                                                    borderRadius: "18px", 
                                                    textDecoration: "none",
                                                    fontSize: "1.25rem",
                                                    boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center"
                                                }}>
                                                    📱
                                                </a>
                                            </div>
                                        )}

                                        {/* Rating Display (already rated) */}
                                        {isDelivered && hasRating && (
                                            <div style={{
                                                background: "#fffbeb",
                                                border: "1px solid #fde68a",
                                                borderRadius: "20px",
                                                padding: "1.25rem",
                                                marginBottom: "2rem",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "1rem"
                                            }}>
                                                <div style={{ fontSize: "2rem" }}>⭐</div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 700, color: "#92400e", marginBottom: "0.25rem" }}>
                                                        Your Rating: {order.delivery.rating}/5
                                                    </div>
                                                    <div style={{ display: "flex", gap: "2px", marginBottom: "0.25rem" }}>
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <span key={star} style={{ fontSize: "1.25rem", color: star <= order.delivery.rating ? "#f59e0b" : "#d1d5db" }}>★</span>
                                                        ))}
                                                    </div>
                                                    {order.delivery.rating_comment && (
                                                        <div style={{ fontSize: "0.9rem", color: "#78716c", fontStyle: "italic" }}>
                                                            "{order.delivery.rating_comment}"
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Rate Button (delivered but not yet rated) */}
                                        {isDelivered && !hasRating && order.delivery && (
                                            <div style={{
                                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                                borderRadius: "20px",
                                                padding: "1.5rem",
                                                marginBottom: "2rem",
                                                textAlign: "center"
                                            }}>
                                                <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🌟</div>
                                                <div style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                                                    How was your delivery?
                                                </div>
                                                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", marginBottom: "1rem" }}>
                                                    Your feedback helps us improve our service
                                                </div>
                                                <button
                                                    onClick={() => { setRatingOrder(order); setRatingValue(0); setRatingComment(""); }}
                                                    style={{
                                                        background: "#fff",
                                                        color: "#6366f1",
                                                        border: "none",
                                                        padding: "0.75rem 2rem",
                                                        borderRadius: "14px",
                                                        fontWeight: 700,
                                                        fontSize: "1rem",
                                                        cursor: "pointer",
                                                        boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
                                                    }}
                                                >
                                                    Rate Delivery
                                                </button>
                                            </div>
                                        )}

                                        {/* Item List */}
                                        <div style={{ background: "#fcfcfc", borderRadius: "24px", padding: "1.5rem", border: "1px solid #f1f5f9" }}>
                                            <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
                                                Order Details
                                            </h4>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                                {order.items?.map((item) => (
                                                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1a1a1a" }}>
                                                                {item.quantity}x {item.product?.name}
                                                            </div>
                                                            {item.variants && Object.keys(item.variants).length > 0 && (
                                                                <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500, marginTop: "2px" }}>
                                                                    {Object.values(item.variants).filter(v => v?.label).map(v => v.label).join(", ")}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div style={{ fontWeight: 700, color: "#111827", fontSize: "1.05rem" }}>
                                                            ₱{Number(item.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Cancel Button for pending orders */}
                                        {isPending && (
                                            <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                                                <button
                                                    onClick={() => handleCancelOrder(order.id)}
                                                    disabled={cancellingId === order.id}
                                                    style={{
                                                        background: "none",
                                                        color: "#ef4444",
                                                        border: "2px solid #fecaca",
                                                        padding: "0.75rem 2rem",
                                                        borderRadius: "14px",
                                                        fontWeight: 700,
                                                        fontSize: "0.95rem",
                                                        cursor: cancellingId === order.id ? "not-allowed" : "pointer",
                                                        opacity: cancellingId === order.id ? 0.6 : 1,
                                                        transition: "all 0.2s ease"
                                                    }}
                                                >
                                                    {cancellingId === order.id ? "Cancelling..." : "Cancel Order"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Rating Modal */}
            {ratingOrder && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 9999, padding: "1rem"
                }} onClick={() => setRatingOrder(null)}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: "#fff",
                            borderRadius: "28px",
                            padding: "2.5rem",
                            maxWidth: "420px",
                            width: "100%",
                            boxShadow: "0 25px 60px rgba(0,0,0,0.15)",
                            textAlign: "center"
                        }}
                    >
                        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⭐</div>
                        <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", marginBottom: "0.5rem" }}>
                            Rate Your Delivery
                        </h3>
                        <p style={{ color: "#6b7280", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                            Order #{ratingOrder.order_number}
                        </p>

                        {/* Star Rating */}
                        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    onClick={() => setRatingValue(star)}
                                    onMouseEnter={() => setRatingHover(star)}
                                    onMouseLeave={() => setRatingHover(0)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        fontSize: "2.5rem",
                                        cursor: "pointer",
                                        color: star <= (ratingHover || ratingValue) ? "#f59e0b" : "#d1d5db",
                                        transition: "transform 0.15s ease, color 0.15s ease",
                                        transform: star <= (ratingHover || ratingValue) ? "scale(1.15)" : "scale(1)",
                                        padding: "0.25rem",
                                    }}
                                >
                                    ★
                                </button>
                            ))}
                        </div>

                        {ratingValue > 0 && (
                            <div style={{ marginBottom: "1rem", fontSize: "1rem", fontWeight: 600, color: "#6366f1" }}>
                                {ratingValue === 1 ? "Poor" : ratingValue === 2 ? "Fair" : ratingValue === 3 ? "Good" : ratingValue === 4 ? "Very Good" : "Excellent!"}
                            </div>
                        )}

                        {/* Comment */}
                        <textarea
                            value={ratingComment}
                            onChange={(e) => setRatingComment(e.target.value)}
                            placeholder="Tell us about your experience (optional)"
                            rows={3}
                            style={{
                                width: "100%",
                                padding: "0.875rem",
                                borderRadius: "14px",
                                border: "2px solid #f1f5f9",
                                fontSize: "0.95rem",
                                marginBottom: "1.5rem",
                                resize: "none",
                                outline: "none",
                                fontFamily: "inherit",
                            }}
                        />

                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            <button
                                onClick={() => setRatingOrder(null)}
                                style={{
                                    flex: 1,
                                    padding: "0.875rem",
                                    borderRadius: "14px",
                                    border: "2px solid #e5e7eb",
                                    background: "#fff",
                                    fontWeight: 600,
                                    fontSize: "1rem",
                                    cursor: "pointer",
                                    color: "#6b7280"
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitRating}
                                disabled={ratingValue === 0 || submittingRating}
                                style={{
                                    flex: 1,
                                    padding: "0.875rem",
                                    borderRadius: "14px",
                                    border: "none",
                                    background: ratingValue === 0 ? "#d1d5db" : "#6366f1",
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: "1rem",
                                    cursor: ratingValue === 0 ? "not-allowed" : "pointer",
                                    boxShadow: ratingValue > 0 ? "0 4px 15px rgba(99, 102, 241, 0.3)" : "none"
                                }}
                            >
                                {submittingRating ? "Submitting..." : "Submit Rating"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #6366f1;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .btn-primary {
                    background: #6366f1;
                    color: #fff;
                    border: none;
                    cursor: pointer;
                    font-weight: 700;
                    transition: all 0.2s ease;
                }
                .btn-primary:hover {
                    background: #4f46e5;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
                }
            `}</style>
        </div>
    );
}
