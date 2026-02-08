import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import { useAuth } from '../context/AuthContext';
import SearchInput from '../components/SearchInput';
import './DriverOrders.css';

export default function DriverOrders() {
    const { user, token } = useAuth();
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const res = await axios.get(`${API_BASE_URL}/orders`);
                setOrders(res.data);
                setFilteredOrders(res.data);
            } catch (err) {
                console.error('Failed to fetch orders', err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [token]);

    useEffect(() => {
        let filtered = orders;

        // Filter by status
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(o => o.status === statusFilter);
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(o =>
                o.id.toString().includes(query) ||
                o.item_name?.toLowerCase().includes(query) ||
                o.pickup_address?.toLowerCase().includes(query) ||
                o.drop_address?.toLowerCase().includes(query)
            );
        }

        setFilteredOrders(filtered);
    }, [statusFilter, searchQuery, orders]);

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'DELIVERED': return 'badge-delivered';
            case 'SHIPPED': return 'badge-success';
            case 'ASSIGNED': return 'badge-warning';
            default: return 'badge-default';
        }
    };

    if (loading) {
        return (
            <div className="driver-orders-loading">
                <div className="loading-spinner"></div>
                <p>Loading orders...</p>
            </div>
        );
    }

    return (
        <div className="driver-orders">
            <div className="orders-header">
                <div>
                    <h1>My Orders</h1>
                    <p>View all your assigned deliveries</p>
                </div>
                <div className="orders-stats">
                    <div className="stat">
                        <span className="stat-value">{orders.length}</span>
                        <span className="stat-label">Total</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">{orders.filter(o => o.status === 'DELIVERED').length}</span>
                        <span className="stat-label">Delivered</span>
                    </div>
                </div>
            </div>

            <div className="orders-controls">
                <SearchInput
                    suggestions={[
                        ...new Set(orders.flatMap(o => [
                            o.item_name,
                            o.pickup_address,
                            o.drop_address
                        ]).filter(Boolean))
                    ]}
                    onSearch={(query) => setSearchQuery(query)}
                    placeholder="Search by order ID, item, or address..."
                    debounceMs={300}
                    minChars={1}
                    maxSuggestions={10}
                />

                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('ALL')}
                    >
                        All
                    </button>
                    <button
                        className={`filter-btn ${statusFilter === 'ASSIGNED' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('ASSIGNED')}
                    >
                        Assigned
                    </button>
                    <button
                        className={`filter-btn ${statusFilter === 'SHIPPED' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('SHIPPED')}
                    >
                        In Transit
                    </button>
                    <button
                        className={`filter-btn ${statusFilter === 'DELIVERED' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('DELIVERED')}
                    >
                        Delivered
                    </button>
                </div>
            </div>

            <div className="orders-list">
                {filteredOrders.length === 0 ? (
                    <div className="empty-state">
                        <p>No orders found</p>
                    </div>
                ) : (
                    filteredOrders.map(order => (
                        <div key={order.id} className="order-card">
                            <div className="order-header">
                                <div>
                                    <span className="order-id">Order #{order.id}</span>
                                    <h3 className="order-item">{order.item_name}</h3>
                                </div>
                                <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>

                            <div className="order-details">
                                <div className="detail-row">
                                    <span className="label">Pickup</span>
                                    <span className="value">{order.pickup_address || 'Address not available'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Dropoff</span>
                                    <span className="value">{order.drop_address || 'Address not available'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Weight</span>
                                    <span className="value">{order.weight_kg} kg</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Volume</span>
                                    <span className="value">{order.volume_m3?.toFixed(2)} m³</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
