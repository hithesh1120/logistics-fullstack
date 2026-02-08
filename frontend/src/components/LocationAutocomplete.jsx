import { useState } from 'react';
import SearchInput from './SearchInput';
import PropTypes from 'prop-types';

/**
 * Location autocomplete with Indian states and cities
 * Features fuzzy search for locations
 */

// Indian states and major cities
const INDIAN_LOCATIONS = [
    // States
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    // Union Territories
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
    // Major Cities
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata',
    'Surat', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore',
    'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara',
    'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut',
    'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar', 'Varanasi', 'Srinagar',
    'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad',
    'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada',
    'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Chandigarh', 'Guwahati',
    'Solapur', 'Hubli-Dharwad', 'Mysore', 'Tiruchirappalli', 'Bareilly',
    'Aligarh', 'Tiruppur', 'Moradabad', 'Jalandhar', 'Bhubaneswar',
    'Salem', 'Warangal', 'Mira-Bhayandar', 'Thiruvananthapuram', 'Bhiwandi',
    'Saharanpur', 'Guntur', 'Amravati', 'Bikaner', 'Noida', 'Jamshedpur',
    'Bhilai', 'Cuttack', 'Firozabad', 'Kochi', 'Nellore', 'Bhavnagar',
    'Dehradun', 'Durgapur', 'Asansol', 'Rourkela', 'Nanded', 'Kolhapur',
    'Ajmer', 'Akola', 'Gulbarga', 'Jamnagar', 'Ujjain', 'Loni', 'Siliguri',
    'Jhansi', 'Ulhasnagar', 'Jammu', 'Sangli-Miraj & Kupwad', 'Mangalore',
    'Erode', 'Belgaum', 'Ambattur', 'Tirunelveli', 'Malegaon', 'Gaya',
    'Jalgaon', 'Udaipur', 'Maheshtala', 'Anantapur', 'Karimnagar'
];

export default function LocationAutocomplete({
    onLocationSelect,
    placeholder = 'Search for city or state...',
    initialValue = ''
}) {
    const [selectedLocation, setSelectedLocation] = useState(initialValue);

    const handleSearch = (query) => {
        // Update selected location and notify parent
        setSelectedLocation(query);
        if (onLocationSelect) {
            onLocationSelect(query);
        }
    };

    return (
        <SearchInput
            suggestions={INDIAN_LOCATIONS}
            onSearch={handleSearch}
            placeholder={placeholder}
            debounceMs={100}
            initialValue={initialValue}
            minChars={1}
            maxSuggestions={15}
        />
    );
}

LocationAutocomplete.propTypes = {
    onLocationSelect: PropTypes.func,
    placeholder: PropTypes.string,
    initialValue: PropTypes.string
};
