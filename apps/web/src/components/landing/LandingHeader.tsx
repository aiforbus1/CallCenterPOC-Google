import React from "react";
import Link from "next/link";
import { Globe, LogIn, BookOpen } from "lucide-react";
import NeutralShield from "./NeutralShield";
import { LandingContent } from "@/lib/landingContent";

interface LandingHeaderProps {
  content: LandingContent;
  isArabic: boolean;
  onToggleLang: () => void;
}

export default function LandingHeader({ content, isArabic, onToggleLang }: LandingHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-navy-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & System Brand */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-teal-400 rounded-lg p-1"
            aria-label={content.header.systemTitle}
          >
            <NeutralShield size={38} className="w-9 h-9 sm:w-10 sm:h-10 text-teal-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm sm:text-base leading-tight font-heading group-hover:text-teal-200 transition-colors">
                {content.header.systemTitle}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400 leading-tight">
                {content.header.systemSubtitle}
              </span>
            </div>
          </Link>

          {/* Navigation & Actions */}
          <nav className="flex items-center gap-2 sm:gap-4" aria-label="Main Navigation">
            {/* Guide Link */}
            <Link
              href="/guide"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <BookOpen className="w-4 h-4 text-teal-400" />
              <span>{content.header.guide}</span>
            </Link>

            {/* Language Switcher */}
            <button
              type="button"
              onClick={onToggleLang}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-850 hover:bg-slate-800 border border-slate-750 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400"
              aria-label={isArabic ? "Switch to English" : "التبديل إلى العربية"}
            >
              <Globe className="w-4 h-4 text-sky-400" />
              <span>{content.header.switchLang}</span>
            </button>

            {/* Sign In CTA Button */}
            <Link
              href="/login"
              className="flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-md shadow-teal-950 transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-navy-950"
            >
              <LogIn className="w-4 h-4" />
              <span>{content.header.login}</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
