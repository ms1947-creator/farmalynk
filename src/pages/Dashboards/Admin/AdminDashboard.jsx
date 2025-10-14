// src/pages/Admin/AdminDashboard.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../../../firebaseconfig"; // Assumed path

// Import Child Components
import AdminNavbar from "./AdminNavbar";
import PendingApprovals from "./PendingApprovals";
import AddProduct from "./AddProduct";
import ExistingProducts from "./ExistingProducts";
import ManageFarmers from "./ManageFarmers"; 
import ManageUsers from "./ManageUsers"; 
import { fileToBase64 } from "./utils"; 

// Initial States for Forms
const initialNewProductState = {
  name: "", price: "", unit: "kg", description: "", image: null, safetyCertificate: null,
  badges: { organic: false, diabeticFriendly: false, limitedFertilizer: false },
  visibleToCustomers: false, farmerId: "",
};
const initialNewFarmerState = {
  name: "", age: "", location: "", crops: "", story: "", email: "", password: "",
};

export default function AdminDashboard({ currentUser, handleLogout: propHandleLogout }) {
  // --- GLOBAL & DATA STATES ---
  const [toast, setToast] = useState({ show: false, message: "" });
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [allUsers, setAllUsers] = useState([]); 

  // --- FORM STATES ---
  const [newProduct, setNewProduct] = useState(initialNewProductState);
  const [newFarmer, setNewFarmer] = useState(initialNewFarmerState);
  
  // --- SUB-TAB STATES ---
  const [manageUsersSubTab, setManageUsersSubTab] = useState("Customer");
  const [userSearchInput, setUserSearchInput] = useState("");
  const [manageFarmersSubTab, setManageFarmersSubTab] = useState("existing"); 

  // --- FARMER COLLECTION STATE (NEW) ---
  const [allFarmersCollection, setAllFarmersCollection] = useState([]); 

  // --- DATA FETCHING ---
  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const fetchAllUsers = useCallback(async () => {
    try {
      // NOTE: This fetches all users from the 'users' collection (including pending farmers/sellers)
      const querySnapshot = await getDocs(collection(db, "users"));
      const users = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllUsers(users);
      setPendingUsers(users.filter((u) => u.approved === false));
    } catch (err) {
      console.error("Error fetching all users:", err);
    }
  }, []);

  const fetchAllFarmersCollection = useCallback(async () => {
    try {
      // Fetch users from the dedicated 'farmers' collection
      const querySnapshot = await getDocs(collection(db, "farmers"));
      const farmers = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllFarmersCollection(farmers);
    } catch (err) {
      console.error("Error fetching farmers collection:", err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    const querySnapshot = await getDocs(collection(db, "products"));
    const allProducts = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    setProducts(allProducts);
  }, []);

  useEffect(() => {
    fetchAllUsers();
    fetchAllFarmersCollection();
    fetchProducts();
  }, [fetchAllUsers, fetchAllFarmersCollection, fetchProducts]);

  // --- ACTIONS ---

  const handleApprove = async (userId) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", userId), { approved: true });
      await Promise.all([fetchAllUsers()]);
      showToast("User approved successfully!");
    } catch(e) {
      console.error(e);
      showToast("Error approving user.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (userId) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, "users", userId));
      await fetchAllUsers();
      showToast("User rejected and removed.");
    } catch(e) {
      console.error(e);
      showToast("Error rejecting user.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to permanently remove user: ${userName}? This action is irreversible.`)) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "users", userId));
      await fetchAllUsers();
      showToast(`${userName} removed permanently.`);
    } catch (err) {
      console.error(err);
      showToast(`Failed to remove user: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Storing in 'farmers' collection
  const handleAddFarmer = async () => {
    if (!newFarmer.name || !newFarmer.email || !newFarmer.password) {
      return alert("Name, Email, and Password are required to manually add a farmer.");
    }
    setLoading(true);
    try {
      const farmerId = `manual-farmer-${Date.now()}`;
      await setDoc(doc(db, "farmers", farmerId), {
        id: farmerId,
        uid: farmerId,
        ...newFarmer,
        role: "Farmer",
        approved: true, 
        crops: newFarmer.crops.split(",").map((c) => c.trim()),
        createdAt: serverTimestamp(),
      });
      setNewFarmer(initialNewFarmerState); 
      await fetchAllFarmersCollection(); 
      showToast("Farmer added successfully to the 'farmers' collection!");
    } catch (err) {
      console.error(err);
      showToast("Error adding farmer. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.farmerId)
      return alert("Please fill Name, Price, and select a Farmer.");
    
    setLoading(true);
    try {
      const imageUrl = await fileToBase64(newProduct.image);
      const safetyUrl = await fileToBase64(newProduct.safetyCertificate);

      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        badges: Object.keys(newProduct.badges).filter((b) => newProduct.badges[b]),
        image: imageUrl,
        safetyCertificate: safetyUrl,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "products"), productData);

      if (newProduct.visibleToCustomers) {
        await addDoc(collection(db, "customer-products"), { ...productData, adminProductId: docRef.id });
      }

      setNewProduct(initialNewProductState); 
      await fetchProducts();
      showToast("Product added successfully!");
    } catch (err) {
      console.error(err);
      alert(`Error adding product: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (product) => {
    setLoading(true);
    const updatedVisibility = !product.visibleToCustomers;
    try {
      await updateDoc(doc(db, "products", product.id), { visibleToCustomers: updatedVisibility });

      if (updatedVisibility) {
        await addDoc(collection(db, "customer-products"), { ...product, adminProductId: product.id });
      } else {
        const snapshot = await getDocs(collection(db, "customer-products"));
        const toDelete = snapshot.docs.find((d) => d.data().adminProductId === product.id);
        if (toDelete) await deleteDoc(doc(db, "customer-products", toDelete.id));
      }
      await fetchProducts();
      showToast(`Product visibility changed to ${updatedVisibility ? 'LIVE' : 'HIDDEN'}.`);
    } catch(e) {
        console.error("Toggle failed:", e);
        showToast("Failed to toggle visibility.");
    } finally {
        setLoading(false);
    }
  };

  // --- MEMOIZED DATA FOR PROPS ---
  const allAvailableFarmers = useMemo(() => 
    [...allUsers.filter(u => u.role === "Farmer" && u.approved), ...allFarmersCollection]
  , [allUsers, allFarmersCollection]);
  
  const farmersDropdown = allAvailableFarmers;

  const farmersForManageTab = useMemo(() => 
    allFarmersCollection
      .map(farmer => ({
        ...farmer,
        productCount: products.filter(p => p.farmerId === farmer.id || p.farmerId === farmer.uid).length
      }))
  , [allFarmersCollection, products]);

  const handleInternalLogout = propHandleLogout || (() => console.log("Logout function not provided via props."));

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <AdminNavbar currentUser={currentUser} handleLogout={handleInternalLogout} />

      <div className="px-8 py-10 lg:py-16">
        <h1 className="text-4xl font-extrabold text-green-800 mb-8">Admin Dashboard</h1>

        {/* Toast Notification (FIXED CODE) */}
        {toast.show && (
          <div className="fixed top-4 right-4 bg-green-600 text-white px-5 py-3 rounded shadow-xl z-50 animate-fadeInOut">
            {toast.message}
          </div>
        )}

        {/* Loading Overlay (FIXED CODE) */}
        {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
                <div className="bg-white p-6 rounded shadow-2xl flex items-center gap-3">
                    <span className="animate-spin h-5 w-5 border-t-2 border-b-2 border-green-700 rounded-full"></span>
                    <span className="text-lg font-semibold text-green-700">Processing request...</span>
                </div>
            </div>
        )}

        {/* Tabs */}
        <div className="flex gap-3 mb-10 flex-wrap border-b border-gray-200 pb-2">
          {[
            { id: "pending", label: `Approvals (${pendingUsers.filter(u => u.role !== "Customer").length})` },
            { id: "addProduct", label: "Add Product" },
            { id: "existingProducts", label: `Products (${products.length})` },
            { id: "manageFarmers", label: `Manage Farmers (${farmersForManageTab.length})` },
            { id: "manageUsers", label: `Manage Users (${allUsers.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`px-5 py-2 rounded-lg font-semibold transition ${
                activeTab === tab.id
                  ? "bg-green-700 text-white shadow-md"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === "pending" && (
            <PendingApprovals pendingUsers={pendingUsers} handleApprove={handleApprove} handleReject={handleReject} loading={loading} />
          )}

          {activeTab === "addProduct" && (
            <AddProduct newProduct={newProduct} setNewProduct={setNewProduct} handleAddProduct={handleAddProduct} farmersDropdown={farmersDropdown} loading={loading} />
          )}

          {activeTab === "existingProducts" && (
            <ExistingProducts products={products} allUsers={allAvailableFarmers} toggleVisibility={toggleVisibility} loading={loading} />
          )}

          {activeTab === "manageFarmers" && (
            <ManageFarmers
              newFarmer={newFarmer}
              setNewFarmer={setNewFarmer}
              handleAddFarmer={handleAddFarmer}
              loading={loading}
              allFarmers={farmersForManageTab}
              activeSubTab={manageFarmersSubTab}
              setActiveSubTab={setManageFarmersSubTab}
            />
          )}

          {activeTab === "manageUsers" && (
            <ManageUsers
              allUsers={allUsers}
              manageUsersSubTab={manageUsersSubTab}
              setManageUsersSubTab={setManageUsersSubTab}
              userSearchInput={userSearchInput}
              setUserSearchInput={setUserSearchInput}
              handleRemoveUser={handleRemoveUser}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}