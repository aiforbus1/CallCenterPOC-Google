import React from "react";
import Link from "next/link";
import { Mail, Phone, Shield, ExternalLink } from "lucide-react";
import NeutralShield from "./NeutralShield";
import { LandingContent } from "@/lib/landingContent";
import { landingConfig } from "@/config/landingConfig";

interface LandingFooterProps {
  content: LandingContent;
  isArabic: boolean;
}

export default function LandingFooter({ content, isArabic }: LandingFooterProps) {
  return (
    <footer className="bg-navy-950 border-t border-slate-800 text-slate-400 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Brand & System Overview */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/logo.png"
                alt="Nagda 122 Logo"
                className="w-8 h-8 rounded-lg object-contain shadow-sm ring-1 ring-slate-700/50"
              />
              <span className="text-white font-bold text-base font-heading">
                {content.header.systemTitle}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
              {content.footer.systemNotice}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm font-heading mb-4">
              {isArabic ? "روابط سريعة" : "Quick Links"}
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/" className="hover:text-teal-300 transition-colors">
                  {content.header.home}
                </Link>
              </li>
              <li>
                <Link href="/guide" className="hover:text-teal-300 transition-colors">
                  {content.header.guide}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-teal-300 transition-colors">
                  {content.header.login}
                </Link>
              </li>
            </ul>
          </div>

          {/* Configurable Contact Section (Read strictly from landingConfig) */}
          <div>
            <h4 className="text-white font-bold text-sm font-heading mb-4">
              {content.footer.contactTitle}
            </h4>
            <div className="space-y-2.5 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="text-slate-400">{content.footer.contactNameLabel}:</span>
                <span className="font-medium text-white">{landingConfig.contactName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="text-slate-400">{content.footer.contactEmailLabel}:</span>
                <a
                  href={`mailto:${landingConfig.contactEmail}`}
                  className="font-medium text-teal-300 hover:underline"
                >
                  {landingConfig.contactEmail}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-400">{content.footer.contactPhoneLabel}:</span>
                <span className="font-bold text-amber-300 tracking-wider">
                  {landingConfig.contactPhone}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Optional Metrics Banner: Only displayed if landingConfig.metrics is strictly non-null */}
        {landingConfig.metrics && (
          <div className="mb-8 p-4 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-300">
            {isArabic ? "مؤشرات التشغيل المعتمدة:" : "Verified System Metrics:"}{" "}
            {landingConfig.metrics.latencyMs && (
              <span className="mx-2 font-mono text-teal-400">{landingConfig.metrics.latencyMs} ms</span>
            )}
            {landingConfig.metrics.uptimePercent && (
              <span className="mx-2 font-mono text-teal-400">{landingConfig.metrics.uptimePercent}%</span>
            )}
          </div>
        )}

        {/* Bottom Bar: Copyright & Compliance */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>© {new Date().getFullYear()} {content.footer.rightsReserved}.</div>
          <div className="text-[11px] text-slate-400">
            {isArabic
              ? "نظام تقني مستقل لمساندة فرق الطوارئ وغرف العمليات"
              : "Autonomous technological platform for emergency operations"}
          </div>
        </div>
      </div>
    </footer>
  );
}
