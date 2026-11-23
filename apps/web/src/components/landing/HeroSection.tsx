import React from "react";
import Link from "next/link";
import { Play, BookOpen, ShieldCheck } from "lucide-react";
import { LandingContent } from "@/lib/landingContent";

interface HeroSectionProps {
  content: LandingContent;
  isArabic: boolean;
}

export default function HeroSection({ content, isArabic }: HeroSectionProps) {
  const scrollToVideo = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("video-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden py-16 sm:py-24 lg:py-28 bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950">
      {/* Background radial gradient accent */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Sovereign Technology Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 text-teal-300 text-xs sm:text-sm font-semibold mb-6 shadow-md shadow-black/30">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>{content.hero.badge}</span>
        </div>

        {/* Value Proposition Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.25] font-heading mb-6 max-w-4xl mx-auto">
          {content.hero.headline}
        </h1>

        {/* Clear Sub-Description */}
        <p className="text-slate-300 text-base sm:text-lg md:text-xl leading-relaxed max-w-3xl mx-auto mb-10 font-normal">
          {content.hero.description}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#video-section"
            onClick={scrollToVideo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-base text-white bg-teal-600 hover:bg-teal-500 shadow-xl shadow-teal-950/60 transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-navy-950 active:scale-[0.98]"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{content.hero.watchVideo}</span>
          </a>

          <Link
            href="/guide"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-base text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-800 border border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 active:scale-[0.98]"
          >
            <BookOpen className="w-5 h-5 text-teal-400" />
            <span>{content.hero.viewGuide}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
