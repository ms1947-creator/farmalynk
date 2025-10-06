import React from "react";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

export default function SellerDashboard() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold text-green-700 mb-6">Seller Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-gray-500 text-sm">Inventory Items</h2>
            <p className="text-2xl font-bold mt-2">50</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-gray-500 text-sm">Orders</h2>
            <p className="text-2xl font-bold mt-2">12</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-gray-500 text-sm">Company Orders</h2>
            <p className="text-2xl font-bold mt-2">5</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-gray-500 text-sm">Pending Approvals</h2>
            <p className="text-2xl font-bold mt-2">3</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
            Manage Inventory
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            View Orders
          </button>
          <button className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition">
            Company Catalog
          </button>
          <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition">
            Company Orders
          </button>
        </div>

        {/* Placeholder Content */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Inventory Items</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1,2,3].map((item) => (
              <div key={item} className="bg-white rounded-lg shadow p-4 hover:scale-105 transform transition">
                <h3 className="font-semibold">Product {item}</h3>
                <p>Stock: {item*5} units</p>
                <p>Price: ${item*10}</p>
                <button className="mt-2 w-full bg-green-600 text-white py-1 rounded hover:bg-green-700 transition">
                  Edit
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
