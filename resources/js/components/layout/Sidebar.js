import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export default function Sidebar({ isOpen, onClose }) {
    const [usersOpen, setUsersOpen] = useState(false);
    const location = useLocation();

    // Auto-open users dropdown if currently on a users route
    React.useEffect(() => {
        if (location.pathname.startsWith('/users')) setUsersOpen(true);
    }, [location.pathname]);

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar__logo">
                <span>HRMS <span>Pro</span></span>
                <span className="logo-badge">v8</span>
            </div>

            <nav className="sidebar__nav">
                <div className="sidebar__section-label">Main</div>
                <NavLink to="/dashboard" className={({ isActive }) => `sidebar__item ${isActive ? 'active' : ''}`}>
                    <span className="icon">📊</span> Dashboard
                </NavLink>
                <NavLink to="/products" className={({ isActive }) => `sidebar__item ${isActive ? 'active' : ''}`}>
                    <span className="icon">📦</span> Products
                </NavLink>
                <NavLink to="/inventory" className={({ isActive }) => `sidebar__item ${location.pathname.startsWith('/inventory') ? 'active' : ''}`}>
                    <span className="icon">🏢</span> Inventory
                </NavLink>
                <NavLink to="/delivery" className={({ isActive }) => `sidebar__item ${isActive ? 'active' : ''}`}>
                    <span className="icon">🚚</span> Delivery
                </NavLink>
                <NavLink to="/suppliers" className={({ isActive }) => `sidebar__item ${isActive ? 'active' : ''}`}>
                    <span className="icon">🤝</span> Suppliers
                </NavLink>
                <NavLink to="/supplier-catalog" className={({ isActive }) => `sidebar__item ${isActive ? 'active' : ''}`}>
                    <span className="icon">🏪</span> Supplier Catalog
                </NavLink>

                <div className="sidebar__section-label">Reports</div>
                <NavLink to="/reports" className={({ isActive }) => `sidebar__item ${isActive ? 'active' : ''}`}>
                    <span className="icon">📈</span> Reports
                </NavLink>

                <div className="sidebar__section-label">System</div>
                
                {/* Users Dropdown */}
                <button 
                    className={`sidebar__accordion-btn ${location.pathname.startsWith('/users') ? 'active' : ''}`}
                    onClick={() => setUsersOpen(!usersOpen)}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="icon">👥</span> Users
                    </div>
                    <span className={`arrow ${usersOpen ? 'open' : ''}`}>▼</span>
                </button>
                
                <div className={`sidebar__sub-items ${usersOpen ? 'open' : ''}`}>
                    <NavLink to="/users" end className={({ isActive }) => `sidebar__sub-item ${isActive ? 'active' : ''}`}>
                        All Users
                    </NavLink>
                    <NavLink to="/users/customers" className={({ isActive }) => `sidebar__sub-item ${isActive ? 'active' : ''}`}>
                        Customers
                    </NavLink>
                    <NavLink to="/users/riders" className={({ isActive }) => `sidebar__sub-item ${isActive ? 'active' : ''}`}>
                        Riders
                    </NavLink>
                </div>

                <NavLink to="/settings" className={({ isActive }) => `sidebar__item ${isActive ? 'active' : ''}`}>
                    <span className="icon">⚙️</span> Settings
                </NavLink>
            </nav>

            <div className="sidebar__footer">
                <NavLink to="/shop" className="btn btn--ghost w-full justify-center">
                    Customer Portal ↗
                </NavLink>
            </div>
        </aside>
    );
}
