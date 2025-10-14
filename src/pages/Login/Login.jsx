// Login.jsx
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, db, googleProvider } from "../../firebaseconfig";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const redirectBasedOnRole = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role;
        // Admin has hidden access, others based on role
        if (role === "Customer") navigate("/customer/dashboard");
        else if (role === "Farmer") navigate("/farmer/dashboard");
        else if (role === "Seller") navigate("/seller/dashboard");
        else if (role === "Company") navigate("/company/dashboard");
        else if (role === "Field Officer") navigate("/field-officer/dashboard");
        else navigate("/"); // fallback
      } else {
        toast.error("User data not found!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching user role");
    }
  };

const handleEmailLogin = async (e) => {
    e.preventDefault();
    const { email, password } = formData;
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      // FIX: Trim the inputs before sending to Firebase
      const emailTrimmed = email.trim();
      const passwordTrimmed = password.trim(); 

      const userCredential = await signInWithEmailAndPassword(auth, emailTrimmed, passwordTrimmed);
      toast.success("Login successful!");
      await redirectBasedOnRole(userCredential.user.uid);
    } catch (err) {
      console.error(err);
      // IMPROVEMENT: Give a more user-friendly error
      const errorMessage = err.code === 'auth/invalid-credential' 
        ? "Invalid email or password." 
        : err.message;
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        // Create default Customer entry if first-time Google login
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          role: "Customer",
          approved: true,
          createdAt: new Date().toISOString(),
        });
      }

      toast.success("Google login successful!");
      await redirectBasedOnRole(user.uid);
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-100 via-emerald-200 to-green-300 py-20">
      <div className="fixed top-0 left-0 w-full z-50 shadow-md bg-white">
        <Navbar />
      </div>

      <motion.div
        className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md mt-20"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold text-center text-green-700 mb-6">
          Login
        </h2>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter email"
              className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white font-semibold py-2 rounded-md hover:bg-green-700 transition-all"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-3">or login with</p>
          <button
            onClick={handleGoogleLogin}
            className="w-full border border-gray-400 py-2 rounded-md hover:bg-gray-100 flex items-center justify-center gap-2"
          >
            <img
              src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Login with Google
          </button>
        </div>

        <p className="mt-6 text-center text-gray-700 text-sm">
          Don't have an account?{" "}
          <span
            className="text-green-700 font-semibold cursor-pointer hover:underline"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </span>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
