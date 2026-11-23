import React from "react";

interface NeutralShieldProps {
  className?: string;
  size?: number;
}

/**
 * Neutral shield placeholder emblem.
 * Strictly neutral geometric design with no official ministry or police insignia.
 */
export default function NeutralShield({ className = "w-10 h-10", size = 40 }: NeutralShieldProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Neutral Security Emblem"
      role="img"
    >
      <defs>
        <linearGradient id="shieldGrad" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e293b" />
          <stop offset="0.5" stopColor="#0f172a" />
          <stop offset="1" stopColor="#0a1128" />
        </linearGradient>
        <linearGradient id="borderGrad" x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14b8a6" />
          <stop offset="0.5" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="innerGlow" x1="32" y1="14" x2="32" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0ea5e9" stopOpacity="0.4" />
          <stop offset="1" stopColor="#14b8a6" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Outer Shield Shell */}
      <path
        d="M32 6L10 16V31C10 44.8 19.4 57.6 32 61C44.6 57.6 54 44.8 54 31V16L32 6Z"
        fill="url(#shieldGrad)"
        stroke="url(#borderGrad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Internal Geometry & Neural Node Center */}
      <path
        d="M32 14L16 22V32C16 41.5 22.8 50.3 32 53C41.2 50.3 48 41.5 48 32V22L32 14Z"
        fill="url(#innerGlow)"
        stroke="#14b8a6"
        strokeWidth="1.2"
        strokeOpacity="0.6"
      />

      {/* Stylized Signal / Response Waves */}
      <path
        d="M32 23V41M25 28L32 35L39 28"
        stroke="#38bdf8"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Center Verified Beacon Node */}
      <circle cx="32" cy="23" r="2.5" fill="#14b8a6" />
    </svg>
  );
}
