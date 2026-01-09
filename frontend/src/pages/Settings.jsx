import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
        Account Settings
      </h2>

      <div style={{
        background: '#fff',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <strong>Email:</strong>
          <div style={{ color: '#475569' }}>{user?.email}</div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <strong>Role:</strong>
          <div style={{ color: '#475569' }}>{user?.role}</div>
        </div>

        <button
          onClick={handleLogout}
          className="btn btn-primary"
          style={{ width: '100%', background: '#ef4444' }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
