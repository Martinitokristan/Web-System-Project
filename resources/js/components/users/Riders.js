import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FilterBar from '../shared/FilterBar';
import Pagination from '../shared/Pagination';
import { StatusBadge } from '../shared/Badge';

export default function Riders() {
    const [riders, setRiders] = useState({ data: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

    useEffect(() => {
        let isMounted = true;
        const fetchRiders = () => {
            if (!isMounted) return;
            setLoading(true);
            axios.get('/riders', { params: { page, search } })
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
    }, [page, search, refreshTrigger]);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2 className="page-title">Rider Fleet Tracker</h2>
                    <p className="text-sm text-muted">Monitor delivery riders, vehicle details, and performance</p>
                </div>
            </div>

            <FilterBar search={search} onSearchChange={v => { setSearch(v); setPage(1); }} />

            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Rider Info</th>
                            <th>Vehicle Type</th>
                            <th>Plate Number</th>
                            <th>Current Load</th>
                            <th>Total Delivered</th>
                            <th>On-Time Rate</th>
                            <th>Status</th>
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
                                            <div className="text-xs text-muted">{r.phone || 'No phone'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{r.profile?.vehicle_type || '-'}</td>
                                <td className="font-semi text-sm text-muted">{r.profile?.plate_number || '-'}</td>
                                <td>
                                    {r.profile?.current_deliveries_count > 0 
                                      ? <span className="badge badge--orange">{r.profile?.current_deliveries_count} active</span>
                                      : <span className="text-muted">None</span>}
                                </td>
                                <td className="font-semi">{r.profile?.total_deliveries || 0}</td>
                                <td>
                                    <div className="d-flex align-center gap-1">
                                        <div style={{width: 60, height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden'}}>
                                            <div style={{
                                                width: `${r.profile?.on_time_rate || 0}%`, 
                                                height: '100%', 
                                                background: (r.profile?.on_time_rate || 0) > 90 ? 'var(--green)' : 'var(--amber)'
                                            }} />
                                        </div>
                                        <span className="text-xs text-muted">{r.profile?.on_time_rate || 0}%</span>
                                    </div>
                                </td>
                                <td><StatusBadge status={r.rider_profile?.availability || 'off_duty'} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination page={page} total={riders.total} perPage={15} onChange={setPage} />
        </div>
    );
}
