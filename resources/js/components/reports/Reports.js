// Reports.js — Modernized Analytics Dashboard

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import StatCard from '../shared/StatCard';
import { StatusBadge } from '../shared/Badge';
import LineChart from '../shared/LineChart';

// Removed inline LineChart definition since it's now a shared component

// End of LineChart removal


// Product Sales Chart - Horizontal Bar Chart
const ProductSalesChart = ({ data, formatValue, color = '#f97316' }) => {
    if (!data || data.length === 0) return null;
    
    const maxValue = Math.max(...data.map(d => Number(d.total_sold)), 1);
    const totalSold = data.reduce((sum, d) => sum + Number(d.total_sold), 0);
    
    // Sort by total_sold descending and take top 8
    const sortedData = [...data].sort((a, b) => Number(b.total_sold) - Number(a.total_sold)).slice(0, 8);
    
    return (
        <div className="line-chart-wrapper">
            <div className="chart-header-row">
                <span className="chart-title">Top Product Sales</span>
                <div className="chart-total">
                    <span className="chart-total-value">{formatValue(totalSold)}</span>
                    <span className="chart-total-label">Total Units Sold</span>
                </div>
            </div>
            <div className="chart-svg-container">
                <div className="horizontal-bar-chart">
                    {sortedData.map((product, idx) => {
                        const widthPct = (Number(product.total_sold) / maxValue) * 100;
                        return (
                            <div key={product.id} className="bar-row">
                                <div className="bar-label" title={product.name}>
                                    {product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name}
                                </div>
                                <div className="bar-track">
                                    <div 
                                        className="bar-fill"
                                        style={{ 
                                            width: `${Math.max(widthPct, 2)}%`,
                                            background: color
                                        }}
                                    >
                                        <span className="bar-value">{formatValue(product.total_sold)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Mini stat card component
const MiniStat = ({ label, value, icon, trend, trendUp }) => (
    <div className="mini-stat">
        <div className="mini-stat-icon">{icon}</div>
        <div className="mini-stat-content">
            <div className="mini-stat-label">{label}</div>
            <div className="mini-stat-value">{value}</div>
            {trend && (
                <div className={`mini-stat-trend ${trendUp ? 'up' : 'down'}`}>
                    {trendUp ? '↑' : '↓'} {Math.abs(trend)}%
                </div>
            )}
        </div>
    </div>
);

// Metric card with progress
const MetricCard = ({ title, value, total, color, icon }) => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div className="metric-card">
            <div className="metric-header">
                <span className="metric-icon" style={{ color }}>{icon}</span>
                <span className="metric-title">{title}</span>
            </div>
            <div className="metric-value" style={{ color }}>{value}</div>
            <div className="metric-progress">
                <div 
                    className="metric-progress-bar" 
                    style={{ width: `${percentage}%`, background: color }}
                />
            </div>
            <div className="metric-percentage">{percentage}% of total</div>
        </div>
    );
};

export default function Reports() {
    const [period, setPeriod] = useState('month');
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [topProducts, setTopProducts] = useState([]);

    const periods = [
        { value: 'week', label: 'Last 7 Days', short: '7D' },
        { value: 'month', label: 'Last 30 Days', short: '30D' },
        { value: 'quarter', label: 'Last Quarter', short: '90D' },
        { value: 'year', label: 'Last 12 Months', short: '1Y' }
    ];

    useEffect(() => {
        let isMounted = true;
        
        const fetchReport = async () => {
            setLoading(true);
            try {
                const res = await axios.get('/reports/sales', { params: { period } });
                if (isMounted) setReport(res.data.data);
            } catch (err) {
                console.error('Failed to fetch report');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        const fetchTopProducts = async () => {
            try {
                const res = await axios.get('/reports/top-products', { params: { period } });
                if (isMounted) setTopProducts(res.data.data || []);
            } catch (err) {
                console.error('Failed to fetch top products');
            }
        };

        fetchReport();
        fetchTopProducts();
        return () => { isMounted = false; };
    }, [period]);

    const formatCurr = (val) => {
        return new Intl.NumberFormat('en-PH', { 
            style: 'currency', 
            currency: 'PHP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(val || 0);
    };

    const formatNumber = (val) => new Intl.NumberFormat('en-PH').format(val || 0);

    const downloadPDF = async () => {
        setExporting(true);
        try {
            const res = await axios.get('/reports/export', { 
                params: { period, type: 'pdf' },
                responseType: 'blob' 
            });

            // Check if response is JSON error (backend error)
            if (res.headers['content-type'] && res.headers['content-type'].includes('application/json')) {
                // Convert blob to text to read error message
                const text = await res.data.text();
                const errorData = JSON.parse(text);
                console.error('PDF Generation Error:', errorData);
                alert(errorData.message || 'Failed to generate PDF report. Please try again.');
                return;
            }

            // Check if response is actual PDF
            if (res.headers['content-type'] && res.headers['content-type'].includes('application/pdf')) {
                const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `sales_report_${period}_${new Date().toISOString().split('T')[0]}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
                // Clean up the URL object
                window.URL.revokeObjectURL(url);
            } else {
                console.error('Unexpected response type:', res.headers['content-type']);
                alert('Unexpected response from server. Please try again.');
            }
        } catch (e) {
            console.error('PDF Export failed:', e);
            if (e.response && e.response.data) {
                // Handle JSON error response
                try {
                    const errorText = await e.response.data.text();
                    const errorData = JSON.parse(errorText);
                    alert(errorData.message || 'Failed to generate PDF report. Please try again.');
                } catch (parseError) {
                    alert('Failed to generate PDF report. Please try again.');
                }
            } else {
                alert('Failed to download PDF report. Please check your connection and try again.');
            }
        } finally {
            setExporting(false);
        }
    };

    const chartData = useMemo(() => {
        if (!report?.chart_data) return [];
        return report.chart_data.map(d => ({
            label: d.date?.split('-').pop(),
            value: Number(d.revenue) || 0,
            orders: Number(d.orders) || 0,
            fullDate: d.date
        }));
    }, [report]);

    const maxRevenue = useMemo(() => Math.max(...chartData.map(d => d.value), 1), [chartData]);
    const summary = report?.summary || {};
    const totalOrders = summary.total_orders || 0;

    if (loading || !report) {
        return (
            <div className="reports-dashboard">
                <div className="page-header-modern">
                    <div>
                        <h2 className="page-title">📊 Reports & Analytics</h2>
                        <p className="page-subtitle">Loading your business insights...</p>
                    </div>
                </div>
                <div className="reports-skeleton">
                    <div className="skeleton-stats">
                        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-card" />)}
                    </div>
                    <div className="skeleton-chart" />
                </div>
                <style>{`
                    .reports-skeleton { padding: 1.5rem; }
                    .skeleton-stats {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 1rem;
                        margin-bottom: 1.5rem;
                    }
                    .skeleton-card {
                        height: 120px;
                        background: linear-gradient(90deg, var(--surface2) 25%, var(--surface) 50%, var(--surface2) 75%);
                        background-size: 200% 100%;
                        animation: shimmer 1.5s infinite;
                        border-radius: 12px;
                    }
                    .skeleton-chart {
                        height: 300px;
                        background: linear-gradient(90deg, var(--surface2) 25%, var(--surface) 50%, var(--surface2) 75%);
                        background-size: 200% 100%;
                        animation: shimmer 1.5s infinite;
                        border-radius: 12px;
                    }
                    @keyframes shimmer {
                        0% { background-position: -200% 0; }
                        100% { background-position: 200% 0; }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="reports-dashboard">
            <div className="page-header-modern">
                <div className="header-content">
                    <div>
                        <h2 className="page-title">📊 Reports & Analytics</h2>
                        <p className="page-subtitle">Track performance, analyze trends, and make data-driven decisions</p>
                    </div>
                    <div className="export-controls">
                        <button 
                            className="btn btn-primary"
                            onClick={downloadPDF}
                            disabled={exporting}
                        >
                            {exporting ? '⏳ Generating...' : '📄 Download PDF Report'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="period-selector">
                {periods.map(p => (
                    <button
                        key={p.value}
                        className={`period-btn ${period === p.value ? 'active' : ''}`}
                        onClick={() => setPeriod(p.value)}
                    >
                        <span className="period-short">{p.short}</span>
                        <span className="period-label">{p.label}</span>
                    </button>
                ))}
            </div>

            <div className="main-stats">
                <StatCard
                    label="Total Revenue"
                    value={formatCurr(summary.total_revenue)}
                    icon="💰"
                    accentColor="green"
                    trend={summary.revenue_change}
                    trendUp={summary.revenue_change >= 0}
                />
                <StatCard
                    label="Total Orders"
                    value={formatNumber(summary.total_orders)}
                    icon="📦"
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
                <StatCard
                    label="Conversion Rate"
                    value={`${(summary.conversion_rate || 0).toFixed(1)}%`}
                    icon="🎯"
                    accentColor="amber"
                />
            </div>

            <div className="reports-tabs">
                {[
                    { key: 'overview', label: 'Overview', icon: '📋' },
                    { key: 'trends', label: 'Trends', icon: '📊' },
                    { key: 'products', label: 'Top Products', icon: '🏆' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        className={`report-tab ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="tab-content">
                {activeTab === 'overview' && (
                    <div className="overview-tab">
                        <div className="metrics-grid">
                            <MetricCard title="Delivered" value={summary.delivered_orders || 0} total={totalOrders} color="var(--green)" icon="✅" />
                            <MetricCard title="Pending" value={summary.pending_orders || 0} total={totalOrders} color="var(--amber)" icon="⏳" />
                            <MetricCard title="In Progress" value={summary.in_progress_orders || 0} total={totalOrders} color="var(--blue)" icon="🚚" />
                            <MetricCard title="Failed" value={summary.failed_orders || 0} total={totalOrders} color="var(--red)" icon="❌" />
                        </div>

                        <div className="payment-methods">
                            <h3 className="section-title">💳 Payment Method</h3>
                            <div className="payment-grid cod-only">
                                {(() => {
                                    const count = summary.cod_orders || 0;
                                    const amount = summary.cod_revenue || 0;
                                    return (
                                        <div className="payment-card">
                                            <div className="payment-icon" style={{ background: '#F59E0B20', color: '#F59E0B' }}>
                                                💵
                                            </div>
                                            <div className="payment-info">
                                                <div className="payment-label">Cash on Delivery</div>
                                                <div className="payment-count">{count} orders</div>
                                                <div className="payment-amount">{formatCurr(amount)}</div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'trends' && (
                    <div className="trends-tab">
                        <div className="chart-section modern-chart">
                            <div className="chart-container line-chart-container">
                                <LineChart 
                                    data={chartData} 
                                    maxValue={maxRevenue}
                                    formatValue={formatCurr}
                                    title="Revenue Trend"
                                    totalValueLabel="Total Revenue"
                                    color="#f97316"
                                />
                            </div>
                        </div>
                        <div className="mini-stats-grid">
                            <MiniStat label="Highest Daily Revenue" value={formatCurr(Math.max(...chartData.map(d => d.value), 0))} icon="📊" />
                            <MiniStat label="Average Daily" value={formatCurr(summary.total_revenue / (chartData.length || 1))} icon="📉" />
                            <MiniStat label="Peak Orders Day" value={`${Math.max(...chartData.map(d => d.orders), 0)} orders`} icon="📅" />
                            <MiniStat label="Active Days" value={`${chartData.filter(d => d.value > 0).length} days`} icon="📆" />
                        </div>
                    </div>
                )}

                {activeTab === 'products' && (
                    <div className="products-tab">
                        <div className="chart-section modern-chart">
                            <div className="chart-container product-chart-container">
                                <ProductSalesChart 
                                    data={topProducts} 
                                    formatValue={(val) => `${val} units`}
                                    color="#f97316"
                                />
                            </div>
                        </div>
                        <h3 className="section-title">🏆 Top Performing Products</h3>
                        <div className="products-list">
                            {topProducts.length === 0 ? (
                                <div className="empty-products">
                                    <div className="empty-icon">📦</div>
                                    <p>No product data available for this period</p>
                                </div>
                            ) : (
                                topProducts.map((product, idx) => (
                                    <div key={product.id} className="product-item">
                                        <div className="product-rank">
                                            {idx === 0 && '🥇'}
                                            {idx === 1 && '🥈'}
                                            {idx === 2 && '🥉'}
                                            {idx > 2 && `#${idx + 1}`}
                                        </div>
                                        <div className="product-info">
                                            <div className="product-name">{product.name}</div>
                                            <div className="product-sku">SKU: {product.sku}</div>
                                        </div>
                                        <div className="product-stats">
                                            <div className="product-sales">
                                                <span className="stat-label">Sales</span>
                                                <span className="stat-value">{product.total_sold} units</span>
                                            </div>
                                            <div className="product-revenue">
                                                <span className="stat-label">Revenue</span>
                                                <span className="stat-value">{formatCurr(product.revenue)}</span>
                                            </div>
                                        </div>
                                        {idx < 3 && <span className="trend-badge hot">🔥 Hot</span>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="summary-footer">
                <div className="summary-item">
                    <span className="summary-icon">📅</span>
                    <span className="summary-text">Period: {periods.find(p => p.value === period)?.label}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-icon">🔄</span>
                    <span className="summary-text">Updated: {new Date().toLocaleTimeString()}</span>
                </div>
            </div>
        </div>
    );
}
