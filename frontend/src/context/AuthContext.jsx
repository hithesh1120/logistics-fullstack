import axios from 'axios';
import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../apiConfig';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      axios.get(`${API_BASE_URL}/users/me`)
        .then(res => {
          setUser(res.data);
          localStorage.setItem('role', res.data.role);
        })
        .catch(err => {
          // Silently clear invalid token - don't show error on login page
          console.log("Token validation failed, clearing...");
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          setToken(null);
          setUser(null);
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);

      const res = await axios.post(`${API_BASE_URL}/token`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      const { access_token } = res.data;

      localStorage.setItem('token', access_token);
      // We need to decode token or fetch user to get role. 
      // For simplicity, let's assume we decode or backend returns it.
      // But backend only returns token. Let's fetch /users/me
      setToken(access_token);

      // Fetch user role immediately
      const userRes = await axios.get(`${API_BASE_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });

      const userData = userRes.data;
      localStorage.setItem('role', userData.role);
      setUser(userData);
      return userData.role; // Return role for redirect logic
    } catch (err) {
      console.error("Login failed", err);
      throw err;
    }
  };


  const signupMSME = async (data) => {
    try {
      // Backend expects flat payload with all fields
      const payload = {
        email: data.email,
        password: data.password,
        name: data.name,
        company_name: data.company_name,
        gst_number: data.gst_number,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude
      };
      await axios.post(`${API_BASE_URL}/signup/msme`, payload);
      return true;
    } catch (err) {
      console.error("Signup failed", err);
      throw err;
    }
  };

  const signupDriver = async (data) => {
    try {
      // Backend expects nested user_details and vehicle_details
      const payload = {
        user_details: {
          email: data.email,
          password: data.password
        },
        vehicle_details: {
          vehicle_number: data.vehicle_number,
          max_volume_m3: parseFloat(data.max_volume_m3),
          max_weight_kg: parseFloat(data.max_weight_kg),
          zone_id: data.zone_id ? parseInt(data.zone_id) : null
        }
      };
      await axios.post(`${API_BASE_URL}/signup/driver`, payload);
      return true;
    } catch (err) {
      console.error("Driver Signup failed", err);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signupMSME, signupDriver, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
