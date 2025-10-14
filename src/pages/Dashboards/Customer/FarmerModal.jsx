import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  addDoc,
  orderBy,
  getDoc,
} from "firebase/firestore";
// Adjust these paths based on where you put FarmerModal.jsx
import { db, auth } from "../../../firebaseconfig"; 
import { motion, AnimatePresence } from "framer-motion";
import {
  FaStar,
  FaRegStar,
  FaTimes,
} from "react-icons/fa";

// Assume Review is available for import (adjust path if needed)
import { Review } from "./Review"; 
// Assume renderStars is imported from a utility file (adjust path if needed)
// If not available as an import, define it locally (see below)
// import { renderStars } from "../../../utils/helpers"; 


// --- Utility Function for Stars (Required if not imported) ---
const renderStars = (count, size = "text-2xl", isInteractive = false, onRate = () => {}) => (
    <div className={`flex items-center space-x-1 ${isInteractive ? "cursor-pointer" : "cursor-default"}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={isInteractive ? () => onRate(star) : undefined}
          className="transition-colors duration-150"
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          role={isInteractive ? "button" : "presentation"}
        >
          {star <= count ? (
            <FaStar className={`${size} text-yellow-500`} />
          ) : (
            <FaRegStar className={`${size} text-gray-300`} />
          )}
        </span>
      ))}
    </div>
);


export function FarmerModal({ farmer, onClose }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // 🟢 Fetch reviews in real time, including reviewer details
  useEffect(() => {
    if (!farmer?.id) return;

    const reviewRef = collection(db, "farmers", farmer.id, "reviews");
    const q = query(reviewRef, orderBy("createdAt", "desc")); 

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetched = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let reviewerName = data.customerId;
          let reviewerPhotoURL = null; 

          const isCurrentUser = auth.currentUser && data.customerId === auth.currentUser.uid;
          
          try {
            if (data.customerId) {
              // Fetch user details for the reviewer
              const userSnap = await getDoc(doc(db, "users", data.customerId));
              if (userSnap.exists()) {
                const userData = userSnap.data();
                reviewerName = userData.name || userData.displayName || reviewerName;
                reviewerPhotoURL = userData.photoURL || null;
              }
            }
            if (isCurrentUser) {
              // Highlight the current user's review
              reviewerName = auth.currentUser.displayName || "You";
              reviewerPhotoURL = auth.currentUser.photoURL || reviewerPhotoURL;
            }
          } catch (e) {
            console.error("Error fetching user name/photo:", e);
          }
          
          return {
            id: docSnap.id,
            ...data,
            reviewerName,
            reviewerPhotoURL, // Passed to the Review component
          };
        })
      );

      setReviews(fetched);

      if (fetched.length > 0) {
        const avg =
          fetched.reduce((sum, r) => sum + (r.rating || 0), 0) / fetched.length;
        setAvgRating(avg.toFixed(1));
      } else {
        setAvgRating(0);
      }
      
      setErrorMsg("");
    }, (error) => {
        console.error("Error fetching reviews:", error);
        setErrorMsg("Failed to load reviews.");
    });

    return () => unsubscribe();
  }, [farmer]);

  // --- Review Submission ---

  const submitReview = async () => {
    setErrorMsg("");

    if (!farmer) return;
    if (rating < 1 || rating > 5) return setErrorMsg("Rating must be 1–5.");
    if (!comment.trim()) return setErrorMsg("Comment cannot be empty.");
    if (!auth.currentUser) return setErrorMsg("Please log in to submit a review.");

    setIsSubmitting(true);
    try {
      const reviewRef = collection(db, "farmers", farmer.id, "reviews");
      await addDoc(reviewRef, {
        rating,
        comment,
        customerId: auth.currentUser.uid,
        createdAt: new Date(),
      });
      setComment("");
      setRating(0);
      setSuccessMsg("✅ Review submitted successfully!");
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (error) {
      console.error("Error submitting review:", error);
      setErrorMsg("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!farmer) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "-100vh", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "-100vh", opacity: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="bg-white p-8 rounded-xl max-w-lg w-full shadow-2xl relative overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-600 transition duration-150"
          aria-label="Close modal"
        >
          <FaTimes size={20} />
        </button>

        {/* --- Farmer Profile Image (Now included) --- */}
        <div className="flex justify-center mb-4">
          <img
            src={farmer.photoURL || `https://ui-avatars.com/api/?name=${farmer.name}&background=0D83DD&color=fff&size=96`}
            alt={`${farmer.name}'s profile`}
            className="w-24 h-24 object-cover rounded-full border-4 border-green-500 shadow-md"
          />
        </div>
        
        {/* --- Farmer Info Header --- */}
        <div className="text-center mb-6 border-b pb-4">
          <h2 className="text-3xl font-extrabold text-green-700 mb-1">
            {farmer.name}
          </h2>
          <p className="text-sm text-gray-500 mb-2">
            Meet the person behind your food!
          </p>
          {avgRating > 0 && (
            <p className="text-yellow-600 font-semibold">
              ⭐ {avgRating} / 5 ({reviews.length} reviews)
            </p>
          )}
        </div>

        {/* --- Farmer Details --- */}
        <div className="space-y-3 text-gray-700">
          {/* Age detail is present. If it doesn't show, the 'age' field is missing in the Firestore document for that farmer. */}
          <p>🧑‍🌾 <strong>Age:</strong> {farmer.age || 'N/A'}</p> 
          <p>📍 <strong>Location:</strong> {farmer.location || 'N/A'}</p>
          <p>
            🌱 <strong>Crops:</strong>{" "}
            <span className="font-medium">{farmer.crops?.join(", ") || 'Not specified'}</span>
          </p>
          {farmer.story && (
            <p className="p-4 bg-gray-50 border-l-4 border-green-500 italic rounded-lg shadow-sm">
              "{farmer.story}"
            </p>
          )}
        </div>

        {/* --- Leave a Review Section --- */}
        <div className="mt-6 pt-4 border-t">
          <h3 className="text-xl font-semibold mb-3 text-gray-800">
            Leave a Review
          </h3>

          {/* Interactive rating for input */}
          {renderStars(rating, "text-2xl", true, setRating)} 

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            rows="3"
            className="border border-gray-300 px-3 py-2 rounded-lg w-full mt-3 focus:ring-green-500 focus:border-green-500 transition duration-150"
            aria-label="Review comment"
          />

          <motion.button
            onClick={submitReview}
            disabled={isSubmitting || rating === 0 || !comment.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`mt-3 flex items-center justify-center text-white px-4 py-2 rounded-lg w-full font-semibold transition duration-200 ${
              isSubmitting || rating === 0 || !comment.trim()
                ? "bg-green-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </motion.button>

          {successMsg && (
            <p className="text-green-600 text-center mt-2 font-semibold">
              {successMsg}
            </p>
          )}
          {errorMsg && ( 
            <p className="text-red-600 text-center mt-2 font-semibold">
              {errorMsg}
            </p>
          )}
        </div>

        {/* 🟡 Display Reviews Section (Using modular Review component) */}
        <div className="mt-8 border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Customer Reviews ({reviews.length})
          </h3>

          {reviews.length === 0 ? (
            <p className="text-gray-500 italic">No reviews yet. Be the first!</p>
          ) : (
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
              {reviews.map((r) => (
                // Use the modular Review component
                <Review key={r.id} review={r} />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}