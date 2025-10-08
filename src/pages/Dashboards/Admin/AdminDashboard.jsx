import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  query,
  where,
  setDoc,
} from "firebase/firestore";
import { db, storage } from "../../../firebaseconfig";
import Navbar from "../../../components/Navbar";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; 

// Define all possible user roles
const allRoles = ["Customer", "Farmer", "Seller", "Field Officer", "Company"];

export default function AdminDashboard() {
  const [toast, setToast] = useState({ show: false, message: "" });
  const [activeTab, setActiveTab] = useState("pending");
  
  const [pendingUsers, setPendingUsers] = useState([]);
  const [products, setProducts] = useState([]);
  
  // NEW STATES FOR USER MANAGEMENT
  const [allUsers, setAllUsers] = useState([]); 
  const [manageUsersSubTab, setManageUsersSubTab] = useState("Customer"); 
  const [userSearchInput, setUserSearchInput] = useState("");
  
  const [loading, setLoading] = useState(false);
  
  // 🔄 RETAINING farmerSearchInput for product dropdown search ONLY, 
  // as using the same state (userSearchInput) for multiple contexts caused issues.
  const [farmerSearchInput, setFarmerSearchInput] = useState(""); 

  const [manageFarmersSubTab, setManageFarmersSubTab] = useState("addFarmer");

  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    unit: "kg",
    description: "",
    image: null,
    safetyCertificate: null,
    badges: { organic: false, diabeticFriendly: false, limitedFertilizer: false },
    visibleToCustomers: false,
    farmerId: "",
  });

  const [newFarmer, setNewFarmer] = useState({ 
    name: "", 
    age: "", 
    location: "", 
    crops: "", 
    story: "",
    email: "",
    password: "",
  });

  // Fetch Pending Users
  const fetchPendingUsers = async () => {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users = querySnapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((u) => u.approved === false);
    setPendingUsers(users);
  };

  // Fetch All Approved Users
  const fetchAllUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const users = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllUsers(users);
    } catch (err) {
      console.error("Error fetching all users:", err);
    }
  };

  // Fetch Products
  const fetchProducts = async () => {
    const querySnapshot = await getDocs(collection(db, "products"));
    const allProducts = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    setProducts(allProducts);
  };

  useEffect(() => {
    fetchPendingUsers();
    fetchAllUsers();
    fetchProducts();
  }, []);

  // Approve / Reject Users (Pending tab)
  const handleApprove = async (userId) => {
    await updateDoc(doc(db, "users", userId), { approved: true });
    fetchPendingUsers();
    fetchAllUsers(); 
    setToast({ show: true, message: "User approved!" });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };
  const handleReject = async (userId) => {
    await deleteDoc(doc(db, "users", userId));
    fetchPendingUsers();
    setToast({ show: true, message: "User rejected!" });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  // Remove User Handler (Manage Users tab)
  const handleRemoveUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to permanently remove user: ${userName}? This action cannot be undone.`)) {
      return;
    }
    setLoading(true);
    try {
      await deleteDoc(doc(db, "users", userId));
      await fetchAllUsers();
      setToast({ show: true, message: `${userName} has been removed.` });
    } catch (err) {
      console.error("Error removing user:", err);
      setToast({ show: true, message: `Failed to remove user: ${err.message}` });
    } finally {
      setLoading(false);
      setTimeout(() => setToast({ show: false, message: "" }), 3000);
    }
  };
  
  // FIX: Added logic to switch to 'existingFarmers' subtab after adding a farmer
  const handleAddFarmer = async () => {
    if (!newFarmer.name || !newFarmer.email) {
      return alert("Farmer Name and Email are required");
    }
    setLoading(true);
    try {
        const customUid = `manual-farmer-${Date.now()}`; 

        await setDoc(doc(db, "users", customUid), { 
            uid: customUid,
            id: customUid,
            name: newFarmer.name,
            email: newFarmer.email,
            role: "Farmer", 
            approved: true, 
            location: newFarmer.location || "",
            age: newFarmer.age || "",
            crops: newFarmer.crops.split(",").map(c => c.trim()).filter(c => c),
            story: newFarmer.story || "",
            createdAt: serverTimestamp(),
        });
        
        setNewFarmer({ name: "", age: "", location: "", crops: "", story: "", email: "", password: "" });
        await fetchAllUsers(); // 🟢 Ensure the full list is refreshed BEFORE switching view
        
        // 🟢 FIX: Switch to the existing farmers view and clear search input to show the new farmer
        setManageFarmersSubTab("existingFarmers");
        setUserSearchInput(""); 
        
        setToast({ show: true, message: "Farmer added successfully to Users collection!" });
        
    } catch (error) {
        console.error("Error adding farmer:", error);
        setToast({ show: true, message: "Error adding farmer." });
    } finally {
        setLoading(false);
        setTimeout(() => setToast({ show: false, message: "" }), 3000);
    }
  }


  // Upload File (Used for Add Product)
  const uploadFile = async (file, path) => {
    if (!file) return "";
    const fileRef = ref(storage, `${path}/${file.name}_${Date.now()}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  // Add Product Handler
  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    if (!newProduct.name || !newProduct.price || !newProduct.farmerId)
      return alert("Please fill Name, Price and select Farmer");

    setLoading(true);
    try {
      // Upload image and safety certificate
      const imageUrl = newProduct.image ? await uploadFile(newProduct.image, "products") : "";
      const safetyUrl = newProduct.safetyCertificate ? await uploadFile(newProduct.safetyCertificate, "safetyCertificates") : "";

      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        badges: Object.keys(newProduct.badges).filter(b => newProduct.badges[b]),
        image: imageUrl,
        safetyCertificate: safetyUrl,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "products"), productData);

      // Add to customer-products automatically if visible
      if (newProduct.visibleToCustomers) {
        await addDoc(collection(db, "customer-products"), { ...productData, adminProductId: docRef.id });
      }

      setNewProduct({
        name: "",
        price: "",
        unit: "kg",
        description: "",
        image: null,
        safetyCertificate: null,
        badges: { organic: false, diabeticFriendly: false, limitedFertilizer: false },
        visibleToCustomers: true,
        farmerId: "",
      });
      fetchProducts();

      // Show success toast
      setToast({ show: true, message: "Product added successfully!" });
      setTimeout(() => setToast({ show: false, message: "" }), 3000);

    } catch (err) {
      console.error(err);
      alert("Error adding product");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Product Visibility
  const toggleVisibility = async (product) => {
    const updatedVisibility = !product.visibleToCustomers;
    await updateDoc(doc(db, "products", product.id), { visibleToCustomers: updatedVisibility });

    if (updatedVisibility) {
      await addDoc(collection(db, "customer-products"), { ...product, adminProductId: product.id });
    } else {
      const customerProductsSnap = await getDocs(collection(db, "customer-products"));
      const toDelete = customerProductsSnap.docs.find((d) => d.data().adminProductId === product.id);
      if (toDelete) await deleteDoc(doc(db, "customer-products", toDelete.id));
    }
    fetchProducts();
  };
  
  // HELPER: Filter users by role and approval status for the product dropdown
  const getFarmersForDropdown = () => {
    // Only approved farmers are available for products
    return allUsers.filter(u => u.role === "Farmer" && u.approved === true);
  }


  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <Navbar />
      <div className="px-8 py-20">
        <h1 className="text-3xl font-bold text-green-700 mb-8">Admin Dashboard</h1>

        {/* Toast */}
        {toast.show && (
          <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50 animate-slide-in">
            {toast.message}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <button className={`px-4 py-2 rounded ${activeTab === "pending" ? "bg-green-600 text-white" : "bg-white"}`} onClick={() => { setActiveTab("pending"); setUserSearchInput(""); }}>Pending Approvals ({pendingUsers.length})</button>
          <button className={`px-4 py-2 rounded ${activeTab === "addProduct" ? "bg-green-600 text-white" : "bg-white"}`} onClick={() => { setActiveTab("addProduct"); setUserSearchInput(""); }}>Add Product</button>
          <button className={`px-4 py-2 rounded ${activeTab === "existingProducts" ? "bg-green-600 text-white" : "bg-white"}`} onClick={() => { setActiveTab("existingProducts"); setUserSearchInput(""); }}>Existing Products</button>
          <button className={`px-4 py-2 rounded ${activeTab === "manageFarmers" ? "bg-green-600 text-white" : "bg-white"}`} onClick={() => { setActiveTab("manageFarmers"); setUserSearchInput(""); }}>Manage Farmers</button>
          <button className={`px-4 py-2 rounded ${activeTab === "manageUsers" ? "bg-green-600 text-white" : "bg-white"}`} onClick={() => { setActiveTab("manageUsers"); setUserSearchInput(""); }}>Manage Users</button>
        </div>

        {/* Pending Approvals */}
        {activeTab === "pending" && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Pending User Approvals</h2>
            {pendingUsers.length === 0 ? <p>No pending users.</p> : pendingUsers.map(u => (
              <div key={u.id} className="bg-white p-4 rounded-xl shadow-md flex justify-between items-center mb-2">
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-gray-600">{u.email}</p>
                  <p className="text-sm text-gray-500">{u.role}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {u.shopLicense && <a href={u.shopLicense} target="_blank" rel="noreferrer" className="text-blue-600 underline">Shop License</a>}
                    {u.companyDocs && <a href={u.companyDocs} target="_blank" rel="noreferrer" className="text-blue-600 underline">Company Docs</a>}
                    {u.landDocument && <a href={u.landDocument} target="_blank" rel="noreferrer" className="text-blue-600 underline">Land Document</a>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(u.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Approve</button>
                  <button onClick={() => handleReject(u.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Reject</button>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Add Product */}
        {activeTab === "addProduct" && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Add Product</h2>
            <form onSubmit={handleAddProduct} className="bg-white p-6 rounded-xl shadow-md space-y-4 max-w-lg">
              <input type="text" placeholder="Product Name" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full border px-3 py-2 rounded" required />
              <div className="flex gap-4 items-center">
                <input type="number" placeholder="Price" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} className="border px-3 py-2 rounded w-1/2" required />
                <select value={newProduct.unit} onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })} className="border px-3 py-2 rounded w-1/2">
                  <option value="piece">Piece</option>
                  <option value="kg">Kg</option>
                  <option value="500g">500g</option>
                  <option value="250g">250g</option>
                </select>
              </div>
              
              {/* 🔄 RETAINED farmerSearchInput for this specific dropdown search (not userSearchInput) */}
              <input 
                type="text" 
                placeholder="Search Farmer by name or ID" 
                value={farmerSearchInput} 
                onChange={e => setFarmerSearchInput(e.target.value)} 
                className="w-full border px-3 py-2 rounded mb-2" 
              />
              <select 
                value={newProduct.farmerId} 
                onChange={e => setNewProduct({ ...newProduct, farmerId: e.target.value })} 
                className="w-full border px-3 py-2 rounded"
                required
              >
                <option value="">Select Farmer</option>
                {getFarmersForDropdown()
                    .filter(f => f.name?.toLowerCase().includes(farmerSearchInput.toLowerCase()) || f.id.includes(farmerSearchInput))
                    .map(f => <option key={f.id} value={f.id}>{f.name} ({f.id})</option>)}
              </select>
              
              <textarea placeholder="Description" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="w-full border px-3 py-2 rounded" />
              <div className="flex gap-2">
                {Object.keys(newProduct.badges).map(b => (
                  <label key={b} className="flex items-center gap-2">
                    <input type="checkbox" checked={newProduct.badges[b]} onChange={e => setNewProduct({ ...newProduct, badges: { ...newProduct.badges, [b]: e.target.checked } })} />
                    {b.charAt(0).toUpperCase() + b.slice(1).replace(/([A-Z])/g, " $1")}
                  </label>
                ))}
              </div>
              <div>
                <label className="font-semibold">Product Image:</label>
                <input type="file" accept="image/*" onChange={e => setNewProduct({ ...newProduct, image: e.target.files[0] })} />
              </div>
              <div>
                <label className="font-semibold">Safety Certificate:</label>
                <input type="file" accept="image/*" onChange={e => setNewProduct({ ...newProduct, safetyCertificate: e.target.files[0] })} />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={newProduct.visibleToCustomers} onChange={e => setNewProduct({ ...newProduct, visibleToCustomers: e.target.checked })} />
                Visible to Customers
              </label>
              <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">{loading ? "Adding Product..." : "Add Product"}</button>
            </form>
          </section>
        )}

        {/* Existing Products */}
        {activeTab === "existingProducts" && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Existing Products</h2>
            {products.length === 0 ? <p>No products yet.</p> :
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map(p => (
                  <div key={p.id} className="bg-white p-4 rounded-xl shadow-md">
                    <h3 className="font-bold text-lg">{p.name}</h3>
                    <p>Price: ₹{p.price} / {p.unit}</p>
                    <p className="text-sm text-gray-600">{p.description}</p>
                    <div className="flex gap-2 mt-2">{p.badges?.map(b => <span key={b} className="bg-green-200 px-2 py-1 text-xs rounded">{b}</span>)}</div>
                    <button onClick={() => toggleVisibility(p)} className={`mt-2 px-3 py-1 rounded ${p.visibleToCustomers ? "bg-red-500 text-white hover:bg-red-600" : "bg-green-600 text-white hover:bg-green-700"}`}>
                      {p.visibleToCustomers ? "Hide from Customers" : "Show to Customers"}
                    </button>
                  </div>
                ))}
              </div>
            }
          </section>
        )}

        {/* Manage Farmers (Now uses 'users' collection data) */}
        {activeTab === "manageFarmers" && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Manage Farmers</h2>
            {/* Subtabs */}
            <div className="flex gap-4 mb-6">
              <button className={`px-4 py-2 rounded ${manageFarmersSubTab === "addFarmer" ? "bg-green-600 text-white" : "bg-white"}`} onClick={() => { setManageFarmersSubTab("addFarmer"); setUserSearchInput(""); }}>Add Farmer</button>
              <button className={`px-4 py-2 rounded ${manageFarmersSubTab === "existingFarmers" ? "bg-green-600 text-white" : "bg-white"}`} onClick={() => { setManageFarmersSubTab("existingFarmers"); setUserSearchInput(""); }}>Existing Farmers</button>
            </div>

            {/* Add Farmer Subtab */}
            {manageFarmersSubTab === "addFarmer" && (
              <div className="bg-white p-6 rounded-xl shadow-md max-w-lg space-y-2">
                <input type="text" placeholder="Name" value={newFarmer.name} onChange={e => setNewFarmer({ ...newFarmer, name: e.target.value })} className="w-full border px-3 py-2 rounded" />
                <input type="email" placeholder="Email (Required)" value={newFarmer.email} onChange={e => setNewFarmer({ ...newFarmer, email: e.target.value })} className="w-full border px-3 py-2 rounded" />
                <input type="number" placeholder="Age" value={newFarmer.age} onChange={e => setNewFarmer({ ...newFarmer, age: e.target.value })} className="w-full border px-3 py-2 rounded" />
                <input type="text" placeholder="Location" value={newFarmer.location} onChange={e => setNewFarmer({ ...newFarmer, location: e.target.value })} className="w-full border px-3 py-2 rounded" />
                <input type="text" placeholder="Crops (comma separated)" value={newFarmer.crops} onChange={e => setNewFarmer({ ...newFarmer, crops: e.target.value })} className="w-full border px-3 py-2 rounded" />
                <textarea placeholder="Story" value={newFarmer.story} onChange={e => setNewFarmer({ ...newFarmer, story: e.target.value })} className="w-full border px-3 py-2 rounded" />
                <button onClick={handleAddFarmer} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700" disabled={loading}>
                    {loading ? "Adding Farmer..." : "Add Farmer"}
                </button>
              </div>
            )}

            {/* Existing Farmers Subtab */}
            {manageFarmersSubTab === "existingFarmers" && (
              <div className="bg-white p-6 rounded-xl shadow-md max-w-3xl space-y-2">
                <input 
                    type="text" 
                    placeholder="Search Farmer by name or ID..." 
                    value={userSearchInput} 
                    onChange={e => setUserSearchInput(e.target.value)} 
                    className="w-full border px-3 py-2 rounded mb-4" 
                />
                
                {allUsers
                    // Filter from allUsers where role is "Farmer"
                    .filter(u => u.role === "Farmer") 
                    .filter(u => 
                        u.name?.toLowerCase().includes(userSearchInput.toLowerCase()) || 
                        String(u.id).toLowerCase().includes(userSearchInput.toLowerCase())
                    )
                    .map(f => {
                      const cropsArray = Array.isArray(f.crops) ? f.crops : f.crops?.split(",").map(c => c.trim()).filter(c => c) || [];
                      return (
                        <div key={f.id} className="flex justify-between items-center p-2 border-b">
                          <div>
                            <p className="font-semibold">{f.name}</p>
                            <p className="text-sm text-gray-600">
                              ID: {f.id}, Location: {f.location || 'N/A'}, Crops: {cropsArray.join(", ")}
                            </p>
                            {f.approved === false && (
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending Approval</span>
                            )}
                          </div>
                          <button onClick={() => handleRemoveUser(f.id, f.name)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Remove</button>
                        </div>
                      );
                    })}
              </div>
            )}
          </section>
        )}
        
        {/* Manage Users Section */}
        {activeTab === "manageUsers" && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Manage Existing Users</h2>
            
            {/* Subtabs (Role Filter) */}
            <div className="flex gap-4 mb-6 flex-wrap">
              {allRoles.map(role => (
                <button 
                  key={role}
                  className={`px-4 py-2 rounded text-sm ${manageUsersSubTab === role ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"}`} 
                  onClick={() => {
                        setManageUsersSubTab(role);
                        setUserSearchInput("");
                    }}
                >
                  {role}s
                </button>
              ))}
            </div>

            {/* User List */}
            <div className="bg-white p-6 rounded-xl shadow-md max-w-4xl space-y-2">
              <input 
                type="text" 
                placeholder={`Search ${manageUsersSubTab} by name or ID...`} 
                value={userSearchInput} 
                onChange={e => setUserSearchInput(e.target.value)} 
                className="w-full border px-3 py-2 rounded mb-4 focus:ring-green-500" 
              />

              {allUsers
                // Filter by currently active role subtab
                .filter(u => u.role === manageUsersSubTab)
                // Filter by search input
                .filter(u => 
                  u.name?.toLowerCase().includes(userSearchInput.toLowerCase()) || 
                  u.id.toLowerCase().includes(userSearchInput.toLowerCase())
                )
                .map(u => (
                  <div key={u.id} className="flex justify-between items-center p-3 border-b hover:bg-gray-50 transition duration-100">
                    <div>
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-sm text-gray-600">Email: {u.email}</p>
                      <p className="text-xs text-gray-400">UID: {u.id}</p>
                      {/* Status badge */}
                      {u.approved === false && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending Approval</span>
                      )}
                      
                      {/* Document links */}
                      {(u.landDocument || u.shopLicense || u.companyDocs) && (
                           <div className="flex gap-2 mt-1 flex-wrap">
                               {u.shopLicense && <a href={u.shopLicense} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs">Shop License</a>}
                               {u.companyDocs && <a href={u.companyDocs} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs">Company Docs</a>}
                               {u.landDocument && <a href={u.landDocument} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs">Land Document</a>}
                           </div>
                      )}
                    </div>
                    <button 
                      onClick={() => handleRemoveUser(u.id, u.name)} 
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? "Removing..." : "Remove"}
                    </button>
                  </div>
                ))}
                
                {/* No users found message */}
                {allUsers.filter(u => u.role === manageUsersSubTab).length === 0 && (
                     <p className="text-center text-gray-500 py-4">No {manageUsersSubTab} users found.</p>
                )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}