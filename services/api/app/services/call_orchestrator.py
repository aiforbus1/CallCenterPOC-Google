"""
LLM Call Orchestrator.

The central intelligence of the call center:
- Manages conversation state and history for active calls
- Orchestrates STT (Whisper) -> LLM (Gemini / OpenRouter with Function Calling) -> Neural TTS
- Controls voice directives (language, tone, pacing) and business tools (balance check, appointments, card status)
- Persists live transcripts and instant structured extractions
"""
import base64
import json
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.call import Call, Transcript, CallExtraction
from app.providers.conversation.base import ConversationMessage
from app.providers.conversation.openrouter_chat import OpenRouterChatProvider
from app.providers.stt.openrouter_stt import OpenRouterSTTProvider
from app.providers.tts.openrouter_tts import OpenRouterTTSProvider
from app.services.call_summarizer import generate_call_summary_and_extraction
from app.services.agent_settings_service import get_cached_agent_settings
from app.services.stt_corrector import GemmaTranscriptionCorrector

logger = logging.getLogger(__name__)


ORCHESTRATOR_SYSTEM_PROMPT = """أنت ضابط ومأمور عمليات شرطة النجدة المصرية 122 (غرفة عمليات وزارة الداخلية).
طبيعة عملك: استقبال بلاغات واستغاثات المواطنين وحوادث الطرق والمشاجرات والحرائق والسرقات وتوجيه الدوريات الأمنية والإسعاف فوراً لموقع البلاغ.
قواعد اللغة والتحدث الأساسية:
1. التحدث بلهجة مصرية عامية رسمية، هادئة، حاسمة، وتبعث على الطمأنينة والأمان (زي: شرطة النجدة معاك يا فندم، اطمن خالص، الدورية بتتحرك، تمام يا فندم، خليك في مكان آمن).
2. ممنوع تماماً استخدام لغة روبوتية أو فصحى جافة (متقولش أبداً: "أنا الذكاء الاصطناعي" أو "حسناً يا سيدي").
3. الرد يكون سريع وموجز وواضح جداً ومناسب لخطوط الطوارئ الصوتية (من جملة لـ جملتين، أقل من 30 كلمة).
4. استخدم الأدوات المتاحة حسب تفاصيل البلاغ:
   - dispatch_police_patrol: إخطار وتوجيه أقرب دورية أمنية وقسم الشرطة لموقع البلاغ
   - request_traffic_patrol: توجيه دورية مرور وونش لفتح الطريق وتأمين الحادث
   - notify_civil_defense: إخطار الحماية المدنية وسيارات الإطفاء في حالات الحريق والانهيارات
   - request_ambulance_support: طلب سيارة إسعاف فورية للمصابين
   - conclude_call: إنهاء المكالمة بتطمين المبلغ وتأكيد تحرك الدورية

قاعدة إلزامية حاسمة ولا تقبل الاستثناء نهائياً:
5. السؤالان الأول والثاني (اسم المتصل بالكامل، ورقم هاتف المتصل) إجباريان وإلزاميان 100% في بداية كل مكالمة:
   - السؤال الأول: اسم المتصل بالكامل (caller_name).
   - السؤال الثاني: رقم هاتف المتصل (phone_number).
   - ممنوع تماماً تجاوز أي منهما أو تأجيلهما أو الانتقال لأي سؤال آخر (مكان البلاغ، تفاصيل الحادث، إلخ) قبل الحصول على إجابة صحيحة وكاملة لكلا السؤالين.
   - إذا حاول المتصل التهرب، أو تجاوز السؤال، أو الحديث عن الحادث مباشرة، أو الصراخ والاستغاثة دون ذكر اسمه أو رقم هاتفه، أو قال "مش هقول اسمي"، يجب الإصرار عليه بحسم ولطف وطمأنته وإلزامه بالإجابة:
     "يا فندم إثبات اسم حضرتك بالكامل إلزامي ومطلوب قانوناً لتسجيل البلاغ. اسم حضرتك بالكامل إيه؟"
     "يا فندم رقم التليفون ضروري جداً للتواصل مع حضرتك فوراً ومتابعة وصول الدورية. رقم تليفون حضرتك كام؟"
   - لا تنتقل نهائياً لأي خطوة تالية قبل التأكد من اسم المتصل ورقم هاتفه.
"""

AVAILABLE_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "dispatch_police_patrol",
            "description": "Dispatch nearest police patrol and CID unit to incident location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "Detailed incident location and landmarks"
                    },
                    "incident_type": {
                        "type": "string",
                        "description": "Nature of incident (assault, brawl, theft, distress)"
                    }
                },
                "required": ["location", "incident_type"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "request_traffic_patrol",
            "description": "Dispatch traffic police unit and tow truck for road collisions and traffic congestion",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "Road or highway name and landmark"
                    },
                    "blocked_lanes": {
                        "type": "boolean",
                        "description": "Whether the road or lanes are blocked"
                    }
                },
                "required": ["location"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "notify_civil_defense",
            "description": "Dispatch civil defense firefighting and rescue units",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "Building address or location"
                    },
                    "emergency_type": {
                        "type": "string",
                        "enum": ["fire", "collapse", "gas_leak"],
                        "description": "Type of disaster or fire"
                    }
                },
                "required": ["location", "emergency_type"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "request_ambulance_support",
            "description": "Dispatch Egyptian Ambulance Authority vehicles for injured victims",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "Exact pickup location for ambulance"
                    },
                    "number_of_injured": {
                        "type": "integer",
                        "description": "Estimated count of injured people"
                    }
                },
                "required": ["location"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "conclude_call",
            "description": "Reassure the caller and conclude emergency call as patrol unit is en route",
            "parameters": {
                "type": "object",
                "properties": {
                    "farewell_reason": {
                        "type": "string",
                        "description": "Reason call is completed"
                    }
                },
                "required": []
            }
        }
    }
]


@dataclass
class ConversationContext:
    call_id: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_intent: str = "بلاغ طارئ لشرطة النجدة 122"
    extracted_info: Dict[str, Any] = field(default_factory=dict)
    missing_info: List[str] = field(default_factory=list)
    conversation_state: str = "INITIAL_GREETING"
    urgency_level: str = "Normal"
    next_action: str = "greet_and_listen"
    call_summary: str = ""


@dataclass
class OrchestratorTurnResult:
    user_text: str
    assistant_text: str
    audio_base64: Optional[str] = None
    language: str = "ar-EG"
    tool_action: Optional[str] = None
    should_end_call: bool = False
    options: List[str] = field(default_factory=list)
    conversation_state: str = "IN_PROGRESS"
    intent: Optional[str] = None
    urgency_level: str = "Normal"
    extracted_info: Dict[str, Any] = field(default_factory=dict)
    missing_info: List[str] = field(default_factory=list)
    call_summary: str = ""
    next_action: str = "ask_question"
    original_whisper: Optional[str] = None
    stt_corrector_model: Optional[str] = None
    stt_needs_review: bool = False
    stt_validation_reasons: List[str] = field(default_factory=list)


class CallOrchestrator:
    """
    Stateful conversational orchestrator for a single call session.
    Controls STT transcription, LLM reasoning, function execution, and TTS synthesis.
    """

    def __init__(
        self,
        call_id: str,
        customer_name: str = "Valued Customer",
        initial_language: str = "ar-EG",
        direction: str = "inbound",
        agent_settings: Optional[Dict[str, Any]] = None,
    ):
        self.call_id = call_id
        self.customer_name = customer_name
        self.language = initial_language
        self.direction = direction
        self.started_at = datetime.now(timezone.utc)
        self.extracted_caller_name: Optional[str] = None
        self.extracted_phone_number: Optional[str] = None

        # Load dynamic agent configuration (Arabic greeting, sentences, ordered questions, closing message)
        self.settings = agent_settings or get_cached_agent_settings()
        self.arabic_greeting = self.settings.get("arabic_greeting") or "شرطة النجدة 122 معاك يا فندم، اتفضل إيه البلاغ أو المشكلة؟"
        self.acknowledgment_message = self.settings.get("acknowledgment_message") or "تمام يا فندم، اطمن."
        self.clarification_message = self.settings.get("clarification_message") or "معلش يا فندم، الصوت مكنش واضح عندي خالص. ممكن تعيد عليا تاني بعد إذنك؟"
        self.hangup_reassurance_message = self.settings.get("hangup_reassurance_message") or "تحت أمرك يا فندم، اطمن الدورية في طريقها لموقع البلاغ فوراً، وخليك في مكان آمن."
        self.closing_message = self.settings.get("closing_message") or "اطمن يا فندم، تم إخطار أقرب دورية أمنية وقسم الشرطة المختص بالتحرك فوراً لموقع البلاغ. خليك في مكان آمن، ومعاك شرطة النجدة."

        self.english_greeting = self.settings.get("english_greeting") or "Egyptian Police Emergency Hotline 122. Please state your emergency?"
        self.english_acknowledgment_message = self.settings.get("english_acknowledgment_message") or "Understood, stay calm."
        self.english_clarification_message = self.settings.get("english_clarification_message") or "I am sorry, the audio was not clear. Could you please repeat?"
        self.english_hangup_reassurance_message = self.settings.get("english_hangup_reassurance_message") or "You are in good hands. The police patrol is en route immediately. Stay safe!"
        self.english_closing_message = self.settings.get("english_closing_message") or "All your emergency report details have been dispatched to the nearest police patrol unit. Stay in a safe place, emergency services are en route!"

        raw_questions = self.settings.get("questions")
        if raw_questions:
            self.questions = sorted(list(raw_questions), key=lambda q: q.get("order", 1))
        else:
            self.questions = [
                {
                    "id": "q_caller_name",
                    "order": 1,
                    "text": "اسم حضرتك بالكامل يا فندم لإثبات البلاغ؟",
                    "english_text": "What is your full name, sir, to register the emergency report?",
                    "field_key": "caller_name",
                    "is_required": True,
                    "options": [],
                },
                {
                    "id": "q_phone_number",
                    "order": 2,
                    "text": "رقم تليفون حضرتك للتواصل ومتابعة تحرك الدورية الأمنية؟",
                    "english_text": "What is your contact phone number to follow up on the dispatched police patrol?",
                    "field_key": "phone_number",
                    "is_required": True,
                    "options": [],
                },
            ]

        # Question queue: start with the top-level questions
        self.question_queue: List[Dict[str, Any]] = list(self.questions)
        self.current_question: Optional[Dict[str, Any]] = None
        self.enable_free_speech_qa: bool = self.settings.get("enable_free_speech_qa", True)

        init_name = self.customer_name if (self.customer_name and self.customer_name != "Valued Customer") else None
        self.context = ConversationContext(
            call_id=self.call_id,
            customer_name=init_name,
            customer_phone=None,
            customer_intent="بلاغ طارئ لشرطة النجدة 122",
            extracted_info={},
            missing_info=["اسم المتصل", "رقم التليفون", "موقع البلاغ بالتفصيل"],
            conversation_state="INITIAL_GREETING",
            urgency_level="Normal",
            next_action="greet_and_listen",
            call_summary="",
        )

        # Build dynamic system prompt with the ordered questions and closing confirm message
        system_content = ORCHESTRATOR_SYSTEM_PROMPT

        if self.questions:
            is_ar = self.language.startswith("ar")
            if is_ar:
                questions_list_str = "\n".join([f"السؤال {idx + 1}: {q.get('text')}" for idx, q in enumerate(self.questions)])
                system_content += f"""
قائمة الأسئلة المطلوب طرحها على المتصل خطوة بخطوة بالترتيب المحدد:
{questions_list_str}

رسالة تأكيد تحرك الدورية والختام لإنهاء المكالمة:
"{self.closing_message}"

قواعد سيناريو الحوار الإلزامية:
1. أنت تبدأ بالترحيب الرسمي لشرطة النجدة 122 متبوعاً بالسؤال الأول الإلزامي (اسم المتصل بالكامل).
2. السؤال الثاني الإلزامي هو رقم هاتف المتصل. ممنوع تماماً الانتقال للسؤال الثالث أو أي أسئلة أخرى قبل الإجابة التامة على السؤالين الأول والثاني، مع الإصرار الحازم على المتصل إذا حاول التهرب أو الحديث في تفاصيل الحادث دون ذكر اسمه ورقم هاتفه.
3. عند إجابة المتصل، استقبل إجابته بالعبارة التالية: "{self.acknowledgment_message}".
4. اطرح السؤال التالي في الترتيب المحدد مباشرة.
5. اطرح سؤالاً واحداً فقط في كل رد، ولا تقفز ولا تكرر سؤالاً تمت الإجابة عليه.
6. بمجرد أن يجيب المتصل على السؤال الأخير في القائمة، انطق رسالة تأكيد إخطار الدورية والختام لإغلاق الخط فوراً:
"{self.closing_message}"
"""
            else:
                questions_list_str = "\n".join([f"Question {idx + 1}: {q.get('english_text') or q.get('text')}" for idx, q in enumerate(self.questions)])
                system_content += f"""
List of emergency questions to ask the caller step-by-step in the specified order:
{questions_list_str}

Confirmation closing and dispatch message:
"{self.english_closing_message}"

Mandatory Dialogue rules:
1. Start with the official 122 Egyptian Police hotline greeting followed by mandatory Question #1 (Caller Full Name).
2. Question #2 (Caller Phone Number) is strictly mandatory. Never advance to subsequent questions before getting valid answers for both Question #1 and Question #2. Insist firmly if caller attempts to bypass.
3. Upon caller's answer, acknowledge with: "{self.english_acknowledgment_message}".
4. Ask the next question in the exact specified order.
5. Ask only one question per turn.
6. Once the last question is answered, speak the closing message and conclude:
"{self.english_closing_message}"
"""

        self.messages: List[ConversationMessage] = [
            ConversationMessage(role="system", content=system_content)
        ]

        self.turns: List[Dict[str, Any]] = []

        # Service providers configured with dynamic model selection
        stt_m = self.settings.get("stt_model")
        chat_m = self.settings.get("chat_model")
        self.stt = OpenRouterSTTProvider(model=stt_m)
        self.tts = OpenRouterTTSProvider()
        self.chat = OpenRouterChatProvider(model=chat_m)
        self.stt_corrector = GemmaTranscriptionCorrector()

    def _get_current_question_options(self) -> List[str]:
        if not self.current_question:
            return []
        raw_options = self.current_question.get("options") or []
        is_ar = self.language.startswith("ar")
        result = []
        for opt in raw_options:
            label = opt.get("label") if is_ar else (opt.get("english_label") or opt.get("label"))
            if label:
                result.append(str(label).strip())
        return result

    def get_initial_greeting(self) -> OrchestratorTurnResult:
        """Generate the opening greeting and initial question from the AI assistant."""
        is_ar = self.language.startswith("ar")
        first_q_text = ""
        if self.question_queue:
            self.current_question = self.question_queue.pop(0)
            if is_ar:
                first_q_text = (self.current_question.get("text") or "").strip()
            else:
                first_q_text = (self.current_question.get("english_text") or self.current_question.get("text") or "").strip()

        if is_ar:
            greeting_text = self.arabic_greeting.strip()
            if first_q_text:
                greeting_text = f"{greeting_text} {first_q_text}"
        else:
            greeting_text = self.english_greeting.strip()
            if first_q_text:
                greeting_text = f"{greeting_text} {first_q_text}"

        self.context.conversation_state = "INITIAL_GREETING"
        self._record_assistant_turn(greeting_text)
        return OrchestratorTurnResult(
            user_text="",
            assistant_text=greeting_text,
            language=self.language,
            should_end_call=False,
            options=self._get_current_question_options(),
            conversation_state="INITIAL_GREETING",
            intent=getattr(self.context, "customer_intent", None),
            urgency_level=getattr(self.context, "urgency_level", "Normal"),
            extracted_info=getattr(self.context, "extracted_info", {}),
            missing_info=getattr(self.context, "missing_info", []),
            call_summary=getattr(self.context, "call_summary", ""),
            next_action="ask_question" if first_q_text else "greet_and_listen",
        )


    async def process_caller_audio(
        self,
        audio_bytes: bytes,
        audio_format: str = "wav",
    ) -> OrchestratorTurnResult:
        """
        Step 1: Ingest caller audio & transcribe via STT (Whisper Large V3).
        Step 2: Dispatch to LLM reasoning & tool execution.
        Step 3: Synthesize voice reply via TTS.
        """
        user_text = ""
        try:
            stt_res = await self.stt.transcribe(
                audio_data=audio_bytes,
                audio_format=audio_format,
                language=self.language,
            )
            raw_text = (stt_res.text or "").strip()
            if stt_res.language and stt_res.language.startswith("ar"):
                self.language = "ar-EG"
            elif stt_res.language and stt_res.language.startswith("en"):
                self.language = "en"

            # Post-STT dialectal & phonetic correction strictly with google/gemma-4-26b-a4b-it
            stt_needs_review = False
            stt_validation_reasons = []
            if raw_text:
                corr_res = await self.stt_corrector.correct_transcription(raw_text, language=self.language)
                user_text = str(corr_res)
                stt_needs_review = bool(getattr(corr_res, "needs_review", False))
                stt_validation_reasons = list(getattr(corr_res, "reasons", []))
            else:
                user_text = ""
        except Exception as e:
            logger.warning(f"Orchestrator STT exception for call {self.call_id}: {e}")
            stt_needs_review = True
            stt_validation_reasons = [f"STT Exception: {e}"]

        if not user_text:
            is_ar = self.language.startswith("ar")
            fallback_text = (
                self.clarification_message
                if is_ar
                else self.english_clarification_message
            )
            return await self._synthesize_result(user_text="", assistant_text=fallback_text)

        turn_res = await self.process_caller_text(user_text, raw_text=raw_text)
        turn_res.original_whisper = raw_text
        turn_res.stt_corrector_model = self.stt_corrector.model
        turn_res.stt_needs_review = stt_needs_review
        turn_res.stt_validation_reasons = stt_validation_reasons
        return turn_res

    async def _correct_transcription_with_llm(self, raw_text: str) -> str:
        """
        Refines and corrects raw Whisper STT transcription using Gemma 4 26B (google/gemma-4-26b-a4b-it).
        Fixes phonetic dialect mishearings, Egyptian landmarks/streets, and digit formats,
        while strictly preserving caller intent without hallucination.
        """
        raw_text = (raw_text or "").strip()
        if not raw_text or len(raw_text) < 2:
            return raw_text

        is_ar = self.language.startswith("ar")
        if is_ar:
            prompt = f"""أنت مصحح ومدقق نصوص صوتية عالي الدقة لغرفة عمليات شرطة النجدة 122.
المهمة: تدقيق وتصحيح النص المستخرج من نموذج التعرف الصوتي (Whisper STT)، وتصحيح أي أخطاء صوتية أو إملائية ناتجة عن اللهجة المصرية الدارجة، أسماء المناطق والمحافظات والشوارع، أو أرقام التليفونات.

النص الخام من Whisper:
"{raw_text}"

القواعد الإلزامية:
1. احتفظ بنفس معنى وكلام المتصل تماماً، وممنوع نهائياً تأليف أو إضافة أي معلومات جديدة لم يقلها.
2. صحح الكلمات التي سمعها Whisper بالخطأ وفق سياق اللهجة المصرية العامية.
3. إذا نطق المتصل أرقاماً (مثل رقم هاتف)، اكتبها كأرقام واضحة (مثال: 01012345678).
4. أخرج النص المصحح النهائي فقط بدون أي مقدمات أو شروحات أو علامات تنصيص."""
        else:
            prompt = f"""You are a speech-to-text post-correction assistant for an emergency police dispatch hotline.
Task: Clean up and correct phonetic errors, numbers, and mishearings from the raw Whisper output.
Raw Whisper text: "{raw_text}"
Rules:
1. Strictly preserve the caller's exact meaning. Do not invent or add new details.
2. Fix phonetic errors, slangs, numbers, and Egyptian location names.
3. Output ONLY the corrected text, with no quotes or explanations."""

        try:
            resp = await self.chat.chat(
                messages=[ConversationMessage(role="user", content=prompt)],
                max_tokens=256,
                temperature=0.1,
            )
            corrected = (resp.text or "").strip()
            # Strip markdown quotes or symbols
            if (corrected.startswith('"') and corrected.endswith('"')) or (corrected.startswith("'") and corrected.endswith("'")):
                corrected = corrected[1:-1].strip()
            if corrected.startswith('«') and corrected.endswith('»'):
                corrected = corrected[1:-1].strip()
            if corrected:
                logger.info(
                    f"Whisper STT post-correction [{self.chat.model}]: '{raw_text}' -> '{corrected}'"
                )
                return corrected
        except Exception as e:
            logger.warning(f"Error in Whisper STT post-correction via LLM: {e}")

        return raw_text

    async def process_caller_text(self, user_text: str, raw_text: Optional[str] = None) -> OrchestratorTurnResult:
        """
        Processes a caller turn through the LLM brain:
        1. Appends user input to conversation context.
        2. Detects intent / language.
        3. Evaluates tool calls.
        4. Synthesizes voice audio response.
        """
        user_text = user_text.strip()
        self._record_user_turn(user_text)

        # Detect language
        has_arabic = any("\u0600" <= c <= "\u06FF" for c in user_text)
        if has_arabic:
            self.language = "ar-EG"
        elif any(c.isalpha() for c in user_text):
            # Check if majority english
            self.language = "en" if not has_arabic else self.language

        # LLM reasoning with tool calling (passing both corrected text and raw speech)
        assistant_reply, tool_action, should_end = await self._run_llm_reasoning(user_text, raw_input=raw_text)
        self._record_assistant_turn(assistant_reply)

        # Synthesize TTS
        return await self._synthesize_result(
            user_text=user_text,
            assistant_text=assistant_reply,
            tool_action=tool_action,
            should_end_call=should_end,
        )

    async def _run_llm_reasoning(self, latest_input: str, raw_input: Optional[str] = None) -> tuple[str, Optional[str], bool]:
        """
        Executes LLM chat completion with business tools.
        Falls back to local conversational engine if remote API key is unavailable.
        """
        tool_action = None
        should_end = False

        # 1. Check for explicit caller hangup / goodbye request
        # Polite phrases (e.g. 'شكرا', 'thank you') and greetings (e.g. 'سلام عليكم')
        # must NEVER prematurely terminate an emergency police hotline call!
        lower_input = latest_input.lower()
        lower_raw = (raw_input or "").lower()
        EXPLICIT_HANGUP_PHRASES = [
            "مع السلامة", "مع الف سلامة", "سلام يا فندم", "باي", "باي باي",
            "goodbye", "bye bye", "bye", "hang up", "end call"
        ]
        stripped_input = lower_input.strip()
        is_explicit_hangup = (
            stripped_input in EXPLICIT_HANGUP_PHRASES
            or (any(stripped_input.endswith(p) for p in EXPLICIT_HANGUP_PHRASES) and len(stripped_input.split()) <= 3)
        )
        if is_explicit_hangup:
            should_end = True
            tool_action = "conclude_call"
            is_ar = self.language.startswith("ar")
            reply = (
                self.hangup_reassurance_message
                if is_ar
                else self.english_hangup_reassurance_message
            )
            return reply, tool_action, should_end

        # 2. Check for caller hesitation / hold request ("لحظة واحدة", "ثواني", "استنى", "wait", "hold on", etc.)
        # Prevents initiating the next question prematurely while the caller is asking to hold on or find details
        HOLD_PATTERNS = [
            "لحظة", "ثواني", "ثانيه", "استنى", "استنى معايا", "خليك معايا", "دقيقة", "دقيقه",
            "على مهلك", "ثانية واحدة", "لحظة واحدة", "معايا على الخط", "ثواني بس", "لحظة بس",
            "wait", "hold on", "one second", "just a second", "give me a moment", "one moment"
        ]
        if any(p in lower_input for p in HOLD_PATTERNS):
            is_ar = self.language.startswith("ar")
            reply = (
                "معاك يا فندم، اتفضل براحتك سامعك ومتابع معاك."
                if is_ar
                else "Take your time, I am on the line with you."
            )
            return reply, tool_action, should_end

        # 3. Free-Speech QA Validation:
        # Validate whether the caller's message actually answers the current question.
        # If the caller spoke off-topic, asked a side question, or expressed distress/confusion,
        # have the LLM address their message contextually and confirm returning to the required question.
        if self.current_question and getattr(self, "enable_free_speech_qa", True):
            is_answering, guidance_reply = await self._validate_caller_answer(latest_input, self.current_question)
            if not is_answering and guidance_reply:
                logger.info(
                    f"Caller utterance did not answer current question '{self.current_question.get('field_key') or self.current_question.get('text')}'. "
                    f"Replying with conversational guidance and confirming question."
                )
                return guidance_reply, tool_action, should_end

        # 4. Check if the answered question had options with sub-questions
        if self.current_question:
            options = self.current_question.get("options") or []
            matched_sub_questions = []
            matched_opt = None
            if options:
                # 4a. Quick direct string & keyword matching (checking both corrected and raw speech)
                for opt in options:
                    keywords = opt.get("keywords") or []
                    opt_label = (opt.get("label") or "").lower()
                    opt_en_label = (opt.get("english_label") or "").lower()
                    if opt_label and (opt_label in lower_input or (lower_raw and opt_label in lower_raw)):
                        matched_opt = opt
                        break
                    elif opt_en_label and (opt_en_label in lower_input or (lower_raw and opt_en_label in lower_raw)):
                        matched_opt = opt
                        break
                    elif keywords and any((k.lower() in lower_input or (lower_raw and k.lower() in lower_raw)) for k in keywords if k):
                        matched_opt = opt
                        break

                # 4b. Gemma Semantic Option Matcher (passes both corrected text and raw Whisper speech)
                if not matched_opt:
                    matched_opt = await self._match_option_with_gemma(latest_input, options, raw_speech=raw_input)

                if matched_opt:
                    sub_qs = matched_opt.get("sub_questions") or []
                    if sub_qs:
                        sorted_sub_qs = sorted(sub_qs, key=lambda sq: sq.get("order", 1))
                        matched_sub_questions.extend(sorted_sub_qs)
                        logger.info(
                            f"Matched answer option '{matched_opt.get('label')}' / '{matched_opt.get('english_label')}': prepending {len(sorted_sub_qs)} recursive sub-questions to question queue."
                        )
                elif self.current_question.get("field_key") == "incident_type" and not self.question_queue:
                    # Do NOT conclude the call if incident type was ambiguous or unmatched!
                    is_ar = self.language.startswith("ar")
                    clarification = (
                        "يا فندم معلش وضح لي طبيعة البلاغ أكتر: مشاجرة، ولا حادث تصادم، ولا حريق، ولا استغاثة؟"
                        if is_ar
                        else "Sir, please clarify your emergency: is it a brawl, traffic crash, fire, or distress?"
                    )
                    return clarification, tool_action, should_end

            # Prepend recursive sub-questions to the front of the queue
            if matched_sub_questions:
                self.question_queue = list(matched_sub_questions) + self.question_queue

        # 5. Dynamic Question Progression: Pop the next question from the queue
        if self.question_queue:
            answered_question = self.current_question
            self.current_question = self.question_queue.pop(0)
            is_ar = self.language.startswith("ar")
            if is_ar:
                next_q = (self.current_question.get("text") or "").strip()
                # Acknowledgment responds to the question that was JUST answered by the caller!
                ack_prefix = (
                    (answered_question.get("acknowledgment_prefix") if answered_question else None)
                    or self.acknowledgment_message
                )
                ack_prefix = (ack_prefix or "").strip()
                reply = f"{ack_prefix} {next_q}" if ack_prefix else next_q
            else:
                next_q = (self.current_question.get("english_text") or self.current_question.get("text") or "").strip()
                ack_prefix = (
                    (answered_question.get("english_acknowledgment_prefix") if answered_question else None)
                    or self.english_acknowledgment_message
                )
                ack_prefix = (ack_prefix or "").strip()
                reply = f"{ack_prefix} {next_q}" if ack_prefix else next_q
            return reply, tool_action, should_end

        # 6. Final Step: All questions and sub-questions have now been answered!
        # Deliver the closing confirmation message and close the call!
        self.current_question = None
        should_end = True
        tool_action = "conclude_call"
        is_ar = self.language.startswith("ar")
        reply = (
            self.closing_message
            if is_ar
            else self.english_closing_message
        )
        return reply, tool_action, should_end

    async def _match_option_with_gemma(
        self,
        user_speech: str,
        options: List[Dict[str, Any]],
        raw_speech: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Uses Gemma 4 26B (google/gemma-4-26b-a4b-it) to semantically classify caller speech
        into one of the emergency scenario options (handling Egyptian dialect, typos like 'مشغرة' -> 'مشاجرة', and synonyms).
        Accepts both corrected text and raw speech for optimal context.
        """
        if not options or not (user_speech or raw_speech):
            return None

        # Build options summary
        opts_summary = []
        for opt in options:
            opts_summary.append({
                "id": opt.get("id"),
                "label": opt.get("label"),
                "keywords": (opt.get("keywords") or [])[:6],
            })

        speech_context = f'كلام المتصل (بعد التدقيق): "{(user_speech or "").strip()}"'
        if raw_speech and raw_speech.strip() and raw_speech.strip() != (user_speech or "").strip():
            speech_context += f'\nكلام المتصل الأصلي من الصوت (Whisper الخام): "{raw_speech.strip()}"'

        prompt = f"""أنت نظام تصنيف وتوجيه بلاغات طوارئ شرطة النجدة المصرية 122.
{speech_context}

قائمة خيارات البلاغات المتاحة:
{json.dumps(opts_summary, ensure_ascii=False, indent=2)}

المطلوب بدقة:
اختر الخيار الأنسب من القائمة الذي يعبر عن بلاغ المتصل (مع مراعاة اللهجة المصرية والأخطاء الصوتية مثل 'مشغرة' أو 'خناقة' أو 'عراك' = مشاجرة، 'خبطت' أو 'اتقلبت' أو 'عربية مقلوبة' = حادث تصادم أو انقلاب، 'المحل بيولع' أو 'نار' = حريق، 'ابني ضاع' = طفل مفقود، 'الشارع غرقان' = تجمع مياه).
أخرج JSON فقط بدون ماركداون:
{{"matched_id": "opt_id أو null إذا لم يذكر أي بلاغ"}}"""

        try:
            resp = await self.chat.chat(
                messages=[ConversationMessage(role="user", content=prompt)],
                max_tokens=64,
                temperature=0.1,
            )
            raw = (resp.text or "").strip()
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
                matched_id = data.get("matched_id")
                if matched_id and matched_id != "null":
                    for opt in options:
                        if opt.get("id") == matched_id:
                            logger.info(f"Gemma semantically matched caller speech '{user_speech}' -> option '{opt.get('label')}' ({matched_id})")
                            return opt
        except Exception as e:
            logger.warning(f"Error in Gemma option matcher: {e}")

        return None

    async def _validate_caller_answer(
        self,
        user_speech: str,
        current_question: Dict[str, Any],
    ) -> tuple[bool, str]:
        """
        Validates whether the caller's speech answers the current active question using LLM.
        If the caller replied with free speech, an off-topic question, confusion, or distress:
        - returns (False, contextual_reply) where contextual_reply answers the caller's message
          and confirms returning to the required question.
        - returns (True, "") if the caller answered the question.
        """
        is_ar = self.language.startswith("ar")
        if is_ar:
            q_text = (current_question.get("text") or "").strip()
        else:
            q_text = (current_question.get("english_text") or current_question.get("text") or "").strip()

        if not q_text or not user_speech.strip():
            return True, ""

        field_key = current_question.get("field_key", "")

        # Dedicated strict prompts for mandatory first two questions: caller_name and phone_number
        if field_key == "caller_name":
            if is_ar:
                prompt = f"""أنت مقيم طوارئ شرطة النجدة المصرية 122.
السؤال المطلوب إلزامي تماماً ولا يمكن تجاوزه نهائياً: اسم المتصل بالكامل لإثبات البلاغ.
كلام المتصل الأخير: "{user_speech.strip()}"

قواعد الفحص الصارمة:
1. هل ذكر المتصل اسمه الشخصي بوضوح (اسم ثنائي أو ثلاثي مثل "أحمد محمد" أو "اسمي إبراهيم حسن" أو "أنا محمود")؟
   - نعم ذكر اسمه الشخصي: اجعل is_answering = true, reply = "".
   - لا، لم يذكر اسمه، أو تحدث عن الحادث أو الجريمة (مثل "فيه خناقة"، "الحقوني"، "في شارع فيصل"، "واحد انضرب")، أو استغاث أو قال "مش هقول اسمي" أو حاول التهرب: اجعل is_answering = false فوراً!
2. إذا كان is_answering = false:
   اكتب رداً مصرياً رسمياً هادئاً وحاسماً (أقل من 30 كلمة) يطمئنه ويصر على معرفة الاسم أولاً:
   "يا فندم إثبات اسم حضرتك بالكامل إلزامي ومطلوب قانوناً لتسجيل البلاغ. اسم حضرتك بالكامل إيه؟"

أخرج JSON فقط بدون ماركداون: {{"is_answering": true/false, "reply": "..."}}"""
            else:
                prompt = f"""You are an emergency police dispatcher for Egyptian Police 122 hotline.
Mandatory question: Caller Full Name.
Caller speech: "{user_speech.strip()}"

Rules:
1. Did the caller provide their personal name?
   - Yes: is_answering = true, reply = ""
   - No (they described the incident, shouted for help, gave location, or bypassed name): is_answering = false!
2. If is_answering = false:
   Reply insisting on getting their full name first: "Stay safe, patrol is on the way, but providing your full name is legally required to register the report. What is your full name, sir?"

Output strictly valid JSON: {{"is_answering": true/false, "reply": "..."}}"""

        elif field_key == "phone_number":
            if is_ar:
                prompt = f"""أنت مقيم طوارئ شرطة النجدة المصرية 122.
السؤال المطلوب إلزامي تماماً ولا يمكن تجاوزه نهائياً: رقم هاتف المتصل للتواصل ومتابعة تحرك الدورية الأمنية.
كلام المتصل الأخير: "{user_speech.strip()}"

قواعد الفحص الصارمة:
1. هل ذكر المتصل أرقام هاتفه (أرقام تليفون محمول أو أرضي كأرقام أو كلمات أرقام مثل 010... أو 011... أو 012...)؟
   - نعم ذكر رقم هاتف: اجعل is_answering = true, reply = "".
   - لا، لم يذكر رقم تليفون، أو تحدث عن مكان الحادث أو تفاصيله أو كرر الاستغاثة: اجعل is_answering = false فوراً!
2. إذا كان is_answering = false:
   اكتب رداً مصرياً رسمياً هادئاً وحاسماً (أقل من 30 كلمة) يطمئنه ويصر على رقم الهاتف:
   "يا فندم رقم التليفون ضروري وإلزامي جداً للتواصل مع حضرتك فوراً ومتابعة وصول الدورية. رقم تليفون حضرتك كام؟"

أخرج JSON فقط بدون ماركداون: {{"is_answering": true/false, "reply": "..."}}"""
            else:
                prompt = f"""You are an emergency police dispatcher for Egyptian Police 122 hotline.
Mandatory question: Caller Contact Phone Number.
Caller speech: "{user_speech.strip()}"

Rules:
1. Did the caller provide phone numbers/digits?
   - Yes: is_answering = true, reply = ""
   - No: is_answering = false!
2. If is_answering = false:
   Reply insisting on their phone number: "Your contact phone number is mandatory to coordinate with you and dispatch the patrol. What is your phone number, sir?"

Output strictly valid JSON: {{"is_answering": true/false, "reply": "..."}}"""

        elif is_ar:
            prompt = f"""أنت مقيم ومأمور عمليات طوارئ شرطة النجدة المصرية 122.
السؤال المطلوب حالياً من المتصل للإجابة عليه هو:
"{q_text}"

كلام المتصل الأخير:
"{user_speech.strip()}"

المطلوب بدقة:
1. تحقق هل كلام المتصل الأخير يعتبر إجابة (أو محاولة إجابة مباشرة) على السؤال المطلوب ("{q_text}")؟
   - إذا كان يقدم معلومة تجيب على السؤال: اجعل is_answering = true.
   - إذا كان كلامه لا يجيب على السؤال (مثل: استفسار عن الخدمة، تساؤل "انتوا مين؟"، استغاثة أو خوف دون ذكر الإجابة، كلام في موضوع آخر، سؤال عن وصول النجدة، اعتراض، إلخ): اجعل is_answering = false.
2. إذا كان is_answering = false:
   صغ رداً فورياً (reply) باللهجة المصرية العامية الرسمية الهادئة والمطمئنة (أقل من 35 كلمة):
   - أجب مباشرة على ما قاله المتصل أو استفساره أو طمأنه بحسم وهدوء.
   - ثم أكد العودة لسؤال البلاغ واطرح عليه السؤال المطلوب ("{q_text}") بلباقة وحزم لجمع البيانات وتوجيه الدورية.
   إذا كان is_answering = true: اترك reply فارغاً ("").

أخرج النتيجة بصيغة JSON فقط بدون أي علامات ماركداون:
{{"is_answering": true/false, "reply": "..."}}
"""
        else:
            prompt = f"""You are an emergency police dispatcher and conversational validator for Egyptian Police 122 hotline.
Current required emergency question asked to caller:
"{q_text}"

Caller's latest speech:
"{user_speech.strip()}"

Task:
1. Check whether the caller's latest response answers (or directly attempts to answer) the required question ("{q_text}"):
   - Set is_answering = true if the caller provided an answer or relevant details for the question.
   - Set is_answering = false if the caller spoke about something else, asked an unrelated question (e.g. "Who are you?", "Are you coming?", "How long will it take?"), expressed panic without answering, or replied off-topic.
2. If is_answering = false:
   Provide a concise professional reply (reply) in emergency dispatcher tone (under 35 words):
   - Directly answer or reassure what the caller mentioned.
   - Then confirm and steer back to the required question ("{q_text}") to collect required emergency details.
   If is_answering = true: leave reply empty ("").

Output strictly valid JSON:
{{"is_answering": true/false, "reply": "..."}}
"""

        try:
            resp = await self.chat.chat(
                [ConversationMessage(role="user", content=prompt)],
                max_tokens=220,
                temperature=0.1,
            )
            raw_content = (resp.text or "").strip()
            match = re.search(r"\{.*\}", raw_content, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
                is_answering = bool(data.get("is_answering", True))
                guidance_reply = str(data.get("reply") or "").strip()
                return is_answering, guidance_reply
        except Exception as e:
            logger.warning(f"Free-speech QA validation LLM call error: {e}. Using heuristic fallback.")

        return self._heuristic_answer_validation(user_speech, q_text, is_ar, field_key)

    def _heuristic_answer_validation(
        self,
        user_speech: str,
        q_text: str,
        is_ar: bool,
        field_key: str = "",
    ) -> tuple[bool, str]:
        """Heuristic rule fallback when remote LLM validation is offline."""
        lower_speech = user_speech.lower().strip()

        # Dedicated heuristics for mandatory questions
        if field_key == "caller_name":
            incident_words = ["خناقة", "حادث", "حادثة", "حريق", "نار", "سرقة", "قتل", "ضرب", "شارع", "الحقوني", "انقذوني", "مش هقول", "بسرعة", "تعالوا", "عربية", "إسعاف"]
            if any(w in lower_speech for w in incident_words) or len(user_speech.strip().split()) < 2:
                if not any(k in lower_speech for k in ["اسمي", "أنا اسمي", "انا اسمي", "معاك"]):
                    fallback = "يا فندم إثبات اسم حضرتك بالكامل إلزامي ومطلوب قانوناً لتسجيل البلاغ. اسم حضرتك بالكامل إيه؟" if is_ar else "Providing your full name is mandatory to register the report. What is your full name, sir?"
                    return False, fallback

        if field_key == "phone_number":
            has_digits = bool(re.search(r'[\d٠-٩]{5,}', user_speech))
            num_words = ["صفر", "واحد", "اتنين", "تلاتة", "أربعة", "خمسة", "ستة", "سبعة", "تمانية", "تسعة", "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]
            has_num_words = sum(1 for w in num_words if w in lower_speech) >= 4
            if not (has_digits or has_num_words):
                fallback = "يا فندم رقم التليفون ضروري وإلزامي جداً للتواصل مع حضرتك ومتابعة وصول الدورية فوراً. رقم تليفون حضرتك كام بعد إذنك؟" if is_ar else "A contact phone number is mandatory to coordinate with you and dispatch the patrol. What is your phone number, sir?"
                return False, fallback

        question_indicators_ar = ["مين", "إيه", "ليه", "فين", "إمتى", "ازاي", "ازاى", "هتيجوا", "بجد", "ألو", "سامعني", "؟", "?"]
        question_indicators_en = ["who", "what", "why", "where", "when", "how", "are you", "is this", "will you", "?"]

        indicators = question_indicators_ar if is_ar else question_indicators_en
        if any(ind in lower_speech for ind in indicators):
            if is_ar:
                fallback_reply = f"معاك شرطة النجدة 122 يا فندم والدورية جاهزة للتحرك فوراً، اطمن. وعشان نلحق نساعدك، محتاجين نحدد: {q_text}"
            else:
                fallback_reply = f"Egyptian Police 122 dispatcher, we are on the line to assist you. To dispatch help immediately, please confirm: {q_text}"
            return False, fallback_reply

        return True, ""



    async def _synthesize_result(
        self,
        user_text: str,
        assistant_text: str,
        tool_action: Optional[str] = None,
        should_end_call: bool = False,
    ) -> OrchestratorTurnResult:
        """Synthesize assistant response into audio bytes (MP3/PCM) for the caller."""
        audio_b64 = None
        try:
            cached = get_cached_agent_settings()
            voice = cached.get("tts_voice") or "Aoede"
            tts_res = await self.tts.synthesize(
                text=assistant_text,
                language=self.language,
                voice=voice,
            )
            if tts_res and tts_res.audio_data:
                audio_b64 = base64.b64encode(tts_res.audio_data).decode("utf-8")
        except Exception as e:
            logger.warning(f"Orchestrator TTS synthesis exception: {e}")

        options = self._get_current_question_options() if not should_end_call else []
        return OrchestratorTurnResult(
            user_text=user_text,
            assistant_text=assistant_text,
            audio_base64=audio_b64,
            language=self.language,
            tool_action=tool_action,
            should_end_call=should_end_call,
            options=options,
            conversation_state="COMPLETED" if should_end_call else "AI_SPEAKING",
            intent=getattr(self.context, "customer_intent", None),
            urgency_level=getattr(self.context, "urgency_level", "Normal"),
            extracted_info=getattr(self.context, "extracted_info", {}),
            missing_info=getattr(self.context, "missing_info", []),
            call_summary=getattr(self.context, "call_summary", ""),
            next_action="conclude_call" if should_end_call else "ask_question",
        )

    def _record_user_turn(self, text: str):
        self.messages.append(ConversationMessage(role="user", content=text))
        self.turns.append({
            "speaker": "Caller",
            "text": text,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    def _record_assistant_turn(self, text: str):
        self.messages.append(ConversationMessage(role="assistant", content=text))
        self.turns.append({
            "speaker": "AI Assistant",
            "text": text,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    def get_full_transcript_text(self) -> str:
        lines = []
        for t in self.turns:
            lines.append(f"{t['speaker']}: {t['text']}")
        return "\n".join(lines)

    async def finalize_call(self, final_status: str = "completed") -> None:
        """
        Finalize the call in PostgreSQL:
        - Updates call status, duration, and ended_at
        - Persists complete transcript
        - Triggers instant AI executive summary and structured intent extraction
        """
        duration = int((datetime.now(timezone.utc) - self.started_at).total_seconds())
        transcript_text = self.get_full_transcript_text()

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Call).where(Call.id == self.call_id))
            call = result.scalar_one_or_none()
            if not call:
                return

            call.status = final_status
            call.ended_at = datetime.now(timezone.utc)
            call.duration_seconds = duration
            call.processing_status = "completed"

            # Upsert transcript
            t_res = await db.execute(select(Transcript).where(Transcript.call_id == call.id))
            t_obj = t_res.scalar_one_or_none()
            if not t_obj:
                t_obj = Transcript(
                    call_id=call.id,
                    provider="orchestrator",
                    model=settings.OPENROUTER_CHAT_MODEL,
                    language=self.language,
                    transcript_text=transcript_text,
                    transcription_status="completed",
                )
                db.add(t_obj)
            else:
                t_obj.transcript_text = transcript_text
                t_obj.transcription_status = "completed"

            # Generate AI summary & CallExtraction
            await generate_call_summary_and_extraction(call, transcript_text, db)
            await db.commit()
            logger.info(f"Call {self.call_id} successfully finalized by LLM Orchestrator (duration: {duration}s)")
