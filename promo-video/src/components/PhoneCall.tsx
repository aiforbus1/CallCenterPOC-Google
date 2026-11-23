import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { theme } from "../theme/theme";
import { Badge } from "./Badge";

interface PhoneCallProps {
  callerLabel?: string;
  phoneNumber?: string;
  location?: string;
  isRecording?: boolean;
  barCount?: number;
  width?: number | string;
  style?: React.CSSProperties;
}

/**
 * Animated Emergency Call UI component with procedural live waveform.
 * Renders an authoritative dispatch telephone console with active audio modulation.
 */
export const PhoneCall: React.FC<PhoneCallProps> = ({
  callerLabel = "مواطن متصل (بلاغ طارئ)",
  phoneNumber = "010-XXXX-5421",
  location = "شارع التحرير - محطة المترو",
  isRecording = true,
  barCount = 36,
  width = 720,
  style,
}) => {
  const frame = useCurrentFrame();

  // Calculate elapsed call time based on frame count (30fps)
  const totalSeconds = Math.floor(frame / 30);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  const callDuration = `${minutes}:${seconds}`;

  // Procedural waveform height calculations mimicking Arabic speech cadences
  const bars = Array.from({ length: barCount }, (_, i) => {
    // Phase offset per bar
    const phase = i * 0.35;
    // Harmonic frequencies
    const w1 = Math.sin(frame * 0.15 + phase);
    const w2 = Math.cos(frame * 0.08 + phase * 1.5);
    const w3 = Math.sin(frame * 0.22 - phase * 0.8);

    // Combined amplitude between 15% and 95%
    const rawAmp = (w1 * 0.5 + w2 * 0.3 + w3 * 0.2 + 1) / 2;
    const heightPercent = interpolate(rawAmp, [0, 1], [12, 90]);
    return heightPercent;
  });

  return (
    <div
      style={{
        direction: theme.direction,
        backgroundColor: theme.colors.surfaceCard,
        border: `1px solid ${theme.colors.borderMedium}`,
        borderRadius: 18,
        padding: "24px 28px",
        width,
        boxShadow: theme.shadows.panel,
        ...style,
      }}
    >
      {/* Top Header Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${theme.colors.borderSubtle}`,
          paddingBottom: 16,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Badge variant="verified" size="sm" label="قناة اتصال نشطة (122)" />
          <span
            style={{
              fontFamily: theme.fonts.body,
              fontSize: 15,
              color: theme.colors.textMuted,
            }}
          >
            SIP Secure Trunk | 16kHz
          </span>
        </div>

        <div
          style={{
            fontFamily: theme.typography.code.fontFamily,
            fontSize: 18,
            fontWeight: 700,
            color: theme.colors.teal.primary,
            letterSpacing: 1.5,
          }}
        >
          {callDuration}
        </div>
      </div>

      {/* Caller Info Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: 22,
              fontWeight: 700,
              color: theme.colors.textPrimary,
              marginBottom: 4,
            }}
          >
            {callerLabel}
          </div>
          <div
            style={{
              fontFamily: theme.fonts.body,
              fontSize: 16,
              color: theme.colors.textSecondary,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ color: theme.colors.teal.primary }}>📍</span>
            <span>{location}</span>
          </div>
        </div>

        <div
          style={{
            fontFamily: theme.typography.code.fontFamily,
            fontSize: 18,
            color: theme.colors.textSecondary,
            direction: "ltr",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            padding: "4px 12px",
            borderRadius: 6,
            border: `1px solid ${theme.colors.borderSubtle}`,
          }}
        >
          {phoneNumber}
        </div>
      </div>

      {/* Live Audio Waveform Display */}
      <div
        style={{
          backgroundColor: theme.colors.background,
          border: `1px solid ${theme.colors.borderSubtle}`,
          borderRadius: 12,
          height: 100,
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 4,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {bars.map((h, index) => {
          // Center bars tinted with teal accent
          const isMid = index >= barCount * 0.3 && index <= barCount * 0.7;
          return (
            <div
              key={index}
              style={{
                flex: 1,
                height: `${h}%`,
                backgroundColor: isMid
                  ? theme.colors.teal.primary
                  : "rgba(255, 255, 255, 0.25)",
                borderRadius: 3,
              }}
            />
          );
        })}

        {isRecording && (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 14,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: theme.colors.amber.primary,
              }}
            />
            <span
              style={{
                fontFamily: theme.fonts.body,
                fontSize: 12,
                color: theme.colors.amber.light,
                fontWeight: 600,
              }}
            >
              تسجيل واستماع مباشر
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
