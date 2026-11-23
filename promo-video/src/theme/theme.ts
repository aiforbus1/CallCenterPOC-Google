import { fontFamilies } from "./fonts";

/**
 * Government-grade, trustworthy visual theme.
 * Serious deep navy background, crisp white text, and strict two-accent color system:
 * - Amber for alerts & human review
 * - Teal for verified & safe states
 * No flashy gradients or stock-photo clichés.
 */
export const theme = {
  direction: "rtl" as const,
  fonts: fontFamilies,
  colors: {
    // Deep sovereign navy surfaces
    background: "#070D1E",
    surfaceDark: "#0B1428",
    surfaceCard: "#101D38",
    surfaceElevated: "#162548",

    // Structural borders
    borderSubtle: "rgba(255, 255, 255, 0.08)",
    borderMedium: "rgba(255, 255, 255, 0.16)",
    borderStrong: "rgba(255, 255, 255, 0.3)",

    // Typography
    textPrimary: "#FFFFFF",
    textSecondary: "#CBD5E1",
    textMuted: "#94A3B8",
    textInverse: "#070D1E",

    // Accent: Amber (for alerts, pending verification, and human review needed)
    amber: {
      primary: "#F59E0B",
      dark: "#D97706",
      light: "#FDE68A",
      background: "rgba(245, 158, 11, 0.12)",
      border: "rgba(245, 158, 11, 0.4)",
      badgeText: "#FCD34D",
    },

    // Accent: Teal (for verified, safe, confirmed, and operational states)
    teal: {
      primary: "#14B8A6",
      dark: "#0D9488",
      light: "#99F6E4",
      background: "rgba(20, 184, 166, 0.12)",
      border: "rgba(20, 184, 166, 0.4)",
      badgeText: "#5EEAD4",
    },
  },
  motion: {
    // Subtle transitions: 12-20 frames (at 30fps = 0.4s to 0.67s)
    defaultDurationFrames: 16,
    quickDurationFrames: 12,
    deliberateDurationFrames: 20,
  },
  typography: {
    hero: {
      fontFamily: fontFamilies.heading,
      fontWeight: 800,
      fontSize: 52,
      lineHeight: 1.25,
    },
    title: {
      fontFamily: fontFamilies.heading,
      fontWeight: 700,
      fontSize: 38,
      lineHeight: 1.3,
    },
    section: {
      fontFamily: fontFamilies.heading,
      fontWeight: 600,
      fontSize: 28,
      lineHeight: 1.4,
    },
    bodyLarge: {
      fontFamily: fontFamilies.body,
      fontWeight: 500,
      fontSize: 24,
      lineHeight: 1.5,
    },
    body: {
      fontFamily: fontFamilies.body,
      fontWeight: 400,
      fontSize: 20,
      lineHeight: 1.6,
    },
    caption: {
      fontFamily: fontFamilies.body,
      fontWeight: 400,
      fontSize: 16,
      lineHeight: 1.4,
    },
    code: {
      fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
      fontSize: 18,
    },
  },
  shadows: {
    subtle: "0 4px 16px rgba(0, 0, 0, 0.35)",
    panel: "0 8px 30px rgba(0, 0, 0, 0.5)",
    amberGlow: "0 0 20px rgba(245, 158, 11, 0.2)",
    tealGlow: "0 0 20px rgba(20, 184, 166, 0.2)",
  },
};
