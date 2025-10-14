import React from "react";
import { motion } from "framer-motion";
import { FaEdit, FaSignOutAlt, FaSave, FaTimes } from "react-icons/fa";

export function Profile({
  name,
  email,
  phone,
  editingProfile,
  setName,
  setEmail,
  setPhone,
  setEditingProfile,
  saveProfile,
  logout,
}) {
  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow-lg"
    >
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
        My Profile
      </h2>
      <div className="space-y-4">
        {editingProfile ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email (Read-only)</label>
              <input
                type="email"
                value={email}
                readOnly
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <motion.button
                onClick={saveProfile}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <FaSave /> Save Profile
              </motion.button>
              <motion.button
                onClick={() => setEditingProfile(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition flex items-center justify-center gap-2"
              >
                <FaTimes /> Cancel
              </motion.button>
            </div>
          </>
        ) : (
          <>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="text-lg font-semibold text-gray-900">{name || "N/A"}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-lg font-semibold text-gray-900">{email || "N/A"}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p className="text-lg font-semibold text-gray-900">{phone || "N/A"}</p>
            </div>

            <div className="pt-4 space-y-3">
              <motion.button
                onClick={() => setEditingProfile(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <FaEdit /> Edit Profile
              </motion.button>
              <motion.button
                onClick={logout}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-red-500 text-white px-4 py-2 rounded-lg w-full font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2"
              >
                <FaSignOutAlt /> Log Out
              </motion.button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}