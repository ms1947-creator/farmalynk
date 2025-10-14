import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const MOCK_ORDERS = [
  {
    id: "ORD001",
    date: "2025-10-05",
    items: [
      { name: "Organic Tomato", quantity: 2, unit: "kg", price: 60 },
      { name: "Diabetic-Friendly Rice", quantity: 1, unit: "kg", price: 120 },
    ],
    status: "Placed", // Placed → Confirmed → Packed → Shipped → Delivered
  },
  {
    id: "ORD002",
    date: "2025-10-01",
    items: [{ name: "Fertilizer ABC", quantity: 3, unit: "kg", price: 300 }],
    status: "Shipped",
  },
];

const STATUS_STEPS = ["Placed", "Confirmed", "Packed", "Shipped", "Delivered"];

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Mock fetch orders (replace with backend/Firebase later)
    setOrders(MOCK_ORDERS);
  }, []);

  const getStatusClass = (step, currentStatus) => {
    const currentIndex = STATUS_STEPS.indexOf(currentStatus);
    const stepIndex = STATUS_STEPS.indexOf(step);
    if (stepIndex < currentIndex) return "bg-green-600";
    if (stepIndex === currentIndex) return "bg-yellow-500";
    return "bg-gray-300";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold mb-6">My Orders</h2>

        {orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-4 rounded-lg shadow mb-6"
            >
              <div className="flex justify-between mb-2">
                <span className="font-semibold">Order ID: {order.id}</span>
                <span className="text-gray-500">{order.date}</span>
              </div>

              {/* Order Items */}
              <div className="mb-4">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between border-b py-1 text-gray-700"
                  >
                    <span>
                      {item.name} ({item.quantity} {item.unit})
                    </span>
                    <span>₹{item.price}</span>
                  </div>
                ))}
              </div>

              {/* Order Status Timeline */}
              <div className="flex justify-between items-center mt-4">
                {STATUS_STEPS.map((step, idx) => (
                  <div key={idx} className="flex-1 text-center relative">
                    <div
                      className={`mx-auto w-6 h-6 rounded-full ${getStatusClass(
                        step,
                        order.status
                      )}`}
                    ></div>
                    <span className="block text-xs mt-1">{step}</span>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div
                        className={`absolute top-2.5 left-1/2 w-full h-1 -ml-1/2 ${
                          STATUS_STEPS.indexOf(order.status) > idx
                            ? "bg-green-600"
                            : "bg-gray-300"
                        }`}
                      ></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      <Footer />
    </div>
  );
}
