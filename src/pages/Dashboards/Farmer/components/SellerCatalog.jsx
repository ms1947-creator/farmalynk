// farmer/components/SellerCatalog.jsx

import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../../firebaseconfig';
import { collection, query, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { FaShoppingCart, FaSearch, FaSpinner, FaPlus, FaMinus, FaStore } from 'react-icons/fa';

function SellerCatalog({ farmerId }) {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState({}); // {productId: quantity}
    const [loading, setLoading] = useState(true);
    const [isOrdering, setIsOrdering] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fetch Products (non-realtime read is usually sufficient for a large catalog)
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const q = query(collection(db, 'products'));
                const snapshot = await getDocs(q);
                const fetchedProducts = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setProducts(fetchedProducts);
            } catch (err) {
                setError('Failed to load products.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const updateCart = (productId, change) => {
        setCart(prev => {
            const newQty = (prev[productId] || 0) + change;
            if (newQty <= 0) {
                const newState = { ...prev };
                delete newState[productId];
                return newState;
            }
            return { ...prev, [productId]: newQty };
        });
    };

    const placeOrder = async () => {
        const cartItems = Object.keys(cart).map(id => ({ 
            productId: id, 
            quantity: cart[id],
            pricePerUnit: products.find(p => p.id === id)?.price || 0 
        }));

        if (cartItems.length === 0) {
            setError('Your cart is empty.');
            return;
        }

        setIsOrdering(true);
        setError('');
        setSuccess('');

        try {
            await addDoc(collection(db, 'orders'), {
                farmerId: farmerId,
                items: cartItems,
                totalAmount: cartItems.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0),
                status: 'New',
                createdAt: serverTimestamp(),
            });

            setSuccess('Order placed successfully! Check "My Order History" for status updates.');
            setCart({});
        } catch (err) {
            setError('Failed to place order. Please try again.');
            console.error(err);
        } finally {
            setIsOrdering(false);
        }
    };

    const totalCartItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

    return (
        <div className="grid grid-cols-4 gap-6">
            
            {/* Cart Summary */}
            <div className="col-span-1 p-6 bg-white rounded-xl shadow-lg border-l-4 border-blue-500 h-fit sticky top-0">
                <h3 className="text-2xl font-bold text-blue-700 mb-4 flex items-center">
                    <FaShoppingCart className="mr-2" /> Your Cart ({totalCartItems})
                </h3>
                
                {Object.keys(cart).length === 0 ? (
                    <p className="text-gray-500 italic">Add items to place an order.</p>
                ) : (
                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                        {Object.keys(cart).map(id => {
                            const product = products.find(p => p.id === id);
                            return (
                                <div key={id} className="border-b pb-2">
                                    <p className="font-semibold">{product?.name || 'Item'}</p>
                                    <p className="text-sm text-gray-600">Qty: {cart[id]}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
                
                {error && <p className="p-2 mb-2 text-sm text-red-700 bg-red-100 rounded-lg">{error}</p>}
                {success && <p className="p-2 mb-2 text-sm text-green-700 bg-green-100 rounded-lg">{success}</p>}

                <button 
                    onClick={placeOrder}
                    disabled={totalCartItems === 0 || isOrdering}
                    className="w-full mt-4 flex justify-center items-center px-4 py-3 text-base font-semibold rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition"
                >
                    {isOrdering ? <><FaSpinner className="animate-spin mr-2" /> Placing Order...</> : 'Place Order Now'}
                </button>
            </div>

            {/* Product List */}
            <div className="col-span-3">
                <h3 className="text-3xl font-bold text-gray-800 mb-6 flex items-center"><FaStore className="mr-3"/> Seller Product Catalogs</h3>
                
                {loading && <p className="text-center py-8 text-lg text-gray-500"><FaSpinner className="animate-spin inline mr-2" /> Loading products...</p>}
                
                <div className="grid grid-cols-3 gap-6">
                    {products.map(product => (
                        <div key={product.id} className="p-4 bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col">
                            <p className="text-xl font-bold text-gray-800 mb-1">{product.name}</p>
                            <p className="text-sm text-gray-500 italic mb-3">Seller: {product.sellerName || 'N/A'}</p>
                            
                            <p className="text-2xl font-extrabold text-green-700 mb-4">₹{product.price} <span className="text-sm font-normal text-gray-500">/{product.unit || 'unit'}</span></p>

                            <p className="text-sm text-gray-600 mb-4 flex-grow">{product.description || 'No description provided.'}</p>
                            
                            <div className="flex justify-between items-center border-t pt-3">
                                <div className="flex items-center space-x-2">
                                    <button 
                                        onClick={() => updateCart(product.id, -1)} 
                                        disabled={!cart[product.id]}
                                        className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 disabled:opacity-50 transition"
                                    >
                                        <FaMinus size={12} />
                                    </button>
                                    <span className="font-bold text-lg w-6 text-center">{cart[product.id] || 0}</span>
                                    <button 
                                        onClick={() => updateCart(product.id, 1)} 
                                        className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition"
                                    >
                                        <FaPlus size={12} />
                                    </button>
                                </div>
                                <span className="text-gray-500 text-sm">In Cart</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default SellerCatalog;