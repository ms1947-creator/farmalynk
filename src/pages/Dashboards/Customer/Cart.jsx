import React from "react";
import { motion } from "framer-motion";
import { FaTrashAlt, FaMoneyBillWave } from "react-icons/fa";
import { HiArrowSmRight } from "react-icons/hi";

// Currency formatting in ₹
const fmt = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);

export function Cart({ cart, checkout, updateQuantity, removeFromCart }) {
  const subtotal = cart.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const total = subtotal; // No shipping/tax for simplicity

  // Determine step based on units
  const getStep = (unitsDisplay) => {
    if (unitsDisplay.includes("g")) return 0.25; // 250g
    if (unitsDisplay.includes("kg")) return 1;   // 1kg
    if (unitsDisplay.includes("dozen")) return 1;
    return 1; // default
  };

  const handleIncrement = (item) => {
    const step = getStep(item.unitsDisplay);
    const newQty = item.quantity + step;
    updateQuantity(item.id, item.unitsDisplay, newQty);
  };

  const handleDecrement = (item) => {
    const step = getStep(item.unitsDisplay);
    const newQty = Math.max(item.quantity - step, step);
    updateQuantity(item.id, item.unitsDisplay, newQty);
  };

  // Convert internal quantity to display string
  const displayQty = (item) => {
    if (item.unitsDisplay.includes("g")) {
      const grams = item.quantity * 1000;
      if (grams >= 1000) {
        return `${grams / 1000}kg`; // convert to kg if ≥ 1000g
      }
      return `${grams}g`;
    }
    if (item.unitsDisplay.includes("kg")) return `${item.quantity}kg`;
    if (item.unitsDisplay.includes("dozen")) return `${item.quantity} dozen`;
    return item.quantity;
  };

  return (
    <motion.div
      key="cart"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="grid lg:grid-cols-3 gap-8"
    >
      {/* Cart Items */}
      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
          Your Shopping Cart ({cart.length})
        </h2>

        {cart.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <FaMoneyBillWave className="mx-auto h-12 w-12" />
            <h3 className="mt-2 text-xl font-medium">Your cart is empty</h3>
            <p className="mt-1 text-sm">Add some fresh produce from products tab!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <motion.div
                key={item.id + item.unitsDisplay}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-center space-x-4 flex-grow">
                  <div className="h-16 w-16 bg-gray-200 rounded-md flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {fmt(item.unitPrice)} per {item.unitsDisplay}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Decrement */}
                  <button
                    onClick={() => handleDecrement(item)}
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    -
                  </button>

                  {/* Quantity display */}
                  <span className="w-16 text-center">{displayQty(item)}</span>

                  {/* Increment */}
                  <button
                    onClick={() => handleIncrement(item)}
                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    +
                  </button>

                  {/* Total price */}
                  <div className="font-bold text-gray-800 w-24 text-right">
                    {fmt(item.totalPrice)}
                  </div>

                  {/* Remove */}
                  <motion.button
                    onClick={() => removeFromCart(item.id, item.unitsDisplay)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    <FaTrashAlt />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg h-fit">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
          Order Summary
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-800">{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium text-gray-800">Free</span>
          </div>
          <div className="flex justify-between border-t pt-4 font-bold text-xl text-gray-900">
            <span>Order Total</span>
            <span>{fmt(total)}</span>
          </div>
        </div>

        <motion.button
          onClick={checkout}
          disabled={cart.length === 0}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition ${
            cart.length > 0
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          <FaMoneyBillWave /> Checkout ({fmt(total)})
          <HiArrowSmRight className="h-6 w-6 ml-2" />
        </motion.button>
      </div>
    </motion.div>
  );
}
