import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, Easing, Audio, staticFile } from "remotion";
import { theme } from "../theme/theme";
import { getOfflineFontFaceStyles } from "../theme/fonts";
import { content } from "../data/content";
import { Emblem, Badge, PhoneCall } from "../components";

/**
 * Teaser 30s Composition (900 frames @ 30fps)
 * Structure:
 * 1. Hook (0 - 6s | Frames 0 - 180): Critical emergency pressure + Sovereign Solution Shield
 * 2. Live Demo Highlight (6 - 24s | Frames 180 - 720): Dialect phonetic correction ("مشغرة" -> "مشاجرة")
 * 3. Closing Line (24 - 30s | Frames 720 - 900): Pilot Phase + Egyptian Police Motto
 */
export const Teaser30s: React.FC = () => {
  const frame = useCurrentFrame();

  // Part 1: Hook animations (frames 0 - 180)
  const hookOpacity = interpolate(frame, [0, 15, 165, 180], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hookScale = interpolate(frame, [0, 180], [0.97, 1.03], {
    easing: Easing.out(Easing.cubic),
  });

  // Part 2: Demo Highlight animations (frames 180 - 720)
  const demoOpacity = interpolate(frame, [180, 195, 705, 720], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const demoFrame = Math.max(0, frame - 180);

  // Demo step within highlight:
  // 0 - 180: Caller speaking "مشغرة"
  // 180 - 360: Semantic match resolving to "مشاجرة واعتداء"
  // 360 - 540: Verification badge & Human review safety guard
  const semanticResolveProgress = interpolate(demoFrame, [120, 170], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Part 3: Closing Line animations (frames 720 - 900)
  const closingOpacity = interpolate(frame, [720, 740], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const closingScale = interpolate(frame, [720, 900], [0.96, 1.02], {
    easing: Easing.out(Easing.cubic),
  });

  // Subtitle text for Teaser
  const currentSubtitle =
    frame < 180
      ? "فِي اللَّحَظَاتِ الحَرِجَةِ لِبَلَاغَاتِ النَّجْدَةِ (122).. كُلُّ ثَانِيَةٍ تَصْنَعُ فَارِقًا"
      : frame < 420
      ? "حَتَّى مَعَ تَشَوُّهِ اللَّفْظِ بِاللَّهْجَةِ الدَّارِجَةِ: «مَشْغَرَة» تُفْهَمُ فَوْرًا «مُشَاجَرَة»"
      : frame < 720
      ? "تَحَقُّقٌ آلِيٌّ لَحْظِيٌّ، وَمَأْمُورُ العَمَلِيَّاتِ يَظَلُّ دَائِمًا صَاحِبَ القَرَارِ"
      : "المساعد الذكي لغرف طوارئ النجدة: جَاهِزُونَ لِلتَّشْغِيلِ التَّجْرِيبِيِّ المَيْدَانِيِّ";

  return (
    <AbsoluteFill
      style={{
        direction: theme.direction,
        backgroundColor: theme.colors.background,
        color: theme.colors.textPrimary,
        fontFamily: theme.fonts.body,
        overflow: "hidden",
      }}
    >
      <style>{getOfflineFontFaceStyles()}</style>

      {/* Audio: Background Music */}
      <Audio
        src={staticFile("audio/music/bed.mp3")}
        volume={0.18}
      />

      {/* UI Sound SFX: Semantic Match Trigger at frame 320 */}
      <Sequence from={320} durationInFrames={30}>
        <Audio src={staticFile("audio/sfx/verified_tick.mp3")} volume={0.45} />
      </Sequence>

      {/* UI Sound SFX: Safety Verification at frame 560 */}
      <Sequence from={560} durationInFrames={40}>
        <Audio src={staticFile("audio/sfx/verified_tick.mp3")} volume={0.45} />
      </Sequence>

      {/* PART 1: HOOK (0 - 6s) */}
      {frame < 185 && (
        <AbsoluteFill
          style={{
            opacity: hookOpacity,
            transform: `scale(${hookScale})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 80,
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 16,
              padding: "12px 32px",
              borderRadius: 30,
              backgroundColor: "rgba(224, 86, 36, 0.15)",
              border: `1.5px solid ${theme.colors.amber.primary}`,
              marginBottom: 36,
            }}
          >
            <span style={{ fontSize: 28, color: theme.colors.amber.primary, fontFamily: theme.fonts.heading, fontWeight: 700 }}>
              غرف عمليات شرطة النجدة 122
            </span>
          </div>

          <h1
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: 64,
              fontWeight: 800,
              color: "#FFFFFF",
              lineHeight: 1.3,
              maxWidth: 1300,
              marginBottom: 30,
            }}
          >
            فِي اللَّحَظَاتِ الحَرِجَةِ لِبَلَاغَاتِ الطَّوَارِئِ..
            <br />
            <span style={{ color: theme.colors.teal.primary }}>خَطَأٌ صَوْتِيٌّ وَاحِدٌ قَدْ يُكَلِّفُ دَقَائِقَ ثَمِينَةً</span>
          </h1>

          <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            <Emblem size={90} accentColor={theme.colors.teal.primary} />
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: theme.fonts.heading, fontSize: 38, fontWeight: 700, color: "#FFFFFF" }}>
                المساعد الذكي لغرف العمليات
              </div>
              <div style={{ fontSize: 24, color: theme.colors.textMuted }}>
                معالجة سيادية لحظية فائقة الدقة للهجة المصرية
              </div>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* PART 2: LIVE DEMO HIGHLIGHT (6 - 24s) */}
      {frame >= 175 && frame < 725 && (
        <AbsoluteFill
          style={{
            opacity: demoOpacity,
            padding: "40px 80px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Top Headline */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
            <div>
              <div style={{ fontSize: 22, color: theme.colors.teal.primary, fontFamily: theme.fonts.heading, fontWeight: 700 }}>
                محاكاة عملياتية مباشرة • النجدة 122
              </div>
              <h2 style={{ fontSize: 44, fontFamily: theme.fonts.heading, fontWeight: 800, color: "#FFFFFF", margin: "6px 0 0 0" }}>
                المطابقة الدلالية الذكية للبلاغات المشوهة صوتياً
              </h2>
            </div>
            <Badge variant="verified" size="lg" label="تكامل التفريغ اللحظي + المصحح اللغوي + المطابق الدلالي" />
          </div>

          {/* Core Demonstration Box */}
          <div style={{ display: "flex", gap: 40, alignItems: "stretch", margin: "30px 0" }}>
            {/* Left: Caller Phone UI */}
            <div style={{ flex: "0 0 460px" }}>
              <PhoneCall
                phoneNumber="010-0000-0000"
                callerLabel="أحمد محمود إبراهيم"
                location="شارع مراد - الجيزة"
                width="100%"
              />
            </div>

            {/* Right: Live Semantic Resolution Engine */}
            <div
              style={{
                flex: 1,
                backgroundColor: theme.colors.surfaceCard,
                borderRadius: 24,
                border: `1.5px solid ${theme.colors.borderMedium}`,
                padding: "36px 40px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-around",
              }}
            >
              <div>
                <div style={{ fontSize: 22, color: theme.colors.textMuted, marginBottom: 12 }}>
                  1. الصوت المنطوق من المواطن (لهجة دارجة وضجيج):
                </div>
                <div
                  style={{
                    backgroundColor: "rgba(10, 16, 30, 0.9)",
                    padding: "20px 24px",
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.08)",
                    fontSize: 32,
                    fontFamily: theme.fonts.body,
                    color: "#FFFFFF",
                  }}
                >
                  «الحقونا في <span style={{ color: theme.colors.amber.primary, textDecoration: "underline wavy" }}>مشغرة</span> كبيرة في الشارع!»
                </div>
              </div>

              {/* Semantic Resolution Card */}
              <div
                style={{
                  backgroundColor: semanticResolveProgress > 0.5 ? "rgba(14, 165, 233, 0.12)" : "rgba(255,255,255,0.03)",
                  border: `2px solid ${semanticResolveProgress > 0.5 ? theme.colors.teal.primary : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 20,
                  padding: "24px 28px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 22, color: theme.colors.teal.primary, fontWeight: 700 }}>
                    2. المعالجة الدلالية الفورية (Semantic Matcher)
                  </span>
                  <Badge
                    variant={semanticResolveProgress > 0.5 ? "verified" : "neutral"}
                    size="md"
                    label={semanticResolveProgress > 0.5 ? "تطابق دلالي قطعي" : "قيد التحليل الدلالي..."}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <div style={{ fontSize: 36, color: theme.colors.amber.primary, fontWeight: 700 }}>
                    «مشغرة»
                  </div>
                  <div style={{ fontSize: 36, color: theme.colors.teal.primary }}>➔</div>
                  <div style={{ fontSize: 36, color: theme.colors.teal.primary, fontWeight: 800 }}>
                    «مشاجرة واعتداء في الطريق العام»
                  </div>
                </div>

                <div style={{ marginTop: 14, fontSize: 20, color: theme.colors.textMuted }}>
                  ✓ المنظومة لا تُنهي المكالمة وتنتقل مباشرة للأسئلة التخصصية للمشاجرات
                </div>
              </div>

              {/* Bottom Guarantee */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 20px",
                  borderRadius: 14,
                  backgroundColor: "rgba(20, 184, 166, 0.08)",
                  border: `1px solid ${theme.colors.teal.dark}`,
                }}
              >
                <span style={{ fontSize: 24 }}>🛡️</span>
                <span style={{ fontSize: 22, color: "#FFFFFF", fontWeight: 600 }}>
                  قاعدة سيادية: كلام المتصل بيانات مجردة، والنص الأصلي محفوظ كاملاً بجانب المصحح
                </span>
              </div>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* PART 3: CLOSING LINE (24 - 30s) */}
      {frame >= 715 && (
        <AbsoluteFill
          style={{
            opacity: closingOpacity,
            transform: `scale(${closingScale})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 80,
            textAlign: "center",
          }}
        >
          <Emblem size={130} accentColor={theme.colors.teal.primary} />

          <div
            style={{
              marginTop: 30,
              fontSize: 26,
              color: theme.colors.amber.primary,
              fontFamily: theme.fonts.heading,
              fontWeight: 700,
            }}
          >
            وزارة الداخلية • قطاع الأزمات والعمليات
          </div>

          <h2
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: 54,
              fontWeight: 800,
              color: "#FFFFFF",
              margin: "16px 0 24px 0",
            }}
          >
            المساعد الذكي لغرف طوارئ النجدة (122)
          </h2>

          <div
            style={{
              padding: "16px 48px",
              borderRadius: 36,
              backgroundColor: "rgba(14, 165, 233, 0.15)",
              border: `2px solid ${theme.colors.teal.primary}`,
              fontSize: 32,
              fontFamily: theme.fonts.heading,
              fontWeight: 700,
              color: "#FFFFFF",
              marginBottom: 28,
            }}
          >
            جاهزون لتدشين المرحلة التجريبية الميدانية المحدودة
          </div>

          <div style={{ fontSize: 24, color: theme.colors.textMuted }}>
            {content.closing.motto}
          </div>
        </AbsoluteFill>
      )}

      {/* Burned-in Arabic Subtitle */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 80,
          right: 80,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(6, 10, 20, 0.92)",
            border: `1px solid ${theme.colors.borderMedium}`,
            padding: "16px 36px",
            borderRadius: 16,
            fontSize: 38,
            fontFamily: theme.fonts.heading,
            fontWeight: 700,
            color: "#FFFFFF",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
          }}
        >
          {currentSubtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
