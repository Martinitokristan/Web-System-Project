import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
    return (
        <div className="landing">
            <nav className="landing-nav">
                <div className="landing-nav__logo">
                    HRMS <span>Pro</span>
                </div>
                <div className="landing-nav__links">
                    <a href="#features">Features</a>
                    <a href="#pricing">Pricing</a>
                    <a href="#about">About</a>
                </div>
                <div className="landing-nav__ctas">
                    <Link to="/login" className="btn btn-ghost">Log in</Link>
                    <Link to="/register" className="btn btn-primary">Get Started</Link>
                </div>
            </nav>

            <header className="landing-hero">
                <h1>Next-Gen Retail Management for <span>Hardware Stores</span></h1>
                <p>Streamline your inventory, manage sales efficiently, and empower your delivery team with a complete full-stack solution built specifically for hardware retail businesses.</p>
                
                <div className="landing-hero__ctas">
                    <Link to="/register" className="btn btn-primary">Start Free Trial</Link>
                    <Link to="/login" className="btn btn-secondary">View Live Demo</Link>
                </div>

                <div className="landing-hero__stats">
                    <div className="stat"><div className="val">2M+</div><div className="lbl">Products Managed</div></div>
                    <div className="stat"><div className="val">99%</div><div className="lbl">Uptime SLA</div></div>
                    <div className="stat"><div className="val">24/7</div><div className="lbl">Support</div></div>
                    <div className="stat"><div className="val">10k+</div><div className="lbl">Active Users</div></div>
                </div>
            </header>

            <section id="features" className="landing-features">
                <div className="section-header">
                    <h2>Everything you need to scale</h2>
                    <p>Powerful features to automate your day-to-day hardware store operations.</p>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">📦</div>
                        <h3>Smart Inventory</h3>
                        <p>Track stock levels in real-time, get low-stock alerts, and auto-generate purchase orders to suppliers.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">💳</div>
                        <h3>Omnichannel Sales</h3>
                        <p>Process walk-in POS transactions and online customer portal orders from a unified dashboard.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🚚</div>
                        <h3>Delivery Kanban</h3>
                        <p>Drag-and-drop delivery management with a dedicated rider app for live updates and COD tracking.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📊</div>
                        <h3>Advanced Reports</h3>
                        <p>Export beautiful PDF/CSV reports. Visualize your revenue, returns, and daily sales trends instantly.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">👥</div>
                        <h3>Role-based Access</h3>
                        <p>Secure admin, rider, and customer portals using token-based authentication with strict permissions.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">⚙️</div>
                        <h3>Customizable Engine</h3>
                        <p>Configure tax rates, units of measurement, delivery zones, and receipt templates for your store.</p>
                    </div>
                </div>
            </section>

            <section className="landing-partners">
                <div className="section-header">
                    <h2>Partner With Us</h2>
                    <p>Join our network of trusted suppliers and grow your business.</p>
                </div>

                <div className="partners-grid">
                    <div className="partner-card">
                        <div className="partner-icon">🏭</div>
                        <h3>Become a Supplier Partner</h3>
                        <p>Manage purchase orders, track deliveries, and grow your business with real-time updates and automated workflows.</p>
                        <div className="partner-benefits">
                            <span className="benefit-tag">📋 Manage POs</span>
                            <span className="benefit-tag">🚚 Track Deliveries</span>
                            <span className="benefit-tag">📈 Grow Business</span>
                        </div>
                        <div className="partner-ctas">
                            <Link to="/supplier/register" className="btn btn-primary">Register as Supplier</Link>
                            <Link to="/supplier/login" className="btn btn-ghost">Supplier Login</Link>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="landing-footer">
                <div className="logo">HRMS <span>Pro</span></div>
                <div className="copy">© {new Date().getFullYear()} Hardware Retail Management System. All rights reserved.</div>
            </footer>
        </div>
    );
}
