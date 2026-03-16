import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Topbar({ toggleSidebar }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [profileOpen, setProfileOpen] = useState(false);
    const [notiOpen, setNotiOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const notiRef = useRef(null);

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/dashboard') return 'Dashboard';
        if (path.startsWith('/products')) return 'Products';
        if (path.startsWith('/inventory')) return 'Inventory Management';
        if (path.startsWith('/delivery')) return 'Delivery Kanban';
        if (path.startsWith('/reports')) return 'Reports & Analytics';
        if (path.startsWith('/users/customers')) return 'Customers';
        if (path.startsWith('/users/riders')) return 'Riders';
        if (path.startsWith('/users')) return 'User Management';
        if (path.startsWith('/settings')) return 'System Settings';
        if (path.startsWith('/supplier-catalog')) return 'Supplier Catalog';
        if (path.startsWith('/suppliers')) return 'Suppliers';
        return 'Admin Portal';
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get('/notifications');
            const data = res.data.data || res.data || [];
            setNotifications(Array.isArray(data) ? data.slice(0, 20) : []);
            setUnreadCount(Array.isArray(data) ? data.filter(n => !n.read_at).length : 0);
        } catch (e) {
            // notifications endpoint may not exist yet
        }
    };

    const markAllRead = async () => {
        try {
            await axios.post('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
            setUnreadCount(0);
        } catch (e) {
            setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
            setUnreadCount(0);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'Just now';
        const mins = Math.floor(seconds / 60);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <header className="topbar">
            <div className="d-flex align-center gap-2">
                <button className="topbar__btn topbar__hamburger" onClick={toggleSidebar}>
                    ☰
                </button>
                <h1 className="topbar__title">{getPageTitle()}</h1>
            </div>

            <div className="topbar__actions">
                {/* Notification Bell */}
                <div style={{ position: 'relative' }} ref={notiRef}>
                    <button className="topbar__btn relative" onClick={() => { setNotiOpen(!notiOpen); setProfileOpen(false); }}>
                        �
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute', top: 2, right: 2, width: 18, height: 18,
                                background: '#ef4444', color: '#fff', borderRadius: '50%',
                                fontSize: '0.65rem', fontWeight: 700, display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                            }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                        )}
                    </button>

                    {notiOpen && (
                        <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => setNotiOpen(false)} />
                            <div style={{
                                position: 'absolute', right: 0, top: '100%', marginTop: 8,
                                width: 360, maxHeight: 480, background: '#fff', borderRadius: 14,
                                boxShadow: '0 10px 40px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0',
                                zIndex: 300, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                            }}>
                                <div style={{
                                    padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                }}>
                                    <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button onClick={markAllRead} style={{
                                            background: 'none', border: 'none', color: 'var(--accent)',
                                            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                                        }}>Mark all as read</button>
                                    )}
                                </div>
                                <div style={{ overflowY: 'auto', flex: 1 }}>
                                    {notifications.length === 0 ? (
                                        <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔔</div>
                                            <p style={{ fontSize: '0.85rem' }}>No notifications yet</p>
                                        </div>
                                    ) : notifications.map((n, i) => (
                                        <div key={n.id || i} style={{
                                            padding: '0.85rem 1.25rem', borderBottom: '1px solid #f8fafc',
                                            background: n.read_at ? 'transparent' : '#eff6ff',
                                            cursor: 'pointer', transition: 'background 0.15s',
                                        }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: n.read_at ? 400 : 600, color: '#1e293b', marginBottom: '0.25rem' }}>
                                                {n.data?.message || n.message || 'New notification'}
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                                {n.created_at ? timeAgo(n.created_at) : 'Just now'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Profile */}
                <div style={{ position: 'relative' }}>
                    <div className="topbar__avatar" onClick={() => { setProfileOpen(!profileOpen); setNotiOpen(false); }}>
                        {user?.name?.charAt(0) || 'A'}
                    </div>

                    {profileOpen && (
                        <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => setProfileOpen(false)} />
                            <div className="profile-dropdown">
                                <div className="profile-dropdown__user">
                                    <div className="name">{user?.name}</div>
                                    <div className="email">{user?.email}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.25rem' }}>{user?.role}</div>
                                </div>
                                <div className="profile-dropdown__item" onClick={() => { setProfileOpen(false); navigate('/settings'); }}>
                                    ⚙️ Settings
                                </div>
                                <div className="profile-dropdown__item danger" onClick={handleLogout}>
                                    🚪 Logout
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
