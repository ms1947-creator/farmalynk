import React from "react";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

export default function OfficerDashboard() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold text-green-700 mb-6">Field Officer Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-gray-500 text-sm">Appointments Assigned</h2>
            <p className="text-2xl font-bold mt-2">10</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-gray-500 text-sm">Appointments Completed</h2>
            <p className="text-2xl font-bold mt-2">6</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition">
            <h2 className="text-gray-500 text-sm">Pending Reports</h2>
            <p className="text-2xl font-bold mt-2">2</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
            View Appointments
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            Complete Visit
          </button>
          <button className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition">
            Add Notes/Recommendations
          </button>
        </div>

        {/* Placeholder Content */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Today's Appointments</h2>
          <div className="bg-white rounded-lg shadow p-4">
            <p>Appointment #201 - Farmer: John Doe - Crop: Wheat - Status: Pending</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
