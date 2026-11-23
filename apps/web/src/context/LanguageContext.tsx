import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "ar" | "en";

interface LanguageContextType {
  lang: Language;
  dir: "rtl" | "ltr";
  isArabic: boolean;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // App Brand
    app_title: "شرطة النجدة 122",
    app_subtitle: "NAGDA 122 Operations",
    
    // Navigation
    nav_overview: "نظرة عامة",
    nav_live_calls: "المكالمات الجارية",
    nav_call_history: "سجل المكالمات",
    nav_reporters: "المبلّغين",
    nav_extractions: "مراجعة الاستخراج",
    nav_transcripts: "النصوص والتسجيلات",
    nav_users: "إدارة المستخدمين والصلاحيات",
    nav_profile: "الملف الشخصي والأمان",
    nav_settings: "إعدادات الذكاء الاصطناعي",
    nav_sign_out: "تسجيل الخروج",

    // Header & Status
    status_voice_pipeline_active: "خط الصوت نشط",
    dashboard_overview: "نظرة عامة على البلاغات",
    header_live_calls: "غرفة المكالمات الحية",
    header_call_history: "سجل بلاغات النجدة",
    header_reporters: "قاعدة بيانات المبلّغين",
    header_extractions: "استخراج البيانات التلقائي",
    header_transcripts: "النصوص الصوتية للبلاغات",
    header_users: "إدارة مستخدمي المنظومة والأدوار والأمان",
    header_profile: "بيانات الحساب وإدارة أمان المستخدمين",
    header_settings: "إعدادات منظومة النجدة 122",

    // Common Buttons
    btn_save: "حفظ الإعدادات",
    btn_saving: "جاري الحفظ...",
    btn_saved_success: "تم الحفظ بنجاح",
    btn_reset_defaults: "استعادة الافتراضي",
    btn_listen: "استمع للجملة",
    btn_playing: "جاري التشغيل...",
    btn_add_department: "إضافة قسم",
    btn_add_category: "إضافة تصنيف",
    btn_add_question: "إضافة سؤال للبلاغ",
    btn_language_switch: "English",

    // Settings Headers
    settings_main_title: "غرفة عمليات شرطة النجدة 122 المصرية",
    settings_main_subtitle: "إعدادات سيناريو الطوارئ والأسئلة الشجرية المتفرعة، وتوجيه البلاغات التلقائي للدوريات والأقسام الداخلية",
    settings_departments_title: "الأقسام الداخلية وغرف العمليات",
    settings_categories_title: "فئات وتصنيفات البلاغات",
    settings_script_title: "سيناريو الذكاء الاصطناعي والأسئلة الشجرية المتفرعة",
    settings_script_subtitle: "تخصيص عبارات الترحيب، الأسئلة المتفرعة، والتوجيه التلقائي للمكالمات",
    settings_sentences_title: "عبارات وجمل المكالمة التي ينطق بها المساعد للمبلّغ",
    settings_sentences_subtitle: "يمكنك تخصيص كافة الجمل والعبارات التي يخاطب بها المساعد الذكي المبلّغ باللغتين العربية والإنجليزية",

    // Sentences Tabs
    tab_arabic_sentences: "🇸🇦 عبارات المكالمة بالعربية",
    tab_english_sentences: "🇬🇧 English Call Sentences",

    // Arabic Sentences Labels
    s1_greeting: "رسالة الترحيب الافتتاحية",
    s1_greeting_desc: "الجملة الترحيبية الأولى التي ينطق بها المساعد فور فتح الخط للترحيب بالمبلّغ",
    s2_ack: "عبارة الاستلام والتطمين قبل السؤال التالي",
    s2_ack_desc: "العبارة التي ينطق بها المساعد لطمأنة المتصل فور استلام كل إجابة وقبل طرح السؤال التالي مباشرة",
    s3_clarify: "رسالة الاستيضاح عند عدم وضوح الصوت",
    s3_clarify_desc: "تُقال تلقائياً عندما لا يتمكن النظام من سماع كلام المتصل بوضوح أو عند وجود تشويش صوتي",
    s4_hangup: "رسالة التطمين عند استعجال المتصل أو إنهاء المكالمة",
    s4_hangup_desc: "تُقال عند استعجال المتصل لإنهاء المكالمة أو قول 'مع السلامة' قبل انتهاء كافة الأسئلة لطمأنته بتحرك الدورية",
    s5_closing: "رسالة التأكيد الختامية لإنهاء المكالمة وإرسال الدورية",
    s5_closing_desc: "تُقال بعد استيفاء جميع الأسئلة المطلوبة لإخطار المبلّغ بتحرك الدورية وإغلاق الخط بأمان",

    // English Sentences Labels
    en_s1_greeting: "Opening Greeting Message (English)",
    en_s1_greeting_desc: "The initial greeting spoken by the emergency agent upon answering the call",
    en_s2_ack: "Transition & Acknowledgment Message (English)",
    en_s2_ack_desc: "Spoken to reassure the caller after each answer before moving to the next question",
    en_s3_clarify: "Clarification on Unclear Audio (English)",
    en_s3_clarify_desc: "Triggered automatically when the caller audio is unclear or silent",
    en_s4_hangup: "Early Hangup / Rush Reassurance Message (English)",
    en_s4_hangup_desc: "Spoken when the caller has to hang up urgently or says goodbye early",
    en_s5_closing: "Final Patrol Dispatch & Closing Message (English)",
    en_s5_closing_desc: "Spoken once all questions are completed to confirm patrol dispatch and conclude the call",
  },
  en: {
    // App Brand
    app_title: "Egyptian Police 122",
    app_subtitle: "NAGDA 122 Operations",

    // Navigation
    nav_overview: "Overview",
    nav_live_calls: "Live Calls",
    nav_call_history: "Call History",
    nav_reporters: "Reporters",
    nav_extractions: "Extractions Review",
    nav_transcripts: "Transcripts",
    nav_users: "Users & Roles",
    nav_profile: "Profile & Security",
    nav_settings: "AI Settings",
    nav_sign_out: "Sign Out",

    // Header & Status
    status_voice_pipeline_active: "Voice Pipeline Active",
    dashboard_overview: "Emergency Dashboard Overview",
    header_live_calls: "Live Emergency Calls",
    header_call_history: "Call Reports History",
    header_reporters: "Reporters Directory",
    header_extractions: "Data Extractions",
    header_transcripts: "Voice Transcripts",
    header_users: "Team Users & Role Management",
    header_profile: "Account Profile & User Security",
    header_settings: "122 Hotline Settings",

    // Common Buttons
    btn_save: "Save Settings",
    btn_saving: "Saving...",
    btn_saved_success: "Saved Successfully",
    btn_reset_defaults: "Reset to Defaults",
    btn_listen: "Play Audio",
    btn_playing: "Playing...",
    btn_add_department: "Add Department",
    btn_add_category: "Add Category",
    btn_add_question: "Add Question",
    btn_language_switch: "العربية",

    // Settings Headers
    settings_main_title: "Egyptian Police Emergency Operations (122)",
    settings_main_subtitle: "Emergency dialogue scenario, recursive branching questions, and automated patrol/department dispatch",
    settings_departments_title: "Internal Departments & Operations Rooms",
    settings_categories_title: "Incident Categories & Priority",
    settings_script_title: "AI Agent Script & Branching Questions",
    settings_script_subtitle: "Configure greetings, recursive questions based on answers, and automated routing",
    settings_sentences_title: "Spoken Dialogue Sentences & Reassurances",
    settings_sentences_subtitle: "Customize all sentences spoken by the AI assistant to callers in Arabic and English",

    // Sentences Tabs
    tab_arabic_sentences: "🇸🇦 Arabic Call Sentences",
    tab_english_sentences: "🇬🇧 English Call Sentences",

    // Arabic Sentences Labels
    s1_greeting: "Opening Greeting Message (Arabic)",
    s1_greeting_desc: "The initial greeting in Arabic spoken by the assistant upon answering",
    s2_ack: "Transition & Acknowledgment (Arabic)",
    s2_ack_desc: "Reassurance phrase spoken in Arabic before each following question",
    s3_clarify: "Clarification on Unclear Audio (Arabic)",
    s3_clarify_desc: "Spoken when Arabic speech is not clearly understood or noise is detected",
    s4_hangup: "Early Exit Reassurance (Arabic)",
    s4_hangup_desc: "Spoken when the caller hangs up early or says goodbye before completing all questions",
    s5_closing: "Closing Patrol Dispatch Confirmation (Arabic)",
    s5_closing_desc: "Spoken at the end of the call to confirm patrol dispatch and end safely",

    // English Sentences Labels
    en_s1_greeting: "Opening Greeting Message (English)",
    en_s1_greeting_desc: "The initial greeting spoken by the emergency agent upon answering the call",
    en_s2_ack: "Transition & Acknowledgment Message (English)",
    en_s2_ack_desc: "Spoken to reassure the caller after each answer before moving to the next question",
    en_s3_clarify: "Clarification on Unclear Audio (English)",
    en_s3_clarify_desc: "Triggered automatically when the caller audio is unclear or silent",
    en_s4_hangup: "Early Hangup / Rush Reassurance Message (English)",
    en_s4_hangup_desc: "Spoken when the caller has to hang up urgently or says goodbye early",
    en_s5_closing: "Final Patrol Dispatch & Closing Message (English)",
    en_s5_closing_desc: "Spoken once all questions are completed to confirm patrol dispatch and conclude the call",
  },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "ar",
  dir: "rtl",
  isArabic: true,
  setLang: () => {},
  toggleLang: () => {},
  t: (k) => k,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>("ar");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nagda_lang") as Language;
      if (saved === "ar" || saved === "en") {
        setLangState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem("nagda_lang", newLang);
    } catch {
      // ignore
    }
  };

  const toggleLang = () => {
    const nextLang: Language = lang === "ar" ? "en" : "ar";
    setLang(nextLang);
  };

  const dir: "rtl" | "ltr" = lang === "ar" ? "rtl" : "ltr";
  const isArabic = lang === "ar";

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations["ar"]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, dir, isArabic, setLang, toggleLang, t }}>
      <div dir={dir} className={lang === "ar" ? "font-arabic" : "font-sans"}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
