import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Topbar({ toggleSidebar }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [searchOpen, setSearchOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    // Get page title from route
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
        return 'Admin Portal';
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <>
            <header className="topbar">
                <div className="d-flex align-center gap-2">
                    <button className="topbar__btn" onClick={toggleSidebar} style={{ display: window.innerWidth <= 768 ? 'flex' : 'none' }}>
                        ☰
                    </button>
                    <h1 className="topbar__title">{getPageTitle()}</h1>
                </div>

                <div className="topbar__actions">
                    <button className="topbar__btn" onClick={() => setSearchOpen(true)}>
                        🔍
                    </button>
                    
                    <button className="topbar__btn relative">
                        🔔
                        <span className="badge-dot"></span>
                    </button>

                    <div style={{ position: 'relative' }}>
                        <div className="topbar__avatar" onClick={() => setProfileOpen(!profileOpen)}>
                            {user?.name?.charAt(0) || 'A'}
                        </div>

                        {profileOpen && (
                            <>
                                <div className="fixed inset-0" style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => setProfileOpen(false)} />
                                <div className="profile-dropdown">
                                    <div className="profile-dropdown__user">
                                        <div className="name">{user?.name}</div>
                                        <div className="email">{user?.email}</div>
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

            {searchOpen && (
                <div className="search-overlay" onClick={(e) => { if(e.target === e.currentTarget) setSearchOpen(false) }}>
                    <div className="search-box">
                        <input type="text" placeholder="Search orders, products, customers..." autoFocus />
                        <div className="search-hint">Press Enter to search globally</div>
                    </div>
                </div>
            )}
        </>
    );
}
