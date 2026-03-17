import React, { useState } from 'react';
import { useSupplierAuth } from '../../context/SupplierAuthContext';
import { useToast } from '../../context/ToastContext';
import axios from 'axios';

export default function SupplierSettings() {
    const { supplier, logout } = useSupplierAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('profile');
    const [saving, setSaving] = useState(false);

    const [profile, setProfile] = useState({
        name: supplier?.name || '',
        email: supplier?.email || '',
        phone: supplier?.phone || '',
        address: supplier?.address || '',
        city: supplier?.city || '',
    });

    const [passwords, setPasswords] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.put('/supplier/auth/profile', profile);
            showToast('Profile updated successfully', 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to update profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.new_password !== passwords.new_password_confirmation) {
            showToast('Passwords do not match', 'error');
            return;
        }
        setSaving(true);
        try {
            await axios.put('/supplier/auth/change-password', passwords);
            showToast('Password changed successfully', 'success');
            setPasswords({ current_password: '', new_password: '', new_password_confirmation: '' });
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to change password', 'error');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: '👤' },
        { id: 'categories', label: 'Categories', icon: '📂' },
        { id: 'security', label: 'Security', icon: '🔒' },
        { id: 'notifications', label: 'Notifications', icon: '🔔' },
    ];

    const [categories, setCategories] = useState([]);
    const [newCat, setNewCat] = useState('');
    const [loadingCats, setLoadingCats] = useState(false);

    React.useEffect(() => {
        if (activeTab === 'categories') fetchCategories();
    }, [activeTab]);

    const fetchCategories = async () => {
        setLoadingCats(true);
        try {
            const res = await axios.get('/supplier/categories');
            setCategories(res.data.data || []);
        } finally { setLoadingCats(false); }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCat.trim()) return;
        setSaving(true);
        try {
            await axios.post('/supplier/categories', { name: newCat });
            setNewCat('');
            fetchCategories();
            showToast('Category added', 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to add category', 'error');
        } finally { setSaving(false); }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Are you sure? This will delete the category.')) return;
        try {
            await axios.delete(`/supplier/categories/${id}`);
            fetchCategories();
            showToast('Category deleted', 'success');
        } catch (err) {
            showToast('Failed to delete category', 'error');
        }
    };

    return (
        <div className="settings-container">
            <div className="settings-sidebar">
                <div className="sidebar-nav">
                    {tabs.map(tab => (
                        <div
                            key={tab.id}
                            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span>
                            {tab.label}
                        </div>
                    ))}
                </div>
            </div>

            <div className="settings-content">
                {activeTab === 'categories' && (
                    <>
                        <div className="content-header">
                            <h2>Product Categories</h2>
                            <p>Manage the categories used to organize your products</p>
                        </div>
                        
                        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '1.5rem', marginBottom: '1.5rem' }}>
                            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '0.75rem' }}>
                                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                    <input 
                                        type="text" 
                                        placeholder="Category Name (e.g. Variants, Size etc.)" 
                                        value={newCat}
                                        onChange={e => setNewCat(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Adding...' : '+ Add Category'}
                                </button>
                            </form>
                        </div>

                        <div className="category-list">
                            {loadingCats ? <div className="spinner-sm" /> : categories.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No categories created yet</div>
                            ) : categories.map(cat => (
                                <div key={cat.id} style={{ 
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '1rem', borderBottom: '1px solid #f1f5f9', background: '#fff'
                                }}>
                                    <span style={{ fontWeight: 600 }}>{cat.name}</span>
                                    <button 
                                        onClick={() => handleDeleteCategory(cat.id)}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === 'profile' && (
                    <>
                        <div className="content-header">
                            <h2>Company Profile</h2>
                            <p>Manage your supplier information and contact details</p>
                        </div>

                        <div className="logo-upload-section">
                            <div className="logo-preview">{supplier?.name?.charAt(0) || 'S'}</div>
                            <div className="upload-controls">
                                <h4>{supplier?.name}</h4>
                                <p>Supplier Account • {supplier?.email}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveProfile}>
                            <div className="form-section-title">Business Information</div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Company Name</label>
                                    <input type="text" value={profile.name}
                                        onChange={e => setProfile({ ...profile, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" value={profile.email}
                                        onChange={e => setProfile({ ...profile, email: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="tel" value={profile.phone}
                                        onChange={e => setProfile({ ...profile, phone: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>City</label>
                                    <input type="text" value={profile.city}
                                        onChange={e => setProfile({ ...profile, city: e.target.value })} />
                                </div>
                                <div className="form-group form-group-full">
                                    <label>Complete Address</label>
                                    <textarea rows="3" value={profile.address}
                                        onChange={e => setProfile({ ...profile, address: e.target.value })} />
                                </div>
                            </div>
                            <div className="d-flex justify-end pt-4 border-top">
                                <button className="btn btn-primary" type="submit" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {activeTab === 'security' && (
                    <>
                        <div className="content-header">
                            <h2>Security Settings</h2>
                            <p>Change your password and manage security options</p>
                        </div>
                        <form onSubmit={handleChangePassword}>
                            <div className="form-section-title">Change Password</div>
                            <div style={{ maxWidth: 480 }}>
                                <div className="form-group">
                                    <label>Current Password</label>
                                    <input type="password" value={passwords.current_password}
                                        onChange={e => setPasswords({ ...passwords, current_password: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <input type="password" value={passwords.new_password}
                                        onChange={e => setPasswords({ ...passwords, new_password: e.target.value })} required minLength={8} />
                                </div>
                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <input type="password" value={passwords.new_password_confirmation}
                                        onChange={e => setPasswords({ ...passwords, new_password_confirmation: e.target.value })} required />
                                </div>
                            </div>
                            <div className="d-flex justify-end pt-4 border-top">
                                <button className="btn btn-primary" type="submit" disabled={saving}>
                                    {saving ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {activeTab === 'notifications' && (
                    <>
                        <div className="content-header">
                            <h2>Notification Preferences</h2>
                            <p>Control what notifications you receive</p>
                        </div>
                        <div className="notification-list">
                            {[
                                { t: 'New Purchase Orders', d: 'Get notified when admin creates a new PO for you' },
                                { t: 'Order Status Updates', d: 'Notifications when PO status changes (approved, received)' },
                                { t: 'Product Catalog Updates', d: 'Alerts when your promoted products are viewed by admin' },
                                { t: 'Payment Notifications', d: 'Get notified about payment processing and settlements' },
                            ].map((item, i) => (
                                <div className="toggle-switch" key={i}>
                                    <div className="toggle-info">
                                        <div className="label">{item.t}</div>
                                        <div className="desc">{item.d}</div>
                                    </div>
                                    <label className="switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="slider" />
                                    </label>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
