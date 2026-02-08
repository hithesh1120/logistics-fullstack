import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
// import './UserManagement.css'; // Inline styles for now

export default function UserManagement() {
    const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'directory', 'create'
    const [users, setUsers] = useState([]);
    const [pendingDrivers, setPendingDrivers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterRole, setFilterRole] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });

    // Fetch Data
    const fetchPendingDrivers = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/pending-drivers`);
            setPendingDrivers(res.data);
        } catch (err) {
            console.error("Failed to fetch pending drivers", err);
        }
    };

    const fetchAllUsers = async () => {
        setLoading(true);
        try {
            let url = `${API_BASE_URL}/admin/users`;
            if (filterRole) url += `?role=${filterRole}`;
            const res = await axios.get(url);
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'pending') fetchPendingDrivers();
        if (activeTab === 'directory') fetchAllUsers();
    }, [activeTab, filterRole]);

    // Handlers
    const handleApprove = async (id) => {
        try {
            await axios.post(`${API_BASE_URL}/admin/drivers/${id}/approve`);
            setMessage({ text: 'Driver approved successfully', type: 'success' });
            fetchPendingDrivers();
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (err) {
            setMessage({ text: 'Failed to approve driver', type: 'error' });
        }
    };

    const handleReject = async (id) => {
        if (!confirm('Are you sure you want to reject this application?')) return;
        try {
            await axios.post(`${API_BASE_URL}/admin/drivers/${id}/reject`);
            setMessage({ text: 'Driver application rejected', type: 'info' });
            fetchPendingDrivers();
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (err) {
            setMessage({ text: 'Failed to reject driver', type: 'error' });
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await axios.patch(`${API_BASE_URL}/admin/users/${id}`, { status });
            fetchAllUsers();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    return (
        <div className="user-management">
            {/* Header Tabs */}
            <div className="tabs" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                <button
                    className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                    style={{ padding: '0.75rem 1rem', borderBottom: activeTab === 'pending' ? '2px solid var(--primary)' : 'none', fontWeight: '500', color: activeTab === 'pending' ? 'var(--primary)' : 'var(--text-muted)' }}
                >
                    Pending Approvals ({pendingDrivers.length})
                </button>
                <button
                    className={`tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
                    onClick={() => setActiveTab('directory')}
                    style={{ padding: '0.75rem 1rem', borderBottom: activeTab === 'directory' ? '2px solid var(--primary)' : 'none', fontWeight: '500', color: activeTab === 'directory' ? 'var(--primary)' : 'var(--text-muted)' }}
                >
                    User Directory
                </button>
                <button
                    className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
                    onClick={() => setActiveTab('create')}
                    style={{ padding: '0.75rem 1rem', borderBottom: activeTab === 'create' ? '2px solid var(--primary)' : 'none', fontWeight: '500', color: activeTab === 'create' ? 'var(--primary)' : 'var(--text-muted)' }}
                >
                    Create New User
                </button>
            </div>

            {/* Message Alert */}
            {message.text && (
                <div style={{
                    padding: '1rem', marginBottom: '1.5rem', borderRadius: '0.5rem',
                    background: message.type === 'success' ? '#dcfce7' : message.type === 'error' ? '#fee2e2' : '#e0f2fe',
                    color: message.type === 'success' ? '#166534' : message.type === 'error' ? '#991b1b' : '#075985'
                }}>
                    {message.text}
                </div>
            )}

            {/* TAB: PENDING APPROVALS */}
            {activeTab === 'pending' && (
                <div className="pending-list">
                    {pendingDrivers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: '#f8fafc', borderRadius: '0.5rem' }}>
                            No pending driver applications.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {pendingDrivers.map(driver => (
                                <div key={driver.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>{driver.name}</h3>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{driver.email}</div>
                                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                                            <span style={{ background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>📱 {driver.phone_number || 'N/A'}</span>
                                            <span style={{ background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>🪪 {driver.license_number || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button
                                            onClick={() => handleReject(driver.id)}
                                            className="btn"
                                            style={{ color: '#ef4444', border: '1px solid #ef4444', background: 'white' }}
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleApprove(driver.id)}
                                            className="btn btn-primary"
                                            style={{ background: '#22c55e', borderColor: '#22c55e' }}
                                        >
                                            Approve Driver
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: USER DIRECTORY */}
            {activeTab === 'directory' && (
                <div>
                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="form-input"
                            style={{ maxWidth: '200px' }}
                        >
                            <option value="">All Roles</option>
                            <option value="DRIVER">Drivers</option>
                            <option value="MSME">MSME Users</option>
                            <option value="SUPER_ADMIN">Admins</option>
                        </select>
                    </div>

                    <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>User</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Role</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Details</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '500' }}>{user.name}</div>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{user.email}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span className={`badge badge-${user.role.toLowerCase().replace('_', '-')}`} style={{
                                                padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600',
                                                background: user.role === 'SUPER_ADMIN' ? '#e0e7ff' : user.role === 'DRIVER' ? '#dcfce7' : '#ffedd5',
                                                color: user.role === 'SUPER_ADMIN' ? '#4338ca' : user.role === 'DRIVER' ? '#15803d' : '#9a3412'
                                            }}>
                                                {user.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                color: user.status === 'APPROVED' ? '#16a34a' : user.status === 'PENDING' ? '#d97706' : '#dc2626',
                                                fontWeight: '500', fontSize: '0.875rem'
                                            }}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                            {user.role === 'DRIVER' && (
                                                <div>
                                                    Lic: {user.license_number || 'N/A'}<br />
                                                    Ph: {user.phone_number || 'N/A'}
                                                </div>
                                            )}
                                            {user.role === 'MSME' && user.company && (
                                                <div>
                                                    {user.company.name}<br />
                                                    GST: {user.company.gst_number}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            {user.role !== 'SUPER_ADMIN' && (
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                    {user.status === 'APPROVED' ? (
                                                        <button
                                                            onClick={() => handleStatusUpdate(user.id, 'SUSPENDED')}
                                                            className="btn-sm"
                                                            style={{ color: '#dc2626', border: '1px solid #fee2e2', background: '#fff' }}
                                                        >
                                                            Suspend
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleStatusUpdate(user.id, 'APPROVED')}
                                                            className="btn-sm"
                                                            style={{ color: '#16a34a', border: '1px solid #dcfce7', background: '#fff' }}
                                                        >
                                                            Activate
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB: CREATE USER */}
            {activeTab === 'create' && (
                <CreateUserForm onSuccess={() => {
                    setMessage({ text: 'User created successfully', type: 'success' });
                    setActiveTab('directory');
                }} />
            )}
        </div>
    );
}

function CreateUserForm({ onSuccess }) {
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'DRIVER',
        phone_number: '',
        license_number: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/admin/users`, form);
            onSuccess();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Create New User</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                    <label className="form-label">Role</label>
                    <select
                        className="form-input"
                        value={form.role}
                        onChange={e => setForm({ ...form, role: e.target.value })}
                    >
                        <option value="DRIVER">Driver</option>
                        <option value="SUPER_ADMIN">Administrator</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                        required
                        className="form-input"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                        required
                        type="email"
                        className="form-input"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                        required
                        type="password"
                        className="form-input"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                    />
                </div>

                {form.role === 'DRIVER' && (
                    <>
                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input
                                required
                                className="form-input"
                                value={form.phone_number}
                                onChange={e => setForm({ ...form, phone_number: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">License Number</label>
                            <input
                                required
                                className="form-input"
                                value={form.license_number}
                                onChange={e => setForm({ ...form, license_number: e.target.value })}
                            />
                        </div>
                    </>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '1rem' }}
                >
                    {loading ? 'Creating...' : 'Create User'}
                </button>
            </form>
        </div>
    );
}
