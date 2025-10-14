// src/pages/Admin/ExistingProducts.jsx

export default function ExistingProducts({ products, allUsers, toggleVisibility, loading }) {
  const getFarmerName = (farmerId) => {
    return allUsers.find((u) => u.id === farmerId)?.name || "Unknown/Removed User";
  };

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-2xl font-semibold mb-4 text-green-800">Existing Products ({products.length})</h2>
      
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2 text-left">Name</th>
            <th className="border px-4 py-2 text-left">Farmer</th>
            <th className="border px-4 py-2 text-left">Price</th>
            <th className="border px-4 py-2 text-left">Unit</th>
            <th className="border px-4 py-2 text-left">Visibility</th>
            <th className="border px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className={p.visibleToCustomers ? "hover:bg-green-50" : "hover:bg-red-50"}>
              <td className="border px-4 py-2 font-medium">{p.name}</td>
              <td className="border px-4 py-2 text-sm">{getFarmerName(p.farmerId)}</td>
              <td className="border px-4 py-2">${p.price?.toFixed(2) || 'N/A'}</td>
              <td className="border px-4 py-2">{p.unit}</td>
              <td className={`border px-4 py-2 font-bold ${p.visibleToCustomers ? 'text-green-600' : 'text-red-600'}`}>
                {p.visibleToCustomers ? "LIVE" : "HIDDEN"}
              </td>
              <td className="border px-4 py-2">
                <button
                  className="bg-blue-500 px-3 py-1 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-400 transition"
                  onClick={() => toggleVisibility(p)}
                  disabled={loading}
                >
                  {p.visibleToCustomers ? "Hide from Store" : "Publish to Store"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}