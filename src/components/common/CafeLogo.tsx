import React from 'react';

export interface CafeLogoProps {
  /** Size preset or specific pixel dimensions */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Additional CSS classes for the container */
  className?: string;
  /** Whether to render the 'CaféOS' typographic wordmark */
  showText?: boolean;
  /** Optional subtitle below brand name (e.g. 'Restaurant Cloud') */
  subtitle?: string;
  /** Optional badge pill next to brand name */
  badge?: string;
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 52,
  xl: 68,
};

/**
 * Minimal, modern & ultra-attractive vector logo for CaféOS.
 * Renders pure inline SVG so it CANNOT fail to load regardless of network or routing.
 */
export const CafeLogo: React.FC<CafeLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  subtitle,
  badge,
}) => {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 40;

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Icon Mark */}
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 group-hover:scale-105"
        aria-label="CaféOS Logo"
      >
        <defs>
          <linearGradient id="cafeLogoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#231712" />
            <stop offset="50%" stopColor="#2E1E17" />
            <stop offset="100%" stopColor="#3C261D" />
          </linearGradient>
          <linearGradient id="cafeLogoAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F28E46" />
            <stop offset="100%" stopColor="#D97736" />
          </linearGradient>
          <linearGradient id="cafeLogoCreamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF8F0" />
            <stop offset="100%" stopColor="#F5EBE1" />
          </linearGradient>
          <radialGradient id="cafeLogoGlow" cx="50%" cy="55%" r="45%">
            <stop offset="0%" stopColor="#D97736" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#D97736" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Minimal Rounded Squircle Frame with Luxury Rim */}
        <rect
          x="2"
          y="2"
          width="116"
          height="116"
          rx="28"
          fill="url(#cafeLogoBgGrad)"
          stroke="#D97736"
          strokeWidth="2.5"
          strokeOpacity="0.35"
        />

        {/* Ambient Inner Glow */}
        <circle cx="60" cy="65" r="42" fill="url(#cafeLogoGlow)" />

        {/* Dynamic Minimal Steam Lines */}
        <path
          d="M48 30 C 44 38, 54 44, 48 52"
          stroke="url(#cafeLogoAccentGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />
        <path
          d="M62 25 C 57 34, 69 41, 63 52"
          stroke="url(#cafeLogoCreamGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M74 32 C 71 39, 79 44, 76 52"
          stroke="url(#cafeLogoAccentGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />

        {/* Minimalist Coffee Cup Body */}
        <path
          d="M33 56 H82 C82 73 72 84 57.5 84 C43 84 33 73 33 56 Z"
          fill="url(#cafeLogoCreamGrad)"
        />

        {/* Rich Crema Accent */}
        <path
          d="M36 58 H79 C78 68 70 76 57.5 76 C45 76 37 68 36 58 Z"
          fill="#2E1E17"
          opacity="0.12"
        />

        {/* Minimal Handle */}
        <path
          d="M82 60 C89 60 94 63.5 94 69 C94 74.5 89 78 82 78"
          stroke="url(#cafeLogoCreamGrad)"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Clean Saucer Plate */}
        <rect x="30" y="89" width="55" height="4.5" rx="2.25" fill="url(#cafeLogoAccentGrad)" />

        {/* Golden Sparkle Accent */}
        <circle cx="86" cy="33" r="2.2" fill="#F28E46" />
      </svg>

      {/* Optional Brand Wordmark */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-black text-xl tracking-tight text-cafe-primary dark:text-white">
              Café<span className="text-cafe-accent">OS</span>
            </span>
            {badge && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cafe-accent/15 text-cafe-accent uppercase tracking-wider border border-cafe-accent/20">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[10px] font-bold text-cafe-muted">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CafeLogo;

