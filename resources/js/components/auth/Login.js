import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSupplierAuth } from '../../context/SupplierAuthContext';

export default function Login() {
    const { login: userLogin } = useAuth();
    const { login: supplierLogin } = useSupplierAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await userLogin(email, password, null);
            if (user.role === 'rider')         navigate('/rider',     { replace: true });
            else if (user.role === 'customer') navigate('/shop',      { replace: true });
            else                               navigate('/dashboard', { replace: true });
            return;
        } catch (userErr) {
            const status = userErr.response?.status;
            if (!status || (status !== 401 && status !== 422 && status !== 403)) {
                setError('Network error. Please try again.');
                setLoading(false);
                return;
            }
        }

        try {
            await supplierLogin(email, password);
            navigate('/supplier/dashboard', { replace: true });
        } catch (supplierErr) {
            setError('Invalid email or password. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-page__left">
                <div className="auth-box">
                    <div className="auth-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                        HRMS <span>Pro</span>
                    </div>
                    <h1 className="auth-headline">Unified Access Portal</h1>
                    <p className="auth-sub">Enter your credentials to manage your hardware operations.</p>

                    {error && <div className="auth-error">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group mb-1">
                            <label>Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                        </div>

                        <div className="remember-row" style={{marginBottom: '1.5rem'}}>
                            <label style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <input type="checkbox" /> Remember me
                            </label>
                            <a href="#">Security Help?</a>
                        </div>

                        <button
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ width: '100%', height: '44px', fontSize: '0.95rem' }}
                        >
                            {loading ? 'Verifying Identity...' : 'Sign In to Instance'}
                        </button>
                    </form>

                    <div className="auth-footer" style={{ marginTop: '2.5rem' }}>
                        <p>Need a hardware account? <Link to="/register">Register here</Link></p>
                        <p style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                            Supplier Partner? <Link to="/supplier/register" style={{fontWeight: 700}}>Join our Network</Link>
                        </p>
                    </div>
                </div>
            </div>

            <div className="auth-page__right" style={{ 
                backgroundImage: 'linear-gradient(rgba(17, 24, 39, 0.9), rgba(17, 24, 39, 0.9)), url("/images/hero-banner.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>
                <div className="illus-icon">🛠️</div>
                <h2>Industrial Intelligence</h2>
                <p>Access the core engine to streamline your inventory, sales, and logistics workflows.</p>
                <div className="feat-list" style={{ marginTop: '2.5rem' }}>
                    <div className="feat-item"><div className="check">✓</div> Multi-Role Permissions</div>
                    <div className="feat-item"><div className="check">✓</div> End-to-End Fulfillment</div>
                    <div className="feat-item"><div className="check">✓</div> Live Data & Analytics</div>
                </div>
            </div>
        </div>
    );
}
