import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaShoppingCart, FaSpinner } from "react-icons/fa";

// Helper for currency formatting (assuming it was either in another helper file or inline)
const fmt = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount
  );

export function Orders({ orders, loadingOrders }) {
  if (loadingOrders) {
    return (
      <div className="flex justify-center items-center py-10 text-gray-500">
        <FaSpinner className="animate-spin mr-2" /> Loading orders...
      </div>
    );
  }

  return (
    <motion.div
      key="orders"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-800">My Orders</h2>

      {orders.length === 0 ? (
        <div className="text-center py-10 border rounded-xl bg-white shadow-sm">
          <FaShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            No orders placed yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Start shopping to see your orders here!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-5 rounded-xl shadow-md border border-gray-100"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-gray-800">
                    Order ID: #{order.id.substring(0, 8).toUpperCase()}
                  </span>
                  <span
                    className={`px-3 py-1 text-xs rounded-full font-medium ${
                      order.status === "Placed"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {order.createdAt?.toDate
                    ? new Date(order.createdAt.toDate()).toLocaleDateString()
                    : new Date(order.createdAt).toLocaleDateString()}
                </p>
                <ul className="list-disc ml-5 mt-3 text-sm text-gray-700 space-y-1">
                  {order.items.map((item, index) => (
                    <li key={index}>
                      {item.quantity} x {item.name} ({item.unitsDisplay}) -{" "}
                      <span className="font-medium">{fmt(item.totalPrice)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-3 border-t flex justify-between items-center font-bold text-lg text-gray-900">
                  <span>Total:</span>
                  <span>
                    {fmt(
                      order.items.reduce(
                        (sum, item) => sum + (item.totalPrice || 0),
                        0
                      )
                    )}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}