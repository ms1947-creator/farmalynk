import React from "react";
import { FaUserCircle } from "react-icons/fa";
import { renderStars } from "../../../utils/helpers"; 

export function Review({ review }) {
  return (
    <div key={review.id} className="p-3 bg-gray-50 rounded-lg shadow-sm border">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-3">
          {/* Profile Image/Placeholder */}
          <img
            src={review.reviewerPhotoURL || `https://ui-avatars.com/api/?name=${review.reviewerName || 'Customer'}&background=0D83DD&color=fff&size=40`}
            alt={review.reviewerName}
            className="w-10 h-10 object-cover rounded-full"
          />
          <div>
            {/* Reviewer Name */}
            <strong className={review.reviewerName === "You" ? "text-green-600 font-bold" : "text-gray-800 font-semibold"}>
              {review.reviewerName}
            </strong>
            {/* Rating Stars */}
            {renderStars(review.rating, "text-sm", false)} 
          </div>
        </div>
        
        {/* Date and Time (Full Format) */}
        <span className="text-xs text-gray-400 self-start text-right">
          {review.createdAt?.toDate
            ? review.createdAt.toDate().toLocaleString()
            : "Date N/A"}
        </span>
      </div>
      
      {/* Review Comment */}
      <p className="text-gray-700 mt-1 pl-12 italic">
        {review.comment}
      </p>
    </div>
  );
}