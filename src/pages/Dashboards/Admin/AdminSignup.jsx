import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { auth, db } from "../../../firebaseconfig";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function AdminSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name required";
    if (!formData.email.trim()) newErrors.email = "Email required";
    if (!formData.password.trim()) newErrors.password = "Password required";
    if (formData.password && formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // 🔹 Create admin in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const uid = userCredential.user.uid;

      // Set displayName
      try {
        await updateProfile(userCredential.user, { displayName: formData.name });
      } catch (profileErr) {
        console.warn("updateProfile failed:", profileErr);
      }

      // 🔹 Save admin in `admins` collection (creates automatically if not exists)
      const adminData = {
        uid,
        name: formData.name,
        email: formData.email,
        role: "admin",
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, "admins", uid), adminData);

      alert("Admin account created successfully! Please login.");
      navigate("/farmalynk-one-admin-login");
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF7]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-4">
          <h2 className="text-2xl font-bold text-green-700 text-center">Admin Sign Up</h2>
          <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-green-300" />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-green-300" />
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-green-300" />
          {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
          <button type="submit" disabled={loading} className={`w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}>
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
