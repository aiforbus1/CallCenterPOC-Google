import React from "react";
import { FileCode, UserCheck, ShieldAlert, Cpu } from "lucide-react";
import { LandingContent } from "@/lib/landingContent";

interface TrustSafetyProps {
  content: LandingContent;
  isArabic: boolean;
}

const CARD_ICONS = [
  { icon: FileCode, border: "border-teal-500/40", badgeColor: "text-teal-300 bg-teal-950/60 border-teal-800" },
  { icon: UserCheck, border: "border-sky-500/40", badgeColor: "text-sky-300 bg-sky-950/60 border-sky-800" },
  { icon: ShieldAlert, border: "border-amber-500/40", badgeColor: "text-amber-300 bg-amber-950/60 border-amber-800" },
  { icon: Cpu, border: "border-emerald-500/40", badgeColor: "text-emerald-300 bg-emerald-950/60 border-emerald-800" },
];

export default function TrustSafetySection({ content, isArabic }: TrustSafetyProps) {
  return (
    <section id="trust-safety" className="py-16 md:py-24 bg-navy-950 border-t border-slate-800 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-teal-300 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span>{isArabic ? "المعايير والضوابط الصارمة" : "Security & Governance"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4 font-heading">
            {content.trustSafety.sectionTitle}
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {content.trustSafety.sectionSubtitle}
          </p>
        </div>

        {/* 4 Trust Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {content.trustSafety.cards.map((card, idx) => {
            const style = CARD_ICONS[idx % CARD_ICONS.length];
            const Icon = style.icon;

            return (
              <div
                key={card.title}
                className={`bg-slate-900/90 rounded-2xl p-6 sm:p-7 border ${style.border} hover:border-slate-500 transition-all duration-300 shadow-xl shadow-black/50 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-teal-400">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${style.badgeColor}`}>
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2.5 font-heading">
                    {card.title}
                  </h3>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
