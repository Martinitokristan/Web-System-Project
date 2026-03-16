import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', password: '', password_confirmation: '',
        age: '', sex: '', province: '', municipality: '', zip_code: '',
        address: '', landmark: '', latitude: '', longitude: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register(formData);
            navigate('/shop');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-page__left">
                <div className="auth-box auth-box--wide">
                    <div className="auth-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                        HRMS <span>Pro</span>
                    </div>
                    <h1 className="auth-headline">Create Customer Account</h1>
                    <p className="auth-sub">Enter your details to start ordering high-quality supplies.</p>

                    {error && <div className="auth-error">{error}</div>}

                    <form onSubmit={handleSubmit} className="register-grid">
                        <div className="form-section">
                            <h3 className="section-title">👤 Account Security</h3>
                            <div className="form-group">
                                <label>Username / Display Name</label>
                                <input name="name" type="text" required onChange={handleChange} placeholder="First & Last Name" />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input name="email" type="email" required onChange={handleChange} placeholder="name@email.com" />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input name="phone" type="tel" required onChange={handleChange} placeholder="09xxxxxxxxx" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Password</label>
                                    <input name="password" type="password" required minLength={8} onChange={handleChange} placeholder="Min 8 chars" />
                                </div>
                                <div className="form-group">
                                    <label>Confirm Password</label>
                                    <input name="password_confirmation" type="password" required minLength={8} onChange={handleChange} placeholder="Repeat password" />
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="section-title">📍 Shipment Details</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Province</label>
                                    <input name="province" type="text" required onChange={handleChange} placeholder="e.g. Davao del Sur" />
                                </div>
                                <div className="form-group">
                                    <label>Municipality/City</label>
                                    <input name="municipality" type="text" required onChange={handleChange} placeholder="e.g. Davao City" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Specific Address (House #, Street, Barangay)</label>
                                <input name="address" type="text" required onChange={handleChange} placeholder="Full address details" />
                            </div>
                            
                            <div className="form-group">
                                <label>Landmark / Delivery Instructions</label>
                                <input name="landmark" type="text" onChange={handleChange} placeholder="Optional: e.g. Near Blue Gate" />
                            </div>
                        </div>

                        <div className="register-actions">
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <button className="btn btn-primary" disabled={loading} style={{ width: '100%', maxWidth: '300px', height: '44px', fontSize: '0.95rem' }}>
                                    {loading ? 'Initializing Interface...' : 'Join as Active Customer'}
                                </button>
                            </div>
                            
                            <div className="auth-footer" style={{ marginTop: '2rem' }}>
                                Already registered? <Link to="/login">Sign In</Link>
                                <div style={{marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9'}}>
                                    <Link to="/rider/register" className="text-accent" style={{fontWeight: 700}}>Apply as Delivery Rider &rarr;</Link>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            
            <div className="auth-page__right" style={{ 
                backgroundImage: 'linear-gradient(rgba(17, 24, 39, 0.9), rgba(17, 24, 39, 0.9)), url("/images/hero-banner.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>
                <div className="illus-icon">🛡️</div>
                <h2>Industrial Access</h2>
                <p>Register to unlock our complete catalog of professional construction materials and logistics services.</p>
                <div className="feat-list">
                    <div className="feat-item">
                        <div className="check">✓</div>
                        <span>Direct Warehouse Pricing</span>
                    </div>
                    <div className="feat-item">
                        <div className="check">✓</div>
                        <span>Live GPS Order Tracking</span>
                    </div>
                    <div className="feat-item">
                        <div className="check">✓</div>
                        <span>Secure Digital Invoicing</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
