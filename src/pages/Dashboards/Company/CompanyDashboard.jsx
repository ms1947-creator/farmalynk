// src/pages/Dashboards/Company/CompanyDashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import { collection, getDocs, doc, setDoc, updateDoc, query, where, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../../firebaseconfig";
import { onAuthStateChanged } from "firebase/auth";

// Import Tabs
import ProductsTab from "./ProductsTab";
import OfficersTab from "./OfficersTab";
import AnalyticsTab from "./AnalyticsTab";
import AppointmentsTab from "./AppointmentsTab";
import ProfileTab from "./ProfileTab";

import Navbar from "../../../components/Navbar";

export default function CompanyDashboard() {
  const [user, setUser] = useState(null);
  const [companyDoc, setCompanyDoc] = useState(null);
  const [activeTab, setActiveTab] = useState("products"); // default tab
  const [products, setProducts] = useState([]);
  const [fieldOfficers, setFieldOfficers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const retryTimer = useRef(null);
  const retryCount = useRef(0);

  // Utility: toast
  const showToast = (message, type = "success", ms = 3000) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type }), ms);
  };

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);
  
  // Realtime listener for appointments (UPDATED)
  const setupAppointmentsRealtimeListener = () => {
    // 🛑 FIX: Ensure companyDoc is available before proceeding
    if (!companyDoc?.id) return; 

    // 🛑 FIX: Query for appointments assigned to or completed by this Company's FOs
    // This relies on the appointment document having a 'companyId' field set upon acceptance.
    const appointmentsQuery = query(
      collection(db, "appointments"),
      where('companyId', '==', companyDoc.id)
    );

    try {
      const unsubscribe = onSnapshot(
        appointmentsQuery, 
        (snapshot) => {
          const fetched = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            // Use server timestamp if available, fallback to createdAt or similar
            requestedAt: doc.data().createdAt?.toDate().toLocaleString() || 'N/A', 
            // Added completedAt field parsing
            completedAt: doc.data().completedAt?.toDate().toLocaleString() || '—', 
          }));

          // sort by requestedAt descending
          fetched.sort((a, b) => {
            const ta = a.requestedAt ? Date.parse(a.requestedAt) : 0;
            const tb = b.requestedAt ? Date.parse(b.requestedAt) : 0;
            return tb - ta;
          });

          setAppointments(fetched);
          retryCount.current = 0;
        },
        (err) => {
          console.error("Appointments snapshot error:", err);
          retryCount.current += 1;
          clearTimeout(retryTimer.current);
          retryTimer.current = setTimeout(setupAppointmentsRealtimeListener, Math.min(30000, 2000 * retryCount.current));
        }
      );

      // Return the cleanup function for the listener
      return () => { 
        clearTimeout(retryTimer.current);
        unsubscribe(); 
      };
    } catch (e) {
      console.error("Failed to setup appointments listener:", e);
      clearTimeout(retryTimer.current);
      retryTimer.current = setTimeout(setupAppointmentsRealtimeListener, 5000);
    }
  };

  // --- NEW ACTION HANDLERS ---
  const handleAssignOfficer = async (appointmentId, officerUid) => {
    // 1. Get the FO's companyId (which is the Company owner's UID)
    const foCompanyId = companyDoc.id; 

    try {
        const appointmentRef = doc(db, 'appointments', appointmentId);
        await updateDoc(appointmentRef, {
            officerUid: officerUid,
            companyId: foCompanyId, // CRITICAL: Link the appointment to the company
            status: 'Accepted', 
        });
        showToast("Field Officer assigned and appointment accepted!", "success");
    } catch (error) {
        console.error("Error assigning FO:", error);
        showToast("Failed to assign officer. Check permissions and data structure.", "error");
    }
  };

  const handleRejectAppointment = async (appointmentId) => {
    try {
        const appointmentRef = doc(db, 'appointments', appointmentId);
        await updateDoc(appointmentRef, {
            status: 'Rejected',
            officerUid: null,
            companyId: null, // Clear companyId if previously set
        });
        showToast("Appointment rejected.", "warning");
    } catch (error) {
        console.error("Error rejecting appointment:", error);
        showToast("Failed to reject appointment. Check permissions.", "error");
    }
  };
  // --- END NEW ACTION HANDLERS ---

  // Ensure company doc and load data (UPDATED useEffect)
  useEffect(() => {
    if (!user) return;

    let unsubAppointments = null; // Variable to hold the listener's cleanup function

    (async () => {
      setLoading(true);
      try {
        const companyRef = doc(db, "companies", user.uid);
        const companySnap = await getDocs(query(collection(db, "companies"), where("__name__", "==", user.uid)));

        let companyExists = companySnap.docs.length > 0;
        if (!companyExists) {
          await setDoc(companyRef, {
            uid: user.uid,
            name: user.displayName || "",
            email: user.email || "",
            createdAt: serverTimestamp(),
            profile: {},
          });
          showToast("Company profile created automatically.");
        }

        const companySnapshot = await getDocs(query(collection(db, "companies"), where("__name__", "==", user.uid)));
        
        if (companySnapshot.docs.length > 0) {
          const docData = { id: companySnapshot.docs[0].id, ...companySnapshot.docs[0].data() };
          setCompanyDoc(docData);
          
          // fetch all subdata
          await fetchAllCompanyData(user.uid);
          
          // 🛑 CRITICAL FIX: Call the listener after companyDoc is set and capture cleanup
          unsubAppointments = setupAppointmentsRealtimeListener(); 
        } else {
          setCompanyDoc({ id: user.uid, uid: user.uid, name: user.displayName || "", email: user.email || "" });
        }

      } catch (err) {
        console.error("Error loading company:", err);
        showToast("Failed to initialize company dashboard", "error");
      } finally {
        setLoading(false);
      }
    })();
    
    // Return the cleanup function for useEffect
    return () => { 
        if (unsubAppointments) {
            unsubAppointments(); // Call the listener's returned cleanup function
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  
  const fetchAllCompanyData = async (companyId) => {
    await Promise.all([
      fetchProducts(companyId),
      fetchFieldOfficers(companyId),
    ]);
  };
  
  // ... (fetchProducts and fetchFieldOfficers remain the same) ...
  const fetchProducts = async (companyId) => {
    try {
      const productsCol = collection(db, "company-products", companyId, "products");
      const snap = await getDocs(productsCol);
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetching products:", err);
      setProducts([]);
    }
  };

  const fetchFieldOfficers = async (companyId) => {
    try {
      const officersCol = collection(db, "companies", companyId, "field_officers");
      const snap = await getDocs(officersCol);
      setFieldOfficers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetching officers:", err);
      setFieldOfficers([]);
    }
  };
  
  // ... (rest of the component logic) ...

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <h2 className="text-2xl font-semibold">Please log in to access company dashboard</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <Navbar />
      <div className="px-8 mt-5 py-12 max-w-6xl mx-auto">
        {/* Toast */}
        {toast.show && (
          <div className={`fixed top-6 right-6 z-50 rounded px-4 py-2 text-white ${toast.type === "error" ? "bg-red-500" : "bg-green-600"}`}>
            {toast.message}
          </div>
        )}

        <h1 className="text-3xl font-bold text-green-700 mb-6">Company Dashboard</h1>

        {/* Tabs */}
        <div className="flex gap-3 flex-wrap mb-8">
          {["products","officers","appointments","analytics","profile"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded ${activeTab===tab?"bg-green-600 text-white":"bg-white"}`}
            >
              {tab.charAt(0).toUpperCase()+tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Render Active Tab */}
        {activeTab === "products" && (
          <ProductsTab companyId={companyDoc?.id} products={products} setProducts={setProducts} showToast={showToast} />
        )}
        {activeTab === "officers" && (
          <OfficersTab companyId={companyDoc?.id} fieldOfficers={fieldOfficers} setFieldOfficers={setFieldOfficers} showToast={showToast} />
        )}
        {activeTab === "appointments" && (
          <AppointmentsTab
            companyId={companyDoc?.id}
            appointments={appointments}
            fieldOfficers={fieldOfficers}
            showToast={showToast}
            // 🛑 PASS NEW FUNCTIONS
            handleAssignOfficer={handleAssignOfficer} 
            handleRejectAppointment={handleRejectAppointment} 
          />
        )}
        {activeTab === "analytics" && (
          <AnalyticsTab products={products} fieldOfficers={fieldOfficers} appointments={appointments} />
        )}
        {activeTab === "profile" && (
          <ProfileTab companyDoc={companyDoc} user={user} />
        )}
      </div>
    </div>
  );
}