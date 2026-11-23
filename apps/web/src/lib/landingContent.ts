export interface LandingContent {
  header: {
    systemTitle: string;
    systemSubtitle: string;
    home: string;
    guide: string;
    login: string;
    switchLang: string;
  };
  hero: {
    badge: string;
    headline: string;
    description: string;
    watchVideo: string;
    viewGuide: string;
  };
  video: {
    sectionTitle: string;
    sectionSubtitle: string;
    fullVideoTab: string;
    teaserTab: string;
    durationLabel: string;
    teaserDurationLabel: string;
    captionsAvailable: string;
  };
  howItWorks: {
    sectionTitle: string;
    sectionSubtitle: string;
    steps: {
      number: string;
      title: string;
      description: string;
      highlight: string;
    }[];
  };
  trustSafety: {
    sectionTitle: string;
    sectionSubtitle: string;
    cards: {
      title: string;
      description: string;
      badge: string;
    }[];
  };
  footer: {
    rightsReserved: string;
    contactTitle: string;
    contactNameLabel: string;
    contactEmailLabel: string;
    contactPhoneLabel: string;
    emergencyHotline: string;
    systemNotice: string;
  };
}

export const landingContentAr: LandingContent = {
  header: {
    systemTitle: "منظومة الاستجابة الذكية لبلاغات الطوارئ",
    systemSubtitle: "معالجة فورية وموثوقة للمكالمات الصوتية",
    home: "الرئيسية",
    guide: "دليل الاستخدام",
    login: "تسجيل الدخول",
    switchLang: "English",
  },
  hero: {
    badge: "تقنية سيادية لمعالجة نداءات الطوارئ",
    headline: "منظومة استجابة ذكية تساند مأموري العمليات في استقبال وتوثيق بلاغات الطوارئ بدقة متناهية.",
    description: "معالجة فورية للمكالمات الصوتية وفهم دقيق للهجات المحكية، مع تصحيح التشوهات اللفظية واستخلاص بيانات الحادث وتوجيه الدعم الميداني بأعلى معايير الأمان وسرية البيانات.",
    watchVideo: "شاهد الفيديو التعريفي",
    viewGuide: "دليل الاستخدام",
  },
  video: {
    sectionTitle: "العرض التعريفي الميداني",
    sectionSubtitle: "شاهد كيف تتعامل المنظومة مع المكالمات الحقيقية تحت ضغط الصوت والضوضاء خطوة بخطوة.",
    fullVideoTab: "العرض التعريفي الكامل",
    teaserTab: "موجز الفيديو (30 ثانية)",
    durationLabel: "1:50 دقيقة • عالي الدقة 1080p",
    teaserDurationLabel: "30 ثانية • إيجاز فوري",
    captionsAvailable: "الترجمة التوضيحية متوفرة باللغتين العربية والإنجليزية",
  },
  howItWorks: {
    sectionTitle: "كيف تعمل المنظومة",
    sectionSubtitle: "مسار معالجة فوري متكامل من بدء رنين المكالمة وحتى وصول الدورية الميدانية:",
    steps: [
      {
        number: "01",
        title: "المتصل",
        description: "استقبال البلاغ الصوتي لحظياً مع دعم كامل للمتصل تحت الضغط العصبي وضوضاء الشارع.",
        highlight: "استيعاب فوري للاتصال",
      },
      {
        number: "02",
        title: "التعرف الصوتي",
        description: "تحويل مباشر من الصوت إلى نص دقيق مراعياً مختلف لكنات واللهجات المحكية المتداولة.",
        highlight: "تفريغ صوتي لحظي",
      },
      {
        number: "03",
        title: "التصحيح اللغوي",
        description: "معالجة المقاطع الصوتية المشوشة وضبط الحروف والمسميات دون المساس بوقائع البلاغ.",
        highlight: "ضبط دقيق للكلمات",
      },
      {
        number: "04",
        title: "فهم نوع البلاغ",
        description: "مطابقة دلالية ذكية تصنف الحادث وتستنتج طبيعة الطوارئ والدرجة الحرجة بدقة موضوعية.",
        highlight: "تصنيف دلالي سريع",
      },
      {
        number: "05",
        title: "أسئلة محددة وإرسال الدورية",
        description: "توليد أسئلة توضيحية مقتضبة لحصر الموقع والمعالم البارزة، ثم إرسال بطاقة البلاغ فوراً للميدان.",
        highlight: "توجيه أمني فوري",
      },
    ],
  },
  trustSafety: {
    sectionTitle: "الأمان والموثوقية والرقابة السيادية",
    sectionSubtitle: "صُممت المنظومة لتضمن أقصى درجات الانضباط الأمني والمساءلة الإجرائية في كل تفصيلة:",
    cards: [
      {
        title: "النص الأصلي محفوظ مع المصحح",
        description: "يتم الاحتفاظ بالتسجيل الصوتي الحرفي والتفريغ الأولي دون أي تعديل إلى جانب النسخة المصححة لضمان التوثيق الجنائي النزيه.",
        badge: "توثيق جنائي كامل",
      },
      {
        title: "المراجعة البشرية للحالات المشبوهة",
        description: "الذكاء الاصطناعي أداة معاونة؛ أي تباين دلالي أو بلاغ غير مكتمل يتم تنبيه مأمور العمليات البشري فوراً للتدخل واتخاذ القرار.",
        badge: "إشراف بشري مستمر",
      },
      {
        title: "كلام المتصل بيانات لا تعليمات",
        description: "حماية مطلقة من حقن التعليمات؛ كلمات المتصل تُعامل برمجياً كبيانات نصية خاضعة للفحص، ولا تملك أي سلطة لتوجيه النظام أو تعديل سلوكه.",
        badge: "عزل أمني صارم",
      },
      {
        title: "أي عطل لا يوقف المكالمة",
        description: "بنية تحتية مرنة تعتمد التحويل الآلي اللحظي؛ في حال تعطل أي خادم أو مكوّن يستمر الاتصال الصوتي دون انقطاع وينتقل للضابط المناوب فوراً.",
        badge: "جاهزية واستمرارية دائمة",
      },
    ],
  },
  footer: {
    rightsReserved: "جميع الحقوق محفوظة للمنظومة الذكية لإدارة بلاغات الطوارئ",
    contactTitle: "التواصل والدعم الفني",
    contactNameLabel: "الجهة المسؤولة",
    contactEmailLabel: "البريد الإلكتروني",
    contactPhoneLabel: "هاتف الطوارئ والعمليات",
    emergencyHotline: "خط طوارئ 122",
    systemNotice: "هذه المنظومة مخصصة للاستخدام المصرح به من قبل مشغلي غرف الطوارئ ومأموري العمليات.",
  },
};

export const landingContentEn: LandingContent = {
  header: {
    systemTitle: "Smart Emergency Call Response System",
    systemSubtitle: "Instant & Reliable Voice Call Processing",
    home: "Home",
    guide: "User Guide",
    login: "Sign In",
    switchLang: "العربية",
  },
  hero: {
    badge: "Sovereign Emergency Call Processing Technology",
    headline: "An intelligent emergency response system assisting dispatchers in receiving and documenting emergency calls with complete precision.",
    description: "Instant voice processing and robust comprehension of spoken colloquial dialects, correcting audio distortions, extracting critical incident data, and accelerating field dispatch under rigorous security standards.",
    watchVideo: "Watch Introductory Video",
    viewGuide: "User Guide",
  },
  video: {
    sectionTitle: "Operational Field Demonstration",
    sectionSubtitle: "See step-by-step how the system handles live emergency calls under heavy noise and caller panic.",
    fullVideoTab: "Full Operational Video",
    teaserTab: "30-Second Summary",
    durationLabel: "1:50 mins • Full HD 1080p",
    teaserDurationLabel: "30 secs • Quick Overview",
    captionsAvailable: "Subtitles available in Arabic and English",
  },
  howItWorks: {
    sectionTitle: "How It Works",
    sectionSubtitle: "An end-to-end real-time pipeline from the moment the call rings until units are dispatched:",
    steps: [
      {
        number: "01",
        title: "The Caller",
        description: "Instant audio intake supporting callers under acute stress and severe acoustic interference.",
        highlight: "Immediate Intake",
      },
      {
        number: "02",
        title: "Speech Recognition",
        description: "Real-time speech-to-text decoding tuned specifically for colloquial Egyptian Arabic dialects.",
        highlight: "Live Transcription",
      },
      {
        number: "03",
        title: "Phonetic Correction",
        description: "Linguistic post-processing to correct distorted phonemes without altering any factual statement.",
        highlight: "Exact Correction",
      },
      {
        number: "04",
        title: "Incident Understanding",
        description: "Semantic classification rapidly categorizing incident urgency and nature with objective consistency.",
        highlight: "Semantic Mapping",
      },
      {
        number: "05",
        title: "Targeted Inquiries & Dispatch",
        description: "Concise follow-up questions to isolate locations and key landmarks, immediately generating the dispatch ticket.",
        highlight: "Instant Dispatch",
      },
    ],
  },
  trustSafety: {
    sectionTitle: "Trust, Safety & Sovereign Oversight",
    sectionSubtitle: "Engineered to deliver full institutional integrity and procedural accountability at every turn:",
    cards: [
      {
        title: "Verbatim Audit Trail Retained",
        description: "The raw acoustic audio and unfiltered transcript are permanently preserved alongside the normalized text for forensic integrity.",
        badge: "Forensic Integrity",
      },
      {
        title: "Human In The Loop for Ambiguities",
        description: "AI is an assistive co-pilot; any ambiguous scenario or edge case instantly escalates to human duty officers for binding decisions.",
        badge: "Human Oversight",
      },
      {
        title: "Caller Speech is Data, Not Instructions",
        description: "Absolute prompt-injection defense: caller utterances are strictly treated as inert data payload, unable to manipulate system behavior.",
        badge: "Prompt Isolation",
      },
      {
        title: "Zero-Downtime Telephony Fallback",
        description: "Resilient failover architecture guarantees that an upstream component failure never drops a live call, preserving officer handoff.",
        badge: "High Availability",
      },
    ],
  },
  footer: {
    rightsReserved: "All rights reserved. Smart Emergency Operations AI System.",
    contactTitle: "Contact & Technical Inquiries",
    contactNameLabel: "Responsible Team",
    contactEmailLabel: "Email Address",
    contactPhoneLabel: "Emergency Hotline",
    emergencyHotline: "Emergency Hotline 122",
    systemNotice: "This system is intended for authorized emergency call center personnel and dispatchers.",
  },
};
