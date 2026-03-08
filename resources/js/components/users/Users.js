import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import FilterBar from '../shared/FilterBar';
import Pagination from '../shared/Pagination';
import Modal from '../shared/Modal';
import { RoleBadge, StatusBadge } from '../shared/Badge';

export default function Users() {
    const { showToast } = useToast();
    const [users, setUsers] = useState({ data: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

    const [modal, setModal] = useState({ open: false, user: null });
    const [formData, setFormData] = useState({ name: '', email: '', role: 'admin', phone: '', password: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchUsers = () => {
            if (!isMounted) return;
            setLoading(true);
            axios.get('/users', { params: { page, search, role: roleFilter } })
                .then(res => {
                    const paginatedData = res.data.data;
                    if (isMounted) {
                        setUsers({
                            data: paginatedData.data ? paginatedData.data : paginatedData,
                            total: paginatedData.total || paginatedData.length || 0
                        });
                    }
                })
                .finally(() => {
                    if (isMounted) setLoading(false);
                });
        };
        const debounce = setTimeout(fetchUsers, 400);
        return () => {
            clearTimeout(debounce);
            isMounted = false;
        };
    }, [page, search, roleFilter, refreshTrigger]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (modal.user) {
                await axios.put(`/users/${modal.user.id}`, formData);
                showToast('User updated successfully');
            } else {
                await axios.post('/users', formData);
                showToast('User created successfully');
            }
            triggerRefresh();
            setModal({ open: false, user: null });
        } catch (err) {
            showToast(err.response?.data?.message || 'Error saving user', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        if (!confirm(`Are you sure you want to ${currentStatus === 'active' ? 'suspend' : 'restore'} this user?`)) return;
        try {
            await axios.put(`/users/${userId}/status`, { status: currentStatus === 'active' ? 'suspended' : 'active' });
            showToast('User status updated');
            triggerRefresh();
        } catch (e) {
            showToast('Failed to update status', 'error');
        }
    };

    const openEdit = (u) => {
        setFormData({ name: u.name, email: u.email, role: u.role, phone: u.phone || '', password: '' });
        setModal({ open: true, user: u });
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2 className="page-title">User Management</h2>
                    <p className="text-sm text-muted">Manage admins, customers, and riders</p>
                </div>
                <button className="btn btn-primary" onClick={() => {
                    setFormData({ name: '', email: '', role: 'admin', phone: '', password: '' });
                    setModal({ open: true, user: null });
                }}>+ New User</button>
            </div>

            <FilterBar 
                search={search} onSearchChange={v => { setSearch(v); setPage(1); }}
                filters={[{
                    value: roleFilter, onChange: v => { setRoleFilter(v); setPage(1); },
                    options: [
                        { value: '', label: 'All Roles' },
                        { value: 'admin', label: 'Admins' },
                        { value: 'rider', label: 'Riders' },
                        { value: 'customer', label: 'Customers' }
                    ]
                }]}
            />

            <div className="table-wrap">
                <table className="data-table">
                    <thead><tr><th>User</th><th>Role</th><th>Phone</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-4"><div className="spinner" /></td></tr>
                        ) : users.data.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-4 text-muted">No users found</td></tr>
                        ) : users.data.map(u => (
                            <tr key={u.id} style={{ opacity: u.status === 'suspended' ? 0.6 : 1 }}>
                                <td>
                                    <div className="td-user">
                                        <div className="avatar">{u.name.charAt(0)}</div>
                                        <div>
                                            <div className="user-name">{u.name}</div>
                                            <div className="user-email">{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td><RoleBadge role={u.role} /></td>
                                <td className="text-muted">{u.phone || '-'}</td>
                                <td><StatusBadge status={u.status} /></td>
                                <td className="text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                                <td>
                                    <div className="td-actions">
                                        <button className="btn btn--sm btn--ghost" onClick={() => openEdit(u)}>Edit</button>
                                        <button className={`btn btn--sm ${u.status === 'active' ? 'btn--danger' : 'btn--green'}`} onClick={() => handleToggleStatus(u.id, u.status)}>
                                            {u.status === 'active' ? 'Suspend' : 'Restore'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination page={page} total={users.total} perPage={15} onChange={setPage} />

            <Modal isOpen={modal.open} onClose={() => setModal({open: false, user: null})} title={modal.user ? 'Edit User' : 'New User'} size="sm">
                <form onSubmit={handleSave}>
                    <div className="form-group"><label>Full Name</label><input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                    <div className="form-group"><label>Email Address</label><input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                    <div className="form-group"><label>Phone</label><input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                    
                    {!modal.user && (
                        <>
                            <div className="form-group">
                                <label>Role</label>
                                <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                                    <option value="admin">System Admin</option>
                                    <option value="rider">Delivery Rider (Auto-creates profile)</option>
                                    <option value="customer">Customer</option>
                                </select>
                            </div>
                            <div className="form-group mb-3"><label>Password</label><input type="password" required minLength="8" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
                        </>
                    )}
                    
                    <button className="btn btn-primary w-full justify-center" disabled={saving}>{saving ? 'Saving...' : 'Save User'}</button>
                </form>
            </Modal>
        </div>
    );
}
