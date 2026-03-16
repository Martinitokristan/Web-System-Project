import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';

export default function SupplierRegister() {
    const [form, setForm] = useState({
        name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        password: '',
        password_confirmation: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.password_confirmation) {
            showToast('Passwords do not match', 'error');
            return;
        }

        setSubmitting(true);
        try {
            await axios.post('/supplier/auth/register', form);
            showToast('Registration successful! Please check your email for verification.', 'success');
            navigate('/login?role=supplier');
        } catch (err) {
            showToast(err.response?.data?.message || 'Registration failed', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="auth-page">
            {/* LEFT SIDE: FORM */}
            <div className="auth-page__left">
                <div className="auth-box auth-box--wide">
                    <div className="auth-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                        HRMS <span>Pro</span>
                    </div>
                    <h1 className="auth-headline">Supplier Partner Program</h1>
                    <p className="auth-sub">Enter your company details to join our network of trusted suppliers.</p>

                    <form onSubmit={handleSubmit} className="register-grid">
                        {/* Company Section */}
                        <div className="form-section">
                            <div className="section-title">
                                <span style={{fontSize: '1.2rem'}}>🏢</span> Company Information
                            </div>
                            
                            <div className="form-group">
                                <label>Company / Business Name *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                    placeholder="Legal business name"
                                />
                            </div>

                            <div className="form-group">
                                <label>Business Address</label>
                                <textarea
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    placeholder="Warehouse or Office location"
                                    rows="3"
                                />
                            </div>
                        </div>

                        {/* Contact Section */}
                        <div className="form-section">
                            <div className="section-title">
                                <span style={{fontSize: '1.2rem'}}>👤</span> Primary Contact
                            </div>

                            <div className="form-group">
                                <label>Full Name *</label>
                                <input
                                    type="text"
                                    value={form.contact_name}
                                    onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                                    required
                                    placeholder="Primary account manager"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        required
                                        placeholder="business@email.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        placeholder="+63 000 0000"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Password *</label>
                                    <input
                                        type="password"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        required
                                        minLength="8"
                                        placeholder="Min. 8 characters"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Confirm Password *</label>
                                    <input
                                        type="password"
                                        value={form.password_confirmation}
                                        onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                                        required
                                        placeholder="Repeat password"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="register-actions">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ width: '100%', height: '44px', fontSize: '0.95rem' }}
                                disabled={submitting}
                            >
                                {submitting ? 'Registering Company...' : 'Initialize Supplier Partnership'}
                            </button>
                            
                            <div className="auth-footer" style={{ marginTop: '2rem' }}>
                                Already a partner? <Link to="/login?role=supplier">Sign In</Link>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* RIGHT SIDE: BRANDING/ILLUS */}
            <div className="auth-page__right" style={{ 
                backgroundImage: 'linear-gradient(rgba(17, 24, 39, 0.9), rgba(17, 24, 39, 0.9)), url("/images/hero-banner.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>
                <div className="illus-icon">🏭</div>
                <h2>Grow with HRMS Pro</h2>
                <p>Join thousands of hardware suppliers streamlining their fulfillment through our automated retail engine.</p>
                
                <div className="feat-list">
                    <div className="feat-item">
                        <div className="check">✓</div>
                        <span>Direct Purchase Order Integration</span>
                    </div>
                    <div className="feat-item">
                        <div className="check">✓</div>
                        <span>Real-time Inventory Syncing</span>
                    </div>
                    <div className="feat-item">
                        <div className="check">✓</div>
                        <span>Automated Payment Reconciliation</span>
                    </div>
                    <div className="feat-item">
                        <div className="check">✓</div>
                        <span>Advanced Analytics & Demand Forecasting</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
