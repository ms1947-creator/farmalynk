import React from 'react';
import { FaStar, FaRegStar } from "react-icons/fa";

// Format currency
export const fmt = (n) => Number(n ?? 0).toFixed(2); // [cite: 96]

// Helper to normalize product base units (taken from ProductCard logic) [cite: 60]
export const normalizeBaseUnit = (rawUnit) => {
  if (!rawUnit) return { type: "kg", baseUnitAmountKg: 1 }; // [cite: 60]
  const s = rawUnit.toString().toLowerCase().trim();
  if (s.includes("piece") || s.includes("pc") || s === "piece") {
    return { type: "piece", baseUnitAmountKg: null }; // [cite: 61, 62]
  }
  const gramsMatch = s.match(/(\d+)\s*g/); // [cite: 62]
  if (gramsMatch) {
    const grams = parseFloat(gramsMatch[1]); // [cite: 63]
    return { type: "kg", baseUnitAmountKg: grams / 1000 }; // [cite: 64]
  }
  const kgMatch = s.match(/(\d+(\.\d+)?)\s*kg/); // [cite: 64]
  if (kgMatch) {
    const kg = parseFloat(kgMatch[1]);
    return { type: "kg", baseUnitAmountKg: kg }; // [cite: 65, 66]
  }
  if (s.includes("g")) return { type: "kg", baseUnitAmountKg: 0.001 }; // [cite: 66, 67]
  return { type: s === "piece" ? "piece" : "kg", baseUnitAmountKg: 1 }; // [cite: 67, 68]
};

// Utility function to render stars
export const renderStars = (count, size = "text-2xl", isInteractive = false, onRate = () => {}) => (
  <div className={`flex items-center space-x-1 ${isInteractive ? "cursor-pointer" : "cursor-default"}`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        onClick={isInteractive ? () => onRate(star) : undefined}
        onMouseEnter={isInteractive ? () => onRate(star) : undefined} // [cite: 8]
        className="transition-colors duration-150"
        aria-label={`${star} star${star > 1 ? 's' : ''}`}
        role={isInteractive ? "button" : "presentation"}
      >
        {star <= count ? (
          <FaStar className={`${size} text-yellow-500`} /> // [cite: 8]
        ) : (
          <FaRegStar className={`${size} text-gray-300`} /> // [cite: 9]
        )}
      </span>
    ))}
  </div>
);