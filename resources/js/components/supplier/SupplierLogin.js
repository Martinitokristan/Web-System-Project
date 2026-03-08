// SupplierLogin.js - Supplier Portal Login Page
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
            // Don't setSubmitting(false) here - component will unmount after navigate
        } catch (err) {
            showToast(err.response?.data?.message || 'Invalid credentials', 'error');
            setSubmitting(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Supplier Portal</h1>
                    <p>Sign in to manage your purchase orders</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            required
                            placeholder="supplier@company.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                            placeholder="Enter your password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={submitting}
                    >
                        {submitting ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Don't have an account?{' '}
                        <Link to="/supplier/register">Register here</Link>
                    </p>
                    <p className="mt-2">
                        <Link to="/login">Admin Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
