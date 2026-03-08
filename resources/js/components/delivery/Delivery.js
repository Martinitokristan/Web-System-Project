// Delivery.js — Enhanced Modern UI

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import StatCard from '../shared/StatCard';
import FilterBar from '../shared/FilterBar';

export default function Delivery() {
    const { showToast } = useToast();
    const [deliveries, setDeliveries] = useState({ pending: [], in_progress: [], delivered: [] });
    const [filteredDeliveries, setFilteredDeliveries] = useState({ pending: [], in_progress: [], delivered: [] });
    const [riders, setRiders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

    useEffect(() => {
        let isMounted = true;

        const fetchBoard = () => {
            setLoading(true);
            axios.get('/deliveries')
                .then(res => {
                    if (!isMounted) return;
                    const data = res.data.data;
                    if (Array.isArray(data)) {
                        const organized = {
                            pending: data.filter(d => d.status === 'pending'),
                            in_progress: data.filter(d => d.status === 'in_progress'),
                            delivered: data.filter(d => d.status === 'delivered')
                        };
                        setDeliveries(organized);
                        setFilteredDeliveries(organized);
                    }
                })
                .finally(() => {
                    if (isMounted) setLoading(false);
                });
        };

        const fetchRiders = () => {
            axios.get('/riders/available')
                .then(res => {
                    if (!isMounted) return;
                    setRiders(res.data.data || []);
                });
        };

        fetchBoard();
        fetchRiders();

        return () => { isMounted = false; };
    }, [refreshTrigger]);

    const handleAssign = async (deliveryId, riderId) => {
        if (!riderId) return;
        try {
            await axios.put(`/deliveries/${deliveryId}/assign`, { rider_id: riderId });
            showToast('Rider assigned successfully');
            triggerRefresh();
        } catch (err) {
            showToast('Assignment failed', 'error');
        }
    };

    // Filter deliveries based on search
    useEffect(() => {
        if (!search.trim()) {
            setFilteredDeliveries(deliveries);
            return;
        }
        const term = search.toLowerCase();
        const filterList = (list) => list.filter(d => 
            d.tracking_number?.toLowerCase().includes(term) ||
            d.sale?.order_number?.toLowerCase().includes(term) ||
            d.sale?.customer?.name?.toLowerCase().includes(term) ||
            d.address?.toLowerCase().includes(term)
        );
        setFilteredDeliveries({
            pending: filterList(deliveries.pending),
            in_progress: filterList(deliveries.in_progress),
            delivered: filterList(deliveries.delivered)
        });
    }, [search, deliveries]);

    const handleStatus = async (deliveryId, status) => {
        try {
            await axios.put(`/deliveries/${deliveryId}/status`, { status });
            showToast('Delivery status updated');
            triggerRefresh();
        } catch (err) {
            showToast('Status update failed', 'error');
        }
    };

    const renderCard = (d) => (
        <div key={d.id} className="kanban-card">
            <div className="kanban-card__header">
                <span className="badge badge--pending">{d.tracking_number}</span>
                <span className="text-xs text-muted">Order {d.sale?.order_number}</span>
            </div>
            <div className="kanban-card__customer">{d.sale?.customer?.name}</div>
            <div className="kanban-card__address">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {d.address}
            </div>
            <div className="kanban-card__meta">
                <span className="badge badge--gray">{d.sale?.items?.length || 0} items</span>
                <span className="font-bold text-accent">₱{Number(d.sale?.total_amount).toFixed(2)}</span>
            </div>
            {d.sale?.payment_method === 'cod' && (
                <div className="kanban-card__cod">
                    <span className="badge badge--amber">COD</span>
                    <span>₱{Number(d.sale.total_amount).toFixed(2)}</span>
                </div>
            )}
            <div className="kanban-card__rider">
                <select
                    value={d.rider_id || ''}
                    onChange={e => handleAssign(d.id, e.target.value)}
                    disabled={d.status === 'delivered'}
                >
                    <option value="">Assign to Rider...</option>
                    {d.rider && !riders.find(r => r.id === d.rider_id) && (
                        <option value={d.rider_id}>{d.rider.name}</option>
                    )}
                    {riders.map(r => (
                        <option key={r.id} value={r.id}>
                            {r.name} (Active: {r.active_deliveries_count || 0})
                        </option>
                    ))}
                </select>
            </div>
            <div className="kanban-card__actions">
                {d.status === 'pending' && (
                    <button
                        className="btn btn--sm btn--blue flex-1 justify-center"
                        disabled={!d.rider_id}
                        onClick={() => handleStatus(d.id, 'in_progress')}
                    >
                        Start Delivery
                    </button>
                )}
                {d.status === 'in_progress' && (
                    <button
                        className="btn btn--sm btn--green flex-1 justify-center"
                        onClick={() => handleStatus(d.id, 'delivered')}
                    >
                        Mark Delivered
                    </button>
                )}
            </div>
        </div>
    );

    const totalDeliveries = deliveries.pending.length + deliveries.in_progress.length + deliveries.delivered.length;

    if (loading) return <div className="loading-page"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header mb-3">
                <div>
                    <h2 className="page-title">Delivery Kanban</h2>
                    <p className="text-muted text-sm">Track and manage delivery operations</p>
                </div>
                <div className="d-flex align-center gap-2">
                    <span className="badge badge--green">{riders.length} Riders Available</span>
                </div>
            </div>

            <div className="grid-4 mb-4">
                <StatCard 
                    label="Total Deliveries" 
                    value={totalDeliveries} 
                    icon="📦" 
                    accentColor="accent" 
                />
                <StatCard 
                    label="Pending Assignment" 
                    value={deliveries.pending.length} 
                    icon="⏳" 
                    accentColor="amber" 
                />
                <StatCard 
                    label="Out for Delivery" 
                    value={deliveries.in_progress.length} 
                    icon="🚚" 
                    accentColor="blue" 
                />
                <StatCard 
                    label="Delivered Today" 
                    value={deliveries.delivered.length} 
                    icon="✓" 
                    accentColor="green" 
                />
            </div>

            <FilterBar 
                search={search} 
                onSearchChange={setSearch}
            />

            <div className="kanban-board">
                <div className="kanban-column">
                    <div className="kanban-column__header">
                        <div className="col-title"><div className="col-dot col-dot--pending"></div> Pending Assignment</div>
                        <div className="col-count">{filteredDeliveries.pending.length}</div>
                    </div>
                    <div className="kanban-column__cards">
                        {filteredDeliveries.pending.length === 0
                            ? <div className="empty-state-sm"><div className="text-muted text-sm">No pending deliveries</div></div>
                            : filteredDeliveries.pending.map(renderCard)}
                    </div>
                </div>

                <div className="kanban-column">
                    <div className="kanban-column__header">
                        <div className="col-title"><div className="col-dot col-dot--in_progress"></div> Out for Delivery</div>
                        <div className="col-count">{filteredDeliveries.in_progress.length}</div>
                    </div>
                    <div className="kanban-column__cards">
                        {filteredDeliveries.in_progress.length === 0
                            ? <div className="empty-state-sm"><div className="text-muted text-sm">No active deliveries</div></div>
                            : filteredDeliveries.in_progress.map(renderCard)}
                    </div>
                </div>

                <div className="kanban-column">
                    <div className="kanban-column__header">
                        <div className="col-title"><div className="col-dot col-dot--delivered"></div> Delivered Today</div>
                        <div className="col-count">{filteredDeliveries.delivered.length}</div>
                    </div>
                    <div className="kanban-column__cards" style={{ opacity: 0.7 }}>
                        {filteredDeliveries.delivered.length === 0
                            ? <div className="empty-state-sm"><div className="text-muted text-sm">No completed deliveries</div></div>
                            : filteredDeliveries.delivered.map(renderCard)}
                    </div>
                </div>
            </div>
        </div>
    );
}