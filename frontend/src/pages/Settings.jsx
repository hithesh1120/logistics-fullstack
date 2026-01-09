import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Settings.css';

export default function Settings() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // User Settings
  const [userForm, setUserForm] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Company Settings (MSME only)
  const [companyForm, setCompanyForm] = useState({
    name: '',
    gst_number: '',
    address: ''
  });

  useEffect(() => {
    if (user) {
      setUserForm(prev => ({ ...prev, email: user.email }));
      if (user.company) {
        setCompanyForm({
          name: user.company.name,
          gst_number: user.company.gst_number,
          address: user.company.address
        });
      }
    }
  }, [user]);

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (userForm.newPassword && userForm.newPassword !== userForm.confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: userForm.email !== user.email ? userForm.email : undefined,
        current_password: userForm.currentPassword || undefined,
        new_password: userForm.newPassword || undefined
      };

      // Remove undefined fields
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      if (Object.keys(payload).length === 0) {
        setError("No changes to save");
        setLoading(false);
        return;
      }

      await axios.put('http://localhost:8000/settings/user', payload);
      setMessage("User settings updated successfully!");
      
      // Clear password fields
      setUserForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      // Reload user data
      const res = await axios.get('http://localhost:8000/users/me');
      // Update context if needed or reload page
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update user settings");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      await axios.put('http://localhost:8000/settings/company', companyForm);
      setMessage("Company settings updated successfully!");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update company settings");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>Settings</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Manage your account and preferences
      </p>

      {message && (
        <div style={{
          padding: '1rem',
          background: '#dcfce7',
          color: '#166534',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          border: '1px solid #bbf7d0'
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          padding: '1rem',
          background: '#fee2e2',
          color: '#b91c1c',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          border: '1px solid #fecaca'
        }}>
          {error}
        </div>
      )}

      {/* Account Settings */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          Account Settings
        </h2>

        <form onSubmit={handleUpdateUser}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            />
          </div>

          <div style={{ 
            background: 'var(--background)', 
            padding: '1rem', 
            borderRadius: '0.5rem',
            marginBottom: '1rem'
          }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem' }}>
              Change Password
            </h3>

            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter current password"
                value={userForm.currentPassword}
                onChange={(e) => setUserForm({ ...userForm, currentPassword: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="New password"
                  value={userForm.newPassword}
                  onChange={(e) => setUserForm({ ...userForm, newPassword: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Confirm password"
                  value={userForm.confirmPassword}
                  onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {loading ? 'Saving...' : 'Save Account Changes'}
          </button>
        </form>
      </div>

      {/* Company Settings (MSME Only) */}
      {user?.role === 'MSME' && user?.company && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            Company Information
          </h2>

          <form onSubmit={handleUpdateCompany}>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                className="form-input"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">GST Number</label>
              <input
                type="text"
                className="form-input"
                value={companyForm.gst_number}
                onChange={(e) => setCompanyForm({ ...companyForm, gst_number: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Registered Address</label>
              <textarea
                className="form-input"
                rows="3"
                value={companyForm.address}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {loading ? 'Saving...' : 'Save Company Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Danger Zone */}
      <div className="card" style={{ borderColor: '#fecaca' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--danger)' }}>
          Danger Zone
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          Log out of your account. You'll need to sign in again to access your dashboard.
        </p>
        <button
          onClick={handleLogout}
          className="btn"
          style={{
            width: '100%',
            background: 'var(--danger)',
            color: 'white',
            border: 'none'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}