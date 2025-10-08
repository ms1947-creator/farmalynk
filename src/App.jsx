import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


// Pages
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import PendingApproval from "./pages/PendingApproval";
import Profile from "./pages/Profile";

// Admin
import AdminLogin from "./pages/Dashboards/Admin/AdminLogin";
import AdminSignup from "./pages/Dashboards/Admin/AdminSignup";
import AdminDashboard from "./pages/Dashboards/Admin/AdminDashboard";

// Dashboards
import CustomerDashboard from "./pages/Dashboards/Customer/CustomerDashboard";
import FarmerDashboard from "./pages/Dashboards/Farmer/FarmerDashboard";
import SellerDashboard from "./pages/Dashboards/Seller/SellerDashboard";
import OfficerDashboard from "./pages/Dashboards/FieldOfficer/OfficerDashboard";
import CompanyDashboard from "./pages/Dashboards/Company/CompanyDashboard";

// Protected routes
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedRoutes/ProtectedAdminRoute";
import AdminAuthRedirect from "./components/ProtectedRoutes/AdminAuthRedirect";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pending-approval" element={<PendingApproval />} />

        {/* 🔒 Profile Page (all authenticated users) */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Customer Dashboard */}
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Customer"]}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Farmer Dashboard */}
        <Route
          path="/farmer/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Farmer"]}>
              <FarmerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Seller / Shop Owner Dashboard */}
        <Route
          path="/seller/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Seller", "Shop Owner"]}>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Field Officer Dashboard */}
        <Route
          path="/officer/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Field Officer"]}>
              <OfficerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Company Dashboard */}
        <Route
          path="/company/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Company"]}>
              <CompanyDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Login / Signup (redirect if already logged in) */}
        <Route
          path="/farmalynk-one-admin-login"
          element={
            <AdminAuthRedirect>
              <AdminLogin />
            </AdminAuthRedirect>
          }
        />
        <Route
          path="/farmalynk-one-admin-signup"
          element={
            <AdminAuthRedirect>
              <AdminSignup />
            </AdminAuthRedirect>
          }
        />

        {/* Protected Admin Dashboard */}
        <Route
          path="/farmalynk-one-admin-dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
      </Routes>
      <ToastContainer position="top-center" autoClose={3000} />
    </Router>
  );
}

export default App;
