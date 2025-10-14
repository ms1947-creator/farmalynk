// src/pages/Dashboards/Company/AnalyticsTab.jsx
import React from "react";

export default function AnalyticsTab({ products, fieldOfficers, appointments }) {
  const totalProducts = products.length;
  const totalOfficers = fieldOfficers.length;
  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter(a => a.status === "completed").length;
  const pendingAppointments = appointments.filter(a => a.status === "pending").length;

  return (
    <section className="bg-white p-6 rounded-xl shadow-md space-y-6">
      <h2 className="text-2xl font-semibold">Analytics Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
        <div className="bg-green-100 p-4 rounded">
          <h3 className="text-lg font-semibold">Products</h3>
          <p className="text-2xl font-bold">{totalProducts}</p>
        </div>
        <div className="bg-blue-100 p-4 rounded">
          <h3 className="text-lg font-semibold">Field Officers</h3>
          <p className="text-2xl font-bold">{totalOfficers}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded">
          <h3 className="text-lg font-semibold">Appointments</h3>
          <p className="text-2xl font-bold">{totalAppointments}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded">
          <h3 className="text-lg font-semibold">Completed Appointments</h3>
          <p className="text-2xl font-bold">{completedAppointments}</p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold">Pending Appointments</h3>
        <p className="text-gray-700">{pendingAppointments}</p>
      </div>
    </section>
  );
}

