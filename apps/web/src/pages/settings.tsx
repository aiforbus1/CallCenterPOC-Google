import React, { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { fetchWithAuth } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { 
  Server, 
  Mic, 
  Volume2, 
  MessageSquare, 
  CheckCircle, 
  AlertTriangle,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  RotateCcw,
  Sparkles,
  ListOrdered,
  Languages,
  Check,
  PhoneOff,
  Building2,
  Tag,
  PhoneForwarded,
  GitBranch,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  CornerDownRight,
  Sliders,
  Cpu,
  Clock,
  Zap
} from "lucide-react";

interface AnswerActionRule {
  action_type: string; // 'outbound_call' | 'categorize' | 'assign_department'
  target_value?: string;
  department_name?: string;
  department_phone?: string;
}

interface AnswerOptionItem {
  id: string;
  label: string;
  english_label?: string;
  keywords: string[];
  category?: string;
  department_id?: string;
  actions: AnswerActionRule[];
  sub_questions?: QuestionItem[];
}

interface QuestionItem {
  id: string;
  order: number;
  text: string;
  english_text?: string;
  field_key?: string;
  is_required: boolean;
  acknowledgment_prefix?: string;
  english_acknowledgment_prefix?: string;
  options: AnswerOptionItem[];
}

interface DepartmentItem {
  id: string;
  name: string;
  phone_number: string;
  description?: string;
}

interface CategoryItem {
  id: string;
  name: string;
  default_priority: string;
  department_id?: string;
}

const DEFAULT_GREETING = "شرطة النجدة 122 معاك يا فندم، اتفضل إيه البلاغ أو المشكلة؟";
const DEFAULT_ACKNOWLEDGMENT = "تمام يا فندم، اطمن.";
const DEFAULT_CLARIFICATION = "معلش يا فندم، الصوت مكنش واضح عندي خالص. ممكن تعيد عليا تاني بعد إذنك؟";
const DEFAULT_HANGUP_REASSURANCE = "تحت أمرك يا فندم، اطمن الدورية في طريقها لموقع البلاغ فوراً، وخليك في مكان آمن.";
const DEFAULT_CLOSING = "اطمن يا فندم، تم إخطار أقرب دورية أمنية وقسم الشرطة المختص بالتحرك فوراً لموقع البلاغ. خليك في مكان آمن، ومعاك شرطة النجدة.";

const DEFAULT_ENGLISH_GREETING = "Egyptian Police Emergency Hotline 122. Please state your emergency?";
const DEFAULT_ENGLISH_ACKNOWLEDGMENT = "Understood, stay calm.";
const DEFAULT_ENGLISH_CLARIFICATION = "I am sorry, the audio was not clear. Could you please repeat?";
const DEFAULT_ENGLISH_HANGUP_REASSURANCE = "You are in good hands. The police patrol is en route immediately. Stay safe!";
const DEFAULT_ENGLISH_CLOSING = "All your emergency report details have been dispatched to the nearest police patrol unit. Stay in a safe place, emergency services are en route!";

const DEFAULT_DEPARTMENTS: DepartmentItem[] = [
  {
    id: "dept_122_ops",
    name: "غرفة عمليات النجدة الرئيسية",
    phone_number: "122",
    description: "غرفة عمليات النجدة المركزية لتوجيه الدوريات الأمنية وبلاغات الاستغاثة العاجلة",
  },
  {
    id: "dept_cid",
    name: "المباحث الجنائية وقسم الشرطة المختص",
    phone_number: "+201220000001",
    description: "مباحث القسم للتحقيق في جرائم السرقة، المشاجرات، التعدي، وضبط الجناة",
  },
  {
    id: "dept_traffic",
    name: "الإدارة العامة للمرور",
    phone_number: "136",
    description: "عمليات المرور لحوادث التصادم، إعاقة الطرق، وتسيير المحاور المرورية",
  },
  {
    id: "dept_civil_defense",
    name: "الحماية المدنية والمطافئ",
    phone_number: "180",
    description: "سيارات الإطفاء والإنقاذ البري لحالات الحرائق، انهيار العقارات، وتسرب الغاز",
  },
  {
    id: "dept_ambulance",
    name: "هيئة الإسعاف المصرية",
    phone_number: "123",
    description: "التنسيق الفوري لإرسال سيارات الإسعاف لنقل المصابين والحالات الحرجة",
  },
];

const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: "cat_urgent_distress",
    name: "استغاثة عاجلة / تهديد حياة",
    default_priority: "urgent",
    department_id: "dept_122_ops",
  },
  {
    id: "cat_brawl_assault",
    name: "مشاجرة / اعتداء / إطلاق نار",
    default_priority: "urgent",
    department_id: "dept_cid",
  },
  {
    id: "cat_traffic_accident",
    name: "حادث مروري / تصادم",
    default_priority: "high",
    department_id: "dept_traffic",
  },
  {
    id: "cat_theft",
    name: "سرقة / سطو / اقتحام",
    default_priority: "high",
    department_id: "dept_cid",
  },
  {
    id: "cat_fire_rescue",
    name: "حريق / انهيار / كارثة",
    default_priority: "urgent",
    department_id: "dept_civil_defense",
  },
  {
    id: "cat_general_report",
    name: "بلاغ عام / اشتباه / إزعاج",
    default_priority: "normal",
    department_id: "dept_122_ops",
  },
];

const DEFAULT_QUESTIONS: QuestionItem[] = [
  {
    id: "q1",
    order: 1,
    text: "اسم حضرتك بالكامل يا فندم لإثبات البلاغ؟",
    english_text: "What is your full name, sir, to register the emergency report?",
    field_key: "caller_name",
    is_required: true,
    options: [],
  },
  {
    id: "q2",
    order: 2,
    text: "رقم تليفون حضرتك للتواصل ومتابعة تحرك الدورية الأمنية؟",
    english_text: "What is your contact phone number to follow up on the dispatched police patrol?",
    field_key: "phone_number",
    is_required: true,
    options: [],
  },
  {
    id: "q3",
    order: 3,
    text: "مكان البلاغ فين بالتفصيل يا فندم؟ المحافظة، المنطقة، والشارع أو أقرب علامة مميزة؟",
    english_text: "What is the exact location of the incident, sir? Governorate, district, street, or nearest landmark?",
    field_key: "incident_location",
    is_required: true,
    options: [],
  },
  {
    id: "q4",
    order: 4,
    text: "إيه نوع البلاغ أو الحادث اللي حضرتك بتبلغ عنه؟ مشاجرة، سرقة، حادث تصادم، حريق، ولا استغاثة؟",
    english_text: "What is the nature of the emergency you are reporting? Brawl, theft, traffic accident, fire, or urgent life distress?",
    field_key: "incident_type",
    is_required: true,
    options: [
      {
        id: "opt_brawl",
        label: "مشاجرة أو اعتداء",
        english_label: "Brawl or physical assault",
        keywords: ["مشاجرة", "خناقة", "اعتداء", "ضرب", "سلاح", "خرطوش", "بلطجة", "brawl", "fight", "assault"],
        category: "مشاجرة / اعتداء / إطلاق نار",
        department_id: "dept_cid",
        actions: [
          { action_type: "categorize", target_value: "مشاجرة / اعتداء / إطلاق نار" },
          { action_type: "assign_department", department_name: "المباحث الجنائية وقسم الشرطة المختص", department_phone: "+201220000001" },
          { action_type: "outbound_call", department_name: "المباحث الجنائية وقسم الشرطة المختص", department_phone: "+201220000001", target_value: "+201220000001" },
        ],
        sub_questions: [
          {
            id: "sq_weapons",
            order: 1,
            text: "هل في أسلحة مستخدمة في المشاجرة؟ وهل في حد مصاب؟",
            english_text: "Are there weapons involved in the fight, and is anyone injured?",
            field_key: "weapons_involved",
            is_required: true,
            options: [],
          }
        ],
      },
      {
        id: "opt_accident",
        label: "حادث تصادم مروري",
        english_label: "Traffic accident or collision",
        keywords: ["حادث", "حادثة", "تصادم", "عربية خبطت", "موتوسيكل", "انقلاب", "accident", "crash", "collision"],
        category: "حادث مروري / تصادم",
        department_id: "dept_traffic",
        actions: [
          { action_type: "categorize", target_value: "حادث مروري / تصادم" },
          { action_type: "assign_department", department_name: "الإدارة العامة للمرور", department_phone: "136" },
          { action_type: "outbound_call", department_name: "الإدارة العامة للمرور", department_phone: "136", target_value: "136" },
        ],
        sub_questions: [
          {
            id: "sq_injuries",
            order: 1,
            text: "هل الحادث أسفر عن أي إصابات؟ وهل الطريق واقف ومحتاج إسعاف وونش مرور؟",
            english_text: "Did the collision result in injuries, and is the road blocked requiring ambulance and towing?",
            field_key: "injuries_and_traffic",
            is_required: true,
            options: [],
          }
        ],
      },
      {
        id: "opt_theft",
        label: "سرقة أو سطو",
        english_label: "Theft or burglary",
        keywords: ["سرقة", "مسروق", "اتسرق", "حرامي", "سطو", "نشل", "اقتحام", "theft", "stolen", "robbery", "burglary"],
        category: "سرقة / سطو / اقتحام",
        department_id: "dept_cid",
        actions: [
          { action_type: "categorize", target_value: "سرقة / سطو / اقتحام" },
          { action_type: "assign_department", department_name: "المباحث الجنائية وقسم الشرطة المختص", department_phone: "+201220000001" },
          { action_type: "outbound_call", department_name: "المباحث الجنائية وقسم الشرطة المختص", department_phone: "+201220000001", target_value: "+201220000001" },
        ],
        sub_questions: [
          {
            id: "sq_suspect",
            order: 1,
            text: "هل الجاني أو الحرامي لسه متواجد في المكان ولا هرب؟ ومعاك أي مواصفات ليه؟",
            english_text: "Is the suspect still at the location or fled, and do you have any description of them?",
            field_key: "suspect_status",
            is_required: false,
            options: [],
          }
        ],
      },
      {
        id: "opt_fire",
        label: "حريق أو انهيار أو كارثة",
        english_label: "Fire outbreak, collapse or disaster",
        keywords: ["حريق", "نار", "دخان", "حريقة", "تسرب غاز", "انهيار", "fire", "collapse", "gas leak"],
        category: "حريق / انهيار / كارثة",
        department_id: "dept_civil_defense",
        actions: [
          { action_type: "categorize", target_value: "حريق / انهيار / كارثة" },
          { action_type: "assign_department", department_name: "الحماية المدنية والمطافئ", department_phone: "180" },
          { action_type: "outbound_call", department_name: "الحماية المدنية والمطافئ", department_phone: "180", target_value: "180" },
        ],
        sub_questions: [
          {
            id: "sq_trapped",
            order: 1,
            text: "هل في ناس محتجزين داخل العقار أو المكان لا قدر الله؟",
            english_text: "Are there any people trapped inside the building or location?",
            field_key: "trapped_persons",
            is_required: true,
            options: [],
          }
        ],
      },
      {
        id: "opt_urgent",
        label: "استغاثة عاجلة أو تهديد حياة",
        english_label: "Urgent distress or life threat",
        keywords: ["الحقوني", "استغاثة", "خطر", "بيموت", "تهديد", "انقذوني", "قتل", "help", "emergency", "urgent", "danger"],
        category: "استغاثة عاجلة / تهديد حياة",
        department_id: "dept_122_ops",
        actions: [
          { action_type: "categorize", target_value: "استغاثة عاجلة / تهديد حياة" },
          { action_type: "assign_department", department_name: "غرفة عمليات النجدة الرئيسية", department_phone: "122" },
          { action_type: "outbound_call", department_name: "غرفة عمليات النجدة الرئيسية", department_phone: "122", target_value: "122" },
        ],
        sub_questions: [
          {
            id: "sq_safety",
            order: 1,
            text: "هل حضرتك في مكان آمن حالياً؟ وأقرب شخص أو نقطة يقدر يوصلك فيها؟",
            english_text: "Are you currently in a safe place, and what is the nearest point the police patrol can reach you?",
            field_key: "immediate_danger",
            is_required: true,
            options: [],
          }
        ],
      },
    ],
  },
];

// Recursive helper to sanitize/normalize question trees
function normalizeQuestions(qs: any[]): QuestionItem[] {
  if (!Array.isArray(qs)) return [];
  return qs.map((q, idx) => ({
    id: q.id || `q_${Date.now()}_${idx}`,
    order: q.order || idx + 1,
    text: q.text || "",
    english_text: q.english_text || "",
    field_key: q.field_key || `field_${idx + 1}`,
    is_required: q.is_required ?? true,
    acknowledgment_prefix: q.acknowledgment_prefix || "",
    english_acknowledgment_prefix: q.english_acknowledgment_prefix || "",
    options: Array.isArray(q.options)
      ? q.options.map((opt: any, oIdx: number) => ({
          id: opt.id || `opt_${Date.now()}_${oIdx}`,
          label: opt.label || "",
          english_label: opt.english_label || "",
          keywords: Array.isArray(opt.keywords)
            ? opt.keywords
            : typeof opt.keywords === "string"
              ? opt.keywords.split(",").map((k: string) => k.trim()).filter(Boolean)
              : [],
          category: opt.category || "",
          department_id: opt.department_id || "",
          actions: Array.isArray(opt.actions) ? opt.actions : [],
          sub_questions: normalizeQuestions(opt.sub_questions || []),
        }))
      : [],
  }));
}

// Recursive helper to serialize question tree for API payload
function serializeQuestions(qs: QuestionItem[]): any[] {
  return qs.map((q, idx) => ({
    id: q.id || `q_${idx + 1}`,
    order: idx + 1,
    text: q.text.trim(),
    english_text: q.english_text?.trim() || null,
    field_key: q.field_key || `field_${idx + 1}`,
    is_required: q.is_required ?? true,
    acknowledgment_prefix: q.acknowledgment_prefix?.trim() || null,
    english_acknowledgment_prefix: q.english_acknowledgment_prefix?.trim() || null,
    options: (q.options || []).map((opt) => ({
      id: opt.id,
      label: opt.label.trim(),
      english_label: opt.english_label?.trim() || null,
      keywords: Array.isArray(opt.keywords)
        ? opt.keywords.map(k => k.trim()).filter(Boolean)
        : typeof opt.keywords === "string"
          ? (opt.keywords as string).split(",").map(k => k.trim()).filter(Boolean)
          : [],
      category: opt.category || null,
      department_id: opt.department_id || null,
      actions: opt.actions || [],
      sub_questions: serializeQuestions(opt.sub_questions || []),
    })),
  }));
}

// Recursive component to render a Question Editor at any nested depth
interface RecursiveQuestionEditorProps {
  question: QuestionItem;
  idx: number;
  depth: number;
  departments: DepartmentItem[];
  categories: CategoryItem[];
  onUpdate: (updatedQuestion: QuestionItem) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

function RecursiveQuestionEditor({
  question,
  idx,
  depth,
  departments,
  categories,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: RecursiveQuestionEditorProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(depth === 0 && (question.options?.length > 0));
  const optionsCount = (question.options || []).length;

  const handleTextChange = (text: string) => {
    onUpdate({ ...question, text });
  };

  const handleFieldKeyChange = (field_key: string) => {
    onUpdate({ ...question, field_key });
  };

  const handleAddOption = () => {
    const newOptId = `opt_${Date.now()}`;
    const newOptions: AnswerOptionItem[] = [
      ...(question.options || []),
      {
        id: newOptId,
        label: "",
        keywords: [],
        category: categories[0]?.name || "",
        department_id: departments[0]?.id || "",
        actions: [
          { action_type: "categorize", target_value: categories[0]?.name || "" },
          { action_type: "assign_department", department_name: departments[0]?.name || "", department_phone: departments[0]?.phone_number || "" },
        ],
        sub_questions: [],
      },
    ];
    onUpdate({ ...question, options: newOptions });
    setIsExpanded(true);
  };

  const handleRemoveOption = (optIdx: number) => {
    const newOptions = question.options.filter((_, i) => i !== optIdx);
    onUpdate({ ...question, options: newOptions });
  };

  const handleOptionChange = (optIdx: number, field: string, value: any) => {
    const newOptions = [...question.options];
    newOptions[optIdx] = { ...newOptions[optIdx], [field]: value };
    onUpdate({ ...question, options: newOptions });
  };

  const handleToggleOutbound = (optIdx: number) => {
    const opt = question.options[optIdx];
    const dept = departments.find(d => d.id === opt.department_id) || departments[0];
    const currentActions = [...(opt.actions || [])];
    const hasOutbound = currentActions.some(a => a.action_type === "outbound_call");

    let updatedActions: AnswerActionRule[];
    if (hasOutbound) {
      updatedActions = currentActions.filter(a => a.action_type !== "outbound_call");
    } else {
      updatedActions = [
        ...currentActions,
        {
          action_type: "outbound_call",
          department_name: dept?.name || "",
          department_phone: dept?.phone_number || "",
          target_value: dept?.phone_number || "",
        },
      ];
    }
    handleOptionChange(optIdx, "actions", updatedActions);
  };

  // Sub-question management inside an option
  const handleAddSubQuestion = (optIdx: number) => {
    const opt = question.options[optIdx];
    const currentSubQs = opt.sub_questions || [];
    const nextOrder = currentSubQs.length + 1;
    const newSubQ: QuestionItem = {
      id: `sq_${Date.now()}`,
      order: nextOrder,
      text: "",
      english_text: "",
      field_key: `sub_field_${nextOrder}`,
      is_required: false,
      options: [],
    };
    const updatedSubQs = [...currentSubQs, newSubQ];
    handleOptionChange(optIdx, "sub_questions", updatedSubQs);
  };

  const handleUpdateSubQuestion = (optIdx: number, subQIdx: number, updatedSubQ: QuestionItem) => {
    const opt = question.options[optIdx];
    const updatedSubQs = [...(opt.sub_questions || [])];
    updatedSubQs[subQIdx] = updatedSubQ;
    handleOptionChange(optIdx, "sub_questions", updatedSubQs);
  };

  const handleRemoveSubQuestion = (optIdx: number, subQIdx: number) => {
    const opt = question.options[optIdx];
    const updatedSubQs = (opt.sub_questions || []).filter((_, i) => i !== subQIdx);
    const reordered = updatedSubQs.map((sq, i) => ({ ...sq, order: i + 1 }));
    handleOptionChange(optIdx, "sub_questions", reordered);
  };

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all shadow-xs ${
        depth === 0
          ? "border-slate-200 bg-slate-50 hover:border-indigo-300"
          : "border-indigo-200 bg-indigo-50/20"
      }`}
    >
      {/* Header Row */}
      <div className="p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center justify-center rounded-full text-white font-bold text-xs shadow-sm ${
              depth === 0 ? "w-7 h-7 bg-indigo-600" : "w-6 h-6 bg-purple-600 text-[11px]"
            }`}
          >
            {depth === 0 ? `#${question.order}` : `↳${question.order}`}
          </span>
          {depth === 0 && (
            <div className="flex flex-row sm:flex-col gap-0.5">
              <button
                type="button"
                onClick={onMoveUp}
                disabled={!canMoveUp}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 text-slate-600"
                title="تحريك لأعلى"
              >
                <ArrowUp className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={!canMoveDown}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 text-slate-600"
                title="تحريك لأسفل"
              >
                <ArrowDown className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Question Text (Arabic & English) */}
        <div className="flex-1 space-y-1.5">
          <input
            type="text"
            dir="rtl"
            value={question.text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={
              depth === 0
                ? `اكتب السؤال رقم ${question.order} بالعربية...`
                : `اكتب السؤال الفرعي بالعربية...`
            }
            className="w-full text-sm font-semibold border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            dir="ltr"
            value={question.english_text || ""}
            onChange={(e) => onUpdate({ ...question, english_text: e.target.value })}
            placeholder={
              depth === 0
                ? `Question #${question.order} text in English...`
                : `Sub-question text in English...`
            }
            className="w-full text-xs font-medium border border-slate-200 rounded-lg px-3 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 text-slate-700"
          />
        </div>

        {/* Field Key & Optional Acknowledgment Prefixes */}
        <div className="w-full sm:w-52 space-y-1.5">
          <input
            type="text"
            value={question.field_key || ""}
            onChange={(e) => handleFieldKeyChange(e.target.value)}
            placeholder="field_key"
            className="w-full text-xs font-mono border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50/50"
            title="Field Key for Database Extraction"
          />
          {question.order > 1 && (
            <div className="flex gap-1">
              <input
                type="text"
                dir="rtl"
                value={question.acknowledgment_prefix || ""}
                onChange={(e) => onUpdate({ ...question, acknowledgment_prefix: e.target.value })}
                placeholder="تطمين عربي..."
                title="عبارة تطمين بالعربية خاصة بهذا السؤال"
                className="w-1/2 text-[11px] border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-700"
              />
              <input
                type="text"
                dir="ltr"
                value={question.english_acknowledgment_prefix || ""}
                onChange={(e) => onUpdate({ ...question, english_acknowledgment_prefix: e.target.value })}
                placeholder="English ack..."
                title="Reassurance phrase in English for this question"
                className="w-1/2 text-[11px] border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-700"
              />
            </div>
          )}
        </div>

        {/* Toggle Options Drawer */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-colors ${
            optionsCount > 0
              ? "border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <GitBranch className="h-3.5 w-3.5 text-indigo-600" />
          <span>خيارات الإجابة ({optionsCount})</span>
          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {/* Remove */}
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
          title="حذف هذا السؤال"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Answer Options & Action Drawer */}
      {isExpanded && (
        <div className="p-4 bg-indigo-50/20 space-y-3.5 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900">
              <GitBranch className="h-4 w-4 text-indigo-600" />
              <span>خيارات الإجابات وقواعد التوجيه والأسئلة المتفرعة (Options & Branching)</span>
            </div>
            <button
              type="button"
              onClick={handleAddOption}
              className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 shadow-xs flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> إضافة خيار إجابة
            </button>
          </div>

          {(!question.options || question.options.length === 0) ? (
            <div className="text-center py-4 text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
              لم تتم إضافة خيارات محددة بعد. أضف خيار إجابة لربطه بتصنيف أو قسم أو سؤال فرعي متفرع.
            </div>
          ) : (
            <div className="space-y-4">
              {question.options.map((opt, optIdx) => {
                const hasOutbound = opt.actions?.some(a => a.action_type === "outbound_call");
                const kwStr = Array.isArray(opt.keywords) ? opt.keywords.join(", ") : (opt.keywords || "");
                const subQuestionsCount = (opt.sub_questions || []).length;

                return (
                  <div
                    key={opt.id || optIdx}
                    className="p-3.5 bg-white border border-indigo-100 rounded-xl shadow-xs space-y-3"
                  >
                    {/* Option Label (Arabic & English) and Keywords */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <div className="flex-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                          <span>اسم خيار الإجابة بالعربية (Arabic Label)</span>
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          value={opt.label}
                          onChange={(e) => handleOptionChange(optIdx, "label", e.target.value)}
                          placeholder="مثال: حادث تصادم مروري..."
                          className="w-full text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                          <span>Option Label (English)</span>
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={opt.english_label || ""}
                          onChange={(e) => handleOptionChange(optIdx, "english_label", e.target.value)}
                          placeholder="e.g. Traffic accident collision..."
                          className="w-full text-xs font-medium px-2.5 py-1.5 border border-slate-300 rounded"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">
                          الكلمات الدالة للمطابقة (Keywords - Arabic & English)
                        </label>
                        <input
                          type="text"
                          value={kwStr}
                          onChange={(e) => {
                            const raw = e.target.value;
                            handleOptionChange(optIdx, "keywords", raw.split(",").map(k => k.trim()));
                          }}
                          placeholder="حادث, تصادم, accident, crash..."
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveOption(optIdx)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded self-end sm:self-center"
                        title="حذف هذا الخيار"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Actions & Routing Row */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
                      {/* Categorize Action */}
                      <div className="flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-purple-600" />
                        <span className="font-semibold text-slate-600">التصنيف:</span>
                        <select
                          value={opt.category || ""}
                          onChange={(e) => {
                            const catVal = e.target.value;
                            handleOptionChange(optIdx, "category", catVal);
                            const currentActs = (opt.actions || []).filter(a => a.action_type !== "categorize");
                            if (catVal) currentActs.push({ action_type: "categorize", target_value: catVal });
                            handleOptionChange(optIdx, "actions", currentActs);
                          }}
                          className="text-xs px-2 py-1 border border-slate-300 rounded bg-white"
                        >
                          <option value="">(بدون تصنيف)</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Department Routing Action */}
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                        <span className="font-semibold text-slate-600">القسم الداخلي:</span>
                        <select
                          value={opt.department_id || ""}
                          onChange={(e) => {
                            const dId = e.target.value;
                            const dept = departments.find(d => d.id === dId);
                            handleOptionChange(optIdx, "department_id", dId);
                            const currentActs = (opt.actions || []).filter(a => a.action_type !== "assign_department");
                            if (dept) {
                              currentActs.push({
                                action_type: "assign_department",
                                department_name: dept.name,
                                department_phone: dept.phone_number,
                              });
                            }
                            handleOptionChange(optIdx, "actions", currentActs);
                          }}
                          className="text-xs px-2 py-1 border border-slate-300 rounded bg-white"
                        >
                          <option value="">(بدون إحالة لقسم)</option>
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name} ({d.phone_number})</option>
                          ))}
                        </select>
                      </div>

                      {/* Outbound Call Trigger */}
                      <button
                        type="button"
                        onClick={() => handleToggleOutbound(optIdx)}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
                          hasOutbound
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <PhoneForwarded className="h-3.5 w-3.5 text-emerald-600" />
                        {hasOutbound ? "اتصال خارجي تلقائي: مفعل" : "اتصال خارجي للقسم (Outbound Call)"}
                      </button>

                      {/* Add Recursive Sub-Question Button */}
                      <button
                        type="button"
                        onClick={() => handleAddSubQuestion(optIdx)}
                        className="px-2.5 py-1 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold text-xs flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <CornerDownRight className="h-3.5 w-3.5 text-purple-600" />
                        <span>إضافة سؤال متفرع لهذا الخيار ({subQuestionsCount})</span>
                      </button>
                    </div>

                    {/* Nested Sub-Questions Tree (Recursive rendering!) */}
                    {opt.sub_questions && opt.sub_questions.length > 0 && (
                      <div className="mt-3 p-3 bg-purple-50/40 border border-purple-100 rounded-xl space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-purple-900 border-b border-purple-100 pb-2">
                          <CornerDownRight className="h-4 w-4 text-purple-600" />
                          <span>أسئلة المتابعة المتفرعة عند اختيار: "{opt.label || 'هذا الخيار'}"</span>
                        </div>

                        <div className="space-y-3 pr-2 border-r-2 border-purple-300">
                          {opt.sub_questions.map((subQ, sqIdx) => (
                            <RecursiveQuestionEditor
                              key={subQ.id || sqIdx}
                              question={subQ}
                              idx={sqIdx}
                              depth={depth + 1}
                              departments={departments}
                              categories={categories}
                              onUpdate={(updated) => handleUpdateSubQuestion(optIdx, sqIdx, updated)}
                              onRemove={() => handleRemoveSubQuestion(optIdx, sqIdx)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { t, isArabic, dir } = useLanguage();
  const [health, setHealth] = useState<any>(null);
  const [providers, setProviders] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Agent Script & Sentences Configuration State (Arabic)
  const [arabicGreeting, setArabicGreeting] = useState<string>(DEFAULT_GREETING);
  const [acknowledgmentMessage, setAcknowledgmentMessage] = useState<string>(DEFAULT_ACKNOWLEDGMENT);
  const [clarificationMessage, setClarificationMessage] = useState<string>(DEFAULT_CLARIFICATION);
  const [hangupReassuranceMessage, setHangupReassuranceMessage] = useState<string>(DEFAULT_HANGUP_REASSURANCE);
  const [closingMessage, setClosingMessage] = useState<string>(DEFAULT_CLOSING);

  // Agent Script & Sentences Configuration State (English)
  const [englishGreeting, setEnglishGreeting] = useState<string>(DEFAULT_ENGLISH_GREETING);
  const [englishAcknowledgmentMessage, setEnglishAcknowledgmentMessage] = useState<string>(DEFAULT_ENGLISH_ACKNOWLEDGMENT);
  const [englishClarificationMessage, setEnglishClarificationMessage] = useState<string>(DEFAULT_ENGLISH_CLARIFICATION);
  const [englishHangupReassuranceMessage, setEnglishHangupReassuranceMessage] = useState<string>(DEFAULT_ENGLISH_HANGUP_REASSURANCE);
  const [englishClosingMessage, setEnglishClosingMessage] = useState<string>(DEFAULT_ENGLISH_CLOSING);

  const [sentencesTab, setSentencesTab] = useState<"ar" | "en">("ar");

  const [questions, setQuestions] = useState<QuestionItem[]>(DEFAULT_QUESTIONS);
  const [ttsVoice, setTtsVoice] = useState<string>("Aoede");
  const [departments, setDepartments] = useState<DepartmentItem[]>(DEFAULT_DEPARTMENTS);
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);

  // AI Models & VAD Configuration State
  const [vadSilenceTimeout, setVadSilenceTimeout] = useState<number>(1.8);
  const [chatModel, setChatModel] = useState<string>("google/gemma-4-26b-a4b-it");
  const [sttModel, setSttModel] = useState<string>("openai/whisper-large-v3");

  const [testingVoice, setTestingVoice] = useState<boolean>(false);
  const [playingSentenceKey, setPlayingSentenceKey] = useState<string | null>(null);
  const [savingScript, setSavingScript] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [hRes, pRes, agentRes] = await Promise.all([
          fetchWithAuth("/health").catch(() => null),
          fetchWithAuth("/health/providers").catch(() => null),
          fetchWithAuth("/settings/agent").catch(() => null),
        ]);
        setHealth(hRes);
        setProviders(pRes?.providers || null);

        if (agentRes) {
          if (agentRes.arabic_greeting) setArabicGreeting(agentRes.arabic_greeting);
          if (agentRes.acknowledgment_message) setAcknowledgmentMessage(agentRes.acknowledgment_message);
          if (agentRes.clarification_message) setClarificationMessage(agentRes.clarification_message);
          if (agentRes.hangup_reassurance_message) setHangupReassuranceMessage(agentRes.hangup_reassurance_message);
          if (agentRes.closing_message) setClosingMessage(agentRes.closing_message);

          if (agentRes.english_greeting) setEnglishGreeting(agentRes.english_greeting);
          if (agentRes.english_acknowledgment_message) setEnglishAcknowledgmentMessage(agentRes.english_acknowledgment_message);
          if (agentRes.english_clarification_message) setEnglishClarificationMessage(agentRes.english_clarification_message);
          if (agentRes.english_hangup_reassurance_message) setEnglishHangupReassuranceMessage(agentRes.english_hangup_reassurance_message);
          if (agentRes.english_closing_message) setEnglishClosingMessage(agentRes.english_closing_message);

          if (agentRes.tts_voice) setTtsVoice(agentRes.tts_voice);
          if (agentRes.vad_silence_timeout_seconds !== undefined && agentRes.vad_silence_timeout_seconds !== null) {
            setVadSilenceTimeout(Number(agentRes.vad_silence_timeout_seconds));
          }
          if (agentRes.chat_model) setChatModel(agentRes.chat_model);
          if (agentRes.stt_model) setSttModel(agentRes.stt_model);
          if (Array.isArray(agentRes.departments) && agentRes.departments.length > 0) {
            setDepartments(agentRes.departments);
          }
          if (Array.isArray(agentRes.categories) && agentRes.categories.length > 0) {
            setCategories(agentRes.categories);
          }
          if (Array.isArray(agentRes.questions) && agentRes.questions.length > 0) {
            const sorted = [...agentRes.questions].sort((a, b) => a.order - b.order);
            setQuestions(normalizeQuestions(sorted));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handlePlaySample = async (key: string, textToPlay: string) => {
    if (!textToPlay || !textToPlay.trim()) return;
    setPlayingSentenceKey(key);
    try {
      const res = await fetchWithAuth("/settings/test-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToPlay.trim(),
          voice: ttsVoice,
        }),
      });
      if (res && res.audio_base64) {
        const audio = new Audio("data:audio/wav;base64," + res.audio_base64);
        await audio.play();
      }
    } catch (err: any) {
      alert("خطأ في تشغيل تجربة الصوت: " + (err.message || err));
    } finally {
      setPlayingSentenceKey(null);
    }
  };

  const handleTestVoice = async () => {
    await handlePlaySample("greeting", arabicGreeting);
  };

  // Top-level question handlers
  const handleAddQuestion = () => {
    const newId = `q_${Date.now()}`;
    const nextOrder = questions.length + 1;
    setQuestions([
      ...questions,
      {
        id: newId,
        order: nextOrder,
        text: "",
        english_text: "",
        field_key: `field_${nextOrder}`,
        is_required: true,
        options: [],
      },
    ]);
  };

  const handleUpdateTopQuestion = (index: number, updated: QuestionItem) => {
    const list = [...questions];
    list[index] = updated;
    setQuestions(list);
  };

  const handleRemoveTopQuestion = (index: number) => {
    const updated = questions.filter((_, idx) => idx !== index);
    const reordered = updated.map((q, idx) => ({ ...q, order: idx + 1 }));
    setQuestions(reordered);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const items = [...questions];
    const temp = items[index - 1];
    items[index - 1] = items[index];
    items[index] = temp;
    const reordered = items.map((q, idx) => ({ ...q, order: idx + 1 }));
    setQuestions(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (index === questions.length - 1) return;
    const items = [...questions];
    const temp = items[index + 1];
    items[index + 1] = items[index];
    items[index] = temp;
    const reordered = items.map((q, idx) => ({ ...q, order: idx + 1 }));
    setQuestions(reordered);
  };

  // Department Management
  const handleAddDepartment = () => {
    const newId = `dept_${Date.now()}`;
    setDepartments([
      ...departments,
      {
        id: newId,
        name: "",
        phone_number: "",
        description: "",
      },
    ]);
  };

  const handleRemoveDepartment = (index: number) => {
    setDepartments(departments.filter((_, idx) => idx !== index));
  };

  const handleDepartmentChange = (index: number, field: string, val: string) => {
    const list = [...departments];
    list[index] = { ...list[index], [field]: val };
    setDepartments(list);
  };

  // Category Management
  const handleAddCategory = () => {
    const newId = `cat_${Date.now()}`;
    setCategories([
      ...categories,
      {
        id: newId,
        name: "",
        default_priority: "normal",
        department_id: departments[0]?.id || "",
      },
    ]);
  };

  const handleRemoveCategory = (index: number) => {
    setCategories(categories.filter((_, idx) => idx !== index));
  };

  const handleCategoryChange = (index: number, field: string, val: string) => {
    const list = [...categories];
    list[index] = { ...list[index], [field]: val };
    setCategories(list);
  };

  const handleResetDefaults = () => {
    if (confirm(isArabic ? "هل ترغب في استعادة الإعدادات وعبارات المكالمة الافتراضية كاملة؟" : "Do you want to reset all call settings and sentences to defaults?")) {
      setArabicGreeting(DEFAULT_GREETING);
      setAcknowledgmentMessage(DEFAULT_ACKNOWLEDGMENT);
      setClarificationMessage(DEFAULT_CLARIFICATION);
      setHangupReassuranceMessage(DEFAULT_HANGUP_REASSURANCE);
      setClosingMessage(DEFAULT_CLOSING);

      setEnglishGreeting(DEFAULT_ENGLISH_GREETING);
      setEnglishAcknowledgmentMessage(DEFAULT_ENGLISH_ACKNOWLEDGMENT);
      setEnglishClarificationMessage(DEFAULT_ENGLISH_CLARIFICATION);
      setEnglishHangupReassuranceMessage(DEFAULT_ENGLISH_HANGUP_REASSURANCE);
      setEnglishClosingMessage(DEFAULT_ENGLISH_CLOSING);

      setQuestions(DEFAULT_QUESTIONS);
      setDepartments(DEFAULT_DEPARTMENTS);
      setCategories(DEFAULT_CATEGORIES);
      setVadSilenceTimeout(1.8);
      setChatModel("google/gemma-4-26b-a4b-it");
      setSttModel("openai/whisper-large-v3");
    }
  };

  const handleSaveScript = async () => {
    setSavingScript(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      if (!arabicGreeting.trim()) {
        throw new Error(isArabic ? "يرجى كتابة رسالة الترحيب الافتتاحية بالعربية" : "Please enter the Arabic opening greeting");
      }
      if (!acknowledgmentMessage.trim()) {
        throw new Error(isArabic ? "يرجى كتابة عبارة الاستلام والتطمين بالعربية" : "Please enter the Arabic acknowledgment phrase");
      }
      if (!closingMessage.trim()) {
        throw new Error(isArabic ? "يرجى كتابة رسالة التأكيد والختام بالعربية" : "Please enter the Arabic closing phrase");
      }
      for (const q of questions) {
        if (!q.text.trim()) {
          throw new Error(isArabic ? `يرجى كتابة نص السؤال رقم ${q.order}` : `Please enter text for question #${q.order}`);
        }
      }

      const payload = {
        arabic_greeting: arabicGreeting.trim(),
        acknowledgment_message: acknowledgmentMessage.trim(),
        clarification_message: clarificationMessage.trim(),
        hangup_reassurance_message: hangupReassuranceMessage.trim(),
        closing_message: closingMessage.trim(),
        english_greeting: englishGreeting.trim(),
        english_acknowledgment_message: englishAcknowledgmentMessage.trim(),
        english_clarification_message: englishClarificationMessage.trim(),
        english_hangup_reassurance_message: englishHangupReassuranceMessage.trim(),
        english_closing_message: englishClosingMessage.trim(),
        questions: serializeQuestions(questions),
        tts_voice: ttsVoice,
        vad_silence_timeout_seconds: Number(vadSilenceTimeout) || 1.8,
        chat_model: chatModel,
        stt_model: sttModel,
        departments: departments.filter(d => d.name.trim()),
        categories: categories.filter(c => c.name.trim()),
        is_active: true,
      };

      const res = await fetchWithAuth("/settings/agent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err: any) {
      setSaveError(err.message || "حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setSavingScript(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-5xl pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{t("settings_main_title")}</h3>
            <p className="text-sm text-slate-500">
              {t("settings_main_subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="#ai-models-vad-section"
              className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title={isArabic ? "الانتقال المباشر لإعدادات النماذج و VAD" : "Jump to AI Models & VAD Settings"}
            >
              <Cpu className="h-3.5 w-3.5 text-blue-600" />
              <span>{isArabic ? "إعدادات النماذج و VAD ⚡" : "AI Models & VAD ⚡"}</span>
            </a>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
              title={t("btn_reset_defaults")}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("btn_reset_defaults")}
            </button>

            <button
              type="button"
              onClick={handleSaveScript}
              disabled={savingScript}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              {savingScript ? t("btn_saving") : t("btn_save")}
            </button>
          </div>
        </div>

        {/* Feedback Banners */}
        {saveSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>تم حفظ خيارات الإجابات المتفرعة شجرياً وتصنيف الفئات والأقسام بنجاح!</span>
          </div>
        )}

        {saveError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span>{saveError}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* Section 1: Predefined Departments & Predefined Categories */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Internal Departments Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-700">
                <Building2 className="h-5 w-5" />
                <h4 className="font-bold text-sm text-slate-900">{t("settings_departments_title")}</h4>
              </div>
              <button
                type="button"
                onClick={handleAddDepartment}
                className="px-2.5 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> {t("btn_add_department")}
              </button>
            </div>

            <div className="space-y-3">
              {departments.map((dept, dIdx) => (
                <div key={dept.id || dIdx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      dir="rtl"
                      value={dept.name}
                      onChange={(e) => handleDepartmentChange(dIdx, "name", e.target.value)}
                      placeholder="اسم القسم (مثال: الدعم الفني)"
                      className="flex-1 text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                    />
                    <input
                      type="text"
                      value={dept.phone_number}
                      onChange={(e) => handleDepartmentChange(dIdx, "phone_number", e.target.value)}
                      placeholder="رقم الهاتف الداخلي (+201...)"
                      className="w-36 text-xs font-mono px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveDepartment(dIdx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="حذف القسم"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    dir="rtl"
                    value={dept.description || ""}
                    onChange={(e) => handleDepartmentChange(dIdx, "description", e.target.value)}
                    placeholder="وصف مهام القسم واختصاصه..."
                    className="w-full text-[11px] text-slate-600 px-2.5 py-1 border border-slate-200 rounded bg-white"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Predefined Categories Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-purple-700">
                <Tag className="h-5 w-5" />
                <h4 className="font-bold text-sm text-slate-900">{t("settings_categories_title")}</h4>
              </div>
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-2.5 py-1 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> {t("btn_add_category")}
              </button>
            </div>

            <div className="space-y-3">
              {categories.map((cat, cIdx) => (
                <div key={cat.id || cIdx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2">
                  <input
                    type="text"
                    dir="rtl"
                    value={cat.name}
                    onChange={(e) => handleCategoryChange(cIdx, "name", e.target.value)}
                    placeholder="اسم الفئة (مثال: شكوى فنية)"
                    className="flex-1 text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                  <select
                    value={cat.default_priority}
                    onChange={(e) => handleCategoryChange(cIdx, "default_priority", e.target.value)}
                    className="text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
                  >
                    <option value="low">Low Priority</option>
                    <option value="normal">Normal</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(cIdx)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                    title="حذف الفئة"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Section 2: AI Agent Flow & Recursive Branching Questions */}
        {/* ============================================================ */}
        <div className="bg-white border-2 border-indigo-100 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  {t("settings_script_title")}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t("settings_script_subtitle")}
                </p>
              </div>
            </div>

            {/* Voice Select */}
            <div className="flex items-center gap-2">
              <select
                value={ttsVoice}
                onChange={(e) => setTtsVoice(e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-700 shadow-sm"
              >
                <option value="Aoede">Aoede (Gemini Neural - أنثى واضحة جداً)</option>
                <option value="Kore">Kore (أنثى - هادئ)</option>
                <option value="Charon">Charon (ذكر - صوت عميق)</option>
                <option value="Fenrir">Fenrir (ذكر - رسمي)</option>
                <option value="Zephyr">Zephyr (أنثى - سريع)</option>
              </select>

              <button
                type="button"
                onClick={handleTestVoice}
                disabled={testingVoice}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg flex items-center gap-1 shadow-sm transition-all"
              >
                <Volume2 className="h-3.5 w-3.5 text-indigo-600" />
                {testingVoice ? "جاري التوليد..." : "استمع للصوت"}
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* Sub-section: Call Sentences & Dialogue Phrases               */}
          {/* ============================================================ */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-3">
              <div>
                <h5 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Languages className="h-4 w-4 text-indigo-600" />
                  {t("settings_sentences_title")}
                </h5>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t("settings_sentences_subtitle")}
                </p>
              </div>

              {/* Bilingual Tab Switcher for Sentences */}
              <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSentencesTab("ar")}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    sentencesTab === "ar"
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t("tab_arabic_sentences")}
                </button>
                <button
                  type="button"
                  onClick={() => setSentencesTab("en")}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    sentencesTab === "en"
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t("tab_english_sentences")}
                </button>
              </div>
            </div>

            {/* Arabic Sentences Tab */}
            {sentencesTab === "ar" && (
              <div className="grid grid-cols-1 gap-4" dir="rtl">
                {/* Sentence 1: Opening Greeting */}
                <div className="space-y-1.5 bg-white p-3.5 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold">1</span>
                      {t("s1_greeting")}
                    </label>
                    <button
                      type="button"
                      onClick={() => handlePlaySample("greeting_ar", arabicGreeting)}
                      disabled={playingSentenceKey === "greeting_ar"}
                      className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md flex items-center gap-1 transition-colors"
                    >
                      <Volume2 className="h-3 w-3" />
                      {playingSentenceKey === "greeting_ar" ? t("btn_playing") : t("btn_listen")}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">{t("s1_greeting_desc")}</p>
                  <textarea
                    dir="rtl"
                    rows={2}
                    value={arabicGreeting}
                    onChange={(e) => setArabicGreeting(e.target.value)}
                    placeholder="مثال: شرطة النجدة 122 معاك يا فندم، اتفضل إيه البلاغ أو المشكلة؟"
                    className="w-full text-xs font-medium border border-slate-300 rounded-md p-2.5 bg-slate-50/40 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Sentence 2: Transition & Acknowledgment / Reassurance */}
                <div className="space-y-1.5 bg-white p-3.5 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[11px] font-bold">2</span>
                      {t("s2_ack")}
                    </label>
                    <button
                      type="button"
                      onClick={() => handlePlaySample("ack_ar", acknowledgmentMessage)}
                      disabled={playingSentenceKey === "ack_ar"}
                      className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md flex items-center gap-1 transition-colors"
                    >
                      <Volume2 className="h-3 w-3" />
                      {playingSentenceKey === "ack_ar" ? t("btn_playing") : t("btn_listen")}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">{t("s2_ack_desc")}</p>
                  <input
                    type="text"
                    dir="rtl"
                    value={acknowledgmentMessage}
                    onChange={(e) => setAcknowledgmentMessage(e.target.value)}
                    placeholder="مثال: تمام يا فندم، اطمن."
                    className="w-full text-xs font-medium border border-slate-300 rounded-md px-3 py-2 bg-slate-50/40 focus:bg-white focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Sentence 3: Clarification / Unclear Audio */}
                <div className="space-y-1.5 bg-white p-3.5 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[11px] font-bold">3</span>
                      {t("s3_clarify")}
                    </label>
                    <button
                      type="button"
                      onClick={() => handlePlaySample("clarify_ar", clarificationMessage)}
                      disabled={playingSentenceKey === "clarify_ar"}
                      className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md flex items-center gap-1 transition-colors"
                    >
                      <Volume2 className="h-3 w-3" />
                      {playingSentenceKey === "clarify_ar" ? t("btn_playing") : t("btn_listen")}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">{t("s3_clarify_desc")}</p>
                  <input
                    type="text"
                    dir="rtl"
                    value={clarificationMessage}
                    onChange={(e) => setClarificationMessage(e.target.value)}
                    placeholder="مثال: معلش يا فندم، الصوت مكنش واضح عندي خالص. ممكن تعيد عليا تاني بعد إذنك؟"
                    className="w-full text-xs font-medium border border-slate-300 rounded-md px-3 py-2 bg-slate-50/40 focus:bg-white focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {/* Sentence 4: Early Exit / Rush Reassurance */}
                <div className="space-y-1.5 bg-white p-3.5 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">4</span>
                      {t("s4_hangup")}
                    </label>
                    <button
                      type="button"
                      onClick={() => handlePlaySample("hangup_ar", hangupReassuranceMessage)}
                      disabled={playingSentenceKey === "hangup_ar"}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md flex items-center gap-1 transition-colors"
                    >
                      <Volume2 className="h-3 w-3" />
                      {playingSentenceKey === "hangup_ar" ? t("btn_playing") : t("btn_listen")}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">{t("s4_hangup_desc")}</p>
                  <input
                    type="text"
                    dir="rtl"
                    value={hangupReassuranceMessage}
                    onChange={(e) => setHangupReassuranceMessage(e.target.value)}
                    placeholder="مثال: تحت أمرك يا فندم، اطمن الدورية في طريقها لموقع البلاغ فوراً، وخليك في مكان آمن."
                    className="w-full text-xs font-medium border border-slate-300 rounded-md px-3 py-2 bg-slate-50/40 focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Sentence 5: Closing & Patrol Dispatch Confirmation */}
                <div className="space-y-1.5 bg-white p-3.5 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-bold">5</span>
                      {t("s5_closing")}
                    </label>
                    <button
                      type="button"
                      onClick={() => handlePlaySample("closing_ar", closingMessage)}
                      disabled={playingSentenceKey === "closing_ar"}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md flex items-center gap-1 transition-colors"
                    >
                      <Volume2 className="h-3 w-3" />
                      {playingSentenceKey === "closing_ar" ? t("btn_playing") : t("btn_listen")}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">{t("s5_closing_desc")}</p>
                  <textarea
                    dir="rtl"
                    rows={2}
                    value={closingMessage}
                    onChange={(e) => setClosingMessage(e.target.value)}
                    placeholder="مثال: اطمن يا فندم، تم إخطار أقرب دورية أمنية وقسم الشرطة المختص بالتحرك فوراً لموقع البلاغ..."
                    className="w-full text-xs font-medium border border-slate-300 rounded-md p-2.5 bg-slate-50/40 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* English Sentences Tab */}
            {sentencesTab === "en" && (
              <div className="grid grid-cols-1 gap-4" dir="ltr">
                {/* English Sentence 1: Opening Greeting */}
                <div className="space-y-1.5 bg-white p-3.5 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold">1</span>
                      {t("en_s1_greeting")}
                    </label>
                    <button
                      type="button"
                      onClick={() => handlePlaySample("greeting_en", englishGreeting)}
                      disabled={playingSentenceKey === "greeting_en"}
                      className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md flex items-center gap-1 transition-colors"
                    >
                      <Volume2 className="h-3 w-3" />
                      {playingSentenceKey === "greeting_en" ? t("btn_playing") : t("btn_listen")}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">{t("en_s1_greeting_desc")}</p>
                  <textarea
                    rows={2}
                    value={englishGreeting}
                    onChange={(e) => setEnglishGreeting(e.target.value)}
                    placeholder="e.g. Egyptian Police Emergency Hotline 122. Please state your emergency?"
                    className="w-full text-xs font-medium border border-slate-300 rounded-md p-2.5 bg-slate-50/40 focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* English Sentence 2: Transition & Acknowledgment */}
                <div className="space-y-1.5 bg-white p-3.5 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[11px] font-bold">2</span>
                      {t("en_s2_ack")}
                    </label>
                    <button
                      type="button"
                      onClick={() => handlePlaySample("ack_en", englishAcknowledgmentMessage)}
                      disabled={playingSentenceKey === "ack_en"}
                      className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md flex items-center gap-1 transition-colors"
                    >
                      <Volume2 className="h-3 w-3" />
                      {playingSentenceKey === "ack_en" ? t("btn_playing") : t("btn_listen")}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">{t("en_s2_ack_desc")}</p>
                  <input
                    type="text"
                    value={englishAcknowledgmentMessage}
                    onChange={(e) => setEnglishAcknowledgmentMessage(e.target.value)}
                    placeholder="e.g. Understood, stay calm."
                    className="w-full text-xs font-medium border border-slate-300 rounded-md px-3 py-2 bg-slate-50/40 focus:bg-white focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* English Sentence 3: Clarification */}
                <div className="space-y-1.5 bg-white p-3.5 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[11px] font-bold">3</span>
                      {t("en_s3_clarify")}
                    </label>
                    <button
                      type="button"
                      onClick={() => handlePlaySample("clarify_en", englishClarificationMessage)}
                      disabled={playingSentenceKey === "clarify_en"}
                      className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md flex items-center gap-1 transition-colors"
                    >
                      <Volume2 className="h-3 w-3" />
                      {playingSentenceKey === "clarify_en" ? t("btn_playing") : t("btn_listen")}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">{t("en_s3_clarify_desc")}</p>
                  <input
                    type="text"
                    value={englishClarificationMessage}
                    onChange={(e) => setEnglishClarificationMessage(e.target.value)}
                    placeholder="e.g. I am sorry, the audio was not clear. Could you please repeat?"
                    className="w-full text-xs font-medium border border-slate-300 rounded-md px-3 py-2 bg-slate-50/40 focus:bg-white focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {/* English Sentence 4: Rush / Early Exit Reassurance */}
                <div className="space-y-1.5 bg-white p-3.5 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">4</span>
                      {t("en_s4_hangup")}
                    </label>
                    <button
                      type="button"
                      onClick={() => handlePlaySample("hangup_en", englishHangupReassuranceMessage)}
                      disabled={playingSentenceKey === "hangup_en"}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md flex items-center gap-1 transition-colors"
                    >
                      <Volume2 className="h-3 w-3" />
                      {playingSentenceKey === "hangup_en" ? t("btn_playing") : t("btn_listen")}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">{t("en_s4_hangup_desc")}</p>
                  <input
                    type="text"
                    value={englishHangupReassuranceMessage}
                    onChange={(e) => setEnglishHangupReassuranceMessage(e.target.value)}
                    placeholder="e.g. You are in good hands. The police patrol is en route immediately. Stay safe!"
                    className="w-full text-xs font-medium border border-slate-300 rounded-md px-3 py-2 bg-slate-50/40 focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* English Sentence 5: Closing Dispatch Confirmation */}
                <div className="space-y-1.5 bg-white p-3.5 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-bold">5</span>
                      {t("en_s5_closing")}
                    </label>
                    <button
                      type="button"
                      onClick={() => handlePlaySample("closing_en", englishClosingMessage)}
                      disabled={playingSentenceKey === "closing_en"}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md flex items-center gap-1 transition-colors"
                    >
                      <Volume2 className="h-3 w-3" />
                      {playingSentenceKey === "closing_en" ? t("btn_playing") : t("btn_listen")}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">{t("en_s5_closing_desc")}</p>
                  <textarea
                    rows={2}
                    value={englishClosingMessage}
                    onChange={(e) => setEnglishClosingMessage(e.target.value)}
                    placeholder="e.g. All your emergency report details have been dispatched to the nearest police patrol unit. Stay in a safe place, emergency services are en route!"
                    className="w-full text-xs font-medium border border-slate-300 rounded-md p-2.5 bg-slate-50/40 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Questions Tree & Sub-Questions */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ListOrdered className="h-4 w-4 text-indigo-600" />
                  قائمة الأسئلة وخيارات الإجابات المتفرعة شجرياً (Recursive Branching Questions)
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  الأسئلة التي يطرحها المساعد تباعاً مع إمكانية إضافة أسئلة فرعية متفرعة لكل خيار إجابة بشكل تكراري شجري
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> إضافة سؤال رئيسي جديد
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <RecursiveQuestionEditor
                  key={q.id || idx}
                  question={q}
                  idx={idx}
                  depth={0}
                  departments={departments}
                  categories={categories}
                  onUpdate={(updated) => handleUpdateTopQuestion(idx, updated)}
                  onRemove={() => handleRemoveTopQuestion(idx)}
                  onMoveUp={() => handleMoveUp(idx)}
                  onMoveDown={() => handleMoveDown(idx)}
                  canMoveUp={idx > 0}
                  canMoveDown={idx < questions.length - 1}
                />
              ))}

              {questions.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                  لا توجد أسئلة مضافة بعد. اضغط على "إضافة سؤال رئيسي جديد" للبدء.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Section 3: AI Models & Voice Activity Detection (VAD) Config */}
        {/* ============================================================ */}
        <div id="ai-models-vad-section" className="bg-white border-2 border-slate-200 rounded-xl p-6 shadow-sm space-y-6 scroll-mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <Cpu className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  {isArabic ? "إعدادات نماذج الذكاء الاصطناعي وكشف نشاط الصوت (VAD)" : "AI Models & Voice Activity Detection (VAD) Settings"}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isArabic 
                    ? "تخصيص نماذج Whisper لتحويل الصوت، ونماذج Gemini للمحادثة، وتوقيت سكتات المتصل (VAD) بدقة"
                    : "Configure Whisper STT, Conversation LLM, and Voice Activity Detection silence duration"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle className="h-3.5 w-3.5" />
                {isArabic ? "OpenRouter متصل ونشط" : "OpenRouter Connected"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 1. Speech-to-Text Whisper Model */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-blue-600">
                  <div className="flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    <span className="font-bold text-xs uppercase tracking-wide">
                      {isArabic ? "تحويل الصوت لنص (Whisper STT)" : "Speech-to-Text (STT)"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    OpenAI Whisper
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  {isArabic 
                    ? "النموذج المسؤول عن تفريغ كلام المتصلين باللهجة المصرية بدقة عالية"
                    : "Model responsible for transcribing Egyptian Arabic speech with high accuracy"}
                </p>

                <div className="pt-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {isArabic ? "اختر إصدار نموذج Whisper:" : "Select Whisper Model:"}
                  </label>
                  <select
                    value={sttModel}
                    onChange={(e) => setSttModel(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="openai/whisper-large-v3">
                      Whisper Large V3 (أعلى دقة وموصى به للتفريغ الدقيق)
                    </option>
                    <option value="openai/whisper-large-v3-turbo">
                      Whisper Large V3 Turbo (فائق السرعة)
                    </option>
                    <option value="openai/whisper-large">
                      Whisper Large (الإصدار القياسي v2)
                    </option>
                    <option value="openai/whisper-small">
                      Whisper Small (خفيف جداً وأقل استهلاكاً للبيانات)
                    </option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>Model ID:</span>
                <code className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-[10px] text-blue-700">
                  {sttModel}
                </code>
              </div>
            </div>

            {/* 2. Conversation & Decision LLM Model */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-purple-600">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    <span className="font-bold text-xs uppercase tracking-wide">
                      {isArabic ? "نموذج المحادثة والذكاء الاصطناعي (LLM)" : "Dialogue & Branching LLM"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                    Google Gemini
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  {isArabic 
                    ? "النموذج الذي يدير حوار النجدة، وفهم الاستجابات، والتنقل في الأسئلة الشجرية"
                    : "Directs conversation flow, extracts emergency fields, and traverses branching tree"}
                </p>

                <div className="pt-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {isArabic ? "اختر نموذج المحادثة الذكي:" : "Select Chat LLM Model:"}
                  </label>
                  <select
                    value={chatModel}
                    onChange={(e) => setChatModel(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="google/gemma-4-26b-a4b-it">
                      Google Gemma 4 26B A4B IT (الافتراضي - فائق الذكاء وموصى به)
                    </option>
                    <option value="google/gemini-2.5-flash">
                      Gemini 2.5 Flash (سريع وفائق الفهم للمصري)
                    </option>
                    <option value="google/gemini-2.0-flash">
                      Gemini 2.0 Flash (الجيل الثاني المتوازن)
                    </option>
                    <option value="google/gemini-2.0-flash-lite-001">
                      Gemini 2.0 Flash Lite (أسرع زمن استجابة)
                    </option>
                    <option value="anthropic/claude-3.5-haiku">
                      Claude 3.5 Haiku (دقة لغوية فائقة)
                    </option>
                    <option value="meta-llama/llama-3.3-70b-instruct">
                      Meta Llama 3.3 70B Instruct (مفتوح المصدر)
                    </option>
                    <option value="openai/gpt-4o-mini">
                      OpenAI GPT-4o Mini (سريع وذكي)
                    </option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>Model ID:</span>
                <code className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-[10px] text-purple-700">
                  {chatModel}
                </code>
              </div>
            </div>

            {/* 3. VAD Silence Timeout Settings */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-amber-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span className="font-bold text-xs uppercase tracking-wide">
                      {isArabic ? "زمن سكوت المتصل (VAD Silence)" : "VAD Silence Timeout"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    Voice Activity
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  {isArabic 
                    ? "مدة التوقف عن الكلام المطلوبة لاعتبار انتهاء الجملة وبدء الرد الآلي"
                    : "Silence pause threshold required after speech before AI triggers response turn"}
                </p>

                {/* Range Slider & Value */}
                <div className="pt-1 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">
                      {isArabic ? "المدة المحددة (تصل حتى 60 ثانية):" : "Selected Duration (up to 60s):"}
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0.5"
                        max="60.0"
                        step="0.5"
                        value={vadSilenceTimeout}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) setVadSilenceTimeout(Math.min(60.0, Math.max(0.5, val)));
                        }}
                        className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold text-amber-800 bg-amber-50 border border-amber-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono text-xs">
                        {Number(vadSilenceTimeout).toFixed(1)} {isArabic ? "ثانية" : "sec"} ({Math.round(Number(vadSilenceTimeout) * 1000)} ms)
                      </span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0.5"
                    max="60.0"
                    step="0.5"
                    value={vadSilenceTimeout}
                    onChange={(e) => setVadSilenceTimeout(parseFloat(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                  />

                  {/* Preset quick buttons up to 60 seconds */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
                    {[
                      { val: 1.0, labelAr: "1.0s سريع", labelEn: "1.0s Fast" },
                      { val: 1.8, labelAr: "1.8s متوازن", labelEn: "1.8s Balanced" },
                      { val: 3.0, labelAr: "3.0s متمهل", labelEn: "3.0s Patient" },
                      { val: 10.0, labelAr: "10s ممتد", labelEn: "10s Extended" },
                      { val: 30.0, labelAr: "30s طويل", labelEn: "30s Long" },
                      { val: 60.0, labelAr: "60s أقصى مدة", labelEn: "60s Max" },
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => setVadSilenceTimeout(preset.val)}
                        className={`py-1 px-1 text-[11px] rounded font-medium border text-center transition-colors ${
                          Math.abs(vadSilenceTimeout - preset.val) < 0.1
                            ? "bg-amber-600 text-white border-amber-600 shadow-xs font-bold"
                            : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {isArabic ? preset.labelAr : preset.labelEn}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>{isArabic ? "الذاكرة التراكمية:" : "Audio Buffer:"}</span>
                <span className="text-[10px] text-slate-600 font-medium">
                  {Math.round(Number(vadSilenceTimeout) / 0.02)} chunks (20ms/chunk)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
