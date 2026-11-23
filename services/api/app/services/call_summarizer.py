"""
Call Summarizer and Structured Data Extractor with Intelligent Action Dispatching.

Processes call transcripts to generate 2-sentence executive summaries,
structured CallExtraction records with customer intent, priority,
category classification, department routing, and optional automated outbound calls.
Supports live OpenRouter Gemini models and intelligent fallback.
"""
import logging
import json
import re
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.call import Call, Transcript, CallExtraction
from app.models.customer import Customer
from app.services.agent_settings_service import get_cached_agent_settings
from app.providers.conversation.openrouter_chat import OpenRouterChatProvider
from app.providers.conversation.base import ConversationMessage
from app.core.config import settings

logger = logging.getLogger(__name__)


EMERGENCY_INCIDENT_KEYWORDS = {
    "حادث", "حادثة", "تصادم", "عربية", "سيارة", "انقلاب", "طريق", "خبطت", "موتوسيكل",
    "مشاجرة", "خناقة", "اعتداء", "ضرب", "سلاح", "خرطوش", "بلطجة", "طوشة", "معركة",
    "سرقة", "مسروق", "اتسرق", "سرق", "حرامي", "سطو", "نشل", "اقتحام",
    "حريق", "نار", "دخان", "حريقة", "تسرب", "غاز", "انهيار", "انفجار",
    "الحقوني", "استغاثة", "خطر", "بيموت", "تهديد", "انقذوني", "قتل", "مقتول", "جثة",
    "إسعاف", "اسعاف", "مصاب", "نزيف", "نجدة",
    "accident", "crash", "collision", "fight", "brawl", "assault", "weapon",
    "theft", "stolen", "robbery", "fire", "smoke", "kill", "help", "emergency",
}


def _extract_caller_speech(transcript_text: str) -> str:
    """
    Extract all speech belonging exclusively to the caller/reporter,
    ignoring assistant prompts and questions.
    """
    if not transcript_text:
        return ""
    lines = transcript_text.strip().splitlines()
    caller_parts: List[str] = []
    has_explicit_labels = False

    caller_prefixes = (
        "caller:", "user:", "المتصل:", "العميل:", "المبلّغ:", "المبلغ:",
    )
    assistant_prefixes = (
        "ai assistant:", "assistant:", "agent:", "bot:", "المساعد:", "شرطة النجدة:", "شرطة النجدة 122:",
    )

    is_caller_active = False

    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue
        lower_line = line_clean.lower()

        matched_caller_prefix = None
        for p in caller_prefixes:
            if lower_line.startswith(p):
                matched_caller_prefix = p
                break

        matched_assistant_prefix = None
        for ap in assistant_prefixes:
            if lower_line.startswith(ap):
                matched_assistant_prefix = ap
                break

        if matched_caller_prefix:
            has_explicit_labels = True
            is_caller_active = True
            content = line_clean[len(matched_caller_prefix):].strip()
            if content:
                caller_parts.append(content)
        elif matched_assistant_prefix:
            has_explicit_labels = True
            is_caller_active = False
        elif is_caller_active:
            caller_parts.append(line_clean)

    if has_explicit_labels:
        return " ".join(caller_parts).strip()

    return transcript_text.strip()


def _is_abandoned_or_empty_call(transcript_text: str) -> bool:
    """
    Determines if a call was abandoned, silent, or disconnected immediately after greeting,
    meaning the caller hung up without reporting an emergency or incident.
    """
    if not transcript_text or not transcript_text.strip():
        return True

    caller_speech = _extract_caller_speech(transcript_text).strip()
    if not caller_speech:
        # Caller never spoke any turns (only AI greeting was recorded)
        return True

    cleaned = re.sub(r"[^\w\s\u0600-\u06FF]", " ", caller_speech.lower()).strip()
    tokens = [t for t in cleaned.split() if t]

    # If caller used any substantive emergency keyword, it's NOT an abandoned call
    for kw in EMERGENCY_INCIDENT_KEYWORDS:
        if kw in cleaned:
            return False

    # If caller only spoke minimal filler/greetings (e.g. 'الو', 'سلام عليكم', 'مين معايا')
    # with 4 or fewer tokens and length <= 25 characters without incident keywords:
    if len(tokens) <= 4 or len(cleaned) <= 25:
        return True

    return False


def _extract_intent_and_summary_fallback(transcript_text: str, language: str = "ar-EG") -> Dict[str, Any]:
    """Contextual rule-based extractor for instant summaries when LLM is unavailable."""
    has_arabic = (language or "ar").startswith("ar") or any("\u0600" <= c <= "\u06FF" for c in transcript_text)

    # 1. Immediate honest handling of abandoned / disconnected calls
    if _is_abandoned_or_empty_call(transcript_text):
        if has_arabic:
            summary = "اتصال وارد لشرطة النجدة 122 أُغلق فوراً بعد رسالة الترحيب دون أن يدلي المتصل بأي تفاصيل أو بلاغ. لم يتم تسجيل أي حادث أو استدعاء دوريات."
            intent = "مكالمة مقطوعة / لم يتم الرد بعد الترحيب"
            action = "لا يوجد إجراء مطلوب (مكالمة منقطعة بعد الترحيب)"
        else:
            summary = "Inbound call to 122 Police Hotline disconnected immediately after greeting without caller providing details or report. No incident logged or patrol dispatched."
            intent = "Disconnected / No response after greeting"
            action = "No action required (disconnected call)"

        return {
            "summary": summary,
            "intent": intent,
            "customer_name": None,
            "callback_number": None,
            "priority": "low",
            "category": None,
            "assigned_department": None,
            "department_phone": None,
            "requested_action": action,
            "follow_up_required": False,
            "extracted_fields": {},
        }

    # 2. Check keywords strictly in caller speech (not assistant questions)
    caller_speech = _extract_caller_speech(transcript_text)
    text_lower = (caller_speech if caller_speech else transcript_text).lower()

    if has_arabic:
        if any(w in text_lower for w in ["مشاجرة", "خناقة", "اعتداء", "ضرب", "سلاح", "خرطوش", "بلطجة"]):
            intent = "إبلاغ عن مشاجرة واعتداء"
            summary = "اتصال طارئ للإبلاغ عن وقوع مشاجرة وتعدي. تم توجيه أقرب دورية أمنية ومباحث القسم المختص فوراً لفض المشاجرة وضبط أطرافها."
            priority = "urgent"
            category = "مشاجرة / اعتداء / إطلاق نار"
            assigned_dept = "المباحث الجنائية وقسم الشرطة المختص"
            dept_phone = "+201220000001"
            action = "توجيه دورية المباحث الجنائية وقسم الشرطة فوراً لموقع المشاجرة."
        elif any(w in text_lower for w in ["حادث", "حادثة", "تصادم", "عربية خبطت", "موتوسيكل", "انقلاب", "طريق"]):
            intent = "إبلاغ عن حادث سير وتصادم"
            summary = "إخطار عن وقوع حادث تصادم مروري. تم إبلاغ غرفة عمليات المرور للدفع بونش لفتح الطريق والتنسيق مع الإسعاف."
            priority = "high"
            category = "حادث مروري / تصادم"
            assigned_dept = "الإدارة العامة للمرور"
            dept_phone = "136"
            action = "إخطار الإدارة العامة للمرور وسيارة الإسعاف لتأمين الحادث ورفع آثار التصادم."
        elif any(w in text_lower for w in ["سرقة", "مسروق", "اتسرق", "حرامي", "سطو", "نشل", "اقتحام"]):
            intent = "إبلاغ عن جريمة سرقة أو سطو"
            summary = "بلاغ عن واقعة سرقة. تم تسجيل بيانات المبلّغ والموقع وإحالة البلاغ لمباحث القسم لاتخاذ الإجراءات الجنائية."
            priority = "high"
            category = "سرقة / سطو / اقتحام"
            assigned_dept = "المباحث الجنائية وقسم الشرطة المختص"
            dept_phone = "+201220000001"
            action = "إخطار مباحث القسم لمعاينة مكان السرقة وتفريغ الكاميرات وتتبع المشتبه بهم."
        elif any(w in text_lower for w in ["حريق", "نار", "دخان", "حريقة", "تسرب غاز", "انهيار"]):
            intent = "إبلاغ عن حريق أو انهيار"
            summary = "استغاثة عاجلة تفيد بنشوب حريق أو خطر داهم. تم إخطار الحماية المدنية وسيارات الإطفاء للتحرك الفوري لموقع الحادث."
            priority = "urgent"
            category = "حريق / انهيار / كارثة"
            assigned_dept = "الحماية المدنية والمطافئ"
            dept_phone = "180"
            action = "توجيه سيارات الإطفاء والإنقاذ بالحماية المدنية فوراً مع إخطار الإسعاف."
        elif any(w in text_lower for w in ["الحقوني", "استغاثة", "خطر", "بيموت", "تهديد", "انقذوني", "قتل"]):
            intent = "استغاثة عاجلة وتهديد حياة"
            summary = "استغاثة طارئة من مواطن تفيد بوجود تهديد مباشر أو خطر على الحياة. تم توجيه أقرب دورية نجدة مسلحة لموقع البلاغ فوراً."
            priority = "urgent"
            category = "استغاثة عاجلة / تهديد حياة"
            assigned_dept = "غرفة عمليات النجدة الرئيسية"
            dept_phone = "122"
            action = "توجيه أقرب دورية أمنية لموقع الاستغاثة فوراً والتواصل هاتفياً مع المبلّغ لتأمينه."
        else:
            if caller_speech:
                clean_preview = caller_speech[:60].strip()
                intent = "بلاغ غير مكتمل / انقطاع المكالمة"
                summary = f"المتصل تواصل مع شرطة النجدة 122 وذكر ({clean_preview})، ولكن المكالمة انتهت قبل استكمال تفاصيل البلاغ أو تحديد نوع الحادث. لم يتم توجيه دوريات."
                action = "متابعة الاتصال بالرقم إذا لزم الأمر للتحقق من سلامة المبلّغ."
            else:
                intent = "بلاغ عام لشرطة النجدة 122"
                summary = "مكالمة واردة لشرطة النجدة 122 تم إغلاقها دون تسجيل تفاصيل البلاغ."
                action = "لا يوجد إجراء مطلوب."
            priority = "low"
            category = None
            assigned_dept = None
            dept_phone = None
    else:
        if any(w in text_lower for w in ["brawl", "fight", "assault", "weapon"]):
            intent = "Assault / Brawl Report"
            summary = "Emergency call reporting an ongoing fight or assault. Nearest police patrol unit was dispatched to the scene."
            priority = "urgent"
            category = "مشاجرة / اعتداء / إطلاق نار"
            assigned_dept = "المباحث الجنائية وقسم الشرطة المختص"
            dept_phone = "+201220000001"
            action = "Dispatch police patrol and notify local CID precinct."
        elif any(w in text_lower for w in ["accident", "crash", "collision"]):
            intent = "Traffic Accident Report"
            summary = "Report of a vehicle collision on the road. Traffic police and ambulance notified."
            priority = "high"
            category = "حادث مروري / تصادم"
            assigned_dept = "الإدارة العامة للمرور"
            dept_phone = "136"
            action = "Dispatch traffic clearance unit and emergency medical response."
        elif any(w in text_lower for w in ["theft", "stolen", "robbery", "burglar"]):
            intent = "Theft / Burglary Incident"
            summary = "Caller reported a theft incident. Report recorded and referred to precinct detectives."
            priority = "high"
            category = "سرقة / سطو / اقتحام"
            assigned_dept = "المباحث الجنائية وقسم الشرطة المختص"
            dept_phone = "+201220000001"
            action = "CID detectives assigned for immediate scene inspection."
        elif any(w in text_lower for w in ["fire", "smoke", "collapse", "gas"]):
            intent = "Fire / Disaster Emergency"
            summary = "Urgent report of fire or structural danger. Civil defense and fire rescue dispatched."
            priority = "urgent"
            category = "حريق / انهيار / كارثة"
            assigned_dept = "الحماية المدنية والمطافئ"
            dept_phone = "180"
            action = "Dispatch firefighting units and alert emergency services."
        else:
            if caller_speech:
                clean_preview = caller_speech[:60].strip()
                intent = "Incomplete Report / Disconnected"
                summary = f"Caller contacted 122 Police and stated ({clean_preview}), but disconnected before completing incident details. No dispatch made."
                action = "Follow up if necessary."
            else:
                intent = "122 Police Hotline Call"
                summary = "Call concluded without specific emergency incident reported."
                action = "No action required."
            priority = "low"
            category = None
            assigned_dept = None
            dept_phone = None

    return {
        "summary": summary,
        "intent": intent,
        "customer_name": None,
        "callback_number": None,
        "priority": priority,
        "category": category,
        "assigned_department": assigned_dept,
        "department_phone": dept_phone,
        "requested_action": action,
        "follow_up_required": priority in ("high", "urgent"),
        "extracted_fields": {},
    }


def _clean_json_response(raw_text: str) -> Optional[Dict[str, Any]]:
    """Clean markdown code fences and parse JSON safely."""
    if not raw_text:
        return None
    cleaned = raw_text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except Exception:
        match = re.search(r"(\{.*\})", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass
    return None


async def extract_structured_call_data(
    transcript_text: str,
    language: str = "ar-EG",
) -> Dict[str, Any]:
    """
    Extract structured summary, dynamic question fields, category classification,
    and department assignment using Gemini chat LLM against configured options.
    """
    fallback_data = _extract_intent_and_summary_fallback(transcript_text, language)

    # If call was abandoned, silent, or only filler greeting, skip LLM entirely
    if not transcript_text or len(transcript_text.strip()) < 10 or _is_abandoned_or_empty_call(transcript_text):
        return fallback_data

    agent_settings = get_cached_agent_settings()
    questions = agent_settings.get("questions", [])
    departments = agent_settings.get("departments", [])
    categories = agent_settings.get("categories", [])

    def _format_question_tree(q_list: List[Dict[str, Any]], indent_level: int = 0) -> List[str]:
        lines = []
        indent = "  " * indent_level
        for i, q in enumerate(q_list):
            field_key = q.get("field_key") or f"field_{i+1}"
            q_text = q.get("text", "")
            options = q.get("options", [])
            opt_desc = ""
            if options:
                opts_formatted = [f"'{opt.get('label')}' (keywords: {','.join(opt.get('keywords', []))})" for opt in options]
                opt_desc = f" [Predefined options: {'; '.join(opts_formatted)}]"
            lines.append(f"{indent}- [field_key: \"{field_key}\"] Question: \"{q_text}\"{opt_desc}")
            for opt in options:
                sub_qs = opt.get("sub_questions") or []
                if sub_qs:
                    lines.append(f"{indent}  * If option '{opt.get('label')}' is selected, follow-up sub-questions:")
                    lines.extend(_format_question_tree(sub_qs, indent_level + 2))
        return lines

    questions_prompt_lines = _format_question_tree(questions)
    questions_desc = "\n".join(questions_prompt_lines) if questions_prompt_lines else "- [field_key: \"inquiry_reason\"] General inquiry"

    # Format departments & categories list
    dept_names = [d.get("name") for d in departments if d.get("name")]
    cat_names = [c.get("name") for c in categories if c.get("name")]

    depts_str = ", ".join([f'"{d}"' for d in dept_names]) if dept_names else '"غرفة عمليات النجدة الرئيسية", "المباحث الجنائية وقسم الشرطة المختص", "الإدارة العامة للمرور", "الحماية المدنية والمطافئ", "هيئة الإسعاف المصرية"'
    cats_str = ", ".join([f'"{c}"' for c in cat_names]) if cat_names else '"استغاثة عاجلة / تهديد حياة", "مشاجرة / اعتداء / إطلاق نار", "حادث مروري / تصادم", "سرقة / سطو / اقتحام", "حريق / انهيار / كارثة", "بلاغ عام / اشتباه / إزعاج"'

    is_arabic = language.startswith("ar") or any("\u0600" <= c <= "\u06FF" for c in transcript_text)

    prompt = f"""You are an expert AI emergency quality supervisor, incident classification and dispatch specialist for the Egyptian Police Emergency Hotline 122 (شرطة النجدة المصرية).
Analyze the following phone call transcript between the 122 Police Dispatcher and the Caller.

Configured Questions and their defined answer options:
{questions_desc}

Allowed Predefined Categories:
[{cats_str}]

Allowed Predefined Departments:
[{depts_str}]

CRITICAL ANTI-HALLUCINATION & FACTUAL ACCURACY RULES:
1. Base all extractions, summaries, and classifications STRICTLY and ONLY on what the caller explicitly stated in 'Caller:' or 'User:' lines.
2. NEVER assume, extrapolate, or invent details, incident types, or locations (e.g. NEVER fabricate "Aswan", "Cornish", or specific addresses/incidents unless the caller literally spoke them).
3. If the caller hung up before stating what the incident was, or if the caller only provided location or disconnected:
   - "category" MUST be null
   - "assigned_department" MUST be null
   - "priority" MUST be "low"
   - In "extracted_fields", any question not answered by the caller (such as incident_type) MUST be null.
   - "summary" MUST state honestly what happened (e.g., caller provided location but call ended before reporting an incident).
4. An option in "extracted_fields" can ONLY be filled if the caller explicitly stated or chose it. If caller didn't answer that question, set it to null.

Provide a strict, valid JSON object (WITHOUT any markdown code blocks, do not wrap in ```json or ```) with this exact schema:
{{
  "summary": "ملخص تنفيذي احترافي ودقيق في سطرين باللغة العربية بناءً فقط على ما ذكره المتصل فعلياً دون أي اختلاق",
  "intent": "الهدف الأساسي للمتصل بدقة باللغة العربية أو مكالمة منقطعة / غير مكتملة",
  "customer_name": "اسم المبلّغ الكامل إذا ذكره المتصل أو null",
  "callback_number": "رقم هاتف المبلّغ للتواصل إذا ذكره أو null",
  "priority": "low | normal | high | urgent",
  "category": "One category from the allowed categories list above, or null if no incident reported",
  "assigned_department": "One department from the allowed departments list above, or null if no dispatch needed",
  "requested_action": "الإجراء أو الخطوة التالية المطلوبة باللغة العربية",
  "follow_up_required": true or false,
  "extracted_fields": {{
    // Map each target question's field_key from above to the caller's extracted answer string. If not answered, use null.
  }}
}}

Transcript:
{transcript_text}
"""

    try:
        chat = OpenRouterChatProvider()
        res = await chat.chat(
            [ConversationMessage(role="user", content=prompt)],
            max_tokens=800,
            temperature=0.1,
        )
        if res and res.text and "callcenter-local-fallback" not in res.model_used:
            parsed = _clean_json_response(res.text)
            if parsed and isinstance(parsed, dict) and "summary" in parsed:
                for key in ["intent", "customer_name", "callback_number", "priority", "category", "assigned_department", "requested_action", "follow_up_required", "extracted_fields"]:
                    if key not in parsed:
                        parsed[key] = fallback_data.get(key)
                if not isinstance(parsed.get("extracted_fields"), dict):
                    parsed["extracted_fields"] = {}
                return parsed
    except Exception as e:
        logger.warning(f"Structured call extraction LLM error: {e}")

    return fallback_data


def _resolve_option_actions(
    extracted_fields: Dict[str, Any],
    questions: List[Dict[str, Any]],
    departments: List[Dict[str, Any]],
    categories: List[Dict[str, Any]],
    transcript_text: str = "",
) -> Dict[str, Any]:
    """
    Evaluates defined answer options for configured questions against caller answers.
    Finds matches and extracts:
    - category
    - assigned_department
    - department_phone
    - should_trigger_outbound_call
    - outbound_target_phone
    """
    matched_category = None
    matched_dept_name = None
    matched_dept_phone = None
    trigger_outbound = False
    outbound_phone = None

    # Safety: If call was abandoned or silent, immediately reject all actions
    if transcript_text and _is_abandoned_or_empty_call(transcript_text):
        return {
            "category": None,
            "assigned_department": None,
            "department_phone": None,
            "trigger_outbound": False,
            "outbound_phone": None,
        }

    caller_speech = _extract_caller_speech(transcript_text).lower() if transcript_text else ""

    dept_lookup = {d.get("id"): d for d in departments if d.get("id")}
    dept_name_lookup = {d.get("name"): d for d in departments if d.get("name")}

    def _scan_question_tree(q_list: List[Dict[str, Any]]) -> None:
        nonlocal matched_category, matched_dept_name, matched_dept_phone, trigger_outbound, outbound_phone
        for q in q_list:
            field_key = q.get("field_key")
            user_val = str(extracted_fields.get(field_key) or "").lower()

            options = q.get("options", [])
            for opt in options:
                keywords = opt.get("keywords", [])
                opt_label = (opt.get("label") or "").lower()
                opt_en_label = (opt.get("english_label") or "").lower()
                matched = False

                if user_val:
                    if opt_label and opt_label in user_val:
                        matched = True
                    elif opt_en_label and opt_en_label in user_val:
                        matched = True
                    elif keywords and any(k.lower() in user_val for k in keywords if k):
                        matched = True

                # CRITICAL SAFETY CHECK:
                # If caller_speech is available, verify that caller actually spoke keywords of this option!
                # This prevents any LLM hallucinated field from triggering unintended dispatch calls or categorization.
                if matched and caller_speech:
                    caller_said_keyword = (
                        (opt_label and opt_label in caller_speech)
                        or (opt_en_label and opt_en_label in caller_speech)
                        or any(k.lower() in caller_speech for k in keywords if k)
                    )
                    if not caller_said_keyword:
                        logger.warning(
                            f"Option '{opt.get('label')}' matched extracted field '{field_key}'='{user_val}', but was NOT found in caller speech. Rejecting match to prevent false dispatch."
                        )
                        matched = False

                if matched:
                    logger.info(f"Matched defined answer option: '{opt.get('label')}' for field '{field_key}'")
                    if opt.get("category"):
                        matched_category = opt.get("category")

                    # Resolve department
                    d_id = opt.get("department_id")
                    if d_id and d_id in dept_lookup:
                        d_obj = dept_lookup[d_id]
                        matched_dept_name = d_obj.get("name")
                        matched_dept_phone = d_obj.get("phone_number")

                    # Check defined action rules on this option
                    for act in opt.get("actions", []):
                        atype = act.get("action_type")
                        if atype == "categorize" and act.get("target_value"):
                            matched_category = act.get("target_value")
                        elif atype == "assign_department":
                            if act.get("department_name"):
                                matched_dept_name = act.get("department_name")
                            if act.get("department_phone"):
                                matched_dept_phone = act.get("department_phone")
                        elif atype == "outbound_call":
                            trigger_outbound = True
                            outbound_phone = act.get("target_value") or act.get("department_phone") or matched_dept_phone
                            if act.get("department_name"):
                                matched_dept_name = act.get("department_name")

                # Recursively scan sub_questions for this option
                sub_qs = opt.get("sub_questions") or []
                if sub_qs:
                    _scan_question_tree(sub_qs)

    _scan_question_tree(questions)

    return {
        "category": matched_category,
        "assigned_department": matched_dept_name,
        "department_phone": matched_dept_phone,
        "trigger_outbound": trigger_outbound,
        "outbound_phone": outbound_phone,
    }


async def _execute_department_outbound_call(
    original_call: Call,
    department_phone: str,
    department_name: Optional[str],
    summary: str,
    db: AsyncSession,
) -> Optional[uuid.UUID]:
    """
    Automatically creates and dispatches an outbound call record to the internal department number.
    Supports both simulated calls and real Twilio telephony if configured.
    """
    try:
        from_number = settings.TWILIO_PHONE_NUMBER or "+10000000000"
        call_mode = "simulated" if settings.TELEPHONY_PROVIDER == "simulated" else "real"

        is_orig_ar = (original_call.language or "ar").startswith("ar")
        outbound_summary = (
            f"إخطار وتوجيه آلي إلى {department_name or 'الجهة المختصة'}. ملخص البلاغ: {summary}"
            if is_orig_ar
            else f"Automated department dispatch to {department_name or 'Department'}. Issue summary: {summary}"
        )

        outbound_call = Call(
            customer_id=original_call.customer_id,
            direction="outbound",
            call_mode=call_mode,
            status="completed" if call_mode == "simulated" else "ringing",
            from_number=from_number,
            to_number=department_phone,
            started_at=datetime.now(timezone.utc),
            ended_at=datetime.now(timezone.utc) if call_mode == "simulated" else None,
            duration_seconds=15 if call_mode == "simulated" else None,
            language=original_call.language or "ar-EG",
            processing_status="completed",
            ai_summary=outbound_summary,
        )
        db.add(outbound_call)
        await db.flush()

        logger.info(
            f"Automated outbound call dispatched to department {department_name} ({department_phone}): ID={outbound_call.id}"
        )
        return outbound_call.id
    except Exception as e:
        logger.error(f"Failed to execute automated department outbound call: {e}")
        return None


async def generate_call_summary_and_extraction(
    call: Call,
    transcript_text: str,
    db: AsyncSession,
) -> None:
    """
    Generate and persist high-quality AI Summary and CallExtraction for a completed call.
    Also executes defined answer option actions:
    - Predefined category classification
    - Internal department assignment
    - Automated outbound dispatch call to internal department number
    """
    is_ar = (call.language or "ar").startswith("ar")
    agent_settings = get_cached_agent_settings()
    configured_questions = agent_settings.get("questions", [])
    configured_departments = agent_settings.get("departments", [])
    configured_categories = agent_settings.get("categories", [])

    if not transcript_text or len(transcript_text.strip()) == 0 or _is_abandoned_or_empty_call(transcript_text):
        default_summary = (
            "اتصال وارد لشرطة النجدة 122 أُغلق فوراً بعد رسالة الترحيب دون أن يدلي المتصل بأي تفاصيل أو بلاغ. لم يتم تسجيل أي حادث أو استدعاء دوريات."
            if is_ar
            else "Inbound call to 122 Police Hotline disconnected immediately after greeting without caller providing details or report. No incident logged or patrol dispatched."
        )
        intent = "مكالمة مقطوعة / لم يتم الرد بعد الترحيب" if is_ar else "Disconnected / No response after greeting"
        action = "لا يوجد إجراء مطلوب (مكالمة منقطعة بعد الترحيب)" if is_ar else "No action required (disconnected call)"

        call.ai_summary = default_summary
        call.processing_status = "completed"

        ext_res = await db.execute(select(CallExtraction).where(CallExtraction.call_id == call.id))
        extraction = ext_res.scalar_one_or_none()
        if not extraction:
            extraction = CallExtraction(
                call_id=call.id,
                customer_id=call.customer_id,
                intent=intent,
                customer_name=None,
                callback_number=None,
                summary=default_summary,
                priority="low",
                category=None,
                assigned_department=None,
                department_phone=None,
                outbound_call_triggered=False,
                outbound_call_id=None,
                requested_action=action,
                follow_up_required=False,
                extracted_json={},
                validation_status="valid",
                review_status="reviewed",
            )
            db.add(extraction)
        else:
            extraction.intent = intent
            extraction.summary = default_summary
            extraction.priority = "low"
            extraction.category = None
            extraction.assigned_department = None
            extraction.department_phone = None
            extraction.outbound_call_triggered = False
            extraction.outbound_call_id = None
            extraction.requested_action = action
            extraction.follow_up_required = False
            extraction.extracted_json = {}
            extraction.validation_status = "valid"
            extraction.review_status = "reviewed"
        return

    # 1. Extract dynamic structured data using LLM
    data = await extract_structured_call_data(transcript_text, call.language or "ar-EG")

    summary = data.get("summary") or ("تم تسجيل البلاغ بنجاح بغرفة العمليات." if is_ar else "Emergency report successfully registered.")
    intent = data.get("intent") or ("بلاغ أمني أو طارئ لشرطة النجدة 122" if is_ar else "Emergency report to Police Hotline 122")
    priority = data.get("priority") or "normal"
    if priority not in ("low", "normal", "high", "urgent"):
        priority = "normal"
    requested_action = data.get("requested_action") or ("توجيه ومتابعة دورية أمنية لموقع البلاغ" if is_ar else "Dispatch and follow up patrol unit to incident location")
    follow_up_required = bool(data.get("follow_up_required", False))
    customer_name = data.get("customer_name")
    callback_number = data.get("callback_number")
    extracted_fields = data.get("extracted_fields") or {}

    category = data.get("category")
    assigned_department = data.get("assigned_department")
    department_phone = None

    # Check extracted_fields for name and phone if not top-level
    if not customer_name and "customer_name" in extracted_fields and extracted_fields["customer_name"]:
        customer_name = str(extracted_fields["customer_name"]).strip()
    if not callback_number and "phone_number" in extracted_fields and extracted_fields["phone_number"]:
        callback_number = str(extracted_fields["phone_number"]).strip()

    # 2. Evaluate Defined Answer Option Rules & Actions
    action_resolution = _resolve_option_actions(
        extracted_fields=extracted_fields,
        questions=configured_questions,
        departments=configured_departments,
        categories=configured_categories,
        transcript_text=transcript_text,
    )

    if action_resolution["category"]:
        category = action_resolution["category"]
    if action_resolution["assigned_department"]:
        assigned_department = action_resolution["assigned_department"]
    if action_resolution["department_phone"]:
        department_phone = action_resolution["department_phone"]

    # If department phone is still unknown, look it up in configured departments
    if assigned_department and not department_phone:
        for d in configured_departments:
            if d.get("name") == assigned_department:
                department_phone = d.get("phone_number")
                break

    # 3. Check and execute Outbound Call Action if defined
    outbound_triggered = False
    outbound_call_id = None
    target_outbound_phone = action_resolution.get("outbound_phone") or department_phone

    if action_resolution.get("trigger_outbound") and target_outbound_phone:
        outbound_triggered = True
        outbound_call_id = await _execute_department_outbound_call(
            original_call=call,
            department_phone=target_outbound_phone,
            department_name=assigned_department,
            summary=summary,
            db=db,
        )

    # 4. Update Call record
    call.ai_summary = summary
    call.processing_status = "completed"

    # 5. Update or Link Customer record if details available
    if customer_name or callback_number:
        try:
            target_phone = callback_number or call.from_number
            if target_phone:
                cust_res = await db.execute(select(Customer).where(Customer.phone_number == target_phone))
                customer = cust_res.scalar_one_or_none()
                if customer:
                    if customer_name and customer.full_name in ("Customer", "Unknown", None, ""):
                        customer.full_name = customer_name
                    if not call.customer_id:
                        call.customer_id = customer.id
                elif customer_name and target_phone:
                    new_customer = Customer(
                        full_name=customer_name,
                        phone_number=target_phone,
                        preferred_language=call.language or "ar-EG",
                        consent_status="granted",
                        notes=f"Created automatically from call {call.id}",
                    )
                    db.add(new_customer)
                    await db.flush()
                    call.customer_id = new_customer.id
        except Exception as ce:
            logger.warning(f"Error linking/updating customer in extraction: {ce}")

    # 6. Upsert CallExtraction record with Category, Assigned Department, and Outbound Call info
    ext_res = await db.execute(select(CallExtraction).where(CallExtraction.call_id == call.id))
    extraction = ext_res.scalar_one_or_none()
    if not extraction:
        extraction = CallExtraction(
            call_id=call.id,
            customer_id=call.customer_id,
            intent=intent,
            customer_name=customer_name,
            callback_number=callback_number,
            summary=summary,
            priority=priority,
            category=category,
            assigned_department=assigned_department,
            department_phone=department_phone,
            outbound_call_triggered=outbound_triggered,
            outbound_call_id=outbound_call_id,
            requested_action=requested_action,
            follow_up_required=follow_up_required,
            extracted_json=extracted_fields,
            validation_status="valid",
            review_status="pending",
        )
        db.add(extraction)
    else:
        extraction.customer_id = call.customer_id
        extraction.intent = intent
        if customer_name:
            extraction.customer_name = customer_name
        if callback_number:
            extraction.callback_number = callback_number
        extraction.summary = summary
        extraction.priority = priority
        extraction.category = category
        extraction.assigned_department = assigned_department
        extraction.department_phone = department_phone
        extraction.outbound_call_triggered = outbound_triggered
        if outbound_call_id:
            extraction.outbound_call_id = outbound_call_id
        extraction.requested_action = requested_action
        extraction.follow_up_required = follow_up_required
        extraction.extracted_json = extracted_fields
        extraction.validation_status = "valid"

    logger.info(
        f"AI Extraction complete for call {call.id}: category='{category}', dept='{assigned_department}' ({department_phone}), outbound={outbound_triggered}"
    )
