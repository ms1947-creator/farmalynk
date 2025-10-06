import React from "react";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

export default function FarmerDashboard() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold text-green-700 mb-6">Farmer Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-gray-500 text-sm">Recent Orders</h2>
            <p className="text-2xl font-bold mt-2">8</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-gray-500 text-sm">Pending Appointments</h2>
            <p className="text-2xl font-bold mt-2">2</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-gray-500 text-sm">Ratings Received</h2>
            <p className="text-2xl font-bold mt-2">15</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4">
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
            View Orders
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            Book Appointment
          </button>
          <button className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition">
            Browse Sellers
          </button>
        </div>

        {/* Placeholder Content */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Latest Orders</h2>
          <div className="bg-white rounded-lg shadow p-4">
            <p>Order #12345 - Fertilizers - Qty: 20kg - Status: Pending</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
