import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaShoppingCart, FaStar } from "react-icons/fa";

/**
 * ProductsCard
 * Renders a single product with quantity selection and add-to-cart logic.
 * The layout is compact for a dense grid (up to 8 columns).
 */
export function ProductsCard({ product, meetFarmer, addToCart, setSafetyModal, badgeConfig }) {
  // --- Price/Unit Logic (Functional logic remains the same, adjusted qty display) ---
  const normalizeBaseUnit = (rawUnit) => {
    if (!rawUnit) return { type: "kg", baseUnitAmountKg: 1 };
    const s = rawUnit.toString().toLowerCase().trim();
    if (s.includes("piece") || s.includes("pc") || s === "piece") {
      return { type: "piece", baseUnitAmountKg: null };
    }
    const gramsMatch = s.match(/(\d+)\s*g/);
    if (gramsMatch) {
      const grams = parseFloat(gramsMatch[1]);
      return { type: "kg", baseUnitAmountKg: grams / 1000 };
    }
    const kgMatch = s.match(/(\d+(\.\d+)?)\s*kg/);
    if (kgMatch) {
      const kg = parseFloat(kgMatch[1]);
      return { type: "kg", baseUnitAmountKg: kg };
    }
    if (s.includes("g")) return { type: "kg", baseUnitAmountKg: 0.001 };
    return { type: s === "piece" ? "piece" : "kg", baseUnitAmountKg: 1 };
  };

  const { type: baseType, baseUnitAmountKg } = normalizeBaseUnit(product.baseUnit);
  
  let qtyOptions = [];
  if (baseType === "piece") {
    qtyOptions = [{ label: "1 pc", value: 1 }, { label: "2 pc", value: 2 }, { label: "3 pc", value: 3 }];
  } else {
    qtyOptions = [
      { label: "250g", value: 0.25 },
      { label: "500g", value: 0.5 },
      { label: "1kg", value: 1 },
    ];
  }

  const [selectedQty, setSelectedQty] = useState(qtyOptions[0].value);
  
  const computePrices = () => {
    const basePrice = Number(product.basePrice || product.price || 0); 
    if (baseType === "piece") {
      return {
        pricePerBaseUnit: basePrice,
        pricePerKg: null,
        priceForSelectedQty: basePrice * selectedQty,
        unitLabel: "pc",
      };
    } else {
      const amountKg = baseUnitAmountKg || 1;
      const pricePerKg = amountKg > 0 ? basePrice / amountKg : basePrice;
      const priceForSelectedQty = pricePerKg * Number(selectedQty);
      return {
        pricePerBaseUnit: basePrice,
        pricePerKg,
        priceForSelectedQty,
        unitLabel: "kg",
      };
    }
  };

  const { pricePerBaseUnit, pricePerKg, priceForSelectedQty, unitLabel } = computePrices();
  
  const availableQuantityRaw = Number(product.availableQuantity ?? product.stock ?? Infinity);

  // FIX 1: Normalize available quantity for display
  let availableQtyDisplay = 'N/A';
  if (isFinite(availableQuantityRaw)) {
      if (baseType === "piece") {
          availableQtyDisplay = `${availableQuantityRaw.toFixed(0)} pc`;
      } else if (availableQuantityRaw >= 1) {
          availableQtyDisplay = `${availableQuantityRaw.toFixed(1)}kg`;
      } else if (availableQuantityRaw > 0) {
          availableQtyDisplay = `${(availableQuantityRaw * 1000).toFixed(0)}g`;
      } else {
          availableQtyDisplay = 'Sold Out';
      }
  }
  // This is the quantity used for comparison (in its database unit, typically kg/piece)
  const availableQtyForComparison = availableQuantityRaw;

  const exceedsAvailability = () => {
    if (!isFinite(availableQtyForComparison)) return false;
    return Number(selectedQty) > Number(availableQtyForComparison);
  };
  
  const handleAddToCart = () => {
    let unitsDisplay;
    if (baseType === "piece") {
      unitsDisplay = `${selectedQty} pc`;
    } else {
      unitsDisplay = selectedQty < 1 ? `${selectedQty * 1000}g` : `${selectedQty}kg`;
    }

    const unitPrice = baseType === "piece" ? pricePerBaseUnit : pricePerKg; 
    const totalPrice = priceForSelectedQty || 0;
    addToCart(product, Number(selectedQty), {
      unitPrice,
      totalPrice,
      unitsDisplay,
    });
  };

  const handleViewCertificate = () => {
    if (product.safetyCertificate) {
      setSafetyModal(product.safetyCertificate);
    }
  };

  const fmt = (n) => Number(n ?? 0).toFixed(2);

  const dynamicRating = product.averageRating ? Number(product.averageRating).toFixed(1) : "N/A";
  const dynamicReviewCount = product.reviewCount || 0;
  const hasFarmer = !!product.farmerId;
  const primaryBadgeKey = product.badges?.[0];
  const primaryBadge = primaryBadgeKey ? badgeConfig[primaryBadgeKey] : null;

  // -------------------------------------------
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0,0,0,0.15)" }}
      className="bg-white rounded-xl shadow-lg flex flex-col transition-all duration-300 w-full overflow-hidden h-full"
    >
      {/* Product Image and Availability Badge */}
      <div className="relative h-28 w-full">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-green-100 flex items-center justify-center text-gray-400">
             <FaShoppingCart size={30} />
          </div>
        )}
        
        {/* Availability Badge */}
        {isFinite(availableQuantityRaw) && (
            <div className={`absolute top-2 right-2 px-2 py-1 text-xs rounded-full font-semibold ${availableQuantityRaw > 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                {/* FIX 1: Display normalized available quantity */}
                {availableQtyDisplay}
            </div>
        )}
      </div>

      {/* Product Details and Alignment Fixes */}
      <div className="p-3 flex flex-col flex-grow">
        <h3 className="text-base font-extrabold text-gray-800 line-clamp-2 leading-tight">{product.name}</h3>
        
        {/* FIX 2: Rating and Farmer Button on one line, badge below name/rating */}
        <div className="flex items-center justify-between mt-1">
            {/* Rating and Count */}
            <div className="flex items-center">
                {dynamicRating !== "N/A" && (
                    <>
                        <FaStar className="text-yellow-500 text-sm mr-1" />
                        <span className="text-xs text-gray-600 font-semibold">{dynamicRating}</span>
                        <span className="text-xs text-gray-400 ml-1">({dynamicReviewCount})</span>
                    </>
                )}
            </div>
            
            {/* Farmer Button */}
            <button
                onClick={hasFarmer ? () => meetFarmer(product.farmerId) : undefined}
                className={`text-xs ml-auto transition whitespace-nowrap ${ // Added whitespace-nowrap
                    hasFarmer 
                        ? "text-blue-600 hover:underline" 
                        : "text-gray-400 cursor-not-allowed"
                }`}
                disabled={!hasFarmer}
            >
                {hasFarmer ? "🧑‍🌾 Meet the Farmer" : "Farmer N/A"}
            </button>
        </div>

        {/* FIX 3: Badge adjusted to self-start and margin reduced */}
        {primaryBadge && (
          <span
            className={`${primaryBadge.color} px-2 py-1 text-xs rounded-full font-medium self-start mt-1 mb-2 whitespace-nowrap`}
          >
            {primaryBadge.label}
          </span>
        )}
      </div>

      {/* Price and Action Section (unchanged) */}
      <div className="p-3 pt-0 border-t mt-auto">
        <div className="flex justify-between items-center mb-2">
            <div className="text-lg font-bold text-green-700">
                ₹{fmt(priceForSelectedQty)}
            </div>
            <div className="text-xs text-gray-500">
                {baseType === "piece" ? `(₹${fmt(pricePerBaseUnit)}/pc)` : `(₹${fmt(pricePerKg)}/kg)`}
            </div>
        </div>

        <div className="flex gap-2">
          {/* Quantity Selector */}
          <select
            value={selectedQty}
            onChange={(e) => setSelectedQty(Number(e.target.value))}
            className="border border-gray-300 px-2 py-1 text-sm rounded-lg w-1/2 bg-white focus:ring-green-500 focus:border-green-500"
            aria-label="Select quantity"
          >
            {qtyOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Add to Cart Button */}
          <motion.button
            onClick={handleAddToCart}
            whileTap={{ scale: 0.95 }}
            className={`w-1/2 bg-green-600 text-white py-1.5 rounded-lg flex items-center justify-center hover:bg-green-700 transition shadow-md text-sm ${exceedsAvailability() || availableQtyForComparison <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            aria-label="Add to cart"
            disabled={exceedsAvailability() || availableQtyForComparison <= 0}
            title={exceedsAvailability() ? `Only ${availableQtyDisplay} available` : availableQtyForComparison <= 0 ? 'Out of Stock' : ""}
          >
            <FaShoppingCart size={14} className="mr-1" />
            Add
          </motion.button>
        </div>
        
        {product.safetyCertificate && (
          <button
            onClick={handleViewCertificate}
            className="text-xs text-gray-500 hover:text-gray-700 underline block text-center mt-2 w-full"
          >
            View Certificate
          </button>
        )}
      </div>
    </motion.div>
  );
}