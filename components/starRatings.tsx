"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  onRate: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({ onRate }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  const handleRating = (value: number) => {
    setRating(value);
    onRate(value);
  };

  return (
    <div className="flex gap-8">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        const halfValue = starValue - 0.5;
        const isFilled = hover >= starValue || rating >= starValue;
        const isHalfFilled = hover >= halfValue || rating >= halfValue;

        return (
          <div
            key={index}
            className="relative cursor-pointer"
            onMouseEnter={() => setHover(halfValue)}
            onMouseLeave={() => setHover(0)}
            onClick={() => handleRating(rating === halfValue ? starValue : halfValue)}
          >

            <Star className="w-7 h-7 text-gray-400 absolute" />

            <Star
              className="w-7 h-7 absolute"
              style={{
                fill: isFilled ? "yellow" : isHalfFilled ? "url(#halfGradient)" : "none",
                stroke: isFilled || isHalfFilled ? "yellow" : "gray",
              }}
            />
          </div>
        );
      })}
      
      <svg width="0" height="0">
        <defs>
          <linearGradient id="halfGradient">
            <stop offset="50%" stopColor="yellow" />
            <stop offset="50%" stopColor="gray" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export default StarRating;