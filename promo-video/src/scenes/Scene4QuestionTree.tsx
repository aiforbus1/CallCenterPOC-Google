import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { theme } from "../theme/theme";
import { getOfflineFontFaceStyles } from "../theme/fonts";
import { content } from "../data/content";
import { Badge, LowerThird, SceneTransition } from "../components";

/**
 * Scene 4: Structured Question Tree (55 - 72s | 17 seconds = 510 frames)
 *
 * Visuals:
 * - Top Core 4 Fixed Anchors (Name, Phone, Detailed Location, Incident Type).
 * - Animated branching tree from root "نوع البلاغ" into 5 operational categories.
 * - Expanding into all 20 scenario nodes clearly labeled for 1080p & 720p legibility.
 * - Zoom spotlight 1: "انقلاب سيارة" with 2 tactical follow-up questions.
 * - Zoom spotlight 2: "تسرب غاز" with 2 tactical follow-up questions.
 * - Caption: "أسئلة محددة لكل حالة، لا ارتجال".
 */
export const Scene4QuestionTree: React.FC = () => {
  const frame = useCurrentFrame();

  // Entrance animations
  const headerEntrance = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const coreQuestionsEntrance = interpolate(frame, [10, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const treeEntrance = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Zoom 1: "انقلاب سيارة" (Active frames 170 to 325 => 60.6s to 65.8s in MainPromo)
  const zoom1Progress = interpolate(frame, [170, 188], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const zoom1Exit = interpolate(frame, [310, 325], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const isZoom1Active = frame >= 170 && frame < 325;

  // Zoom 2: "تسرب غاز" (Active frames 335 to 505 => 66.1s to 71.8s in MainPromo)
  const zoom2Progress = interpolate(frame, [335, 352], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const isZoom2Active = frame >= 335;

  const rolloverZoom = content.questionTree.zoomScenarios[0];
  const gasZoom = content.questionTree.zoomScenarios[1];

  return (
    <AbsoluteFill
      style={{
        direction: theme.direction,
        backgroundColor: theme.colors.background,
        color: theme.colors.textPrimary,
        fontFamily: theme.fonts.body,
        overflow: "hidden",
        padding: "36px 70px 24px 70px",
      }}
    >
      <style>{getOfflineFontFaceStyles()}</style>

      <SceneTransition durationFrames={16} type="fade">
        {/* LowerThird Scene Header */}
        <LowerThird
          tag={content.lowerThirds.questionTree.tag}
          title={content.lowerThirds.questionTree.title}
          subtitle={content.lowerThirds.questionTree.subtitle}
          startFrame={0}
          durationFrames={510}
        />

        {/* Top Control Bar: Motto Caption & Core 4 Anchors */}
        <div
          style={{
            marginTop: 90,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            opacity: headerEntrance,
          }}
        >
          {/* Executive Caption */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              backgroundColor: theme.colors.surfaceCard,
              border: `1.5px solid ${theme.colors.teal.border}`,
              padding: "10px 24px",
              borderRadius: 12,
              boxShadow: theme.shadows.tealGlow,
            }}
          >
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
                fontSize: 22,
                fontWeight: 800,
                color: theme.colors.textPrimary,
              }}
            >
              أسئلة محددة لكل حالة.. لا ارتجال
            </span>
          </div>

          {/* Core 4 Questions Pills */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              opacity: coreQuestionsEntrance,
            }}
          >
            <span style={{ fontSize: 14, color: theme.colors.textMuted, fontWeight: 600 }}>
              الأركان الأربعة الثابتة:
            </span>
            {content.questionTree.coreQuestions.map((q) => {
              const isRoot = q.id === "q4";
              return (
                <div
                  key={q.id}
                  style={{
                    backgroundColor: isRoot
                      ? theme.colors.teal.background
                      : "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${
                      isRoot ? theme.colors.teal.border : theme.colors.borderSubtle
                    }`,
                    borderRadius: 8,
                    padding: "6px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontFamily: theme.typography.code.fontFamily,
                      fontSize: 12,
                      color: isRoot ? theme.colors.teal.light : theme.colors.textMuted,
                      fontWeight: 800,
                    }}
                  >
                    {q.order}
                  </span>
                  <span
                    style={{
                      fontFamily: theme.fonts.heading,
                      fontSize: 15,
                      fontWeight: 700,
                      color: isRoot ? theme.colors.teal.light : theme.colors.textSecondary,
                    }}
                  >
                    {q.labelArabic}
                  </span>
                  {isRoot && (
                    <span style={{ fontSize: 13, color: theme.colors.teal.primary }}>↓</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tree Architecture Main Layout: 5 Categories & 20 Scenarios */}
        <div
          style={{
            opacity: treeEntrance,
            transform: `translateY(${interpolate(treeEntrance, [0, 1], [16, 0])}px)`,
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 16,
            marginBottom: 20,
          }}
        >
          {content.questionTree.categories.map((cat, catIdx) => {
            // Sequential node expansion (starts earlier so visible by frame 25-30)
            const catProgress = interpolate(
              frame,
              [14 + catIdx * 6, 26 + catIdx * 6],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.cubic),
              }
            );

            return (
              <div
                key={cat.id}
                style={{
                  backgroundColor: theme.colors.surfaceCard,
                  border: `1px solid ${theme.colors.borderMedium}`,
                  borderRadius: 16,
                  padding: "16px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  boxShadow: theme.shadows.subtle,
                  opacity: catProgress,
                  transform: `translateY(${interpolate(catProgress, [0, 1], [14, 0])}px)`,
                }}
              >
                {/* Category Header */}
                <div
                  style={{
                    borderBottom: `1px solid ${theme.colors.borderSubtle}`,
                    paddingBottom: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: theme.fonts.heading,
                      fontSize: 17,
                      fontWeight: 800,
                      color: theme.colors.textPrimary,
                      lineHeight: 1.3,
                    }}
                  >
                    {cat.titleArabic}
                  </div>
                  <span
                    style={{
                      fontFamily: theme.typography.code.fontFamily,
                      fontSize: 12,
                      fontWeight: 800,
                      color: theme.colors.teal.primary,
                      backgroundColor: "rgba(20, 184, 166, 0.12)",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    {cat.scenarioCount}
                  </span>
                </div>

                {/* Scenario Item Nodes */}
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {cat.scenarios.map((scen, scenIdx) => {
                    const isRolloverHighlight =
                      cat.id === "cat_roads" && scen === "انقلاب سيارة";
                    const isGasHighlight =
                      cat.id === "cat_fires" && scen === "تسرب غاز";

                    const isHighlight =
                      (isRolloverHighlight && isZoom1Active) ||
                      (isGasHighlight && isZoom2Active);

                    return (
                      <div
                        key={scenIdx}
                        style={{
                          backgroundColor: isHighlight
                            ? theme.colors.teal.background
                            : "rgba(255, 255, 255, 0.03)",
                          border: `1px solid ${
                            isHighlight
                              ? theme.colors.teal.border
                              : theme.colors.borderSubtle
                          }`,
                          borderRadius: 8,
                          padding: "7px 10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: 15,
                          fontFamily: theme.fonts.body,
                          fontWeight: isHighlight ? 700 : 500,
                          color: isHighlight
                            ? theme.colors.teal.light
                            : theme.colors.textSecondary,
                          boxShadow: isHighlight ? theme.shadows.tealGlow : "none",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              backgroundColor: isHighlight
                                ? theme.colors.teal.primary
                                : theme.colors.textMuted,
                            }}
                          />
                          <span>{scen}</span>
                        </span>
                        {isHighlight && (
                          <span
                            style={{
                              fontSize: 11,
                              color: theme.colors.teal.primary,
                              fontWeight: 800,
                            }}
                          >
                            تحديد
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Zoom Spotlight Area: Follow-up Questions Showcase */}
        <div style={{ position: "relative", height: 180 }}>
          {/* Zoom 1: "انقلاب سيارة" Follow-Up Questions */}
          {isZoom1Active && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                backgroundColor: theme.colors.surfaceElevated,
                border: `2px solid ${theme.colors.teal.primary}`,
                borderRadius: 16,
                padding: "20px 28px",
                boxShadow: theme.shadows.tealGlow,
                opacity: (1 - zoom1Exit) * zoom1Progress,
                transform: `scale(${interpolate(zoom1Progress, [0, 1], [0.97, 1])})`,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {/* Card Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: `1px solid ${theme.colors.borderSubtle}`,
                  paddingBottom: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      fontFamily: theme.fonts.heading,
                      fontSize: 20,
                      fontWeight: 800,
                      color: theme.colors.textPrimary,
                    }}
                  >
                    نموذج الأسئلة التخصصية: «{rolloverZoom.title}»
                  </span>
                  <Badge variant="verified" size="sm" label={rolloverZoom.badge} />
                </div>
                <span style={{ fontSize: 13, color: theme.colors.textMuted }}>
                  التصنيف: {rolloverZoom.category}
                </span>
              </div>

              {/* Questions List */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                {rolloverZoom.followUps.map((q) => (
                  <div
                    key={q.order}
                    style={{
                      backgroundColor: theme.colors.background,
                      border: `1px solid ${theme.colors.borderSubtle}`,
                      borderRadius: 10,
                      padding: "12px 18px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: theme.typography.code.fontFamily,
                        fontSize: 14,
                        fontWeight: 800,
                        color: theme.colors.teal.primary,
                        backgroundColor: "rgba(20, 184, 166, 0.15)",
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {q.order}
                    </span>
                    <span
                      style={{
                        fontFamily: theme.fonts.body,
                        fontSize: 17,
                        fontWeight: 600,
                        color: theme.colors.textPrimary,
                        lineHeight: 1.4,
                      }}
                    >
                      {q.question}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Zoom 2: "تسرب غاز" Follow-Up Questions */}
          {isZoom2Active && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                backgroundColor: theme.colors.surfaceElevated,
                border: `2px solid ${theme.colors.amber.primary}`,
                borderRadius: 16,
                padding: "20px 28px",
                boxShadow: theme.shadows.amberGlow,
                opacity: zoom2Progress,
                transform: `scale(${interpolate(zoom2Progress, [0, 1], [0.97, 1])})`,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {/* Card Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: `1px solid ${theme.colors.borderSubtle}`,
                  paddingBottom: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      fontFamily: theme.fonts.heading,
                      fontSize: 20,
                      fontWeight: 800,
                      color: theme.colors.textPrimary,
                    }}
                  >
                    نموذج الأسئلة التخصصية: «{gasZoom.title}»
                  </span>
                  <Badge variant="review" size="sm" label={gasZoom.badge} />
                </div>
                <span style={{ fontSize: 13, color: theme.colors.textMuted }}>
                  التصنيف: {gasZoom.category}
                </span>
              </div>

              {/* Questions List */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                {gasZoom.followUps.map((q) => (
                  <div
                    key={q.order}
                    style={{
                      backgroundColor: theme.colors.background,
                      border: `1px solid ${theme.colors.borderSubtle}`,
                      borderRadius: 10,
                      padding: "12px 18px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: theme.typography.code.fontFamily,
                        fontSize: 14,
                        fontWeight: 800,
                        color: theme.colors.amber.primary,
                        backgroundColor: "rgba(245, 158, 11, 0.15)",
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {q.order}
                    </span>
                    <span
                      style={{
                        fontFamily: theme.fonts.body,
                        fontSize: 17,
                        fontWeight: 600,
                        color: theme.colors.textPrimary,
                        lineHeight: 1.4,
                      }}
                    >
                      {q.question}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Baseline State before zooms */}
          {!isZoom1Active && !isZoom2Active && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                backgroundColor: theme.colors.surfaceCard,
                border: `1px solid ${theme.colors.borderMedium}`,
                borderRadius: 14,
                padding: "18px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ color: theme.colors.teal.primary, fontSize: 20 }}>🛡️</span>
                <span
                  style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: 18,
                    fontWeight: 700,
                    color: theme.colors.textSecondary,
                  }}
                >
                  توجيه تكتيكي فوري: بمجرد تحديد نوع الحادث، ينتقل النظام تلقائياً إلى أسئلة
                  السيناريو الخاصة به
                </span>
              </div>
              <Badge variant="verified" size="sm" label="20 سيناريو قياسي معتمد" />
            </div>
          )}
        </div>
      </SceneTransition>
    </AbsoluteFill>
  );
};
