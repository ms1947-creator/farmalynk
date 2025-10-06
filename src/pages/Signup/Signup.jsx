// src/pages/Signup/Signup.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebaseconfig"; // Make sure this exports Firebase 12 auth
import {
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ emailOrPhone: "", password: "" });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        "sign-up-button",
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
      alert("OTP sent!");
    } catch (err) {
      setError(err.message);
    }
  };

  const verifyOtpAndSignup = async () => {
    try {
      await window.confirmationResult.confirm(otp);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (formData.emailOrPhone.startsWith("+")) {
        if (!otpSent) await sendOtp();
        else await verifyOtpAndSignup();
      } else {
        await createUserWithEmailAndPassword(auth, formData.emailOrPhone, formData.password);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-80 space-y-4">
        <h2 className="text-xl font-bold text-center">Sign Up</h2>

        <input
          type="text"
          name="emailOrPhone"
          placeholder="Email or Phone (+91...)"
          value={formData.emailOrPhone}
          onChange={(e) => setFormData({ ...formData, emailOrPhone: e.target.value })}
          className="w-full border px-3 py-2 rounded"
        />

        {!formData.emailOrPhone.startsWith("+") && (
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full border px-3 py-2 rounded"
          />
        )}

        {otpSent && formData.emailOrPhone.startsWith("+") && (
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          id="sign-up-button"
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded"
        >
          {loading ? "Processing..." : otpSent ? "Verify OTP" : "Sign Up"}
        </button>
      </form>
    </div>
  );
}
