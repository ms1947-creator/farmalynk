// src/pages/Dashboards/Farmer/FarmerDashboard.jsx

import React, { useState, useEffect } from 'react';
// Import setDoc for creating profile if not found
import { db, auth } from '../../../firebaseconfig'; 
import { doc, getDoc, setDoc } from 'firebase/firestore'; 
// ... (rest of the Fa icons imports)
import { 
  FaUser, FaCalendarAlt, FaStore, FaChartLine, FaCloudSun, 
  FaHistory, FaSignOutAlt, FaSeedling, FaTachometerAlt 
} from 'react-icons/fa';
// Import all components (Ensure these paths are correct in your project)
import AppointmentSection from './components/AppointmentSection';
import SellerCatalog from './components/SellerCatalog'; 
import OrderHistory from './components/OrderHistory'; 
import ProfileEditor from './components/ProfileEditor'; 
import WeatherAdvisory from './components/WeatherAdvisory'; 
// ... (If ReviewsTab is separate)

// --- Dashboard View/Tab Configuration ---
const dashboardViews = {
  PROFILE: 'Profile & Details',
  APPOINTMENTS: 'Field Appointments',
  CATALOG: 'Browse Sellers',
  ORDERS: 'My Orders',
  ADVISORY: 'Weather & Advisory',
};

function FarmerDashboard() {
  const [currentView, setCurrentView] = useState(dashboardViews.PROFILE);
  const [farmerData, setFarmerData] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Core Data Fetching Logic (FIXED: Profile Creation/Fallback) ---
  useEffect(() => {
    const fetchFarmerData = async () => {
      if (!auth.currentUser) { 
        setLoading(false); 
        return; 
      }
      
      const userUID = auth.currentUser.uid;
      const farmerDocRef = doc(db, 'farmers', userUID);
      let dataFound = null;

      try {
        // 1. ATTEMPT 1: Fetch from 'farmers' collection (Primary Source)
        let farmerSnap = await getDoc(farmerDocRef);

        if (farmerSnap.exists()) {
          dataFound = { id: farmerSnap.id, ...farmerSnap.data() };
        } else {
          // 2. ATTEMPT 2: Check 'users' collection (Fallback)
          const userDocRef = doc(db, 'users', userUID);
          let userSnap = await getDoc(userDocRef);

          const initialData = {
            name: auth.currentUser.displayName || 'New Farmer',
            email: auth.currentUser.email || '',
            location: 'Unspecified',
            crops: [],
            isSetupComplete: false,
            createdAt: new Date().toISOString(),
          };

          if (userSnap.exists()) {
            // Found in users: use users data as initial seed for the 'farmers' profile
            console.log("Profile found in 'users'. Creating 'farmers' profile.");
            const userData = userSnap.data();
            
            // Merge users data with mandatory initial fields
            Object.assign(initialData, userData, { isFallback: true }); 
          } 
          
          // 3. Guarantee Profile: Write the (possibly seeded) initial data to the 'farmers' collection
          await setDoc(farmerDocRef, initialData, { merge: true });
          
          // Re-fetch the newly created document
          farmerSnap = await getDoc(farmerDocRef);
          dataFound = { id: farmerSnap.id, ...farmerSnap.data() };
        }

        if (dataFound) {
          setFarmerData(dataFound);
        } else {
          console.error("Critical error: Profile could not be established.");
        }

      } catch (error) {
        console.error("Error fetching or establishing farmer profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFarmerData();
  }, []); // Dependency array includes nothing to run once on mount (after auth check)

  const handleLogout = () => {
    auth.signOut();
    window.location.reload(); 
  };
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><FaSeedling className="text-green-600 animate-pulse text-4xl mr-2" /> <span className="text-xl font-medium text-gray-700">Loading Farmer Hub...</span></div>;
  }
  
  if (!farmerData) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-8">
            <h1 className="text-2xl font-bold text-red-700">Access Denied</h1>
            <p className="text-gray-600 mt-2">Could not establish a farmer profile. Please ensure proper login and database permissions.</p>
            <button onClick={handleLogout} className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow transition">
                <FaSignOutAlt className="inline mr-2" /> Log Out
            </button>
        </div>
    );
  }

  const renderView = () => {
    const farmerProps = { farmerId: farmerData.id, farmerData: farmerData };

    switch (currentView) {
      case dashboardViews.PROFILE:
        // Render ProfileEditor, which contains the logic for switching to ReviewsTab
        return <ProfileEditor {...farmerProps} />; 
      case dashboardViews.APPOINTMENTS:
        return <AppointmentSection {...farmerProps} />;
      case dashboardViews.CATALOG:
        return <SellerCatalog {...farmerProps} />; // Needs update in SellerCatalog.jsx
      case dashboardViews.ORDERS:
        return <OrderHistory {...farmerProps} />;
      case dashboardViews.ADVISORY:
        return <WeatherAdvisory {...farmerProps} />; // Needs update in WeatherAdvisory.jsx
      default:
        return <ProfileEditor {...farmerProps} />;
    }
  };

  const navItemClass = (view) => 
    // ... (Navigation styling logic remains the same)
    `flex items-center p-3 rounded-xl text-left w-full transition duration-150 ${
        currentView === view ? 'bg-green-600 text-white shadow-md font-semibold' : 'text-gray-700 hover:bg-green-50'
    }`;

  return (
    // ... (Rest of the FarmerDashboard JSX structure remains the same)
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <nav className="w-64 bg-white shadow-2xl p-4 flex flex-col space-y-2 border-r border-gray-200">
        
        {/* Logo/Title */}
        <div className="text-2xl font-extrabold text-green-700 mb-6 pb-4 border-b border-gray-100 flex items-center">
            <FaTachometerAlt className="mr-3 text-3xl" /> Farmer Hub
        </div>
        
        {/* Main Sections */}
        <button className={navItemClass(dashboardViews.PROFILE)} onClick={() => setCurrentView(dashboardViews.PROFILE)}>
          <FaUser className="mr-3 text-lg" /> Profile & Reviews
        </button>
        <button className={navItemClass(dashboardViews.APPOINTMENTS)} onClick={() => setCurrentView(dashboardViews.APPOINTMENTS)}>
          <FaCalendarAlt className="mr-3 text-lg" /> Field Appointments
        </button>
        <button className={navItemClass(dashboardViews.CATALOG)} onClick={() => setCurrentView(dashboardViews.CATALOG)}>
          <FaStore className="mr-3 text-lg" /> Browse Seller Products
        </button>
        <button className={navItemClass(dashboardViews.ORDERS)} onClick={() => setCurrentView(dashboardViews.ORDERS)}>
          <FaHistory className="mr-3 text-lg" /> My Order History
        </button>

        <h3 className="text-xs font-bold uppercase text-gray-400 pt-4 pb-2 border-t border-gray-100">Tools & Advice</h3>
        
        {/* Advanced Tools */}
        <button className={navItemClass(dashboardViews.ADVISORY)} onClick={() => setCurrentView(dashboardViews.ADVISORY)}>
          <FaCloudSun className="mr-3 text-lg" /> Weather & Advisory
        </button>
        
        {/* Logout */}
        <button onClick={handleLogout} className="mt-auto flex items-center p-3 rounded-xl text-red-600 hover:bg-red-50 transition duration-150">
            <FaSignOutAlt className="mr-3 text-lg" /> Log Out
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-10 overflow-y-auto">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-8">{currentView}</h1>
        <div className="w-full">
          {renderView()}
        </div>
      </main>
    </div>
  );
}

export default FarmerDashboard;