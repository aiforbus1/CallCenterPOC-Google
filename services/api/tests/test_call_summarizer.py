import pytest
from uuid import uuid4
from sqlalchemy import select
from app.models.call import Call, CallExtraction
from app.services.call_summarizer import (
    _extract_caller_speech,
    _is_abandoned_or_empty_call,
    _extract_intent_and_summary_fallback,
    _resolve_option_actions,
    generate_call_summary_and_extraction,
)
from app.services.agent_settings_service import get_cached_agent_settings


def test_extract_caller_speech():
    # Only assistant
    t1 = "AI Assistant: شرطة النجدة 122 معاك يا فندم"
    assert _extract_caller_speech(t1) == ""

    # Assistant and caller
    t2 = "AI Assistant: شرطة النجدة 122 معاك\nCaller: ألو يا فندم"
    assert _extract_caller_speech(t2) == "ألو يا فندم"

    # Multiple turns
    t3 = (
        "AI Assistant: مكان البلاغ فين؟\n"
        "Caller: محافظة أسوان شارع الكورنيش\n"
        "AI Assistant: إيه نوع البلاغ؟\n"
        "Caller: تصادم عربيتين"
    )
    assert _extract_caller_speech(t3) == "محافظة أسوان شارع الكورنيش تصادم عربيتين"

    # Raw text without labels
    t4 = "محافظة المنيا"
    assert _extract_caller_speech(t4) == "محافظة المنيا"


def test_is_abandoned_or_empty_call():
    # Completely empty or whitespace
    assert _is_abandoned_or_empty_call("") is True
    assert _is_abandoned_or_empty_call("   ") is True

    # Only assistant greeting (caller never answered)
    t_assistant_only = "AI Assistant: شرطة النجدة 122 معاك يا فندم، اتفضل إيه البلاغ أو المشكلة؟ مكان البلاغ فين بالتفصيل يا فندم؟"
    assert _is_abandoned_or_empty_call(t_assistant_only) is True

    # Caller said only greetings/filler
    t_filler1 = "AI Assistant: شرطة النجدة 122 معاك\nCaller: ألو"
    assert _is_abandoned_or_empty_call(t_filler1) is True

    t_filler2 = "AI Assistant: شرطة النجدة 122 معاك\nCaller: السلام عليكم مين معايا"
    assert _is_abandoned_or_empty_call(t_filler2) is True

    # Caller said an emergency keyword -> NOT abandoned
    t_emergency1 = "AI Assistant: شرطة النجدة 122 معاك\nCaller: حادثة كبيرة"
    assert _is_abandoned_or_empty_call(t_emergency1) is False

    t_emergency2 = "AI Assistant: شرطة النجدة 122 معاك\nCaller: الحقوني في خناقة"
    assert _is_abandoned_or_empty_call(t_emergency2) is False


def test_fallback_abandoned_call():
    t_assistant_only = "AI Assistant: شرطة النجدة 122 معاك يا فندم، اتفضل إيه البلاغ أو المشكلة؟"
    fallback = _extract_intent_and_summary_fallback(t_assistant_only, language="ar-EG")

    assert fallback["priority"] == "low"
    assert fallback["category"] is None
    assert fallback["assigned_department"] is None
    assert fallback["department_phone"] is None
    assert fallback["follow_up_required"] is False
    assert "أُغلق فوراً بعد رسالة الترحيب" in fallback["summary"]
    assert "لم يتم تسجيل أي حادث" in fallback["summary"]


def test_resolve_option_actions_blocks_hallucination():
    settings = get_cached_agent_settings()
    questions = settings.get("questions", [])
    departments = settings.get("departments", [])
    categories = settings.get("categories", [])

    # Caller only stated location: "محافظة اسوان شارع الكورنيش"
    # LLM incorrectly returned hallucinated incident_type: "حادث تصادم مروري"
    transcript_location_only = (
        "AI Assistant: شرطة النجدة 122 معاك، مكان البلاغ فين بالتفصيل يا فندم؟\n"
        "Caller: محافظة اسوان شارع الكورنيش\n"
        "AI Assistant: تمام يا فندم، إيه نوع البلاغ؟ مشاجرة، سرقة، حادث تصادم، حريق، ولا استغاثة؟"
    )

    hallucinated_extracted_fields = {
        "incident_location": "محافظة اسوان شارع الكورنيش",
        "incident_type": "حادث تصادم مروري",
    }

    # Should reject the hallucinated match because "حادث" / "تصادم" was NOT in caller speech!
    action_res = _resolve_option_actions(
        extracted_fields=hallucinated_extracted_fields,
        questions=questions,
        departments=departments,
        categories=categories,
        transcript_text=transcript_location_only,
    )

    assert action_res["trigger_outbound"] is False
    assert action_res["category"] is None
    assert action_res["assigned_department"] is None


def test_resolve_option_actions_accepts_verified_caller_speech():
    settings = get_cached_agent_settings()
    questions = settings.get("questions", [])
    departments = settings.get("departments", [])
    categories = settings.get("categories", [])

    # Caller actually reported an accident:
    transcript_real_accident = (
        "AI Assistant: شرطة النجدة 122 معاك، مكان البلاغ فين؟\n"
        "Caller: طريق المحور\n"
        "AI Assistant: إيه نوع البلاغ؟\n"
        "Caller: فيه حادث تصادم كبير بين عربيتين"
    )

    extracted_fields = {
        "incident_location": "طريق المحور",
        "incident_type": "حادث تصادم مروري",
    }

    action_res = _resolve_option_actions(
        extracted_fields=extracted_fields,
        questions=questions,
        departments=departments,
        categories=categories,
        transcript_text=transcript_real_accident,
    )

    assert action_res["trigger_outbound"] is True
    assert action_res["category"] == "حادث مروري / تصادم"
    assert action_res["assigned_department"] == "الإدارة العامة للمرور"
    assert action_res["outbound_phone"] == "136"


@pytest.mark.asyncio
async def test_generate_call_summary_and_extraction_on_greeting_hangup(db_session):
    # Create inbound call
    call = Call(
        id=uuid4(),
        direction="inbound",
        call_mode="simulated",
        status="completed",
        from_number="+201099887766",
        to_number="122",
        language="ar-EG",
        duration_seconds=5,
        processing_status="pending",
    )
    db_session.add(call)
    await db_session.flush()

    # Transcript where call disconnected right after greeting
    transcript_text = "AI Assistant: شرطة النجدة 122 معاك يا فندم، اتفضل إيه البلاغ أو المشكلة؟ مكان البلاغ فين بالتفصيل يا فندم؟"

    await generate_call_summary_and_extraction(call, transcript_text, db_session)
    await db_session.flush()

    # 1. AI Summary must NOT hallucinate any accident or department dispatch
    assert "أُغلق فوراً بعد رسالة الترحيب" in call.ai_summary
    assert "حادث تصادم" not in call.ai_summary
    assert "أسوان" not in call.ai_summary
    assert "الكورنيش" not in call.ai_summary
    assert "Automated department dispatch" not in call.ai_summary

    # 2. CallExtraction must have priority low, category None, assigned_department None
    ext_res = await db_session.execute(select(CallExtraction).where(CallExtraction.call_id == call.id))
    extraction = ext_res.scalar_one_or_none()
    assert extraction is not None
    assert extraction.priority == "low"
    assert extraction.category is None
    assert extraction.assigned_department is None
    assert extraction.outbound_call_triggered is False
    assert extraction.outbound_call_id is None

    # 3. Ensure NO false outbound calls were created in the database
    outbound_res = await db_session.execute(
        select(Call).where(Call.direction == "outbound", Call.to_number == "136")
    )
    outbound_calls = outbound_res.scalars().all()
    # Any outbound calls present must not be for this abandoned call
    for oc in outbound_calls:
        assert oc.ai_summary is not None
        assert str(call.id) not in oc.ai_summary
