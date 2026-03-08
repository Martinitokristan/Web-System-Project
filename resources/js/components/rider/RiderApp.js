import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const riderIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const jobIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function RecenterMap({ pos }) {
    const map = useMap();
    useEffect(() => {
        if (pos) {
            map.flyTo(pos, map.getZoom(), { duration: 1.5 });
        }
    }, [pos]);
    return null;
}

export default function RiderApp() {
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('nearby');
    const [hideMap, setHideMap] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [riderPos, setRiderPos] = useState([7.0707, 125.6080]); // Default to Davao
    const [hasGeo, setHasGeo] = useState(false);

    // Stats/Data states
    const [stats, setStats] = useState({ total: 0, done: 0, active: 0, failed: 0, quota: 10000, collected: 0 });
    const [nearby, setNearby] = useState([]);
    const [myJobs, setMyJobs] = useState([]);
    const [completed, setCompleted] = useState([]);
    const [refresh, setRefresh] = useState(0);

    // Watch Geolocation
    useEffect(() => {
        if (!navigator.geolocation) {
            showToast('Geolocation is not supported by your browser', 'error');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setRiderPos([latitude, longitude]);
                setHasGeo(true);
            },
            (err) => {
                console.warn('Geolocation error:', err);
                showToast('Unable to get your location. Using default.', 'warning');
            },
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    const triggerRefresh = () => setRefresh(prev => prev + 1);

    const fetchData = async () => {
        try {
            const res = await axios.get('/riders/me/dashboard', {
                params: hasGeo ? {
                    latitude: riderPos[0],
                    longitude: riderPos[1]
                } : {}
            });
            const d = res.data.data;
            setStats(d.stats);
            setNearby(d.nearby);
            setMyJobs(d.my_jobs);
            setCompleted(d.completed);
        } catch (e) {
            showToast('Failed to fetch dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // refresh every 30s
        return () => clearInterval(interval);
    }, [refresh]);

    const handleAction = async (id, status, actionNote) => {
        try {
            if (status === 'assigned') {
                await axios.put(`/deliveries/${id}/assign`, { rider_id: user.id });
                setActiveTab('my_jobs');
            } else {
                await axios.put(`/deliveries/${id}/status`, { status });
            }
            showToast(actionNote || 'Action successful');
            triggerRefresh();
        } catch (e) {
            showToast('Action failed', 'error');
        }
    };

    if (loading) return <div className="loading-page"><div className="spinner" /></div>;

    if (user && user.status !== 'active') {
        return (
            <div className="auth-page auth-page--wide flex-center" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', background: 'var(--surface)' }}>
                <div className="auth-box" style={{ maxWidth: '500px' }}>
                    <div className="auth-logo" style={{ marginBottom: '2rem' }}>HRMS <span>Pro</span></div>
                    <div className="illus-icon" style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>
                        {user.status === 'pending' ? '⏳' : '📅'}
                    </div>
                    <h1 className="auth-headline" style={{ textTransform: 'capitalize' }}>Account {user.status.replace('_', ' ')}</h1>
                    <p className="auth-sub" style={{ maxWidth: '400px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
                        {user.status === 'pending' 
                          ? "Thank you for applying! Our HR team is currently reviewing your documents and vehicle information. We'll contact you soon to schedule an in-person interview."
                          : "Great news! Your interview has been scheduled. Please check your registered email for the specific date and location. See you there!"}
                    </p>
                    <div className="d-flex flex-column gap-2">
                        <button className="btn btn-primary" onClick={triggerRefresh}>Check Status Again</button>
                        <button className="btn btn-outline-primary" onClick={logout}>Sign Out</button>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className={`rider-dashboard-v2 ${hideMap ? 'hide-map' : ''}`}>
            {/* Sidebar / List View */}
            <div className="rider-sidebar">
                <div className="sidebar-header">
                    <div className="user-profile">
                        <div className="avatar">{user?.name?.charAt(0)}</div>
                        <div className="info">
                            <div className="name">{user?.name}</div>
                            <div className="id">Rider ID: RDR-{user?.id?.toString().padStart(4, '0')}</div>
                        </div>
                    </div>
                    <div className="header-actions">
                        <div className="status-row">
                            <div className="online-badge">Online</div>
                            <button className="toggle-view-sidebar" onClick={() => setHideMap(!hideMap)}>
                                {hideMap ? '📂 Show Map' : '📱 Hide Map'}
                            </button>
                        </div>
                        <button className="logout-btn" onClick={logout}>Sign Out</button>
                    </div>
                </div>

                <div className="dashboard-content-wrapper">
                    <div className="dashboard-inner-container">
                        {/* Stats Header */}
                        <div className="stats-header-dark">
                    <div className="date-label">📅 TODAY — {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}</div>
                    <div className="stats-grid">
                        <div className="stat-box">
                            <div className="val">{stats.total}</div>
                            <div className="lbl">Total</div>
                        </div>
                        <div className="stat-box green">
                            <div className="val">{stats.done}</div>
                            <div className="lbl">Done</div>
                        </div>
                        <div className="stat-box orange">
                            <div className="val">{stats.active}</div>
                            <div className="lbl">Active</div>
                        </div>
                        <div className="stat-box red">
                            <div className="val">{stats.failed}</div>
                            <div className="lbl">Failed</div>
                        </div>
                    </div>

                    <div className="cod-quota-box">
                        <div className="quota-info">
                            <span>💰 COD QUOTA</span>
                            <span>₱{Number(stats.collected).toLocaleString()} / ₱{Number(stats.quota).toLocaleString()}</span>
                        </div>
                        <div className="quota-progress">
                            <div className="bar" style={{ width: `${Math.min(100, (stats.collected / (stats.quota || 1)) * 100)}%` }}></div>
                        </div>
                        <div className="quota-footer">
                            <span>{Math.round((stats.collected / (stats.quota || 1)) * 100)}% of daily target</span>
                            <span>₱{Number((stats.quota || 0) - (stats.collected || 0)).toLocaleString()} remaining</span>
                        </div>
                    </div>
                </div>

                {/* Main Tabs */}
                <div className="dashboard-tabs">
                    <button className={activeTab === 'nearby' ? 'active' : ''} onClick={() => setActiveTab('nearby')}>
                        📍 Nearby Orders
                    </button>
                    <button className={activeTab === 'my_jobs' ? 'active' : ''} onClick={() => setActiveTab('my_jobs')}>
                        ☁️ My Deliveries
                    </button>
                    <button className={activeTab === 'completed' ? 'active' : ''} onClick={() => setActiveTab('completed')}>
                        ✅ Completed
                    </button>
                </div>

                {/* Tab Content */}
                <div className="tab-content-scroll">
                    {activeTab === 'nearby' && (
                        <div className="order-list">
                            <div className="list-meta">
                                <span>📍 {nearby.length} ORDERS AVAILABLE NEAR YOU</span>
                                <button className="refresh-btn" onClick={triggerRefresh}>🔄 REFRESH</button>
                            </div>
                            {nearby.length === 0 && (
                                <div className="empty-state">
                                    <h3>No Nearby Orders</h3>
                                    <p>We'll notify you when new orders arrive in your current zone.</p>
                                </div>
                            )}
                            {nearby.map(order => (
                                <div key={order.id} className="order-card-premium">
                                    <div className="card-top">
                                        <div className="order-no">#{order.sale?.order_number}</div>
                                        <div className="dist-badge">⚡ {order.distance} AWAY</div>
                                        <div className="cod-value">₱{Number(order.sale?.total_amount).toLocaleString()}</div>
                                    </div>
                                    <div className="cust-name">{order.sale?.customer?.name}</div>
                                    <div className="addr">📍 {order.address}</div>
                                    <div className="items-summary">
                                        {order.sale?.items?.map(i => `${i.quantity}x ${i.product?.name}`).join(', ')}
                                    </div>
                                    <div className="card-footer">
                                        <span className="time">PLACED {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toUpperCase()}</span>
                                        <div className="eta-info">⏱️ {order.eta || 'N/A'}</div>
                                        <button className="accept-btn" onClick={() => handleAction(order.id, 'assigned', 'Order accepted!')}>ACCEPT ORDER →</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'my_jobs' && (
                        <div className="order-list">
                            {myJobs.length === 0 && (
                                <div className="empty-state">
                                    <h3>No Active Jobs</h3>
                                    <p>Ready for more? Check the "Nearby Orders" tab to accept a new delivery.</p>
                                </div>
                            )}
                            {myJobs.map(order => (
                                <div key={order.id} className={`order-card-premium ${order.status === 'in_progress' ? 'active-job' : ''}`}>
                                     <div className="card-top">
                                        <div className="order-no">#{order.sale?.order_number}</div>
                                        <div className="status-badge">🚚 {order.status.replace('_', ' ')}</div>
                                        <div className="cod-value">₱{Number(order.sale?.total_amount).toLocaleString()}</div>
                                    </div>
                                    <div className="cust-name">{order.sale?.customer?.name}</div>
                                    <div className="addr">📍 {order.address}</div>
                                    <div className="actions-row">
                                        {order.status === 'pending' ? (
                                            <button className="btn-start" onClick={() => handleAction(order.id, 'in_progress', 'Delivery started')}>START DELIVERY</button>
                                        ) : (
                                            <div className="flex-group">
                                                <button className="btn-done" onClick={() => handleAction(order.id, 'delivered', 'Marked as delivered')}>COMPLETE JOB ✅</button>
                                                <button className="btn-fail" onClick={() => { if(confirm('Mark as failed?')) handleAction(order.id, 'failed', 'Marked as failed'); }}>FAILED ✕</button>
                                            </div>
                                        )}
                                        <button className="btn-call" onClick={() => window.open(`tel:${order.sale?.customer?.phone || ''}`)}>📞</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'completed' && (
                        <div className="order-list">
                            {completed.length === 0 && (
                                <div className="empty-state">
                                    <h3>No Recent Activity</h3>
                                    <p>Your finished deliveries and failed attempts will show up here.</p>
                                </div>
                            )}
                            {completed.map(order => (
                                <div key={order.id} className="history-item">
                                    <div className="left">
                                        <div className="id">#{order.sale?.order_number}</div>
                                        <div className="status-lbl">{order.status === 'delivered' ? '✅ DELIVERED' : '❌ FAILED'}</div>
                                    </div>
                                    <div className="right">
                                        <div className="amt">₱{Number(order.sale?.total_amount).toLocaleString()}</div>
                                        <div className="time">{new Date(order.updated_at).toLocaleDateString().toUpperCase()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div> {/* END inner-container */}
            </div> {/* END content-wrapper */}
            </div>

            {/* Map Area */}
            <div className="rider-map-area">
                <div className="map-overlay-top">
                    <div className="map-title-box">
                        <div className="map-title">📍 Delivery Map — Davao City Zone</div>
                        <div className="map-legend">
                            <span className="dot you"></span> You
                            <span className="dot nearby"></span> Nearby
                            <span className="dot far"></span> Far
                        </div>
                    </div>
                </div>

                <div className="map-placeholder">
                    <MapContainer 
                        center={riderPos} 
                        zoom={16} 
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                    >
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        />
                        
                        {/* Rider Marker */}
                        <Marker position={riderPos} icon={riderIcon}>
                            <Popup>
                                <div style={{fontWeight: 800}}>🚲 YOU (REAL LOCATION)</div>
                                <div style={{fontSize: '11px', color: '#666'}}>
                                    {hasGeo ? 'GPS Signal: Strong' : 'Waiting for GPS...'}
                                </div>
                            </Popup>
                        </Marker>

                        {/* Job Markers */}
                        {nearby.map(job => (
                            <Marker 
                                key={job.id} 
                                position={[job.latitude || riderPos[0], job.longitude || riderPos[1]]} 
                                icon={jobIcon}
                                eventHandlers={{
                                    click: () => setSelectedJob(job),
                                }}
                            >
                                <Popup>
                                    <div style={{fontWeight: 900, color: '#15803d'}}>📦 NEW ORDER #{job.sale?.order_number}</div>
                                    <div style={{fontSize: '12px', margin: '4px 0'}}>{job.address}</div>
                                    <div style={{fontSize: '11px', fontWeight: 700, color: '#f97316'}}>COD: ₱{Number(job.sale?.total_amount).toLocaleString()}</div>
                                </Popup>
                            </Marker>
                        ))}

                        <RecenterMap pos={riderPos} />
                    </MapContainer>
                </div>

                <div className="map-status-bar">
                    <div className="loc">
                        📡 {hasGeo ? `ACCURATE: ${riderPos[0].toFixed(5)}, ${riderPos[1].toFixed(5)}` : 'SCANNING GPS...'}
                    </div>
                    <button className="update-loc" onClick={() => setRefresh(r => r + 1)}>RE-CENTER MAP</button>
                </div>

                {/* Selected Job Mini Card (Float) */}
                {activeTab === 'nearby' && nearby.length > 0 && (
                    <div className="selected-job-float">
                         <div className="info">
                            <div className="name-box">
                                <span className="name">{nearby[0].sale?.customer?.name}</span>
                                <span className="id">#{nearby[0].sale?.order_number}</span>
                            </div>
                            <div className="addr">{nearby[0].address}</div>
                            <div className="dist">🚗 {nearby[0].distance} — 4 min drive</div>
                         </div>
                         <button className="nav-btn">🧭 Open Navigation</button>
                    </div>
                )}
            </div>
        </div>
    );
}