import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { auth, db } from "../../firebaseconfig";
import {
  signInWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    emailOrPhone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  // 👇 Automatically redirect logged-in users
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (!userData.approved) navigate("/pending-approval");
          else navigate(`/${userData.role.toLowerCase()}/dashboard`);
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        "sign-in-button",
        { size: "invisible" },
        auth
      );
      window.recaptchaVerifier.render();
    }
  };

  const sendOtp = async () => {
    setError("");
    setupRecaptcha();
    try {
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formData.emailOrPhone,
        window.recaptchaVerifier
      );
      window.confirmationResult = confirmationResult;
      setOtpSent(true);
      alert("OTP sent! Check your phone.");
    } catch (err) {
      console.error("OTP send error:", err);
      setError(err.message);
    }
  };

  const verifyOtpAndLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await window.confirmationResult.confirm(otp);
      const user = result.user;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (!userData.approved) navigate("/pending-approval");
        else navigate(`/${userData.role.toLowerCase()}/dashboard`);
      } else {
        setError("User data not found. Please sign up first.");
      }
    } catch (err) {
      console.error("OTP verification failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (formData.emailOrPhone.startsWith("+")) {
        if (!otpSent) await sendOtp();
        else await verifyOtpAndLogin();
      } else {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          formData.emailOrPhone,
          formData.password
        );
        const uid = userCredential.user.uid;

        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (!userData.approved) navigate("/pending-approval");
          else navigate(`/${userData.role.toLowerCase()}/dashboard`);
        } else {
          setError("No user data found. Please sign up first.");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.code === "auth/user-not-found") setError("No user found with this email.");
      else if (err.code === "auth/wrong-password") setError("Incorrect password.");
      else setError(err.message || "Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF7]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-20">
        {/* Increased py-20 to give space below Navbar */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-4"
        >
          <h2 className="text-2xl font-bold text-green-700 text-center">Login</h2>

          <input
            type="text"
            name="emailOrPhone"
            placeholder="Email or Phone (for phone use +91...)"
            value={formData.emailOrPhone}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-300"
          />

          {!formData.emailOrPhone.startsWith("+") && (
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          )}

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

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            id="sign-in-button"
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            {loading
              ? "Logging in..."
              : otpSent && formData.emailOrPhone.startsWith("+")
              ? "Verify OTP"
              : "Login"}
          </button>

          <p className="text-center text-sm mt-2">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-green-700 font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
