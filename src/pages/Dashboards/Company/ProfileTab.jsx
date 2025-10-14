// src/pages/Dashboards/Company/ProfileTab.jsx
import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebaseconfig";

export default function ProfileTab({ companyDoc, user }) {
  const [profile, setProfile] = useState(companyDoc?.profile || {});
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const companyRef = doc(db, "companies", companyDoc.id);
      await updateDoc(companyRef, { profile });
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white p-6 rounded-xl shadow-md space-y-6">
      <h2 className="text-2xl font-semibold">Company Profile</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Company Name</label>
          <input
            type="text"
            value={profile.name || companyDoc.name || ""}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="border rounded px-2 py-1 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={companyDoc.email || user.email}
            readOnly
            className="border rounded px-2 py-1 w-full bg-gray-100"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Address</label>
          <input
            type="text"
            value={profile.address || ""}
            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            className="border rounded px-2 py-1 w-full"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Description</label>
          <textarea
            value={profile.description || ""}
            onChange={(e) => setProfile({ ...profile, description: e.target.value })}
            className="border rounded px-2 py-1 w-full"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
      >
        Save Profile
      </button>
    </section>
  );
}
