import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './SearchInput.css';

/**
 * Reusable search input with fuzzy matching and autocomplete
 * Features:
 * - Fuzzy matching: "An" matches "Andhra Pradesh", "Anantapur"
 * - Case insensitive search
 * - Debounced input (300ms delay)
 * - Autocomplete dropdown with suggestions
 * - Highlighted matching characters
 */
export default function SearchInput({
    suggestions = [],
    onSearch,
    placeholder = 'Search...',
    debounceMs = 300,
    minChars = 1,
    maxSuggestions = 10,
    initialValue = ''
}) {
    const [query, setQuery] = useState(initialValue);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const debounceTimer = useRef(null);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Fuzzy match function
    const fuzzyMatch = (text, query) => {
        if (!query) return true;

        const textLower = text.toLowerCase();
        const queryLower = query.toLowerCase();

        // Simple fuzzy matching: check if all query characters appear in order
        let queryIndex = 0;
        for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
            if (textLower[i] === queryLower[queryIndex]) {
                queryIndex++;
            }
        }

        return queryIndex === queryLower.length;
    };

    // Highlight matching characters
    const highlightMatch = (text, query) => {
        if (!query) return text;

        const textLower = text.toLowerCase();
        const queryLower = query.toLowerCase();
        const result = [];
        let queryIndex = 0;

        for (let i = 0; i < text.length; i++) {
            if (queryIndex < queryLower.length && textLower[i] === queryLower[queryIndex]) {
                result.push(<strong key={i}>{text[i]}</strong>);
                queryIndex++;
            } else {
                result.push(<span key={i}>{text[i]}</span>);
            }
        }

        return result;
    };

    // Handle input change with debouncing
    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        setSelectedIndex(-1);

        // Clear previous timer
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        // Set new timer
        debounceTimer.current = setTimeout(() => {
            if (value.length >= minChars) {
                const filtered = suggestions
                    .filter(item => fuzzyMatch(item, value))
                    .slice(0, maxSuggestions);

                setFilteredSuggestions(filtered);
                setShowSuggestions(filtered.length > 0);

                // Call onSearch callback
                if (onSearch) {
                    onSearch(value);
                }
            } else {
                setFilteredSuggestions([]);
                setShowSuggestions(false);
                if (onSearch) {
                    onSearch('');
                }
            }
        }, debounceMs);
    };

    // Handle suggestion click
    const handleSuggestionClick = (suggestion) => {
        setQuery(suggestion);
        setShowSuggestions(false);
        if (onSearch) {
            onSearch(suggestion);
        }
        inputRef.current?.focus();
    };

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (!showSuggestions) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < filteredSuggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    handleSuggestionClick(filteredSuggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setSelectedIndex(-1);
                break;
            default:
                break;
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target) &&
                !inputRef.current?.contains(e.target)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);

    return (
        <div className="search-input-container">
            <div className="search-input-wrapper">
                <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    className="search-input"
                    placeholder={placeholder}
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query.length >= minChars && filteredSuggestions.length > 0 && setShowSuggestions(true)}
                />
                {query && (
                    <button
                        className="search-clear"
                        onClick={() => {
                            setQuery('');
                            setFilteredSuggestions([]);
                            setShowSuggestions(false);
                            if (onSearch) onSearch('');
                            inputRef.current?.focus();
                        }}
                    >
                        ×
                    </button>
                )}
            </div>

            {showSuggestions && filteredSuggestions.length > 0 && (
                <div ref={dropdownRef} className="search-suggestions">
                    {filteredSuggestions.map((suggestion, index) => (
                        <div
                            key={index}
                            className={`search-suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                            onClick={() => handleSuggestionClick(suggestion)}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            {highlightMatch(suggestion, query)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

SearchInput.propTypes = {
    suggestions: PropTypes.arrayOf(PropTypes.string),
    onSearch: PropTypes.func,
    placeholder: PropTypes.string,
    debounceMs: PropTypes.number,
    minChars: PropTypes.number,
    maxSuggestions: PropTypes.number
};
