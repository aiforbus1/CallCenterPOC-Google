import React from "react";
import { theme } from "../theme/theme";

export type BadgeVariant = "verified" | "review" | "neutral";

interface BadgeProps {
  label?: string;
  variant?: BadgeVariant;
  size?: "sm" | "md" | "lg";
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * Standard security badge for the Emergency Hotline 122 design system.
 * Highlights "تم التحقق" (verified - teal) and "يحتاج مراجعة بشرية" (needs review - amber).
 */
export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = "verified",
  size = "md",
  style,
  children,
}) => {
  const isVerified = variant === "verified";
  const isReview = variant === "review";

  const colorScheme = isVerified
    ? theme.colors.teal
    : isReview
    ? theme.colors.amber
    : {
        primary: theme.colors.textSecondary,
        background: "rgba(255, 255, 255, 0.06)",
        border: theme.colors.borderSubtle,
        badgeText: theme.colors.textSecondary,
      };

  const sizeStyles = {
    sm: {
      padding: "6px 14px",
      fontSize: 18,
      dotSize: 8,
      borderRadius: 8,
    },
    md: {
      padding: "8px 18px",
      fontSize: 22,
      dotSize: 10,
      borderRadius: 10,
    },
    lg: {
      padding: "10px 24px",
      fontSize: 26,
      dotSize: 12,
      borderRadius: 12,
    },
  }[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        direction: theme.direction,
        fontFamily: theme.fonts.body,
        fontWeight: 600,
        backgroundColor: colorScheme.background,
        color: colorScheme.badgeText,
        border: `1px solid ${colorScheme.border}`,
        borderRadius: sizeStyles.borderRadius,
        padding: sizeStyles.padding,
        fontSize: sizeStyles.fontSize,
        lineHeight: 1.2,
        letterSpacing: 0.3,
        ...style,
      }}
    >
      {/* Status indicator pulse dot */}
      <span
        style={{
          width: sizeStyles.dotSize,
          height: sizeStyles.dotSize,
          borderRadius: "50%",
          backgroundColor: colorScheme.primary,
          flexShrink: 0,
        }}
      />
      <span>{label || children}</span>
    </span>
  );
};
