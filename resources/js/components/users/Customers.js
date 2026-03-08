import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FilterBar from '../shared/FilterBar';
import Pagination from '../shared/Pagination';
import { StatusBadge } from '../shared/Badge';

export default function Customers() {
    const [customers, setCustomers] = useState({ data: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

    useEffect(() => {
        let isMounted = true;
        const fetchCustomers = () => {
            if (!isMounted) return;
            setLoading(true);
            axios.get('/customers', { params: { page, search } })
                .then(res => {
                    const paginatedData = res.data.data;
                    if (isMounted) {
                        setCustomers({
                            data: paginatedData.data ? paginatedData.data : paginatedData,
                            total: paginatedData.total || paginatedData.length || 0
                        });
                    }
                })
                .finally(() => {
                    if (isMounted) setLoading(false);
                });
        };
        const debounce = setTimeout(fetchCustomers, 400);
        return () => {
            clearTimeout(debounce);
            isMounted = false;
        };
    }, [page, search, refreshTrigger]);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2 className="page-title">Customer Database</h2>
                    <p className="text-sm text-muted">View registered customers and their purchasing statistics</p>
                </div>
            </div>

            <FilterBar search={search} onSearchChange={v => { setSearch(v); setPage(1); }} />

            <div className="table-wrap">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Customer Info</th>
                            <th>Total Orders</th>
                            <th>Lifetime Revenue</th>
                            <th>Last Order Date</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-4"><div className="spinner" /></td></tr>
                        ) : customers.data.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-4 text-muted">No customers found</td></tr>
                        ) : customers.data.map(u => (
                            <tr key={u.id} style={{ opacity: u.status === 'suspended' ? 0.6 : 1 }}>
                                <td>
                                    <div className="td-user">
                                        <div className="avatar">{u.name.charAt(0)}</div>
                                        <div>
                                            <div className="user-name">{u.name}</div>
                                            <div className="user-email">{u.email}</div>
                                            <div className="text-xs text-muted">{u.phone || 'No phone'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="font-semi">{u.sales_count}</td>
                                <td className="td-amount text-green">₱{Number(u.total_spent || 0).toFixed(2)}</td>
                                <td className="text-muted">{u.last_order_date ? new Date(u.last_order_date).toLocaleDateString() : 'Never'}</td>
                                <td><StatusBadge status={u.status} /></td>
                                <td>
                                    <button className="btn btn--sm btn--ghost" onClick={() => alert('Customer detail view coming soon')}>View Orders</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination page={page} total={customers.total} perPage={15} onChange={setPage} />
        </div>
    );
}
