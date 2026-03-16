import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Landing() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(false);

    useEffect(() => {
        axios.get('/products', { params: { per_page: 8 } })
            .then(r => {
                const d = r.data.data;
                setProducts(d.data ? d.data : d);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const triggerLoginNotice = () => {
        setNotification(true);
        setTimeout(() => setNotification(false), 1500);
    };

    return (
        <div className="landing">
            {/* TOP NOTIFICATION */}
            <div style={{
                position: 'fixed', top: notification ? '24px' : '-100px', left: '50%', transform: 'translateX(-50%)',
                zIndex: 9999, transition: 'all 1.5s cubic-bezier(0.19, 1, 0.22, 1)',
                background: '#fff', color: '#dc2626', padding: '12px 28px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                border: '1px solid #fecaca', cursor: 'pointer', minWidth: '360px', justifyContent: 'center',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            }} onClick={() => navigate('/login')}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Unauthorized: <span style={{ textDecoration: 'underline', marginLeft: '4px' }}>Sign In Required</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setNotification(false); }}
                  style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: '1.2rem', cursor: 'pointer', marginLeft: '12px', display: 'flex', alignItems: 'center' }}
                >✕</button>
            </div>

            <nav className="landing-nav">
                <div className="landing-nav__logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    HRMS <span>Pro</span>
                </div>
                <div className="landing-nav__links">
                    <a href="#features">Features</a>
                    <a href="#products">Store</a>
                    <a href="#about">Partners</a>
                </div>
                <div className="landing-nav__ctas">
                    <Link to="/login" className="btn btn-ghost">Log in</Link>
                    <Link to="/register" className="btn btn-primary">Get Started</Link>
                </div>
            </nav>

            <header className="landing-hero" style={{ 
                backgroundImage: 'linear-gradient(rgba(17, 24, 39, 0.85), rgba(17, 24, 39, 0.85)), url("/images/hero-banner.png")',
                backgroundSize: 'cover', backgroundPosition: 'center', color: '#fff', padding: '8rem 5% 10rem'
            }}>
                <div className="landing-hero__content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ 
                        display: 'inline-block', background: 'rgba(255, 107, 53, 0.2)', color: '#ff8c61', 
                        fontSize: '0.85rem', fontWeight: 800, padding: '6px 16px', borderRadius: '20px', 
                        marginBottom: '2rem', border: '1px solid rgba(255, 107, 53, 0.3)'
                    }}>
                        PREMIUM HARDWARE SOLUTIONS
                    </div>
                    <h1 style={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1.1, margin: '0 0 1.5rem', letterSpacing: '-0.04em' }}>
                        Industrial Grade <span style={{ color: '#FF6B35' }}>Hardware</span><br />Retail Management
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '700px', lineHeight: 1.6, marginBottom: '3rem' }}>
                        The ultimate full-stack solution built specifically for hardware retail businesses. 
                        Manage inventory, sales, and deliveries with precision and speed.
                    </p>
                    <div className="landing-hero__btns" style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                            onClick={triggerLoginNotice} 
                            className="btn btn-ghost" 
                            style={{ 
                                padding: '0.8rem 1.8rem', fontSize: '1rem', color: '#fff', 
                                borderColor: '#fff', background: 'transparent', cursor: 'pointer',
                                borderRadius: '10px', fontWeight: 700
                            }}
                        >
                            Explore Shop
                        </button>
                        <Link to="/supplier/register" className="btn btn-primary" style={{ padding: '0.8rem 1.8rem', fontSize: '1rem' }}>Partner with us</Link>
                    </div>
                </div>

                <div className="landing-hero__stats" style={{ marginTop: '5rem' }}>
                    <div className="stat"><div className="val">2M+</div><div className="lbl">Products Managed</div></div>
                    <div className="stat"><div className="val">99%</div><div className="lbl">Uptime SLA</div></div>
                    <div className="stat"><div className="val">24/7</div><div className="lbl">Support</div></div>
                    <div className="stat"><div className="val">10k+</div><div className="lbl">Active Users</div></div>
                </div>
            </header>

            {/* PRODUCT CATALOG PREVIEW */}
            <section id="products" className="landing-products" style={{ padding: '6rem 5% 8rem', background: '#fdfdfd' }}>
                <div className="section-header" style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#111827', marginBottom: '1rem' }}>Our Hardware Catalog</h2>
                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Preview our professional-grade tools and supplies.</p>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem' }}>Loading catalog...</div>
                ) : (
                    <div className="product-grid" style={{ 
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                        gap: '2.5rem', maxWidth: '1400px', margin: '0 auto'
                    }}>
                        {products.map(p => (
                            <div key={p.id} className="pcard" style={{ 
                                background: '#fff', padding: '2rem', borderRadius: '32px', border: '1px solid #f1f5f9',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.02)', textAlign: 'center'
                            }}>
                                <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                    {p.image_path 
                                        ? <img src={`/storage/${p.image_path}`} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                        : <span style={{ fontSize: '4rem' }}>🛠️</span>
                                    }
                                </div>
                                <div style={{ color: '#FF6B35', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                    {p.category?.name || 'Supply'}
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '1rem', height: '3rem', overflow: 'hidden' }}>{p.name}</h3>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111827', marginBottom: '1.5rem' }}>
                                    ₱{Number(p.sell_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                <button 
                                    onClick={triggerLoginNotice}
                                    style={{ 
                                        width: '100%', padding: '0.75rem', borderRadius: '12px', background: '#f1f5f9', 
                                        border: 'none', color: '#475569', fontWeight: 800, cursor: 'pointer' 
                                    }}>
                                    Login to Shop
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                
                <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                    <button 
                        onClick={triggerLoginNotice} 
                        className="btn btn-primary" 
                        style={{ padding: '0.8rem 2rem', cursor: 'pointer', border: 'none', borderRadius: '10px' }}
                    >
                        View Full Catalog
                    </button>
                </div>
            </section>

            <section id="features" className="landing-features" style={{ background: '#f8fafc', padding: '6rem 5%' }}>
                <div className="section-header">
                    <h2>Everything you need to scale</h2>
                    <p>Powerful features to automate your day-to-day hardware store operations.</p>
                </div>
                <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                    <div className="feature-card">
                        <div className="feature-icon" style={{ fontSize: '2rem', marginBottom: '1rem' }}>📦</div>
                        <h3>Smart Inventory</h3>
                        <p>Track stock levels in real-time, get low-stock alerts, and auto-generate purchase orders to suppliers.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon" style={{ fontSize: '2rem', marginBottom: '1rem' }}>💳</div>
                        <h3>Omnichannel Sales</h3>
                        <p>Process walk-in POS transactions and online customer portal orders from a unified dashboard.</p>
                    </div>
                </div>
            </section>

            <footer className="landing-footer">
                <div className="logo" style={{ fontSize: '1.5rem', fontWeight: 900 }}>HRMS <span style={{ color: '#FF6B35' }}>Pro</span></div>
                <div className="copy">© {new Date().getFullYear()} Hardware Retail Management System. All rights reserved.</div>
            </footer>
        </div>
    );
}
