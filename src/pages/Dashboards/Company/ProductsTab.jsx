// src/pages/Dashboards/Company/ProductsTab.jsx
import React, { useState } from "react";
import { collection, addDoc, deleteDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
// Removed import for Firebase Storage (ref, uploadBytes, getDownloadURL)
import { db } from "../../../firebaseconfig"; 

// Helper function to convert File to Base64 String
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

// --- Edit Product Modal Component (Modified for Base64) ---
const EditProductModal = ({ product, companyId, onSave, onClose, showToast }) => {
  const [editedProduct, setEditedProduct] = useState(product);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null); // State for the new file

  const handleSave = async () => {
    if (!editedProduct.name || !editedProduct.price || !editedProduct.unit) {
      showToast("Name, Price, and Unit are required.", "error");
      return;
    }
    setLoading(true);
    
    try {
        let finalImageUrl = editedProduct.imageUrl; // The current Base64 string
        if (imageFile) {
            // Convert the new file to Base64
            finalImageUrl = await fileToBase64(imageFile);
            
            // Check for large files (Firestore limit is 1MB)
            // A typical Base64 string is ~1.33x the original file size.
            if (finalImageUrl.length > 900000) { // Check size before saving (approx. 900KB Base64 string)
                showToast("Image file is too large! Please choose a smaller image (< 700KB original size).", "error");
                setLoading(false);
                return;
            }
        }

        // Prepare fields for update
        const updatedFields = {
            name: editedProduct.name,
            description: editedProduct.description,
            price: parseFloat(editedProduct.price),
            unit: editedProduct.unit,
            imageUrl: finalImageUrl || '', 
            updatedAt: Timestamp.now(),
        };
        
        await onSave(product.id, updatedFields);
        onClose();
    } catch (error) {
        console.error("Error in Edit Product process:", error);
        showToast("Failed to save changes.", "error");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-lg">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Edit Product: {product.name}</h3>
        <div className="space-y-3">
          {/* Text/Number Inputs */}
          {/* ... (inputs for name, description, price, unit remain the same) ... */}
          <input type="text" placeholder="Name" value={editedProduct.name} onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })} className="w-full border rounded px-3 py-2" />
          <textarea placeholder="Description" value={editedProduct.description} onChange={(e) => setEditedProduct({ ...editedProduct, description: e.target.value })} className="w-full border rounded px-3 py-2" />
          <div className="flex gap-3">
            <input type="number" placeholder="Price (₹)" value={editedProduct.price} onChange={(e) => setEditedProduct({ ...editedProduct, price: e.target.value })} className="w-1/2 border rounded px-3 py-2" />
            <input type="text" placeholder="Unit (e.g., kg, L)" value={editedProduct.unit} onChange={(e) => setEditedProduct({ ...editedProduct, unit: e.target.value })} className="w-1/2 border rounded px-3 py-2" />
          </div>
          
          {/* Base64 Image Input */}
          <div className="border p-3 rounded">
            <label className="block text-sm font-medium text-gray-700 mb-1">Replace Image (Base64)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="w-full text-sm"
            />
            {(editedProduct.imageUrl || imageFile) && (
              <img 
                src={imageFile ? URL.createObjectURL(imageFile) : editedProduct.imageUrl} 
                alt="Product Preview" 
                className="h-20 w-20 object-cover rounded mt-3" 
              />
            )}
            <p className="text-xs text-gray-500 mt-1">Note: Large images will fail the 1MB Firestore limit.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
// --------------------------------------------------------

// --- Add Product Form Component (Separate for Tab View) ---
const AddProductForm = ({ companyId, setProducts, products, showToast }) => {
    const [newProduct, setNewProduct] = useState({ 
        name: "", description: "", price: "", unit: "", 
    });
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleAddProduct = async () => {
        if (!newProduct.name || !newProduct.price || !newProduct.unit) {
            showToast("Name, Price, and Unit are required.", "error");
            return;
        }
        if (!imageFile) {
             showToast("Please upload a product image.", "error");
            return;
        }
        
        const parsedPrice = parseFloat(newProduct.price);
        if (isNaN(parsedPrice)) {
            showToast("Price must be a valid number.", "error");
            return;
        }

        setLoading(true);
        try {
            // 1. Convert Image to Base64 URL
            const imageUrl = await fileToBase64(imageFile);

            // Check Base64 string size before trying to save
            if (imageUrl.length > 900000) { 
                showToast("Image file is too large! Please choose a smaller image (< 700KB original size).", "error");
                setLoading(false);
                return;
            }
            
            // 2. Save Product Data to Firestore (with Base64 string as URL)
            const productsCol = collection(db, "company-products", companyId, "products");
            const docData = {
                name: newProduct.name,
                description: newProduct.description,
                price: parsedPrice,
                unit: newProduct.unit,
                imageUrl: imageUrl, // Base64 string is stored here
                createdAt: Timestamp.now(), 
                updatedAt: Timestamp.now(),
            };

            const docRef = await addDoc(productsCol, docData);

            // 3. Update local state 
            setProducts([...products, { id: docRef.id, ...docData }]);
            
            // 4. Reset form
            setNewProduct({ name: "", description: "", price: "", unit: "" });
            setImageFile(null);
            showToast("Product added successfully");

        } catch (err) {
            console.error("Error in Add Product process:", err);
            showToast("Failed to add product.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="border p-4 rounded-lg bg-gray-50">
            <h3 className="text-xl font-medium mb-4">New Product Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" placeholder="Product Name *" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="border rounded px-3 py-2" />
                <input type="number" placeholder="Price (₹) *" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} className="border rounded px-3 py-2" />
                <input type="text" placeholder="Unit (e.g., kg) *" value={newProduct.unit} onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })} className="border rounded px-3 py-2" />
                <textarea placeholder="Description (Optional)" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} className="border rounded px-3 py-2 h-20 col-span-full" />
                
                {/* Image Upload Input */}
                <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image * (Max ~700KB)</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files[0])}
                        className="w-full text-sm border p-2 rounded bg-white"
                    />
                    {imageFile && (
                        <img src={URL.createObjectURL(imageFile)} alt="Preview" className="h-16 w-16 object-cover rounded mt-3" />
                    )}
                    <p className="text-xs text-red-500 mt-1">⚠️ **WARNING:** Images must be very small to fit Firestore's 1MB limit.</p>
                </div>
            </div>
            
            <button
                onClick={handleAddProduct}
                disabled={loading}
                className="mt-6 px-6 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 disabled:opacity-50 transition"
            >
                {loading ? 'Adding Product...' : 'Add Product'}
            </button>
        </div>
    );
};
// --------------------------------------------------------

// --- Manage Products List Component (No change needed) ---
const ManageProductsList = ({ companyId, products, setProducts, showToast, handleDeleteProduct, handleUpdateProduct, setEditingProduct }) => {
    // This component remains the same as it just renders the 'imageUrl' which is now a Base64 string
    return (
        <div className="pt-4">
            <h3 className="text-xl font-medium mb-3">Existing Products ({products.length})</h3>
            {products.length === 0 ? (
                <p className="text-gray-600 p-4 border rounded">No products added yet.</p>
            ) : (
                <div className="space-y-3">
                    {/* Table Header */}
                    <div className="grid grid-cols-5 font-semibold text-sm text-gray-700 border-b pb-2">
                        <div>Image / Name</div>
                        <div className="col-span-2">Description</div>
                        <div>Price / Unit</div>
                        <div className="text-right">Actions</div>
                    </div>
                    {/* Product Rows */}
                    {products.map((p) => (
                        <div key={p.id} className="grid grid-cols-5 gap-4 p-3 border rounded items-center hover:bg-gray-50 transition">
                            <div className="flex items-center space-x-3">
                                {/* The p.imageUrl now holds the Base64 string */}
                                {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="h-10 w-10 object-cover rounded" />}
                                <div>
                                    <h3 className="font-semibold">{p.name}</h3>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 col-span-2 truncate">{p.description}</p>
                            <div>
                                <p className="text-sm text-gray-800 font-medium">₹{p.price}</p>
                                <p className="text-xs text-gray-500">Unit: {p.unit}</p>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setEditingProduct(p)}
                                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --------------------------------------------------------


export default function ProductsTab({ companyId, products, setProducts, showToast }) {
    const [activeSubTab, setActiveSubTab] = useState("add"); 
    const [loading, setLoading] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null); 

    const handleDeleteProduct = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        
        setLoading(true); 
        try {
            const productRef = doc(db, "company-products", companyId, "products", id);
            await deleteDoc(productRef);
            
            setProducts(products.filter((p) => p.id !== id));
            showToast("Product deleted successfully");

        } catch (err) {
            console.error("Error deleting product:", err);
            showToast("Failed to delete product", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProduct = async (id, updatedFields) => {
        setLoading(true);
        try {
            const productRef = doc(db, "company-products", companyId, "products", id);
            await updateDoc(productRef, updatedFields);
            
            setProducts(products.map((p) => (p.id === id ? { ...p, ...updatedFields } : p)));
            showToast("Product updated successfully");

        } catch (err) {
            console.error("Error updating product:", err);
            showToast("Failed to update product", "error");
        } finally {
            setLoading(false);
        }
    };


    return (
        <section className="bg-white p-6 rounded-xl shadow-md space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3">🌱 Manage Company Products</h2>

            {/* Sub-Tabs Navigation */}
            <div className="flex border-b">
                <button
                    onClick={() => setActiveSubTab("add")}
                    className={`py-2 px-4 text-lg font-medium transition duration-150 ${
                        activeSubTab === "add" ? "border-b-2 border-green-600 text-green-600" : "text-gray-500 hover:text-green-600"
                    }`}
                >
                    Add Product
                </button>
                <button
                    onClick={() => setActiveSubTab("manage")}
                    className={`py-2 px-4 text-lg font-medium transition duration-150 ${
                        activeSubTab === "manage" ? "border-b-2 border-green-600 text-green-600" : "text-gray-500 hover:text-green-600"
                    }`}
                >
                    Manage Products ({products.length})
                </button>
            </div>

            {/* Sub-Tab Content */}
            <div className="pt-4">
                {activeSubTab === "add" && (
                    <AddProductForm 
                        companyId={companyId}
                        setProducts={setProducts}
                        products={products}
                        showToast={showToast}
                    />
                )}

                {activeSubTab === "manage" && (
                    <ManageProductsList 
                        companyId={companyId}
                        products={products}
                        setProducts={setProducts}
                        showToast={showToast}
                        handleDeleteProduct={handleDeleteProduct}
                        handleUpdateProduct={handleUpdateProduct}
                        setEditingProduct={setEditingProduct} 
                    />
                )}
            </div>
            
            {/* Render Edit Modal */}
            {editingProduct && (
                <EditProductModal 
                    product={editingProduct}
                    companyId={companyId}
                    onSave={handleUpdateProduct}
                    onClose={() => setEditingProduct(null)}
                    showToast={showToast}
                />
            )}
        </section>
    );
}