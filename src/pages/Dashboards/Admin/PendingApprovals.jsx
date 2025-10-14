// src/pages/Admin/PendingApprovals.jsx

export default function PendingApprovals({ pendingUsers, handleApprove, handleReject, loading }) {
  // Filter out 'Customer' role as requested
  const usersToApprove = pendingUsers.filter(u => u.role !== "Customer");

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-2xl font-semibold mb-4 text-green-800">Pending Approvals ({usersToApprove.length})</h2>
      
      {usersToApprove.length === 0 ? (
        <p className="text-gray-500">No pending approvals for non-customer roles.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 text-left">Name</th>
              <th className="border px-4 py-2 text-left">Email</th>
              <th className="border px-4 py-2 text-left">Role</th>
              <th className="border px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersToApprove.map((u) => (
              <tr key={u.id}>
                <td className="border px-4 py-2">{u.name}</td>
                <td className="border px-4 py-2">{u.email}</td>
                <td className="border px-4 py-2 font-medium">{u.role}</td>
                <td className="border px-4 py-2 flex gap-2">
                  <button
                    className="bg-green-500 px-3 py-1 text-white rounded hover:bg-green-600 disabled:bg-gray-400 transition"
                    onClick={() => handleApprove(u.id)}
                    disabled={loading}
                  >
                    Approve
                  </button>
                  <button
                    className="bg-red-500 px-3 py-1 text-white rounded hover:bg-red-600 disabled:bg-gray-400 transition"
                    onClick={() => handleReject(u.id)}
                    disabled={loading}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}