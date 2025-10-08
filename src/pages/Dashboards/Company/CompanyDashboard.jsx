// src/pages/Company/CompanyDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "../../../firebaseconfig"; // adjust path if needed
import Navbar from "../../../components/Navbar";
import { onAuthStateChanged } from "firebase/auth";

export default function CompanyDashboard() {
  // auth / company info
  const [user, setUser] = useState(null);
  const [companyDoc, setCompanyDoc] = useState(null);

  // tabs
  const [activeTab, setActiveTab] = useState("products"); // products | officers | appointments | analytics | profile

  // products
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    quantityLabel: "", // e.g. "100kg", "300 pieces"
    imageFile: null,
    visibleToSellers: true,
  });

  // field officers
  const [fieldOfficers, setFieldOfficers] = useState([]);
  const [newOfficer, setNewOfficer] = useState({
    name: "",
    jobRole: "",
    avatarFile: null,
    region: "",
  });

  // appointments
  const [appointments, setAppointments] = useState([]);

  // ui state
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // utility: show toast
  const showToast = (message, type = "success", ms = 3000) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type }), ms);
  };

  // ensure auth user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  // Ensure company doc exists and then load data
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        // If no companies collection doc exists for this user, create one using users/{uid} data if available
        const companyRef = doc(db, "companies", user.uid);
        const companySnap = await getDocs(query(collection(db, "companies"), where("__name__", "==", user.uid)));
        // Using getDocs above isn't strictly necessary, but we will check directly:
        const companyDocRef = doc(db, "companies", user.uid);
        let companyExists = false;
        try {
          // try get existing doc by using getDocs isn't ideal; use getDocs on doc? Instead use getDoc but import omitted earlier.
          // We'll do a safer path: try to get via getDocs filtered by __name__
          companyExists = companySnap.docs.length > 0;
        } catch (e) {
          companyExists = false;
        }

        if (!companyExists) {
          // Try to copy some fields from users/uid
          const userDocRef = doc(db, "users", user.uid);
          // We can't import getDoc earlier because you already used getDocs; but to keep consistent we will attempt to set a minimal company doc.
          await setDoc(companyDocRef, {
            uid: user.uid,
            name: user.displayName || "",
            email: user.email || "",
            createdAt: serverTimestamp(),
            // defaults
            profile: {},
          });
          showToast("Company profile created automatically.");
        }

        // Load company doc (after ensure)
        const companySnapshot = await getDocs(query(collection(db, "companies"), where("__name__", "==", user.uid)));
        if (companySnapshot.docs.length > 0) {
          const c = { id: companySnapshot.docs[0].id, ...companySnapshot.docs[0].data() };
          setCompanyDoc(c);
        } else {
          // fallback: load direct doc (if rules allow)
          // create lightweight object
          setCompanyDoc({ id: user.uid, uid: user.uid, name: user.displayName || "", email: user.email || "" });
        }

        // fetch company-related items
        await fetchAllCompanyData(user.uid);
      } catch (err) {
        console.error("Error ensuring/loading company:", err);
        showToast("Failed to initialize company dashboard", "error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // fetch all subdata
  const fetchAllCompanyData = async (companyId) => {
    await Promise.all([fetchProducts(companyId), fetchFieldOfficers(companyId), fetchAppointments(companyId)]);
  };

  // Storage upload helper
  const uploadFile = async (file, path) => {
    if (!file) return "";
    const fileRef = ref(storage, `${path}_${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    return url;
  };

  // -------------------------
  // Products CRUD
  // -------------------------
  const fetchProducts = async (companyId = user?.uid) => {
    if (!companyId) return;
    try {
      const productsCol = collection(db, "company-products", companyId, "products");
      const snap = await getDocs(productsCol);
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProducts(arr);
    } catch (err) {
      console.error("Error fetching products:", err);
      setProducts([]);
    }
  };

  const handleAddProduct = async (e) => {
    e?.preventDefault?.();
    if (!newProduct.name || !newProduct.quantityLabel) return showToast("Name and quantity required", "error");
    setLoading(true);
    try {
      const companyId = user.uid;
      // upload image if given
      let imageUrl = "";
      if (newProduct.imageFile) {
        imageUrl = await uploadFile(newProduct.imageFile, `company-products/${companyId}/images`);
      }

      const productData = {
        name: newProduct.name,
        description: newProduct.description || "",
        price: newProduct.price ? parseFloat(newProduct.price) : 0,
        quantityLabel: newProduct.quantityLabel,
        image: imageUrl || "",
        visibleToSellers: !!newProduct.visibleToSellers,
        createdAt: serverTimestamp(),
      };

      const productsCol = collection(db, "company-products", companyId, "products");
      await addDoc(productsCol, productData);

      // reset
      setNewProduct({
        name: "",
        description: "",
        price: "",
        quantityLabel: "",
        imageFile: null,
        visibleToSellers: true,
      });
      await fetchProducts(companyId);
      showToast("Product added successfully");
    } catch (err) {
      console.error("Error adding product:", err);
      showToast("Failed to add product", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      const companyId = user.uid;
      await deleteDoc(doc(db, "company-products", companyId, "products", productId));
      await fetchProducts(companyId);
      showToast("Product removed");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete product", "error");
    }
  };

  // -------------------------
  // Field Officers CRUD
  // -------------------------
  const fetchFieldOfficers = async (companyId = user?.uid) => {
    if (!companyId) return;
    try {
      const officersCol = collection(db, "companies", companyId, "field_officers");
      const snap = await getDocs(officersCol);
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFieldOfficers(arr);
    } catch (err) {
      console.error("Error fetching officers:", err);
      setFieldOfficers([]);
    }
  };

  // compute company index to generate empId base: (index+1)*100
  const computeCompanyIndex = async (companyId) => {
    // get all companies ordered by createdAt
    try {
      const companiesSnap = await getDocs(collection(db, "companies"));
      // create array of ids in insertion order if createdAt available otherwise order is DB default
      const companies = companiesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // try to sort by createdAt if available
      companies.sort((a, b) => {
        const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? Date.parse(a.createdAt) : 0);
        const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? Date.parse(b.createdAt) : 0);
        return ta - tb;
      });
      const index = companies.findIndex((c) => c.id === companyId);
      return index >= 0 ? index : companies.length; // fallback
    } catch (err) {
      console.error("Error computing company index:", err);
      return 0;
    }
  };

  const handleAddFieldOfficer = async (e) => {
    e?.preventDefault?.();
    if (!newOfficer.name || !newOfficer.jobRole) return showToast("Officer name & role required", "error");
    setLoading(true);
    try {
      const companyId = user.uid;

      // compute employee id
      const companyIndex = await computeCompanyIndex(companyId);
      const base = (companyIndex + 1) * 100;
      // count existing officers for this company to get next number
      const officersCol = collection(db, "companies", companyId, "field_officers");
      const snap = await getDocs(officersCol);
      const nextSeq = snap.docs.length + 1; // e.g. 1 => base+1 => 101
      const empId = base + nextSeq;

      // upload avatar if provided
      let avatarUrl = "";
      if (newOfficer.avatarFile) {
        avatarUrl = await uploadFile(newOfficer.avatarFile, `companies/${companyId}/field_officers`);
      }

      const officerData = {
        name: newOfficer.name,
        jobRole: newOfficer.jobRole,
        region: newOfficer.region || "",
        empId,
        avatar: avatarUrl || "",
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "companies", companyId, "field_officers"), officerData);

      setNewOfficer({ name: "", jobRole: "", avatarFile: null, region: "" });
      await fetchFieldOfficers(companyId);
      showToast(`Field officer added (ID: ${empId})`);
    } catch (err) {
      console.error("Error adding officer:", err);
      showToast("Failed to add officer", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOfficer = async (officerId) => {
    if (!window.confirm("Remove this field officer?")) return;
    try {
      const companyId = user.uid;
      await deleteDoc(doc(db, "companies", companyId, "field_officers", officerId));
      await fetchFieldOfficers(companyId);
      showToast("Field officer removed");
    } catch (err) {
      console.error(err);
      showToast("Failed to remove officer", "error");
    }
  };

  // -------------------------
  // Appointments
  // -------------------------
  const fetchAppointments = async (companyId = user?.uid) => {
    if (!companyId) return;
    try {
      const col = collection(db, "companies", companyId, "appointments");
      const snap = await getDocs(col);
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // sort by requestedAt
      arr.sort((a, b) => {
        const ta = a.requestedAt?.toMillis ? a.requestedAt.toMillis() : (a.requestedAt ? Date.parse(a.requestedAt) : 0);
        const tb = b.requestedAt?.toMillis ? b.requestedAt.toMillis() : (b.requestedAt ? Date.parse(b.requestedAt) : 0);
        return tb - ta;
      });
      setAppointments(arr);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setAppointments([]);
    }
  };

  // farmer requests are supposed to be created elsewhere by farmers:
  // structure expected:
  // { farmerId, farmerName, desiredDate, region, message, status: "pending", requestedAt }
  const handleAcceptAppointment = async (appointmentId, officerId = null) => {
    try {
      const companyId = user.uid;
      const apptRef = doc(db, "companies", companyId, "appointments", appointmentId);
      let updatePayload = { status: "accepted", acceptedAt: serverTimestamp() };
      if (officerId) {
        // fetch officer name
        const officerSnap = await getDocs(collection(db, "companies", companyId, "field_officers"));
        const found = officerSnap.docs.find((d) => d.id === officerId);
        if (found) {
          updatePayload.assignedFieldOfficerId = officerId;
          updatePayload.assignedFieldOfficerName = found.data().name;
        }
      }
      await updateDoc(apptRef, updatePayload);
      await fetchAppointments(companyId);
      showToast("Appointment accepted");
    } catch (err) {
      console.error(err);
      showToast("Failed to accept appointment", "error");
    }
  };

  const handleRejectAppointment = async (appointmentId) => {
    try {
      const companyId = user.uid;
      const apptRef = doc(db, "companies", companyId, "appointments", appointmentId);
      await updateDoc(apptRef, { status: "rejected", rejectedAt: serverTimestamp() });
      await fetchAppointments(companyId);
      showToast("Appointment rejected");
    } catch (err) {
      console.error(err);
      showToast("Failed to reject appointment", "error");
    }
  };

  const handleMarkVisited = async (appointmentId) => {
    try {
      const companyId = user.uid;
      const apptRef = doc(db, "companies", companyId, "appointments", appointmentId);
      await updateDoc(apptRef, { status: "completed", visitedAt: serverTimestamp() });
      await fetchAppointments(companyId);
      showToast("Marked visited/completed");
    } catch (err) {
      console.error(err);
      showToast("Failed to mark visited", "error");
    }
  };

  // -------------------------
  // Analytics & Profile small helpers
  // -------------------------
  const stats = {
    totalProducts: products.length,
    totalOfficers: fieldOfficers.length,
    pendingAppointments: appointments.filter((a) => a.status === "pending").length,
    acceptedAppointments: appointments.filter((a) => a.status === "accepted").length,
    completedAppointments: appointments.filter((a) => a.status === "completed").length,
  };

  // -------------------------
  // UI rendering
  // -------------------------
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold">Please log in to access company dashboard</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <Navbar />
      <div className="px-8 py-12 max-w-6xl mx-auto">
        {/* Toast */}
        {toast.show && (
          <div className={`fixed top-6 right-6 z-50 rounded px-4 py-2 text-white ${toast.type === "error" ? "bg-red-500" : "bg-green-600"}`}>
            {toast.message}
          </div>
        )}

        <h1 className="text-3xl font-bold text-green-700 mb-6">Company Dashboard</h1>

        {/* Tabs */}
        <div className="flex gap-3 flex-wrap mb-8">
          <button onClick={() => setActiveTab("products")} className={`px-4 py-2 rounded ${activeTab === "products" ? "bg-green-600 text-white" : "bg-white"}`}>Products</button>
          <button onClick={() => setActiveTab("officers")} className={`px-4 py-2 rounded ${activeTab === "officers" ? "bg-green-600 text-white" : "bg-white"}`}>Field Officers</button>
          <button onClick={() => setActiveTab("appointments")} className={`px-4 py-2 rounded ${activeTab === "appointments" ? "bg-green-600 text-white" : "bg-white"}`}>Appointments</button>
          <button onClick={() => setActiveTab("analytics")} className={`px-4 py-2 rounded ${activeTab === "analytics" ? "bg-green-600 text-white" : "bg-white"}`}>Analytics</button>
          <button onClick={() => setActiveTab("profile")} className={`px-4 py-2 rounded ${activeTab === "profile" ? "bg-green-600 text-white" : "bg-white"}`}>Profile</button>
        </div>

        {/* PRODUCTS TAB */}
        {activeTab === "products" && (
          <section className="bg-white p-6 rounded-xl shadow-md space-y-6">
            <h2 className="text-2xl font-semibold mb-2">Products (visible to sellers only)</h2>

            {/* Add product */}
            <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Product name" className="border px-3 py-2 rounded" />
              <input value={newProduct.quantityLabel} onChange={(e) => setNewProduct({ ...newProduct, quantityLabel: e.target.value })} placeholder="Quantity label (e.g. 100kg, 300 pieces)" className="border px-3 py-2 rounded" />
              <input value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="Price (optional)" className="border px-3 py-2 rounded" />
              <input type="file" accept="image/*" onChange={(e) => setNewProduct({ ...newProduct, imageFile: e.target.files?.[0] || null })} className="border px-3 py-2 rounded" />
              <textarea value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Description" className="border px-3 py-2 rounded md:col-span-2" />
              <label className="flex items-center gap-2 md:col-span-2">
                <input type="checkbox" checked={newProduct.visibleToSellers} onChange={(e) => setNewProduct({ ...newProduct, visibleToSellers: e.target.checked })} />
                Visible to Sellers
              </label>
              <div className="md:col-span-2 flex gap-3">
                <button disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded" type="submit">{loading ? "Adding..." : "Add Product"}</button>
                <button type="button" className="px-4 py-2 rounded border" onClick={() => {
                  setNewProduct({ name: "", description: "", price: "", quantityLabel: "", imageFile: null, visibleToSellers: true });
                }}>Reset</button>
              </div>
            </form>

            {/* Existing products */}
            <div>
              {products.length === 0 ? (
                <p className="text-gray-600">No products yet.</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {products.map((p) => (
                    <div key={p.id} className="p-4 border rounded flex gap-4 items-start">
                      <div className="w-28 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">No Image</div>}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{p.name}</h3>
                        <p className="text-sm text-gray-600">{p.description}</p>
                        <div className="text-sm text-gray-700 mt-1">Quantity: {p.quantityLabel}</div>
                        <div className="text-sm text-gray-700">Price: {p.price || "—"}</div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => handleDeleteProduct(p.id)} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* FIELD OFFICERS TAB */}
        {activeTab === "officers" && (
          <section className="bg-white p-6 rounded-xl shadow-md space-y-6">
            <h2 className="text-2xl font-semibold">Field Officers</h2>

            {/* Add officer */}
            <form onSubmit={handleAddFieldOfficer} className="grid md:grid-cols-3 gap-4 items-end">
              <input value={newOfficer.name} onChange={(e) => setNewOfficer({ ...newOfficer, name: e.target.value })} placeholder="Officer name" className="border px-3 py-2 rounded" />
              <input value={newOfficer.jobRole} onChange={(e) => setNewOfficer({ ...newOfficer, jobRole: e.target.value })} placeholder="Job role" className="border px-3 py-2 rounded" />
              <input value={newOfficer.region} onChange={(e) => setNewOfficer({ ...newOfficer, region: e.target.value })} placeholder="Region / Location" className="border px-3 py-2 rounded" />
              <input type="file" accept="image/*" onChange={(e) => setNewOfficer({ ...newOfficer, avatarFile: e.target.files?.[0] || null })} className="border px-3 py-2 rounded" />
              <div className="md:col-span-3 flex gap-3">
                <button disabled={loading} type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Add Officer</button>
                <button type="button" onClick={() => setNewOfficer({ name: "", jobRole: "", avatarFile: null, region: "" })} className="px-4 py-2 border rounded">Reset</button>
              </div>
            </form>

            {/* existing */}
            <div>
              {fieldOfficers.length === 0 ? <p className="text-gray-600">No field officers yet.</p> : (
                <div className="grid md:grid-cols-2 gap-4">
                  {fieldOfficers.map((o) => (
                    <div key={o.id} className="p-4 border rounded flex items-center gap-4">
                      <div className="w-20 h-20 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                        {o.avatar ? <img src={o.avatar} alt={o.name} className="w-full h-full object-cover" /> : <div className="text-sm text-gray-400">No Avatar</div>}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-semibold">{o.name} <span className="text-sm text-gray-500">({o.empId})</span></h3>
                          <div className="text-sm text-gray-600">{o.region}</div>
                        </div>
                        <div className="text-sm text-gray-600">{o.jobRole}</div>
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => handleDeleteOfficer(o.id)} className="px-3 py-1 bg-red-500 text-white rounded">Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* APPOINTMENTS TAB */}
        {activeTab === "appointments" && (
          <section className="bg-white p-6 rounded-xl shadow-md space-y-6">
            <h2 className="text-2xl font-semibold">Appointments</h2>
            <p className="text-sm text-gray-600">Farmer requests (farmers send requests to companies via their flow). You can accept, assign a field officer, reject, or mark as completed.</p>

            <div>
              {appointments.length === 0 ? <p className="text-gray-600">No appointment requests.</p> : (
                <div className="space-y-4">
                  {appointments.map((a) => (
                    <div key={a.id} className="p-4 border rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{a.farmerName} <span className="text-sm text-gray-500">({a.farmerId})</span></h3>
                          <p className="text-sm text-gray-600">Requested date: {a.desiredDate || "—"}</p>
                          <p className="text-sm text-gray-600">Region: {a.region || "—"}</p>
                          <p className="text-sm mt-2">{a.message}</p>
                          <div className="text-xs text-gray-500 mt-2">Status: <strong>{a.status}</strong></div>
                          {a.assignedFieldOfficerName && <div className="text-xs text-gray-500">Assigned: {a.assignedFieldOfficerName}</div>}
                        </div>

                        <div className="flex flex-col gap-2">
                          {a.status === "pending" && (
                            <>
                              <button onClick={() => handleAcceptAppointment(a.id)} className="px-3 py-1 bg-green-600 text-white rounded">Accept</button>

                              {/* assign to officer */}
                              {fieldOfficers.length > 0 && (
                                <select onChange={(e) => handleAcceptAppointment(a.id, e.target.value)} defaultValue="" className="border rounded px-2 py-1">
                                  <option value="">Assign officer…</option>
                                  {fieldOfficers.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.empId})</option>)}
                                </select>
                              )}

                              <button onClick={() => handleRejectAppointment(a.id)} className="px-3 py-1 bg-red-500 text-white rounded">Reject</button>
                            </>
                          )}

                          {a.status === "accepted" && (
                            <>
                              <button onClick={() => handleMarkVisited(a.id)} className="px-3 py-1 bg-blue-600 text-white rounded">Mark Visited</button>
                            </>
                          )}

                          {a.status === "completed" && <div className="text-sm text-green-600">Completed</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <section className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold">Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="p-4 bg-green-50 rounded shadow">
                <div className="text-sm text-gray-600">Products</div>
                <div className="text-2xl font-semibold">{stats.totalProducts}</div>
              </div>
              <div className="p-4 bg-green-50 rounded shadow">
                <div className="text-sm text-gray-600">Field Officers</div>
                <div className="text-2xl font-semibold">{stats.totalOfficers}</div>
              </div>
              <div className="p-4 bg-green-50 rounded shadow">
                <div className="text-sm text-gray-600">Pending Appointments</div>
                <div className="text-2xl font-semibold">{stats.pendingAppointments}</div>
              </div>
              <div className="p-4 bg-green-50 rounded shadow">
                <div className="text-sm text-gray-600">Completed Visits</div>
                <div className="text-2xl font-semibold">{stats.completedAppointments}</div>
              </div>
            </div>
          </section>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <section className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-semibold">Company Profile</h2>
            <div className="mt-4">
              <p><strong>Company ID:</strong> {companyDoc?.id || user.uid}</p>
              <p><strong>Name:</strong> {companyDoc?.name || user.displayName}</p>
              <p><strong>Email:</strong> {companyDoc?.email || user.email}</p>
              <p className="text-sm text-gray-600 mt-2">If needed, you can update more profile details in the companies collection (edit feature can be added here).</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
