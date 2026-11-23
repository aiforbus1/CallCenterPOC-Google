export interface GuideContent {
  header: {
    title: string;
    subtitle: string;
    home: string;
    login: string;
    switchLang: string;
  };
  hero: {
    badge: string;
    title: string;
    description: string;
  };
  sections: {
    id: string;
    number: string;
    title: string;
    summary: string;
    points: {
      title: string;
      detail: string;
    }[];
  }[];
  faq: {
    title: string;
    items: {
      question: string;
      answer: string;
    }[];
  };
  cta: {
    title: string;
    description: string;
    returnHome: string;
    loginBtn: string;
  };
}

export const guideContentAr: GuideContent = {
  header: {
    title: "دليل استخدام المنظومة الذكية",
    subtitle: "إرشادات الاستجابة والتشغيل الميداني",
    home: "الرئيسية",
    login: "تسجيل الدخول",
    switchLang: "English",
  },
  hero: {
    badge: "الدليل الإرشادي الموحد للمشغلين والمأمورين",
    title: "دليل التشغيل وإدارة بلاغات الطوارئ 122",
    description: "مرجع شامل يوضح كيفية تعامل المنظومة الذكية مع البلاغات الواردة، ودور مأمور العمليات في الإشراف والمراجعة وتوجيه الوحدات الميدانية بأعلى درجات الدقة والسرعة.",
  },
  sections: [
    {
      id: "intake",
      number: "01",
      title: "استقبال المكالمة وتوثيق الصوت",
      summary: "تتعامل المنظومة مع المكالمة فور اتصال المواطن بخط الطوارئ 122 دون تأخير.",
      points: [
        {
          title: "معالجة التشويش والضوضاء",
          detail: "فلاتر رقمية لعزل ضوضاء الشارع وصفارات الإنذار، مما يتيح استخلاص صوت المتصل بوضوح حتى في الظروف الميدانية الصعبة.",
        },
        {
          title: "التفريغ الصوتي الفوري اللحظي",
          detail: "تحويل مباشر للكلام إلى نص مقروء على شاشة المأمور كلمة بكلمة بالتوازي مع استمرار المكالمة الهاتفية.",
        },
      ],
    },
    {
      id: "dialects",
      number: "02",
      title: "فهم اللهجة المصرية وتصحيح العبارات",
      summary: "نماذج لغوية متخصصة تستوعب التعبيرات العامية والكلمات السريعة الدارجة.",
      points: [
        {
          title: "تصحيح الفونيمات الصوتية",
          detail: "ضبط الأخطاء الشائعة في النطق أو الحروف المتداخلة دون إضافة أي وقائع غير منطوقة من المتصل.",
        },
        {
          title: "المطابقة الدلالية لنوع الحادث",
          detail: "استنتاج طبيعة الحادث (مشاجرة، حادث طريق، حريق، سرقة) حتى لو استخدم المتصل ألفاظاً دارجة ومصطلحات محلية.",
        },
      ],
    },
    {
      id: "clarification",
      number: "03",
      title: "الأسئلة الذكية وتحديد الموقع",
      summary: "توليد أسئلة توضيحية سريعة لحصر الموقع الدقيق والمعالم الحيوية.",
      points: [
        {
          title: "الاستفسار عن العلامات المميزة",
          detail: "توجيه أسئلة سريعة ومحددة عن أقرب محطة وقود، ميدان، أو علامة مميزة لتفادي إضاعة الوقت.",
        },
        {
          title: "بطاقة البلاغ التلقائية",
          detail: "تجميع بيانات البلاغ (النوع، العنوان، حالة المصابين، التقييم الحرج) في بطاقة موحدة جاهزة للتسليم الميداني.",
        },
      ],
    },
    {
      id: "dispatch",
      number: "04",
      title: "دور مأمور العمليات والرقابة البشرية",
      summary: "المأمور البشري هو صاحب القرار النهائي في اعتماد وتوجيه أي إجراء.",
      points: [
        {
          title: "الاعتماد الفوري أو التعديل",
          detail: "يستعرض المأمور بطاقة البلاغ والمسودة الفورية وله صلاحية التدخل الصوتي أو تعديل التصنيف أو طلب توضيح إضافي.",
        },
        {
          title: "تحويل البلاغ للدورية الأمنية",
          detail: "بنقرة واحدة يتم إرسال البلاغ المدقق والموقع الجغرافي لأقرب دورية أمنية أو فرقة استجابة في نطاق الحدث.",
        },
      ],
    },
  ],
  faq: {
    title: "الأسئلة الأكثر شيوعاً",
    items: [
      {
        question: "هل يحل الذكاء الاصطناعي محل ضابط أو مأمور العمليات؟",
        answer: "قطعاً لا. المنظومة أداة معاونة تقنية ترفع العبء الكتابي والتوثيقي عن المأمور وتفرغ صوته وذهنه للتركيز على تقييم الموقف الإنساني وإصدار الأوامر الميدانية.",
      },
      {
        question: "كيف يتم التعامل مع انقطاع الإنترنت أو بطء الشبكة؟",
        answer: "المنظومة مصممة بآلية تحويل احتياطي فورية (Zero-Downtime Telephony Fallback)، بحيث تستمر المكالمة الصوتية مباشرة مع المأمور دون أي انقطاع.",
      },
      {
        question: "هل يتم الاحتفاظ بالتسجيل الأصلي للمكالمة؟",
        answer: "نعم، يُحفظ التسجيل الصوتي الحرفي والتفريغ الأولي دون أي تدخل إلى جانب النسخة المنقحة والمصححة، بما يحفظ سلسلة الحيازة الجنائية كاملة.",
      },
      {
        question: "كيف تحمي المنظومة نفسها من محاولات التضليل الصوتي؟",
        answer: "يتم التعامل مع حديث المتصل برمجياً كبيانات مدخلة فقط (Data Payload)، وتمر عبر طبقة أمان تعزل أي محاولات لحقن أوامر برمجية (Prompt Isolation).",
      },
    ],
  },
  cta: {
    title: "جاهز لبدء العمليات؟",
    description: "يمكن للمشغلين والمأمورين المعتمدين تسجيل الدخول إلى لوحة التحكم الحية ومتابعة البلاغات اللحظية.",
    returnHome: "العودة للرئيسية",
    loginBtn: "تسجيل الدخول للمنظومة",
  },
};

export const guideContentEn: GuideContent = {
  header: {
    title: "Smart System User Guide",
    subtitle: "Operational & Field Dispatch Guidelines",
    home: "Home",
    login: "Sign In",
    switchLang: "العربية",
  },
  hero: {
    badge: "Unified Standard Guide for Operators and Dispatchers",
    title: "Operational Guide for Emergency Call Response 122",
    description: "A comprehensive reference clarifying how the AI system processes incoming calls, and the pivotal oversight role of human duty officers in reviewing and dispatching emergency units with maximum speed and precision.",
  },
  sections: [
    {
      id: "intake",
      number: "01",
      title: "Call Intake & Audio Capture",
      summary: "Handling incoming emergency calls instantaneously without procedural lag.",
      points: [
        {
          title: "Acoustic Noise Filtering",
          detail: "Digital suppression of street sirens, wind, and background commotion to isolate caller phonemes cleanly.",
        },
        {
          title: "Real-Time Word-by-Word Decoding",
          detail: "Instant audio-to-text rendering appearing directly on the dispatcher console alongside the live call stream.",
        },
      ],
    },
    {
      id: "dialects",
      number: "02",
      title: "Dialect Understanding & Linguistic Correction",
      summary: "Domain-tuned linguistic models natively understanding rapid Egyptian colloquial phrasing.",
      points: [
        {
          title: "Phonetic Restoration",
          detail: "Reconciling phonetically compressed or distorted syllables without introducing unsaid or fabricated facts.",
        },
        {
          title: "Semantic Incident Mapping",
          detail: "Inferring incident categories (altercation, traffic accident, structural fire, theft) despite regional colloquial idioms.",
        },
      ],
    },
    {
      id: "clarification",
      number: "03",
      title: "Targeted Inquiries & Landmark Triangulation",
      summary: "Formulating concise questions to pinpoint exact street coordinates and notable landmarks.",
      points: [
        {
          title: "Landmark Verification",
          detail: "Prompting callers for nearby petrol stations, plazas, or visible structures to avoid navigational delays.",
        },
        {
          title: "Automated Incident Dispatch Ticket",
          detail: "Aggregating critical elements (severity, address, injuries) into a structured dispatch ticket ready for field response.",
        },
      ],
    },
    {
      id: "dispatch",
      number: "04",
      title: "Human Operator Oversight & Dispatch",
      summary: "Human officers retain absolute decision authority over tickets and dispatch approvals.",
      points: [
        {
          title: "Instant Audit & Modification",
          detail: "Dispatchers review the real-time ticket, with full authority to intervene on audio, adjust categories, or request further clarification.",
        },
        {
          title: "Field Unit Transmission",
          detail: "With a single click, validated incident details and GIS coordinates are routed to the nearest emergency responder.",
        },
      ],
    },
  ],
  faq: {
    title: "Frequently Asked Questions",
    items: [
      {
        question: "Does artificial intelligence replace human emergency dispatchers?",
        answer: "Absolutely not. The AI serves as an assistive technological co-pilot, handling transcription and data extraction so officers can dedicate full focus to situational assessment.",
      },
      {
        question: "How does the system respond to network drops or latency spikes?",
        answer: "Built on an automated zero-downtime telephony fallback, the voice call stream remains permanently uninterrupted, transferring smoothly to the operator.",
      },
      {
        question: "Is the raw audio recording permanently preserved?",
        answer: "Yes. Verbatim audio recordings and unedited transcripts are preserved alongside normalized outputs to maintain an unbroken forensic chain of custody.",
      },
      {
        question: "How does the pipeline neutralize malicious prompt injections?",
        answer: "Caller audio and transcripts are treated strictly as inert data payload, filtered through isolation guardrails that prevent instruction overrides.",
      },
    ],
  },
  cta: {
    title: "Ready to Begin Operations?",
    description: "Authorized dispatchers and officers can sign in to the live management console to supervise real-time incidents.",
    returnHome: "Return to Home",
    loginBtn: "Sign In to Operations Console",
  },
};
