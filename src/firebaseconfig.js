import React, { useState } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../../firebaseconfig"; // ✅ Use your shared instance

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);

  // ✅ Setup reCAPTCHA
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {
            console.log("reCAPTCHA verified");
          },
        }
      );
    }
  };

  // ✅ Send OTP
  const sendOtp = async () => {
    if (!phoneNumber) return alert("Enter phone number");

    setupRecaptcha();
    const appVerifier = window.recaptchaVerifier;

    try {
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
      alert("OTP sent successfully!");
    } catch (error) {
      console.error("OTP Send Error:", error);
      alert(error.message);
    }
  };

  // ✅ Verify OTP
  const verifyOtp = async () => {
    if (!otp || !confirmationResult) return alert("Enter the OTP");
    try {
      const result = await confirmationResult.confirm(otp);
      alert("Login successful!");
      console.log("User:", result.user);
    } catch (error) {
      console.error("Verification Error:", error);
      alert("Invalid OTP");
    }
  };

  return (
    <div className="login-container">
      <h2>Phone Login</h2>

      <input
        type="tel"
        placeholder="+91XXXXXXXXXX"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
      />
      <button onClick={sendOtp}>Send OTP</button>

      {confirmationResult && (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button onClick={verifyOtp}>Verify OTP</button>
        </>
      )}

      {/* 👇 Required for reCAPTCHA */}
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default Login;
