import React, { useState } from 'react';

export interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  category?: string;
}

// Category-intelligent, verified high-resolution culinary fallback photography
export const CULINARY_FALLBACKS: Record<string, string> = {
  biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
  curries: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80',
  tandoor: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80',
  street: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
  breads: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80',
  desserts: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
  chai: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
  default: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80',
};

/**
 * Robust Image component with graceful error handling.
 * Eliminates broken image icons across the entire customer menu, POS, and dashboard.
 */
export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = 'Culinary Dish',
  className = '',
  fallbackSrc,
  category,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  // Determine fallback image based on category or default
  const defaultFallback =
    (category && CULINARY_FALLBACKS[category.toLowerCase()]) ||
    CULINARY_FALLBACKS.default;

  const targetFallback = fallbackSrc || defaultFallback;
  const imageSrc = hasError || !src ? targetFallback : src;

  return (
    <img
      src={imageSrc}
      alt={alt}
      loading="lazy"
      onError={() => {
        if (!hasError) {
          setHasError(true);
        }
      }}
      className={className}
      {...props}
    />
  );
};

export default SafeImage;

