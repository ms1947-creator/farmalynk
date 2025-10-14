// src/pages/Dashboards/Company/AppointmentsTab.jsx
import React from "react";

// Note: handleMarkVisited and currentUserId were removed as they are FO/Farmer actions
export default function AppointmentsTab({ 
    appointments, 
    fieldOfficers, 
    handleAssignOfficer, // (id, officerUid)
    handleRejectAppointment, 
}) {
    // Utility to find FO details by UID
    const getOfficerDetails = (officerUid) => {
        // Assuming the officerUid in the appointment is the Firebase Auth UID.
        // We match on the 'uid' property in the fieldOfficers data fetched from /companies/{id}/field_officers
        return fieldOfficers.find(o => o.uid === officerUid);
    };

    return (
        <section className="bg-white p-6 rounded-xl shadow-md space-y-6">
            <h2 className="text-2xl font-semibold">Appointments</h2>
            <p className="text-sm text-gray-600">
                View appointments that are assigned to your company. Assign a Field Officer or reject requests.
            </p>

            <div>
                {appointments.length === 0 ? (
                    <p className="text-gray-600">No assigned or completed appointment requests for your company.</p>
                ) : (
                    <div className="space-y-4">
                        {appointments.map((a) => {
                            const officerDetails = a.officerUid ? getOfficerDetails(a.officerUid) : null;
                            const isAssigned = a.officerUid !== null;

                            return (
                                <div key={a.id} className="p-4 border rounded">
                                    <div className="flex justify-between items-start">
                                        {/* Appointment Info */}
                                        <div>
                                            <h3 className="font-semibold">
                                                {a.farmerName || "Farmer"} <span className="text-sm text-gray-500">({a.farmerId})</span>
                                            </h3>
                                            <p className="text-sm text-gray-600">Requested: {a.requestedAt}</p>
                                            <p className="text-sm text-gray-600">Region: {a.region || "—"}</p>
                                            <p className="text-sm mt-2">{a.message}</p>
                                            <div className="text-xs text-gray-500 mt-2">
                                                Status: <strong>{a.status}</strong>
                                                {a.status === 'Completed' && a.completedAt && (
                                                    <span className="ml-2 text-green-600"> (Completed: {a.completedAt})</span>
                                                )}
                                            </div>
                                            {isAssigned && officerDetails && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Assigned Officer: 
                                                    <strong> {officerDetails.name} ({officerDetails.empId})</strong>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons (Company Owner only) */}
                                        <div className="flex flex-col gap-2">
                                            {/* Company can only assign an unassigned request */}
                                            {/* NOTE: With the open pool model, company should only see assigned/completed ones, 
                                                but if they are also seeing "Requested" status (which implies UNASSIGNED), 
                                                they need the assignment option. */}
                                            {a.status === "Requested" && !isAssigned && (
                                                <>
                                                    {fieldOfficers.length > 0 ? (
                                                        <select
                                                            onChange={(e) => {
                                                                // Call the new assign handler
                                                                if (e.target.value) handleAssignOfficer(a.id, e.target.value); 
                                                            }}
                                                            defaultValue=""
                                                            className="border rounded px-2 py-1 bg-green-500 text-white font-medium"
                                                        >
                                                            <option value="" disabled>Assign Officer & Accept</option>
                                                            {fieldOfficers.map((o) => (
                                                                // Use the Firebase Auth UID (o.uid) for assignment
                                                                <option key={o.id} value={o.uid}> 
                                                                    {o.name} ({o.empId})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <button disabled className="px-3 py-1 bg-gray-400 text-white rounded cursor-not-allowed">
                                                            Assign (No Officers)
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleRejectAppointment(a.id)}
                                                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {/* Status displays for assigned/rejected/completed */}
                                            {a.status === "Accepted" && isAssigned && (
                                                <div className="text-sm text-blue-600 font-medium">Assigned to FO</div>
                                            )}
                                            {a.status === "Rejected" && (
                                                <div className="text-sm text-red-600 font-medium">Rejected</div>
                                            )}
                                            {a.status === "Completed" && (
                                                <div className="text-sm text-green-600 font-medium">Completed ✅</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}