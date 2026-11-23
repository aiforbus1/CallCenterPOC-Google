import React, { useState, useEffect } from "react";
import Head from "next/head";
import LandingHeader from "@/components/landing/LandingHeader";
import HeroSection from "@/components/landing/HeroSection";
import VideoSection from "@/components/landing/VideoSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import TrustSafetySection from "@/components/landing/TrustSafetySection";
import LandingFooter from "@/components/landing/LandingFooter";
import { landingContentAr, landingContentEn, LandingContent } from "@/lib/landingContent";
import { landingConfig } from "@/config/landingConfig";

export default function PublicLandingPage() {
  const [lang, setLang] = useState<"ar" | "en">("ar");

  useEffect(() => {
    // Check if user has preferred language saved
    const saved = localStorage.getItem("preferred_lang");
    if (saved === "en" || saved === "ar") {
      setLang(saved);
    }
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === "ar" ? "en" : "ar";
    setLang(nextLang);
    localStorage.setItem("preferred_lang", nextLang);
  };

  const isArabic = lang === "ar";
  const content: LandingContent = isArabic ? landingContentAr : landingContentEn;

  const pageTitle = isArabic
    ? "منظومة الاستجابة الذكية لبلاغات الطوارئ | 122 Smart Emergency Response"
    : "Smart Emergency Call Response AI System | 122 Operations";

  const metaDescription = isArabic
    ? "منظومة ذكاء اصطناعي سيادية مصممة لدعم مأموري غرف العمليات في فهم اللهجة الدارجة وتوثيق بلاغات الطوارئ بدقة فورية."
    : "A sovereign emergency response AI system assisting dispatchers in understanding spoken dialects and accurately documenting emergency calls in real time.";

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      lang={lang}
      className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-body selection:bg-teal-500 selection:text-white"
    >
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        
        {/* Robots control via config flag */}
        <meta
          name="robots"
          content={landingConfig.isIndexable ? "index, follow" : "noindex, nofollow"}
        />

        {/* Open Graph Tags for WhatsApp & Social Previews */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content="/videos/poster.jpg" />
        <meta property="og:image:width" content="1920" />
        <meta property="og:image:height" content="1080" />
        <meta property="og:image:alt" content="Smart Emergency Call Response Video Preview" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content="/videos/poster.jpg" />

        {/* Theme color for mobile browser bars */}
        <meta name="theme-color" content="#070d1e" />
      </Head>

      {/* 1. Header with Logo, Navigation & Lang Toggle */}
      <LandingHeader
        content={content}
        isArabic={isArabic}
        onToggleLang={toggleLanguage}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 2. Hero Section */}
        <HeroSection
          content={content}
          isArabic={isArabic}
        />

        {/* 3. Video Demonstration Section */}
        <VideoSection
          content={content}
          isArabic={isArabic}
        />

        {/* 4. How It Works Pipeline (5 Steps) */}
        <HowItWorksSection
          content={content}
          isArabic={isArabic}
        />

        {/* 5. Trust and Safety (4 Cards) */}
        <TrustSafetySection
          content={content}
          isArabic={isArabic}
        />
      </main>

      {/* 6. Footer with Configurable Contact Info & Notice */}
      <LandingFooter
        content={content}
        isArabic={isArabic}
      />
    </div>
  );
}
