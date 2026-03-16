import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const RiderSettings = ({ onBack }) => {
    const { user, setUser } = useAuth();
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        address: user?.rider_profile?.address || user?.riderProfile?.address || ''
    });
    const [securityData, setSecurityData] = useState({
        current_password: '',
        password: '',
        password_confirmation: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.put('/riders/me/profile', profileData);
            setMessage({ type: 'success', text: 'Profile updated successfully' });
            setUser(res.data.user);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('photo', file);

        setLoading(true);
        try {
            const res = await axios.post('/riders/me/photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage({ type: 'success', text: 'Photo updated successfully' });
            setUser(res.data.user);
        } catch (err) {
            setMessage({ type: 'error', text: 'Upload failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleSecurityUpdate = async (e) => {
        e.preventDefault();
        if (securityData.password !== securityData.password_confirmation) {
            setMessage({ type: 'error', text: 'Passwords match error' });
            return;
        }
        setLoading(true);
        try {
            await axios.put('/riders/me/security', securityData);
            setMessage({ type: 'success', text: 'Password changed successfully' });
            setSecurityData({ current_password: '', password: '', password_confirmation: '' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Password update failed' });
        } finally {
            setLoading(false);
        }
    };

    const getPhotoUrl = () => {
        if (user?.photo) {
            return user.photo.startsWith('http') ? user.photo : `/storage/${user.photo}`;
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Rider')}&background=6366f1&color=fff&size=128`;
    };

    const inputStyle = {
        width: '100%',
        padding: '0.875rem',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        fontSize: '0.95rem',
        marginTop: '0.5rem',
        outline: 'none',
        transition: 'border-color 0.2s ease',
        backgroundColor: '#fff',
        color: '#1f2937'
    };

    const labelStyle = {
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#4b5563',
        display: 'block'
    };

    return (
        <main style={{ minHeight: '100vh', backgroundColor: '#fafafa', color: '#111827', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1.25rem' }}>
                {/* Top Nav */}
                <nav style={{ display: 'flex', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <button 
                        onClick={onBack}
                        aria-label="Go back to dashboard"
                        style={{ 
                            background: 'none', border: 'none', padding: '0.5rem', 
                            cursor: 'pointer', fontSize: '1.25rem', display: 'flex', 
                            alignItems: 'center', color: '#6366f1', fontWeight: 600 
                        }}
                    >
                        <span style={{ marginRight: '8px' }}>←</span> Back
                    </button>
                </nav>

                <header style={{ marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Settings</h1>
                    <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Manage your profile and account security</p>
                </header>

                {message.text && (
                    <div 
                        role="alert"
                        style={{ 
                            padding: '1rem', 
                            borderRadius: '16px', 
                            marginBottom: '2rem',
                            backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
                            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                            color: message.type === 'success' ? '#166534' : '#991b1b',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}
                    >
                        <span>{message.type === 'success' ? '✅' : '⚠️'}</span>
                        {message.text}
                    </div>
                )}

                <div style={{ display: 'grid', gap: '2.5rem' }}>
                    {/* Profile Section */}
                    <section aria-labelledby="profile-heading">
                        <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '2rem', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                            <h2 id="profile-heading" style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1.5rem 0' }}>Personal Details</h2>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <img 
                                        src={getPhotoUrl()} 
                                        alt="Profile avatar" 
                                        style={{ width: '112px', height: '112px', borderRadius: '32px', objectFit: 'cover', border: '4px solid #fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                                    />
                                    <label 
                                        title="Change Photo"
                                        style={{ 
                                            position: 'absolute', bottom: -5, right: -5, 
                                            background: '#6366f1', color: '#fff', width: '36px', height: '36px', 
                                            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', border: '3px solid #fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        📷
                                        <input type="file" onChange={handlePhotoUpload} style={{ display: 'none' }} accept="image/*" aria-label="Upload profile photo" />
                                    </label>
                                </div>
                            </div>

                            <form onSubmit={handleProfileUpdate} style={{ display: 'grid', gap: '1.5rem' }}>
                                <div>
                                    <label htmlFor="full-name" style={labelStyle}>Full Name</label>
                                    <input 
                                        id="full-name"
                                        type="text" 
                                        value={profileData.name} 
                                        onChange={e => setProfileData({...profileData, name: e.target.value})}
                                        style={inputStyle}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="phone" style={labelStyle}>Phone Number</label>
                                    <input 
                                        id="phone"
                                        type="text" 
                                        value={profileData.phone} 
                                        onChange={e => setProfileData({...profileData, phone: e.target.value})}
                                        style={inputStyle}
                                        placeholder="+63 123 456 7890"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="address" style={labelStyle}>Current Address</label>
                                    <textarea 
                                        id="address"
                                        rows="3"
                                        value={profileData.address} 
                                        onChange={e => setProfileData({...profileData, address: e.target.value})}
                                        style={{ ...inputStyle, resize: 'none' }}
                                        placeholder="Your residential address"
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    style={{ 
                                        background: '#6366f1', color: '#fff', border: 'none', 
                                        padding: '0.875rem', borderRadius: '12px', fontWeight: 700, 
                                        cursor: 'pointer', marginTop: '0.5rem', fontSize: '1rem',
                                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                                        transition: 'opacity 0.2s ease'
                                    }}
                                >
                                    {loading ? 'Processing...' : 'Save Updates'}
                                </button>
                            </form>
                        </div>
                    </section>

                    {/* Security Section */}
                    <section aria-labelledby="security-heading">
                        <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '2rem', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                            <h2 id="security-heading" style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1.5rem 0' }}>Security</h2>
                            <form onSubmit={handleSecurityUpdate} style={{ display: 'grid', gap: '1.5rem' }}>
                                <div>
                                    <label htmlFor="current-pw" style={labelStyle}>Current Password</label>
                                    <input 
                                        id="current-pw"
                                        type="password" 
                                        value={securityData.current_password}
                                        onChange={e => setSecurityData({...securityData, current_password: e.target.value})}
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="new-pw" style={labelStyle}>New Password</label>
                                    <input 
                                        id="new-pw"
                                        type="password" 
                                        value={securityData.password}
                                        onChange={e => setSecurityData({...securityData, password: e.target.value})}
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="confirm-pw" style={labelStyle}>Confirm New Password</label>
                                    <input 
                                        id="confirm-pw"
                                        type="password" 
                                        value={securityData.password_confirmation}
                                        onChange={e => setSecurityData({...securityData, password_confirmation: e.target.value})}
                                        style={inputStyle}
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    style={{ 
                                        background: '#111827', color: '#fff', border: 'none', 
                                        padding: '0.875rem', borderRadius: '12px', fontWeight: 700, 
                                        cursor: 'pointer', marginTop: '0.5rem', fontSize: '1rem',
                                        transition: 'opacity 0.2s ease'
                                    }}
                                >
                                    {loading ? 'Processing...' : 'Update Password'}
                                </button>
                            </form>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
};

export default RiderSettings;
