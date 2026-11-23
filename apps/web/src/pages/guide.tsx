import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Globe,
  LogIn,
  ArrowUp,
  Printer,
  Shield,
  Phone,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle2,
  List,
  Menu,
  X,
  FileText,
  HelpCircle,
  Headphones,
  Calendar,
} from "lucide-react";
import NeutralShield from "@/components/landing/NeutralShield";
import LandingFooter from "@/components/landing/LandingFooter";
import { guideDataAr, guideDataEn, GuideData, ScenarioCategory } from "@/lib/guideContentData";
import { landingContentAr, landingContentEn } from "@/lib/landingContent";
import { landingConfig } from "@/config/landingConfig";

export default function GuidePage() {
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    cat_traffic: true,
    cat_brawls: true,
    cat_fires: true,
    cat_missing: true,
    cat_public_service: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem("preferred_lang");
    if (saved === "en" || saved === "ar") {
      setLang(saved);
    }

    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === "ar" ? "en" : "ar";
    setLang(nextLang);
    localStorage.setItem("preferred_lang", nextLang);
  };

  const toggleCategory = (id: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrint = () => {
    // Open all categories before printing so nothing is truncated
    setOpenCategories({
      cat_traffic: true,
      cat_brawls: true,
      cat_fires: true,
      cat_missing: true,
      cat_public_service: true,
    });
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const isArabic = lang === "ar";
  const data: GuideData = isArabic ? guideDataAr : guideDataEn;
  const footerContent = isArabic ? landingContentAr : landingContentEn;

  const tocItems = [
    { id: "overview", label: isArabic ? "1. نظرة عامة" : "1. Overview" },
    { id: "sequence", label: isArabic ? "2. تسلسل المكالمة" : "2. Call Sequence" },
    { id: "scenarios", label: isArabic ? "3. السيناريوهات العشرون" : "3. The 20 Scenarios" },
    { id: "human-review", label: isArabic ? "4. يحتاج مراجعة بشرية" : "4. Needs Human Review" },
    { id: "special-cases", label: isArabic ? "5. الحالات الخاصة" : "5. Special Cases" },
    { id: "faq", label: isArabic ? "6. الأسئلة الشائعة" : "6. FAQ" },
    { id: "support", label: isArabic ? "7. الدعم الفني" : "7. Support Desk" },
  ];

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      lang={lang}
      className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-body selection:bg-teal-500 selection:text-white"
    >
      <Head>
        <title>{`${data.title} | 122`}</title>
        <meta name="description" content={data.subtitle} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta
          name="robots"
          content={landingConfig.isIndexable ? "index, follow" : "noindex, nofollow"}
        />

        {/* Open Graph Tags */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={data.title} />
        <meta property="og:description" content={data.subtitle} />
        <meta property="og:image" content="/videos/poster.jpg" />

        <meta name="theme-color" content="#070d1e" />

        {/* Print Stylesheet */}
        <style type="text/css">{`
          @media print {
            body {
              background: #ffffff !important;
              color: #000000 !important;
              font-size: 11pt;
            }
            header, footer, nav, .no-print, button, #back-to-top, .mobile-toc-toggle {
              display: none !important;
            }
            main {
              padding: 0 !important;
              max-width: 100% !important;
            }
            .print-full-width {
              width: 100% !important;
              margin: 0 !important;
            }
            section {
              page-break-inside: avoid;
              border: 1px solid #cccccc !important;
              background: #fafafa !important;
              color: #000000 !important;
              margin-bottom: 20px !important;
              padding: 15px !important;
              border-radius: 4px !important;
            }
            h1, h2, h3, h4 {
              color: #000000 !important;
            }
            p, span, li {
              color: #222222 !important;
            }
            .collapsible-content {
              display: block !important;
              max-height: none !important;
              opacity: 1 !important;
            }
          }
        `}</style>
      </Head>

      {/* Header (Hidden when printing) */}
      <header className="sticky top-0 z-50 bg-navy-950/95 backdrop-blur-md border-b border-slate-800/90 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo & Brand */}
            <Link
              href="/"
              className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-teal-400 rounded-lg p-1"
              aria-label={data.title}
            >
              <NeutralShield size={38} className="w-9 h-9 sm:w-10 sm:h-10 text-teal-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm sm:text-base leading-tight font-heading group-hover:text-teal-200 transition-colors">
                  {isArabic ? "دليل تشغيل منظومة الطوارئ" : "Emergency Operations Guide"}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-400 leading-tight">
                  {isArabic ? "خط 122 — للمأمورين والمشرفين" : "Hotline 122 — For Dispatchers"}
                </span>
              </div>
            </Link>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-850 hover:bg-slate-800 border border-slate-750 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400"
                title={isArabic ? "طباعة الدليل أو حفظه كـ PDF" : "Print Guide / Save as PDF"}
              >
                <Printer className="w-3.5 h-3.5 text-teal-400" />
                <span>{isArabic ? "طباعة / PDF" : "Print PDF"}</span>
              </button>

              {/* Language Switcher */}
              <button
                type="button"
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-850 hover:bg-slate-800 border border-slate-750 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400"
                aria-label={isArabic ? "Switch to English" : "التبديل إلى العربية"}
              >
                <Globe className="w-4 h-4 text-sky-400" />
                <span>{isArabic ? "English" : "العربية"}</span>
              </button>

              {/* Home Link */}
              <Link
                href="/"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                <span>{isArabic ? "الرئيسية" : "Home"}</span>
              </Link>

              {/* Sign In CTA */}
              <Link
                href="/login"
                className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-md shadow-teal-950 transition-all focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                <LogIn className="w-4 h-4" />
                <span>{isArabic ? "تسجيل الدخول" : "Sign In"}</span>
              </Link>

              {/* Mobile TOC Button */}
              <button
                type="button"
                onClick={() => setMobileTocOpen(!mobileTocOpen)}
                className="md:hidden p-2 rounded-xl bg-slate-850 border border-slate-750 text-slate-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-teal-400 mobile-toc-toggle"
                aria-label="Toggle Table of Contents"
              >
                {mobileTocOpen ? <X className="w-5 h-5" /> : <List className="w-5 h-5 text-teal-400" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container with Sticky TOC Sidebar Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ========================================================= */}
          {/* SIDEBAR: Sticky Table of Contents (Desktop) */}
          {/* ========================================================= */}
          <aside className="hidden lg:block w-72 shrink-0 sticky top-28 bg-navy-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl shadow-black/30 no-print">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
              <List className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white font-heading">{data.tocTitle}</h3>
            </div>
            <nav className="space-y-1.5" aria-label="Table of Contents">
              {tocItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-teal-300 hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-1 focus:ring-teal-400"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-400" />
                <span>{isArabic ? "آخر تحديث:" : "Updated:"} {data.lastUpdated}</span>
              </span>
              <button
                type="button"
                onClick={handlePrint}
                className="text-teal-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <Printer className="w-3 h-3" />
                <span>PDF</span>
              </button>
            </div>
          </aside>

          {/* ========================================================= */}
          {/* MOBILE COLLAPSIBLE TOC ACCORDION */}
          {/* ========================================================= */}
          {mobileTocOpen && (
            <div className="lg:hidden w-full bg-navy-900 border border-teal-500/40 rounded-2xl p-5 mb-6 shadow-xl no-print">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4 text-teal-400" />
                  <span className="text-sm font-bold text-white">{data.tocTitle}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileTocOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tocItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={() => setMobileTocOpen(false)}
                    className="p-2.5 rounded-lg text-xs font-semibold bg-slate-800/80 text-slate-200 hover:text-teal-300"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          )}

          {/* ========================================================= */}
          {/* MAIN ARTICLE / GUIDE CONTENT */}
          {/* ========================================================= */}
          <main className="flex-1 w-full max-w-4xl space-y-12 print-full-width">
            {/* Guide Title Banner */}
            <div className="bg-navy-900/80 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-teal-300 text-xs font-semibold mb-4">
                <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                <span>{isArabic ? "الدليل الإجرائي الميداني — خط 122" : "Operational Standard Guide — Hotline 122"}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-3 font-heading leading-tight">
                {data.title}
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                {data.subtitle}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-4 border-t border-slate-800">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-400" />
                  <span>{isArabic ? "تاريخ الإصدار الأخير:" : "Last Updated:"} <strong className="text-slate-200 font-mono">{data.lastUpdated}</strong></span>
                </span>
                <span>•</span>
                <span className="text-slate-400">{data.systemNotice}</span>
              </div>
            </div>

            {/* ===================================================== */}
            {/* 1. SECTION: نظرة عامة */}
            {/* ===================================================== */}
            <section
              id={data.sections.overview.id}
              className="bg-navy-900 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl scroll-mt-28"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-teal-950/80 border border-teal-800 text-teal-400 flex items-center justify-center text-sm font-mono font-bold">
                  01
                </span>
                <span>{data.sections.overview.title}</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* What it DOES */}
                <div className="bg-slate-900/90 rounded-xl p-5 border border-teal-800/40">
                  <h3 className="text-sm sm:text-base font-bold text-teal-300 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>{data.sections.overview.whatItDoes.title}</span>
                  </h3>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {data.sections.overview.whatItDoes.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-teal-400 font-bold mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* What it DOES NOT */}
                <div className="bg-slate-900/90 rounded-xl p-5 border border-amber-800/40">
                  <h3 className="text-sm sm:text-base font-bold text-amber-300 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{data.sections.overview.whatItDoesNot.title}</span>
                  </h3>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {data.sections.overview.whatItDoesNot.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* ===================================================== */}
            {/* 2. SECTION: تسلسل المكالمة */}
            {/* ===================================================== */}
            <section
              id={data.sections.sequence.id}
              className="bg-navy-900 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl scroll-mt-28"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-teal-950/80 border border-teal-800 text-teal-400 flex items-center justify-center text-sm font-mono font-bold">
                  02
                </span>
                <span>{data.sections.sequence.title}</span>
              </h2>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                {data.sections.sequence.intro}
              </p>

              <div className="space-y-4">
                {data.sections.sequence.coreQuestions.map((q) => (
                  <div
                    key={q.order}
                    className="bg-slate-850 rounded-xl p-5 border border-slate-750 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <span className="w-7 h-7 rounded-lg bg-teal-900/60 border border-teal-700 text-teal-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                        Q{q.order}
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-teal-400 mb-1">
                          {q.field}
                        </div>
                        <div className="text-sm sm:text-base font-bold text-white mb-1.5 font-heading">
                          «{q.text}»
                        </div>
                        <div className="text-xs text-slate-400">
                          {q.note}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-teal-300 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>{data.sections.sequence.flowNote}</span>
              </div>
            </section>

            {/* ===================================================== */}
            {/* 3. SECTION: السيناريوهات العشرون */}
            {/* ===================================================== */}
            <section
              id={data.sections.scenarios.id}
              className="bg-navy-900 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl scroll-mt-28"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white font-heading flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-teal-950/80 border border-teal-800 text-teal-400 flex items-center justify-center text-sm font-mono font-bold">
                    03
                  </span>
                  <span>{data.sections.scenarios.title}</span>
                </h2>

                {/* Expand / Collapse All */}
                <button
                  type="button"
                  onClick={() => {
                    const allOpen = Object.values(openCategories).every(Boolean);
                    const updated: Record<string, boolean> = {};
                    data.sections.scenarios.categories.forEach((c) => {
                      updated[c.id] = !allOpen;
                    });
                    setOpenCategories(updated);
                  }}
                  className="text-xs font-semibold text-teal-400 hover:text-teal-300 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700 no-print"
                >
                  {Object.values(openCategories).every(Boolean)
                    ? isArabic ? "طي كل الفئات" : "Collapse All"
                    : isArabic ? "فتح كل الفئات" : "Expand All"}
                </button>
              </div>

              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                {data.sections.scenarios.intro}
              </p>

              {/* 5 Collapsible Category Cards */}
              <div className="space-y-4">
                {data.sections.scenarios.categories.map((cat: ScenarioCategory) => {
                  const isOpen = !!openCategories[cat.id];
                  return (
                    <div
                      key={cat.id}
                      className="bg-slate-850 rounded-xl border border-slate-750 overflow-hidden shadow-lg transition-all"
                    >
                      {/* Category Header Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className="w-full px-5 py-4 flex items-center justify-between text-start bg-slate-800/90 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-1 focus:ring-teal-400"
                        aria-expanded={isOpen}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                          <span className="font-bold text-sm sm:text-base text-white font-heading">
                            {cat.name}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-mono">
                            {cat.scenarios.length} {isArabic ? "سيناريوهات" : "scenarios"}
                          </span>
                        </div>
                        <div className="no-print">
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Scenario Items inside Category */}
                      {isOpen && (
                        <div className="p-5 space-y-4 bg-slate-900/60 collapsible-content">
                          {cat.scenarios.map((sc) => (
                            <div
                              key={sc.id}
                              className="bg-slate-850/80 rounded-lg p-4 border border-slate-750/80"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-bold text-teal-200 font-heading">
                                  {sc.name}
                                </h4>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {sc.id}
                                </span>
                              </div>

                              <div className="space-y-2 mt-2">
                                {sc.subQuestions.map((sq) => (
                                  <div
                                    key={sq.order}
                                    className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-md border border-slate-800"
                                  >
                                    <span className="text-teal-400 font-mono font-bold shrink-0">
                                      س{sq.order}:
                                    </span>
                                    <span className="leading-relaxed font-medium">
                                      «{sq.question}»
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ===================================================== */}
            {/* 4. SECTION: ماذا يعني "يحتاج مراجعة بشرية" */}
            {/* ===================================================== */}
            <section
              id={data.sections.humanReview.id}
              className="bg-navy-900 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl scroll-mt-28"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-teal-950/80 border border-teal-800 text-teal-400 flex items-center justify-center text-sm font-mono font-bold">
                  04
                </span>
                <span>{data.sections.humanReview.title}</span>
              </h2>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                {data.sections.humanReview.intro}
              </p>

              <div className="space-y-5">
                {data.sections.humanReview.reasons.map((r) => (
                  <div
                    key={r.key}
                    className="bg-slate-850 rounded-xl p-5 border border-amber-500/30 hover:border-amber-500/60 transition-colors shadow-lg"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-bold text-amber-300 bg-amber-950/70 border border-amber-800/80 px-3 py-1 rounded-full">
                        {r.badge}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        flag: {r.key}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-2 font-heading">
                      {r.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3">
                      <strong>{isArabic ? "دلالة الحالة:" : "Meaning:"}</strong> {r.meaning}
                    </p>

                    {/* Fictional Example */}
                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-750 text-xs text-slate-300 mb-3">
                      <span className="text-amber-400 font-bold block mb-1">
                        {isArabic ? "مثال افتراضي توضيحي:" : "Fictional Demonstration Example:"}
                      </span>
                      <span className="font-mono text-slate-200">{r.example}</span>
                    </div>

                    {/* Operator Action */}
                    <div className="pt-2.5 border-t border-slate-750 flex items-start gap-2 text-xs sm:text-sm text-teal-300">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>{isArabic ? "الإجراء المطلوب من المأمور:" : "Required Action:"}</strong>{" "}
                        {r.operatorAction}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ===================================================== */}
            {/* 5. SECTION: التعامل مع الحالات الخاصة */}
            {/* ===================================================== */}
            <section
              id={data.sections.specialCases.id}
              className="bg-navy-900 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl scroll-mt-28"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-teal-950/80 border border-teal-800 text-teal-400 flex items-center justify-center text-sm font-mono font-bold">
                  05
                </span>
                <span>{data.sections.specialCases.title}</span>
              </h2>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                {data.sections.specialCases.intro}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {data.sections.specialCases.cases.map((c, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-850 rounded-xl p-5 border border-slate-750 flex flex-col justify-between"
                  >
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-teal-200 mb-2 font-heading">
                        {c.title}
                      </h3>
                      <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                        <strong>{isArabic ? "الموقف:" : "Scenario:"}</strong> {c.description}
                      </p>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 mb-3">
                        <strong className="text-teal-400 block mb-1">
                          {isArabic ? "سلوك المنظومة الآلي:" : "Automated System Behavior:"}
                        </strong>
                        {c.systemBehavior}
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-750 text-xs text-slate-300 flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold shrink-0">•</span>
                      <span>
                        <strong>{isArabic ? "تدخل المأمور:" : "Operator Role:"}</strong>{" "}
                        {c.operatorRole}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ===================================================== */}
            {/* 6. SECTION: الأسئلة الشائعة */}
            {/* ===================================================== */}
            <section
              id={data.sections.faq.id}
              className="bg-navy-900 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl scroll-mt-28"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-teal-950/80 border border-teal-800 text-teal-400 flex items-center justify-center text-sm font-mono font-bold">
                  06
                </span>
                <span>{data.sections.faq.title}</span>
              </h2>

              <div className="space-y-4">
                {data.sections.faq.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-850/80 rounded-xl p-5 border border-slate-750"
                  >
                    <h3 className="text-sm sm:text-base font-bold text-teal-200 mb-2 font-heading">
                      {item.q}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* ===================================================== */}
            {/* 7. SECTION: الدعم الفني وغرفة العمليات */}
            {/* ===================================================== */}
            <section
              id={data.sections.support.id}
              className="bg-navy-900 rounded-2xl p-6 sm:p-8 border border-teal-800/60 shadow-xl scroll-mt-28"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-teal-950/80 border border-teal-800 text-teal-400 flex items-center justify-center text-sm font-mono font-bold">
                  07
                </span>
                <span>{data.sections.support.title}</span>
              </h2>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                {data.sections.support.intro}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-teal-400 shrink-0" />
                  <div>
                    <span className="text-xs text-slate-400 block">{data.sections.support.responsibleLabel}</span>
                    <span className="text-sm font-bold text-white">{landingConfig.contactName}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 flex items-center gap-3">
                  <Mail className="w-5 h-5 text-teal-400 shrink-0" />
                  <div>
                    <span className="text-xs text-slate-400 block">{data.sections.support.emailLabel}</span>
                    <a href={`mailto:${landingConfig.contactEmail}`} className="text-sm font-bold text-teal-300 hover:underline">
                      {landingConfig.contactEmail}
                    </a>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 flex items-center gap-3">
                  <Phone className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-xs text-slate-400 block">{data.sections.support.phoneLabel}</span>
                    <span className="text-sm font-bold text-amber-300 font-mono tracking-wider">{landingConfig.contactPhone}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-teal-400 shrink-0" />
                  <div>
                    <span className="text-xs text-slate-400 block">{data.sections.support.hoursLabel}</span>
                    <span className="text-sm font-bold text-white">{data.sections.support.hoursValue}</span>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          id="back-to-top"
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 end-6 z-40 p-3 rounded-full bg-teal-600 text-white shadow-xl shadow-black/60 hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all no-print"
          aria-label={data.backToTop}
          title={data.backToTop}
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Footer */}
      <LandingFooter
        content={footerContent}
        isArabic={isArabic}
      />
    </div>
  );
}
