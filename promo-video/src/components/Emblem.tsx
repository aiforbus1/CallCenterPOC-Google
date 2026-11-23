import React from "react";

interface EmblemProps {
  size?: number;
  color?: string;
  accentColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Neutral placeholder emblem (simple security shield shape).
 * Complies with asset guidelines: Does NOT use any official ministry or police logos.
 */
export const Emblem: React.FC<EmblemProps> = ({
  size = 64,
  color = "#FFFFFF",
  accentColor = "#14B8A6",
  style,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      {/* Outer shield contour */}
      <path
        d="M32 6L14 14V30C14 42.5 21.7 54.1 32 58C42.3 54.1 50 42.5 50 30V14L32 6Z"
        fill="rgba(255, 255, 255, 0.04)"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Inner shield inset */}
      <path
        d="M32 13L19 19V30C19 39.8 24.6 48.9 32 52C39.4 48.9 45 39.8 45 30V19L32 13Z"
        stroke={accentColor}
        strokeWidth="1.5"
        strokeOpacity="0.7"
        strokeDasharray="2 2"
      />
      {/* Central node / core signal */}
      <circle cx="32" cy="31" r="5" fill={accentColor} />
      <path
        d="M32 21V23M32 39V41M22 31H24M40 31H42"
        stroke={accentColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};
