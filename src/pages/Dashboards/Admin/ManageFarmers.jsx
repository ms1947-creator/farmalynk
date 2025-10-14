// src/pages/Admin/ManageFarmers.jsx

// Component for the Add Farmer Form (extracted for clean rendering)
const AddFarmerForm = ({ newFarmer, setNewFarmer, handleAddFarmer, loading }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewFarmer({ ...newFarmer, [name]: value });
  };
  
  // NOTE: Assuming initialNewFarmerState is available or handled by parent's reset logic
  
  return (
    <div className="space-y-4 max-w-lg p-6 border rounded shadow-md bg-white">
      <h3 className="text-xl font-semibold text-green-700 mb-3">Manually Create Farmer Account</h3>
      <input type="text" name="name" placeholder="Farmer Name*" value={newFarmer.name} onChange={handleInputChange} className="border p-3 w-full rounded" required />
      <input type="email" name="email" placeholder="Email*" value={newFarmer.email} onChange={handleInputChange} className="border p-3 w-full rounded" required />
      <input type="password" name="password" placeholder="Initial Password*" value={newFarmer.password} onChange={handleInputChange} className="border p-3 w-full rounded" required />
      <input type="text" name="age" placeholder="Age (Optional)" value={newFarmer.age} onChange={handleInputChange} className="border p-3 w-full rounded" />
      <input type="text" name="location" placeholder="Location/Farm Address (Optional)" value={newFarmer.location} onChange={handleInputChange} className="border p-3 w-full rounded" />
      <input type="text" name="crops" placeholder="Crops (comma separated, e.g., Wheat, Corn)" value={newFarmer.crops} onChange={handleInputChange} className="border p-3 w-full rounded" />
      <textarea name="story" placeholder="Farmer Story/Bio (Optional)" value={newFarmer.story} onChange={handleInputChange} rows="3" className="border p-3 w-full rounded" />
      <button
        onClick={handleAddFarmer}
        className="w-full bg-green-600 px-4 py-3 rounded text-white font-bold hover:bg-green-700 disabled:bg-gray-400 transition"
        disabled={loading}
      >
        {loading ? "Creating Farmer..." : "Add New Farmer"}
      </button>
    </div>
  );
};

// Component for the Existing Farmers List
const ExistingFarmersList = ({ allFarmers }) => (
  <div className="p-6 border rounded shadow-md bg-white">
    <h3 className="text-xl font-semibold mb-4 text-green-700">Existing Approved Farmers ({allFarmers.length})</h3>
    <table className="w-full border-collapse border border-gray-300">
      <thead>
        <tr className="bg-gray-100">
          <th className="border px-4 py-2 text-left">ID</th>
          <th className="border px-4 py-2 text-left">Name / Email</th>
          <th className="border px-4 py-2 text-left">Location</th>
          <th className="border px-4 py-2 text-left">Products</th>
        </tr>
      </thead>
      <tbody>
        {allFarmers.map((f) => (
          <tr key={f.id}>
            <td className="border px-4 py-2 text-sm text-gray-500 max-w-[100px] truncate">{f.id}</td>
            <td className="border px-4 py-2">
              <div className="font-medium">{f.name}</div>
              <div className="text-sm text-gray-500">{f.email}</div>
            </td>
            <td className="border px-4 py-2 text-sm">{f.location || 'N/A'}</td>
            <td className="border px-4 py-2 text-center font-bold text-green-600">{f.productCount || 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Main ManageFarmers component
export default function ManageFarmers({
  newFarmer,
  setNewFarmer,
  handleAddFarmer,
  loading,
  allFarmers,
  activeSubTab,
  setActiveSubTab,
}) {
  return (
    <div className="space-y-8">
      {/* Sub-Tab Navigation */}
      <div className="flex gap-4">
        <button
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            activeSubTab === "existing"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => setActiveSubTab("existing")}
        >
          Existing Farmers
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            activeSubTab === "add"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => setActiveSubTab("add")}
        >
          Add Farmer
        </button>
      </div>

      {/* Sub-Tab Content */}
      {activeSubTab === "add" && (
        <AddFarmerForm 
          newFarmer={newFarmer}
          setNewFarmer={setNewFarmer}
          handleAddFarmer={handleAddFarmer}
          loading={loading}
        />
      )}
      
      {activeSubTab === "existing" && (
        <ExistingFarmersList allFarmers={allFarmers} />
      )}
    </div>
  );
}