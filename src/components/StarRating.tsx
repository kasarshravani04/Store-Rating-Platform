import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  size?: number;
}

export default function StarRating({
  rating,
  maxStars = 5,
  interactive = false,
  onRatingChange,
  size = 18
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="flex items-center gap-1" id="star-rating-container">
      {Array.from({ length: maxStars }).map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= displayRating;
        const isHalf = !isFilled && starValue - 0.5 <= displayRating;

        return (
          <button
            key={index}
            id={`star-btn-${index}`}
            type="button"
            disabled={!interactive}
            onClick={() => {
              if (interactive && onRatingChange) {
                onRatingChange(starValue);
              }
            }}
            onMouseEnter={() => {
              if (interactive) setHoverRating(starValue);
            }}
            onMouseLeave={() => {
              if (interactive) setHoverRating(null);
            }}
            className={`${
              interactive ? 'cursor-pointer transition-transform duration-100 hover:scale-125' : 'cursor-default'
            } transition-colors focus:outline-hidden`}
          >
            <Star
              size={size}
              className={`${
                isFilled
                  ? 'fill-amber-400 text-amber-500'
                  : isHalf
                  ? 'fill-amber-200 text-amber-500'
                  : 'text-gray-300 dark:text-gray-400'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
