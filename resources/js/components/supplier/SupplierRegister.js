// SupplierRegister.js - Supplier Self-Registration
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
            navigate('/supplier/login');
        } catch (err) {
            showToast(err.response?.data?.message || 'Registration failed', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Supplier Registration</h1>
                    <p>Create your supplier account to manage orders</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Company Name *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                            placeholder="Your company name"
                        />
                    </div>

                    <div className="form-group">
                        <label>Contact Person *</label>
                        <input
                            type="text"
                            value={form.contact_name}
                            onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                            required
                            placeholder="Primary contact person"
                        />
                    </div>

                    <div className="form-group">
                        <label>Email *</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            required
                            placeholder="supplier@company.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>Phone</label>
                        <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            placeholder="Contact phone number"
                        />
                    </div>

                    <div className="form-group">
                        <label>Address</label>
                        <textarea
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            placeholder="Company address"
                            rows="2"
                        />
                    </div>

                    <div className="form-group">
                        <label>Password * (min 8 characters)</label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                            minLength="8"
                            placeholder="Create a password"
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirm Password *</label>
                        <input
                            type="password"
                            value={form.password_confirmation}
                            onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                            required
                            placeholder="Confirm your password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={submitting}
                    >
                        {submitting ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <Link to="/supplier/login">Sign in here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
