import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSupplierAuth } from '../../context/SupplierAuthContext';
import { useToast } from '../../context/ToastContext';

export default function SupplierLogin() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [submitting, setSubmitting] = useState(false);
    const { login } = useSupplierAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await login(form.email, form.password);
            showToast('Login successful!');
            navigate('/supplier/dashboard');
        } catch (err) {
            showToast(err.response?.data?.message || 'Invalid credentials', 'error');
            setSubmitting(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-page__left">
                <div className="auth-box">
                    <div className="auth-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                        HRMS <span>Pro</span>
                    </div>
                    <h1 className="auth-headline">Supplier Portal</h1>
                    <p className="auth-sub">Secure access to the fulfillment network.</p>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                                placeholder="name@company.com"
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="remember-row" style={{marginBottom: '1.5rem'}}>
                            <label>
                                <input type="checkbox" /> Remember this device
                            </label>
                            <a href="#">Forgot password?</a>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', height: '44px', fontSize: '0.95rem' }}
                            disabled={submitting}
                        >
                            {submitting ? 'Authenticating...' : 'Sign In to Dashboard'}
                        </button>
                    </form>

                    <div className="auth-footer" style={{ marginTop: '2.5rem' }}>
                        <p>New partner? <Link to="/supplier/register">Apply for access</Link></p>
                        <p style={{ marginTop: '0.5rem', opacity: 0.7 }}>
                            Looking for <Link to="/login">Admin Access</Link>?
                        </p>
                    </div>
                </div>
            </div>

            <div className="auth-page__right" style={{ 
                backgroundImage: 'linear-gradient(rgba(17, 24, 39, 0.9), rgba(17, 24, 39, 0.9)), url("/images/hero-banner.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>
                <div className="illus-icon">📦</div>
                <h2>Fulfillment Excellence</h2>
                <p>Monitor your purchase orders and manage stock availability through our high-performance supplier gateway.</p>
                
                <div className="steps-list" style={{ marginTop: '2.5rem' }}>
                    <div className="step-item">
                        <div className="step-num">1</div>
                        <span>Receive Digital Purchase Orders</span>
                    </div>
                    <div className="step-item">
                        <div className="step-num">2</div>
                        <span>Confirm Stock Availability</span>
                    </div>
                    <div className="step-item">
                        <div className="step-num">3</div>
                        <span>Schedule Warehouse Dispatches</span>
                    </div>
                    <div className="step-item">
                        <div className="step-num">4</div>
                        <span>Track Automated Settlements</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
