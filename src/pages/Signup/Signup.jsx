// Signup.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Firebase config (use env variables for Netlify)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", emailOrPhone: "", password: "", role: "Customer",
    website: "", location: "", productList: "", employeeInfo: "",
    employeeId: "", landDocument: null, shopLicense: null, companyDocs: null
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  // Initialize reCAPTCHA (production-safe)
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        "recaptcha-container",
        { size: "invisible" },
        auth
      );
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) setFormData({ ...formData, [name]: files[0] });
    else setFormData({ ...formData, [name]: value });
  };

  const validateFile = (file, maxSizeMB = 5) => {
    if (!file) return null;
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) return "Only JPEG/PNG allowed";
    if (file.size > maxSizeMB * 1024 * 1024)
      return `File too large, max ${maxSizeMB}MB`;
    return null;
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name required";
    if (!formData.emailOrPhone.trim()) newErrors.emailOrPhone = "Email or Phone required";
    if (!formData.password.trim() && !formData.emailOrPhone.startsWith("+"))
      newErrors.password = "Password required";

    if (formData.role === "Farmer" && formData.landDocument) {
      const err = validateFile(formData.landDocument);
      if (err) newErrors.landDocument = err;
    }
    if (formData.role === "Seller") {
      if (!formData.shopLicense) newErrors.shopLicense = "Shop license required";
      else {
        const err = validateFile(formData.shopLicense);
        if (err) newErrors.shopLicense = err;
      }
      if (!formData.companyDocs) newErrors.companyDocs = "Company docs required";
      else {
        const err = validateFile(formData.companyDocs);
        if (err) newErrors.companyDocs = err;
      }
    }
    if (formData.role === "Field Officer" && !formData.employeeId.trim())
      newErrors.employeeId = "Employee ID required";

    if (formData.role === "Company") {
      if (!formData.website.trim()) newErrors.website = "Website required";
      if (!formData.location.trim()) newErrors.location = "Location required";
      if (!formData.productList.trim()) newErrors.productList = "Product list required";
      if (!formData.employeeInfo.trim()) newErrors.employeeInfo = "Employee info required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadFile = async (file, path) => {
    if (!file) return null;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const sendOtp = async () => {
    try {
      setupRecaptcha();
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formData.emailOrPhone,
        window.recaptchaVerifier
      );
      window.confirmationResult = confirmationResult;
      setOtpSent(true);
      alert("OTP sent!");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const verifyOtpAndSignup = async () => {
    try {
      const result = await window.confirmationResult.confirm(otp);
      const user = result.user;
      await createFirestoreProfile(user.uid);
      navigateBasedOnRole();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const createFirestoreProfile = async (uid) => {
    const landDocUrl = await uploadFile(formData.landDocument, `users/${uid}/landDocument`);
    const shopLicenseUrl = await uploadFile(formData.shopLicense, `users/${uid}/shopLicense`);
    const companyDocsUrl = await uploadFile(formData.companyDocs, `users/${uid}/companyDocs`);

    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      name: formData.name,
      email: formData.emailOrPhone,
      role: formData.role,
      approved: formData.role === "Customer",
      landDocument: landDocUrl || null,
      shopLicense: shopLicenseUrl || null,
      companyDocs: companyDocsUrl || null,
      website: formData.website || "",
      location: formData.location || "",
      productList: formData.productList || "",
      employeeInfo: formData.employeeInfo || "",
      employeeId: formData.employeeId || "",
      createdAt: new Date(),
    });
  };

  const navigateBasedOnRole = () => {
    const requiresApproval = ["Farmer", "Seller", "Field Officer", "Company"];
    if (requiresApproval.includes(formData.role)) {
      navigate("/pending-approval");
    } else {
      navigate(`/${formData.role.toLowerCase()}/dashboard`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (formData.emailOrPhone.startsWith("+")) {
        if (!otpSent) await sendOtp();
        else await verifyOtpAndSignup();
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.emailOrPhone,
          formData.password
        );
        await createFirestoreProfile(userCredential.user.uid);
        navigateBasedOnRole();
      }
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
      <div id="recaptcha-container"></div> {/* ✅ production-safe recaptcha */}
      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <form className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-4" onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold text-green-700 text-center">Sign Up</h2>

          {/* Name */}
          <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-300"/>
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}

          {/* Email / Phone */}
          <input type="text" name="emailOrPhone" placeholder="Email or Phone (+91...)" value={formData.emailOrPhone} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-300"/>
          {errors.emailOrPhone && <p className="text-red-500 text-sm">{errors.emailOrPhone}</p>}

          {/* Password */}
          {!formData.emailOrPhone.startsWith("+") && (
            <>
              <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-300"/>
              {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
            </>
          )}

          {/* OTP */}
          {otpSent && formData.emailOrPhone.startsWith("+") && (
            <input type="text" name="otp" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-300"/>
          )}

          {/* Role */}
          <select name="role" value={formData.role} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-300">
            <option value="Customer">Customer</option>
            <option value="Farmer">Farmer</option>
            <option value="Seller">Seller</option>
            <option value="Company">Company</option>
            <option value="Field Officer">Field Officer</option>
          </select>

          {/* Role-based fields (Farmer, Seller, Field Officer, Company) */}
          {formData.role === "Farmer" && (
            <div>
              <label className="text-sm font-medium">Land Document (JPEG/PNG max 5MB)</label>
              <input type="file" name="landDocument" onChange={handleChange} className="mt-1"/>
              {errors.landDocument && <p className="text-red-500 text-sm">{errors.landDocument}</p>}
            </div>
          )}

          {formData.role === "Seller" && (
            <>
              <div>
                <label className="text-sm font-medium">Shop License</label>
                <input type="file" name="shopLicense" onChange={handleChange} className="mt-1"/>
                {errors.shopLicense && <p className="text-red-500 text-sm">{errors.shopLicense}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Company Documents</label>
                <input type="file" name="companyDocs" onChange={handleChange} className="mt-1"/>
                {errors.companyDocs && <p className="text-red-500 text-sm">{errors.companyDocs}</p>}
              </div>
            </>
          )}

          {formData.role === "Field Officer" && (
            <>
              <input type="text" name="employeeId" placeholder="Employee ID" value={formData.employeeId} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-300"/>
              {errors.employeeId && <p className="text-red-500 text-sm">{errors.employeeId}</p>}
            </>
          )}

          {formData.role === "Company" && (
            <>
              <input type="text" name="website" placeholder="Website" value={formData.website} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-300"/>
              {errors.website && <p className="text-red-500 text-sm">{errors.website}</p>}

              <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-300"/>
              {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}

              <textarea name="productList" placeholder="Product List" value={formData.productList} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-300"/>
              {errors.productList && <p className="text-red-500 text-sm">{errors.productList}</p>}

              <input type="text" name="employeeInfo" placeholder="Employee Info" value={formData.employeeInfo} onChange={handleChange} className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-300"/>
              {errors.employeeInfo && <p className="text-red-500 text-sm">{errors.employeeInfo}</p>}
            </>
          )}

          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
            {loading ? "Signing up..." : otpSent && formData.emailOrPhone.startsWith("+") ? "Verify OTP" : "Sign Up"}
          </button>

          <p className="text-center text-sm mt-2">
            Already have an account?{" "}
            <Link to="/login" className="text-green-700 font-semibold hover:underline">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
