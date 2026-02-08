import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import '../pages/SettingsPage.css';

export default function AdminSettings() {
    const { user, logout, token, setUser } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Profile form
    const [name, setName] = useState(user?.name || '');
    const [isEditingName, setIsEditingName] = useState(false);

    // Password form
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // System stats
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalOrders: 0,
        totalVehicles: 0,
        totalZones: 0
    });

    useEffect(() => {
        if (user?.name) setName(user.name);
        fetchSystemStats();
    }, [user]);

    const fetchSystemStats = async () => {
        try {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            // Fetch stats from various endpoints
            const [usersRes, ordersRes, vehiclesRes, zonesRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/users`).catch(() => ({ data: [] })),
                axios.get(`${API_BASE_URL}/orders`).catch(() => ({ data: [] })),
                axios.get(`${API_BASE_URL}/vehicles`).catch(() => ({ data: [] })),
                axios.get(`${API_BASE_URL}/zones`).catch(() => ({ data: [] }))
            ]);

            setStats({
                totalUsers: usersRes.data.length || 0,
                totalOrders: ordersRes.data.length || 0,
                totalVehicles: vehiclesRes.data.length || 0,
                totalZones: zonesRes.data.length || 0
            });
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    const handleUpdateName = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const res = await axios.patch(`${API_BASE_URL}/users/me`, { name });
            setUser(res.data);
            setMessage({ text: '✓ Name updated successfully!', type: 'success' });
            setIsEditingName(false);
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (err) {
            console.error('Update name error:', err);
            setMessage({ text: '✗ Failed to update name. Please try again.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        if (newPassword !== confirmPassword) {
            setMessage({ text: '✗ Passwords do not match', type: 'error' });
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ text: '✗ Password must be at least 6 characters', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            await axios.patch(`${API_BASE_URL}/users/me`, { password: newPassword });
            setMessage({ text: '✓ Password changed successfully!', type: 'success' });
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (err) {
            console.error('Change password error:', err);
            setMessage({ text: '✗ Failed to change password. Please try again.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-page">
            <div className="settings-header">
                <h1>Admin Settings</h1>
                <p>Manage your administrator account and system preferences</p>
            </div>

            <div className="settings-container">
                <div className="settings-tabs">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
                    >
                        👤 Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
                    >
                        🔒 Security
                    </button>
                    <button
                        onClick={() => setActiveTab('system')}
                        className={`settings-tab ${activeTab === 'system' ? 'active' : ''}`}
                    >
                        📊 System
                    </button>
                </div>

                <div className="settings-content">
                    {message.text && (
                        <div className={`settings-message settings-message-${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="settings-section">
                            <h2 className="settings-section-title">Administrator Profile</h2>

                            {/* Full Name */}
                            <div className="settings-field">
                                <label className="settings-field-label">Full Name</label>
                                {isEditingName ? (
                                    <form onSubmit={handleUpdateName} className="settings-field-edit-group">
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="settings-input"
                                            placeholder="Enter your full name"
                                            required
                                            autoFocus
                                        />
                                        <button type="submit" className="settings-btn settings-btn-primary" disabled={loading}>
                                            {loading ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditingName(false);
                                                setName(user?.name || '');
                                                setMessage({ text: '', type: '' });
                                            }}
                                            className="settings-btn settings-btn-secondary"
                                        >
                                            Cancel
                                        </button>
                                    </form>
                                ) : (
                                    <div className="settings-field-value">
                                        <span>{user?.name || 'Not set'}</span>
                                        <button
                                            onClick={() => setIsEditingName(true)}
                                            className="settings-btn settings-btn-edit"
                                        >
                                            ✏️ Edit
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Email Address */}
                            <div className="settings-field">
                                <label className="settings-field-label">Email Address</label>
                                <div className="settings-field-value">
                                    <span>{user?.email}</span>
                                    <span className="settings-badge">Admin</span>
                                </div>
                            </div>

                            {/* Role */}
                            <div className="settings-field">
                                <label className="settings-field-label">Role</label>
                                <div className="settings-field-value">
                                    <span>Administrator</span>
                                    <span className="settings-badge">Super Admin</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="settings-section">
                            <h2 className="settings-section-title">Security Settings</h2>

                            <form onSubmit={handleChangePassword} className="settings-form">
                                <div className="settings-form-group">
                                    <label className="settings-field-label">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="settings-input"
                                        placeholder="Enter new password (min 6 characters)"
                                        required
                                    />
                                </div>

                                <div className="settings-form-group">
                                    <label className="settings-field-label">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="settings-input"
                                        placeholder="Confirm new password"
                                        required
                                    />
                                </div>

                                <button type="submit" className="settings-btn settings-btn-primary" disabled={loading}>
                                    {loading ? 'Changing Password...' : '🔐 Change Password'}
                                </button>
                            </form>

                            <div className="settings-danger-zone">
                                <h3 className="settings-danger-zone-title">⚠️ Danger Zone</h3>
                                <p style={{ color: '#991b1b', fontSize: '0.875rem', marginBottom: '1rem' }}>
                                    Logging out will end your current session on all devices.
                                </p>
                                <button onClick={logout} className="settings-btn settings-btn-danger">
                                    🚪 Log Out of All Sessions
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="settings-section">
                            <h2 className="settings-section-title">System Overview</h2>

                            <div className="settings-info-grid">
                                <div className="settings-info-card">
                                    <div className="settings-info-card-label">👥 Total Users</div>
                                    <div className="settings-info-card-value">{stats.totalUsers}</div>
                                </div>
                                <div className="settings-info-card">
                                    <div className="settings-info-card-label">📦 Total Orders</div>
                                    <div className="settings-info-card-value">{stats.totalOrders}</div>
                                </div>
                                <div className="settings-info-card">
                                    <div className="settings-info-card-label">🚚 Total Vehicles</div>
                                    <div className="settings-info-card-value">{stats.totalVehicles}</div>
                                </div>
                                <div className="settings-info-card">
                                    <div className="settings-info-card-label">🗺️ Total Zones</div>
                                    <div className="settings-info-card-value">{stats.totalZones}</div>
                                </div>
                            </div>

                            <hr className="settings-divider" />

                            <h3 className="settings-section-title">System Information</h3>
                            <div className="settings-info-grid">
                                <div className="settings-info-card">
                                    <div className="settings-info-card-label">Platform</div>
                                    <div className="settings-info-card-value">LogiSoft v1.0</div>
                                </div>
                                <div className="settings-info-card">
                                    <div className="settings-info-card-label">Environment</div>
                                    <div className="settings-info-card-value">Production</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
