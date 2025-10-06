import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function PendingApproval() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF7]">
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md w-full">
          <h2 className="text-3xl font-bold text-green-700 mb-4">Pending Approval</h2>
          <p className="text-gray-700 mb-6">
            Thank you for signing up! Your account is currently under review by our admin team.
          </p>
          <p className="text-gray-500 mb-6">
            You will be notified via email once your account is approved. Please check back later.
          </p>

          <div className="flex justify-center">
            <img
              src="https://res.cloudinary.com/dyvxz9dwm/image/upload/v1753768487/pending_approval_icon.png"
              alt="Pending approval"
              className="w-40 h-40"
            />
          </div>

          <p className="text-sm text-gray-500 mt-6">
            If you have questions, contact <span className="text-green-700 font-semibold">support@farmalynk.com</span>.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
