// farmer/components/ReviewsTab.jsx

import React, { useState, useEffect } from 'react';
import { db } from '../../../../firebaseconfig';
import { collection, query, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { FaStar, FaRegStar, FaSpinner } from 'react-icons/fa';

// Utility to render stars
const renderStars = (count, size = "text-xl") => (
    <div className="flex items-center space-x-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        star <= count ? (
          <FaStar key={star} className={`${size} text-yellow-500`} />
        ) : (
          <FaRegStar key={star} className={`${size} text-gray-300`} />
        )
      ))}
    </div>
);

// Utility for Avatar (Uses same logic as ProfileEditor)
const Avatar = ({ url, name, size = 'w-10 h-10' }) => (
    <img 
        src={url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=008080&color=fff&size=50`}
        alt={`${name}'s profile`}
        className={`${size} rounded-full object-cover border border-gray-200 flex-shrink-0`}
        referrerPolicy="no-referrer"
    />
);


function ReviewsTab({ farmerId }) {
    const [reviews, setReviews] = useState([]);
    const [avgRating, setAvgRating] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!farmerId) return;

        const q = query(collection(db, "farmers", farmerId, "reviews"), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            let fetchedReviews = [];
            let totalRating = 0;

            // Fetch user details for each review (Name and Photo)
            const reviewPromises = snapshot.docs.map(async (docSnap) => {
                const data = docSnap.data();
                totalRating += (data.rating || 0);
                
                let reviewerName = "Anonymous";
                let reviewerPhotoURL = null;

                try {
                    const userSnap = await getDoc(doc(db, "users", data.customerId));
                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        reviewerName = userData.name || userData.displayName || reviewerName;
                        reviewerPhotoURL = userData.photoURL || null;
                    }
                } catch (e) {
                    console.error("Error fetching reviewer data:", e);
                }

                return {
                    id: docSnap.id,
                    ...data,
                    reviewerName,
                    reviewerPhotoURL,
                    displayDate: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : 'N/A'
                };
            });

            fetchedReviews = await Promise.all(reviewPromises);
            setReviews(fetchedReviews);
            setAvgRating(fetchedReviews.length > 0 ? (totalRating / fetchedReviews.length).toFixed(1) : 0);
            setLoading(false);
            setError('');

        }, (err) => {
            console.error("Error fetching reviews:", err);
            setError("Failed to load reviews.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [farmerId]);

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg border-l-4 border-yellow-500">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100">
                <h3 className="text-2xl font-bold text-gray-800">Customer Feedback</h3>
                <div className="text-right">
                    <p className="text-3xl font-extrabold text-yellow-600">
                        {avgRating} / 5
                    </p>
                    <p className="text-sm text-gray-500">({reviews.length} reviews)</p>
                </div>
            </div>

            {loading && <p className="text-center py-8 text-lg text-gray-500"><FaSpinner className="animate-spin inline mr-2" /> Loading reviews...</p>}
            {error && <p className="p-3 text-sm font-medium text-red-700 bg-red-100 rounded-lg">{error}</p>}
            
            {!loading && reviews.length === 0 && (
                <p className="text-gray-500 italic py-8 text-center">No customer reviews yet.</p>
            )}

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {reviews.map((r) => (
                    <div key={r.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center">
                                <Avatar url={r.reviewerPhotoURL} name={r.reviewerName} size="w-8 h-8 mr-3" />
                                <div>
                                    <p className="font-semibold text-gray-800">{r.reviewerName}</p>
                                    {renderStars(r.rating, "text-sm")}
                                </div>
                            </div>
                            <span className="text-xs text-gray-400">{r.displayDate}</span>
                        </div>
                        <p className="text-gray-700 mt-2 ml-11 italic">"{r.comment}"</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ReviewsTab;