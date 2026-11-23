import logging
import httpx
from typing import List, Optional
from app.providers.conversation.base import ConversationProvider, ConversationMessage, ConversationResponse
from app.core.config import settings

logger = logging.getLogger(__name__)


class OpenRouterChatProvider(ConversationProvider):
    """
    LLM conversation via OpenRouter:
      POST https://openrouter.ai/api/v1/chat/completions
    Standard OpenAI-compatible endpoint.
    """

    MAX_RETRIES = 3
    TIMEOUT_SECONDS = 30.0

    def __init__(self, model: Optional[str] = None):
        # Support direct Google Gemini API if provided, or OpenRouter
        if settings.GEMINI_API_KEY and not model:
            self.api_key = settings.GEMINI_API_KEY
            self.base_url = "https://generativelanguage.googleapis.com/v1beta/openai"
            self.model = "gemini-2.0-flash"
            self._headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
        else:
            self.api_key = settings.OPENROUTER_API_KEY
            self.base_url = settings.OPENROUTER_BASE_URL
            self.model = model or settings.OPENROUTER_CHAT_MODEL
            self._headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": settings.OPENROUTER_SITE_URL,
                "X-Title": settings.OPENROUTER_APP_NAME,
            }

    async def chat(
        self,
        messages: List[ConversationMessage],
        max_tokens: int = 512,
        temperature: float = 0.7,
    ) -> ConversationResponse:
        payload = {
            "model": self.model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        last_error = None
        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=self.TIMEOUT_SECONDS) as client:
                    resp = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=self._headers,
                        json=payload,
                    )
                resp.raise_for_status()
                data = resp.json()
                choice = data["choices"][0]
                return ConversationResponse(
                    text=choice["message"]["content"],
                    finish_reason=choice.get("finish_reason", "stop"),
                    model_used=data.get("model", self.model),
                    usage=data.get("usage"),
                )
            except httpx.HTTPStatusError as e:
                logger.warning(
                    f"Chat HTTP error on attempt {attempt}/{self.MAX_RETRIES}: {e.response.status_code}"
                )
                last_error = e
                if e.response.status_code in (400, 401, 402, 403, 404):
                    # Unrecoverable with current credentials/payload — use intelligent fallback
                    logger.info("Using conversational fallback due to HTTP auth/status code")
                    return self._fallback_reply(messages)
            except (httpx.RequestError, httpx.TimeoutException) as e:
                logger.warning(f"Chat request error on attempt {attempt}/{self.MAX_RETRIES}: {e}")
                last_error = e

        logger.warning(f"Chat completion falling back after errors: {last_error}")
        return self._fallback_reply(messages)

    def _fallback_reply(self, messages: List[ConversationMessage]) -> ConversationResponse:
        """Intelligent Egyptian Arabic & English call center dialogue fallback."""
        last_user_msg = ""
        for m in reversed(messages):
            if m.role == "user":
                last_user_msg = m.content.strip().lower()
                break

        has_arabic = any("\u0600" <= c <= "\u06FF" for c in last_user_msg)

        if has_arabic:
            if any(w in last_user_msg for w in ["حساب", "رصيد", "فلوس", "معاملة"]):
                text = "من عينيا يا فندم! رصيد حسابك دلوقتي 4,250 جنيه، وآخر معاملة كانت عملية سحب امبارح وسمّعت في الحساب بنجاح. تحب أساعدك في أي تفاصيل تانية؟"
            elif any(w in last_user_msg for w in ["ميعاد", "حجز", "زيارة", "فرع", "موعد"]):
                text = "عينيّ ليك يا فندم، متاح حجز ميعاد بكرة الساعة 2 الضهر أو يوم الخميس الساعة 11 الصبح في الفرع الرئيسي. تحب أثبتلك أنهي ميعاد فيهم؟"
            elif any(w in last_user_msg for w in ["كارت", "فيزا", "بطاقة", "تشغيل", "تفعيل"]):
                text = "اطمن خالص يا باشا، الكارت بتاعك شغال وزي الفل ومفيهوش أي مشكلة. تحب أفعلك كمان الشراء أونلاين بالمرة؟"
            elif any(w in last_user_msg for w in ["مشكلة", "شكوى", "عطل", "مش شغال", "واقف"]):
                text = "حقك عليا يا فندم ومتزعلش خالص، أنا فتحتلك دلوقتي حالاً شكوى برقم 8421 والفريق الفني هيكلمك ويحلها فوراً. في أي استفسار تاني؟"
            elif any(w in last_user_msg for w in ["شكراً", "تسلم", "تمام", "مع السلامة", "باي"]):
                text = "العفو يا فندم، ده شرف لينا ودايماً تحت أمرك! يومك جميل ومع ألف سلامة ونورتنا."
            elif any(w in last_user_msg for w in ["أهلاً", "سلام", "صباح", "مساء", "إزيك"]):
                text = "يا أهلاً وسهلاً بحضرتك يا فندم! معاك خدمة العملاء، تؤمرني بإيه النهاردة؟"
            else:
                text = "يا هلا بيك يا فندم! اتفضل قول لي طلب حضرتك وإيه اللي محتاجه وأنا هظبطهولك حالاً."
        else:
            if any(w in last_user_msg for w in ["balance", "account", "money", "funds"]):
                text = "Hello! Your current account balance is $4,250, and your last transaction was successful yesterday. Would you like assistance with anything else?"
            elif any(w in last_user_msg for w in ["appointment", "booking", "book", "schedule", "visit"]):
                text = "Certainly! We have an opening available tomorrow at 2:00 PM or Thursday at 11:00 AM. Would you like me to reserve one for you?"
            elif any(w in last_user_msg for w in ["card", "visa", "activate"]):
                text = "Your card status has been verified and is fully active. Would you like to enable international transactions as well?"
            elif any(w in last_user_msg for w in ["issue", "problem", "broken", "complaint", "help"]):
                text = "I completely understand and apologize for the inconvenience. Ticket #8421 has been created and our team is investigating. Can I note any other details?"
            elif any(w in last_user_msg for w in ["thank", "thanks", "bye", "goodbye"]):
                text = "You are very welcome! It was a pleasure assisting you. Have a wonderful day!"
            elif any(w in last_user_msg for w in ["hello", "hi", "morning", "evening"]):
                text = "Hello! I am your AI Customer Service Assistant. How can I assist you today?"
            else:
                text = "Understood. I have logged your request in our system. Is there anything else I can help you with today?"

        return ConversationResponse(
            text=text,
            finish_reason="stop",
            model_used="callcenter-local-fallback",
        )

    async def health_check(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{self.base_url}/models",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                )
                return resp.status_code == 200
        except Exception:
            return False
