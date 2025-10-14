import React, { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  orderBy,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../../firebaseconfig";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../../components/Navbar"; 
import {
  FaShoppingCart,
  FaSearch,
  FaUserCircle,
  FaBoxOpen,
} from "react-icons/fa";
import { updateProfile } from "firebase/auth";

// FIX: Ensure all local components are correctly imported
import { ProductsCard } from "./ProductsCard"; 
import { FarmerModal } from "./FarmerModal"; // We updated this content
import { SafetyCertificate } from "./SafetyCertificate";
import { Cart } from "./Cart"; // We updated this content
import { Orders } from "./Orders";
import { Profile } from "./Profile";

// Helper: Maps badge string to a friendly label and color
const badgeConfig = {
  organic: { label: "🌿 Organic", color: "bg-green-100 text-green-700" },
  limitedFertilizer: {
    label: "⬇️ Low Fertilizer",
    color: "bg-yellow-100 text-yellow-700",
  },
  diabeticFriendly: {
    label: "✅ Diabetic-Friendly",
    color: "bg-blue-100 text-blue-700",
  },
};

export default function CustomerDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    organic: false,
    limitedFertilizer: false,
    diabeticFriendly: false,
  });
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("products");
  const [toast, setToast] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [safetyModal, setSafetyModal] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // --- Utility Functions for Cart Persistence ---
  const saveCart = async (uid, items) => {
    try {
      await setDoc(doc(db, "carts", uid), { items }, { merge: true });
    } catch (err) {
      console.error("Save cart failed:", err);
    }
  };

  const fetchCart = useCallback(async (uid) => {
    try {
      const cartRef = doc(db, "carts", uid);
      const docSnap = await getDoc(cartRef);
      if (docSnap.exists()) setCart(docSnap.data().items || []);
    } catch (err) {
      console.error("Fetch cart failed:", err);
    }
  }, []);
  // ---------------------------------------------


  // --- Data Fetching and Persistence Hooks ---

  // Auth listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) fetchCart(user.uid);
    });
    return () => unsubscribe();
  }, [fetchCart]);
  
  // Fetch profile
  useEffect(() => {
    if (!currentUser) return;
    const userRef = doc(db, "customers", currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setName(data.name || "");
        setEmail(data.email || (currentUser.email ?? ""));
        setPhone(data.phone || "");
      } else {
        setName(currentUser.displayName || "");
        setEmail(currentUser.email || "");
        setPhone("");
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Fetch products
  useEffect(() => {
    setLoadingProducts(true);
    const productsRef = collection(db, "customer-products");
    const q = query(productsRef, where("visibleToCustomers", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data(),
          // Assume these fields exist or default to null/0 for dynamic rating display
          averageRating: doc.data().averageRating || null, 
          reviewCount: doc.data().reviewCount || 0,
      }));
      setProducts(data);
      setFilteredProducts(data);
      setLoadingProducts(false);
    }, (err) => {
      console.error("Products snapshot error:", err);
      setLoadingProducts(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch orders
  useEffect(() => {
    if (!currentUser) return;
    setLoadingOrders(true);
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("customerId", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoadingOrders(false);
    }, (err) => {
      console.error("Orders snapshot error:", err);
      setLoadingOrders(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Filters
  useEffect(() => {
    let filtered = products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
    if (filters.organic) filtered = filtered.filter((p) => p.badges?.includes("organic"));
    if (filters.limitedFertilizer) filtered = filtered.filter((p) => p.badges?.includes("limitedFertilizer"));
    if (filters.diabeticFriendly) filtered = filtered.filter((p) => p.badges?.includes("diabeticFriendly"));
    setFilteredProducts(filtered);
  }, [search, filters, products]);

  // ---------------------------------------------

  // --- Core Handlers ---

const addToCart = (product, selectedQty, extra = {}) => {
  if (!currentUser) {
    setToast({ message: "Please log in to add to cart.", type: "error" });
    setTimeout(() => setToast(null), 3000);
    return;
  }

  // Determine step based on unit
  const step =
    extra.unitsDisplay.includes("g") && selectedQty < 1
      ? selectedQty
      : extra.unitsDisplay.includes("kg") || extra.unitsDisplay.includes("dozen")
      ? 1
      : selectedQty;

  const existing = cart.find(
    (item) => item.id === product.id && item.unitsDisplay === extra.unitsDisplay
  );

  let updated;

  if (existing) {
    updated = cart.map((item) =>
      item.id === product.id && item.unitsDisplay === extra.unitsDisplay
        ? {
            ...item,
            quantity: item.quantity + selectedQty,
            totalPrice: (item.unitPrice || 0) * (item.quantity + selectedQty),
          }
        : item
    );
  } else {
    const cartItem = {
      id: product.id,
      name: product.name,
      quantity: selectedQty,
      unitsDisplay: extra.unitsDisplay,
      unitPrice: Number(extra.unitPrice ?? product.basePrice ?? 0),
      totalPrice: Number(extra.unitPrice ?? product.basePrice ?? 0) * selectedQty,
      image: product.image ?? null,
      step, // dynamically set step
    };
    updated = [...cart, cartItem];
  }

  setCart(updated);
  saveCart(currentUser.uid, updated);

  // Friendly display quantity
  const displayQty = (() => {
    if (extra.unitsDisplay === "g") {
      const grams = selectedQty * 1000;
      return grams >= 1000 ? `${grams / 1000}kg` : `${grams}g`;
    }
    if (extra.unitsDisplay === "kg") return `${selectedQty}kg`;
    if (extra.unitsDisplay === "dozen") return `${selectedQty} dozen`;
    return selectedQty;
  })();

  setToast({ message: `Added ${displayQty} of ${product.name}`, type: "success" });
  setTimeout(() => setToast(null), 3000);
};


  
  const updateQuantity = (productId, unitsDisplay, qty) => {
    const updated = cart.map((item) =>
      item.id === productId && item.unitsDisplay === unitsDisplay ? { ...item, quantity: qty, totalPrice: (item.unitPrice || 0) * qty } : item
    );
    setCart(updated);
    saveCart(currentUser.uid, updated);
  };

  const removeFromCart = (productId, unitsDisplay) => {
    const updated = cart.filter((item) => !(item.id === productId && item.unitsDisplay === unitsDisplay));
    setCart(updated);
    saveCart(currentUser.uid, updated);
  };

  const checkout = async () => {
    if (!currentUser || cart.length === 0) return;
    try {
      await addDoc(collection(db, "orders"), {
        customerId: currentUser.uid,
        items: cart,
        status: "Placed",
        createdAt: new Date(),
      });
      setCart([]);
      await saveCart(currentUser.uid, []);
      setToast({ message: "Order placed successfully! 🥳", type: "success" });
    } catch (error) {
      console.error("Checkout failed:", error);
      setToast({ message: "Order placement failed.", type: "error" });
    }
    setTimeout(() => setToast(null), 3000);
  };

  const meetFarmer = async (farmerId) => {
    if (!farmerId) return;

    try {
        // 1. Check the dedicated 'farmers' collection first
        const farmerRef = doc(db, "farmers", farmerId);
        let farmerSnap = await getDoc(farmerRef);

        if (farmerSnap.exists()) {
            setSelectedFarmer({ id: farmerSnap.id, ...farmerSnap.data() });
            return; // Found in farmers collection
        }

        // 2. If not found in 'farmers', check the general 'users' collection
        const userRef = doc(db, "users", farmerId);
        let userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();

            // Check if the user document indicates a 'farmer' role (case-insensitive check)
            if (userData.role && userData.role.toLowerCase() === 'farmer') {
                setSelectedFarmer({ 
                    id: userSnap.id, 
                    ...userData,
                    // Ensure required fields like name are present
                    name: userData.name || userData.displayName || 'Unknown Farmer'
                });
                return; // Found in users collection and is a farmer
            }
        }
        
        // 3. If neither check works, set a toast error
        setToast({ message: "Farmer details not found.", type: "error" });
        setTimeout(() => setToast(null), 3000);
        setSelectedFarmer(null);

    } catch (error) {
        console.error("Error fetching farmer details:", error);
        // This catch block handles permission errors or network issues
        setToast({ message: "Failed to load farmer details. (Check permissions & network)", type: "error" });
        setTimeout(() => setToast(null), 3000);
    }
  };

  const saveProfile = async () => {
    if (!currentUser || !name.trim()) {
      setToast({ message: "Name cannot be empty.", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    const userRef = doc(db, "customers", currentUser.uid);
    try {
      await setDoc(userRef, { name, email, phone }, { merge: true });
      if (auth.currentUser && auth.currentUser.displayName !== name) {
        await updateProfile(auth.currentUser, { displayName: name });
        setCurrentUser({ ...auth.currentUser, displayName: name });
      }

      setEditingProfile(false);
      setToast({ message: "Profile saved successfully! 💾", type: "success" });
    } catch (error) {
      console.error("Profile save failed:", error);
      setToast({ message: "Profile save failed.", type: "error" });
    }
    setTimeout(() => setToast(null), 3000);
  };
  
  const logout = async () => {
    await auth.signOut();
    setCurrentUser(null);
  };

  // ---------------------------------------------

  if (!currentUser)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="p-4 text-xl font-medium">Loading user details...</p>
      </div>
    );

  const tabItems = [
    { id: "products", label: "Shop Products", icon: <FaBoxOpen className="inline mr-1" /> },
    { id: "cart", label: `Cart (${cart.length})`, icon: <FaShoppingCart className="inline mr-1" /> },
    { id: "orders", label: "My Orders", icon: <FaBoxOpen className="inline mr-1" /> },
    { id: "profile", label: "Profile", icon: <FaUserCircle className="inline mr-1" /> },
  ];
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar user={{ displayName: name, email }} onLogout={logout} />

      <main className="flex-1 mt-10 p-4 md:p-8 max-w-7xl mx-auto w-full"> {/* Increased max-w for 8 columns */}
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800">
            Welcome, <span className="text-green-600">{name || currentUser.email}!</span> 👋
          </h1>
          <p className="text-gray-500 mt-1">Your farm-to-table journey starts here.</p>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 overflow-x-auto pb-1">
          {tabItems.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ y: -2 }}
              className={`px-6 py-3 rounded-t-lg font-semibold whitespace-nowrap transition-all duration-200 flex items-center ${
                activeTab === tab.id
                  ? "bg-white text-green-600 border-b-4 border-green-600 shadow-t-md"
                  : "text-gray-500 hover:text-green-600 hover:bg-gray-100"
              }`}
            >
              {tab.icon}
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Tab Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === "products" && (
            <motion.div
              key="products"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="mt-6"
            >
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    placeholder="Search for fresh produce..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border border-gray-300 pl-10 pr-4 py-2 rounded-lg w-full focus:ring-green-500 focus:border-green-500 transition"
                  />
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                </div>
                
                {/* Filters */}
                <div className="flex gap-3 flex-wrap items-center">
                  {Object.keys(filters).map((key) => (
                    <motion.label
                      key={key}
                      whileHover={{ scale: 1.05 }}
                      className={`flex items-center gap-1 cursor-pointer px-3 py-2 rounded-full text-sm font-medium transition ${
                        filters[key] ? "bg-green-600 text-white shadow-md" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters[key]}
                        onChange={(e) =>
                          setFilters({ ...filters, [key]: e.target.checked })
                        }
                        className="hidden"
                      />{" "}
                      {badgeConfig[key]?.label || key.replace(/([A-Z])/g, " $1").trim()}
                    </motion.label>
                  ))}
                </div>
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: "calc(3 * 11rem + 2rem)" }}>
                {/* Product Grid Layout */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 place-items-stretch">
                  {loadingProducts ? (
                    // Placeholder for loading state
                    Array(24)
                      .fill(0)
                      .map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="bg-white p-5 rounded-xl shadow-lg animate-pulse h-60 w-full"
                        ></motion.div>
                      ))
                  ) : filteredProducts.length === 0 ? (
                    <p className="text-gray-500 italic col-span-full text-center py-10">
                      No products found matching your search and filters. 😔
                    </p>
                  ) : (
                    <AnimatePresence>
                      {filteredProducts.map((p) => (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="w-full"
                        >
                          <ProductsCard
                            product={p}
                            meetFarmer={meetFarmer}
                            addToCart={addToCart}
                            setSafetyModal={setSafetyModal}
                            badgeConfig={badgeConfig} // Pass config to card
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </div>

            </motion.div>
          )}

          {/* FIX: Ensure components receive all necessary props */}
          {activeTab === "cart" && <Cart 
            key="cart" 
            cart={cart} 
            updateQuantity={updateQuantity} 
            removeFromCart={removeFromCart} 
            checkout={checkout} 
          />}
          {activeTab === "orders" && <Orders key="orders" orders={orders} loadingOrders={loadingOrders} />}
          {activeTab === "profile" && <Profile 
            key="profile" 
            name={name} 
            email={email} 
            phone={phone} 
            setName={setName} 
            setEmail={setEmail} 
            setPhone={setPhone} 
            editingProfile={editingProfile} 
            setEditingProfile={setEditingProfile} 
            saveProfile={saveProfile} 
            logout={logout} 
          />}
        </AnimatePresence>
      </main>

      {/* Modals and Toast */}
      <AnimatePresence>
        {selectedFarmer && (
          <FarmerModal farmer={selectedFarmer} onClose={() => setSelectedFarmer(null)} />
        )}
        {safetyModal && <SafetyCertificate url={safetyModal} onClose={() => setSafetyModal(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-2xl font-semibold z-[60] flex items-center space-x-2 ${
              toast.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            <span role="img" aria-label="icon">{toast.type === "success" ? "✅" : "❌"}</span>
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}