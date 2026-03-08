import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FilterBar from '../shared/FilterBar';
import Pagination from '../shared/Pagination';
import { StatusBadge } from '../shared/Badge';
import { useToast } from '../../context/ToastContext';
import RiderDetailsModal from './RiderDetailsModal';

export default function Riders() {
    const [riders, setRiders] = useState({ data: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [selectedRider, setSelectedRider] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { showToast } = useToast();

    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

    useEffect(() => {
        let isMounted = true;
        const fetchRiders = () => {
            if (!isMounted) return;
            setLoading(true);
            axios.get('/riders', { params: { page, search, status: statusFilter === 'all' ? '' : statusFilter } })
                .then(res => {
                    const paginatedData = res.data.data;
                    if (isMounted) {
                        setRiders({
                            data: paginatedData.data ? paginatedData.data : paginatedData,
                            total: paginatedData.total || paginatedData.length || 0
                        });
                    }
                })
                .finally(() => {
                    if (isMounted) setLoading(false);
                });
        };
        const debounce = setTimeout(fetchRiders, 400);
        return () => {
            clearTimeout(debounce);
            isMounted = false;
        };
    }, [page, search, statusFilter, refreshTrigger]);

    const handleScheduleInterview = async (id) => {
        const datetime = prompt("Enter interview date and time (YYYY-MM-DD HH:MM):", new Date().toISOString().slice(0, 16).replace('T', ' '));
        if (!datetime) return;
        try {
            await axios.post(`/riders/${id}/interview`, { interview_at: datetime });
            showToast('Interview scheduled!', 'success');
            triggerRefresh();
        } catch (err) {
            showToast('Failed to schedule interview', 'error');
        }
    };

    const handleHire = async (id) => {
        if (!confirm('Are you sure you want to hire and activate this rider?')) return;
        try {
            await axios.post(`/riders/${id}/approve`);
            showToast('Rider hired and account activated!', 'success');
            triggerRefresh();
        } catch (err) {
            showToast('Failed to hire rider', 'error');
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2 className="page-title">Rider Fleet & Pipeline</h2>
                    <p className="text-sm text-muted">Manage rider applications and track fleet performance</p>
                </div>
            </div>

            <div className="tabs mb-4">
                <button className={`tab ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>All Riders</button>
                <button className={`tab ${statusFilter === 'pending' ? 'active' : ''}`} onClick={() => setStatusFilter('pending')}>Pending Apps</button>
                <button className={`tab ${statusFilter === 'interview_set' ? 'active' : ''}`} onClick={() => setStatusFilter('interview_set')}>In Interview</button>
                <button className={`tab ${statusFilter === 'active' ? 'active' : ''}`} onClick={() => setStatusFilter('active')}>Active Fleet</button>
            </div>

            <FilterBar search={search} onSearchChange={v => { setSearch(v); setPage(1); }} />

            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Rider Info</th>
                            <th>Details & ID</th>
                            <th>Current Load</th>
                            <th>Total Delivered</th>
                            <th>On-Time Rate</th>
                            <th>Status/Stage</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" className="text-center py-4"><div className="spinner" /></td></tr>
                        ) : riders.data.length === 0 ? (
                            <tr><td colSpan="7" className="text-center py-4 text-muted">No riders found</td></tr>
                        ) : riders.data.map(r => (
                            <tr key={r.id} style={{ opacity: r.status === 'suspended' ? 0.6 : 1 }}>
                                <td>
                                    <div className="td-user">
                                        <div className="avatar bg-amber-light text-amber">{r.name.charAt(0)}</div>
                                        <div>
                                            <div className="user-name">{r.name}</div>
                                            <div className="text-xs font-semi">{r.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="text-sm">
                                        <div className="font-semi text-amber">{r.rider_profile?.vehicle_type} ({r.rider_profile?.plate_number})</div>
                                        <div className="text-xs text-muted">License: {r.rider_profile?.license_number || 'N/A'}</div>
                                        {r.rider_profile?.valid_id_path && (
                                            <a 
                                                href={`/storage/${r.rider_profile.valid_id_path}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="text-xs underline text-blue mt-1 d-block"
                                            >
                                                View {r.rider_profile.valid_id_type}
                                            </a>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    {r.active_deliveries_count > 0 
                                      ? <span className="badge badge--orange">{r.active_deliveries_count} active</span>
                                      : <span className="text-muted">None</span>}
                                </td>
                                <td className="font-semi">{r.total_deliveries_count || 0}</td>
                                <td>
                                    <div className="d-flex align-center gap-1">
                                        <div style={{width: 60, height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden'}}>
                                            <div style={{
                                                width: `${r.rider_profile?.on_time_rate || 0}%`, 
                                                height: '100%', 
                                                background: (r.rider_profile?.on_time_rate || 0) > 90 ? 'var(--green)' : 'var(--amber)'
                                            }} />
                                        </div>
                                        <span className="text-xs text-muted">{r.rider_profile?.on_time_rate || 0}%</span>
                                    </div>
                                </td>
                                <td>
                                    <StatusBadge status={r.status || 'pending'} />
                                    {r.status === 'interview_set' && r.rider_profile?.interview_at && (
                                        <div className="text-xs text-muted mt-1">Interv: {new Date(r.rider_profile.interview_at).toLocaleDateString()}</div>
                                    )}
                                </td>
                                <td>
                                    <div className="d-flex align-center justify-end gap-2">
                                        {r.status === 'pending' && (
                                            <button className="btn btn--sm btn--outline-primary" onClick={() => handleScheduleInterview(r.id)}>Schedule Intv.</button>
                                        )}
                                        {r.status === 'interview_set' && (
                                            <button className="btn btn--sm btn-primary" onClick={() => handleHire(r.id)}>Hire Rider</button>
                                        )}
                                        {r.status === 'active' && (
                                            <span className="text-xs text-green font-semi">On Duty</span>
                                        )}
                                        <button 
                                            className="btn btn--sm btn--white" 
                                            onClick={() => { setSelectedRider(r); setIsModalOpen(true); }}
                                            style={{ minWidth: '90px', justifyContent: 'center' }}
                                        >
                                            View
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination page={page} total={riders.total} perPage={15} onChange={setPage} />

            <RiderDetailsModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                rider={selectedRider} 
            />
        </div>
    );
}
