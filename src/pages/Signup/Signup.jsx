import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
// NOTE: Firebase Storage imports are REMOVED to avoid using storage buckets
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
// NOTE: 'storage' import from firebaseconfig is REMOVED
import { auth, db, googleProvider } from "../../firebaseconfig";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";
import "react-toastify/dist/ReactToastify.css";

const roles = ["Customer", "Farmer", "Seller", "Field Officer", "Company"];

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    landDocument: null,
    shopLicense: null,
    companyDocs: null,
    employeeId: "",
    website: "",
    location: "",
    productList: "",
    employeeInfo: "",
  });
  const [loading, setLoading] = useState(false);
  const [googleData, setGoogleData] = useState({ active: false, user: null });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) setFormData({ ...formData, [name]: files[0] });
    else setFormData({ ...formData, [name]: value });
  };

  // 1. NEW FUNCTION: Converts file to Base64 string
  const fileToBase64 = (file) => {
    if (!file) return Promise.resolve(null);

    // 🛑 WARNING: Files over ~1MB will cause a Firestore error.
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file); // Reads the file as a Data URL (Base64)
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => {
        console.error("File to Base64 error:", error);
        reject(error);
      };
    });
  };

  // 2. UPDATED FUNCTION: Stores Base64 strings in Firestore
  const saveUserToFirestore = async (user, role, files = {}) => {
    // Convert files to Base64 strings (Data URLs)
    const landDocBase64 = await fileToBase64(files.landDocument);
    const shopLicenseBase64 = await fileToBase64(files.shopLicense);
    const companyDocsBase64 = await fileToBase64(files.companyDocs);

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: user.displayName || formData.name,
      email: user.email,
      role,
      approved: role === "Customer",
      // Storing Base64 Data URLs instead of Storage URLs
      landDocument: landDocBase64,
      shopLicense: shopLicenseBase64,
      companyDocs: companyDocsBase64,
      employeeId: formData.employeeId || "",
      website: formData.website || "",
      location: formData.location || "",
      productList: formData.productList || "",
      employeeInfo: formData.employeeInfo || "",
      createdAt: new Date().toISOString(),
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { name, email, password, role } = formData;
    if (!name || !email || !password || !role) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        toast.error("Email already in use. Try logging in instead.");
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      
      // Pass formData (which includes file objects) to saveUserToFirestore
      await saveUserToFirestore(user, role, formData);

      toast.success(
        role === "Customer"
          ? "Signup successful! Redirecting to login..."
          : "Signup request submitted! Admin approval required."
      );
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setGoogleData({ active: true, user });
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  const handleGoogleDataSubmit = async (e) => {
    e.preventDefault();
    if (!formData.role) {
      toast.error("Please select a role");
      return;
    }
    setLoading(true);
    try {
      // Pass formData (which includes file objects) to saveUserToFirestore
      await saveUserToFirestore(googleData.user, formData.role, formData);
      toast.success(
        formData.role === "Customer"
          ? "Google signup successful! Redirecting to login..."
          : "Google signup request submitted! Admin approval required."
      );
      setTimeout(() => navigate("/login"), 2000);
      setGoogleData({ active: false, user: null });
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderRoleFiles = () => {
    switch (formData.role) {
      case "Farmer":
        return (
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Land Document (optional)</label>
            <input type="file" name="landDocument" onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500"/>
          </div>
        );
      case "Seller":
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Shop License</label>
              <input type="file" name="shopLicense" onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Company Documents</label>
              <input type="file" name="companyDocs" onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500"/>
            </div>
          </>
        );
      case "Field Officer":
        return (
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Employee ID</label>
            <input type="text" name="employeeId" placeholder="Enter Employee ID" onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500"/>
          </div>
        );
      case "Company":
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Website</label>
              <input type="text" name="website" placeholder="Company Website" onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Location</label>
              <input type="text" name="location" placeholder="Location" onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Product List</label>
              <textarea name="productList" placeholder="Products offered" onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Employee Info</label>
              <input type="text" name="employeeInfo" placeholder="Employee info" onChange={handleChange} className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500"/>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-100 via-emerald-200 to-green-300 py-20">
      <div className="fixed top-0 left-0 w-full z-50 shadow-md bg-white">
        <Navbar />
      </div>

      <motion.div
        className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md mt-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold text-center text-green-700 mb-6">
          Create Account
        </h2>

        {!googleData.active ? (
          <>
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Full Name</label>
                <input type="text" name="name" placeholder="Enter full name" onChange={handleChange} className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
                <input type="email" name="email" placeholder="Enter email" onChange={handleChange} className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
                <input type="password" name="password" placeholder="Enter password" onChange={handleChange} className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Role</label>
                <select name="role" onChange={handleChange} className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Select Role</option>
                  {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {renderRoleFiles()}

              <button type="submit" disabled={loading} className="w-full bg-green-600 text-white font-semibold py-2 rounded-md hover:bg-green-700 transition-all">
                {loading ? "Creating Account..." : "Sign Up"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-3">or sign up with</p>
              <button onClick={handleGoogleSignup} className="w-full border border-gray-400 py-2 rounded-md hover:bg-gray-100 flex items-center justify-center gap-2">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" alt="Google" className="w-5 h-5"/>
                Sign up with Google
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleGoogleDataSubmit} className="space-y-4">
            <p className="text-center text-gray-700 mb-4">Welcome {googleData.user.displayName}, complete your signup</p>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Role</label>
              <select name="role" onChange={handleChange} className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Select Role</option>
                {roles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {renderRoleFiles()}
            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white font-semibold py-2 rounded-md hover:bg-green-700 transition-all">
              {loading ? "Completing Signup..." : "Complete Signup"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-gray-700 text-sm">
          Already have an account?{" "}
          <span className="text-green-700 font-semibold cursor-pointer hover:underline" onClick={() => navigate("/login")}>Login</span>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;