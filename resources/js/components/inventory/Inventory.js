import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StockTab from './StockTab';
import SalesTab from './SalesTab';
import PurchaseTab from './PurchaseTab';

export default function Inventory({ tab }) {
    const navigate = useNavigate();
    
    return (
        <div>
            <div className="page-header mb-2">
                <h2 className="page-title">Inventory Management</h2>
            </div>
            
            <div className="pill-tabs mb-3">
                <button 
                    className={`pill-tab ${tab === 'stock' ? 'active' : ''}`}
                    onClick={() => navigate('/inventory')}
                >
                    Stock Levels
                </button>
                <button 
                    className={`pill-tab ${tab === 'sales' ? 'active' : ''}`}
                    onClick={() => navigate('/inventory/sales')}
                >
                    Sales Orders
                </button>
                <button 
                    className={`pill-tab ${tab === 'purchase' ? 'active' : ''}`}
                    onClick={() => navigate('/inventory/purchase')}
                >
                    Purchase Orders
                </button>
            </div>

            {tab === 'stock' && <StockTab />}
            {tab === 'sales' && <SalesTab />}
            {tab === 'purchase' && <PurchaseTab />}
        </div>
    );
}
