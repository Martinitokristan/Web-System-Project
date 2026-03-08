import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Intended role from query param or default to admin
        const params = new URLSearchParams(window.location.search);
        const intendedRole = params.get('role');

        try {
            const user = await login(email, password, intendedRole);
            if (user.role === 'rider') navigate('/rider');
            else if (user.role === 'customer') navigate('/shop');
            else navigate('/dashboard');
        } catch (err) {
            const valErr = err.response?.data?.errors?.email?.[0];
            setError(valErr || err.response?.data?.message || 'Login failed. Please check your credentials.');
            setLoading(false);
        }
    };

    const params = new URLSearchParams(window.location.search);
    const roleLabel = params.get('role');
    const displayRole = roleLabel ? roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1) : 'Portal';

    return (
        <div className="auth-page">
            <div className="auth-page__left">
                <div className="auth-box">
                    <div className="auth-logo">HRMS <span>Pro</span></div>
                    <h1 className="auth-headline">{displayRole} Login</h1>
                    <p className="auth-sub">Enter your credentials to access your account.</p>

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
                            />
                        </div>

                        <div className="remember-row">
                            <label>
                                <input type="checkbox" /> Remember me
                            </label>
                            <a>Forgot password?</a>
                        </div>

                        <button className="btn btn-primary w-full justify-center" disabled={loading} style={{ padding: '0.75rem' }}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Don't have an account? <Link to="/register">Register here</Link>
                    </div>
                </div>
            </div>
            
            <div className="auth-page__right">
                <div className="illus-icon">📦</div>
                <h2>Hardware Retail Management</h2>
                <p>Everything you need to manage inventory, process sales, and track deliveries efficiently.</p>
                
                <div className="feat-list">
                    <div className="feat-item"><div className="check">✓</div> Real-time stock alerts</div>
                    <div className="feat-item"><div className="check">✓</div> Automated PO generation</div>
                    <div className="feat-item"><div className="check">✓</div> Live rider tracking</div>
                </div>
            </div>
        </div>
    );
}
