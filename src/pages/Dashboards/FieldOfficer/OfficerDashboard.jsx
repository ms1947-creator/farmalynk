// src/pages/Dashboards/FieldOfficer/components/FieldOfficerDashboard.jsx

import React, { useState, useEffect, useRef } from "react";
import { db } from "../../../firebaseconfig";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import {
  FaSpinner,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaPlay,
} from "react-icons/fa";

function FieldOfficerDashboard({ officerId, officerData, district }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const retryTimer = useRef(null);
  const retryCount = useRef(0);
  const audioRefs = useRef({});

  // 🔁 Listen to all appointments for the officer's district
  const setupRealtimeListener = () => {
    if (!officerId || !district) return;

    const q = query(
      collection(db, "appointments"),
      where("region", "==", district),
      orderBy("requestedAt", "desc")
    );

    try {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetched = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            requestedAt:
              doc.data().requestedAt?.toDate().toLocaleString() || "N/A",
          }));

          // Officers see only:
          // - Pending (no one accepted yet)
          // - Approved (if they accepted it)
          // - Completed (if they were assigned)
          const visible = fetched.filter(
            (a) =>
              a.status === "Pending" ||
              (a.status === "Approved" && a.officerId === officerId) ||
              (a.status === "Completed" && a.officerId === officerId)
          );

          setAppointments(visible);
          setLoading(false);
          setError("");
          setConnectionStatus("Connected");
          retryCount.current = 0;
        },
        (err) => {
          console.error("Snapshot error:", err);
          setConnectionStatus("Connection lost. Retrying...");
          retryCount.current += 1;

          clearTimeout(retryTimer.current);
          retryTimer.current = setTimeout(
            setupRealtimeListener,
            Math.min(30000, 2000 * retryCount.current)
          );
        }
      );

      return unsubscribe;
    } catch (e) {
      console.error("Listener setup failed:", e);
      setConnectionStatus("Failed to connect. Retrying...");
      clearTimeout(retryTimer.current);
      retryTimer.current = setTimeout(setupRealtimeListener, 5000);
    }
  };

  useEffect(() => {
    const unsubscribe = setupRealtimeListener();
    return () => {
      if (unsubscribe) unsubscribe();
      clearTimeout(retryTimer.current);
    };
  }, [officerId, district]);

  // 🏷️ Status Badges
  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return (
          <span className="flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
            <FaClock className="mr-1" /> Pending
          </span>
        );
      case "Approved":
        return (
          <span className="flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-800">
            <FaCheckCircle className="mr-1" /> Accepted
          </span>
        );
      case "Completed":
        return (
          <span className="flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-800">
            <FaCheckCircle className="mr-1" /> Completed
          </span>
        );
      case "Rejected":
        return (
          <span className="flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-red-100 text-red-800">
            <FaTimesCircle className="mr-1" /> Rejected
          </span>
        );
      default:
        return (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  // 🧭 Accept / Reject handling
  const handleStatusChange = async (appId, newStatus) => {
    try {
      const appRef = doc(db, "appointments", appId);

      const updates = {
        status: newStatus,
        respondedAt: serverTimestamp(),
      };

      if (newStatus === "Approved") {
        // Assign this officer, and make it hidden for others
        Object.assign(updates, {
          officerId,
          officerName: officerData.name,
          officerEmail: officerData.email,
          officerPhone: officerData.phone,
        });
      }

      if (newStatus === "Rejected") {
        // Just mark rejected; don't assign officer
        Object.assign(updates, { officerId: officerId });
      }

      await updateDoc(appRef, updates);
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update status. Please try again.");
    }
  };

  const toggleAudio = (id) => {
    const audio = audioRefs.current[id];
    if (!audio) return;
    if (audio.paused) audio.play();
    else audio.pause();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">
        Field Officer Dashboard
      </h2>
      <p className="text-xs text-gray-500 mb-4">{connectionStatus}</p>

      {loading && (
        <p className="text-center py-8 text-lg text-gray-500">
          <FaSpinner className="animate-spin inline mr-2" /> Fetching
          appointments...
        </p>
      )}

      {!loading && appointments.length === 0 && (
        <p className="text-gray-500 italic py-8 text-center">
          No appointments found for your district.
        </p>
      )}

      <div className="space-y-4">
        {appointments.map((app) => (
          <div
            key={app.id}
            className="p-4 border border-gray-200 rounded-xl bg-white hover:shadow-md transition duration-200"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-bold text-green-700">
                {app.crop}
              </span>
              {getStatusBadge(app.status)}
            </div>

            <div className="text-sm text-gray-700 border-t pt-2 mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <p>
                  <span className="font-semibold">Farmer:</span>{" "}
                  {app.farmerName}
                </p>
                <p>
                  <span className="font-semibold">Date:</span>{" "}
                  {app.requestedDate}
                </p>
                <p>
                  <span className="font-semibold">Issue:</span> {app.issue}
                </p>
                {app.audioUrl && (
                  <div className="mt-2">
                    <button
                      onClick={() => toggleAudio(app.id)}
                      className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-lg"
                    >
                      <FaPlay className="mr-2" /> Play Voice Message
                    </button>
                    <audio
                      ref={(el) => (audioRefs.current[app.id] = el)}
                      src={app.audioUrl}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-end items-end">
                <p>
                  <span className="font-semibold">Requested On:</span>{" "}
                  {app.requestedAt}
                </p>

                {/* Officer Actions */}
                {app.status === "Pending" && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleStatusChange(app.id, "Approved")}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusChange(app.id, "Rejected")}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded-lg"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {app.status === "Approved" &&
                  app.officerId === officerId && (
                    <div className="text-xs text-gray-500 mt-2">
                      Waiting for farmer to mark as completed.
                    </div>
                  )}

                {app.status === "Completed" &&
                  app.officerId === officerId && (
                    <div className="text-xs text-green-600 mt-2 font-semibold">
                      Visit Completed ✅
                    </div>
                  )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 mt-4 text-sm font-medium text-red-700 bg-red-100 rounded-lg flex items-center">
          <FaExclamationTriangle className="mr-2" />
          {error}
        </div>
      )}
    </div>
  );
}

export default FieldOfficerDashboard;
