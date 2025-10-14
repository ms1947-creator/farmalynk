import React, { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Modal from "react-modal";
import { FaStar } from "react-icons/fa";

// Mock product data
const mockProducts = [
  {
    id: 1,
    name: "Organic Tomato",
    type: "Organic",
    price: 50,
    unit: "kg",
    stock: 100,
    badge: "Organic",
    safetyCertificateURL: "#",
    farmer: {
      name: "Ramesh",
      age: 45,
      location: "Andhra Pradesh",
      crops: ["Tomato", "Chili"],
      story: "I started farming 20 years ago to provide healthy vegetables.",
      photo: "https://randomuser.me/api/portraits/men/11.jpg",
      ratings: [],
    },
  },
  {
    id: 2,
    name: "Limited Fertilizer Spinach",
    type: "Limited Fertilizer",
    price: 30,
    unit: "kg",
    stock: 50,
    badge: "Limited Fertilizer",
    safetyCertificateURL: "#",
    farmer: {
      name: "Sita",
      age: 38,
      location: "Telangana",
      crops: ["Spinach", "Coriander"],
      story: "We focus on eco-friendly farming methods for healthy greens.",
      photo: "https://randomuser.me/api/portraits/women/21.jpg",
      ratings: [],
    },
  },
];

export default function Products() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ Organic: true, "Limited Fertilizer": true });
  const [cart, setCart] = useState([]);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [toast, setToast] = useState("");

  // Filtered products based on search + type
  const filteredProducts = mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      filters[p.badge]
  );

  const addToCart = (product, quantity = 1) => {
    if (quantity > product.stock) {
      setToast("Not enough stock!");
      setTimeout(() => setToast(""), 2000);
      return;
    }
    setCart((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        return prev.map((p) =>
          p.id === product.id
            ? { ...p, quantity: p.quantity + quantity }
            : p
        );
      }
      return [...prev, { ...product, quantity }];
    });
    setToast(`${product.name} added to cart`);
    setTimeout(() => setToast(""), 2000);
  };

  const submitFarmerReview = () => {
    if (!reviewText || reviewRating === 0) return;
    selectedFarmer.ratings.push({ rating: reviewRating, text: reviewText });
    setReviewText("");
    setReviewRating(0);
    setSelectedFarmer({ ...selectedFarmer }); // trigger re-render
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex-1 container mx-auto py-6">
        <h2 className="text-2xl font-bold mb-4">Products</h2>

        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow z-50">
            {toast}
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center mb-6 space-x-4">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded w-64"
          />
          {["Organic", "Limited Fertilizer"].map((type) => (
            <label key={type} className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={filters[type]}
                onChange={() =>
                  setFilters((prev) => ({ ...prev, [type]: !prev[type] }))
                }
              />
              <span>{type}</span>
            </label>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition transform hover:scale-105 relative"
            >
              {p.badge && (
                <span className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 text-xs rounded">
                  {p.badge}
                </span>
              )}
              <h3 className="font-bold text-lg mb-2">{p.name}</h3>
              <p className="text-gray-700 mb-1">
                Price: ₹{p.price}/{p.unit}
              </p>
              <p className="text-gray-500 mb-2">
                Stock: {p.stock} {p.unit}
              </p>

              <div className="flex space-x-2 mb-2">
                <button
                  onClick={() => window.open(p.safetyCertificateURL, "_blank")}
                  className="text-sm bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                >
                  Safety Certificate
                </button>
                <button
                  onClick={() => setSelectedFarmer(p.farmer)}
                  className="text-sm bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                >
                  Meet the Farmer
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min={1}
                  max={p.stock}
                  defaultValue={1}
                  className="border px-2 py-1 w-16 rounded"
                  id={`qty-${p.id}`}
                />
                <button
                  onClick={() =>
                    addToCart(
                      p,
                      parseInt(document.getElementById(`qty-${p.id}`).value)
                    )
                  }
                  disabled={p.stock === 0}
                  className={`text-sm px-2 py-1 rounded ${
                    p.stock === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-yellow-500 text-white hover:bg-yellow-600"
                  }`}
                >
                  {p.stock === 0 ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />

      {/* Farmer Modal */}
      <Modal
        isOpen={!!selectedFarmer}
        onRequestClose={() => setSelectedFarmer(null)}
        className="bg-white p-6 max-w-md mx-auto mt-20 rounded shadow-lg outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50"
      >
        {selectedFarmer && (
          <div className="space-y-2">
            <img
              src={selectedFarmer.photo}
              alt={selectedFarmer.name}
              className="w-24 h-24 rounded-full mx-auto"
            />
            <h3 className="font-bold text-xl text-center">{selectedFarmer.name}</h3>
            <p className="text-center text-gray-600">
              Age: {selectedFarmer.age} | Location: {selectedFarmer.location}
            </p>
            <p className="text-gray-700">Crops: {selectedFarmer.crops.join(", ")}</p>
            <p className="text-gray-700">{selectedFarmer.story}</p>

            {/* Rating */}
            <div className="flex items-center space-x-1 justify-center mt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <FaStar
                  key={i}
                  className={`cursor-pointer ${
                    reviewRating >= i ? "text-yellow-500" : "text-gray-300"
                  }`}
                  onClick={() => setReviewRating(i)}
                />
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Leave a review"
              className="w-full border px-3 py-2 rounded mt-2"
            />
            <button
              onClick={submitFarmerReview}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 mt-2"
            >
              Submit Review
            </button>

            <button
              onClick={() => setSelectedFarmer(null)}
              className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 mt-4"
            >
              Close
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
