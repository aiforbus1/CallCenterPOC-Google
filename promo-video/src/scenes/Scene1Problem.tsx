import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { theme } from "../theme/theme";
import { getOfflineFontFaceStyles } from "../theme/fonts";
import { content } from "../data/content";
import { Badge, LowerThird, SceneTransition } from "../components";

/**
 * Scene 1: The Operational Problem (0 - 12s | Frames 0 - 360)
 * Visuals: Abstract, no real faces or real incidents.
 * - Overlapping audio waveforms representing dialect, panic, and street noise.
 * - An incoming emergency call counter ticking up under pressure.
 * - A live raw STT transcript showing phonetic & numerical errors with subtle red underlines.
 * - Core impact statement: In an emergency, a single mis-heard word costs critical minutes.
 */
export const Scene1Problem: React.FC = () => {
  const frame = useCurrentFrame();

  // Call counter ticking up: from 138 to 194 calls
  const callCount = Math.floor(
    interpolate(frame, [0, 360], [138, 194], {
      extrapolateRight: "clamp",
    })
  );

  // Incoming queue load percentage (amber alert)
  const queueLoadPercent = Math.min(
    98,
    Math.floor(interpolate(frame, [0, 360], [68, 94]))
  );

  // Card animations (smooth ease-out)
  const topCardsEntrance = interpolate(frame, [10, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const transcriptEntrance = interpolate(frame, [60, 78], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Message callout banner entrance (appears around frame 170 / ~5.6s)
  const bannerEntrance = interpolate(frame, [170, 190], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Procedural waveform bars for two distinct overlapping acoustic channels
  // Channel 1: Rapid speech under panic (38 bars)
  const callerWaveBars = Array.from({ length: 38 }, (_, i) => {
    const phase = i * 0.4;
    const w1 = Math.sin(frame * 0.22 + phase);
    const w2 = Math.cos(frame * 0.14 - phase * 1.8);
    const w3 = Math.sin(frame * 0.35 + phase * 0.5);
    const combined = (w1 * 0.55 + w2 * 0.25 + w3 * 0.2 + 1) / 2;
    return interpolate(combined, [0, 1], [15, 88]);
  });

  // Channel 2: Ambient street noise & sirens (38 bars, lower frequency, chaotic)
  const ambientNoiseBars = Array.from({ length: 38 }, (_, i) => {
    const phase = i * 0.25;
    const w1 = Math.cos(frame * 0.08 + phase * 2);
    const w2 = Math.sin(frame * 0.18 - phase);
    const combined = (w1 * 0.6 + w2 * 0.4 + 1) / 2;
    return interpolate(combined, [0, 1], [10, 65]);
  });

  // Amber pulse for the call intake alert
  const alertPulse = Math.sin(frame * 0.2) > 0 ? 1 : 0.4;

  return (
    <AbsoluteFill
      style={{
        direction: theme.direction,
        backgroundColor: theme.colors.background,
        color: theme.colors.textPrimary,
        fontFamily: theme.fonts.body,
        overflow: "hidden",
        padding: "48px 80px",
      }}
    >
      <style>{getOfflineFontFaceStyles()}</style>

      <SceneTransition durationFrames={16} type="fade">
        {/* LowerThird Scene Header */}
        <LowerThird
          tag={content.lowerThirds.problem.tag}
          title={content.lowerThirds.problem.title}
          subtitle={content.lowerThirds.problem.subtitle}
          startFrame={0}
          durationFrames={360}
        />

        {/* Main Content Layout */}
        <div
          style={{
            marginTop: 120,
            display: "grid",
            gridTemplateColumns: "1.1fr 1.3fr",
            gap: 32,
            alignItems: "start",
          }}
        >
          {/* Right Column: Audio Interference & Stress Metrics */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 22,
              opacity: topCardsEntrance,
              transform: `translateY(${interpolate(topCardsEntrance, [0, 1], [20, 0])}px)`,
            }}
          >
            {/* Live Operational Hotline Intake Card */}
            <div
              style={{
                backgroundColor: theme.colors.surfaceCard,
                border: `1px solid ${theme.colors.borderMedium}`,
                borderRadius: 16,
                padding: "22px 26px",
                boxShadow: theme.shadows.panel,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                  borderBottom: `1px solid ${theme.colors.borderSubtle}`,
                  paddingBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: theme.colors.amber.primary,
                      opacity: alertPulse,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: theme.fonts.heading,
                      fontSize: 18,
                      fontWeight: 700,
                      color: theme.colors.textPrimary,
                    }}
                  >
                    غرفة عمليات النجدة 122 - تدفق البلاغات
                  </span>
                </div>
                <Badge variant="review" size="sm" label="كثافة اتصال قصوى" />
              </div>

              {/* Counter Metrics Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    backgroundColor: theme.colors.background,
                    padding: "16px 20px",
                    borderRadius: 12,
                    border: `1px solid ${theme.colors.borderSubtle}`,
                  }}
                >
                  <div style={{ fontSize: 14, color: theme.colors.textMuted, marginBottom: 4 }}>
                    المكالمات المتزامنة الجارية
                  </div>
                  <div
                    style={{
                      fontFamily: theme.typography.code.fontFamily,
                      fontSize: 42,
                      fontWeight: 800,
                      color: theme.colors.amber.primary,
                      lineHeight: 1,
                    }}
                  >
                    {callCount}
                  </div>
                  <div style={{ fontSize: 13, color: theme.colors.amber.light, marginTop: 4 }}>
                    + مكالمة جديدة كل ثانية
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: theme.colors.background,
                    padding: "16px 20px",
                    borderRadius: 12,
                    border: `1px solid ${theme.colors.borderSubtle}`,
                  }}
                >
                  <div style={{ fontSize: 14, color: theme.colors.textMuted, marginBottom: 4 }}>
                    معدل إشغال الخطوط
                  </div>
                  <div
                    style={{
                      fontFamily: theme.typography.code.fontFamily,
                      fontSize: 42,
                      fontWeight: 800,
                      color: theme.colors.textPrimary,
                      lineHeight: 1,
                    }}
                  >
                    %{queueLoadPercent}
                  </div>
                  <div style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 }}>
                    ضغط عملياتي مستمر
                  </div>
                </div>
              </div>
            </div>

            {/* Overlapping Acoustic Waveforms Card */}
            <div
              style={{
                backgroundColor: theme.colors.surfaceCard,
                border: `1px solid ${theme.colors.borderMedium}`,
                borderRadius: 16,
                padding: "20px 24px",
                boxShadow: theme.shadows.subtle,
              }}
            >
              <div
                style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: 16,
                  fontWeight: 700,
                  color: theme.colors.textSecondary,
                  marginBottom: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>تداخل القنوات الصوتية أثناء البلاغ:</span>
                <span style={{ fontSize: 13, color: theme.colors.amber.primary }}>
                  ضجيج بيئي + سرعة النطق
                </span>
              </div>

              {/* Channel 1: Caller Voice in Dialect */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>
                  القناة الأولى: صوت المتصل (لهجة دارجة تحت وطأة الفزع)
                </div>
                <div
                  style={{
                    height: 52,
                    backgroundColor: theme.colors.background,
                    borderRadius: 8,
                    padding: "6px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  {callerWaveBars.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${h}%`,
                        backgroundColor:
                          i % 4 === 0
                            ? theme.colors.amber.primary
                            : "rgba(245, 158, 11, 0.4)",
                        borderRadius: 2,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Channel 2: Ambient Street Noise */}
              <div>
                <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 4 }}>
                  القناة الثانية: ضوضاء الشارع وصفارات الإنذار المحيطة
                </div>
                <div
                  style={{
                    height: 42,
                    backgroundColor: theme.colors.background,
                    borderRadius: 8,
                    padding: "6px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  {ambientNoiseBars.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${h}%`,
                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                        borderRadius: 2,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Left Column: Raw Transcription With Critical Errors */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              opacity: transcriptEntrance,
              transform: `translateY(${interpolate(transcriptEntrance, [0, 1], [20, 0])}px)`,
            }}
          >
            {/* STT Distortion Simulation Card */}
            <div
              style={{
                backgroundColor: theme.colors.surfaceCard,
                border: `1.5px solid ${theme.colors.borderMedium}`,
                borderRadius: 18,
                padding: "24px 28px",
                boxShadow: theme.shadows.panel,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                  borderBottom: `1px solid ${theme.colors.borderSubtle}`,
                  paddingBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontFamily: theme.fonts.heading,
                      fontSize: 18,
                      fontWeight: 700,
                      color: theme.colors.textPrimary,
                    }}
                  >
                    تفريغ الصوت التقليدي المباشر (Raw STT Feed)
                  </span>
                </div>
                <Badge variant="review" size="sm" label="تشوه سمعي صوتي" />
              </div>

              {/* Speech Error 1: Mis-heard Street Name */}
              <div
                style={{
                  backgroundColor: theme.colors.background,
                  border: `1px solid ${theme.colors.borderSubtle}`,
                  borderRadius: 12,
                  padding: "16px 20px",
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 6 }}>
                  موقع الحادث المنطوق صوتياً:
                </div>
                <div
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 24,
                    lineHeight: 1.5,
                    color: theme.colors.textSecondary,
                  }}
                >
                  «حادث انقلاب عربية في شارع{" "}
                  <span
                    style={{
                      color: theme.colors.textPrimary,
                      fontWeight: 700,
                      borderBottom: "3px solid #EF4444",
                      paddingBottom: 2,
                      backgroundColor: "rgba(239, 68, 68, 0.15)",
                      paddingLeft: 6,
                      paddingRight: 6,
                      borderRadius: 4,
                    }}
                  >
                    أوراد
                  </span>{" "}
                  جمب المحكمة»
                </div>
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    color: "#F87171",
                  }}
                >
                  <span>⚠️ خطأ في اسم الشارع:</span>
                  <span style={{ color: theme.colors.textMuted }}>
                    المتصل قال «شارع مراد»، فسمعه النموذج «شارع أوراد» بسبب ضجيج المحيط
                  </span>
                </div>
              </div>

              {/* Speech Error 2: Distorted Phone Number */}
              <div
                style={{
                  backgroundColor: theme.colors.background,
                  border: `1px solid ${theme.colors.borderSubtle}`,
                  borderRadius: 12,
                  padding: "16px 20px",
                }}
              >
                <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 6 }}>
                  رقم الهاتف المفرغ للمعاودة:
                </div>
                <div
                  style={{
                    fontFamily: theme.typography.code.fontFamily,
                    fontSize: 24,
                    fontWeight: 700,
                    direction: "ltr",
                    textAlign: "right",
                    color: theme.colors.textSecondary,
                  }}
                >
                  010 -{" "}
                  <span
                    style={{
                      color: "#EF4444",
                      borderBottom: "3px solid #EF4444",
                      backgroundColor: "rgba(239, 68, 68, 0.15)",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    334
                  </span>{" "}
                  - 5421
                </div>
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    color: "#F87171",
                  }}
                >
                  <span>⚠️ خطأ في رقم الهاتف:</span>
                  <span style={{ color: theme.colors.textMuted }}>
                    المتصل قال «تسعمية وأربعة وثلاثين»، فاستُبدل الرقم «9» بالرقم «3»
                  </span>
                </div>
              </div>
            </div>

            {/* Core Operational Impact Callout Banner */}
            <div
              style={{
                opacity: bannerEntrance,
                transform: `translateY(${interpolate(bannerEntrance, [0, 1], [16, 0])}px)`,
                backgroundColor: "rgba(239, 68, 68, 0.08)",
                border: "1.5px solid rgba(239, 68, 68, 0.4)",
                borderRadius: 14,
                padding: "16px 22px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                boxShadow: "0 4px 20px rgba(239, 68, 68, 0.15)",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  backgroundColor: "rgba(239, 68, 68, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  color: "#EF4444",
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                !
              </div>
              <div
                style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: 19,
                  fontWeight: 700,
                  color: theme.colors.textPrimary,
                  lineHeight: 1.4,
                }}
              >
                في بلاغات الطوارئ.. التباس حرف واحد في اسم منطقة أو رقم هاتف قد يُهدر دقائق حاسمة
                في وصول الدورية وإنقاذ الأرواح.
              </div>
            </div>
          </div>
        </div>
      </SceneTransition>
    </AbsoluteFill>
  );
};
