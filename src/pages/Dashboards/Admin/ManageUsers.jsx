// src/pages/Admin/ManageUsers.jsx

export default function ManageUsers({
  allUsers,
  manageUsersSubTab,
  setManageUsersSubTab,
  userSearchInput,
  setUserSearchInput,
  handleRemoveUser,
  loading,
}) {
  const roles = ["Customer", "Farmer", "Seller", "Field Officer", "Company"];

  const filteredUsers = allUsers
    .filter((u) => u.role === manageUsersSubTab)
    .filter((u) =>
      u.name?.toLowerCase().includes(userSearchInput.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearchInput.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));
    
  // Function to open the photo in a new tab
  const handleViewPhoto = (photoUrl) => {
      if (photoUrl) {
          window.open(photoUrl, '_blank');
      } else {
          alert("No uploaded photo found for this user.");
      }
  };

  return (
    <div className="space-y-4 p-4 bg-white shadow rounded">
      <h2 className="text-2xl font-semibold text-green-800">Manage Users by Role</h2>
      
      {/* Role Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {roles.map((r) => (
          <button
            key={r}
            className={`px-3 py-1 rounded text-sm font-semibold transition ${
              manageUsersSubTab === r ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => {
                setManageUsersSubTab(r);
                setUserSearchInput("");
            }}
          >
            {r}s ({allUsers.filter(u => u.role === r).length})
          </button>
        ))}
      </div>
      
      {/* Search Input */}
      <input
        type="text"
        placeholder={`Search ${manageUsersSubTab}s by Name or Email...`}
        value={userSearchInput}
        onChange={(e) => setUserSearchInput(e.target.value)}
        className="border p-3 w-full rounded focus:ring-green-500 focus:border-green-500"
      />

      {/* User Table */}
      <table className="w-full border-collapse border border-gray-300 mt-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2 text-left">Name / ID</th>
            <th className="border px-4 py-2 text-left">Email</th>
            <th className="border px-4 py-2 text-left">Status</th>
            <th className="border px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length === 0 ? (
            <tr><td colSpan="4" className="border px-4 py-4 text-center text-gray-500">No {manageUsersSubTab}s match your criteria.</td></tr>
          ) : (
            filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">
                    {/* UPDATED: Show Name and ID */}
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[150px]">{u.id}</div>
                    
                    {/* UPDATED: View Photo Option */}
                    {u.photoUrl && (
                        <button 
                            className="mt-1 text-sm text-blue-600 hover:text-blue-800 underline"
                            onClick={() => handleViewPhoto(u.photoUrl)}
                        >
                            View Photo
                        </button>
                    )}
                </td>
                <td className="border px-4 py-2 text-sm">{u.email}</td>
                <td className={`border px-4 py-2 font-semibold ${u.approved ? 'text-green-600' : 'text-red-500'}`}>
                    {u.approved ? 'Approved' : 'Pending'}
                </td>
                <td className="border px-4 py-2">
                  <button
                    className="bg-red-500 px-3 py-1 text-white rounded text-sm hover:bg-red-600 disabled:bg-gray-400 transition"
                    onClick={() => handleRemoveUser(u.id, u.name)}
                    disabled={loading}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}