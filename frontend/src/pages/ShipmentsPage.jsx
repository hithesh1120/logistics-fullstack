import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import { useAuth } from '../context/AuthContext';

export default function ShipmentsPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/orders`);
                setOrders(res.data);
            } catch (err) {
                console.error("Failed to fetch orders", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    if (loading) return <div className="p-6">Loading shipments...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-2 text-slate-800">Welcome back, {user?.name || user?.email?.split('@')[0] || 'User'}!</h1>
            <p className="text-slate-500 mb-6">Track and manage your shipment requests</p>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-0">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-3">ID</th>
                            <th className="px-4 py-3">Item</th>
                            <th className="px-4 py-3">Route</th>
                            <th className="px-4 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                                    No shipments found.
                                </td>
                            </tr>
                        ) : orders.map(order => (
                            <tr key={order.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-sm font-medium text-slate-900">#{order.id}</td>
                                <td className="px-4 py-3 text-sm text-slate-700">{order.item_name}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                    <div><span className="text-green-600">●</span> {order.pickup_address?.split(',')[0]}</div>
                                    <div className="pl-1 border-l ml-[3px] h-2 border-slate-300"></div>
                                    <div><span className="text-red-500">●</span> {order.drop_address?.split(',')[0]}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'SHIPPED' ? 'bg-green-100 text-green-700' :
                                        order.status === 'ASSIGNED' ? 'bg-amber-100 text-amber-700' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                        {order.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
