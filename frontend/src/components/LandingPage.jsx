import { Link } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
    return (
        <div className="landing-page">
            {/* Header */}
            <header className="landing-header">
                <div className="header-container">
                    <div className="logo-section">
                        <div className="logo-icon">L</div>
                        <span>LogiSoft</span>
                    </div>
                    <nav className="nav-links">
                        <a href="#features">Features</a>
                        <a href="#how-it-works">How it Works</a>
                        <a href="#roles">For Drivers</a>
                    </nav>
                    <div className="auth-buttons">
                        <Link to="/login" className="btn-login">Log In</Link>
                        <Link to="/signup" className="btn-get-started">
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Smart Logistics for <br />
                        <span className="hero-gradient-text">Modern Businesses</span>
                    </h1>
                    <p className="hero-description">
                        Connect with a network of verified vehicles. Book space on scheduled trips just like booking a train ticket. Real-time tracking and optimized routing for MSMEs.
                    </p>
                    <div className="hero-actions">
                        <Link to="/signup" className="btn-hero-primary">
                            Start Shipping Now
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* How it Works Section */}
            <section id="how-it-works" className="py-24 bg-slate-50" style={{ padding: '6rem 0', backgroundColor: '#f8fafc' }}>
                <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#0f172a', marginBottom: '1rem' }}>How It Works</h2>
                        <p style={{ color: '#64748b', maxWidth: '42rem', margin: '0 auto' }}>Simple, transparent, and efficient logistics management.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: '4rem', height: '4rem', background: '#e0e7ff', color: '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', margin: '0 auto 1.5rem' }}>1</div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Admin Schedules Trips</h3>
                            <p style={{ color: '#64748b' }}>Logistics managers plan routes and schedule vehicle trips with available capacity.</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: '4rem', height: '4rem', background: '#dcfce7', color: '#059669', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', margin: '0 auto 1.5rem' }}>2</div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>MSME Books Space</h3>
                            <p style={{ color: '#64748b' }}>Businesses search for trips and book space for their goods based on weight and volume.</p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: '4rem', height: '4rem', background: '#ede9fe', color: '#7c3aed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', margin: '0 auto 1.5rem' }}>3</div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Driver Delivers</h3>
                            <p style={{ color: '#64748b' }}>Drivers accept orders, follow the route, and update status in real-time until delivery.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="features-section">
                <div className="features-grid">
                    {/* Feature 1 */}
                    <div className="feature-card">
                        <div className="feature-icon icon-blue">
                            🚚
                        </div>
                        <h3 className="feature-title">Scheduled Trips</h3>
                        <p className="feature-desc">
                            Browse scheduled trips between cities. Book space based on your load's weight and volume.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="feature-card">
                        <div className="feature-icon icon-green">
                            📍
                        </div>
                        <h3 className="feature-title">Live Tracking</h3>
                        <p className="feature-desc">
                            Monitor your shipments in real-time. Get status updates from drivers as they reach milestones.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="feature-card">
                        <div className="feature-icon icon-purple">
                            🤝
                        </div>
                        <h3 className="feature-title">MSME Friendly</h3>
                        <p className="feature-desc">
                            Designed for small businesses. Cost-effective shared logistics with transparent pricing.
                        </p>
                    </div>
                </div>
            </section>

            {/* Roles Section */}
            <section id="roles" className="roles-section">
                <div className="roles-container">
                    <div className="roles-header">
                        <h2 className="roles-title">Built for Everyone</h2>
                        <p className="roles-subtitle">Whether you're shipping goods or driving a vehicle, we have tools for you.</p>
                    </div>

                    <div className="roles-grid">
                        <div className="role-card">
                            <h3 className="role-card-title">For Businesses (MSMEs)</h3>
                            <p className="role-card-desc">Book space, track shipments, and manage your supply chain effortlessly.</p>
                            <Link to="/signup" className="role-link link-business">
                                Register Business &rarr;
                            </Link>
                        </div>
                        <div className="role-card">
                            <h3 className="role-card-title">For Drivers</h3>
                            <p className="role-card-desc">Maximize your vehicle utilization. Accept orders and navigate optimized routes.</p>
                            <Link to="/driver-signup" className="role-link link-driver">
                                Join as Driver &rarr;
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container" style={{ margin: '0 auto' }}>
                    <p>&copy; 2026 LogiSoft Platforms. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
