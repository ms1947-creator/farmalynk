import React from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";

export function SafetyCertificate({ url, onClose }) {
  if (!url) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}> //
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-6 rounded-xl max-w-xl w-full shadow-2xl relative" //
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4 border-b pb-2"> //
          <h2 className="text-xl font-bold text-gray-800">Safety Certificate</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 transition"
            aria-label="Close certificate view"
          >
            <FaTimes size={20} /> //
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          <img src={url} alt="Safety Certificate" className="w-full h-auto rounded-lg border border-gray-200" />
        </div>
      </motion.div>
    </div>
  );
}