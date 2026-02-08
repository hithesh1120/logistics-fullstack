import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
// import './DriverSignup.css'; // We'll use inline styles or existing auth styles for now to keep it simple and consistent

export default function DriverSignup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone_number: '',
        license_number: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            await axios.post(`${API_BASE_URL}/signup/driver`, {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone_number: formData.phone_number,
                license_number: formData.license_number
            });

            // On success, redirect to login with a success message (could be passed via state)
            alert("Registration successful! Please wait for admin approval before logging in.");
            navigate('/');
        } catch (err) {
            console.error("Signup error", err);
            setError(err.response?.data?.detail || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            padding: '2rem'
        }}>
            <div style={{
                background: 'white',
                padding: '2.5rem',
                borderRadius: '1rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                width: '100%',
                maxWidth: '500px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>Driver Registration</h1>
                    <p style={{ color: '#64748b' }}>Join our fleet and start delivering</p>
                </div>

                {error && (
                    <div style={{
                        background: '#fef2f2',
                        color: '#ef4444',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#334155', marginBottom: '0.25rem' }}>Full Name</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #cbd5e1',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#334155', marginBottom: '0.25rem' }}>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #cbd5e1',
                                fontSize: '1rem'
                            }}
                            placeholder="john@example.com"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#334155', marginBottom: '0.25rem' }}>Phone Number</label>
                            <input
                                type="tel"
                                name="phone_number"
                                required
                                value={formData.phone_number}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '1rem'
                                }}
                                placeholder="+91 98765 43210"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#334155', marginBottom: '0.25rem' }}>License Number</label>
                            <input
                                type="text"
                                name="license_number"
                                required
                                value={formData.license_number}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '1rem'
                                }}
                                placeholder="DL-123456789"
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#334155', marginBottom: '0.25rem' }}>Password</label>
                        <input
                            type="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #cbd5e1',
                                fontSize: '1rem'
                            }}
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#334155', marginBottom: '0.25rem' }}>Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #cbd5e1',
                                fontSize: '1rem'
                            }}
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: '#2563eb',
                            color: 'white',
                            padding: '0.875rem',
                            borderRadius: '0.5rem',
                            fontWeight: '600',
                            fontSize: '1rem',
                            border: 'none',
                            cursor: 'pointer',
                            marginTop: '0.5rem',
                            transition: 'background 0.2s'
                        }}
                    >
                        {loading ? 'Submitting Application...' : 'Submit Application'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
                    Already have an account? <Link to="/" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>Sign in here</Link>
                </div>
            </div>
        </div>
    );
}
