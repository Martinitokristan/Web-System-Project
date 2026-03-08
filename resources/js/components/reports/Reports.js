import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatCard from '../shared/StatCard';
import FilterBar from '../shared/FilterBar';

export default function Reports() {
    const [period, setPeriod] = useState('month'); // week, month, year
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    const periods = [
        { value: 'week', label: '7 Days' },
        { value: 'month', label: '30 Days' },
        { value: 'year', label: '12 Months' }
    ];

    useEffect(() => {
        let isMounted = true;
        
        const fetchReport = async () => {
            setLoading(true);
            try {
                const res = await axios.get('/reports/sales', { params: { period } });
                if (isMounted) {
                    setReport(res.data.data);
                }
            } catch (err) {
                console.error('Failed to fetch report');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchReport();
        
        return () => { isMounted = false; };
    }, [period]);

    const formatCurr = (val) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);

    const downloadCSV = async () => {
        setExporting(true);
        try {
            const res = await axios.get('/reports/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `sales_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (e) {
            console.error('Export failed');
        } finally {
            setExporting(false);
        }
    };

    const handlePeriodChange = (value) => {
        setPeriod(value);
    };

    if (loading || !report) {
        return (
            <div>
                <div className="page-header mb-3">
                    <div>
                        <h2 className="page-title">Sales Reports & Analytics</h2>
                        <p className="text-muted text-sm">Track sales performance and trends</p>
                    </div>
                </div>
                <div className="grid-3 mb-4">
                    <div className="stat-card skeleton" style={{ height: 120 }} />
                    <div className="stat-card skeleton" style={{ height: 120 }} />
                    <div className="stat-card skeleton" style={{ height: 120 }} />
                </div>
                <div className="table-wrap p-4" style={{ height: 300 }}>
                    <div className="skeleton" style={{ height: '100%' }} />
                </div>
            </div>
        );
    }

    const summary = report.summary || {};
    const chartData = report.chart_data || [];
    const maxRevenue = Math.max(...chartData.map(d => Number(d.revenue))) || 1;

    return (
        <div>
            <div className="page-header mb-3">
                <div>
                    <h2 className="page-title">Sales Reports & Analytics</h2>
                    <p className="text-muted text-sm">Track sales performance and trends</p>
                </div>
                <div className="d-flex gap-2">
                    <div className="pill-tabs">
                        {periods.map(p => (
                            <button 
                                key={p.value}
                                className={`pill-tab ${period === p.value ? 'active' : ''}`} 
                                onClick={() => handlePeriodChange(p.value)}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <button 
                        className="btn btn-primary" 
                        onClick={downloadCSV}
                        disabled={exporting}
                    >
                        {exporting ? 'Exporting...' : '↓ Export CSV'}
                    </button>
                </div>
            </div>

            <div className="grid-3 mb-4">
                <StatCard 
                    label={`Total Revenue (${periods.find(p => p.value === period)?.label})`} 
                    value={formatCurr(summary.total_revenue)} 
                    icon="💰" 
                    accentColor="green"
                    trend={summary.revenue_change}
                    trendUp={summary.revenue_change >= 0}
                />
                <StatCard 
                    label="Orders Completed" 
                    value={summary.total_orders} 
                    icon="🏷️" 
                    accentColor="blue"
                    trend={summary.orders_change}
                    trendUp={summary.orders_change >= 0}
                />
                <StatCard 
                    label="Average Order Value" 
                    value={formatCurr(summary.average_order_value)} 
                    icon="📈" 
                    accentColor="purple"
                    trend={summary.aov_change}
                    trendUp={summary.aov_change >= 0}
                />
            </div>

            <div className="table-wrap p-4 mb-4">
                <div className="d-flex justify-between align-center mb-3">
                    <h3 className="section-title">Revenue Trend</h3>
                    <span className="text-sm text-muted">{chartData.length} data points</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '240px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                    {chartData.map((data, idx) => {
                        const heightPct = (Number(data.revenue) / maxRevenue) * 100;
                        return (
                            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', position: 'relative' }}>
                                <div 
                                    style={{ 
                                        height: `${heightPct}%`, 
                                        minHeight: '4px',
                                        background: 'linear-gradient(to top, var(--accent), var(--accent-light))', 
                                        borderRadius: '4px 4px 0 0',
                                        transition: 'height 0.3s ease',
                                        cursor: 'pointer'
                                    }} 
                                    title={`${data.date}: ${formatCurr(data.revenue || 0)}`}
                                />
                                <div style={{ position: 'absolute', bottom: '-24px', width: '100%', textAlign: 'center', fontSize: '10px', color: 'var(--text3)' }}>
                                    {data.date?.split('-').pop()}
                                </div>
                                {/* Tooltip on hover */}
                                <div 
                                    style={{
                                        position: 'absolute',
                                        bottom: `${heightPct + 5}%`,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'var(--text)',
                                        color: '#fff',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        whiteSpace: 'nowrap',
                                        opacity: 0,
                                        pointerEvents: 'none',
                                        transition: 'opacity 0.2s'
                                    }}
                                    className="chart-tooltip"
                                >
                                    {formatCurr(data.revenue || 0)}
                                </div>
                            </div>
                        );
                    })}
                </div>
                {chartData.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">📊</div>
                        <div className="empty-text">No data available for this period</div>
                    </div>
                )}
            </div>
            
            <div className="grid-3">
                <div className="stat-card stat-card--green">
                    <div className="stat-card__label">Successful Orders</div>
                    <div className="stat-card__value" style={{ color: 'var(--green)' }}>{summary.delivered_orders || 0}</div>
                </div>
                <div className="stat-card stat-card--amber">
                    <div className="stat-card__label">Pending Orders</div>
                    <div className="stat-card__value" style={{ color: 'var(--amber)' }}>{summary.pending_orders || 0}</div>
                </div>
                <div className="stat-card stat-card--red">
                    <div className="stat-card__label">Returned Orders</div>
                    <div className="stat-card__value" style={{ color: 'var(--red)' }}>{summary.returned_orders || 0}</div>
                </div>
            </div>
        </div>
    );
}
