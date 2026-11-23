import React from "react";
import { PhoneCall, Mic, CheckCircle, BrainCircuit, Radio } from "lucide-react";
import { LandingContent } from "@/lib/landingContent";

interface HowItWorksProps {
  content: LandingContent;
  isArabic: boolean;
}

const STEP_ICONS = [PhoneCall, Mic, CheckCircle, BrainCircuit, Radio];

export default function HowItWorksSection({ content, isArabic }: HowItWorksProps) {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-navy-900 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-teal-300 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>{isArabic ? "المسار الهندسي للمكالمة" : "Pipeline Flow"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4 font-heading">
            {content.howItWorks.sectionTitle}
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {content.howItWorks.sectionSubtitle}
          </p>
        </div>

        {/* 5-Step Pipeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {content.howItWorks.steps.map((step, idx) => {
            const Icon = STEP_ICONS[idx % STEP_ICONS.length];
            return (
              <div
                key={step.number}
                className="relative bg-slate-850/80 hover:bg-slate-800/90 rounded-2xl p-5 border border-slate-750/70 hover:border-teal-500/50 transition-all duration-300 flex flex-col justify-between group shadow-lg shadow-black/40"
              >
                {/* Step Header */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-teal-400 bg-teal-950/60 border border-teal-800/80 px-2.5 py-1 rounded-lg">
                      {step.number}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 group-hover:text-teal-300 group-hover:border-teal-500 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 font-heading group-hover:text-teal-200 transition-colors">
                    {step.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                    {step.description}
                  </p>
                </div>

                {/* Step Badge */}
                <div className="pt-3 border-t border-slate-800 text-[11px] font-medium text-teal-300/90 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  <span>{step.highlight}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
