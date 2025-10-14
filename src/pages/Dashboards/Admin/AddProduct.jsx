// src/pages/Admin/AddProduct.jsx

export default function AddProduct({
  newProduct,
  setNewProduct,
  handleAddProduct,
  farmersDropdown,
  loading,
}) {
  const handleFileChange = (e, field) => {
    setNewProduct({ ...newProduct, [field]: e.target.files[0] });
  };

  const handleBadgeChange = (e, badge) => {
    setNewProduct({
      ...newProduct,
      badges: { ...newProduct.badges, [badge]: e.target.checked },
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  return (
    <form onSubmit={handleAddProduct} className="space-y-6 max-w-xl p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-semibold text-green-800">Add New Product</h2>
      
      <input
        type="text"
        name="name"
        placeholder="Product Name (e.g., Organic Apples)"
        value={newProduct.name}
        onChange={handleInputChange}
        className="border p-3 w-full rounded focus:ring-green-500 focus:border-green-500"
        required
      />
      
      <div className="flex gap-4">
        <input
          type="number"
          name="price"
          placeholder="Price (e.g., 10.50)"
          value={newProduct.price}
          onChange={handleInputChange}
          className="border p-3 w-2/3 rounded"
          step="0.01"
          required
        />
        <select
          name="unit"
          value={newProduct.unit}
          onChange={handleInputChange}
          className="border p-3 w-1/3 rounded"
        >
          <option value="kg">kg</option>
          <option value="unit">unit</option>
          <option value="dozen">dozen</option>
        </select>
      </div>

      <select
        name="farmerId"
        value={newProduct.farmerId}
        onChange={handleInputChange}
        className="border p-3 w-full rounded"
        required
      >
        <option value="">Select Associated Farmer*</option>
        {farmersDropdown.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name} ({f.email})
          </option>
        ))}
      </select>

      <textarea
        name="description"
        placeholder="Product Description..."
        value={newProduct.description}
        onChange={handleInputChange}
        rows="4"
        className="border p-3 w-full rounded"
      />

      <div className="space-y-3">
        <label className="block font-medium">Product Image (.jpg, .png, max 800KB):</label>
        <input type="file" onChange={(e) => handleFileChange(e, "image")} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
        
        <label className="block font-medium">Safety Certificate (max 800KB):</label>
        <input type="file" onChange={(e) => handleFileChange(e, "safetyCertificate")} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
      </div>

      <div className="pt-2">
        <span className="font-medium text-gray-700 block mb-2">Product Badges:</span>
        <div className="flex gap-4 flex-wrap">
          {Object.keys(newProduct.badges).map((b) => (
            <label key={b} className="flex items-center gap-1 capitalize">
              <input
                type="checkbox"
                checked={newProduct.badges[b]}
                onChange={(e) => handleBadgeChange(e, b)}
                className="form-checkbox text-green-600"
              />
              {b.replace(/([A-Z])/g, ' $1').trim()}
            </label>
          ))}
        </div>
      </div>
      
      <label className="flex items-center gap-2 pt-4">
        <input
          type="checkbox"
          checked={newProduct.visibleToCustomers}
          onChange={(e) => setNewProduct({ ...newProduct, visibleToCustomers: e.target.checked })}
          className="form-checkbox text-green-600 h-5 w-5"
        />
        <span className="text-lg font-medium">Publish to Customer Marketplace</span>
      </label>

      <button
        type="submit"
        className="w-full bg-green-600 px-4 py-3 rounded text-white font-bold text-lg hover:bg-green-700 disabled:bg-gray-400 transition"
        disabled={loading}
      >
        {loading ? "Processing..." : "Add Product"}
      </button>
    </form>
  );
}