// src/pages/Signup/Signup.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAuth,
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { auth } from "../../firebaseconfig";

const Signup = () => {
  const navigate = useNavigate();

  // Toggle between email and phone signup
  const [method, setMethod] = useState("email"); // "email" | "phone"

  // Email/password states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone/OTP states
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Initialize visible reCAPTCHA
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        "recaptcha-container",
        {
          size: "normal", // visible widget
          callback: () => console.log("reCAPTCHA solved"),
          "expired-callback": () => alert("reCAPTCHA expired, please retry"),
        },
        auth
      );
    }
  };

  useEffect(() => {
    if (method === "phone") setupRecaptcha();
  }, [method]);

  // Email signup
  const handleEmailSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      alert("Email signup successful! Redirecting to login...");
      navigate("/login");
    } catch (error) {
      alert(error.message);
    }
  };

  // Send OTP
  const sendOtp = async () => {
    if (!phone) return alert("Enter phone number first");
    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(confirmation);
      alert("OTP sent to your phone!");
    } catch (error) {
      alert(error.message);
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    if (!otp || !confirmationResult) return alert("Enter OTP first");
    try {
      const result = await confirmationResult.confirm(otp);
      alert("Phone signup successful! Redirecting to login...");
      navigate("/login");
    } catch (error) {
      alert("Invalid OTP. Try again.");
    }
  };

  return (
    <div className="signup-container">
      <h2>Sign Up</h2>

      {/* Method toggle */}
      <div>
        <button
          onClick={() => setMethod("email")}
          style={{ fontWeight: method === "email" ? "bold" : "normal" }}
        >
          Email
        </button>
        <button
          onClick={() => setMethod("phone")}
          style={{ fontWeight: method === "phone" ? "bold" : "normal" }}
        >
          Phone
        </button>
      </div>

      {method === "email" && (
        <form onSubmit={handleEmailSignup} style={{ marginTop: "20px" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Sign Up with Email</button>
        </form>
      )}

      {method === "phone" && (
        <div style={{ marginTop: "20px" }}>
          <input
            type="tel"
            placeholder="+911234567890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button onClick={sendOtp}>Send OTP</button>

          <div id="recaptcha-container" style={{ marginTop: "10px" }}></div>

          {confirmationResult && (
            <div style={{ marginTop: "10px" }}>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button onClick={verifyOtp}>Verify OTP</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Signup;
