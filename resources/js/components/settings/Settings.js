import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';

const TABS = [
    { id: 'general', label: 'General', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { id: 'categories', label: 'Categories', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
    { id: 'sizes', label: 'Sizes', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'colors', label: 'Colors', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
    { id: 'weights', label: 'Grams & Weights', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3' },
    { id: 'master_variants', label: 'Variant Types', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
    { id: 'units', label: 'Unit Conversions', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
    { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', count: 3 },
    { id: 'security', label: 'Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002-2zm10-10V7a4 4 0 00-8 0v4h8z' }
];

export default function Settings() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState({});
    const [variants, setVariants] = useState([]);
    const [conversions, setConversions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

    const [newVal, setNewVal] = useState({ variant_id: '', label: '', hex_code: '', description: '', category: '' });
    const [newConv, setNewConv] = useState({ category_id: '', purchase_unit: '', sell_unit: '', conversion_factor: 1 });
    const [newVariant, setNewVariant] = useState({ id: null, name: '', description: '', status: 'active' });
    const [newUnitType, setNewUnitType] = useState({ id: null, purchase_unit: '', sell_unit: '', multiplier: 1 });
    const [newCat, setNewCat] = useState({ id: null, name: '', description: '' });
    const [modal, setModal] = useState({ open: false, type: '', title: '', data: null });

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                const res = await axios.get('/settings');
                if (!isMounted) return;
                const { settings, variants, unitTypes, categories } = res.data.data;
                setSettings(settings || {});
                setVariants(variants || []);
                setCategories(categories || []);
                setConversions(unitTypes || []);
            } catch (err) {
                if (isMounted) showToast('Failed to load settings', 'error');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [refreshTrigger]);

    const handleChange = (key, value) => {
        setSettings({
            ...settings,
            [activeTab]: {
                ...(settings[activeTab] || {}),
                [key]: value
            }
        });
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await axios.put('/settings', {
                group: activeTab,
                settings: settings[activeTab] || {}
            });
            showToast('Settings saved');
            triggerRefresh();
        } catch (e) {
            showToast('Failed to save', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveVal = async (variantId) => {
        try {
            await axios.post('/settings/variant-values', { ...newVal, variant_id: variantId });
            showToast('Value added');
            setNewVal({ variant_id: '', label: '', hex_code: '', description: '', category: '' });
            triggerRefresh();
        } catch (e) {
            showToast('Error saving value', 'error');
        }
    };

    const handleDeleteVal = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            await axios.delete(`/settings/variant-values/${id}`);
            triggerRefresh();
        } catch (e) {
            showToast('Error deleting value', 'error');
        }
    };

    const handleSaveType = async () => {
        try {
            await axios.post('/settings/variant-types', newVariant);
            showToast('Variant type saved');
            setModal({ open: false });
            triggerRefresh();
        } catch (e) {
            showToast('Error saving variant type', 'error');
        }
    };

    const handleSaveConv = async () => {
        try {
            await axios.post('/settings/unit-conversions', newConv);
            showToast('Rule added');
            setNewConv({ category_id: '', purchase_unit: '', sell_unit: '', conversion_factor: 1 });
            triggerRefresh();
        } catch (e) {
            showToast('Error saving rule', 'error');
        }
    };

    const handleSaveUnit = async () => {
        try {
            await axios.post('/settings/unit-types', newUnitType);
            showToast('Unit type saved');
            setModal({ open: false });
            triggerRefresh();
        } catch (e) {
            showToast('Error saving unit type', 'error');
        }
    };

    const handleDeleteUnit = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            await axios.delete(`/settings/unit-types/${id}`);
            triggerRefresh();
        } catch (e) {
            showToast('Error deleting unit type', 'error');
        }
    };

    const handleSaveCat = async () => {
        try {
            await axios.post('/settings/categories', newCat);
            showToast('Category saved');
            setModal({ open: false });
            triggerRefresh();
        } catch (e) {
            showToast('Error saving category', 'error');
        }
    };

    const handleDeleteCat = async (id) => {
        if (!confirm('Are you sure you want to delete this category? This might affect products linked to it.')) return;
        try {
            await axios.delete(`/settings/categories/${id}`);
            showToast('Category deleted');
            triggerRefresh();
        } catch (e) {
            showToast('Error deleting category', 'error');
        }
    };

    if (loading) return <div className="loading-page"><div className="spinner" /></div>;

    const renderIcon = (d) => (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" style={{ width: 20, height: 20 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d={d} />
        </svg>
    );

    return (
        <div className="settings-container">
            <div className="settings-sidebar">
                <div className="sidebar-nav">
                    {TABS.slice(0, 5).map(tab => (
                        <div
                            key={tab.id}
                            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {renderIcon(tab.icon)}
                            {tab.label}
                        </div>
                    ))}
                    <div className="sidebar-section-title">System</div>
                    {TABS.slice(5).map(tab => (
                        <div
                            key={tab.id}
                            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {renderIcon(tab.icon)}
                            {tab.label}
                            {tab.count && <span className="badge badge--red ml-auto" style={{ padding: '2px 6px', fontSize: 10 }}>{tab.count}</span>}
                        </div>
                    ))}
                </div>
            </div>

            <div className="settings-content">

                {/* ── GENERAL ── */}
                {activeTab === 'general' && (
                    <>
                        <div className="content-header">
                            <h2>General Settings</h2>
                            <p>Store information, branding, and business details</p>
                        </div>
                        <div className="logo-upload-section">
                            <div className="logo-preview">{settings.general?.store_name?.charAt(0) || 'H'}</div>
                            <div className="upload-controls">
                                <h4>Store Logo</h4>
                                <p>PNG or JPG, max 2MB. Recommended size: 256×256px</p>
                                <div className="btn-group">
                                    <button className="btn btn--white" style={{ border: '1px solid var(--border)' }}>Upload Logo</button>
                                    <button className="btn btn--white text-red" style={{ border: 'none' }}>Remove</button>
                                </div>
                            </div>
                        </div>
                        <div className="form-section-title">Business Information</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Store Name</label>
                                <input type="text" value={settings.general?.store_name || ''} onChange={e => handleChange('store_name', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Contact Number</label>
                                <input type="text" value={settings.general?.contact_number || ''} onChange={e => handleChange('contact_number', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Business Email</label>
                                <input type="email" value={settings.general?.contact_email || ''} onChange={e => handleChange('contact_email', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Tax Rate (%)</label>
                                <input type="number" value={settings.general?.tax_rate || '12'} onChange={e => handleChange('tax_rate', e.target.value)} />
                            </div>
                            <div className="form-group form-group-full">
                                <label>Complete Store Address</label>
                                <textarea rows="3" value={settings.general?.store_address || ''} onChange={e => handleChange('store_address', e.target.value)} />
                            </div>
                        </div>
                        <div className="d-flex justify-end pt-4 border-top">
                            <button className="btn btn-primary" onClick={handleSaveSettings} disabled={saving}>Save Changes</button>
                        </div>
                    </>
                )}

                {/* ── CATEGORIES ── */}
                {activeTab === 'categories' && (
                    <div className="tab-categories">
                        <div className="d-flex justify-between align-center mb-4">
                            <div>
                                <h2>Category Management</h2>
                                <p className="text-muted">Organize your products into logical groups</p>
                            </div>
                            <button className="btn btn-primary" onClick={() => {
                                setNewCat({ id: null, name: '', description: '' });
                                setModal({ open: true, type: 'category', title: 'Add New Category' });
                            }}>+ Add Category</button>
                        </div>
                        
                        <div className="variant-cards-grid">
                            {categories.map(cat => (
                                <div className="variant-card" key={cat.id}>
                                    <div className="card-header">
                                        <div className="icon-box">{renderIcon('M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z')}</div>
                                        <div className="info">
                                            <h4>{cat.name}</h4>
                                            <p>{cat.description || 'No description provided.'}</p>
                                        </div>
                                    </div>
                                    <div className="card-footer">
                                        <button className="btn btn--white flex-1" onClick={() => {
                                            setNewCat(cat);
                                            setModal({ open: true, type: 'category', title: 'Edit Category' });
                                        }}>Edit</button>
                                        <button className="btn btn--white text-red" onClick={() => handleDeleteCat(cat.id)}>Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── SIZES ── */}
                {activeTab === 'sizes' && (
                    <div className="tab-sizes">
                        <div className="d-flex justify-between align-center mb-4">
                            <div>
                                <h2>Size Management</h2>
                                <p className="text-muted">Define sizes used across products (e.g. screw lengths, pipe diameters)</p>
                            </div>
                        </div>
                        <div className="table-wrap p-3 mb-4" style={{ background: '#fffefd', border: '1px solid #ffe8db' }}>
                            <h5 className="mb-3 text-orange">+ Add New Size</h5>
                            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 100px' }}>
                                <div className="form-group m-0"><label>Size Label</label><input type="text" placeholder="e.g. 3 inch, Small, XL" value={newVal.label} onChange={e => setNewVal({...newVal, label: e.target.value})} /></div>
                                <div className="form-group m-0">
                                    <label>Category / Group</label>
                                    <select value={newVal.category} onChange={e => setNewVal({...newVal, category: e.target.value})}>
                                        <option value="">No Category</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group m-0"><label>Description</label><input type="text" placeholder="Optional note" value={newVal.description} onChange={e => setNewVal({...newVal, description: e.target.value})} /></div>
                                <button className="btn btn-primary mt-auto" style={{ height: 42 }} onClick={() => handleSaveVal(1)}>Add</button>
                            </div>
                        </div>
                        <table className="settings-table">
                            <thead>
                                <tr><th>#</th><th>Size Label</th><th>Category / Group</th><th>Description</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {variants.find(v => v.id === 1)?.values.map((v, i) => (
                                    <tr key={v.id}>
                                        <td>{String(i + 1).padStart(2, '0')}</td>
                                        <td className="font-bold">{v.label}</td>
                                        <td><span className="badge badge--white" style={{ border: '1px solid var(--border)' }}>{categories.find(c => c.id == v.category)?.name || v.category || '—'}</span></td>
                                        <td>{v.description}</td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <button className="btn btn--white p-1 text-orange" onClick={() => setNewVal(v)}>{renderIcon('M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z')}</button>
                                                <button className="btn btn--white p-1 text-red" onClick={() => handleDeleteVal(v.id)}>{renderIcon('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16')}</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── COLORS ── */}
                {activeTab === 'colors' && (
                    <div className="tab-colors">
                        <div className="d-flex justify-between align-center mb-4">
                            <div>
                                <h2>Color Management</h2>
                                <p className="text-muted">Manage paint colors, product color variants, and swatches</p>
                            </div>
                        </div>
                        <div className="table-wrap p-3 mb-4" style={{ background: '#f8fbff', border: '1px solid #e1ebff' }}>
                            <h5 className="mb-3 text-primary">+ Add New Color</h5>
                            <div className="form-grid" style={{ gridTemplateColumns: '60px 1fr 1fr 1fr 100px' }}>
                                <div className="form-group m-0"><label>Swatch</label><div className="swatch" style={{ background: newVal.hex_code || '#fff', border: '1px solid var(--border)', height: 42, width: '100%' }}></div></div>
                                <div className="form-group m-0"><label>Color Name</label><input type="text" placeholder="e.g. Ivory White" value={newVal.label} onChange={e => setNewVal({...newVal, label: e.target.value})} /></div>
                                <div className="form-group m-0"><label>Hex Code</label><input type="text" placeholder="#FFFFFF" value={newVal.hex_code} onChange={e => setNewVal({...newVal, hex_code: e.target.value})} /></div>
                                <div className="form-group m-0">
                                    <label>Category</label>
                                    <select value={newVal.category} onChange={e => setNewVal({...newVal, category: e.target.value})}>
                                        <option value="">No Category</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <button className="btn btn-primary mt-auto" style={{ height: 42 }} onClick={() => handleSaveVal(2)}>Add</button>
                            </div>
                        </div>
                        <table className="settings-table">
                            <thead>
                                <tr><th>Swatch</th><th>Color Name</th><th>Hex Code</th><th>Category</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {variants.find(v => v.id === 2)?.values.map(v => (
                                    <tr key={v.id}>
                                        <td><div className="swatch" style={{ background: v.hex_code }}></div></td>
                                        <td className="font-bold">{v.label}</td>
                                        <td className="text-muted font-mono" style={{ fontSize: 12 }}>{v.hex_code}</td>
                                        <td><span className="badge badge--white" style={{ border: '1px solid var(--border)' }}>{categories.find(c => c.id == v.category)?.name || v.category || '—'}</span></td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <button className="btn btn--white p-1 text-orange">{renderIcon('M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z')}</button>
                                                <button className="btn btn--white p-1 text-red" onClick={() => handleDeleteVal(v.id)}>{renderIcon('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16')}</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── WEIGHTS ── */}
                {activeTab === 'weights' && (
                    <div className="tab-sizes">
                        <div className="d-flex justify-between align-center mb-4">
                            <div>
                                <h2>Grams & Weights Management</h2>
                                <p className="text-muted">Manage standard weights for products (e.g., 500g, 1Kg, 250ml)</p>
                            </div>
                        </div>
                        <div className="table-wrap p-3 mb-4" style={{ background: '#fff5f0', border: '1px solid #ffe4d6' }}>
                            <h5 className="mb-3 text-orange">+ Add New Weight</h5>
                            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 100px' }}>
                                <div className="form-group m-0"><label>Weight Label</label><input type="text" placeholder="e.g. 500g, 1Kg, 250ml" value={newVal.label} onChange={e => setNewVal({...newVal, label: e.target.value})} /></div>
                                <div className="form-group m-0">
                                    <label>Category / Group</label>
                                    <select value={newVal.category} onChange={e => setNewVal({...newVal, category: e.target.value})}>
                                        <option value="">No Category</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group m-0"><label>Description</label><input type="text" placeholder="Optional note" value={newVal.description} onChange={e => setNewVal({...newVal, description: e.target.value})} /></div>
                                <button className="btn btn-primary mt-auto" style={{ height: 42 }} onClick={() => handleSaveVal(3)}>Add</button>
                            </div>
                        </div>
                        <table className="settings-table">
                            <thead>
                                <tr><th>#</th><th>Weight Label</th><th>Category / Group</th><th>Description</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {variants.find(v => v.id === 3)?.values.map((v, i) => (
                                    <tr key={v.id}>
                                        <td>{String(i + 1).padStart(2, '0')}</td>
                                        <td className="font-bold">{v.label}</td>
                                        <td><span className="badge badge--white" style={{ border: '1px solid var(--border)' }}>{categories.find(c => c.id == v.category)?.name || v.category || '—'}</span></td>
                                        <td>{v.description}</td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <button className="btn btn--white p-1 text-orange" onClick={() => setNewVal(v)}>{renderIcon('M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z')}</button>
                                                <button className="btn btn--white p-1 text-red" onClick={() => handleDeleteVal(v.id)}>{renderIcon('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16')}</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── VARIANT TYPES ── ✅ FIXED: was 'variants', now 'master_variants' */}
                {activeTab === 'master_variants' && (
                    <div className="tab-variants">
                        <div className="d-flex justify-between align-center mb-4">
                            <div>
                                <h2>Variant Types</h2>
                                <p className="text-muted">Define product variant types used for grouping (e.g. Size, Color, Material)</p>
                            </div>
                            <button className="btn btn-primary" onClick={() => {
                                setNewVariant({ id: null, name: '', description: '', status: 'active' });
                                setModal({ open: true, type: 'variant', title: 'Add Variant Type' });
                            }}>+ Add Variant Type</button>
                        </div>
                        <div className="variant-cards-grid">
                            {variants.map(v => (
                                <div className="variant-card" key={v.id}>
                                    <div className="card-header">
                                        <div className="icon-box">{renderIcon(TABS.find(t => t.label === v.name || t.id === v.name.toLowerCase())?.icon || 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10')}</div>
                                        <div className="info">
                                            <h4>{v.name}</h4>
                                            <p>{v.description}</p>
                                        </div>
                                        <span className={`status-badge ${v.status}`}>{v.status.charAt(0).toUpperCase() + v.status.slice(1)}</span>
                                    </div>
                                    <div className="text-muted small mt-2">
                                        Values: {v.values.slice(0, 5).map(val => val.label).join(', ')}{v.values.length > 5 ? '...' : ''}
                                    </div>
                                    <div className="card-footer">
                                        <button className="btn btn--white flex-1" style={{ border: '1px solid var(--border)' }} onClick={() => {
                                            setNewVariant(v);
                                            setModal({ open: true, type: 'variant', title: 'Edit Variant Type' });
                                        }}>Edit</button>
                                        <button className="btn btn--white flex-1" style={{ border: '1px solid var(--border)' }} onClick={() => {
                                            if (v.name === 'Size') setActiveTab('sizes');
                                            else if (v.name === 'Color') setActiveTab('colors');
                                            else setModal({ open: true, type: 'manage_values', title: `Manage ${v.name} Values`, data: v });
                                        }}>Manage Values</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── UNITS ── */}
                {activeTab === 'units' && (
                    <div className="tab-units">
                        <div className="d-flex justify-between align-center mb-4">
                            <div>
                                <h2>Weight & Unit Management</h2>
                                <p className="text-muted">Define how products are measured (e.g. Kg, Box of 12, Pcs)</p>
                            </div>
                            <button className="btn btn-primary" onClick={() => {
                                setNewUnitType({ id: null, purchase_unit: '', sell_unit: '', multiplier: 1 });
                                setModal({ open: true, type: 'unit', title: 'Add Weight/Unit Type' });
                            }}>+ Add Unit Type</button>
                        </div>
                        <div className="table-wrap">
                            <table className="settings-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Purchase Unit</th>
                                        <th>Selling Unit</th>
                                        <th>Multiplier (Pcs per Unit)</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(conversions || []).map((u, i) => (
                                        <tr key={u.id}>
                                            <td>{String(i + 1).padStart(2, '0')}</td>
                                            <td className="font-bold">{u.purchase_unit}</td>
                                            <td className="font-bold">{u.sell_unit}</td>
                                            <td className="text-orange font-bold">× {u.multiplier}</td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <button className="btn btn--white p-1 text-orange" onClick={() => {
                                                        setNewUnitType(u);
                                                        setModal({ open: true, type: 'unit', title: 'Edit Weight/Unit Type' });
                                                    }}>{renderIcon('M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z')}</button>
                                                    <button className="btn btn--white p-1 text-red" onClick={() => handleDeleteUnit(u.id)}>{renderIcon('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16')}</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <h5 className="mt-5 mb-3">Weight Classes (Visual Guide)</h5>
                        <div className="weight-class-grid">
                            <div className="weight-card"><div className="icon">🍂</div><h5>Light</h5><p>Under 5 kg</p></div>
                            <div className="weight-card"><div className="icon">📦</div><h5>Medium</h5><p>5 - 25 kg</p></div>
                            <div className="weight-card"><div className="icon">🏗️</div><h5>Heavy</h5><p>25 - 100 kg</p></div>
                            <div className="weight-card"><div className="icon">🚚</div><h5>Bulk</h5><p>Over 100 kg</p></div>
                        </div>
                    </div>
                )}

                {/* ── NOTIFICATIONS ── */}
                {activeTab === 'notifications' && (
                    <div className="tab-notifications">
                        <div className="content-header">
                            <h2>Notification Settings</h2>
                            <p>Control how and when the system sends alerts to admins, customers, and riders</p>
                        </div>
                        <div className="notification-list mb-5">
                            <div className="sidebar-section-title m-0 mb-3 text-orange">Inventory Alerts</div>
                            {[
                                { k: 'low_stock_alerts', t: 'Low Stock Reorder Alerts', d: 'Notify admin when product stock falls below reorder threshold' },
                                { k: 'out_of_stock_alerts', t: 'Out of Stock Alerts', d: 'Immediate alert when any product reaches zero stock' },
                                { k: 'auto_po_alerts', t: 'Auto Purchase Order Created', d: 'Notify admin when an automated PO is generated' }
                            ].map(item => (
                                <div className="notification-item" key={item.k}>
                                    <div className="info"><h5>{item.t}</h5><p>{item.d}</p></div>
                                    <label className="switch">
                                        <input type="checkbox" checked={settings.notifications?.[item.k] === '1'} onChange={e => handleChange(item.k, e.target.checked ? '1' : '0')} />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                            ))}
                            <div className="sidebar-section-title m-0 mt-3 mb-3 text-orange">Delivery Alerts</div>
                            {[
                                { k: 'delivery_updates', t: 'Delivery Status Updates (Customer)', d: 'SMS/App notification when delivery status changes' },
                                { k: 'delivery_failed', t: 'Failed Delivery Alert (Admin)', d: 'Notify admin when a delivery attempt fails' },
                                { k: 'rider_assignment', t: 'New Order Assignment (Rider)', d: 'Push notification to rider when assigned a new delivery' }
                            ].map(item => (
                                <div className="notification-item" key={item.k}>
                                    <div className="info"><h5>{item.t}</h5><p>{item.d}</p></div>
                                    <label className="switch">
                                        <input type="checkbox" checked={settings.notifications?.[item.k] === '1'} onChange={e => handleChange(item.k, e.target.checked ? '1' : '0')} />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className="sidebar-section-title m-0 mb-3">Notification Channels</div>
                        <div className="form-grid">
                            <div className="table-wrap p-3">
                                <div className="d-flex justify-between align-center mb-3">
                                    <h5 className="m-0">📧 Email</h5>
                                    <label className="switch switch--sm"><input type="checkbox" checked={settings.notifications?.email_enabled === '1'} onChange={e => handleChange('email_enabled', e.target.checked ? '1' : '0')} /><span className="slider"></span></label>
                                </div>
                                <div className="form-group mb-0">
                                    <label className="small">Admin Email</label>
                                    <input type="email" placeholder="admin@hrms.com" value={settings.notifications?.admin_email || ''} onChange={e => handleChange('admin_email', e.target.value)} />
                                </div>
                            </div>
                            <div className="table-wrap p-3">
                                <div className="d-flex justify-between align-center mb-3">
                                    <h5 className="m-0">📱 SMS</h5>
                                    <label className="switch switch--sm"><input type="checkbox" checked={settings.notifications?.sms_enabled === '1'} onChange={e => handleChange('sms_enabled', e.target.checked ? '1' : '0')} /><span className="slider"></span></label>
                                </div>
                                <div className="form-group mb-0">
                                    <label className="small">Admin Mobile</label>
                                    <input type="text" placeholder="+63 917 123 4567" value={settings.notifications?.admin_mobile || ''} onChange={e => handleChange('admin_mobile', e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <div className="d-flex justify-end pt-4 border-top mt-4">
                            <button className="btn btn-primary" onClick={handleSaveSettings} disabled={saving}>Save Preferences</button>
                        </div>
                    </div>
                )}

                {/* ── SECURITY ── */}
                {activeTab === 'security' && (
                    <div className="tab-security">
                        <div className="content-header">
                            <h2>Security Configuration</h2>
                            <p>Manage system security, authentication, and access control</p>
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Session Timeout (minutes)</label>
                                <input type="number" value={settings.security?.session_timeout || '120'} onChange={e => handleChange('session_timeout', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Max Login Attempts</label>
                                <input type="number" value={settings.security?.max_login_attempts || '5'} onChange={e => handleChange('max_login_attempts', e.target.value)} />
                            </div>
                        </div>
                        <div className="notification-list">
                            {[
                                { k: 'suspicious_login', t: 'Flag Suspicious Logins', d: 'Notify admin when login from new device occur' },
                                { k: 'two_factor', t: 'Enforce Two-Factor Authentication', d: 'Require 2FA for all administrative accounts' },
                                { k: 'auto_logout', t: 'Auto Logout on Inactivity', d: 'Automatically sign out users after timeout period' }
                            ].map(item => (
                                <div className="notification-item" key={item.k}>
                                    <div className="info"><h5>{item.t}</h5><p>{item.d}</p></div>
                                    <label className="switch">
                                        <input type="checkbox" checked={settings.security?.[item.k] === '1'} onChange={e => handleChange(item.k, e.target.checked ? '1' : '0')} />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className="d-flex justify-end pt-4 border-top mt-4">
                            <button className="btn btn-primary" onClick={handleSaveSettings} disabled={saving}>Update Security Policy</button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── MODAL ── */}
            {modal.open && (
                <div className="modal-overlay">
                    <div className="modal-container modal--sm">
                        <div className="modal-header">
                            <h3>{modal.title}</h3>
                            <button className="close-btn" onClick={() => setModal({ open: false })}>&times;</button>
                        </div>
                        <div className="modal-content">
                            {modal.type === 'variant' && (
                                <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                                    <div className="form-group"><label>Variant Type Name*</label><input type="text" placeholder="e.g. Material, Brand" value={newVariant.name} onChange={e => setNewVariant({...newVariant, name: e.target.value})} /></div>
                                    <div className="form-group"><label>Description</label><input type="text" placeholder="Optional note" value={newVariant.description} onChange={e => setNewVariant({...newVariant, description: e.target.value})} /></div>
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select value={newVariant.status} onChange={e => setNewVariant({...newVariant, status: e.target.value})}>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                            {modal.type === 'value' && (
                                <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                                    <div className="form-group"><label>Label / Name*</label><input type="text" placeholder="e.g. 3 inch, Wood, XL" value={newVal.label} onChange={e => setNewVal({...newVal, label: e.target.value})} /></div>
                                    {modal.title.toLowerCase().includes('color') && (
                                        <div className="form-group"><label>Hex Color</label><input type="color" style={{ height: 40 }} value={newVal.hex_code || '#000000'} onChange={e => setNewVal({...newVal, hex_code: e.target.value})} /></div>
                                    )}
                                    <div className="form-group">
                                        <label>Category / Group</label>
                                        <select value={newVal.category} onChange={e => setNewVal({...newVal, category: e.target.value})}>
                                            <option value="">No Category</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Description</label><textarea placeholder="Optional details..." value={newVal.description} onChange={e => setNewVal({...newVal, description: e.target.value})} /></div>
                                </div>
                            )}
                            {modal.type === 'unit' && (
                                <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                                    <div className="form-group"><label>Bulk/Purchase Unit*</label><input type="text" placeholder="e.g. Box, Roll, Pack" value={newUnitType.purchase_unit} onChange={e => setNewUnitType({...newUnitType, purchase_unit: e.target.value})} /></div>
                                    <div className="form-group"><label>Smallest/Selling Unit*</label><input type="text" placeholder="e.g. Piece, Meter, Set" value={newUnitType.sell_unit} onChange={e => setNewUnitType({...newUnitType, sell_unit: e.target.value})} /></div>
                                    <div className="form-group"><label>Multiplier (Pcs per Bulk Unit)*</label><input type="number" min="0.01" step="0.01" value={newUnitType.multiplier} onChange={e => setNewUnitType({...newUnitType, multiplier: e.target.value})} /></div>
                                    <p className="text-xs text-muted">Example: 1 <b>{newUnitType.purchase_unit || 'Box'}</b> = {newUnitType.multiplier} <b>{newUnitType.sell_unit || 'Pieces'}</b></p>
                                </div>
                            )}
                            {modal.type === 'category' && (
                                <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                                    <div className="form-group"><label>Category Name*</label><input type="text" placeholder="e.g. Paint, Plumbing, Tools" value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value})} /></div>
                                    <div className="form-group"><label>Description</label><textarea placeholder="Optional details..." value={newCat.description} onChange={e => setNewCat({...newCat, description: e.target.value})} /></div>
                                </div>
                            )}
                            {modal.type === 'manage_values' && (
                                <div className="manage-values-container">
                                    <div className="table-wrap mb-4" style={{ background: 'var(--surface2)', padding: '10px', borderRadius: '8px' }}>
                                        <h5 className="mb-2">Add New Value to {modal.data?.name}</h5>
                                        <div className="d-flex gap-2">
                                            <input type="text" className="flex-1" placeholder="Value label..." value={newVal.label} onChange={e => setNewVal({...newVal, label: e.target.value})} />
                                            <button className="btn btn-primary" onClick={() => handleSaveVal(modal.data?.id)}>Add</button>
                                        </div>
                                    </div>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        <table className="settings-table">
                                            <tbody>
                                                {modal.data?.values.map(v => (
                                                    <tr key={v.id}>
                                                        <td>
                                                            <div className="font-bold">{v.label}</div>
                                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                                Category: {categories.find(c => c.id == v.category)?.name || '—'}
                                                            </div>
                                                        </td>
                                                        <td style={{ width: 40 }}><button className="btn btn--white p-1 text-red" onClick={() => handleDeleteVal(v.id)}>&times;</button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                        {modal.type !== 'manage_values' && (
                            <div className="modal-footer">
                                <button className="btn btn--white" onClick={() => setModal({ open: false })}>Cancel</button>
                                <button className="btn btn-primary" onClick={
                                    modal.type === 'variant' ? handleSaveType :
                                    modal.type === 'unit' ? handleSaveUnit :
                                    modal.type === 'category' ? handleSaveCat :
                                    handleSaveVal
                                }>Save changes</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}