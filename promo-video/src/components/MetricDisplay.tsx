import React from "react";
import { theme } from "../theme/theme";

interface MetricDisplayProps {
  label: string;
  value: number | null;
  suffix?: string;
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * MetricDisplay component.
 * CRITICAL RULE: If value is null, renders nothing (null).
 * Does NOT invent statistics or display mock numbers when value is null.
 */
export const MetricDisplay: React.FC<MetricDisplayProps> = ({
  label,
  value,
  suffix = "",
  prefix = "",
  style,
}) => {
  if (value === null || value === undefined) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.surfaceCard,
        border: `1px solid ${theme.colors.borderMedium}`,
        borderRadius: 16,
        padding: "20px 28px",
        boxShadow: theme.shadows.subtle,
        direction: theme.direction,
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: 48,
          fontWeight: 800,
          color: theme.colors.teal.primary,
          lineHeight: 1.1,
          marginBottom: 8,
          display: "flex",
          alignItems: "baseline",
          gap: 4,
        }}
      >
        {prefix && <span style={{ fontSize: 24 }}>{prefix}</span>}
        <span>{value}</span>
        {suffix && <span style={{ fontSize: 24 }}>{suffix}</span>}
      </div>
      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: 18,
          fontWeight: 500,
          color: theme.colors.textSecondary,
          textAlign: "center",
        }}
      >
        {label}
      </div>
    </div>
  );
};
