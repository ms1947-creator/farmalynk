import React, { useState, useEffect } from "react";
import { auth, db, storage } from "../../../firebaseconfig";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

export default function AdminLogin() {
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const ADMIN_PASSWORD = "farmalynkAdmin123"; // Replace with env var in production

  // Fetch pending users from Firestore
  const fetchPendingUsers = async () => {
    setLoading(true);
    const q = query(collection(db, "users"), where("approved", "==", false));
    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setPendingUsers(users);
    setLoading(false);
  };

  useEffect(() => {
    if (isLoggedIn) fetchPendingUsers();
  }, [isLoggedIn]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
    } else {
      alert("Invalid admin password!");
    }
  };

  const approveUser = async (uid) => {
    await updateDoc(doc(db, "users", uid), { approved: true });
    alert("User approved!");
    fetchPendingUsers();
  };

  const rejectUser = async (uid) => {
    await updateDoc(doc(db, "users", uid), { rejected: true });
    alert("User rejected!");
    fetchPendingUsers();
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form onSubmit={handleAdminLogin} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
          <h2 className="text-2xl font-bold text-center text-green-700 mb-4">Admin Login</h2>
          <input
            type="password"
            placeholder="Admin Password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded mb-4"
          />
          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h2 className="text-3xl font-bold text-green-700 mb-6 text-center">Pending User Approvals</h2>

      {loading ? (
        <p className="text-center text-gray-700">Loading...</p>
      ) : pendingUsers.length === 0 ? (
        <p className="text-center text-gray-700">No pending users!</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded">
            <thead>
              <tr className="bg-green-600 text-white">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((user) => (
                <tr key={user.id} className="text-center border-b">
                  <td className="px-4 py-2">{user.name}</td>
                  <td className="px-4 py-2">{user.emailOrPhone}</td>
                  <td className="px-4 py-2">{user.role}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      onClick={() => approveUser(user.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectUser(user.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-center mt-6">
        <button
          onClick={() => setIsLoggedIn(false)}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
