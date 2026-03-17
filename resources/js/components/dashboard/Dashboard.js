import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Responsive, WidthProvider } from 'react-grid-layout';
import StatCard from '../shared/StatCard';
import LineChart from '../shared/LineChart';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [chartDataRaw, setChartDataRaw] = useState([]);
    const [period, setPeriod] = useState('month');
    const [loading, setLoading] = useState(true);
    
    // Load saved layout or use defaults
    const [layouts, setLayouts] = useState(() => {
        const saved = localStorage.getItem('dashboard_layout');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { console.error('Error parsing layout', e); }
        }
        
        // Define clean, spacious default layout coordinates
        const defaultLayout = [
            { i: 'rev', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
            { i: 'ord', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
            { i: 'stk', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
            { i: 'rid', x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
            { i: 'chart', x: 0, y: 2, w: 12, h: 6, minW: 2, minH: 4 }
        ];
        
        return { lg: defaultLayout, md: defaultLayout, sm: defaultLayout };
    });

    const periods = [
        { value: 'week', label: '7 Days' },
        { value: 'month', label: '30 Days' },
        { value: 'year', label: '1 Year' }
    ];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [summaryRes, chartRes] = await Promise.all([
                    axios.get('/sales/summary'),
                    axios.get('/reports/sales', { params: { period } })
                ]);
                setStats(summaryRes.data.data);
                setChartDataRaw(chartRes.data.data?.chart_data || []);
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [period]);

    const formatCurr = (val) => new Intl.NumberFormat('en-PH', { 
        style: 'currency', 
        currency: 'PHP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(val || 0);

    const chartData = useMemo(() => {
        return chartDataRaw.map(d => {
            let label = d.date?.split('-').pop(); // Default day
            if (period === 'year') {
                const date = new Date(d.date);
                label = date.toLocaleString('default', { month: 'short' });
            }
            return {
                label,
                value: Number(d.orders) || 0,
                fullDate: d.date
            };
        });
    }, [chartDataRaw, period]);

    const maxOrders = useMemo(() => Math.max(...chartData.map(d => d.value), 5), [chartData]);

    const handleLayoutChange = (layout, allLayouts) => {
        setLayouts(allLayouts);
        localStorage.setItem('dashboard_layout', JSON.stringify(allLayouts));
    };

    if (loading && !stats) return <div className="loading-page"><div className="spinner" /></div>;

    return (
        <div className="dashboard-modern">
            <div className="page-header">
                <div>
                    <h2 className="page-title">Dashboard Overview</h2>
                    <p className="text-muted mt-1">Real-time insights into your business performance.</p>
                </div>
                <div className="header-actions">
                    <Link to="/inventory/sales" className="btn btn--ghost">View All Orders</Link>
                    <Link to="/reports" className="btn btn--primary">View Detailed Reports</Link>
                </div>
            </div>

            <div className="dashboard-grid-container mt-4">
                <ResponsiveGridLayout
                    className="layout"
                    layouts={layouts}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                    rowHeight={80} // Base height for calculations
                    onLayoutChange={handleLayoutChange}
                    draggableHandle=".drag-handle"
                    margin={[24, 24]} // Add spacing between items
                >
                    {/* Stat Cards */}
                    <div key="rev" className="widget-wrapper">
                        <div className="drag-handle" title="Drag to move" />
                        <StatCard 
                            label="Today's Revenue" 
                            value={stats?.total_revenue ? formatCurr(stats.total_revenue) : '₱0'} 
                            trend="Live" trendUp={true} 
                            icon="💰" accentColor="green" 
                        />
                    </div>
                    
                    <div key="ord" className="widget-wrapper">
                        <div className="drag-handle" title="Drag to move" />
                        <StatCard 
                            label="Orders Today" 
                            value={stats?.orders_today || 0} 
                            trend="New" trendUp={true} 
                            icon="🏷️" accentColor="blue" 
                        />
                    </div>

                    <div key="stk" className="widget-wrapper">
                        <div className="drag-handle" title="Drag to move" />
                        <StatCard 
                            label="Low Stock Items" 
                            value={stats?.low_stock_count || 0} 
                            trend="Required" trendUp={false} 
                            icon="⚠️" accentColor="amber" 
                        />
                    </div>

                    <div key="rid" className="widget-wrapper">
                        <div className="drag-handle" title="Drag to move" />
                        <StatCard 
                            label="Active Riders" 
                            value={stats?.active_riders || 0} 
                            trend="Available" trendUp={true} 
                            icon="🛵" accentColor="accent" 
                        />
                    </div>

                    {/* Order Scaling Chart */}
                    <div key="chart" className="widget-wrapper chart-widget">
                        <div className="drag-handle" title="Drag to move" />
                        <div className="card-outer h-full">
                            <div className="d-flex justify-between align-center px-4 pt-4 mb-0">
                                <h3 className="section-title mb-0">Order Scaling</h3>
                                <div className="period-toggle d-flex gap-1 bg-light p-1 br-8" onMouseDown={(e) => e.stopPropagation()}>
                                    {periods.map(p => (
                                        <button 
                                            key={p.value}
                                            className={`btn btn--xs ${period === p.value ? 'btn--primary' : 'btn--ghost'}`}
                                            onClick={() => setPeriod(p.value)}
                                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="chart-wrapper-inner">
                                <LineChart 
                                    data={chartData} 
                                    maxValue={maxOrders} 
                                    formatValue={(v) => `${v} Orders`}
                                    title=""
                                    totalValueLabel="Total Success Orders"
                                    color="#3b82f6"
                                />
                            </div>
                        </div>
                    </div>
                </ResponsiveGridLayout>
            </div>

            <style>{`
                .dashboard-grid-container {
                    margin-left: -12px;
                    margin-right: -12px;
                }
                
                .widget-wrapper {
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    transition: box-shadow 0.2s;
                    overflow: hidden;
                }
                
                .widget-wrapper:hover {
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }
                
                .widget-wrapper > .stat-card {
                    border: none;
                    box-shadow: none;
                    height: 100%;
                    width: 100%;
                    padding-top: 1.5rem; /* Make room for handle */
                }

                .chart-widget {
                    padding-top: 0.5rem;
                }
                
                .drag-handle {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 24px;
                    background: transparent;
                    cursor: grab;
                    z-index: 10;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    opacity: 0;
                    transition: opacity 0.2s, background 0.2s;
                }
                
                .drag-handle::after {
                    content: '•••';
                    color: #94a3b8;
                    font-size: 14px;
                    letter-spacing: 2px;
                }
                
                .widget-wrapper:hover .drag-handle {
                    opacity: 1;
                    background: linear-gradient(to bottom, #f8fafc, transparent);
                }
                
                .drag-handle:active {
                    cursor: grabbing;
                }
                
                .card-outer {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }
                
                .chart-wrapper-inner {
                    flex-grow: 1;
                    position: relative;
                    min-height: 0; /* Important for flex child to not overflow */
                }
                
                /* Override chart wrapper height to fill container */
                .chart-wrapper-inner .line-chart-wrapper {
                    height: 100% !important;
                    display: flex;
                    flex-direction: column;
                }
                
                .chart-wrapper-inner .chart-svg-container {
                    flex-grow: 1;
                    min-height: 0;
                }
                
                .br-8 { border-radius: 8px; }
                .period-toggle button { transition: all 0.2s; }
                
                /* React Grid Layout Overrides */
                .react-resizable-handle {
                    background-image: none !important;
                    width: 15px !important;
                    height: 15px !important;
                    bottom: 5px !important;
                    right: 5px !important;
                }
                
                .react-resizable-handle::after {
                    content: '';
                    position: absolute;
                    right: 3px;
                    bottom: 3px;
                    width: 8px;
                    height: 8px;
                    border-right: 2px solid #cbd5e1;
                    border-bottom: 2px solid #cbd5e1;
                    border-radius: 1px;
                }
                
                .react-grid-item.react-grid-placeholder {
                    background: var(--accent) !important;
                    opacity: 0.1 !important;
                    border-radius: 12px;
                }
            `}</style>
        </div>
    );
}
