/**
 * Egyptian Police Emergency Hotline (122) - Video Content & Timing Schema
 * Based on the approved script.md for a 100-second (3000 frames @ 30fps) video.
 *
 * ALL text, timings, dialogue, subtitles, and labels are stored here.
 */

export interface SubtitleItem {
  id: string;
  startFrame: number;
  endFrame: number;
  arabicText: string;
  sceneId: string;
}

export interface PipelineStage {
  id: string;
  order: number;
  titleArabic: string;
  subtitleArabic: string;
  technology: string;
  status: "verified" | "processing" | "pending";
}

export interface QuestionTreeCategory {
  id: string;
  titleArabic: string;
  scenarioCount: number;
  scenarios: string[];
}

export interface ContentData {
  metadata: {
    title: string;
    targetAudience: string;
    totalFrames: number;
    fps: number;
    durationSeconds: number;
    hotline: string;
  };
  timings: {
    problem: { startFrame: number; durationFrames: number; endFrame: number };
    solutionIntro: { startFrame: number; durationFrames: number; endFrame: number };
    liveDemo: { startFrame: number; durationFrames: number; endFrame: number };
    questionTree: { startFrame: number; durationFrames: number; endFrame: number };
    trustAndSafety: { startFrame: number; durationFrames: number; endFrame: number };
    closing: { startFrame: number; durationFrames: number; endFrame: number };
  };
  pipelineStages: PipelineStage[];
  demoCall: {
    callerLabel: string;
    callerNumber: string;
    callerLocation: string;
    rawTranscript: string;
    correctedTranscript: string;
    corrections: Array<{
      raw: string;
      corrected: string;
      type: "phonetic" | "dialect";
    }>;
    semanticMatch: {
      garbledSpoken: string;
      recognizedType: string;
      categoryArabic: string;
      clarificationRule: string;
    };
    beats: Array<{
      id: string;
      startFrame: number;
      endFrame: number;
      activeStageId: string;
      assistantPrompt: string;
      callerRawText?: string;
      callerCorrectedText?: string;
      fieldKey?: string;
      badgeVariant: "verified" | "review";
      badgeLabel: string;
      soundCue: string;
      changedTokens?: Array<{ raw: string; corrected: string; reason: string }>;
      correctorStatus?: string;
      semanticMatchResult?: string;
      resolvedCategory?: string;
      followUpPrompt?: string;
      suspiciousInput?: string;
      validationFailureReason?: string;
      ruleEnforced?: string;
    }>;
  };
  questionTree: {
    coreQuestions: Array<{
      id: string;
      order: number;
      labelArabic: string;
      promptArabic: string;
    }>;
    categories: QuestionTreeCategory[];
    zoomScenarios: Array<{
      id: string;
      title: string;
      category: string;
      badge: string;
      followUps: Array<{ order: number; question: string }>;
    }>;
  };
  trustAndSafetyPillars: Array<{
    id: string;
    titleArabic: string;
    descriptionArabic: string;
    badgeType: "verified" | "review";
    badgeText: string;
  }>;
  closing: {
    pilotTitle: string;
    pilotSubtitle: string;
    stages: Array<{
      order: number;
      title: string;
      subtitle: string;
      status: string;
    }>;
    contact: {
      name: string;
      email: string;
      phone: string;
    };
    motto: string;
  };
  subtitles: SubtitleItem[];
  lowerThirds: Record<string, { title: string; subtitle: string; tag: string }>;
}

export const content: ContentData = {
  metadata: {
    title: "منظومة المساعد الذكي لبلاغات طوارئ شرطة النجدة (122)",
    targetAudience: "قيادات وزارة الداخلية المصرية وصناع القرار",
    totalFrames: 3310,
    fps: 30,
    durationSeconds: 110.33,
    hotline: "122",
  },
  timings: {
    problem: { startFrame: 0, durationFrames: 360, endFrame: 360 }, // 0 - 12.0s (Audio Charon: 11.44s)
    solutionIntro: { startFrame: 360, durationFrames: 460, endFrame: 820 }, // 12.0 - 27.33s (Audio Charon: 14.88s)
    liveDemo: { startFrame: 820, durationFrames: 960, endFrame: 1780 }, // 27.33 - 59.33s (Audio Charon: 30.48s)
    questionTree: { startFrame: 1780, durationFrames: 620, endFrame: 2400 }, // 59.33 - 80.0s (Audio Charon: 19.84s)
    trustAndSafety: { startFrame: 2400, durationFrames: 620, endFrame: 3020 }, // 80.0 - 100.67s (Audio Charon: 20.00s)
    closing: { startFrame: 3020, durationFrames: 290, endFrame: 3310 }, // 100.67 - 110.33s (Audio Charon: 9.00s)
  },
  pipelineStages: [
    {
      id: "caller",
      order: 1,
      titleArabic: "المتصل",
      subtitleArabic: "لهجة دارجة وضجيج",
      technology: "Egyptian Dialect Audio",
      status: "verified",
    },
    {
      id: "stt",
      order: 2,
      titleArabic: "التفريغ الصوتي",
      subtitleArabic: "تحويل الصوت إلى نص خام",
      technology: "Real-Time STT Engine",
      status: "verified",
    },
    {
      id: "correction",
      order: 3,
      titleArabic: "المصحح اللغوي",
      subtitleArabic: "تصحيح صوتي دون إضافة وقائع",
      technology: "Phonetic Language Corrector",
      status: "verified",
    },
    {
      id: "semantic",
      order: 4,
      titleArabic: "المطابق الدلالي",
      subtitleArabic: "فهم الحادث حتى مع تشوه اللفظ",
      technology: "Semantic Matcher",
      status: "verified",
    },
    {
      id: "question_tree",
      order: 5,
      titleArabic: "شجرة الأسئلة",
      subtitleArabic: "20 سيناريو في 5 فئات",
      technology: "Structured Decision Tree",
      status: "verified",
    },
    {
      id: "dispatch",
      order: 6,
      titleArabic: "التوجيه العملياتي",
      subtitleArabic: "إسناد لمأمور العمليات",
      technology: "CAD & Field Dispatch",
      status: "verified",
    },
  ],
  demoCall: {
    callerLabel: "مواطن متصل (بيانات افتراضية)",
    callerNumber: "010-0000-0000",
    callerLocation: "شارع مراد - الجيزة",
    rawTranscript: "الو يا فندم في مشغرة جامدة في شارع التحرير جمب محطة المترو وفيه ناس اتصابت",
    correctedTranscript: "ألو يا فندم في مشاجرة جامدة في شارع التحرير جنب محطة المترو وفيه ناس اتصابت",
    corrections: [
      { raw: "مشغرة", corrected: "مشاجرة", type: "phonetic" },
      { raw: "جمب", corrected: "جنب", type: "dialect" },
      { raw: "الو", corrected: "ألو", type: "phonetic" },
    ],
    semanticMatch: {
      garbledSpoken: "مشغرة",
      recognizedType: "مشاجرة واعتداء في الطريق العام",
      categoryArabic: "المشاجرات والاعتداءات",
      clarificationRule: "لا إنهاء للمكالمة دون فهم قاطع لنوع الحادث، مع الاستيضاح بلباقة",
    },
    // Detailed 5-beat sequence for Scene 3 live demo
    // Includes sound-design markers for future audio mix
    beats: [
      {
        id: "beat_1_name",
        startFrame: 0,
        endFrame: 180, // 0 - 6s
        activeStageId: "stt",
        assistantPrompt: "شرطة النجدة 122، اسم حضرتك بالكامل لإثبات البلاغ؟",
        callerRawText: "أحمد محمود إبراهيم يا فندم",
        callerCorrectedText: "أحمد محمود إبراهيم",
        fieldKey: "caller_name",
        badgeVariant: "verified" as const,
        badgeLabel: "تم التسجيل",
        soundCue: "// SFX: incoming_ring.wav -> keystroke_type.wav",
      },
      {
        id: "beat_2_phone",
        startFrame: 180,
        endFrame: 360, // 6 - 12s
        activeStageId: "correction",
        assistantPrompt: "رقم تليفون حضرتك للتواصل ومتابعة تحرك الدورية؟",
        callerRawText: "زيرو عشره اصفار 01000000000",
        callerCorrectedText: "010-0000-0000", // Fictional fake number
        fieldKey: "phone_number",
        badgeVariant: "verified" as const,
        badgeLabel: "تم التحقق (11 رقماً)",
        soundCue: "// SFX: stt_correct_chime.wav & validation_success.wav",
      },
      {
        id: "beat_3_location",
        startFrame: 360,
        endFrame: 540, // 12 - 18s
        activeStageId: "correction",
        assistantPrompt: "مكان البلاغ بالتفصيل وأقرب علامة مميزة؟",
        callerRawText: "في شارع اوراد قدام كنينة الحيونات في الجيزة",
        callerCorrectedText: "في شارع مراد قدام جنينة الحيوانات في الجيزة",
        changedTokens: [
          { raw: "اوراد", corrected: "مراد", reason: "phonetic_location" },
          { raw: "كنينة", corrected: "جنينة", reason: "dialect_word" },
        ],
        fieldKey: "incident_location",
        badgeVariant: "verified" as const,
        badgeLabel: "تم التدقيق الجغرافي",
        soundCue: "// SFX: geo_match_blip.wav",
      },
      {
        id: "beat_4_incident_type",
        startFrame: 540,
        endFrame: 760, // 18 - 25.3s
        activeStageId: "semantic",
        assistantPrompt: "إيه نوع البلاغ اللي حضرتك بتبلغ عنه؟",
        callerRawText: "الحقونا في مشغرة كبيرة وضرب بالأسلحة في الشارع!",
        correctorStatus: "تم الإبقاء لعدم التيقن التام (قاعدة منع اختلاق وقائع)",
        semanticMatchResult: "مشاجرة واعتداء في الطريق العام",
        resolvedCategory: "المشاجرات والاعتداءات",
        followUpPrompt: "هل توجد إصابات أو أسلحة نارية في موقع المشاجرة؟",
        badgeVariant: "verified" as const,
        badgeLabel: "تطابق دلالي مؤكد",
        soundCue: "// SFX: semantic_resolve_tone.wav -> transition_whoosh.wav",
      },
      {
        id: "beat_5_safety_review",
        startFrame: 760,
        endFrame: 990, // 25.3 - 33s
        activeStageId: "question_tree",
        assistantPrompt: "عفواً يا فندم، الرقم ناقص.. ممكن تمليني رقم الهاتف مرة تانية للتأكيد؟",
        suspiciousInput: "010-000-000", // 9 digits incomplete number
        validationFailureReason: "رقم هاتف غير مكتمل (9 أرقام بدلاً من 11) - رصد تلقائي",
        badgeVariant: "review" as const,
        badgeLabel: "يحتاج مراجعة بشرية",
        ruleEnforced: "المنظومة لا تُسقط المكالمة وتطلب الاستيضاح بلباقة",
        soundCue: "// SFX: amber_alert_chime.wav & operator_reassurance.wav",
      },
    ],
  },
  questionTree: {
    coreQuestions: [
      { id: "q1", order: 1, labelArabic: "الاسم بالكامل", promptArabic: "اسم حضرتك بالكامل يا فندم لإثبات البلاغ؟" },
      { id: "q2", order: 2, labelArabic: "رقم الهاتف", promptArabic: "رقم تليفون حضرتك للتواصل ومتابعة تحرك الدورية؟" },
      { id: "q3", order: 3, labelArabic: "الموقع المفصل", promptArabic: "مكان البلاغ بالتفصيل وأقرب علامة مميزة؟" },
      { id: "q4", order: 4, labelArabic: "نوع البلاغ", promptArabic: "إيه نوع الحادث اللي حضرتك بتبلغ عنه؟" },
    ],
    categories: [
      {
        id: "cat_roads",
        titleArabic: "الحوادث والطرق",
        scenarioCount: 5,
        scenarios: [
          "تصادم",
          "انقلاب سيارة",
          "عربية عطلانة",
          "سائق هارب",
          "قطع طريق",
        ],
      },
      {
        id: "cat_fights",
        titleArabic: "المشاجرات والاعتداءات",
        scenarioCount: 4,
        scenarios: [
          "مشاجرة",
          "مشاجرة جيران/محل",
          "اعتداء أسري",
          "إطلاق نار",
        ],
      },
      {
        id: "cat_fires",
        titleArabic: "الحرائق والإنقاذ",
        scenarioCount: 4,
        scenarios: [
          "حريق",
          "تسرب غاز",
          "محبوسين في أسانسير",
          "شخص محاصر",
        ],
      },
      {
        id: "cat_missing",
        titleArabic: "المفقودين والوفيات",
        scenarioCount: 3,
        scenarios: [
          "طفل مفقود",
          "شخص متغيب",
          "العثور على جثة",
        ],
      },
      {
        id: "cat_services",
        titleArabic: "الخدمات والمشكلات العامة",
        scenarioCount: 4,
        scenarios: [
          "انقطاع كهرباء",
          "سقوط شجرة",
          "تجمع مياه أمطار",
          "طلب إسعاف",
        ],
      },
    ],
    // Zoom focus scenarios with authentic follow-up questions
    zoomScenarios: [
      {
        id: "rollover",
        title: "انقلاب سيارة",
        category: "الحوادث والطرق",
        badge: "إسناد مروري وإسعاف عاجل",
        followUps: [
          {
            order: 1,
            question: "هل رصدت حضرتك أي مصابين محبوسين داخل السيارة ومش عارفين يخرجوا؟",
          },
          {
            order: 2,
            question: "هل موقع الحادث يشكل خطراً مباشراً على مسار باقي السيارات في الطريق؟",
          },
        ],
      },
      {
        id: "gas_leak",
        title: "تسرب غاز",
        category: "الحرائق والإنقاذ",
        badge: "طوارئ الغاز والحماية المدنية",
        followUps: [
          {
            order: 1,
            question: "الريحة واضحة لحضرتك في العمارة كلها ولا شقة معينة؟ وهل في حالات إغماء؟",
          },
          {
            order: 2,
            question: "برجاء الخروج لمكان آمن فوراً وعدم لمس مفاتيح الكهرباء أو أي مصدر نار نهائياً.",
          },
        ],
      },
    ],
  },
  trustAndSafetyPillars: [
    {
      id: "raw_preservation",
      titleArabic: "النص الأصلي والنص المصحح محفوظان معاً",
      descriptionArabic: "أرشفة فورية للنص الحرفي الخام المباشر إلى جانب النص المدقق، لضمان المطابقة الكاملة وسجل التدقيق.",
      badgeType: "verified",
      badgeText: "مطابقة تامة ومؤرشفة",
    },
    {
      id: "validation_guard",
      titleArabic: "أي تعديل مشبوه في الأرقام أو الطول يُحال لمراجعة بشرية",
      descriptionArabic: "محرك فحص آلي يرصد أي تباين في أرقام الهواتف أو زيادة/نقصان غير مبرر في النص، ويشعر المأمور فوراً.",
      badgeType: "review",
      badgeText: "يحتاج مراجعة بشرية",
    },
    {
      id: "prompt_isolation",
      titleArabic: "كلام المتصل بيانات فقط ولا يُنفَّذ كتعليمات",
      descriptionArabic: "عزل كامل لمدخلات المتصل داخل حاوية بيانات محكمة، مما يمنع أي محاولة للتأثير على النموذج أو توجيهه.",
      badgeType: "verified",
      badgeText: "عزل بياني معتمد",
    },
    {
      id: "fail_safe",
      titleArabic: "أي عطل في المصحح لا يوقف المكالمة",
      descriptionArabic: "في حال حدوث أي بطء أو تعثر في طبقة الذكاء الاصطناعي، تستمر المكالمة بالنص الخام دون أي انقطاع للمأمور.",
      badgeType: "verified",
      badgeText: "استقرار تشغيلي مستمر",
    },
  ],
  closing: {
    pilotTitle: "مرحلة تجريبية محدودة تحت إشراف الوزارة",
    pilotSubtitle: "مقترح تدشين تجريبي محكوم ومرحلي لدعم غرف عمليات شرطة النجدة (122)",
    stages: [
      {
        order: 1,
        title: "تجهيز",
        subtitle: "الربط التقني والتهيئة الآمنة",
        status: "مرحلة أولى",
      },
      {
        order: 2,
        title: "تشغيل تجريبي",
        subtitle: "تطبيق محدود تحت الإشراف المباشر",
        status: "مرحلة ثانية",
      },
      {
        order: 3,
        title: "تقييم",
        subtitle: "قياس الأداء والمراجعة الشاملة",
        status: "مرحلة ثالثة",
      },
    ],
    contact: {
      name: "CONTACT_NAME",
      email: "CONTACT_EMAIL",
      phone: "CONTACT_PHONE",
    },
    motto: "الشرطة في خدمة الشعب.. أمن واستقرار الوطن",
  },
  subtitles: [
    {
      id: "sub_1",
      startFrame: 15,
      endFrame: 135,
      arabicText: "فِي اللَّحَظَاتِ الحَرِجَةِ لِبَلَاغَاتِ النَّجْدَةِ..",
      sceneId: "problem",
    },
    {
      id: "sub_2",
      startFrame: 140,
      endFrame: 340,
      arabicText: "يَتَحَدَّثُ الموَاطِنُ تَحْتَ وَطْأَةِ الفَزَعِ وَاللَّهْجَةِ الدَّارِجَةِ وَضَجِيجِ الطَّرِيقِ، فَتَضِيعُ أَرْقَامٌ وَتَلْتَبِسُ مَوَاقِعُ حَيَوِيَّةٌ.",
      sceneId: "problem",
    },
    {
      id: "sub_3",
      startFrame: 375,
      endFrame: 800,
      arabicText: "المساعد الذكي لبلاغات طوارئ 122: ذَكَاءٌ اصْطِنَاعِيٌّ سِيَادِيٌّ يُعَزِّزُ مَأْمُورَ العَمَلِيَّاتِ، يَفْهَمُ اللَّهْجَةَ المِصْرِيَّةَ، وَيُوَثِّقُ أَدَقَّ تَفَاصِيلِ البَلَاغِ دُونَ خَطَأٍ أَوْ تَأْخِيرٍ.",
      sceneId: "solutionIntro",
    },
    {
      id: "sub_4",
      startFrame: 835,
      endFrame: 1040,
      arabicText: "بِمُجَرَّدِ اتِّصَالِ الموَاطِنِ، تُحَوِّلُ مَنْظُومَةُ التَّفْرِيغِ الصَّوْتِيِّ اللَّحْظِيِّ الكَلَامَ إِلَى نَصٍّ مُبَاشِرٍ.",
      sceneId: "liveDemo",
    },
    {
      id: "sub_5",
      startFrame: 1050,
      endFrame: 1290,
      arabicText: "يَتَدَخَّلُ المُصَحِّحُ اللُّغَوِيُّ الذَّكِيُّ لِضَبْطِ الأَخْطَاءِ الصَّوْتِيَّةِ دُونَ إِضَافَةِ أَيِّ وَقَائِعَ.",
      sceneId: "liveDemo",
    },
    {
      id: "sub_6",
      startFrame: 1300,
      endFrame: 1520,
      arabicText: "وَإِذَا شُوِّهَتِ الكَلِمَاتُ كَقَوْلِ المَتَّصِلِ «مَشْغَرَة»، يَتَعَرَّفُ المُطَابِقُ الدَّلَالِيُّ فَوْرًا عَلَى نَوْعِ الحَادِثِ كَـ «مُشَاجَرَة».",
      sceneId: "liveDemo",
    },
    {
      id: "sub_7",
      startFrame: 1530,
      endFrame: 1730,
      arabicText: "وَإِنْ غَمُضَ المَعْنَى، فَالـمَنْظُومَةُ لَا تُغْلِقُ الخَطَّ أَبَدًا، بَلْ تَسْتَوْضِحُ بِلَبَاقَةٍ لِإِتْمَامِ البَلَاغِ.",
      sceneId: "liveDemo",
    },
    {
      id: "sub_8",
      startFrame: 1795,
      endFrame: 2060,
      arabicText: "تَبْدَأُ كُلُّ مُكَالَمَةٍ بِأَرْبَعَةِ أَسْئِلَةٍ جَوْهَرِيَّةٍ: الاسْمُ، الهَاتِفُ، المَوْقِعُ المُفَصَّلُ، وَنَوْعُ البَلَاغِ.",
      sceneId: "questionTree",
    },
    {
      id: "sub_9",
      startFrame: 2070,
      endFrame: 2370,
      arabicText: "ثُمَّ تَنْطَلِقُ شَجَرَةُ اسْتِفْسَارَاتٍ مُنَظَّمَةٍ تُغَطِّي عِشْرِينَ سِينَارْيُو عَمَلَيَاتِيًّا تَتَوَزَّعُ عَبْرَ خَمْسَةِ مَحَاوِرَ رَئِيسِيَّةٍ.",
      sceneId: "questionTree",
    },
    {
      id: "sub_10",
      startFrame: 2415,
      endFrame: 2700,
      arabicText: "الأَمْنُ وَالشَّفَافِيَّةُ فِي صُلْبِ المَنْظُومَةِ: النَّصُّ الخَامُ يَظَلُّ مَحْفُوظًا، وَالتَّحَقُّقُ الآلِيُّ يَرْصُدُ أَيَّ تَغْيِيرٍ فِي الأَرْقَامِ.",
      sceneId: "trustAndSafety",
    },
    {
      id: "sub_11",
      startFrame: 2710,
      endFrame: 2995,
      arabicText: "عَزْلٌ تَامٌّ لِكَلَامِ المُتَّصِلِ يَمْنَعُ أَيَّ اخْتِرَاقٍ، وَمَأْمُورُ العَمَلِيَّاتِ هُوَ صَاحِبُ القَرَارِ دَائِمًا.",
      sceneId: "trustAndSafety",
    },
    {
      id: "sub_12",
      startFrame: 3035,
      endFrame: 3285,
      arabicText: "جَاهِزُونَ لِلتَّشْغِيلِ التَّجْرِيبِيِّ فِي غُرْفَةِ عَمَلِيَّاتِ شُرْطَةِ النَّجْدَةِ، لِخِدْمَةِ أَمْنِ الوَطَنِ وَحِمَايَةِ الموَاطِنِ.",
      sceneId: "closing",
    },
  ],
  lowerThirds: {
    problem: {
      tag: "الواقع العملياتي",
      title: "تحديات اللحظات الأولى في غرف طوارئ 122",
      subtitle: "ضغط المكالمات واللهجات والضوضاء المحيطة",
    },
    solutionIntro: {
      tag: "الحل التقني السيادي",
      title: "المساعد الذكي لغرف عمليات النجدة 122",
      subtitle: "تعزيز قدرات مأمور العمليات بمعالجة لحظية آمنة",
    },
    liveDemo: {
      tag: "معالجة مباشرة",
      title: "تكامل التفريغ الصوتي والمصحح اللغوي والمطابق الدلالي",
      subtitle: "تصحيح فوري للهجة دون اختلاق وقائع",
    },
    questionTree: {
      tag: "الهيكل العملياتي",
      title: "شجرة الأسئلة المنظمة: 20 سيناريو في 5 فئات",
      subtitle: "الأسئلة الأربعة الجوهرية والتفرع التخصصي",
    },
    trustAndSafety: {
      tag: "الحوكمة والأمان",
      title: "طبقات الحماية وسيادة القرار البشري",
      subtitle: "حفظ النص الخام وعزل المدخلات ضد الاختراق",
    },
    closing: {
      tag: "الخطوة التالية",
      title: "مقترح التشغيل التجريبي الميداني",
      subtitle: "منظومة وطنية متكاملة لغرف عمليات شرطة النجدة",
    },
  },
};
