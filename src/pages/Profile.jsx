import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { auth, db, storage } from "../firebaseconfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { RecaptchaVerifier, signInWithPhoneNumber, updateEmail, updatePassword } from "firebase/auth";

export default function Profile() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    emailOrPhone: "",
    website: "",
    location: "",
    productList: "",
    employeeInfo: "",
    employeeId: "",
    landDocument: null,
    shopLicense: null,
    companyDocs: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }
      setCurrentUser(user);
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setFormData({
          name: data.name || "",
          emailOrPhone: data.email || "",
          website: data.website || "",
          location: data.location || "",
          productList: data.productList || "",
          employeeInfo: data.employeeInfo || "",
          employeeId: data.employeeId || "",
          landDocument: null,
          shopLicense: null,
          companyDocs: null,
        });
      }
      setLoading(false);
    };
    fetchData();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) setFormData({ ...formData, [name]: files[0] });
    else setFormData({ ...formData, [name]: value });
  };

  const validateFile = (file, maxSizeMB = 5) => {
    if (!file) return null;
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) return "Only JPEG/PNG allowed";
    if (file.size > maxSizeMB * 1024 * 1024) return `File too large, max ${maxSizeMB}MB`;
    return null;
  };

  const uploadFile = async (file, path) => {
    if (!file) return null;
    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (err) {
      console.error(`Error uploading ${file.name}:`, err);
      return null;
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier("sign-in-button", { size: "invisible" }, auth);
      window.recaptchaVerifier.render();
    }
  };

  const sendOtp = async () => {
    setupRecaptcha();
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, formData.emailOrPhone, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      setOtpSent(true);
      alert("OTP sent! Check Firebase Console for test code.");
    } catch (err) {
      console.error("Error sending OTP:", err);
      alert(err.message);
    }
  };

  const verifyOtpAndSave = async () => {
    try {
      await window.confirmationResult.confirm(otp);
      await saveProfile(); // Save after phone verification
    } catch (err) {
      console.error("OTP verification failed:", err);
      alert(err.message);
    }
  };

  const saveProfile = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      // Upload files
      const landDocUrl = await uploadFile(formData.landDocument, `users/${currentUser.uid}/landDocument`);
      const shopLicenseUrl = await uploadFile(formData.shopLicense, `users/${currentUser.uid}/shopLicense`);
      const companyDocsUrl = await uploadFile(formData.companyDocs, `users/${currentUser.uid}/companyDocs`);

      // Update Firestore
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        name: formData.name,
        email: formData.emailOrPhone,
        website: formData.website || "",
        location: formData.location || "",
        productList: formData.productList || "",
        employeeInfo: formData.employeeInfo || "",
        employeeId: formData.employeeId || "",
        landDocument: landDocUrl || undefined,
        shopLicense: shopLicenseUrl || undefined,
        companyDocs: companyDocsUrl || undefined,
      });

      // Update email in Firebase Auth if changed
      if (formData.emailOrPhone.includes("@") && formData.emailOrPhone !== currentUser.email) {
        await updateEmail(currentUser, formData.emailOrPhone);
      }

      alert("Profile updated successfully!");
      // Redirect based on role
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const role = userSnap.data().role.toLowerCase();
        navigate(`/${role}/dashboard`);
      }
    } catch (err) {
      console.error("Profile update error:", err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // If phone number changed, require OTP
    if (formData.emailOrPhone.startsWith("+") && !otpSent) {
      await sendOtp();
    } else if (otpSent) {
      await verifyOtpAndSave();
    } else {
      await saveProfile();
    }
  };

  if (loading) return <p className="text-center py-20">Loading...</p>;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF7]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-4">
          <h2 className="text-2xl font-bold text-green-700 text-center">Profile</h2>

          {/* Name */}
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-300"
          />

          {/* Email or Phone */}
          <input
            type="text"
            name="emailOrPhone"
            placeholder="Email or Phone (for phone use +91...)"
            value={formData.emailOrPhone}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-300"
          />

          {/* OTP */}
          {otpSent && formData.emailOrPhone.startsWith("+") && (
            <input
              type="text"
              name="otp"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          )}

          {/* Role-specific fields */}
          {formData.employeeId && (
            <input
              type="text"
              name="employeeId"
              placeholder="Employee ID"
              value={formData.employeeId}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          )}

          {formData.website && (
            <>
              <input
                type="text"
                name="website"
                placeholder="Website"
                value={formData.website}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-300"
              />
              <input
                type="text"
                name="location"
                placeholder="Location"
                value={formData.location}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-300"
              />
              <textarea
                name="productList"
                placeholder="Product List"
                value={formData.productList}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-300"
              />
              <input
                type="text"
                name="employeeInfo"
                placeholder="Employee Info"
                value={formData.employeeInfo}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            </>
          )}

          {/* File uploads */}
          {formData.landDocument !== undefined && (
            <input type="file" name="landDocument" onChange={handleChange} className="mt-1" />
          )}
          {formData.shopLicense !== undefined && (
            <input type="file" name="shopLicense" onChange={handleChange} className="mt-1" />
          )}
          {formData.companyDocs !== undefined && (
            <input type="file" name="companyDocs" onChange={handleChange} className="mt-1" />
          )}

          <button
            id="sign-in-button"
            type="submit"
            disabled={saving}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            {saving ? "Saving..." : otpSent ? "Verify OTP & Save" : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
