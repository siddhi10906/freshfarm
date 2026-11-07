import React from 'react';
import { Star } from 'lucide-react';

/**
 * StarRating — reusable star component
 * Props:
 *   rating       {number}   — current rating value (1–5)
 *   onChange     {function} — if provided, renders interactive stars
 *   size         {number}   — icon size in px (default 20)
 *   color        {string}   — filled star color
 *   emptyColor   {string}   — empty star color
 */
const StarRating = ({
    rating = 0,
    onChange = null,
    size = 20,
    color = '#F59E0B',
    emptyColor = '#e2e8f0',
}) => {
    const isInteractive = typeof onChange === 'function';

    return (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
            }}
        >
            {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= Math.round(rating);
                return (
                    <button
                        key={star}
                        type="button"
                        onClick={() => isInteractive && onChange(star)}
                        disabled={!isInteractive}
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '1px',
                            cursor: isInteractive ? 'pointer' : 'default',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'transform 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            if (isInteractive) e.currentTarget.style.transform = 'scale(1.25)';
                        }}
                        onMouseLeave={(e) => {
                            if (isInteractive) e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <Star
                            size={size}
                            fill={filled ? color : 'none'}
                            color={filled ? color : emptyColor}
                            strokeWidth={1.5}
                        />
                    </button>
                );
            })}
        </div>
    );
};

export default StarRating;
