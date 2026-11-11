import React, { useId } from 'react';

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
 * Renders pure inline SVG with solid fallbacks and scoped IDs so it CANNOT fail to load
 * regardless of network, responsive display toggles, or routing.
 */
export const CafeLogo: React.FC<CafeLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  subtitle,
  badge,
}) => {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 40;
  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9-_]/g, '');
  const bgGradId = `cafeLogoBg_${safeId}`;
  const accentGradId = `cafeLogoAccent_${safeId}`;
  const creamGradId = `cafeLogoCream_${safeId}`;
  const glowId = `cafeLogoGlow_${safeId}`;

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
          <linearGradient id={bgGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#231712" />
            <stop offset="50%" stopColor="#2E1E17" />
            <stop offset="100%" stopColor="#3C261D" />
          </linearGradient>
          <linearGradient id={accentGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F28E46" />
            <stop offset="100%" stopColor="#D97736" />
          </linearGradient>
          <linearGradient id={creamGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF8F0" />
            <stop offset="100%" stopColor="#F5EBE1" />
          </linearGradient>
          <radialGradient id={glowId} cx="50%" cy="55%" r="45%">
            <stop offset="0%" stopColor="#D97736" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#D97736" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Solid Dark Espresso Squircle Base (Guarantees rich dark background is NEVER transparent) */}
        <rect
          x="2"
          y="2"
          width="116"
          height="116"
          rx="28"
          fill="#241813"
        />

        {/* Gradient Overlay with Luxury Border */}
        <rect
          x="2"
          y="2"
          width="116"
          height="116"
          rx="28"
          fill={`url(#${bgGradId})`}
          stroke="#D97736"
          strokeWidth="2.5"
          strokeOpacity="0.45"
        />

        {/* Ambient Inner Glow */}
        <circle cx="60" cy="65" r="42" fill={`url(#${glowId})`} />

        {/* Dynamic Minimal Steam Lines (Vibrant amber & cream) */}
        <path
          d="M48 30 C 44 38, 54 44, 48 52"
          stroke="#F28E46"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />
        <path
          d="M62 25 C 57 34, 69 41, 63 52"
          stroke="#FFF8F0"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M74 32 C 71 39, 79 44, 76 52"
          stroke="#F28E46"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />

        {/* Minimalist Coffee Cup Body (Solid crisp cream with gradient) */}
        <path
          d="M33 56 H82 C82 73 72 84 57.5 84 C43 84 33 73 33 56 Z"
          fill="#FFF8F0"
        />
        <path
          d="M33 56 H82 C82 73 72 84 57.5 84 C43 84 33 73 33 56 Z"
          fill={`url(#${creamGradId})`}
        />

        {/* Rich Crema Accent */}
        <path
          d="M36 58 H79 C78 68 70 76 57.5 76 C45 76 37 68 36 58 Z"
          fill="#2E1E17"
          opacity="0.16"
        />

        {/* Minimal Cup Handle (Solid crisp cream) */}
        <path
          d="M82 60 C89 60 94 63.5 94 69 C94 74.5 89 78 82 78"
          stroke="#FFF8F0"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Clean Saucer Plate (Solid warm amber) */}
        <rect x="30" y="89" width="55" height="4.5" rx="2.25" fill="#D97736" />
        <rect x="30" y="89" width="55" height="4.5" rx="2.25" fill={`url(#${accentGradId})`} />

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
