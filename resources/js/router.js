import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import '../sass/app.scss';

// Layout
import AdminLayout from './components/layout/AdminLayout';

// Auth
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Landing
import Landing from './components/landing/Landing';

// Admin pages
import Dashboard from './components/dashboard/Dashboard';
import Products from './components/products/Products';
import Inventory from './components/inventory/Inventory';
import Delivery from './components/delivery/Delivery';
import Reports from './components/reports/Reports';
import Settings from './components/settings/Settings';
import Users from './components/users/Users';
import Customers from './components/users/Customers';
import Riders from './components/users/Riders';
import Suppliers from './components/suppliers/Suppliers';

// Customer Portal
import CustomerHome from './components/customer-portal/CustomerHome';
import CustomerOrder from './components/customer-portal/CustomerOrder';
import OrderHistory from './components/customer-portal/OrderHistory';

// Rider App
import RiderApp from './components/rider/RiderApp';

function ProtectedRoute({ children, roles }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading-page"><div className="spinner" /></div>;
    
    // Intended role path
    const loginPath = roles?.includes('rider') ? '/login?role=rider' : '/login';

    if (!user) return <Navigate to={loginPath} replace />;
    if (roles && !roles.includes(user.role)) {
        // Redirect based on their ACTUAL role if they hit the wrong area
        if (user.role === 'admin') return <Navigate to="/dashboard" replace />;
        if (user.role === 'rider') return <Navigate to="/rider" replace />;
        if (user.role === 'customer') return <Navigate to="/shop" replace />;
        return <Navigate to="/" replace />;
    }
    return children;
}

export default function AppRouter() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Admin — wrapped in AdminLayout */}
            <Route element={
                <ProtectedRoute roles={['admin']}>
                    <AdminLayout />
                </ProtectedRoute>
            }>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/inventory" element={<Inventory tab="stock" />} />
                <Route path="/inventory/sales" element={<Inventory tab="sales" />} />
                <Route path="/inventory/purchase" element={<Inventory tab="purchase" />} />
                <Route path="/delivery" element={<Delivery />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/users" element={<Users />} />
                <Route path="/users/customers" element={<Customers />} />
                <Route path="/users/riders" element={<Riders />} />
                <Route path="/suppliers" element={<Suppliers />} />
            </Route>

            {/* Customer Portal */}
            <Route element={
                <ProtectedRoute roles={['customer']}>
                    <Outlet />
                </ProtectedRoute>
            }>
                <Route path="/shop" element={<CustomerHome />} />
                <Route path="/shop/order" element={<CustomerOrder />} />
                <Route path="/shop/history" element={<OrderHistory />} />
            </Route>

            {/* Rider App */}
            <Route path="/rider" element={
                <ProtectedRoute roles={['rider']}>
                    <RiderApp />
                </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

if (document.getElementById('app')) {
    ReactDOM.render(
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <AppRouter />
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>,
        document.getElementById('app')
    );
}
