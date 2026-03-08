import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationPicker({ pos, setPos }) {
    useMapEvents({
        click(e) {
            setPos([e.latlng.lat, e.latlng.lng]);
        },
    });
    return pos ? <Marker position={pos} /> : null;
}

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', password: '', password_confirmation: '',
        age: '', sex: '', province: '', municipality: '', zip_code: '',
        address: '', landmark: '', latitude: '', longitude: ''
    });
    const [mapPos, setMapPos] = useState([7.0707, 125.6080]); // Default Davao
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setFormData(prev => ({ ...prev, latitude: mapPos[0], longitude: mapPos[1] }));
    }, [mapPos]);

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
        <div className="auth-page auth-page--wide">
            <div className="auth-page__left">
                <div className="auth-box auth-box--wide">
                    <div className="auth-logo">HRMS <span>Pro</span></div>
                    <h1 className="auth-headline">Create Account</h1>
                    <p className="auth-sub">Join as a new customer to start shopping.</p>

                    {error && <div className="auth-error">{error}</div>}

                    <form onSubmit={handleSubmit} className="register-grid">
                        <div className="form-section">
                            <h3 className="section-title">Personal Information</h3>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input name="name" type="text" required onChange={handleChange} placeholder="First & Last Name" />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input name="email" type="email" required onChange={handleChange} placeholder="name@example.com" />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input name="phone" type="tel" required onChange={handleChange} placeholder="09123456789" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Age</label>
                                    <input name="age" type="number" onChange={handleChange} placeholder="Years" />
                                </div>
                                <div className="form-group">
                                    <label>Sex</label>
                                    <select name="sex" onChange={handleChange} className="form-control">
                                        <option value="">Select Sex</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Password</label>
                                    <input name="password" type="password" required minLength={8} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Confirm Password</label>
                                    <input name="password_confirmation" type="password" required minLength={8} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="section-title">Delivery Address</h3>
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
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Zip Code</label>
                                    <input name="zip_code" type="text" required onChange={handleChange} placeholder="e.g. 8000" />
                                </div>
                                <div className="form-group">
                                    <label>Landmark (Optional)</label>
                                    <input name="landmark" type="text" onChange={handleChange} placeholder="Near church, school, etc." />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>House # / Street / Barangay</label>
                                <input name="address" type="text" required onChange={handleChange} placeholder="Specific Address Details" />
                            </div>
                            
                            <div className="map-picker-container">
                                <label>Pin your location for accurate delivery 📍</label>
                                <div className="map-picker-frame">
                                    <MapContainer center={mapPos} zoom={15} style={{ height: '180px', width: '100%', borderRadius: '12px' }}>
                                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                        <LocationPicker pos={mapPos} setPos={setMapPos} />
                                    </MapContainer>
                                </div>
                                <p className="map-hint text-xs mt-1 text-slate-500 italic">Click on the map to drop your delivery pin.</p>
                            </div>
                        </div>

                        <div className="register-actions">
                            <button className="btn btn-primary w-full justify-center" disabled={loading} style={{ padding: '1rem' }}>
                                {loading ? 'Creating Account...' : 'Complete Registration'}
                            </button>
                        </div>
                    </form>

                    <div className="auth-footer">
                        Already have an account? <Link to="/login">Sign in</Link>
                        <hr className="my-4 op-1" />
                        <Link to="/rider/register" className="text-amber font-semi text-sm">Join our delivery fleet! Apply as a Rider &rarr;</Link>
                    </div>
                </div>
            </div>
            
            <div className="auth-page__right">
                <div className="illus-icon">🤝</div>
                <h2>Join Our Platform</h2>
                <p>Register as a customer to browse hardware supplies, place orders, and track your deliveries.</p>
            </div>
        </div>
    );
}
