import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSupplierAuth } from '../../context/SupplierAuthContext';

export default function SupplierLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { supplier, logout } = useSupplierAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useState(false);

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/supplier/dashboard') return 'Dashboard';
        if (path.startsWith('/supplier/products')) return 'My Products';
        if (path.startsWith('/supplier/orders')) return 'Purchase Orders';
        if (path.startsWith('/supplier/settings')) return 'Settings';
        return 'Supplier Portal';
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className={`sidebar supplier-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar__logo">
                    <span>HRMS <span>Supplier</span></span>
                    <span className="logo-badge">Pro</span>
                </div>

                <nav className="sidebar__nav">
                    <div className="sidebar__section-label">Main</div>
                    <NavLink to="/supplier/dashboard" className={({ isActive }) => `sidebar__item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                        <span className="icon">📊</span> Dashboard
                    </NavLink>
                    <NavLink to="/supplier/products" className={({ isActive }) => `sidebar__item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                        <span className="icon">📦</span> My Products
                    </NavLink>
                    <NavLink to="/supplier/orders" className={({ isActive }) => `sidebar__item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                        <span className="icon">🧾</span> Purchase Orders
                    </NavLink>

                    <div className="sidebar__section-label">System</div>
                    <NavLink to="/supplier/settings" className={({ isActive }) => `sidebar__item ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                        <span className="icon">⚙️</span> Settings
                    </NavLink>
                </nav>

                <div className="sidebar__footer">
                    <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>
                            {supplier?.name || 'Supplier'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>
                            {supplier?.email || ''}
                        </div>
                    </div>
                </div>
            </aside>

            <div className="flex-1 w-full" style={{ width: '100%' }}>
                {/* Topbar */}
                <header className="topbar">
                    <div className="d-flex align-center gap-2">
                        <button className="topbar__btn topbar__hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            ☰
                        </button>
                        <h1 className="topbar__title">{getPageTitle()}</h1>
                    </div>

                    <div className="topbar__actions">
                        <button className="topbar__btn relative">
                            🔔
                        </button>

                        <div style={{ position: 'relative' }}>
                            <div className="topbar__avatar" onClick={() => setProfileOpen(!profileOpen)}>
                                {supplier?.name?.charAt(0) || 'S'}
                            </div>

                            {profileOpen && (
                                <>
                                    <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => setProfileOpen(false)} />
                                    <div className="profile-dropdown">
                                        <div className="profile-dropdown__user">
                                            <div className="name">{supplier?.name}</div>
                                            <div className="email">{supplier?.email}</div>
                                        </div>
                                        <div className="profile-dropdown__item" onClick={() => { setProfileOpen(false); navigate('/supplier/settings'); }}>
                                            Settings
                                        </div>
                                        <div className="profile-dropdown__item danger" onClick={handleLogout}>
                                            Logout
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main className="main-content">
                    <Outlet />
                </main>
            </div>

            {sidebarOpen && (
                <div
                    className="modal-backdrop"
                    style={{ zIndex: 90 }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
