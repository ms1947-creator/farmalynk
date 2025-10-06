import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, setDoc, addDoc, orderBy } from "firebase/firestore";
import { db, auth } from "../../../firebaseconfig";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

// Farmer Modal Component
function FarmerModal({ farmer, onClose }) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  const submitReview = async () => {
    if (!farmer) return;
    const reviewRef = collection(db, "farmers", farmer.id, "reviews");
    await addDoc(reviewRef, { rating, review, createdAt: new Date() });
    setReview("");
    setRating(0);
    onClose();
    alert("Review submitted!");
  };

  if (!farmer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-white p-6 rounded-lg max-w-md w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{farmer.name}</h2>
          <button onClick={onClose} className="text-red-500 font-bold">X</button>
        </div>
        <p>Age: {farmer.age}</p>
        <p>Location: {farmer.location}</p>
        <p>Crops: {farmer.crops.join(", ")}</p>
        <p className="my-2 italic">{farmer.story}</p>

        <div className="my-4">
          <label>Rating:</label>
          <input 
            type="number" min="1" max="5" 
            value={rating} 
            onChange={e => setRating(parseInt(e.target.value))} 
            className="border px-2 py-1 rounded w-full"
          />
        </div>
        <div className="my-4">
          <label>Review:</label>
          <textarea 
            value={review} 
            onChange={e => setReview(e.target.value)} 
            className="border px-2 py-1 rounded w-full"
          />
        </div>

        <button onClick={submitReview} className="bg-green-600 text-white px-4 py-2 rounded w-full">
          Submit
        </button>
      </motion.div>
    </div>
  );
}

export default function CustomerDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ organic: false, limitedFertilizer: false, diabeticFriendly: false });
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("products");

  // Profile fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);

  // Toast
  const [toast, setToast] = useState(null); // { message: "", type: "success" }

  // Auth listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch profile from Firestore
  useEffect(() => {
    if (!currentUser) return;
    const userRef = doc(db, "customers", currentUser.uid);
    const unsubscribe = onSnapshot(userRef, docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setName(data.name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Fetch products
  useEffect(() => {
    const productsRef = collection(db, "customer-products");
    const q = query(productsRef, where("visibleTo", "array-contains", "Customer"));

    const unsubscribe = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
      setFilteredProducts(data);
    });

    return () => unsubscribe();
  }, []);

  // Fetch orders
  useEffect(() => {
    if (!currentUser) return;
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("customerId", "==", currentUser.uid), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, snapshot => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Filters
  useEffect(() => {
    let filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (filters.organic) filtered = filtered.filter(p => p.badges?.includes("Organic"));
    if (filters.limitedFertilizer) filtered = filtered.filter(p => p.badges?.includes("Limited Fertilizer"));
    if (filters.diabeticFriendly) filtered = filtered.filter(p => p.badges?.includes("Diabetic-friendly"));
    setFilteredProducts(filtered);
  }, [search, filters, products]);

  // Cart
  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1, units: "kg" }]);
    }
  };

  const updateQuantity = (productId, qty) => {
    setCart(cart.map(item => item.id === productId ? { ...item, quantity: qty } : item));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const checkout = async () => {
    if (!currentUser || cart.length === 0) return;
    const ordersRef = collection(db, "orders");
    await addDoc(ordersRef, {
      customerId: currentUser.uid,
      items: cart,
      status: "Placed",
      createdAt: new Date()
    });
    setCart([]);
    setToast({ message: "Order placed successfully!", type: "success" });
    setTimeout(() => setToast(null), 3000);
  };

  // Meet Farmer
  const meetFarmer = (farmerId) => {
    const farmerRef = doc(db, "farmers", farmerId);
    onSnapshot(farmerRef, docSnap => {
      if (docSnap.exists()) setSelectedFarmer({ id: docSnap.id, ...docSnap.data() });
    });
  };

  // Save profile
  const saveProfile = async () => {
    if (!currentUser) return;
    const userRef = doc(db, "customers", currentUser.uid);
    await setDoc(userRef, { name, email, phone }, { merge: true });

    setCurrentUser(prev => ({
      ...prev,
      displayName: name,
    }));

    setEditingProfile(false);
    setToast({ message: "Profile saved successfully!", type: "success" });
    setTimeout(() => setToast(null), 3000);
  };

  // Logout
  const logout = async () => {
    await auth.signOut();
    setCurrentUser(null);
  };

  if (!currentUser) return <p className="p-4">Loading user...</p>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar user={{ displayName: name, email }} onLogout={logout} />
      <div className="flex-1 p-4">
        <h2 className="text-2xl font-bold mb-4">Welcome, {name || currentUser.email}!</h2>

        <div className="flex gap-4 mb-4 flex-wrap">
          <button onClick={() => setActiveTab("products")} className={`px-4 py-2 rounded ${activeTab==="products"?"bg-green-600 text-white":"bg-white"}`}>Products</button>
          <button onClick={() => setActiveTab("cart")} className={`px-4 py-2 rounded ${activeTab==="cart"?"bg-green-600 text-white":"bg-white"}`}>Cart ({cart.length})</button>
          <button onClick={() => setActiveTab("orders")} className={`px-4 py-2 rounded ${activeTab==="orders"?"bg-green-600 text-white":"bg-white"}`}>Orders</button>
          <button onClick={() => setActiveTab("profile")} className={`px-4 py-2 rounded ${activeTab==="profile"?"bg-green-600 text-white":"bg-white"}`}>Profile</button>
        </div>

        {/* Tabs */}
        {activeTab === "products" && (
          <div>
            <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="border px-2 py-1 rounded mb-2 w-full"/>
            <div className="flex gap-2 mb-4">
              <label className="flex items-center gap-1"><input type="checkbox" checked={filters.organic} onChange={e => setFilters({...filters, organic: e.target.checked})}/> Organic</label>
              <label className="flex items-center gap-1"><input type="checkbox" checked={filters.limitedFertilizer} onChange={e => setFilters({...filters, limitedFertilizer: e.target.checked})}/> Limited Fertilizer</label>
              <label className="flex items-center gap-1"><input type="checkbox" checked={filters.diabeticFriendly} onChange={e => setFilters({...filters, diabeticFriendly: e.target.checked})}/> Diabetic-friendly</label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredProducts.map(p => (
                <motion.div key={p.id} layout whileHover={{ scale: 1.03 }} className="bg-white p-4 rounded shadow">
                  <img src={p.image || ""} alt={p.name} className="h-32 w-full object-cover rounded mb-2"/>
                  <h3 className="font-bold">{p.name}</h3>
                  <p>{p.description}</p>
                  <div className="flex gap-2 my-2 flex-wrap">
                    {p.badges?.map(b => <span key={b} className="bg-green-200 px-2 py-1 text-xs rounded">{b}</span>)}
                  </div>
                  <button onClick={() => meetFarmer(p.farmerId)} className="text-blue-600 hover:underline mb-2">Meet the Farmer</button>
                  <button onClick={() => addToCart(p)} className="bg-green-600 text-white px-2 py-1 rounded w-full">Add to Cart</button>
                  <button className="text-sm text-gray-700 underline mt-1">Safety Certificate</button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "cart" && (
          <div>
            {cart.length === 0 ? <p>Your cart is empty</p> :
              <div>
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center mb-2 bg-white p-2 rounded shadow">
                    <div>
                      <h4>{item.name}</h4>
                      <div className="flex gap-2">
                        <input type="number" min="1" value={item.quantity} onChange={e => updateQuantity(item.id, parseInt(e.target.value))} className="border px-2 py-1 rounded w-20"/>
                        <select value={item.units} onChange={e => setCart(cart.map(c => c.id===item.id ? {...c, units:e.target.value} : c))} className="border px-2 py-1 rounded">
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="pcs">pcs</option>
                        </select>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500">Remove</button>
                  </div>
                ))}
                <button onClick={checkout} className="bg-green-600 text-white px-4 py-2 rounded mt-4">Checkout</button>
              </div>
            }
          </div>
        )}

        {activeTab === "orders" && (
          <div>
            {orders.length === 0 ? <p>No orders yet.</p> :
              <div className="space-y-4">
                {orders.map(o => (
                  <div key={o.id} className="bg-white p-4 rounded shadow">
                    <h4>Order #{o.id}</h4>
                    <p>Status: {o.status}</p>
                    <p>Products: {o.items?.map(i => `${i.name} (${i.quantity}${i.units})`).join(", ")}</p>
                    <div className="flex gap-2 mt-2">
                      {["Placed","Confirmed","Packed","Shipped","Delivered"].map(step => (
                        <span key={step} className={`px-2 py-1 rounded text-xs ${step===o.status?"bg-green-600 text-white":"bg-gray-200"}`}>{step}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
        )}

        {activeTab === "profile" && (
          <div className="bg-white p-4 rounded shadow max-w-md">
            <h3 className="text-xl font-bold mb-4">Profile</h3>
            
            <div className="mb-2">
              <label>Name:</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="border px-2 py-1 rounded w-full" disabled={!editingProfile}/>
            </div>
            <div className="mb-2">
              <label>Email:</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="border px-2 py-1 rounded w-full" disabled={!editingProfile}/>
            </div>
            <div className="mb-2">
              <label>Phone:</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="border px-2 py-1 rounded w-full" disabled={!editingProfile}/>
            </div>

            {!editingProfile ? (
              <button onClick={() => setEditingProfile(true)} className="bg-blue-600 text-white px-4 py-2 rounded mt-2">Edit Profile</button>
            ) : (
              <button onClick={saveProfile} className="bg-green-600 text-white px-4 py-2 rounded mt-2">Save Profile</button>
            )}
          </div>
        )}

      </div>

      <Footer />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded shadow text-white 
          ${toast.type === "success" ? "bg-green-600" : "bg-red-600"} z-50`}>
          {toast.message}
        </div>
      )}

      <AnimatePresence>
        {selectedFarmer && <FarmerModal farmer={selectedFarmer} onClose={() => setSelectedFarmer(null)} />}
      </AnimatePresence>
    </div>
  );
}
