import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.setting import AgentSetting
from app.schemas.setting import (
    AgentQuestionItem,
    AgentSettingResponse,
    AgentSettingUpdate,
    DepartmentItem,
    CategoryItem,
)

logger = logging.getLogger(__name__)

DEFAULT_ARABIC_GREETING = "شرطة النجدة 122 معاك يا فندم، اتفضل إيه البلاغ أو المشكلة؟"
DEFAULT_ACKNOWLEDGMENT_MESSAGE = "تمام يا فندم، اطمن."
DEFAULT_CLARIFICATION_MESSAGE = "معلش يا فندم، الصوت مكنش واضح عندي خالص. ممكن تعيد عليا تاني بعد إذنك؟"
DEFAULT_HANGUP_REASSURANCE_MESSAGE = "تحت أمرك يا فندم، اطمن الدورية في طريقها لموقع البلاغ فوراً، وخليك في مكان آمن."
DEFAULT_CLOSING_MESSAGE = "اطمن يا فندم، تم إخطار أقرب دورية أمنية وقسم الشرطة المختص بالتحرك فوراً لموقع البلاغ. خليك في مكان آمن، ومعاك شرطة النجدة."

DEFAULT_ENGLISH_GREETING = "Egyptian Police Emergency Hotline 122. Please state your emergency?"
DEFAULT_ENGLISH_ACKNOWLEDGMENT_MESSAGE = "Understood, stay calm."
DEFAULT_ENGLISH_CLARIFICATION_MESSAGE = "I am sorry, the audio was not clear. Could you please repeat?"
DEFAULT_ENGLISH_HANGUP_REASSURANCE_MESSAGE = "You are in good hands. The police patrol is en route immediately. Stay safe!"
DEFAULT_ENGLISH_CLOSING_MESSAGE = "All your emergency report details have been dispatched to the nearest police patrol unit. Stay in a safe place, emergency services are en route!"

DEFAULT_VAD_SILENCE_TIMEOUT = 1.8
DEFAULT_CHAT_MODEL = "google/gemma-4-26b-a4b-it"
DEFAULT_STT_MODEL = "openai/whisper-large-v3"

DEFAULT_DEPARTMENTS = [
    {
        "id": "dept_122_ops",
        "name": "غرفة عمليات النجدة الرئيسية",
        "phone_number": "122",
        "description": "غرفة عمليات النجدة المركزية لتوجيه الدوريات الأمنية وبلاغات الاستغاثة العاجلة",
    },
    {
        "id": "dept_cid",
        "name": "المباحث الجنائية وقسم الشرطة المختص",
        "phone_number": "+201220000001",
        "description": "مباحث القسم للتحقيق في جرائم السرقة، المشاجرات، التعدي، وضبط الجناة",
    },
    {
        "id": "dept_traffic",
        "name": "الإدارة العامة للمرور",
        "phone_number": "136",
        "description": "عمليات المرور لحوادث التصادم، إعاقة الطرق، وتسيير المحاور المرورية",
    },
    {
        "id": "dept_civil_defense",
        "name": "الحماية المدنية والمطافئ",
        "phone_number": "180",
        "description": "سيارات الإطفاء والإنقاذ البري لحالات الحرائق، انهيار العقارات، وتسرب الغاز",
    },
    {
        "id": "dept_ambulance",
        "name": "هيئة الإسعاف المصرية",
        "phone_number": "123",
        "description": "التنسيق الفوري لإرسال سيارات الإسعاف لنقل المصابين والحالات الحرجة",
    },
]

DEFAULT_CATEGORIES = [
    {
        "id": "cat_urgent_distress",
        "name": "استغاثة عاجلة / تهديد حياة",
        "default_priority": "urgent",
        "department_id": "dept_122_ops",
    },
    {
        "id": "cat_brawl_assault",
        "name": "مشاجرة / اعتداء / إطلاق نار",
        "default_priority": "urgent",
        "department_id": "dept_cid",
    },
    {
        "id": "cat_traffic_accident",
        "name": "حادث مروري / تصادم",
        "default_priority": "high",
        "department_id": "dept_traffic",
    },
    {
        "id": "cat_theft",
        "name": "سرقة / سطو / اقتحام",
        "default_priority": "high",
        "department_id": "dept_cid",
    },
    {
        "id": "cat_fire_rescue",
        "name": "حريق / انهيار / كارثة",
        "default_priority": "urgent",
        "department_id": "dept_civil_defense",
    },
    {
        "id": "cat_general_report",
        "name": "بلاغ عام / اشتباه / إزعاج",
        "default_priority": "normal",
        "department_id": "dept_122_ops",
    },
]

DEFAULT_QUESTIONS = [
    {
        "id": "q1",
        "order": 1,
        "text": "اسم حضرتك بالكامل يا فندم لإثبات البلاغ؟",
        "english_text": "What is your full name, sir, to register the emergency report?",
        "field_key": "caller_name",
        "is_required": True,
        "options": [],
    },
    {
        "id": "q2",
        "order": 2,
        "text": "رقم تليفون حضرتك للتواصل ومتابعة تحرك الدورية الأمنية؟",
        "english_text": "What is your contact phone number to follow up on the dispatched police patrol?",
        "field_key": "phone_number",
        "is_required": True,
        "options": [],
    },
    {
        "id": "q3",
        "order": 3,
        "text": "مكان البلاغ فين بالتفصيل يا فندم؟ المحافظة، المنطقة، والشارع أو أقرب علامة مميزة؟",
        "english_text": "What is the exact location of the incident, sir? Governorate, district, street, or nearest landmark?",
        "field_key": "incident_location",
        "is_required": True,
        "options": [],
    },
    {
        "id": "q4",
        "order": 4,
        "text": "إيه نوع البلاغ أو الحادث اللي حضرتك بتبلغ عنه؟ مشاجرة، سرقة، حادث تصادم، حريق، ولا استغاثة؟",
        "english_text": "What is the nature of the emergency you are reporting? Brawl, theft, traffic accident, fire, or urgent life distress?",
        "field_key": "incident_type",
        "is_required": True,
        "options": [
            {
                "id": "opt_brawl",
                "label": "مشاجرة أو اعتداء",
                "english_label": "Brawl or physical assault",
                "keywords": ["مشاجرة", "خناقة", "اعتداء", "ضرب", "سلاح", "خرطوش", "عصيان", "بلطجة", "brawl", "fight", "assault"],
                "category": "مشاجرة / اعتداء / إطلاق نار",
                "department_id": "dept_cid",
                "actions": [
                    {
                        "action_type": "categorize",
                        "target_value": "مشاجرة / اعتداء / إطلاق نار",
                    },
                    {
                        "action_type": "assign_department",
                        "department_name": "المباحث الجنائية وقسم الشرطة المختص",
                        "department_phone": "+201220000001",
                    },
                    {
                        "action_type": "outbound_call",
                        "department_name": "المباحث الجنائية وقسم الشرطة المختص",
                        "department_phone": "+201220000001",
                        "target_value": "+201220000001",
                    },
                ],
                "sub_questions": [
                    {
                        "id": "sq_weapons",
                        "order": 1,
                        "text": "هل في أسلحة مستخدمة في المشاجرة؟ وهل في حد مصاب؟",
                        "english_text": "Are there weapons involved in the fight, and is anyone injured?",
                        "field_key": "weapons_involved",
                        "is_required": True,
                        "options": [],
                    }
                ],
            },
            {
                "id": "opt_accident",
                "label": "حادث تصادم مروري",
                "english_label": "Traffic accident or collision",
                "keywords": ["حادث", "حادثة", "تصادم", "عربية خبطت", "موتوسيكل", "انقلاب", "accident", "crash", "collision"],
                "category": "حادث مروري / تصادم",
                "department_id": "dept_traffic",
                "actions": [
                    {
                        "action_type": "categorize",
                        "target_value": "حادث مروري / تصادم",
                    },
                    {
                        "action_type": "assign_department",
                        "department_name": "الإدارة العامة للمرور",
                        "department_phone": "136",
                    },
                    {
                        "action_type": "outbound_call",
                        "department_name": "الإدارة العامة للمرور",
                        "department_phone": "136",
                        "target_value": "136",
                    },
                ],
                "sub_questions": [
                    {
                        "id": "sq_injuries",
                        "order": 1,
                        "text": "هل الحادث أسفر عن أي إصابات؟ وهل الطريق واقف ومحتاج إسعاف وونش مرور؟",
                        "english_text": "Did the collision result in injuries, and is the road blocked requiring ambulance and towing?",
                        "field_key": "injuries_and_traffic",
                        "is_required": True,
                        "options": [],
                    }
                ],
            },
            {
                "id": "opt_theft",
                "label": "سرقة أو سطو",
                "english_label": "Theft or burglary",
                "keywords": ["سرقة", "مسروق", "اتسرق", "حرامي", "سطو", "نشل", "اقتحام", "theft", "stolen", "robbery", "burglary"],
                "category": "سرقة / سطو / اقتحام",
                "department_id": "dept_cid",
                "actions": [
                    {
                        "action_type": "categorize",
                        "target_value": "سرقة / سطو / اقتحام",
                    },
                    {
                        "action_type": "assign_department",
                        "department_name": "المباحث الجنائية وقسم الشرطة المختص",
                        "department_phone": "+201220000001",
                    },
                    {
                        "action_type": "outbound_call",
                        "department_name": "المباحث الجنائية وقسم الشرطة المختص",
                        "department_phone": "+201220000001",
                        "target_value": "+201220000001",
                    },
                ],
                "sub_questions": [
                    {
                        "id": "sq_suspect",
                        "order": 1,
                        "text": "هل الجاني أو الحرامي لسه متواجد في المكان ولا هرب؟ ومعاك أي مواصفات ليه؟",
                        "english_text": "Is the suspect still at the location or fled, and do you have any description of them?",
                        "field_key": "suspect_status",
                        "is_required": False,
                        "options": [],
                    }
                ],
            },
            {
                "id": "opt_fire",
                "label": "حريق أو انهيار أو كارثة",
                "english_label": "Fire outbreak, collapse or disaster",
                "keywords": ["حريق", "نار", "دخان", "حريقة", "تسرب غاز", "انهيار", "fire", "collapse", "gas leak"],
                "category": "حريق / انهيار / كارثة",
                "department_id": "dept_civil_defense",
                "actions": [
                    {
                        "action_type": "categorize",
                        "target_value": "حريق / انهيار / كارثة",
                    },
                    {
                        "action_type": "assign_department",
                        "department_name": "الحماية المدنية والمطافئ",
                        "department_phone": "180",
                    },
                    {
                        "action_type": "outbound_call",
                        "department_name": "الحماية المدنية والمطافئ",
                        "department_phone": "180",
                        "target_value": "180",
                    },
                ],
                "sub_questions": [
                    {
                        "id": "sq_trapped",
                        "order": 1,
                        "text": "هل في ناس محتجزين داخل العقار أو المكان لا قدر الله؟",
                        "english_text": "Are there any people trapped inside the building or location?",
                        "field_key": "trapped_persons",
                        "is_required": True,
                        "options": [],
                    }
                ],
            },
            {
                "id": "opt_urgent",
                "label": "استغاثة عاجلة أو تهديد حياة",
                "english_label": "Urgent distress or life threat",
                "keywords": ["الحقوني", "استغاثة", "خطر", "بيموت", "تهديد", "انقذوني", "قتل", "help", "emergency", "urgent", "danger"],
                "category": "استغاثة عاجلة / تهديد حياة",
                "department_id": "dept_122_ops",
                "actions": [
                    {
                        "action_type": "categorize",
                        "target_value": "استغاثة عاجلة / تهديد حياة",
                    },
                    {
                        "action_type": "assign_department",
                        "department_name": "غرفة عمليات النجدة الرئيسية",
                        "department_phone": "122",
                    },
                    {
                        "action_type": "outbound_call",
                        "department_name": "غرفة عمليات النجدة الرئيسية",
                        "department_phone": "122",
                        "target_value": "122",
                    },
                ],
                "sub_questions": [
                    {
                        "id": "sq_safety",
                        "order": 1,
                        "text": "هل حضرتك في مكان آمن حالياً؟ وأقرب شخص أو نقطة يقدر يوصلك فيها؟",
                        "english_text": "Are you currently in a safe place, and what is the nearest point the police patrol can reach you?",
                        "field_key": "immediate_danger",
                        "is_required": True,
                        "options": [],
                    }
                ],
            },
        ],
    },
]

# In-memory runtime cache for high-speed voice streaming access
_cached_settings: Dict[str, Any] = {
    "key": "default",
    "arabic_greeting": DEFAULT_ARABIC_GREETING,
    "acknowledgment_message": DEFAULT_ACKNOWLEDGMENT_MESSAGE,
    "clarification_message": DEFAULT_CLARIFICATION_MESSAGE,
    "hangup_reassurance_message": DEFAULT_HANGUP_REASSURANCE_MESSAGE,
    "closing_message": DEFAULT_CLOSING_MESSAGE,
    "english_greeting": DEFAULT_ENGLISH_GREETING,
    "english_acknowledgment_message": DEFAULT_ENGLISH_ACKNOWLEDGMENT_MESSAGE,
    "english_clarification_message": DEFAULT_ENGLISH_CLARIFICATION_MESSAGE,
    "english_hangup_reassurance_message": DEFAULT_ENGLISH_HANGUP_REASSURANCE_MESSAGE,
    "english_closing_message": DEFAULT_ENGLISH_CLOSING_MESSAGE,
    "questions": list(DEFAULT_QUESTIONS),
    "tts_voice": "Aoede",
    "vad_silence_timeout_seconds": DEFAULT_VAD_SILENCE_TIMEOUT,
    "chat_model": DEFAULT_CHAT_MODEL,
    "stt_model": DEFAULT_STT_MODEL,
    "departments": list(DEFAULT_DEPARTMENTS),
    "categories": list(DEFAULT_CATEGORIES),
    "is_active": True,
    "updated_at": datetime.now(timezone.utc),
}


def get_cached_agent_settings() -> Dict[str, Any]:
    """Instant synchronous retrieval of current agent greeting, sentences, questions, voice, departments, and categories."""
    sorted_qs = sorted(_cached_settings.get("questions", []), key=lambda q: q.get("order", 1))
    return {
        "arabic_greeting": _cached_settings.get("arabic_greeting", DEFAULT_ARABIC_GREETING),
        "acknowledgment_message": _cached_settings.get("acknowledgment_message", DEFAULT_ACKNOWLEDGMENT_MESSAGE),
        "clarification_message": _cached_settings.get("clarification_message", DEFAULT_CLARIFICATION_MESSAGE),
        "hangup_reassurance_message": _cached_settings.get("hangup_reassurance_message", DEFAULT_HANGUP_REASSURANCE_MESSAGE),
        "closing_message": _cached_settings.get("closing_message", DEFAULT_CLOSING_MESSAGE),
        "english_greeting": _cached_settings.get("english_greeting", DEFAULT_ENGLISH_GREETING),
        "english_acknowledgment_message": _cached_settings.get("english_acknowledgment_message", DEFAULT_ENGLISH_ACKNOWLEDGMENT_MESSAGE),
        "english_clarification_message": _cached_settings.get("english_clarification_message", DEFAULT_ENGLISH_CLARIFICATION_MESSAGE),
        "english_hangup_reassurance_message": _cached_settings.get("english_hangup_reassurance_message", DEFAULT_ENGLISH_HANGUP_REASSURANCE_MESSAGE),
        "english_closing_message": _cached_settings.get("english_closing_message", DEFAULT_ENGLISH_CLOSING_MESSAGE),
        "questions": sorted_qs,
        "tts_voice": _cached_settings.get("tts_voice", "Aoede"),
        "vad_silence_timeout_seconds": _cached_settings.get("vad_silence_timeout_seconds", DEFAULT_VAD_SILENCE_TIMEOUT),
        "chat_model": _cached_settings.get("chat_model", DEFAULT_CHAT_MODEL),
        "stt_model": _cached_settings.get("stt_model", DEFAULT_STT_MODEL),
        "departments": _cached_settings.get("departments", DEFAULT_DEPARTMENTS),
        "categories": _cached_settings.get("categories", DEFAULT_CATEGORIES),
        "is_active": _cached_settings.get("is_active", True),
    }


async def get_agent_settings(db: Optional[AsyncSession] = None) -> AgentSettingResponse:
    """Retrieve agent settings from DB with fallback to runtime cache/defaults."""
    global _cached_settings

    if db is not None:
        try:
            result = await db.execute(select(AgentSetting).where(AgentSetting.key == "default"))
            setting_obj = result.scalar_one_or_none()
            if setting_obj:
                questions_data = setting_obj.questions or []
                questions_data = sorted(questions_data, key=lambda q: q.get("order", 1))
                closing_msg = setting_obj.closing_message or DEFAULT_CLOSING_MESSAGE
                ack_msg = setting_obj.acknowledgment_message or DEFAULT_ACKNOWLEDGMENT_MESSAGE
                clarify_msg = setting_obj.clarification_message or DEFAULT_CLARIFICATION_MESSAGE
                hangup_msg = setting_obj.hangup_reassurance_message or DEFAULT_HANGUP_REASSURANCE_MESSAGE
                en_greeting = setting_obj.english_greeting or DEFAULT_ENGLISH_GREETING
                en_ack = setting_obj.english_acknowledgment_message or DEFAULT_ENGLISH_ACKNOWLEDGMENT_MESSAGE
                en_clarify = setting_obj.english_clarification_message or DEFAULT_ENGLISH_CLARIFICATION_MESSAGE
                en_hangup = setting_obj.english_hangup_reassurance_message or DEFAULT_ENGLISH_HANGUP_REASSURANCE_MESSAGE
                en_closing = setting_obj.english_closing_message or DEFAULT_ENGLISH_CLOSING_MESSAGE
                voice = setting_obj.tts_voice or "Aoede"
                vad_timeout = getattr(setting_obj, "vad_silence_timeout_seconds", None) or DEFAULT_VAD_SILENCE_TIMEOUT
                chat_m = getattr(setting_obj, "chat_model", None) or DEFAULT_CHAT_MODEL
                stt_m = getattr(setting_obj, "stt_model", None) or DEFAULT_STT_MODEL
                departments_data = setting_obj.departments if setting_obj.departments else DEFAULT_DEPARTMENTS
                categories_data = setting_obj.categories if setting_obj.categories else DEFAULT_CATEGORIES

                _cached_settings = {
                    "id": str(setting_obj.id),
                    "key": setting_obj.key,
                    "arabic_greeting": setting_obj.arabic_greeting,
                    "acknowledgment_message": ack_msg,
                    "clarification_message": clarify_msg,
                    "hangup_reassurance_message": hangup_msg,
                    "closing_message": closing_msg,
                    "english_greeting": en_greeting,
                    "english_acknowledgment_message": en_ack,
                    "english_clarification_message": en_clarify,
                    "english_hangup_reassurance_message": en_hangup,
                    "english_closing_message": en_closing,
                    "questions": questions_data,
                    "tts_voice": voice,
                    "vad_silence_timeout_seconds": vad_timeout,
                    "chat_model": chat_m,
                    "stt_model": stt_m,
                    "departments": departments_data,
                    "categories": categories_data,
                    "is_active": setting_obj.is_active,
                    "updated_at": setting_obj.updated_at,
                }
                return AgentSettingResponse(
                    id=str(setting_obj.id),
                    key=setting_obj.key,
                    arabic_greeting=setting_obj.arabic_greeting,
                    acknowledgment_message=ack_msg,
                    clarification_message=clarify_msg,
                    hangup_reassurance_message=hangup_msg,
                    closing_message=closing_msg,
                    english_greeting=en_greeting,
                    english_acknowledgment_message=en_ack,
                    english_clarification_message=en_clarify,
                    english_hangup_reassurance_message=en_hangup,
                    english_closing_message=en_closing,
                    questions=[AgentQuestionItem(**q) for q in questions_data],
                    tts_voice=voice,
                    vad_silence_timeout_seconds=vad_timeout,
                    chat_model=chat_m,
                    stt_model=stt_m,
                    departments=[DepartmentItem(**d) for d in departments_data],
                    categories=[CategoryItem(**c) for c in categories_data],
                    is_active=setting_obj.is_active,
                    updated_at=setting_obj.updated_at,
                )
        except Exception as e:
            logger.warning(f"Error fetching agent settings from DB: {e}. Falling back to cached settings.")
            try:
                await db.rollback()
            except Exception:
                pass

    # Fallback to cached settings
    cached_qs = sorted(_cached_settings.get("questions", DEFAULT_QUESTIONS), key=lambda q: q.get("order", 1))
    return AgentSettingResponse(
        id=_cached_settings.get("id"),
        key="default",
        arabic_greeting=_cached_settings.get("arabic_greeting", DEFAULT_ARABIC_GREETING),
        acknowledgment_message=_cached_settings.get("acknowledgment_message", DEFAULT_ACKNOWLEDGMENT_MESSAGE),
        clarification_message=_cached_settings.get("clarification_message", DEFAULT_CLARIFICATION_MESSAGE),
        hangup_reassurance_message=_cached_settings.get("hangup_reassurance_message", DEFAULT_HANGUP_REASSURANCE_MESSAGE),
        closing_message=_cached_settings.get("closing_message", DEFAULT_CLOSING_MESSAGE),
        english_greeting=_cached_settings.get("english_greeting", DEFAULT_ENGLISH_GREETING),
        english_acknowledgment_message=_cached_settings.get("english_acknowledgment_message", DEFAULT_ENGLISH_ACKNOWLEDGMENT_MESSAGE),
        english_clarification_message=_cached_settings.get("english_clarification_message", DEFAULT_ENGLISH_CLARIFICATION_MESSAGE),
        english_hangup_reassurance_message=_cached_settings.get("english_hangup_reassurance_message", DEFAULT_ENGLISH_HANGUP_REASSURANCE_MESSAGE),
        english_closing_message=_cached_settings.get("english_closing_message", DEFAULT_ENGLISH_CLOSING_MESSAGE),
        questions=[AgentQuestionItem(**q) for q in cached_qs],
        tts_voice=_cached_settings.get("tts_voice", "Aoede"),
        vad_silence_timeout_seconds=_cached_settings.get("vad_silence_timeout_seconds", DEFAULT_VAD_SILENCE_TIMEOUT),
        chat_model=_cached_settings.get("chat_model", DEFAULT_CHAT_MODEL),
        stt_model=_cached_settings.get("stt_model", DEFAULT_STT_MODEL),
        departments=[DepartmentItem(**d) for d in _cached_settings.get("departments", DEFAULT_DEPARTMENTS)],
        categories=[CategoryItem(**c) for c in _cached_settings.get("categories", DEFAULT_CATEGORIES)],
        is_active=_cached_settings.get("is_active", True),
        updated_at=_cached_settings.get("updated_at"),
    )


async def save_agent_settings(update_data: AgentSettingUpdate, db: Optional[AsyncSession] = None) -> AgentSettingResponse:
    """Save updated greeting, sentences, questions with options & actions, departments, and categories to DB & cache."""
    global _cached_settings

    sorted_questions = sorted(
        [q.model_dump() for q in update_data.questions],
        key=lambda q: q.get("order", 1)
    )

    closing_msg = update_data.closing_message or DEFAULT_CLOSING_MESSAGE
    ack_msg = update_data.acknowledgment_message or DEFAULT_ACKNOWLEDGMENT_MESSAGE
    clarify_msg = update_data.clarification_message or DEFAULT_CLARIFICATION_MESSAGE
    hangup_msg = update_data.hangup_reassurance_message or DEFAULT_HANGUP_REASSURANCE_MESSAGE

    en_greeting = update_data.english_greeting or DEFAULT_ENGLISH_GREETING
    en_ack = update_data.english_acknowledgment_message or DEFAULT_ENGLISH_ACKNOWLEDGMENT_MESSAGE
    en_clarify = update_data.english_clarification_message or DEFAULT_ENGLISH_CLARIFICATION_MESSAGE
    en_hangup = update_data.english_hangup_reassurance_message or DEFAULT_ENGLISH_HANGUP_REASSURANCE_MESSAGE
    en_closing = update_data.english_closing_message or DEFAULT_ENGLISH_CLOSING_MESSAGE

    voice = update_data.tts_voice or "Aoede"
    vad_timeout = update_data.vad_silence_timeout_seconds if update_data.vad_silence_timeout_seconds is not None else DEFAULT_VAD_SILENCE_TIMEOUT
    chat_m = update_data.chat_model or DEFAULT_CHAT_MODEL
    stt_m = update_data.stt_model or DEFAULT_STT_MODEL
    departments_dump = [d.model_dump() for d in update_data.departments] if update_data.departments else DEFAULT_DEPARTMENTS
    categories_dump = [c.model_dump() for c in update_data.categories] if update_data.categories else DEFAULT_CATEGORIES

    now = datetime.now(timezone.utc)
    updated_id = _cached_settings.get("id")

    if db is not None:
        try:
            result = await db.execute(select(AgentSetting).where(AgentSetting.key == "default"))
            setting_obj = result.scalar_one_or_none()
            if not setting_obj:
                setting_obj = AgentSetting(
                    key="default",
                    arabic_greeting=update_data.arabic_greeting,
                    acknowledgment_message=ack_msg,
                    clarification_message=clarify_msg,
                    hangup_reassurance_message=hangup_msg,
                    closing_message=closing_msg,
                    english_greeting=en_greeting,
                    english_acknowledgment_message=en_ack,
                    english_clarification_message=en_clarify,
                    english_hangup_reassurance_message=en_hangup,
                    english_closing_message=en_closing,
                    questions=sorted_questions,
                    tts_voice=voice,
                    vad_silence_timeout_seconds=vad_timeout,
                    chat_model=chat_m,
                    stt_model=stt_m,
                    departments=departments_dump,
                    categories=categories_dump,
                    is_active=update_data.is_active if update_data.is_active is not None else True,
                )
                db.add(setting_obj)
            else:
                setting_obj.arabic_greeting = update_data.arabic_greeting
                setting_obj.acknowledgment_message = ack_msg
                setting_obj.clarification_message = clarify_msg
                setting_obj.hangup_reassurance_message = hangup_msg
                setting_obj.closing_message = closing_msg
                setting_obj.english_greeting = en_greeting
                setting_obj.english_acknowledgment_message = en_ack
                setting_obj.english_clarification_message = en_clarify
                setting_obj.english_hangup_reassurance_message = en_hangup
                setting_obj.english_closing_message = en_closing
                setting_obj.questions = sorted_questions
                setting_obj.tts_voice = voice
                setting_obj.vad_silence_timeout_seconds = vad_timeout
                setting_obj.chat_model = chat_m
                setting_obj.stt_model = stt_m
                setting_obj.departments = departments_dump
                setting_obj.categories = categories_dump
                if update_data.is_active is not None:
                    setting_obj.is_active = update_data.is_active

            await db.flush()
            await db.commit()
            await db.refresh(setting_obj)
            updated_id = str(setting_obj.id)
            now = setting_obj.updated_at or now
        except Exception as e:
            logger.warning(f"Error saving agent settings to DB: {e}. Persisting to memory cache.")
            try:
                await db.rollback()
            except Exception:
                pass

    # Update in-memory cache
    _cached_settings = {
        "id": updated_id,
        "key": "default",
        "arabic_greeting": update_data.arabic_greeting,
        "acknowledgment_message": ack_msg,
        "clarification_message": clarify_msg,
        "hangup_reassurance_message": hangup_msg,
        "closing_message": closing_msg,
        "english_greeting": en_greeting,
        "english_acknowledgment_message": en_ack,
        "english_clarification_message": en_clarify,
        "english_hangup_reassurance_message": en_hangup,
        "english_closing_message": en_closing,
        "questions": sorted_questions,
        "tts_voice": voice,
        "vad_silence_timeout_seconds": vad_timeout,
        "chat_model": chat_m,
        "stt_model": stt_m,
        "departments": departments_dump,
        "categories": categories_dump,
        "is_active": update_data.is_active if update_data.is_active is not None else True,
        "updated_at": now,
    }

    return AgentSettingResponse(
        id=updated_id,
        key="default",
        arabic_greeting=update_data.arabic_greeting,
        acknowledgment_message=ack_msg,
        clarification_message=clarify_msg,
        hangup_reassurance_message=hangup_msg,
        closing_message=closing_msg,
        english_greeting=en_greeting,
        english_acknowledgment_message=en_ack,
        english_clarification_message=en_clarify,
        english_hangup_reassurance_message=en_hangup,
        english_closing_message=en_closing,
        questions=[AgentQuestionItem(**q) for q in sorted_questions],
        tts_voice=voice,
        vad_silence_timeout_seconds=vad_timeout,
        chat_model=chat_m,
        stt_model=stt_m,
        departments=[DepartmentItem(**d) for d in departments_dump],
        categories=[CategoryItem(**c) for c in categories_dump],
        is_active=_cached_settings["is_active"],
        updated_at=now,
    )
