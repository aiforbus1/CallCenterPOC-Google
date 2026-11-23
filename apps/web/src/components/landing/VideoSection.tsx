import React, { useState, useRef } from "react";
import { Play, Sparkles, Film, Clock, CheckCircle2 } from "lucide-react";
import { LandingContent } from "@/lib/landingContent";

interface VideoSectionProps {
  content: LandingContent;
  isArabic: boolean;
}

export default function VideoSection({ content, isArabic }: VideoSectionProps) {
  const [activeVideo, setActiveVideo] = useState<"full" | "teaser">("full");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleVideoSwitch = (mode: "full" | "teaser") => {
    if (activeVideo === mode) return;
    setActiveVideo(mode);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.load();
    }
  };

  return (
    <section id="video-section" className="py-16 md:py-24 bg-navy-950/80 border-t border-b border-slate-800/80 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-teal-300 text-xs font-semibold mb-4">
            <Film className="w-3.5 h-3.5 text-teal-400" />
            <span>{content.video.sectionTitle}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4 font-heading">
            {content.video.sectionTitle}
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {content.video.sectionSubtitle}
          </p>
        </div>

        {/* Video Mode Switcher (Full 1080p vs 30s Teaser) */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => handleVideoSwitch("full")}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-navy-950 ${
              activeVideo === "full"
                ? "bg-teal-600 text-white shadow-lg shadow-teal-900/40 border border-teal-500"
                : "bg-navy-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800"
            }`}
            aria-pressed={activeVideo === "full"}
          >
            <Film className="w-4 h-4 text-teal-300" />
            <span>{content.video.fullVideoTab}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-black/25 text-teal-100">
              {content.video.durationLabel}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleVideoSwitch("teaser")}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-navy-950 ${
              activeVideo === "teaser"
                ? "bg-amber-600 text-white shadow-lg shadow-amber-900/40 border border-amber-500"
                : "bg-navy-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800"
            }`}
            aria-pressed={activeVideo === "teaser"}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{content.video.teaserTab}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-black/25 text-amber-100">
              {content.video.teaserDurationLabel}
            </span>
          </button>
        </div>

        {/* HTML5 Video Player Frame */}
        <div className="relative mx-auto max-w-4xl rounded-2xl overflow-hidden bg-slate-950 shadow-2xl shadow-black/80 border border-slate-700/80 aspect-video group">
          <video
            ref={videoRef}
            key={activeVideo}
            controls
            playsInline
            preload="metadata"
            poster="/videos/poster.jpg"
            className="w-full h-full object-contain bg-black focus:outline-none focus:ring-2 focus:ring-teal-400"
            aria-label={activeVideo === "full" ? content.video.fullVideoTab : content.video.teaserTab}
          >
            {activeVideo === "full" ? (
              <>
                <source src="/videos/promo-1080p.mp4" type="video/mp4" media="(min-width: 768px)" />
                <source src="/videos/promo-720p.mp4" type="video/mp4" />
              </>
            ) : (
              <source src="/videos/teaser-30s.mp4" type="video/mp4" />
            )}
            <track
              src="/videos/subtitles-ar.vtt"
              kind="subtitles"
              srcLang="ar"
              label="العربية"
              default={isArabic}
            />
            <track
              src="/videos/subtitles-en.vtt"
              kind="subtitles"
              srcLang="en"
              label="English"
              default={!isArabic}
            />
            {isArabic ? "متصفحك لا يدعم تشغيل الفيديو المباشر." : "Your browser does not support the video tag."}
          </video>
        </div>

        {/* Captions & Subtitles Notice */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
            <span>{content.video.captionsAvailable}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {activeVideo === "full"
                ? isArabic ? "جودة تلقائية 1080p / 720p" : "Adaptive 1080p / 720p"
                : isArabic ? "موجز فائق السرعة" : "Ultra-fast digest"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
