from __future__ import annotations
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class AnswerActionRule(BaseModel):
    """
    Action rule triggered when an answer option is matched:
    - action_type: 'outbound_call' | 'categorize' | 'assign_department'
    - target_value: phone number for outbound call, or category name, or department name
    - department_name: optional department label associated with the action
    - department_phone: optional internal extension / phone number to call
    """
    action_type: str = "assign_department"  # outbound_call | categorize | assign_department
    target_value: Optional[str] = None
    department_name: Optional[str] = None
    department_phone: Optional[str] = None


class AnswerOptionItem(BaseModel):
    id: str
    label: str  # Arabic label, e.g., "حادث تصادم مروري"
    english_label: Optional[str] = None  # English label, e.g., "Traffic accident collision"
    keywords: List[str] = Field(default_factory=list)  # Trigger keywords in caller response (Arabic & English)
    category: Optional[str] = None  # Predefined category to assign
    department_id: Optional[str] = None  # Predefined department to route to
    actions: List[AnswerActionRule] = Field(default_factory=list)  # Actions to trigger
    sub_questions: List[AgentQuestionItem] = Field(default_factory=list)  # Recursive sub-questions!


class DepartmentItem(BaseModel):
    id: str
    name: str  # e.g., "الدعم الفني والشكاوى", "خدمة العملاء", "المبيعات والتعاقدات", "قسم الحسابات"
    phone_number: str  # e.g., "101", "+201001112233", "ext_401"
    description: Optional[str] = None


class CategoryItem(BaseModel):
    id: str
    name: str  # e.g., "شكوى تقنية", "استفسار رصيد", "حجز موعد", "طلب استرجاع"
    default_priority: str = "normal"  # low | normal | high | urgent
    department_id: Optional[str] = None


class AgentQuestionItem(BaseModel):
    id: str
    order: int
    text: str  # Arabic question text
    english_text: Optional[str] = None  # English question text
    field_key: Optional[str] = None
    is_required: bool = True
    acknowledgment_prefix: Optional[str] = None  # Optional Arabic reassurance phrase for this question
    english_acknowledgment_prefix: Optional[str] = None  # Optional English reassurance phrase for this question
    options: List[AnswerOptionItem] = Field(default_factory=list)  # Configured answer options for this question


# Update forward references for self-referential / recursive nested model
AnswerOptionItem.model_rebuild()


class AgentSettingResponse(BaseModel):
    id: Optional[str] = None
    key: str = "default"
    arabic_greeting: str
    acknowledgment_message: Optional[str] = "تمام يا فندم، اطمن."
    clarification_message: Optional[str] = "معلش يا فندم، الصوت مكنش واضح عندي خالص. ممكن تعيد عليا تاني بعد إذنك؟"
    hangup_reassurance_message: Optional[str] = "تحت أمرك يا فندم، اطمن الدورية في طريقها لموقع البلاغ فوراً، وخليك في مكان آمن."
    closing_message: Optional[str] = None
    english_greeting: Optional[str] = "Egyptian Police Emergency Hotline 122. Please state your emergency?"
    english_acknowledgment_message: Optional[str] = "Understood, stay calm."
    english_clarification_message: Optional[str] = "I am sorry, the audio was not clear. Could you please repeat?"
    english_hangup_reassurance_message: Optional[str] = "You are in good hands. The police patrol is en route immediately. Stay safe!"
    english_closing_message: Optional[str] = "All your emergency report details have been dispatched to the nearest police patrol unit. Stay in a safe place, emergency services are en route!"
    questions: List[AgentQuestionItem] = Field(default_factory=list)
    tts_voice: Optional[str] = "Aoede"
    vad_silence_timeout_seconds: Optional[float] = 1.8
    chat_model: Optional[str] = "google/gemma-4-26b-a4b-it"
    stt_model: Optional[str] = "openai/whisper-large-v3"
    departments: List[DepartmentItem] = Field(default_factory=list)
    categories: List[CategoryItem] = Field(default_factory=list)
    is_active: bool = True
    updated_at: Optional[datetime] = None


class AgentSettingUpdate(BaseModel):
    arabic_greeting: str
    acknowledgment_message: Optional[str] = "تمام يا فندم، اطمن."
    clarification_message: Optional[str] = "معلش يا فندم، الصوت مكنش واضح عندي خالص. ممكن تعيد عليا تاني بعد إذنك؟"
    hangup_reassurance_message: Optional[str] = "تحت أمرك يا فندم، اطمن الدورية في طريقها لموقع البلاغ فوراً، وخليك في مكان آمن."
    closing_message: Optional[str] = None
    english_greeting: Optional[str] = "Egyptian Police Emergency Hotline 122. Please state your emergency?"
    english_acknowledgment_message: Optional[str] = "Understood, stay calm."
    english_clarification_message: Optional[str] = "I am sorry, the audio was not clear. Could you please repeat?"
    english_hangup_reassurance_message: Optional[str] = "You are in good hands. The police patrol is en route immediately. Stay safe!"
    english_closing_message: Optional[str] = "All your emergency report details have been dispatched to the nearest police patrol unit. Stay in a safe place, emergency services are en route!"
    questions: List[AgentQuestionItem] = Field(default_factory=list)
    tts_voice: Optional[str] = "Aoede"
    vad_silence_timeout_seconds: Optional[float] = 1.8
    chat_model: Optional[str] = "google/gemma-4-26b-a4b-it"
    stt_model: Optional[str] = "openai/whisper-large-v3"
    departments: List[DepartmentItem] = Field(default_factory=list)
    categories: List[CategoryItem] = Field(default_factory=list)
    is_active: Optional[bool] = True
