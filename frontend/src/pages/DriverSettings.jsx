import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import { useAuth } from '../context/AuthContext';
import './DriverSettings.css';

export default function DriverSettings() {
    const { user, token, setUser } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Profile form
    const [name, setName] = useState(user?.name || '');
    const [email] = useState(user?.email || '');

    // Password form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Vehicle info
    const [vehicle, setVehicle] = useState(null);

    useEffect(() => {
        if (user?.name) setName(user.name);

        // Fetch vehicle info
        const fetchVehicle = async () => {
            try {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const res = await axios.get(`${API_BASE_URL}/vehicles`);
                const myVehicle = res.data.find(v => v.driver_id === user?.id);
                setVehicle(myVehicle);
            } catch (err) {
                console.error('Failed to fetch vehicle', err);
            }
        };
        fetchVehicle();
    }, [user, token]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const res = await axios.patch(`${API_BASE_URL}/users/me`, { name });
            setUser(res.data);
            setMessage('Profile updated successfully!');
        } catch (err) {
            setMessage('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (newPassword !== confirmPassword) {
            setMessage('Passwords do not match');
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setMessage('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            await axios.patch(`${API_BASE_URL}/users/me`, { password: newPassword });
            setMessage('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setMessage('Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="driver-settings">
            <div className="settings-header">
                <h1>Settings</h1>
                <p>Manage your account and preferences</p>
            </div>

            <div className="settings-tabs">
                <button
                    className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    Profile
                </button>
                <button
                    className={`tab ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('security')}
                >
                    Security
                </button>
                <button
                    className={`tab ${activeTab === 'vehicle' ? 'active' : ''}`}
                    onClick={() => setActiveTab('vehicle')}
                >
                    Vehicle
                </button>
            </div>

            <div className="settings-content">
                {message && (
                    <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
                        {message}
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="settings-card">
                        <h2>Profile Information</h2>
                        <form onSubmit={handleUpdateProfile}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    disabled
                                    className="disabled"
                                />
                                <small>Email cannot be changed</small>
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <input
                                    type="text"
                                    value="Driver"
                                    disabled
                                    className="disabled"
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Updating...' : 'Update Profile'}
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="settings-card">
                        <h2>Change Password</h2>
                        <form onSubmit={handleChangePassword}>
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Changing...' : 'Change Password'}
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'vehicle' && (
                    <div className="settings-card">
                        <h2>Vehicle Information</h2>
                        {vehicle ? (
                            <div className="vehicle-info">
                                <div className="info-row">
                                    <span className="label">Vehicle Number</span>
                                    <span className="value">{vehicle.vehicle_number}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Max Volume</span>
                                    <span className="value">{vehicle.max_volume_m3} m³</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Max Weight</span>
                                    <span className="value">{vehicle.max_weight_kg} kg</span>
                                </div>
                                {vehicle.zone && (
                                    <div className="info-row">
                                        <span className="label">Assigned Zone</span>
                                        <span className="value">{vehicle.zone.name}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="no-vehicle">No vehicle assigned</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
