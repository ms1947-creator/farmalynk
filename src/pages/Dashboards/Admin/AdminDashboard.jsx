import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebaseconfig";
import Navbar from "../../../components/Navbar";

export default function AdminDashboard() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    visibleToCustomers: false,
  });
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch pending users
  const fetchPendingUsers = async () => {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users = querySnapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((u) => u.approved === false);
    setPendingUsers(users);
  };

  // 🔹 Fetch all products
  const fetchProducts = async () => {
    const querySnapshot = await getDocs(collection(db, "products"));
    const allProducts = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    setProducts(allProducts);
  };

  useEffect(() => {
    fetchPendingUsers();
    fetchProducts();
  }, []);

  // 🔹 Approve user
  const handleApprove = async (userId) => {
    await updateDoc(doc(db, "users", userId), { approved: true });
    fetchPendingUsers();
  };

  // 🔹 Reject user (soft delete)
  const handleReject = async (userId) => {
    await deleteDoc(doc(db, "users", userId));
    fetchPendingUsers();
  };

  // 🔹 Add product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return alert("Please fill all fields");

    setLoading(true);
    try {
      await addDoc(collection(db, "products"), {
        ...newProduct,
        price: parseFloat(newProduct.price),
        createdAt: serverTimestamp(),
      });
      setNewProduct({ name: "", price: "", description: "", visibleToCustomers: false });
      fetchProducts();
      alert("Product added successfully!");
    } catch (err) {
      console.error(err);
      alert("Error adding product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <Navbar />
      <div className="px-8 py-20">
        <h1 className="text-3xl font-bold text-green-700 mb-8">Admin Dashboard</h1>

        {/* 🧍 Pending Approvals */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Pending User Approvals</h2>
          {pendingUsers.length === 0 ? (
            <p>No pending users.</p>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((u) => (
                <div
                  key={u.id}
                  className="bg-white p-4 rounded-xl shadow-md flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">{u.name}</p>
                    <p className="text-gray-600">{u.email}</p>
                    <p className="text-sm text-gray-500">{u.role}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(u.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(u.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 🛒 Add Product */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Add Product</h2>
          <form
            onSubmit={handleAddProduct}
            className="bg-white p-6 rounded-xl shadow-md space-y-4 max-w-lg"
          >
            <input
              type="text"
              placeholder="Product Name"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-green-300"
            />
            <input
              type="number"
              placeholder="Price"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-green-300"
            />
            <textarea
              placeholder="Description"
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-green-300"
            />
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newProduct.visibleToCustomers}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, visibleToCustomers: e.target.checked })
                }
              />
              <span>Visible to Customers</span>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              {loading ? "Adding..." : "Add Product"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
