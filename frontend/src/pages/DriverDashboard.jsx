import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import { useAuth } from '../context/AuthContext';
import './DriverDashboard.css';

export default function DriverDashboard() {
    const { user, token } = useAuth();
    const [orders, setOrders] = useState([]);
    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !token) return;
            try {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                // Fetch driver's vehicle
                const vehicleRes = await axios.get(`${API_BASE_URL}/vehicles/my-vehicle`);
                setVehicle(vehicleRes.data);

                // Fetch assigned orders
                const ordersRes = await axios.get(`${API_BASE_URL}/orders/my-orders`);
                setOrders(ordersRes.data);
            } catch (err) {
                console.error('Failed to fetch driver data', err);
                // If endpoints don't exist, try alternative approach
                if (err.response?.status === 404) {
                    // Fallback: get all orders and filter client-side
                    try {
                        const ordersRes = await axios.get(`${API_BASE_URL}/orders`);
                        setOrders(ordersRes.data);
                    } catch (e) {
                        console.error('Fallback failed', e);
                    }
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user, token]);

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await axios.patch(`${API_BASE_URL}/orders/${orderId}/status`, { status: newStatus });
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (err) {
            console.error('Failed to update status', err);
            alert('Failed to update status');
        }
    };

    if (loading) {
        return (
            <div className="driver-loading">
                <div className="loading-spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    // Calculate current capacity
    const currentWeight = orders.reduce((acc, o) => acc + (o.weight_kg || 0), 0);
    const currentVolume = orders.reduce((acc, o) => acc + (o.volume_m3 || 0), 0);
    const maxVolume = vehicle?.max_volume_m3 || 100;
    const maxWeight = vehicle?.max_weight_kg || 5000;

    return (
        <div className="driver-dashboard">
            {/* Header */}
            <div className="driver-header">
                <div>
                    <h1 className="driver-title">Welcome back, {user?.name || user?.email?.split('@')[0] || 'Driver'}!</h1>
                    <p className="driver-subtitle" style={{ marginTop: '0.5rem' }}>
                        Vehicle: <span className="vehicle-number">{vehicle?.vehicle_number || 'Not Assigned'}</span>
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="driver-content">
                {/* Current Manifest */}
                <div className="driver-main">
                    <div className="card">
                        <h2 className="section-title">Current Manifest</h2>
                        {orders.length === 0 ? (
                            <p className="empty-state">No active orders assigned.</p>
                        ) : (
                            <div className="orders-list">
                                {orders.map(order => (
                                    <div key={order.id} className="order-card">
                                        <div className="order-header">
                                            <div>
                                                <span className="order-id">#{order.id}</span>
                                                <h3 className="order-item">{order.item_name}</h3>
                                            </div>
                                            <span className={`badge ${order.status === 'SHIPPED' ? 'badge-success' : order.status === 'DELIVERED' ? 'badge-delivered' : 'badge-warning'}`}>
                                                {order.status}
                                            </span>
                                        </div>

                                        <div className="order-details">
                                            <div className="order-location">
                                                <span className="location-label">Pickup</span>
                                                <span className="location-address">{order.pickup_address || 'Address not available'}</span>
                                            </div>
                                            <div className="order-location">
                                                <span className="location-label">Dropoff</span>
                                                <span className="location-address">{order.drop_address || 'Address not available'}</span>
                                            </div>
                                        </div>

                                        <div className="order-actions">
                                            {order.status === 'ASSIGNED' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(order.id, 'SHIPPED')}
                                                    className="btn btn-primary"
                                                >
                                                    Start Delivery
                                                </button>
                                            )}
                                            {order.status === 'SHIPPED' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(order.id, 'DELIVERED')}
                                                    className="btn btn-success"
                                                >
                                                    Mark Delivered
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="driver-sidebar">
                    {/* Capacity Status */}
                    <div className="card capacity-card">
                        <h3 className="capacity-title">Capacity Status</h3>
                        <div className="capacity-stats">
                            <div className="capacity-item">
                                <div className="capacity-label">Volume</div>
                                <div className="capacity-value">{currentVolume.toFixed(1)} / {maxVolume} m³</div>
                                <div className="capacity-bar">
                                    <div
                                        className="capacity-fill"
                                        style={{ width: `${Math.min((currentVolume / maxVolume) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="capacity-item">
                                <div className="capacity-label">Weight</div>
                                <div className="capacity-value">{currentWeight.toFixed(1)} / {maxWeight} kg</div>
                                <div className="capacity-bar">
                                    <div
                                        className="capacity-fill"
                                        style={{ width: `${Math.min((currentWeight / maxWeight) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="card stats-card">
                        <h3 className="stats-title">Today's Summary</h3>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <div className="stat-value">{orders.length}</div>
                                <div className="stat-label">Total Orders</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{orders.filter(o => o.status === 'DELIVERED').length}</div>
                                <div className="stat-label">Delivered</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{orders.filter(o => o.status === 'SHIPPED').length}</div>
                                <div className="stat-label">In Transit</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{orders.filter(o => o.status === 'ASSIGNED').length}</div>
                                <div className="stat-label">Pending</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
