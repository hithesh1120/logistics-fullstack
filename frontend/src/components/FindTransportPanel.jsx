import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import LocationAutocomplete from './LocationAutocomplete';
import './FindTransportPanel.css';

export default function FindTransportPanel({ onBook }) {
    const [searchCriteria, setSearchCriteria] = useState({
        from: '',
        to: '',
        weight: '',
        volume: ''
    });
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchCriteria.from || !searchCriteria.to) return;

        setSearching(true);
        setHasSearched(true);
        try {
            const payload = {
                from_location: searchCriteria.from,
                to_location: searchCriteria.to,
                required_weight_kg: parseFloat(searchCriteria.weight || 0),
                required_volume_m3: parseFloat(searchCriteria.volume || 0)
            }
            const res = await axios.post(`${API_BASE_URL}/trips/search`, payload);
            setSearchResults(res.data);
        } catch (err) {
            console.error("Search failed", err);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="find-transport-container fade-in">
            <div className="search-header">
                <h2 className="section-title">Find Available Transport</h2>
                <p className="section-subtitle">Search for scheduled trips matching your route and cargo requirements.</p>
            </div>

            <form onSubmit={handleSearch} className="search-form card">
                <div className="search-grid">
                    <div className="form-group">
                        <label className="form-label">From City</label>
                        <div className="input-wrapper">
                            <span className="input-icon">📍</span>
                            <LocationAutocomplete
                                placeholder="e.g. Bangalore"
                                onLocationSelect={(location) => setSearchCriteria({ ...searchCriteria, from: location })}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">To City</label>
                        <div className="input-wrapper">
                            <span className="input-icon">🏁</span>
                            <LocationAutocomplete
                                placeholder="e.g. Mumbai"
                                onLocationSelect={(location) => setSearchCriteria({ ...searchCriteria, to: location })}
                            />
                        </div>
                    </div>
                </div>
                <div className="search-grid">
                    <div className="form-group">
                        <label className="form-label">Min Weight (kg)</label>
                        <div className="input-wrapper">
                            <span className="input-icon">⚖️</span>
                            <input
                                type="number"
                                className="form-input with-icon"
                                placeholder="0"
                                value={searchCriteria.weight}
                                onChange={e => setSearchCriteria({ ...searchCriteria, weight: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Min Volume (m³)</label>
                        <div className="input-wrapper">
                            <span className="input-icon">📦</span>
                            <input
                                type="number"
                                className="form-input with-icon"
                                placeholder="0"
                                value={searchCriteria.volume}
                                onChange={e => setSearchCriteria({ ...searchCriteria, volume: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
                <button type="submit" disabled={searching} className="btn btn-primary search-btn">
                    {searching ? (
                        <>
                            <span className="spinner-small"></span> Searching...
                        </>
                    ) : (
                        <>
                            <span>🔍</span> Search Vehicles
                        </>
                    )}
                </button>
            </form>

            {hasSearched && (
                <div className="results-section slide-up">
                    <div className="results-header">
                        <h3 className="results-count">{searchResults.length} Vehicles Found</h3>
                    </div>

                    {searchResults.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🚚</div>
                            <p>No vehicles found matching your criteria.</p>
                            <span className="text-muted">Try adjusting your search filters.</span>
                        </div>
                    ) : (
                        <div className="results-list">
                            {searchResults.map(trip => (
                                <div key={trip.id} className="trip-card card-hover">
                                    <div className="trip-info">
                                        <div className="trip-route">
                                            <div className="route-point">
                                                <span className="route-city">{trip.source}</span>
                                            </div>
                                            <div className="route-arrow">
                                                <span className="arrow-line"></span>
                                                <span className="arrow-head">➝</span>
                                            </div>
                                            <div className="route-point">
                                                <span className="route-city">{trip.destination}</span>
                                            </div>
                                        </div>

                                        <div className="trip-details-grid">
                                            <div className="trip-detail-item">
                                                <span className="detail-label">Vehicle</span>
                                                <span className="detail-value">{trip.vehicle_number}</span>
                                            </div>
                                            <div className="trip-detail-item">
                                                <span className="detail-label">Departure</span>
                                                <span className="detail-value">{new Date(trip.start_time).toLocaleDateString()}</span>
                                            </div>
                                            <div className="trip-detail-item">
                                                <span className="detail-label">Available</span>
                                                <span className="detail-value highlight">{trip.available_weight_kg} kg</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="trip-action-column">
                                        <div className="trip-cost-block">
                                            <span className="cost-label">Est. Cost</span>
                                            <span className="trip-cost">₹{trip.cost_estimate || '0'}</span>
                                        </div>
                                        <button className="btn btn-primary book-btn" onClick={() => onBook(trip, searchCriteria)}>
                                            Book Space
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
