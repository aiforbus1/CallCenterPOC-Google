import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, Audio, staticFile, Sequence } from "remotion";
import { theme } from "../theme/theme";
import { getOfflineFontFaceStyles } from "../theme/fonts";
import { content } from "../data/content";
import { Badge, LowerThird, PhoneCall, PipelineDiagram, SceneTransition } from "../components";

/**
 * Scene 3: Live Interactive Demo (22 - 55s | 33 seconds = 990 frames)
 * The centerpiece of the promo video.
 *
 * Sequence:
 * 1. Assistant asks name. Caller answers. Transcript logs into CAD card.
 * 2. Assistant asks phone. Caller gives fake number. Raw -> Corrected digits with "تم التحقق".
 * 3. Assistant asks location. Caller gives location with mis-heard words ("اوراد" -> "مراد").
 * 4. Assistant asks incident type. Garbled "مشغرة": Corrector leaves unchanged -> Semantic Matcher
 *    resolves to "مشاجرة" with visual confidence-style animation -> Proceeds to follow-up questions.
 * 5. Incomplete phone number (9 digits) triggers "يحتاج مراجعة بشرية" badge and operator clarification.
 */
export const Scene3LiveDemo: React.FC = () => {
  const frame = useCurrentFrame();

  // Active beat index based on frame ranges (0 to 4)
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

  // Pipeline stage index based on beat
  const activePipelineIndex =
    currentBeatIndex === 0
      ? 1 // STT
      : currentBeatIndex === 1
      ? 2 // Correction
      : currentBeatIndex === 2
      ? 2 // Correction
      : currentBeatIndex === 3
      ? frame < 650
        ? 3 // Semantic Matcher
        : 4 // Question Tree
      : 4; // Safety & Question Tree

  // Beat transition animation (0 to 1) for the right-hand panel
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

  const panelEntrance = interpolate(beatRelativeFrame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Semantic resolution progress in Beat 4 (frames 540 to 760 => relative frame 0 to 220)
  // At relative frame 45, raw arrives. At frame 75, corrector leaves unchanged. At frame 110, semantic matcher resolves.
  const semanticResolveProgress =
    currentBeatIndex === 3
      ? interpolate(beatRelativeFrame, [60, 95], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : 0;

  // Phone number correction progress in Beat 2 (relative frame 35 to 60)
  const phoneDigitCorrectionProgress =
    currentBeatIndex === 1
      ? interpolate(beatRelativeFrame, [35, 55], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : 1;

  // Location correction progress in Beat 3 (relative frame 35 to 60)
  const locationCorrectionProgress =
    currentBeatIndex === 2
      ? interpolate(beatRelativeFrame, [35, 55], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : 1;

  return (
    <AbsoluteFill
      style={{
        direction: theme.direction,
        backgroundColor: theme.colors.background,
        color: theme.colors.textPrimary,
        fontFamily: theme.fonts.body,
        overflow: "hidden",
        padding: "36px 80px 24px 80px",
      }}
    >
      <style>{getOfflineFontFaceStyles()}</style>

      <SceneTransition durationFrames={16} type="fade">
        {/* LowerThird Scene Header */}
        <LowerThird
          tag={content.lowerThirds.liveDemo.tag}
          title={content.lowerThirds.liveDemo.title}
          subtitle={content.lowerThirds.liveDemo.subtitle}
          startFrame={0}
          durationFrames={990}
        />

        {/* Subtle UI Sound Cues synchronized to beat validation & alert moments */}
        {/* Beat 1: Verified badge "تم التسجيل" */}
        <Sequence from={25} durationInFrames={30} name="SFX: Beat 1 Verified">
          <Audio src={staticFile("audio/sfx/verified_tick.mp3")} volume={0.4} />
        </Sequence>

        {/* Beat 2: Verified badge "تم التحقق (11 رقماً)" */}
        <Sequence from={225} durationInFrames={30} name="SFX: Beat 2 Verified">
          <Audio src={staticFile("audio/sfx/verified_tick.mp3")} volume={0.4} />
        </Sequence>

        {/* Beat 3: Geo match badge "تم التدقيق الجغرافي" */}
        <Sequence from={405} durationInFrames={30} name="SFX: Beat 3 Geo Match">
          <Audio src={staticFile("audio/sfx/verified_tick.mp3")} volume={0.4} />
        </Sequence>

        {/* Beat 4: Semantic match badge "تطابق دلالي مؤكد" */}
        <Sequence from={620} durationInFrames={30} name="SFX: Beat 4 Semantic Match">
          <Audio src={staticFile("audio/sfx/verified_tick.mp3")} volume={0.4} />
        </Sequence>

        {/* Beat 5: Amber alert badge "يحتاج مراجعة بشرية" */}
        <Sequence from={780} durationInFrames={45} name="SFX: Beat 5 Review Alert">
          <Audio src={staticFile("audio/sfx/review_tone.mp3")} volume={0.5} />
        </Sequence>

        {/* Top Operational Status Bar */}
        <div
          style={{
            marginTop: 90,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: theme.colors.teal.primary,
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
              غرفة العمليات المركزية (122) • محاكاة معالجة بلاغ طارئ
            </span>
            <Badge variant="verified" size="sm" label="قناة مشفرة - بيانات افتراضية" />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: theme.colors.textMuted }}>
              الخطوة {currentBeatIndex + 1} من 5:
            </span>
            <span
              style={{
                fontFamily: theme.fonts.heading,
                fontSize: 14,
                fontWeight: 700,
                color:
                  currentBeatIndex === 4
                    ? theme.colors.amber.primary
                    : theme.colors.teal.primary,
              }}
            >
              {currentBeatIndex === 0
                ? "إثبات هوية المتصل"
                : currentBeatIndex === 1
                ? "تدقيق رقم الهاتف وتنسيقه"
                : currentBeatIndex === 2
                ? "تصحيح المعالم الجغرافية"
                : currentBeatIndex === 3
                ? "المطابقة الدلالية لنوع الحادث"
                : "الحوكمة والتحقق من الأرقام"}
            </span>
          </div>
        </div>

        {/* Center Main Stage: 2-Column Split Console */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 1.35fr",
            gap: 28,
            alignItems: "stretch",
            marginBottom: 20,
            minHeight: 520,
          }}
        >
          {/* Left Column: Phone Console + Incident Summary Card */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Phone Call Component */}
            <PhoneCall
              callerLabel={content.demoCall.callerLabel}
              phoneNumber={content.demoCall.callerNumber}
              location={content.demoCall.callerLocation}
              isRecording={true}
              width="100%"
            />

            {/* Official Incident Logging Card (CAD Intake Form) */}
            <div
              style={{
                backgroundColor: theme.colors.surfaceCard,
                border: `1px solid ${theme.colors.borderMedium}`,
                borderRadius: 16,
                padding: "20px 24px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: theme.shadows.subtle,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: `1px solid ${theme.colors.borderSubtle}`,
                  paddingBottom: 10,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: 16,
                    fontWeight: 700,
                    color: theme.colors.textPrimary,
                  }}
                >
                  بطاقة البلاغ العملياتية (CAD Intake Ticket)
                </span>
                <span
                  style={{
                    fontFamily: theme.typography.code.fontFamily,
                    fontSize: 12,
                    color: theme.colors.teal.primary,
                  }}
                >
                  INC-2026-0122-V
                </span>
              </div>

              {/* Form Fields Ticking in as Call Progresses */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Field 1: Name */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 15,
                    opacity: currentBeatIndex >= 0 ? 1 : 0.35,
                  }}
                >
                  <span style={{ color: theme.colors.textMuted }}>اسم المتصل:</span>
                  <span style={{ fontWeight: 700, color: theme.colors.textPrimary }}>
                    {currentBeatIndex >= 0 ? "أحمد محمود إبراهيم" : "— قيد الاستماع —"}
                  </span>
                </div>

                {/* Field 2: Phone */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 15,
                    opacity: currentBeatIndex >= 1 ? 1 : 0.35,
                  }}
                >
                  <span style={{ color: theme.colors.textMuted }}>رقم التواصل:</span>
                  <span
                    style={{
                      fontFamily: theme.typography.code.fontFamily,
                      fontWeight: 700,
                      direction: "ltr",
                      color:
                        currentBeatIndex === 4
                          ? theme.colors.amber.primary
                          : theme.colors.teal.primary,
                    }}
                  >
                    {currentBeatIndex >= 1
                      ? currentBeatIndex === 4
                        ? "010-000-000 [مراجعة]"
                        : "010-0000-0000"
                      : "—"}
                  </span>
                </div>

                {/* Field 3: Location */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 15,
                    opacity: currentBeatIndex >= 2 ? 1 : 0.35,
                  }}
                >
                  <span style={{ color: theme.colors.textMuted }}>موقع البلاغ:</span>
                  <span style={{ fontWeight: 700, color: theme.colors.textPrimary }}>
                    {currentBeatIndex >= 2 ? "شارع مراد - أمام حديقة الحيوان" : "—"}
                  </span>
                </div>

                {/* Field 4: Incident Classification */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 15,
                    opacity: currentBeatIndex >= 3 ? 1 : 0.35,
                  }}
                >
                  <span style={{ color: theme.colors.textMuted }}>تصنيف الحادث:</span>
                  <span
                    style={{
                      fontWeight: 700,
                      color:
                        currentBeatIndex >= 3 && semanticResolveProgress > 0.6
                          ? theme.colors.teal.light
                          : theme.colors.textSecondary,
                    }}
                  >
                    {currentBeatIndex >= 3 && semanticResolveProgress > 0.6
                      ? "مشاجرة واعتداء في الطريق العام"
                      : currentBeatIndex >= 3
                      ? "مشغرة [جارٍ المطابقة...]"
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Status Footer */}
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 8,
                  borderTop: `1px dashed ${theme.colors.borderSubtle}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 13, color: theme.colors.textMuted }}>
                  حالة التكامل العملياتي:
                </span>
                <Badge
                  variant={currentBeatIndex === 4 ? "review" : "verified"}
                  size="sm"
                  label={
                    currentBeatIndex === 4
                      ? "تنبيه تدقيق: مراجعة رقم الهاتف"
                      : "تغذية متزامنة مع شاشة المأمور"
                  }
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Turn-by-Turn Processing & Validation Display */}
          <div
            style={{
              backgroundColor: theme.colors.surfaceCard,
              border: `1.5px solid ${
                currentBeatIndex === 4
                  ? theme.colors.amber.border
                  : theme.colors.borderMedium
              }`,
              borderRadius: 18,
              padding: "26px 30px",
              boxShadow:
                currentBeatIndex === 4
                  ? theme.shadows.amberGlow
                  : theme.shadows.panel,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              opacity: panelEntrance,
              transform: `translateY(${interpolate(panelEntrance, [0, 1], [14, 0])}px)`,
            }}
          >
            {/* Turn Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: `1px solid ${theme.colors.borderSubtle}`,
                paddingBottom: 14,
                marginBottom: 18,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: 18,
                    fontWeight: 700,
                    color: theme.colors.textPrimary,
                  }}
                >
                  الحوار الميداني والتدقيق اللحظي
                </span>
                <Badge
                  variant={currentBeat.badgeVariant}
                  size="sm"
                  label={currentBeat.badgeLabel}
                />
              </div>

              <div
                style={{
                  fontFamily: theme.typography.code.fontFamily,
                  fontSize: 12,
                  color: theme.colors.textMuted,
                }}
              >
                {currentBeat.soundCue}
              </div>
            </div>

            {/* Conversation Flow Area */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* 1. Assistant Prompt Bubble */}
              <div
                style={{
                  backgroundColor: "rgba(20, 184, 166, 0.08)",
                  border: `1px solid ${theme.colors.teal.border}`,
                  borderRadius: 12,
                  padding: "14px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: theme.colors.teal.primary,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>مساعد العمليات الذكي (122):</span>
                </div>
                <div
                  style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: 20,
                    fontWeight: 600,
                    color: theme.colors.textPrimary,
                    lineHeight: 1.4,
                  }}
                >
                  {currentBeat.assistantPrompt}
                </div>
              </div>

              {/* 2. Caller Turn / Processing Block */}
              {/* Beat 1: Name */}
              {currentBeatIndex === 0 && (
                <div
                  style={{
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.borderSubtle}`,
                    borderRadius: 12,
                    padding: "16px 20px",
                  }}
                >
                  <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 6 }}>
                    تفريغ صوت المتصل المباشر:
                  </div>
                  <div
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: 24,
                      fontWeight: 700,
                      color: theme.colors.textPrimary,
                    }}
                  >
                    «{currentBeat.callerRawText}»
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 13,
                      color: theme.colors.teal.light,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>✓</span>
                    <span>تم التعرف الحرفي وتوثيق الاسم دون أي تعديل أو اختلاق وقائع.</span>
                  </div>
                </div>
              )}

              {/* Beat 2: Phone Number Formatting & Verification */}
              {currentBeatIndex === 1 && (
                <div
                  style={{
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.borderSubtle}`,
                    borderRadius: 12,
                    padding: "16px 20px",
                  }}
                >
                  <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 6 }}>
                    تحويل النص المنطوق إلى أرقام قياسية معتمدة:
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: theme.colors.surfaceCard,
                      padding: "12px 18px",
                      borderRadius: 10,
                      border: `1px solid ${theme.colors.borderMedium}`,
                    }}
                  >
                    <div style={{ color: theme.colors.textSecondary, fontSize: 18 }}>
                      <span style={{ fontSize: 12, color: theme.colors.textMuted, display: "block" }}>
                        النص الخام المسموع:
                      </span>
                      «{currentBeat.callerRawText}»
                    </div>

                    <div style={{ color: theme.colors.teal.primary, fontSize: 24, fontWeight: 900 }}>
                      ←
                    </div>

                    <div>
                      <span style={{ fontSize: 12, color: theme.colors.teal.primary, display: "block" }}>
                        الرقم المنسق المعتمد:
                      </span>
                      <span
                        style={{
                          fontFamily: theme.typography.code.fontFamily,
                          fontSize: 24,
                          fontWeight: 800,
                          color:
                            phoneDigitCorrectionProgress > 0.5
                              ? theme.colors.teal.light
                              : theme.colors.textPrimary,
                          direction: "ltr",
                        }}
                      >
                        {phoneDigitCorrectionProgress > 0.5
                          ? currentBeat.callerCorrectedText
                          : "01000000000"}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: theme.colors.teal.light,
                    }}
                  >
                    <span>✓ قاعدة الأمان:</span>
                    <span>كتابة أرقام الهواتف كأرقام عددية بدقة، مع منع تخمين أي رقم ناقص.</span>
                  </div>
                </div>
              )}

              {/* Beat 3: Location Correction */}
              {currentBeatIndex === 2 && (
                <div
                  style={{
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.borderSubtle}`,
                    borderRadius: 12,
                    padding: "16px 20px",
                  }}
                >
                  <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 8 }}>
                    تصحيح الأخطاء الصوتية الناتجة عن اللهجة دون إضافة وقائع:
                  </div>

                  <div
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: 22,
                      lineHeight: 1.6,
                      color: theme.colors.textPrimary,
                      marginBottom: 12,
                    }}
                  >
                    في شارع{" "}
                    <span
                      style={{
                        backgroundColor:
                          locationCorrectionProgress > 0.5
                            ? theme.colors.teal.background
                            : theme.colors.amber.background,
                        border: `1px solid ${
                          locationCorrectionProgress > 0.5
                            ? theme.colors.teal.border
                            : theme.colors.amber.border
                        }`,
                        color:
                          locationCorrectionProgress > 0.5
                            ? theme.colors.teal.light
                            : theme.colors.amber.light,
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontWeight: 700,
                      }}
                    >
                      {locationCorrectionProgress > 0.5 ? "مراد" : "اوراد"}
                    </span>{" "}
                    قدام{" "}
                    <span
                      style={{
                        backgroundColor:
                          locationCorrectionProgress > 0.5
                            ? theme.colors.teal.background
                            : theme.colors.amber.background,
                        border: `1px solid ${
                          locationCorrectionProgress > 0.5
                            ? theme.colors.teal.border
                            : theme.colors.amber.border
                        }`,
                        color:
                          locationCorrectionProgress > 0.5
                            ? theme.colors.teal.light
                            : theme.colors.amber.light,
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontWeight: 700,
                      }}
                    >
                      {locationCorrectionProgress > 0.5 ? "جنينة" : "كنينة"}
                    </span>{" "}
                    الحيوانات في الجيزة
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: theme.colors.teal.light,
                    }}
                  >
                    <span>✓ ضبط صوتي ذكي:</span>
                    <span>
                      تصحيح «اوراد» ➔ «مراد» و«كنينة» ➔ «جنينة» بالاعتماد على السياق الجغرافي
                      المعتمد.
                    </span>
                  </div>
                </div>
              )}

              {/* Beat 4: Incident Type & Semantic Matcher */}
              {currentBeatIndex === 3 && (
                <div
                  style={{
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.borderSubtle}`,
                    borderRadius: 12,
                    padding: "16px 20px",
                  }}
                >
                  <div style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 8 }}>
                    معالجة تشوه اللفظ الصوتي عبر المطابق الدلالي:
                  </div>

                  {/* 3-Step Demonstration Box */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    {/* Step A: Raw transcript */}
                    <div style={{ fontSize: 16, color: theme.colors.textSecondary }}>
                      <span style={{ color: theme.colors.textMuted, fontSize: 13 }}>
                        1. النص الخام الصوتي:{" "}
                      </span>
                      «الحقونا في{" "}
                      <span
                        style={{
                          color: theme.colors.amber.light,
                          fontWeight: 700,
                          backgroundColor: theme.colors.amber.background,
                          padding: "1px 6px",
                          borderRadius: 4,
                        }}
                      >
                        مشغرة
                      </span>{" "}
                      كبيرة وضرب بالأسلحة في الشارع!»
                    </div>

                    {/* Step B: Corrector behavior */}
                    <div
                      style={{
                        fontSize: 14,
                        color: theme.colors.textMuted,
                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                        padding: "8px 12px",
                        borderRadius: 6,
                        border: `1px solid ${theme.colors.borderSubtle}`,
                      }}
                    >
                      <span style={{ color: theme.colors.amber.primary, fontWeight: 700 }}>
                        2. سلوك المصحح اللغوي:{" "}
                      </span>
                      تم الإبقاء على «مشغرة» دون تخمين أعمى حفاظاً على سلامة البيانات.
                    </div>

                    {/* Step C: Semantic Matcher Result */}
                    <div
                      style={{
                        fontSize: 16,
                        color: theme.colors.textPrimary,
                        backgroundColor:
                          semanticResolveProgress > 0.5
                            ? theme.colors.teal.background
                            : "rgba(255, 255, 255, 0.04)",
                        border: `1px solid ${
                          semanticResolveProgress > 0.5
                            ? theme.colors.teal.border
                            : theme.colors.borderSubtle
                        }`,
                        padding: "10px 14px",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <span style={{ color: theme.colors.teal.primary, fontWeight: 700 }}>
                          3. المطابق الدلالي:{" "}
                        </span>
                        «مشغرة» ➔{" "}
                        <span style={{ fontWeight: 800, color: theme.colors.teal.light }}>
                          {semanticResolveProgress > 0.5
                            ? "مشاجرة واعتداء في الطريق العام"
                            : "جارٍ التحليل الدلالي..."}
                        </span>
                      </div>
                      <Badge variant="verified" size="sm" label="تطابق دلالي مؤكد" />
                    </div>
                  </div>

                  {/* Follow-up question trigger */}
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      backgroundColor: "rgba(20, 184, 166, 0.12)",
                      border: `1px solid ${theme.colors.teal.border}`,
                      fontSize: 14,
                      color: theme.colors.teal.light,
                      fontWeight: 600,
                    }}
                  >
                    ➔ انتقال فوري للسؤال التخصصي: «
                    {currentBeat.followUpPrompt}»
                  </div>
                </div>
              )}

              {/* Beat 5: Incomplete Number Safety Review Beat */}
              {currentBeatIndex === 4 && (
                <div
                  style={{
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.amber.border}`,
                    borderRadius: 12,
                    padding: "16px 20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ fontSize: 14, color: theme.colors.amber.primary, fontWeight: 700 }}>
                      ⚠️ منظومة الحماية والتحقق الآلي (Safety Validation Engine)
                    </div>
                    <Badge variant="review" size="sm" label="يحتاج مراجعة بشرية" />
                  </div>

                  <div
                    style={{
                      backgroundColor: theme.colors.amber.background,
                      border: `1px solid ${theme.colors.amber.border}`,
                      borderRadius: 8,
                      padding: "12px 16px",
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ fontSize: 13, color: theme.colors.amber.light, marginBottom: 4 }}>
                      سبب التنبيه العملياتي:
                    </div>
                    <div
                      style={{
                        fontFamily: theme.fonts.heading,
                        fontSize: 16,
                        fontWeight: 700,
                        color: theme.colors.textPrimary,
                        lineHeight: 1.4,
                      }}
                    >
                      رقم الهاتف المفرغ ناقص: «{currentBeat.suspiciousInput}» (9 أرقام فقط بدلاً من
                      11 رقماً).
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 14,
                      color: theme.colors.textSecondary,
                      lineHeight: 1.5,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <span style={{ color: theme.colors.amber.primary, fontWeight: 900 }}>🛡️</span>
                    <span>
                      <strong>قاعدة الأمان الصارمة:</strong> المنظومة ترفض تخمين الرقم الناقص أو
                      إسقاط المكالمة، وتطلب فوراً من المتصل الاستيضاح وإعادة الإملاء.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Footer Callout for Dispatch Command */}
            <div
              style={{
                marginTop: 16,
                paddingTop: 12,
                borderTop: `1px solid ${theme.colors.borderSubtle}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 13,
                color: theme.colors.textMuted,
              }}
            >
              <span>مأمور العمليات هو صاحب القرار دائماً</span>
              <span style={{ color: theme.colors.teal.primary, fontWeight: 600 }}>
                تكامل لحظي عبر بروتوكولات الأمان الحكومية
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Architecture Pipeline Assembly Highlighting Active Stage */}
        <div>
          <PipelineDiagram
            stages={content.pipelineStages}
            activeStageIndex={activePipelineIndex}
            style={{
              padding: "16px 20px",
            }}
          />
        </div>
      </SceneTransition>
    </AbsoluteFill>
  );
};
