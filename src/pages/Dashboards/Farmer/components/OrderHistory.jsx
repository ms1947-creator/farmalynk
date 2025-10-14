// farmer/components/OrderHistory.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../../../../firebaseconfig';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { FaHistory, FaSpinner, FaBox, FaTruck, FaCheckCircle, FaExclamationTriangle, FaHourglassHalf } from 'react-icons/fa'; 

function OrderHistory({ farmerId }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // State for filtering orders
    const [filter, setFilter] = useState('Current');

    // Real-time listener for order history
    useEffect(() => {
        if (!farmerId) return;

        const q = query(
            // FIX 1: Use the new collection name 'farmer-orders'
            collection(db, 'farmer-orders'), 
            
            // FIX 2: Assuming 'farmerId' is the field for the buyer's UID in this new collection.
            // If you encounter issues, change 'farmerId' to 'buyerId'.
            where('farmerId', '==', farmerId), 
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedOrders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                displayDate: doc.data().createdAt?.toDate().toLocaleString() || 'N/A'
            }));
            setOrders(fetchedOrders);
            setLoading(false);
            setError('');
        }, (err) => {
            console.error("Error fetching orders:", err);
            // Updated error message to reflect the new collection
            setError("Failed to load order history. Please check 'farmer-orders' security rules or field name ('farmerId' vs 'buyerId').");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [farmerId]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Delivered':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'Shipped':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'New':
            case 'Processing':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'Cancelled':
                return 'bg-red-100 text-red-800 border-red-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };
    
    const isActiveOrder = (status) => {
        const activeStatuses = ['New', 'Processing', 'Shipped'];
        return activeStatuses.includes(status);
    };

    const filteredOrders = orders.filter(order => {
        if (filter === 'Current') {
            return isActiveOrder(order.status);
        }
        if (filter === 'Previous') {
            return !isActiveOrder(order.status);
        }
        return true; 
    });

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg border-l-4 border-gray-500">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center border-b pb-3">
                <FaBox className="mr-3 text-2xl" /> Your Purchase History
            </h3>
            
            <div className="flex space-x-4 mb-6">
                <button 
                    onClick={() => setFilter('Current')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                        filter === 'Current' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    <FaHourglassHalf className="inline mr-2" /> Current Orders ({orders.filter(o => isActiveOrder(o.status)).length})
                </button>
                <button 
                    onClick={() => setFilter('Previous')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                        filter === 'Previous' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    <FaCheckCircle className="inline mr-2" /> Previous Orders ({orders.filter(o => !isActiveOrder(o.status)).length})
                </button>
            </div>
            
            {loading && <p className="text-center py-8 text-lg text-gray-500"><FaSpinner className="animate-spin inline mr-2" /> Loading orders...</p>}
            
            {!loading && filteredOrders.length === 0 && (
                <p className="text-gray-500 italic py-8 text-center">
                    {filter === 'Current' 
                        ? "You have no orders currently being processed or shipped."
                        : "No past (delivered/cancelled) orders found."
                    }
                </p>
            )}

            {error && <p className="p-3 mb-4 text-sm font-medium text-red-700 bg-red-100 rounded-lg flex items-center"><FaExclamationTriangle className="mr-2" />{error}</p>}
            
            <div className="space-y-6">
                {filteredOrders.map((order) => (
                    <div key={order.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                            <p className="font-extrabold text-xl text-gray-800">Total: ₹{order.totalAmount?.toFixed(2) || 'N/A'}</p>
                            <span className={`text-sm font-semibold px-4 py-1 rounded-full border ${getStatusStyle(order.status)}`}>
                                {order.status}
                            </span>
                        </div>
                        
                        <p className="text-sm text-gray-500 mt-2">Order placed on: {order.displayDate}</p>

                        <ul className="mt-3 space-y-2 text-sm">
                            {order.items?.map((item, index) => (
                                <li key={index} className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-100">
                                    <span className="font-medium">{item.name || `Product ${index + 1}`}</span>
                                    <span className="text-gray-600">Qty: {item.quantity} @ ₹{item.pricePerUnit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default OrderHistory;