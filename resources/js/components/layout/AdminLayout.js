import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="admin-layout">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            <div className="flex-1 w-full" style={{ width: '100%' }}>
                <Topbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                
                <main className="main-content">
                    {/* Outlet renders the matched child routed component */}
                    <Outlet />
                </main>
            </div>

            {/* Mobile sidebar overlay mask */}
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
