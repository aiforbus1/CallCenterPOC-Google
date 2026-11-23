import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, Audio, staticFile, Sequence } from "remotion";
import { theme } from "../theme/theme";
import { getOfflineFontFaceStyles } from "../theme/fonts";
import { content } from "../data/content";
import { Badge, Emblem } from "../components";

/**
 * Vertical 9:16 Composition (1080 x 1920) for Mobile & WhatsApp Sharing
 * Re-lays out the Live Demo centerpiece in an executive mobile portrait format.
 *
 * Duration: 990 frames (33.0s @ 30fps) matching Scene 3 Live Demo audio.
 */
export const Vertical9x16: React.FC = () => {
  const frame = useCurrentFrame();

  // Active beat index (0 to 4)
  const currentBeatIndex =
    frame < 180
      ? 0
      : frame < 360
      ? 1
      : frame < 540
      ? 2
      : frame < 760
      ? 3
      : 4;

  const currentBeat = content.demoCall.beats[currentBeatIndex];

  // Beat relative frame
  const beatRelativeFrame =
    currentBeatIndex === 0
      ? frame
      : currentBeatIndex === 1
      ? frame - 180
      : currentBeatIndex === 2
      ? frame - 360
      : currentBeatIndex === 3
      ? frame - 540
      : frame - 760;

  // Semantic resolution progress in Beat 4 (relative frame 60 to 95)
  const semanticResolveProgress =
    currentBeatIndex === 3
      ? interpolate(beatRelativeFrame, [60, 95], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : 0;

  // Subtitle text for portrait mode
  const currentSubtitle =
    frame < 240
      ? "بِمُجَرَّدِ اتِّصَالِ الموَاطِنِ، تُحَوِّلُ مَنْظُومَةُ التَّفْرِيغِ الصَّوْتِيِّ اللَّحْظِيِّ الكَلَامَ إِلَى نَصٍّ مُبَاشِرٍ."
      : frame < 510
      ? "يَتَدَخَّلُ المُصَحِّحُ اللُّغَوِيُّ الذَّكِيُّ لِضَبْطِ الأَخْطَاءِ دُونَ إِضَافَةِ أَيِّ وَقَائِعَ."
      : frame < 740
      ? "«مَشْغَرَة» تُفْهَمُ فَوْرًا كَـ «مُشَاجَرَة»، وَالمَنْظُومَةُ لَا تُغْلِقُ الخَطَّ أَبَدًا."
      : "عَزْلٌ تَامٌّ لِكَلَامِ المُتَّصِلِ، وَمَأْمُورُ العَمَلِيَّاتِ هُوَ صَاحِبُ القَرَارِ دَائِمًا.";

  return (
    <AbsoluteFill
      style={{
        direction: theme.direction,
        backgroundColor: theme.colors.background,
        color: theme.colors.textPrimary,
        fontFamily: theme.fonts.body,
        overflow: "hidden",
        padding: "60px 48px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <style>{getOfflineFontFaceStyles()}</style>

      {/* Audio: Scene 3 Live Demo Narration & Music */}
      <Audio src={staticFile("audio/vo/scene3.mp3")} volume={1.0} />
      <Audio src={staticFile("audio/music/bed.mp3")} volume={0.07} loop />

      {/* SFX: Verified & Review triggers */}
      <Sequence from={25} durationInFrames={30}>
        <Audio src={staticFile("audio/sfx/verified_tick.mp3")} volume={0.4} />
      </Sequence>
      <Sequence from={225} durationInFrames={30}>
        <Audio src={staticFile("audio/sfx/verified_tick.mp3")} volume={0.4} />
      </Sequence>
      <Sequence from={405} durationInFrames={30}>
        <Audio src={staticFile("audio/sfx/verified_tick.mp3")} volume={0.4} />
      </Sequence>
      <Sequence from={620} durationInFrames={30}>
        <Audio src={staticFile("audio/sfx/verified_tick.mp3")} volume={0.4} />
      </Sequence>
      <Sequence from={780} durationInFrames={45}>
        <Audio src={staticFile("audio/sfx/review_tone.mp3")} volume={0.5} />
      </Sequence>

      {/* SECTION 1: HEADER (Portrait Mobile Header) */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 24px",
            borderRadius: 24,
            backgroundColor: "rgba(224, 86, 36, 0.15)",
            border: `1.5px solid ${theme.colors.amber.primary}`,
            marginBottom: 16,
          }}
        >
          <Emblem size={32} accentColor={theme.colors.amber.primary} />
          <span style={{ fontSize: 24, color: theme.colors.amber.primary, fontWeight: 700, fontFamily: theme.fonts.heading }}>
            شرطة النجدة 122 • قطاع العمليات
          </span>
        </div>

        <h1
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: 44,
            fontWeight: 800,
            color: "#FFFFFF",
            margin: "0 0 10px 0",
            lineHeight: 1.25,
          }}
        >
          المساعد الذكي لبلاغات الطوارئ
        </h1>
        <div style={{ fontSize: 24, color: theme.colors.teal.primary, fontWeight: 600 }}>
          محاكاة عملياتية مباشرة لمعالجة البلاغ بالذكاء الاصطناعي
        </div>
      </div>

      {/* SECTION 2: PHONE CALL CARD (Upper-Middle) */}
      <div
        style={{
          backgroundColor: theme.colors.surfaceCard,
          border: `1.5px solid ${theme.colors.borderMedium}`,
          borderRadius: 24,
          padding: "24px 32px",
          boxShadow: "0 12px 36px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 24, color: theme.colors.teal.primary, fontWeight: 700 }}>
            📞 مكالمة واردة من المواطن (بيانات افتراضية)
          </span>
          <Badge variant="verified" size="sm" label="مباشر 122" />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 34, fontWeight: 800, color: "#FFFFFF", fontFamily: theme.fonts.heading }}>
              أحمد محمود إبراهيم
            </div>
            <div style={{ fontSize: 24, color: theme.colors.textMuted, marginTop: 4 }}>
              الهاتف: 010-0000-0000 | الموقع: شارع مراد - الجيزة
            </div>
          </div>
          <div
            style={{
              padding: "10px 20px",
              borderRadius: 20,
              backgroundColor: "rgba(224, 86, 36, 0.2)",
              color: theme.colors.amber.primary,
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            جاري التسجيل
          </div>
        </div>

        {/* Dynamic Waveform bar */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", height: 42, marginTop: 18 }}>
          {Array.from({ length: 32 }).map((_, i) => {
            const barH = 10 + Math.abs(Math.sin((frame * 0.15) + (i * 0.4))) * 28;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${barH}px`,
                  backgroundColor: i % 2 === 0 ? theme.colors.teal.primary : theme.colors.amber.primary,
                  borderRadius: 4,
                  opacity: 0.85,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* SECTION 3: CAD LIVE TRANSCRIPT & RESOLUTION (Centerpiece) */}
      <div
        style={{
          backgroundColor: theme.colors.surfaceCard,
          border: `2px solid ${theme.colors.borderMedium}`,
          borderRadius: 24,
          padding: "28px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 26, fontFamily: theme.fonts.heading, fontWeight: 700, color: "#FFFFFF" }}>
            سجل التدقيق والتحليل اللحظي (CAD Live Feed)
          </span>
          <Badge variant={currentBeat.badgeVariant} size="md" label={currentBeat.badgeLabel} />
        </div>

        {/* Assistant prompt */}
        <div
          style={{
            backgroundColor: "rgba(14, 165, 233, 0.12)",
            borderRight: `4px solid ${theme.colors.teal.primary}`,
            padding: "16px 20px",
            borderRadius: 12,
          }}
        >
          <div style={{ fontSize: 20, color: theme.colors.teal.primary, fontWeight: 700, marginBottom: 4 }}>
            مأمور العمليات 122:
          </div>
          <div style={{ fontSize: 26, color: "#FFFFFF", fontWeight: 600 }}>
            {currentBeat.assistantPrompt}
          </div>
        </div>

        {/* Caller speech & correction */}
        <div
          style={{
            backgroundColor: "rgba(10, 16, 30, 0.95)",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "18px 20px",
            borderRadius: 14,
          }}
        >
          <div style={{ fontSize: 20, color: theme.colors.amber.primary, fontWeight: 700, marginBottom: 4 }}>
            صوت المواطن (التفريغ الصوتي المباشر):
          </div>
          <div style={{ fontSize: 26, color: "#D1D5DB" }}>
            {currentBeat.callerRawText || currentBeat.suspiciousInput || "..."}
          </div>
        </div>

        {/* Semantic Resolution Highlight (Beats 3 & 4) */}
        {currentBeatIndex === 3 && (
          <div
            style={{
              backgroundColor: semanticResolveProgress > 0.5 ? "rgba(20, 184, 166, 0.15)" : "rgba(255,255,255,0.03)",
              border: `2px solid ${semanticResolveProgress > 0.5 ? theme.colors.teal.primary : "rgba(255,255,255,0.1)"}`,
              borderRadius: 16,
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 22, color: theme.colors.teal.primary, fontWeight: 700 }}>
                المطابق الدلالي (Semantic Matcher)
              </span>
              <Badge variant="verified" size="sm" label="تطابق قطعي" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontSize: 30, color: theme.colors.amber.primary, fontWeight: 700 }}>
                «مشغرة»
              </div>
              <div style={{ fontSize: 30, color: theme.colors.teal.primary }}>➔</div>
              <div style={{ fontSize: 30, color: theme.colors.teal.primary, fontWeight: 800 }}>
                «مشاجرة واعتداء»
              </div>
            </div>
            <div style={{ fontSize: 20, color: theme.colors.textMuted, marginTop: 8 }}>
              ✓ النظام يفهم البلاغ مباشرة ولا يسقط المكالمة
            </div>
          </div>
        )}

        {/* Safety flag for Beat 5 */}
        {currentBeatIndex === 4 && (
          <div
            style={{
              backgroundColor: "rgba(224, 86, 36, 0.15)",
              border: `2px solid ${theme.colors.amber.primary}`,
              borderRadius: 16,
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 22, color: theme.colors.amber.primary, fontWeight: 700 }}>
                ⚠️ تنبيه الأمان: هاتف غير مكتمل (9 أرقام)
              </span>
              <Badge variant="review" size="sm" label="يحتاج مراجعة بشرية" />
            </div>
            <div style={{ fontSize: 20, color: "#FFFFFF", marginTop: 8 }}>
              المنظومة تنبه المأمور وتطلب الاستيضاح بلباقة دون اختلاق أرقام
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: PIPELINE BADGES (Compact Portrait) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        <div style={{ backgroundColor: "rgba(255,255,255,0.04)", padding: "12px 14px", borderRadius: 14, textAlign: "center", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 18, color: theme.colors.textMuted }}>المرحلة 1</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: theme.colors.teal.primary, marginTop: 2 }}>التفريغ الصوتي</div>
        </div>
        <div style={{ backgroundColor: "rgba(255,255,255,0.04)", padding: "12px 14px", borderRadius: 14, textAlign: "center", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 18, color: theme.colors.textMuted }}>المرحلة 2</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: theme.colors.amber.primary, marginTop: 2 }}>المصحح اللغوي</div>
        </div>
        <div style={{ backgroundColor: "rgba(255,255,255,0.04)", padding: "12px 14px", borderRadius: 14, textAlign: "center", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 18, color: theme.colors.textMuted }}>المرحلة 3</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: theme.colors.teal.primary, marginTop: 2 }}>Semantic Matcher</div>
        </div>
      </div>

      {/* SECTION 5: SUBTITLE OVERLAY (WhatsApp Safe Area) */}
      <div
        style={{
          backgroundColor: "rgba(6, 10, 20, 0.95)",
          border: `1.5px solid ${theme.colors.borderMedium}`,
          padding: "20px 28px",
          borderRadius: 20,
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontFamily: theme.fonts.heading,
            fontWeight: 700,
            color: "#FFFFFF",
            lineHeight: 1.35,
          }}
        >
          {currentSubtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
