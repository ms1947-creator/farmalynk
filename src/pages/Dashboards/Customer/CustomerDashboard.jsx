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
  FaStar,
  FaRegStar,
  FaTimes,
  FaShoppingCart,
  FaSearch,
  FaUserCircle,
  FaBoxOpen,
} from "react-icons/fa";
import { updateProfile } from "firebase/auth"; // to update displayName in auth

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
  // Add more badges as needed
};

// Farmer Modal Component
function FarmerModal({ farmer, onClose }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitReview = async () => {
    if (!farmer) return;
    if (rating < 1 || rating > 5) return alert("Rating must be 1–5");
    if (!comment.trim()) return alert("Comment cannot be empty");

    setIsSubmitting(true);
    try {
      const reviewRef = collection(db, "farmers", farmer.id, "reviews");
      await addDoc(reviewRef, {
        rating,
        comment,
        customerId: auth.currentUser.uid,
        createdAt: new Date(),
      });
      setComment("");
      setRating(0);
      onClose();
      alert("Review submitted!");
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!farmer) return null;

  const renderStars = () => {
    return (
      <div className="flex justify-center items-center space-x-1 cursor-pointer">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.div
            key={star}
            whileHover={{ scale: 1.2 }}
            onClick={() => setRating(star)}
            className="text-2xl"
          >
            {star <= rating ? (
              <FaStar className="text-yellow-500" />
            ) : (
              <FaRegStar className="text-gray-300" />
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "-100vh", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "-100vh", opacity: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="bg-white p-8 rounded-xl max-w-lg w-full shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-600 transition duration-150"
          aria-label="Close modal"
        >
          <FaTimes size={20} />
        </button>
        <div className="text-center mb-6 border-b pb-4">
          <h2 className="text-3xl font-extrabold text-green-700 mb-1">
            {farmer.name}
          </h2>
          <p className="text-sm text-gray-500">Meet the person behind your food!</p>
        </div>

        <div className="space-y-3 text-gray-700">
          <p>🧑‍🌾 <strong>Age:</strong> {farmer.age}</p>
          <p>📍 <strong>Location:</strong> {farmer.location}</p>
          <p>
            🌱 <strong>Crops:</strong>{" "}
            <span className="font-medium">{farmer.crops?.join(", ")}</span>
          </p>
          {farmer.story && (
            <p className="p-4 bg-gray-50 border-l-4 border-green-500 italic rounded-lg shadow-sm">
              "{farmer.story}"
            </p>
          )}
        </div>

        <div className="mt-6 pt-4 border-t">
          <h3 className="text-xl font-semibold mb-3 text-gray-800">Leave a Review</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating (1-5):
            </label>
            {renderStars()}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Comment:</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience and thoughts about this farmer..."
              rows="3"
              className="border border-gray-300 px-3 py-2 rounded-lg w-full focus:ring-green-500 focus:border-green-500 transition duration-150"
            />
          </div>

          <motion.button
            onClick={submitReview}
            disabled={isSubmitting || rating === 0 || !comment.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center justify-center space-x-2 text-white px-4 py-2 rounded-lg w-full font-semibold transition duration-200 ${
              isSubmitting || rating === 0 || !comment.trim()
                ? "bg-green-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg"
            }`}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Review</span>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// Safety Certificate Modal (No changes needed here)
function SafetyModal({ url, onClose }) {
  if (!url) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-6 rounded-xl max-w-xl w-full shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4 border-b pb-2">
          <h2 className="text-xl font-bold text-gray-800">Safety Certificate</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 transition"
            aria-label="Close certificate view"
          >
            <FaTimes size={20} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          <img src={url} alt="Safety Certificate" className="w-full h-auto rounded-lg border border-gray-200" />
        </div>
      </motion.div>
    </div>
  );
}

/**
 * ProductCard
 *
 * Expects product fields (from admin):
 * - baseUnit: "kg" | "g" | "piece"  (or a string like "500g" — parser will try)
 * - basePrice: number  (price for one base unit)
 * - availableQuantity: number (in same base unit: if baseUnit is "kg" it's kg, if "piece" it's pieces)
 *
 * This component computes qty options and prices accordingly.
 */
function ProductCard({ product, meetFarmer, addToCart, setSafetyModal }) {
  // Determine normalized base unit info
  // baseUnitNormalized: "kg" | "piece"
  // baseUnitAmountKg: if base unit is "500g", baseUnitAmountKg = 0.5; if "kg" then 1; if "piece" then null
  const normalizeBaseUnit = (rawUnit) => {
    if (!rawUnit) return { type: "kg", baseUnitAmountKg: 1 }; // default
    const s = rawUnit.toString().toLowerCase().trim();
    if (s.includes("piece") || s.includes("pc") || s === "piece") {
      return { type: "piece", baseUnitAmountKg: null };
    }
    // check grams like "500g" or "250 g"
    const gramsMatch = s.match(/(\d+)\s*g/);
    if (gramsMatch) {
      const grams = parseFloat(gramsMatch[1]);
      return { type: "kg", baseUnitAmountKg: grams / 1000 };
    }
    // check kg like "1kg"
    const kgMatch = s.match(/(\d+(\.\d+)?)\s*kg/);
    if (kgMatch) {
      const kg = parseFloat(kgMatch[1]);
      return { type: "kg", baseUnitAmountKg: kg };
    }
    // fallback: if includes 'g' but no number, default 1kg
    if (s.includes("g")) return { type: "kg", baseUnitAmountKg: 0.001 };
    // default to kg if ambiguous
    return { type: s === "piece" ? "piece" : "kg", baseUnitAmountKg: 1 };
  };

  const { type: baseType, baseUnitAmountKg } = normalizeBaseUnit(product.baseUnit);

  // Build qty options depending on product base unit
  let qtyOptions = [];
  if (baseType === "piece") {
    // pieces — show small set of piece counts (admin could set availableQuantity to limit)
    qtyOptions = [{ label: "1 pc", value: 1 }, { label: "2 pc", value: 2 }, { label: "3 pc", value: 3 }, { label: "5 pc", value: 5 }];
  } else {
    // weight (kg-based) — use common options in kg
    qtyOptions = [
      { label: "250g", value: 0.25 },
      { label: "500g", value: 0.5 },
      { label: "1kg", value: 1 },
      { label: "2kg", value: 2 },
    ];
  }

  // selectedQty numeric in base presentation:
  // - for piece: number of pieces (1,2,...)
  // - for weight: kg decimal (0.25, 0.5, 1)
  const [selectedQty, setSelectedQty] = useState(qtyOptions[0].value);

  // Compute price per base admin unit (normalize to price per kg if admin provided baseUnit in grams)
  // product.basePrice is price for admin-specified baseUnit. We'll compute pricePerKg for weights.
  const computePrices = () => {
    const basePrice = Number(product.basePrice || product.price || 0); // fallback keys
    if (baseType === "piece") {
      // pricePerPiece is basePrice (assumed)
      return {
        pricePerBaseUnit: basePrice,
        pricePerKg: null,
        priceForSelectedQty: basePrice * selectedQty,
        unitLabel: "pc",
      };
    } else {
      // weights: product.baseUnit might be '500g' => baseUnitAmountKg = 0.5
      // pricePerKg = basePrice / baseUnitAmountKg
      const amountKg = baseUnitAmountKg || 1;
      const pricePerKg = amountKg > 0 ? basePrice / amountKg : basePrice;
      const priceForSelectedQty = pricePerKg * Number(selectedQty);
      return {
        pricePerBaseUnit: basePrice,
        pricePerKg,
        priceForSelectedQty,
        unitLabel: "kg",
      };
    }
  };

  const { pricePerBaseUnit, pricePerKg, priceForSelectedQty, unitLabel } = computePrices();

  // Availability check - product.availableQuantity assumed in admin base units:
  // - if product baseType piece -> availableQuantity is pieces
  // - if weight -> availableQuantity in kg (if admin used g/500g we assume admin stored availableQuantity normalized to kg or the same baseUnit — we try to handle both)
  const availableQuantityRaw = Number(product.availableQuantity ?? product.stock ?? Infinity);
  // Normalize availability: if admin's availableQuantity seems in grams (< 10) and baseType=='kg' maybe they stored grams. We'll try a best-effort:
  let availableQtyNormalized = availableQuantityRaw;
  if (baseType === "kg") {
    // if admin accidentally stored grams (e.g., 500 or 250), convert to kg if looks like grams
    if (availableQuantityRaw > 0 && availableQuantityRaw < 10 && availableQuantityRaw > 0 && Number.isInteger(availableQuantityRaw) && availableQuantityRaw >= 1) {
      // ambiguous — likely qty in kg already (e.g., 1,2...). If it is > 10, maybe grams, but that's unusual.
      // if value is > 10 and less than 10000, assume it's grams.
      if (availableQuantityRaw > 10 && availableQuantityRaw < 10000) {
        availableQtyNormalized = availableQuantityRaw / 1000; // grams -> kg
      } else {
        availableQtyNormalized = availableQuantityRaw; // keep as kg
      }
    } else if (availableQuantityRaw > 10 && availableQuantityRaw < 10000) {
      // looks like grams
      availableQtyNormalized = availableQuantityRaw / 1000;
    } else {
      // fallback
      availableQtyNormalized = availableQuantityRaw;
    }
  } else {
    // piece
    availableQtyNormalized = availableQuantityRaw;
  }

  const exceedsAvailability = () => {
    if (!isFinite(availableQtyNormalized)) return false;
    return Number(selectedQty) > Number(availableQtyNormalized);
  };

  const handleAddToCart = () => {
    // build the cart item payload including computed prices and unit label
    const unitsDisplay =
      baseType === "piece" ? `${selectedQty} pc` : `${selectedQty < 1 ? `${selectedQty * 1000}g` : `${selectedQty}kg`}`;

    const unitPrice = baseType === "piece" ? pricePerBaseUnit : pricePerKg; // pricePerKg is per kg
    const totalPrice = priceForSelectedQty || 0;

    addToCart(product, Number(selectedQty), {
      unitPrice,
      totalPrice,
      unitsDisplay,
    });
  };

  // handle safety certificate open
  const handleViewCertificate = () => {
    if (product.safetyCertificate) {
      setSafetyModal(product.safetyCertificate);
    }
  };

  // Format currency (basic)
  const fmt = (n) => Number(n ?? 0).toFixed(2);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
      className="bg-white p-5 rounded-xl shadow-lg flex flex-col justify-between transition-all duration-300"
    >
      <div>
        {product.image && (
          <img
            src={product.image}
            alt={product.name}
            className="h-40 w-full object-cover rounded-lg mb-3 border border-gray-100"
          />
        )}
        <h3 className="text-xl font-extrabold text-gray-800 mb-1">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>

        <div className="flex gap-2 mb-3 flex-wrap">
          {product.badges?.map((b) => {
            const badge = badgeConfig[b];
            if (!badge) return null;
            return (
              <span
                key={b}
                className={`${badge.color} px-3 py-1 text-xs rounded-full font-medium`}
              >
                {badge.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-4 border-t pt-4">
        <button
          onClick={() => meetFarmer(product.farmerId)}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline mb-3 w-full text-left font-medium transition"
        >
          🧑‍🌾 Meet the Farmer
        </button>

        <div className="flex justify-between items-center gap-2 mb-3">
          <select
            value={selectedQty}
            onChange={(e) => setSelectedQty(Number(e.target.value))}
            className="border border-gray-300 px-3 py-2 rounded-lg flex-grow bg-white focus:ring-green-500 focus:border-green-500"
            aria-label="Select quantity"
          >
            {qtyOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <motion.button
            onClick={handleAddToCart}
            whileTap={{ scale: 0.95 }}
            className={`bg-green-600 text-white p-3 rounded-lg flex items-center justify-center hover:bg-green-700 transition shadow-md ${exceedsAvailability() ? "opacity-50 cursor-not-allowed" : ""}`}
            aria-label="Add to cart"
            disabled={exceedsAvailability()}
            title={exceedsAvailability() ? `Only ${availableQtyNormalized} ${baseType === "piece" ? 'pcs' : 'kg'} available` : ""}
          >
            <FaShoppingCart size={18} />
          </motion.button>
        </div>

        <div className="text-sm text-gray-700">
          <div>Price: <span className="font-semibold">₹{fmt(priceForSelectedQty)}</span> {baseType === "piece" ? `(${fmt(pricePerBaseUnit)} per pc)` : `(₹${fmt(pricePerKg)}/kg)`}</div>
          {isFinite(availableQtyNormalized) && (
            <div className="text-xs text-gray-500 mt-1">Available: {baseType === "piece" ? `${availableQtyNormalized} pcs` : `${availableQtyNormalized} kg`}</div>
          )}
        </div>

        {product.safetyCertificate && (
          <button
            onClick={handleViewCertificate}
            className="text-xs text-gray-600 hover:text-gray-800 underline block text-center mt-3"
          >
            View Safety Certificate
          </button>
        )}
      </div>
    </motion.div>
  );
}

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

  // Auth listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) fetchCart(user.uid);
    });
    return () => unsubscribe();
  }, []);

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
        // If no doc exists, prefill from auth
        setName(currentUser.displayName || "");
        setEmail(currentUser.email || "");
        setPhone("");
      }
    }, (err) => {
      console.error("Profile snapshot error:", err);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Fetch products
  useEffect(() => {
    setLoadingProducts(true);
    const productsRef = collection(db, "customer-products");
    const q = query(productsRef, where("visibleToCustomers", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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

  // Cart persistence
  const fetchCart = useCallback(async (uid) => {
    try {
      const cartRef = doc(db, "carts", uid);
      const docSnap = await getDoc(cartRef);
      if (docSnap.exists()) setCart(docSnap.data().items || []);
    } catch (err) {
      console.error("Fetch cart failed:", err);
    }
  }, []);

  const saveCart = async (uid, items) => {
    try {
      await setDoc(doc(db, "carts", uid), { items }, { merge: true });
    } catch (err) {
      console.error("Save cart failed:", err);
    }
  };

  /**
   * addToCart signature changed: addToCart(product, selectedQtyNumber, extra = {unitPrice, totalPrice, unitsDisplay})
   */
  const addToCart = (product, selectedQty, extra = {}) => {
    if (!currentUser) {
      setToast({ message: "Please log in to add to cart.", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    // Build cart item
    const existing = cart.find((item) => item.id === product.id && item.unitsDisplay === extra.unitsDisplay);
    if (existing) {
      const updated = cart.map((item) =>
        item.id === product.id && item.unitsDisplay === extra.unitsDisplay
          ? {
              ...item,
              quantity: Number(item.quantity) + Number(selectedQty),
              totalPrice: Number(item.totalPrice || 0) + Number(extra.totalPrice || 0),
            }
          : item
      );
      setCart(updated);
      saveCart(currentUser.uid, updated);
    } else {
      const cartItem = {
        id: product.id,
        name: product.name,
        quantity: Number(selectedQty),
        unitsDisplay: extra.unitsDisplay || (product.baseUnit === "piece" ? `${selectedQty} pc` : `${selectedQty} kg`),
        unitPrice: Number(extra.unitPrice ?? product.basePrice ?? 0),
        totalPrice: Number(extra.totalPrice ?? (product.basePrice ?? 0) * Number(selectedQty)),
        image: product.image ?? null,
      };
      const updated = [...cart, cartItem];
      setCart(updated);
      saveCart(currentUser.uid, updated);
    }

    setToast({ message: `Added ${extra.unitsDisplay || selectedQty} of ${product.name}`, type: "success" });
    setTimeout(() => setToast(null), 3000);
  };

  const updateQuantity = (productId, qty) => {
    const updated = cart.map((item) =>
      item.id === productId ? { ...item, quantity: qty, totalPrice: (item.unitPrice || 0) * qty } : item
    );
    setCart(updated);
    saveCart(currentUser.uid, updated);
  };

  const removeFromCart = (productId) => {
    const updated = cart.filter((item) => item.id !== productId);
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
      setToast({ message: "Order placed successfully! Thank you. 🥳", type: "success" });
    } catch (error) {
      console.error("Checkout failed:", error);
      setToast({ message: "Order placement failed. Please try again.", type: "error" });
    }
    setTimeout(() => setToast(null), 3000);
  };

  // Farmer
  const meetFarmer = (farmerId) => {
    const farmerRef = doc(db, "farmers", farmerId);
    onSnapshot(farmerRef, (docSnap) => {
      if (docSnap.exists()) setSelectedFarmer({ id: docSnap.id, ...docSnap.data() });
    });
  };

  // Profile save: updates Firestore and the Auth displayName
  const saveProfile = async () => {
    if (!currentUser) return;
    if (!name.trim()) {
      setToast({ message: "Name cannot be empty.", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    const userRef = doc(db, "customers", currentUser.uid);
    try {
      // Update Firestore
      await setDoc(userRef, { name, email, phone }, { merge: true });

      // Update Firebase Auth displayName if different
      if (auth.currentUser && auth.currentUser.displayName !== name) {
        try {
          await updateProfile(auth.currentUser, { displayName: name });
          // reflect the change in local currentUser state
          setCurrentUser({ ...auth.currentUser, displayName: name });
        } catch (authErr) {
          console.warn("Failed to update auth profile displayName:", authErr);
          // Not critical: continue
        }
      }

      setEditingProfile(false);
      setToast({ message: "Profile saved successfully! 💾", type: "success" });
    } catch (error) {
      console.error("Profile save failed:", error);
      setToast({ message: "Profile save failed. Check your details.", type: "error" });
    }
    setTimeout(() => setToast(null), 3000);
  };

  const logout = async () => {
    await auth.signOut();
    setCurrentUser(null);
  };

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

  // Cart Content
  const CartContent = () => {
    const cartTotal = cart.reduce((total, item) => total + (Number(item.totalPrice) || 0), 0);
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-2xl font-bold mb-4 border-b pb-2 text-green-700">Your Cart ({cart.length} items)</h3>
        {cart.length === 0 ? (
          <p className="text-gray-500 italic">Your cart is empty. Start shopping now! 🛒</p>
        ) : (
          <>
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id + item.unitsDisplay} className="flex justify-between items-center p-3 border-b hover:bg-gray-50 transition rounded-md">
                  <div className="flex items-center gap-3">
                    {item.image ? <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded" /> : <div className="w-14 h-14 bg-gray-100 rounded flex items-center justify-center text-gray-400">N/A</div>}
                    <div>
                      <div className="font-semibold text-gray-800">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.unitsDisplay}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, Number(e.target.value) || 0)}
                      className="w-20 border rounded text-center"
                    />
                    <span className="text-gray-600">₹{Number(item.totalPrice || 0).toFixed(2)}</span>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700"><FaTimes /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t">
              <p className="text-xl font-bold mb-3 text-right text-green-800">Total: ₹{cartTotal.toFixed(2)}</p>
              <motion.button
                onClick={checkout}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-green-600 text-white px-6 py-3 rounded-lg w-full font-semibold text-lg hover:bg-green-700 transition shadow-lg"
                disabled={cart.length === 0}
              >
                Proceed to Checkout
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    );
  };

  // Orders Content
  const OrdersContent = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-2xl font-bold mb-4 border-b pb-2 text-green-700">My Orders</h3>
      {loadingOrders ? (
        <p className="text-gray-500 italic">Loading your orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500 italic">You have no past orders. Let's change that! 🥕</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <motion.div key={order.id} whileHover={{ x: 5 }} className="p-4 border rounded-lg shadow-sm bg-gray-50">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-gray-800">Order ID: #{order.id.substring(0, 8).toUpperCase()}</span>
                <span className={`px-3 py-1 text-xs rounded-full font-medium ${order.status === "Placed" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{order.status}</span>
              </div>
              <p className="text-sm text-gray-500">{order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleDateString() : new Date(order.createdAt).toLocaleDateString()}</p>
              <ul className="list-disc ml-5 mt-2 text-sm text-gray-700">
                {order.items.map((item, index) => (
                  <li key={index}>{item.name} - {item.quantity} ({item.unitsDisplay})</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );

  // Profile Content
  const ProfileContent = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white p-6 rounded-xl shadow-lg max-w-lg mx-auto">
      <h3 className="text-2xl font-bold mb-4 border-b pb-2 text-green-700">My Profile</h3>
      {editingProfile ? (
        <div className="space-y-4">
          <label className="block">
            <span className="text-gray-700">Full Name</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" />
          </label>
          <label className="block">
            <span className="text-gray-700">Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed" />
            <div className="text-xs text-gray-500 mt-1">Email updates require re-authentication — currently not enabled in this flow.</div>
          </label>
          <label className="block">
            <span className="text-gray-700">Phone</span>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500" />
          </label>
          <motion.button
            onClick={saveProfile}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg w-full font-semibold hover:bg-green-700 transition"
          >
            Save Changes
          </motion.button>
          <button onClick={() => setEditingProfile(false)} className="text-gray-600 hover:underline w-full mt-2">Cancel</button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-lg"><span className="font-medium text-gray-600">Name:</span> {name}</p>
          <p className="text-lg"><span className="font-medium text-gray-600">Email:</span> {email}</p>
          <p className="text-lg"><span className="font-medium text-gray-600">Phone:</span> {phone || 'N/A'}</p>
          <motion.button
            onClick={() => setEditingProfile(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full font-semibold hover:bg-blue-700 transition mt-4"
          >
            Edit Profile
          </motion.button>
          <button onClick={logout} className="text-red-500 hover:text-red-700 w-full mt-2">Logout</button>
        </div>
      )}
    </motion.div>
  );

  // Main Render
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar user={{ displayName: name, email }} onLogout={logout} />

      <main className="flex-1 mt-10 p-4 md:p-8 max-w-6xl mx-auto w-full">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loadingProducts ? (
                  Array(8)
                    .fill(0)
                    .map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-5 rounded-xl shadow-lg animate-pulse h-80"
                      ></motion.div>
                    ))
                ) : filteredProducts.length === 0 ? (
                  <p className="text-gray-500 italic col-span-full text-center py-10">
                    No products found matching your search and filters. 😔
                  </p>
                ) : (
                  <AnimatePresence>
                    {filteredProducts.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        meetFarmer={meetFarmer}
                        addToCart={addToCart}
                        setSafetyModal={setSafetyModal}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "cart" && <CartContent key="cart" />}
          {activeTab === "orders" && <OrdersContent key="orders" />}
          {activeTab === "profile" && <ProfileContent key="profile" />}
        </AnimatePresence>
      </main>

      {/* Modals and Toast */}
      <AnimatePresence>
        {selectedFarmer && (
          <FarmerModal farmer={selectedFarmer} onClose={() => setSelectedFarmer(null)} />
        )}
        {safetyModal && <SafetyModal url={safetyModal} onClose={() => setSafetyModal(null)} />}
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
