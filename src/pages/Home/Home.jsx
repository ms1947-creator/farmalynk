import React, { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebaseconfig";

// --- ICONS ---
const CheckCircle = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);
const Globe = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20M2 12h20" />
  </svg>
);
const Users = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const Leaf = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.5C15.2 1.7 20 8 20 12.5A4.5 4.5 0 0 1 15.5 17H4" />
  </svg>
);

// --- MOTION VARIANTS ---
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2 } } };
const itemVariants = { hidden: { opacity: 0, y: 40, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100 } } };

// --- COMPONENTS ---
const MotionFeatureCard = ({ icon: Icon, title, description, delay }) => (
  <motion.div
    className="p-8 bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-xl border border-green-100 hover:shadow-2xl transition duration-500 hover:-translate-y-2 group"
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: delay / 1000 }}
    viewport={{ once: false, amount: 0.2 }}
  >
    <div className="w-16 h-16 flex items-center justify-center bg-green-600 text-white rounded-xl mb-6 shadow-lg transition-all duration-500 group-hover:bg-yellow-500">
      <Icon className="w-8 h-8" />
    </div>
    <h3 className="text-2xl font-semibold mb-3 text-green-800 font-poppins">{title}</h3>
    <p className="text-gray-600 font-light leading-relaxed">{description}</p>
  </motion.div>
);

const MotionUSPFeature = ({ title, icon: Icon, delay }) => (
  <motion.div
    className="p-6 bg-white/10 rounded-xl border border-white/20 hover:bg-white/20 backdrop-blur-md transition duration-500 transform hover:scale-105"
    initial={{ opacity: 0, scale: 0.8 }}
    whileInView={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay: delay / 1000 }}
    viewport={{ once: false, amount: 0.2 }}
  >
    <Icon className="w-10 h-10 mx-auto text-yellow-300 mb-4 drop-shadow-lg" />
    <h3 className="text-2xl font-semibold font-playfair">{title}</h3>
  </motion.div>
);

const MotionHowItWorksStep = ({ step, title, description, imageUrl, side, aosDelay }) => (
  <motion.div
    className={`flex flex-col ${side === "right" ? "md:flex-row-reverse" : "md:flex-row"} items-center my-24 space-y-10 md:space-y-0`}
    initial={{ opacity: 0, x: side === "right" ? 100 : -100 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.7, delay: aosDelay / 1000 }}
    viewport={{ once: false, amount: 0.2 }}
  >
    <div className={`w-full md:w-1/2 p-4 ${side === "right" ? "md:pr-16" : "md:pl-16"}`}>
      <div className="w-14 h-14 flex items-center justify-center bg-yellow-500 text-white rounded-full text-xl font-bold mb-4 shadow-lg">
        {step}
      </div>
      <h3 className="text-4xl font-playfair text-green-800 mb-4">{title}</h3>
      <p className="text-lg text-gray-700 leading-relaxed">{description}</p>
    </div>
    <div className="w-full md:w-1/2 relative group">
      <div
        className="w-full h-80 rounded-3xl bg-cover bg-center overflow-hidden shadow-2xl relative"
        style={{ backgroundImage: `url('${imageUrl}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-green-100/10"></div>
        <div className="absolute bottom-6 right-6 opacity-15 text-white text-6xl">🌾</div>
      </div>
    </div>
  </motion.div>
);

export default function Home() {
  const [showProducts, setShowProducts] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const navigate = useNavigate();

  const openProductsModal = async () => {
    setShowProducts(true);
    setLoadingProducts(true);
    try {
      const snapshot = await getDocs(collection(db, "customer-products"));
      const productsList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts(productsList);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleAddToCart = (product) => {
    if (!auth.currentUser) {
      navigate("/login");
      return;
    }
    console.log("Added to cart:", product);
    // Add-to-cart logic here if logged in
  };

  return (
    <div className="bg-white min-h-screen flex flex-col overflow-x-hidden font-poppins">
      <Navbar />

      {/* HERO */}
      <div className="relative h-screen overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://res.cloudinary.com/dyvxz9dwm/image/upload/v1759731618/Gemini_Generated_Image_yqsyukyqsyukyqsy_gpkemn.png')",
            backgroundAttachment: "fixed",
          }}
        />
        <div className="absolute inset-0 bg-black/30"></div>

        <motion.header
          className="relative z-10 flex flex-col justify-center items-center h-full text-center text-white p-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false, amount: 0.2 }}
        >
          <motion.p
            className="uppercase tracking-[4px] text-yellow-300 text-lg mb-2"
            initial={{ y: 10, opacity: 0.8 }}
            animate={{ y: [0, -5, 0], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
          >
            Cultivating Connection
          </motion.p>
          <motion.h1
            className="text-6xl md:text-8xl font-extrabold font-playfair leading-tight drop-shadow-lg"
            initial={{ y: 20, opacity: 0.9 }}
            animate={{ y: [0, -10, 0], opacity: [0.9, 1, 0.9] }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "mirror" }}
          >
            Fresh From Farm to Table
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl mt-6 mb-12 font-light italic max-w-3xl"
            initial={{ y: 10, opacity: 0.8 }}
            animate={{ y: [0, -5, 0], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatType: "mirror" }}
          >
            <strong>FarmaLynk</strong> connects ethical farmers, conscious consumers & sustainable companies — transparently.
          </motion.p>

          <motion.div
            className="flex space-x-6"
            animate={{ y: [0, -3, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
          >
            <Link
              to="/signup"
              className="bg-green-600 text-white px-8 py-4 rounded-full text-lg font-bold shadow-lg hover:bg-green-700 transition transform hover:scale-110 hover:rotate-1"
            >
              Start Selling / Buying 🚀
            </Link>
            <Link
              onClick={(e) => {
                e.preventDefault();
                openProductsModal();
              }}
              to="#"
              className="bg-yellow-500 text-green-900 px-8 py-4 rounded-full text-lg font-bold shadow-lg hover:bg-yellow-600 transition transform hover:scale-110 hover:-rotate-1"
            >
              Browse Produce
            </Link>
          </motion.div>
        </motion.header>
      </div>

      {/* FARMA LYNK DIFFERENCE */}
      <section className="py-32 bg-green-50 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2
            className="text-5xl font-bold text-center mb-16 text-green-800 font-playfair"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            The FarmaLynk Difference
          </motion.h2>
          <div className="grid lg:grid-cols-4 gap-10">
            <MotionFeatureCard icon={Leaf} title="Hyper-Local" description="Fresh, local sourcing within 50 miles — reducing footprint and maximizing flavor." delay={200} />
            <MotionFeatureCard icon={CheckCircle} title="Blockchain Trust" description="Every crop tracked from soil to shelf — verifiable and transparent." delay={400} />
            <MotionFeatureCard icon={Users} title="Fair Profit Share" description="Farmers earn up to 80% — empowering rural economies sustainably." delay={600} />
            <MotionFeatureCard icon={Globe} title="Zero Waste Vision" description="AI-driven logistics redirect surplus to community kitchens and food banks." delay={800} />
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-40 relative bg-center text-white" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=2100&q=80')", backgroundAttachment: "fixed", backgroundSize: "cover" }}>
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/80 to-yellow-700/60 z-0"></div>
        <div className="relative z-10 max-w-5xl mx-auto text-center px-6">
          <motion.h2 className="text-6xl font-extrabold mb-6 font-playfair drop-shadow-xl" initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}>
            Why Choose Us?
          </motion.h2>
          <motion.p className="text-2xl mb-16 font-light max-w-3xl mx-auto" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.7 }}>
            Redefining farm-to-fork — sustainable, transparent, and traceable.
          </motion.p>
          <div className="grid md:grid-cols-3 gap-10">
            <MotionUSPFeature title="Real-Time Traceability" icon={CheckCircle} delay={200} />
            <MotionUSPFeature title="Dynamic Pricing" icon={Globe} delay={400} />
            <MotionUSPFeature title="Sustainable Impact" icon={Users} delay={600} />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-32 bg-white relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2 className="text-5xl font-extrabold text-center mb-20 text-green-800 font-playfair" initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            How FarmaLynk Works
          </motion.h2>

          <MotionHowItWorksStep
            step="1"
            title="Farmer Uploads Produce"
            description="Farmers list verified harvest data, certifications, and visuals — ensuring transparency and quality."
            imageUrl="https://res.cloudinary.com/dyvxz9dwm/image/upload/v1759734145/Gemini_Generated_Image_d8u419d8u419d8u4_wedvxh.png"
            side="left"
            aosDelay={200}
          />
          <MotionHowItWorksStep
            step="2"
            title="Buyer Places Dynamic Order"
            description="Customers and enterprises source directly, optimizing delivery and sustainability."
            imageUrl="https://res.cloudinary.com/dyvxz9dwm/image/upload/v1759734153/Gemini_Generated_Image_z0hrufz0hrufz0hr_erey9v.png"
            side="right"
            aosDelay={400}
          />
          <MotionHowItWorksStep
            step="3"
            title="Logistics & Delivery"
            description="Smart routes ensure freshness and minimal waste, all trackable in real-time."
            imageUrl="https://res.cloudinary.com/dyvxz9dwm/image/upload/v1759734163/Gemini_Generated_Image_23lns523lns523ln_bnyiyw.png"
            side="left"
            aosDelay={600}
          />
        </div>
      </section>

      <Footer />

      {/* PRODUCTS MODAL */}
{showProducts && (
  <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-start overflow-y-auto py-10 px-4">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl p-6 relative">
      <button
        onClick={() => setShowProducts(false)}
        className="absolute top-4 right-4 text-xl font-bold text-gray-700 hover:text-red-600"
      >
        &times;
      </button>
      <h2 className="text-3xl font-bold mb-6 text-green-800">Browse Produce</h2>

      {loadingProducts ? (
        <p className="text-center">Loading products...</p>
      ) : !products.length ? (
        <p className="text-center">No products available.</p>
      ) : (
        <div className="max-h-[80vh] overflow-y-auto">
  <div className="grid grid-cols-3 md:grid-cols-6 gap-4 place-items-center">
    {products.map((product) => {
      const imgUrl = product.imageUrl || product.image || "/placeholder.png";
      return (
        <div
          key={product.id}
          className="border p-3 rounded-lg shadow hover:shadow-lg transition flex flex-col items-center w-[100px] md:w-[160px]"
        >
          <img
            src={imgUrl}
            alt={product.name || "Product"}
            className="w-full h-24 md:h-32 object-cover mb-3 rounded"
          />
          <h3 className="text-sm md:text-base font-semibold text-center">{product.name || "Unnamed"}</h3>
          <p className="text-gray-600 text-xs md:text-sm text-center line-clamp-2">{product.description || ""}</p>
          <p className="font-bold text-green-700 text-sm md:text-base mt-1">₹{product.price} / {product.unit}</p>
          <button
            onClick={() => navigate("/login")}
            className="w-full mt-2 bg-green-600 text-white text-xs md:text-sm py-1 rounded hover:bg-green-700 transition"
          >
            Add to Cart
          </button>
        </div>
      );
    })}
  </div>
</div>

      )}
    </div>
  </div>
)}


    </div>
  );
}
