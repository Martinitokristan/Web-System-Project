import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';

export default function RiderRegister() {
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        vehicle_type: 'Motorcycle',
        plate_number: '',
        license_number: '',
        address: '',
        valid_id_type: 'Drivers License',
    });
    const [idFile, setIdFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.password_confirmation) {
            showToast('Passwords do not match', 'error');
            return;
        }

        const formData = new FormData();
        Object.keys(form).forEach(key => formData.append(key, form[key]));
        formData.append('role', 'rider');
        if (idFile) formData.append('valid_id_file', idFile);

        setSubmitting(true);
        try {
            await axios.post('/auth/register', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast('Application submitted! Please wait for admin review and interview schedule.', 'success');
            navigate('/login');
        } catch (err) {
            showToast(err.response?.data?.message || 'Registration failed', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-page__left">
                <div className="auth-box auth-box--wide">
                    <div className="auth-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                        HRMS <span>Pro</span>
                    </div>
                    <h1 className="auth-headline">Rider Fleet Application</h1>
                    <p className="auth-sub">Apply to become a professional logistics partner.</p>

                    <form onSubmit={handleSubmit} className="register-grid">
                        <div className="form-section">
                            <div className="section-title">
                                <span style={{fontSize: '1.1rem'}}>👤</span> Driver Profile
                            </div>
                            <div className="form-group">
                                <label>Full Legal Name *</label>
                                <input 
                                    type="text" 
                                    value={form.name} 
                                    onChange={(e) => setForm({...form, name: e.target.value})} 
                                    required 
                                    placeholder="Enter your full name" 
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email Address *</label>
                                    <input 
                                        type="email" 
                                        value={form.email} 
                                        onChange={(e) => setForm({...form, email: e.target.value})} 
                                        required 
                                        placeholder="email@example.com" 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number *</label>
                                    <input 
                                        type="tel" 
                                        value={form.phone} 
                                        onChange={(e) => setForm({...form, phone: e.target.value})} 
                                        required 
                                        placeholder="09XXXXXXXXX" 
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Current Residential Address *</label>
                                <textarea 
                                    value={form.address}
                                    onChange={(e) => setForm({...form, address: e.target.value})}
                                    required
                                    placeholder="Complete home address"
                                    rows="2"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>System Password *</label>
                                    <input 
                                        type="password" 
                                        value={form.password} 
                                        onChange={(e) => setForm({...form, password: e.target.value})} 
                                        required 
                                        minLength="8" 
                                        placeholder="Min 8 chars"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Confirm Password *</label>
                                    <input 
                                        type="password" 
                                        value={form.password_confirmation} 
                                        onChange={(e) => setForm({...form, password_confirmation: e.target.value})} 
                                        required 
                                        placeholder="Repeat password"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <div className="section-title">
                                <span style={{fontSize: '1.1rem'}}>🚛</span> Logistics Equipment
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Vehicle Category</label>
                                    <select 
                                        className="form-control"
                                        value={form.vehicle_type}
                                        onChange={(e) => setForm({...form, vehicle_type: e.target.value})}
                                    >
                                        <option value="Motorcycle">Motorcycle</option>
                                        <option value="Bicycle">Bicycle</option>
                                        <option value="Car">Car</option>
                                        <option value="Van/Truck">Van/Truck</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Plate Number</label>
                                    <input 
                                        type="text" 
                                        value={form.plate_number} 
                                        onChange={(e) => setForm({...form, plate_number: e.target.value})} 
                                        required 
                                        placeholder="ABC-1234" 
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Driver's License Number</label>
                                <input 
                                    type="text" 
                                    value={form.license_number} 
                                    onChange={(e) => setForm({...form, license_number: e.target.value})} 
                                    required 
                                    placeholder="NXX-XX-XXXXXX" 
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Verification ID Type</label>
                                    <select 
                                        className="form-control"
                                        value={form.valid_id_type}
                                        onChange={(e) => setForm({...form, valid_id_type: e.target.value})}
                                    >
                                        <option value="Drivers License">Drivers License</option>
                                        <option value="UMID">UMID</option>
                                        <option value="SSS">SSS</option>
                                        <option value="Passport">Passport</option>
                                        <option value="National ID">National ID</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>ID Image Upload</label>
                                    <input 
                                        type="file" 
                                        onChange={(e) => setIdFile(e.target.files[0])} 
                                        required 
                                        accept="image/*"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="register-actions">
                            <button className="btn btn-primary" disabled={submitting} style={{ width: '100%', height: '44px', fontSize: '0.95rem' }}>
                                {submitting ? 'Processing Application...' : 'Submit Professional Application'}
                            </button>
                            
                            <div className="auth-footer" style={{ marginTop: '2rem' }}>
                                Already have a rider account? <Link to="/login">Rider Sign In</Link>
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
                <div className="illus-icon">🛵</div>
                <h2>Fleet Partnership</h2>
                <p>Join our professional last-mile delivery fleet. High commission rates and automated route optimization.</p>
                <div className="steps-list" style={{ marginTop: '2.5rem' }}>
                    <div className="step-item">
                        <div className="step-num">1</div>
                        <div><strong>Application:</strong> Submit your credentials.</div>
                    </div>
                    <div className="step-item">
                        <div className="step-num">2</div>
                        <div><strong>Verification:</strong> Document review by HR.</div>
                    </div>
                    <div className="step-item">
                        <div className="step-num">3</div>
                        <div><strong>Verification:</strong> Interview & Screening.</div>
                    </div>
                    <div className="step-item">
                        <div className="step-num">4</div>
                        <div><strong>Deployment:</strong> Start your first route.</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
