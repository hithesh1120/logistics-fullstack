import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import LocationPickerMap from '../components/LocationPickerMap';
import AddAddressModal from '../components/AddAddressModal';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { API_BASE_URL } from '../apiConfig';
import './MSMEPortal.css';
import FindTransportPanel from '../components/FindTransportPanel';

export default function MSMEPortal() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewShipmentModal, setShowNewShipmentModal] = useState(false);
    const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'search'

    const [bookingDetails, setBookingDetails] = useState(null);



    const fetchOrders = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/orders`);
            setOrders(res.data);
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleCreate = () => {
        setShowNewShipmentModal(false);
        setBookingTrip(null);
        fetchOrders();
    };

    const [selectedOrderForRoute, setSelectedOrderForRoute] = useState(null);
    const [bookingTrip, setBookingTrip] = useState(null);

    const handleViewRoute = (order) => {
        setSelectedOrderForRoute(order);
    };

    const closeRouteModal = () => {
        setSelectedOrderForRoute(null);
    };

    // Compute Map Suggestions for the New Shipment Modal
    const mapSuggestions = useMemo(() => {
        const suggestions = [];
        const seen = new Set();

        // 1. Add Saved Addresses
        (user?.savedAddresses || []).forEach(addr => {
            if (addr.latitude && addr.longitude) {
                const key = `${addr.latitude.toFixed(6)},${addr.longitude.toFixed(6)}`;
                if (!seen.has(key)) {
                    suggestions.push({
                        lat: addr.latitude,
                        lng: addr.longitude,
                        label: `Saved: ${addr.label || addr.address_line1}`
                    });
                    seen.add(key);
                }
            }
        });

        // 2. Add Recent Shipment Locations (last 5 unique)
        orders.slice(0, 10).forEach(order => {
            // Pickup
            const pKey = `${order.latitude.toFixed(6)},${order.longitude.toFixed(6)}`;
            if (!seen.has(pKey) && suggestions.length < 15) {
                suggestions.push({
                    lat: order.latitude,
                    lng: order.longitude,
                    label: order.pickup_address || "Past Pickup"
                });
                seen.add(pKey);
            }
            // Dropoff
            if (order.drop_latitude && order.drop_longitude) {
                const dKey = `${order.drop_latitude.toFixed(6)},${order.drop_longitude.toFixed(6)}`;
                if (!seen.has(dKey) && suggestions.length < 15) {
                    suggestions.push({
                        lat: order.drop_latitude,
                        lng: order.drop_longitude,
                        label: order.drop_address || "Past Dropoff"
                    });
                    seen.add(dKey);
                }
            }
        });

        return suggestions;
    }, [user, orders]);

    return (
        <div className="msme-container">
            {/* Header */}
            <div className="portal-header">
                <div>
                    <h1 className="portal-title">Welcome back, {user?.name} 👋</h1>
                    <p className="portal-subtitle">Manage active shipments and book new logistics orders.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowNewShipmentModal(true)}>
                    + New Shipment
                </button>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setActiveTab('orders')}
                    style={{
                        padding: '0.75rem 1rem',
                        borderBottom: activeTab === 'orders' ? '2px solid var(--primary)' : '2px solid transparent',
                        color: activeTab === 'orders' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: '600',
                        background: 'none', border: 'none', cursor: 'pointer'
                    }}
                >
                    My Shipments
                </button>
                <button
                    onClick={() => setActiveTab('search')}
                    style={{
                        padding: '0.75rem 1rem',
                        borderBottom: activeTab === 'search' ? '2px solid var(--primary)' : '2px solid transparent',
                        color: activeTab === 'search' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: '600',
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                >
                    <span>🔍</span> Find Transport
                </button>
            </div>

            {/* CONTENT AREA */}
            {
                activeTab === 'orders' ? (
                    <>
                        {/* Scorecards */}
                        <div className="stats-row">
                            <div className="card" style={{ padding: '1.5rem' }}>
                                <div className="stat-card-flex">
                                    <div>
                                        <span className="stat-label">Total Orders</span>
                                        <div className="stat-number-wrapper">
                                            <span className="stat-number">{orders.length}</span>
                                        </div>
                                    </div>
                                    <div className="stat-icon stat-icon-blue">🖥️</div>
                                </div>
                            </div>
                            <div className="card" style={{ padding: '1.5rem' }}>
                                <div className="stat-card-flex">
                                    <div>
                                        <span className="stat-label">Pending Assignment</span>
                                        <div className="stat-number-wrapper">
                                            <span className="stat-number">{orders.filter(o => o.status === 'PENDING').length}</span>
                                            <span className="stat-number-suffix">Orders</span>
                                        </div>
                                    </div>
                                    <div className="stat-icon stat-icon-amber">🕒</div>
                                </div>
                            </div>
                        </div>

                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#334155', marginBottom: '1rem' }}>My Shipments</h2>

                        {/* Shipment Table */}
                        <ShipmentTable orders={orders} onViewRoute={handleViewRoute} />
                    </>
                ) : (
                    <FindTransportPanel onBook={(trip, criteria) => {
                        setBookingTrip(trip);
                        setBookingDetails(criteria);
                        setShowNewShipmentModal(true);
                    }} />
                )
            }

            {/* Modals */}
            {/* Modals */}
            {
                showNewShipmentModal && (
                    <NewShipmentModal
                        onClose={() => { setShowNewShipmentModal(false); setBookingTrip(null); setBookingDetails(null); }}
                        onSuccess={handleCreate}
                        suggestions={mapSuggestions}
                        initialValues={bookingTrip ? {
                            trip_id: bookingTrip.id,
                            from: bookingTrip.source,
                            to: bookingTrip.destination,
                            weight: bookingDetails?.weight,
                            volume: bookingDetails?.volume
                        } : null}
                    />
                )
            }

            {/* Route View Modal */}
            {
                selectedOrderForRoute && (
                    <div className="modal-overlay" onClick={closeRouteModal} style={{ zIndex: 1100 }}>
                        <div className="modal-content" style={{ maxWidth: '800px', width: '90%', height: '600px', display: 'flex', flexDirection: 'column', padding: 0 }} onClick={e => e.stopPropagation()}>
                            <div className="modal-header" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ background: '#e0f2fe', padding: '0.5rem', borderRadius: '0.5rem', color: '#0284c7' }}>
                                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Shipment Route</h3>
                                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Order #{selectedOrderForRoute.id}</p>
                                    </div>
                                </div>
                                <button className="close-btn" onClick={closeRouteModal}>×</button>
                            </div>
                            <div className="modal-body" style={{ flex: 1, padding: 0, overflow: 'hidden', position: 'relative' }}>
                                <MapContainer
                                    bounds={[
                                        [selectedOrderForRoute.latitude, selectedOrderForRoute.longitude],
                                        [selectedOrderForRoute.drop_latitude || selectedOrderForRoute.latitude, selectedOrderForRoute.drop_longitude || selectedOrderForRoute.longitude]
                                    ]}
                                    style={{ width: '100%', height: '100%' }}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <Marker position={[selectedOrderForRoute.latitude, selectedOrderForRoute.longitude]}>
                                        <Popup><strong>Pickup:</strong> <br /> {selectedOrderForRoute.pickup_address || "Location A"}</Popup>
                                    </Marker>
                                    {selectedOrderForRoute.drop_latitude && (
                                        <>
                                            <Marker position={[selectedOrderForRoute.drop_latitude, selectedOrderForRoute.drop_longitude]}>
                                                <Popup><strong>Drop:</strong> <br /> {selectedOrderForRoute.drop_address || "Location B"}</Popup>
                                            </Marker>
                                            <Polyline
                                                positions={[
                                                    [selectedOrderForRoute.latitude, selectedOrderForRoute.longitude],
                                                    [selectedOrderForRoute.drop_latitude, selectedOrderForRoute.drop_longitude]
                                                ]}
                                                color="#6366f1"
                                                weight={4}
                                                dashArray="10, 10"
                                            />
                                        </>
                                    )}
                                </MapContainer>
                                <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, background: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', maxWidth: '250px' }}>
                                    <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#475569' }}>Route Summary</h4>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1e293b' }}>
                                        {calculateDistance(
                                            selectedOrderForRoute.latitude, selectedOrderForRoute.longitude,
                                            selectedOrderForRoute.drop_latitude, selectedOrderForRoute.drop_longitude
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                                        Estimated via Direct Path
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

// Haversine Distance Helper
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat2 || !lon2) return "N/A";
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d.toFixed(1) + " km";
}

// Extract Table to clean up main component
function ShipmentTable({ orders, onViewRoute }) {
    if (orders.length === 0) {
        return <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No orders found. Create your first shipment!</div>;
    }

    return (
        <div className="shipment-table-wrapper card">
            <table className="shipment-data-table">
                <thead className="shipment-table-head">
                    <tr>
                        <th className="shipment-th">ORDER ID</th>
                        <th className="shipment-th">ITEM NAME</th>
                        <th className="shipment-th" style={{ minWidth: '250px' }}>ROUTE / PATH</th>
                        <th className="shipment-th">DIMENSIONS</th>
                        <th className="shipment-th">VOLUME</th>
                        <th className="shipment-th">ACTION</th>
                        <th className="shipment-th">STATUS</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.id} className="shipment-tr">
                            <td className="shipment-id-td">#{order.id}</td>
                            <td className="shipment-td-bold">{order.item_name || 'N/A'}</td>
                            <td className="shipment-td">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {/* From Address */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                        <div style={{ minWidth: '16px', marginTop: '3px' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #22c55e', background: 'white' }}></div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#0f172a' }}>From:</div>
                                            <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: '1.4' }}>
                                                {order.pickup_address || order.pickup_location || `${order.latitude.toFixed(4)}, ${order.longitude.toFixed(4)}`}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Connector Visual */}
                                    <div style={{ margin: '-4px 0 -4px 4px', borderLeft: '2px dotted #cbd5e1', height: '12px' }}></div>

                                    {/* To Address */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                        <div style={{ minWidth: '16px', marginTop: '3px' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#0f172a' }}>To:</div>
                                            <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: '1.4' }}>
                                                {order.drop_address || order.drop_location ?
                                                    (order.drop_address || order.drop_location) :
                                                    (order.drop_latitude ? `${order.drop_latitude.toFixed(4)}, ${order.drop_longitude.toFixed(4)}` : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Destination not set</span>)
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    {/* Distance Summary */}
                                    {order.drop_latitude && (
                                        <div style={{ fontSize: '0.75rem', color: '#6366f1', background: '#eef2ff', padding: '2px 8px', borderRadius: '4px', width: 'fit-content', fontWeight: '500', marginTop: '4px' }}>
                                            Est. {calculateDistance(order.latitude, order.longitude, order.drop_latitude, order.drop_longitude)}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="shipment-td-muted">{order.length_cm}x{order.width_cm}x{order.height_cm} cm • {order.weight_kg} kg</td>
                            <td className="shipment-td-muted">{order.volume_m3.toFixed(4)} m³</td>
                            <td className="shipment-td">
                                <button
                                    onClick={() => onViewRoute(order)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0',
                                        background: 'white',
                                        color: '#334155',
                                        fontSize: '0.8rem',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        transition: 'all 0.2s'
                                    }}
                                    className="hover:bg-slate-50"
                                >
                                    <span style={{ fontSize: '1rem' }}>🗺️</span> View Route
                                </button>
                            </td>
                            <td className="shipment-td">
                                <span className={`badge ${order.status === 'SHIPPED' ? 'badge-success' :
                                    order.status === 'ASSIGNED' ? 'badge-warning' : 'badge-neutral'
                                    }`}>
                                    {order.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function NewShipmentModal({ onClose, onSuccess, suggestions = [], initialValues = null }) {
    const { token, user } = useAuth();
    const [pickupLocation, setPickupLocation] = useState({ lat: 20.5937, lng: 78.9629 });
    const [itemName, setItemName] = useState('');
    const [weight, setWeight] = useState('');
    const [dims, setDims] = useState({ l: '', w: '', h: '' });
    const [loading, setLoading] = useState(false);

    // Initial Values (for Booking from Search)
    useEffect(() => {
        if (initialValues) {
            // Preset values from trip search
            if (initialValues.weight) setWeight(initialValues.weight);
            if (initialValues.volume) {
                // Approximate dims from volume if provided, or just leave blank
                // Not easy to reverse calc unless we assume a cube
                // For now, let user fill dims.
            }
            // Could also set From/To if we had geocoding for cities. 
            // Since we only have City Names, we'd need to geocode them to get Lat/Lng for the map.
            if (initialValues.from) {
                // Try to geocode source
                axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(initialValues.from)}&limit=1`)
                    .then(res => {
                        if (res.data?.[0]) {
                            setPickupLocation({ lat: parseFloat(res.data[0].lat), lng: parseFloat(res.data[0].lon) });
                            setCity(initialValues.from);
                        }
                    });
            }
            if (initialValues.to) {
                // Try to geocode dest
                axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(initialValues.to)}&limit=1`)
                    .then(res => {
                        if (res.data?.[0]) {
                            setDropLocation({ lat: parseFloat(res.data[0].lat), lng: parseFloat(res.data[0].lon) });
                            setDropCity(initialValues.to);
                        }
                    });
            }
        }
    }, [initialValues]);

    // Address Fields (Pickup Defaults)
    const [contactName, setContactName] = useState('My Company');
    const [mobileNumber, setMobileNumber] = useState('0000000000');
    const [addressLine1, setAddressLine1] = useState('Headquarters');
    const [pincode, setPincode] = useState('000000');
    const [city, setCity] = useState('Default City');
    const [state, setState] = useState('Default State');

    // Drop Address Fields
    const [dropLocation, setDropLocation] = useState(null);
    const [dropContactName, setDropContactName] = useState('');
    const [dropMobileNumber, setDropMobileNumber] = useState('');
    const [dropAddressLine1, setDropAddressLine1] = useState('');
    const [dropPincode, setDropPincode] = useState('');
    const [dropCity, setDropCity] = useState('');
    const [dropState, setDropState] = useState('');
    const [dropCityOptions, setDropCityOptions] = useState([]);

    const [activeLocationType, setActiveLocationType] = useState('drop'); // Default to drop only selection

    // Autofill Pickup from User Profile
    useEffect(() => {
        if (user && user.company) {
            setContactName(user.company.name || user.email || 'My Company');
            if (user.company.address) {
                setAddressLine1(user.company.address);
                // Smart Autofill via Geocoding
                axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(user.company.address)}&addressdetails=1&limit=1`)
                    .then(res => {
                        if (res.data?.[0]) {
                            const data = res.data[0];
                            setPickupLocation({ lat: parseFloat(data.lat), lng: parseFloat(data.lon) });
                            if (data.address) {
                                if (data.address.postcode) setPincode(data.address.postcode);
                                setCity(data.address.city || data.address.town || data.address.village || 'City');
                                setState(data.address.state || '');
                            }
                        }
                    })
                    .catch(() => { });
            }
        }
    }, [user]);

    // Saved Addresses
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [showSavedAddressList, setShowSavedAddressList] = useState(false);
    const [showAddAddressModal, setShowAddAddressModal] = useState(false);
    const [cityOptions, setCityOptions] = useState([]); // List of POs

    // Save New Address Logic
    const [saveAddress, setSaveAddress] = useState(false);
    const [saveLabel, setSaveLabel] = useState('Home'); // Home, Office, Other

    const [volumeUnit, setVolumeUnit] = useState('m3');
    const [showUnitMenu, setShowUnitMenu] = useState(false);
    const [companySearch, setCompanySearch] = useState('');

    useEffect(() => {
        fetchSavedAddresses();
    }, []);

    const fetchSavedAddresses = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/addresses`);
            setSavedAddresses(res.data);
        } catch (err) {
            console.error("Failed to fetch saved addresses", err);
        }
    };

    const handlePincodeChange = async (e, type = 'pickup') => {
        const val = e.target.value;
        if (type === 'pickup') setPincode(val);
        else setDropPincode(val);

        if (val.length === 6) {
            try {
                const res = await axios.get(`https://api.postalpincode.in/pincode/${val}`);
                if (res.data && res.data[0].Status === "Success") {
                    const postOffices = res.data[0].PostOffice;
                    if (type === 'pickup') {
                        setCityOptions(postOffices);
                        if (postOffices.length > 0) {
                            setCity(postOffices[0].Name);
                            setState(postOffices[0].State);
                        }
                    } else {
                        setDropCityOptions(postOffices);
                        if (postOffices.length > 0) {
                            setDropCity(postOffices[0].Name);
                            setDropState(postOffices[0].State);
                        }
                    }
                } else {
                    if (type === 'pickup') setCityOptions([]);
                    else setDropCityOptions([]);
                }
            } catch (err) {
                console.error("Failed to fetch pincode details", err);
                if (type === 'pickup') setCityOptions([]);
                else setDropCityOptions([]);
            }
        } else {
            if (type === 'pickup') setCityOptions([]);
            else setDropCityOptions([]);
        }
    };

    const handleAddressSelect = (addr, type = 'pickup') => {
        if (type === 'pickup') {
            setContactName(addr.recipient_name);
            setMobileNumber(addr.mobile_number);
            setAddressLine1(addr.address_line1);
            setPincode(addr.pincode);
            setCity(addr.city);
            setState(addr.state);
            if (addr.latitude && addr.longitude) {
                setPickupLocation({ lat: addr.latitude, lng: addr.longitude });
            }
        } else {
            setDropContactName(addr.recipient_name);
            setDropMobileNumber(addr.mobile_number);
            setDropAddressLine1(addr.address_line1);
            setDropPincode(addr.pincode);
            setDropCity(addr.city);
            setDropState(addr.state);
            if (addr.latitude && addr.longitude) {
                setDropLocation({ lat: addr.latitude, lng: addr.longitude });
            }
        }
        setShowSavedAddressList(false);
    };

    const [addressLoading, setAddressLoading] = useState(false);

    const handleMapLocationSelect = async (loc) => {
        setAddressLoading(true);
        if (activeLocationType === 'pickup') {
            setPickupLocation(loc);
        } else {
            setDropLocation(loc);
        }

        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}`);
            if (res.data && res.data.address) {
                const addr = res.data.address;
                const newPincode = addr.postcode || '';
                const newCity = addr.city || addr.town || addr.village || addr.county || '';
                const newState = addr.state || '';
                const newAddressLine = res.data.display_name;

                if (activeLocationType === 'pickup') {
                    setPincode(newPincode);
                    setCity(newCity);
                    setState(newState);
                    setAddressLine1(newAddressLine);
                } else {
                    setDropPincode(newPincode);
                    setDropCity(newCity);
                    setDropState(newState);
                    setDropAddressLine1(newAddressLine);
                }
            }
        } catch (err) {
            console.error("Reverse geocoding failed", err);
        } finally {
            setAddressLoading(false);
        }
    };

    const getVolumeDisplay = () => {
        if (!dims.l || !dims.w || !dims.h) return '0.00';
        const v_cm3 = dims.l * dims.w * dims.h;

        if (volumeUnit === 'm3') return (v_cm3 / 1000000).toFixed(4);
        if (volumeUnit === 'cm3') return v_cm3.toFixed(2);
        if (volumeUnit === 'ft3') return (v_cm3 / 28316.85).toFixed(4);
        return '0.00';
    };

    const handleCreate = async () => {
        const missingFields = [];
        if (!itemName) missingFields.push("Item Description");
        if (!weight) missingFields.push("Weight");
        if (!dims.l || !dims.w || !dims.h) missingFields.push("Dimensions (L, W, H)");
        if (!pickupLocation) missingFields.push("Pickup Location (Map)");
        if (!dropLocation) missingFields.push("Drop Location (Map)");

        // Pickup Details
        if (!contactName) missingFields.push("Pickup Sender Name");
        if (!mobileNumber) missingFields.push("Pickup Mobile");
        if (!pincode) missingFields.push("Pickup Pincode");

        // Drop Details
        if (!dropContactName) missingFields.push("Drop Recipient Name");
        if (!dropMobileNumber) missingFields.push("Drop Mobile");
        if (!dropPincode) missingFields.push("Drop Pincode");

        if (missingFields.length > 0) {
            alert(`Please fill the following required fields:\n- ${missingFields.join('\n- ')}`);
            return;
        }

        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            // 1. Save Address if requested
            if (saveAddress) {
                try {
                    await axios.post(`${API_BASE_URL}/addresses`, {
                        label: saveLabel,
                        recipient_name: contactName,
                        mobile_number: mobileNumber,
                        address_line1: addressLine1,
                        pincode: pincode,
                        city: city,
                        state: state,
                        latitude: pickupLocation.lat,
                        longitude: pickupLocation.lng
                    }, config);
                } catch (saveErr) {
                    console.error("Failed to save address", saveErr);
                    // Continue to create order anyway? yes.
                }
            }

            // 2. Create Order
            const payload = {
                item_name: itemName,
                length_cm: parseFloat(dims.l),
                width_cm: parseFloat(dims.w),
                height_cm: parseFloat(dims.h),
                weight_kg: parseFloat(weight),
                latitude: pickupLocation.lat,
                longitude: pickupLocation.lng,
                drop_latitude: dropLocation ? dropLocation.lat : null,
                drop_longitude: dropLocation ? dropLocation.lng : null,

                // Send readable addresses
                pickup_address: addressLine1 || `${city}, ${state}`,
                drop_address: dropAddressLine1 || `${dropCity}, ${dropState}`,

                // Link Trip if booking from search
                trip_id: initialValues?.trip_id || null
            };
            await axios.post(`${API_BASE_URL}/orders`, payload, config);
            onSuccess();
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) {
                alert("Session expired. Please log out and log in again.");
                return;
            }
            const errorMsg = err.response?.data?.detail || err.message || "Failed to create order";
            alert(`Error: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="drawer-overlay">
                <div className="drawer-content">
                    <div className="drawer-header">
                        <h2 className="drawer-title">New Shipment</h2>
                        <button onClick={onClose} className="drawer-close-btn">
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    <div className="new-shipment-grid">
                        {/* Left Panel: Listed Companies */}
                        <div className="left-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', borderRight: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label className="form-label" style={{ marginBottom: 0 }}>Select Drop Account</label>
                                <button
                                    type="button"
                                    className="btn-xs btn-outline"
                                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                                    onClick={() => setShowAddAddressModal(true)}
                                >
                                    + Add New
                                </button>
                            </div>

                            <input
                                type="text"
                                placeholder="Search listed companies..."
                                className="form-input"
                                style={{ marginBottom: '1rem' }}
                                value={companySearch}
                                onChange={e => setCompanySearch(e.target.value)}
                            />

                            <div className="saved-address-list" style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem', backgroundColor: '#f8fafc' }}>
                                {savedAddresses
                                    .filter(addr =>
                                        (addr.label || '').toLowerCase().includes(companySearch.toLowerCase()) ||
                                        (addr.recipient_name || '').toLowerCase().includes(companySearch.toLowerCase())
                                    )
                                    .map(addr => (
                                        <div
                                            key={addr.id}
                                            className="saved-address-item"
                                            onClick={() => handleAddressSelect(addr, activeLocationType)}
                                            style={{
                                                padding: '10px',
                                                marginBottom: '8px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                border: '1px solid #e2e8f0',
                                                backgroundColor: 'white',
                                                transition: 'all 0.2s',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                            onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                                        >
                                            <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '2px' }}>{addr.label}</div>
                                            <div style={{ fontSize: '0.85em', color: '#64748b' }}>{addr.recipient_name}</div>
                                            <div style={{ fontSize: '0.8em', color: '#94a3b8' }}>{addr.city}, {addr.state}</div>
                                        </div>
                                    ))}
                                {savedAddresses.length === 0 && (
                                    <div className="text-sm text-muted" style={{ padding: '2rem', textAlign: 'center' }}>
                                        No companies found.<br />Click "+ Add New" to add one.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Panel: Form Details */}
                        <form className="right-panel" onSubmit={e => e.preventDefault()}>
                            <div className="right-panel-scroll">

                                {/* Pickup Details Hidden (Autofilled) */}

                                {/* Section: Drop Details (Always Visible) */}
                                <h4 className="section-title">Drop Details</h4>
                                <div className="form-row">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Recipient Name</label>
                                        <input className="form-input" placeholder="e.g. Jane Smith" value={dropContactName} onChange={e => setDropContactName(e.target.value)} />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Mobile</label>
                                        <input className="form-input" placeholder="10-digit number" value={dropMobileNumber} onChange={e => setDropMobileNumber(e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Drop-off Address</label>
                                    <input className="form-input" placeholder="Flat, Building, Street" value={dropAddressLine1} onChange={e => setDropAddressLine1(e.target.value)} />
                                </div>
                                <div className="form-row">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Pincode</label>
                                        <input className="form-input" value={dropPincode} onChange={e => handlePincodeChange(e, 'drop')} maxLength={6} />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">City</label>
                                        <input className="form-input" value={dropCity} onChange={e => setDropCity(e.target.value)} />
                                    </div>
                                </div>

                                {/* Save Address Toggle */}
                                <div className="save-address-wrapper">
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)} />
                                        Save this address to address book
                                    </label>
                                    {saveAddress && (
                                        <div className="save-as-options">
                                            <span className="text-sm mr-2">Save As:</span>
                                            {['Home', 'Office', 'Other'].map(lbl => (
                                                <button
                                                    key={lbl}
                                                    type="button"
                                                    className={`chip ${saveLabel === lbl ? 'active' : ''}`}
                                                    onClick={() => setSaveLabel(lbl)}
                                                >
                                                    {lbl}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <hr className="divider" />

                                {/* Section: Shipment Details */}
                                <h4 className="section-title">Shipment Details</h4>
                                <div className="form-group">
                                    <label className="form-label">Item Description</label>
                                    <input className="form-input" placeholder="e.g. Electronics" value={itemName} onChange={e => setItemName(e.target.value)} />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Dimensions (cm) & Weight</label>
                                    <div className="dimensions-grid-mini">
                                        <input type="number" className="form-input" placeholder="L" value={dims.l} onChange={e => setDims({ ...dims, l: e.target.value })} />
                                        <input type="number" className="form-input" placeholder="W" value={dims.w} onChange={e => setDims({ ...dims, w: e.target.value })} />
                                        <input type="number" className="form-input" placeholder="H" value={dims.h} onChange={e => setDims({ ...dims, h: e.target.value })} />
                                        <input type="number" className="form-input" placeholder="Kg" value={weight} onChange={e => setWeight(e.target.value)} />
                                    </div>
                                </div>
                                <div className="volume-display-mini">
                                    Volume: {getVolumeDisplay()} {volumeUnit}
                                </div>

                            </div>

                            <div className="drawer-actions">
                                <button type="button" onClick={onClose} className="btn" style={{ flex: 1, border: '1px solid var(--border)' }}>Cancel</button>
                                <button
                                    type="button"
                                    onClick={handleCreate}
                                    disabled={loading}
                                    className="btn btn-primary"
                                    style={{ flex: 2 }}
                                >
                                    {loading ? 'Processing...' : 'Confirm Booking'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {showAddAddressModal && (
                <AddAddressModal
                    onClose={() => setShowAddAddressModal(false)}
                    onSuccess={() => {
                        setShowAddAddressModal(false);
                        fetchSavedAddresses();
                    }}
                />
            )}
        </>
    );
}
