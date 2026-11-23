import pytest
from httpx import AsyncClient
from app.services.call_orchestrator import CallOrchestrator
from app.services.agent_settings_service import save_agent_settings
from app.schemas.setting import AgentSettingUpdate, AgentQuestionItem


@pytest.mark.asyncio
async def test_get_agent_settings(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/v1/settings/agent", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "arabic_greeting" in data
    assert "questions" in data
    assert len(data["questions"]) >= 1


@pytest.mark.asyncio
async def test_update_agent_settings(client: AsyncClient, auth_headers: dict):
    custom_greeting = "أهلاً وسهلاً بك في البنك التجاري، معك المساعد الآلي."
    custom_questions = [
        {"id": "q1", "order": 1, "text": "ما هو الاسم الكريم؟", "field_key": "name", "is_required": True},
        {"id": "q2", "order": 2, "text": "ما هو رقم الحساب أو البطاقة؟", "field_key": "account", "is_required": True},
    ]

    resp = await client.put(
        "/api/v1/settings/agent",
        headers=auth_headers,
        json={
            "arabic_greeting": custom_greeting,
            "questions": custom_questions,
            "is_active": True,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["arabic_greeting"] == custom_greeting
    assert len(data["questions"]) == 2
    assert data["questions"][0]["text"] == "ما هو الاسم الكريم؟"
    assert data["questions"][1]["text"] == "ما هو رقم الحساب أو البطاقة؟"


@pytest.mark.asyncio
async def test_call_orchestrator_starts_with_arabic_greeting_and_first_question(db_session):
    # Set custom settings
    await save_agent_settings(
        AgentSettingUpdate(
            arabic_greeting="مرحباً بحضرتك يا فندم في خدمة الدعم الفني.",
            closing_message="تم تسجيل وتأكيد كافة بيانات حضرتك بنجاح.",
            questions=[
                AgentQuestionItem(id="q1", order=1, text="ما هو اسم حضرتك؟", field_key="name"),
                AgentQuestionItem(id="q2", order=2, text="ما هو رقم الهاتف المسجل؟", field_key="phone"),
            ],
            is_active=True,
        ),
        db=db_session,
    )

    orchestrator = CallOrchestrator(
        call_id="00000000-0000-0000-0000-000000000001",
        customer_name="أحمد علي",
        initial_language="ar-EG",
    )

    # 1. Initial greeting
    initial = orchestrator.get_initial_greeting()
    assert "مرحباً بحضرتك يا فندم في خدمة الدعم الفني." in initial.assistant_text
    assert "ما هو اسم حضرتك؟" in initial.assistant_text

    # 2. Caller answers question 1 -> orchestrator asks question 2
    turn2 = await orchestrator._run_llm_reasoning("أحمد علي")
    reply2, tool2, should_end2 = turn2
    assert "ما هو رقم الهاتف المسجل؟" in reply2
    assert should_end2 is False

    # 3. Caller answers question 2 (last question) -> orchestrator delivers confirm closing message and concludes call!
    turn3 = await orchestrator._run_llm_reasoning("01012345678")
    reply3, tool3, should_end3 = turn3
    assert should_end3 is True
    assert tool3 == "conclude_call"
    assert "تم تسجيل وتأكيد كافة بيانات حضرتك بنجاح" in reply3


@pytest.mark.asyncio
async def test_custom_call_sentences_customization(db_session):
    # Set custom dialogue sentences (acknowledgment, clarification, hangup reassurance)
    custom_ack = "مفهوم يا فندم وسجلت عندي، اطمن تماماً."
    custom_clarify = "عفواً يا فندم، الصوت غير واضح. برجاء التحدث بوضوح مرة ثانية."
    custom_hangup = "في رعاية الله يا فندم، الدورية بتتحرك لحضرتك حالاً."

    await save_agent_settings(
        AgentSettingUpdate(
            arabic_greeting="شرطة النجدة 122، اتفضل بلاغ حضرتك.",
            acknowledgment_message=custom_ack,
            clarification_message=custom_clarify,
            hangup_reassurance_message=custom_hangup,
            closing_message="تم إخطار أقرب دورية بنجاح.",
            questions=[
                AgentQuestionItem(id="q1", order=1, text="مكان البلاغ فين؟", field_key="loc"),
                AgentQuestionItem(id="q2", order=2, text="إيه المشكلة بالتحديد؟", field_key="issue"),
            ],
            is_active=True,
        ),
        db=db_session,
    )

    orchestrator = CallOrchestrator(
        call_id="00000000-0000-0000-0000-000000000002",
        customer_name="محمود",
        initial_language="ar-EG",
    )

    # 1. Initial Greeting
    initial = orchestrator.get_initial_greeting()
    assert "شرطة النجدة 122، اتفضل بلاغ حضرتك." in initial.assistant_text
    assert "مكان البلاغ فين؟" in initial.assistant_text

    # 2. Transition sentence using custom acknowledgment_message (like "تمام يا فندم اطمن")
    turn2 = await orchestrator._run_llm_reasoning("شارع التحرير الدقي")
    reply2, _, _ = turn2
    assert custom_ack in reply2
    assert "إيه المشكلة بالتحديد؟" in reply2

    # 3. Early hangup uses custom hangup_reassurance_message
    hangup_turn = await orchestrator._run_llm_reasoning("شكرا مع السلامة")
    hangup_reply, action, should_end = hangup_turn
    assert should_end is True
    assert custom_hangup in hangup_reply

    # 4. Audio clarification fallback uses custom clarification_message
    res_empty = await orchestrator.process_caller_audio(b"")
    assert custom_clarify in res_empty.assistant_text


@pytest.mark.asyncio
async def test_bilingual_english_call_sentences_customization(db_session):
    custom_en_greeting = "Welcome to 122 Egyptian Police Operations. Please state your emergency?"
    custom_en_ack = "Understood, stay calm and keep safe."
    custom_en_clarify = "Excuse me, your audio was not clear. Please repeat?"
    custom_en_hangup = "Help is on the way, stay safe and farewell!"
    custom_en_closing = "Police patrol dispatched to your coordinates. Stay inside."

    await save_agent_settings(
        AgentSettingUpdate(
            arabic_greeting="شرطة النجدة 122",
            english_greeting=custom_en_greeting,
            english_acknowledgment_message=custom_en_ack,
            english_clarification_message=custom_en_clarify,
            english_hangup_reassurance_message=custom_en_hangup,
            english_closing_message=custom_en_closing,
            questions=[
                AgentQuestionItem(id="q1", order=1, text="What is your location?", field_key="loc"),
                AgentQuestionItem(id="q2", order=2, text="What is the nature of the emergency?", field_key="type"),
            ],
            is_active=True,
        ),
        db=db_session,
    )

    orchestrator = CallOrchestrator(
        call_id="00000000-0000-0000-0000-000000000003",
        customer_name="John Doe",
        initial_language="en",
    )

    # 1. English Initial Greeting
    initial = orchestrator.get_initial_greeting()
    assert custom_en_greeting in initial.assistant_text
    assert "What is your location?" in initial.assistant_text

    # 2. English Transition & Acknowledgment
    turn2 = await orchestrator._run_llm_reasoning("Corniche Street, Aswan")
    reply2, _, should_end2 = turn2
    assert custom_en_ack in reply2
    assert "What is the nature of the emergency?" in reply2
    assert should_end2 is False

    # 3. English Clarification Fallback
    res_empty = await orchestrator.process_caller_audio(b"")
    assert custom_en_clarify in res_empty.assistant_text

    # 4. English Early Hangup
    hangup_turn = await orchestrator._run_llm_reasoning("Thank you, bye")
    hangup_reply, action, should_end = hangup_turn
    assert should_end is True
    assert custom_en_hangup in hangup_reply

    # 5. English Final Closing Message on question completion
    orchestrator2 = CallOrchestrator(
        call_id="00000000-0000-0000-0000-000000000004",
        customer_name="Jane Doe",
        initial_language="en",
    )
    orchestrator2.get_initial_greeting()
    await orchestrator2._run_llm_reasoning("Corniche Road")
    reply_final, _, final_end = await orchestrator2._run_llm_reasoning("Traffic accident")
    assert final_end is True
    assert custom_en_closing in reply_final


@pytest.mark.asyncio
async def test_recursive_branching_questions_bilingual_flow(db_session):
    from app.schemas.setting import AnswerOptionItem

    await save_agent_settings(
        AgentSettingUpdate(
            arabic_greeting="شرطة النجدة 122 معاك.",
            english_greeting="Egyptian Police 122.",
            acknowledgment_message="تمام يا فندم.",
            english_acknowledgment_message="Understood.",
            closing_message="تم توجيه الدورية لموقع البلاغ فوراً.",
            english_closing_message="Police patrol is en route immediately.",
            questions=[
                AgentQuestionItem(
                    id="q1",
                    order=1,
                    text="مكان البلاغ فين يا فندم؟",
                    english_text="What is your location?",
                    field_key="location",
                ),
                AgentQuestionItem(
                    id="q2",
                    order=2,
                    text="إيه نوع البلاغ؟",
                    english_text="What is the emergency type?",
                    field_key="type",
                    options=[
                        AnswerOptionItem(
                            id="opt_accident",
                            label="حادث تصادم",
                            english_label="Traffic collision",
                            keywords=["collision", "accident", "تصادم", "حادث"],
                            sub_questions=[
                                AgentQuestionItem(
                                    id="sq_injuries",
                                    order=1,
                                    text="هل في إصابات بشرية في الحادث؟",
                                    english_text="Are there any casualties or injuries?",
                                    field_key="injuries",
                                )
                            ],
                        )
                    ],
                ),
                AgentQuestionItem(
                    id="q3",
                    order=3,
                    text="اسم حضرتك بالكامل؟",
                    english_text="What is your full name?",
                    field_key="caller_name",
                ),
            ],
            is_active=True,
        ),
        db=db_session,
    )

    # --- Test English Call Flow with Recursive Branching ---
    en_orchestrator = CallOrchestrator(
        call_id="00000000-0000-0000-0000-000000000010",
        customer_name="Alex Smith",
        initial_language="en",
    )

    # 1. Initial greeting with Q1 in English
    init_res = en_orchestrator.get_initial_greeting()
    assert "Egyptian Police 122." in init_res.assistant_text
    assert "What is your location?" in init_res.assistant_text

    # 2. Answer Q1 -> advances to Q2 in English
    reply_q2, _, end_q2 = await en_orchestrator._run_llm_reasoning("Corniche Street, Alexandria")
    assert "Understood." in reply_q2
    assert "What is the emergency type?" in reply_q2
    assert end_q2 is False

    # 3. Answer Q2 matching English label "Traffic collision" -> triggers English recursive sub-question!
    reply_sq, _, end_sq = await en_orchestrator._run_llm_reasoning("Traffic collision")
    assert "Understood." in reply_sq
    assert "Are there any casualties or injuries?" in reply_sq
    assert end_sq is False

    # 4. Answer recursive sub-question -> advances to Q3 in English
    reply_q3, _, end_q3 = await en_orchestrator._run_llm_reasoning("Two people with minor injuries")
    assert "Understood." in reply_q3
    assert "What is your full name?" in reply_q3
    assert end_q3 is False

    # 5. Answer final question Q3 -> confirms closing and ends call in English!
    reply_close, tool_close, end_close = await en_orchestrator._run_llm_reasoning("Alex Smith")
    assert "Police patrol is en route immediately." in reply_close
    assert tool_close == "conclude_call"
    assert end_close is True


@pytest.mark.asyncio
async def test_hold_and_hesitation_handling_does_not_advance_question(db_session):
    """Verify that when a caller asks to hold on / pause, the orchestrator does NOT prematurely pop the next question."""
    orchestrator = CallOrchestrator(
        call_id="00000000-0000-0000-0000-000000000020",
        customer_name="Ahmed",
        initial_language="ar-EG",
    )
    init_res = orchestrator.get_initial_greeting()
    initial_q_queue_len = len(orchestrator.question_queue)

    # Caller asks for a moment / says hold on in Arabic
    reply, tool, should_end = await orchestrator._run_llm_reasoning("ثواني بس بشوف العنوان")
    assert "معاك يا فندم" in reply
    assert should_end is False
    assert tool is None
    # Question queue must NOT have been popped/advanced!
    assert len(orchestrator.question_queue) == initial_q_queue_len

    # Caller asks for hold in English
    orchestrator_en = CallOrchestrator(
        call_id="00000000-0000-0000-0000-000000000021",
        customer_name="John",
        initial_language="en",
    )
    orchestrator_en.get_initial_greeting()
    initial_en_queue_len = len(orchestrator_en.question_queue)

    reply_en, tool_en, should_end_en = await orchestrator_en._run_llm_reasoning("hold on, let me check")
    assert "Take your time" in reply_en
    assert should_end_en is False
    assert len(orchestrator_en.question_queue) == initial_en_queue_len


@pytest.mark.asyncio
async def test_free_speech_qa_validation_and_confirmation(db_session):
    """
    Verify Free-Speech QA validation:
    1. Caller replies with an irrelevant message / off-topic question instead of answering.
    2. LLM validates the reply, detects it does not answer the question.
    3. LLM replies contextually addressing the caller's message and confirms returning to the QA question.
    4. Current question remains active in the queue without being discarded.
    5. Caller then answers the question properly, which advances to the next question.
    """
    orchestrator = CallOrchestrator(
        call_id="00000000-0000-0000-0000-000000000030",
        customer_name="Mahmoud",
        initial_language="ar-EG",
    )
    init_res = orchestrator.get_initial_greeting()
    # Initial question is Q1 (Location)
    assert orchestrator.current_question is not None
    current_q_text = orchestrator.current_question.get("text")
    initial_queue_len = len(orchestrator.question_queue)

    # 1. Caller does NOT answer the location question, but asks an unrelated question about the service
    irrelevant_reply, tool, should_end = await orchestrator._run_llm_reasoning("هو انتوا مين بالظبط؟ وهتيجوا بجد ولا كلام؟")
    assert should_end is False
    assert tool is None
    # Must reassure and confirm asking for the location
    assert any(w in irrelevant_reply for w in ["شرطة", "النجدة", "اطمن", "معاك"])
    assert any(w in irrelevant_reply for w in ["مكان", "تفصيل", "لو سمحت", "فين"])
    # Crucial: Question queue must NOT have been advanced!
    assert len(orchestrator.question_queue) == initial_queue_len
    assert orchestrator.current_question.get("text") == current_q_text

    # 2. Caller now provides the actual answer to the location question
    valid_reply, tool2, should_end2 = await orchestrator._run_llm_reasoning("أنا في شارع الهرم قدام محطة مترو الجيزة")
    assert should_end2 is False
    # Now it advances to Question 2 (Incident Type)
    assert len(orchestrator.question_queue) == initial_queue_len - 1
    assert any(w in valid_reply for w in ["إيه نوع", "نوع البلاغ", "المشكلة", "الحادث"])


@pytest.mark.asyncio
async def test_acknowledgment_messages_relevance_per_question(db_session):
    """
    Verify that each acknowledgment prefix is relevant to the question just answered:
      - Answer Name (Q1) -> 'أهلاً بحضرتك يا فندم. رقم تليفون حضرتك للتواصل...'
      - Answer Phone (Q2) -> 'تمام يا فندم سجلت الرقم. مكان البلاغ فين بالتفصيل...'
      - Answer Location (Q3) -> 'تمام يا فندم، حددت الموقع. إيه نوع البلاغ أو الحادث...'
      - Answer Incident Type (Q4) -> 'فهمت حضرتك تماماً. [نص السؤال الفرعي]'
    """
    mock_questions = [
        AgentQuestionItem(
            id="q1",
            order=1,
            text="اسم حضرتك بالكامل يا فندم لإثبات البلاغ؟",
            field_key="caller_name",
            acknowledgment_prefix="أهلاً بحضرتك يا فندم.",
        ),
        AgentQuestionItem(
            id="q2",
            order=2,
            text="رقم تليفون حضرتك للتواصل ومتابعة تحرك الدورية الأمنية؟",
            field_key="phone_number",
            acknowledgment_prefix="تمام يا فندم سجلت الرقم.",
        ),
        AgentQuestionItem(
            id="q3",
            order=3,
            text="مكان البلاغ فين بالتفصيل يا فندم؟ المحافظة، المنطقة، والشارع أو أقرب علامة مميزة؟",
            field_key="incident_location",
            acknowledgment_prefix="تمام يا فندم، حددت الموقع.",
        ),
        AgentQuestionItem(
            id="q4",
            order=4,
            text="إيه نوع البلاغ أو الحادث اللي حضرتك بتبلغ عنه؟",
            field_key="incident_type",
            acknowledgment_prefix="فهمت حضرتك تماماً.",
            options=[
                {
                    "id": "opt_crash",
                    "label": "حادث تصادم",
                    "keywords": ["تصادم", "حادث"],
                    "sub_questions": [
                        {
                            "id": "sq1",
                            "order": 1,
                            "text": "في حد مصاب في الحادثة؟",
                            "field_key": "injuries",
                        }
                    ],
                }
            ],
        ),
    ]

    await save_agent_settings(
        AgentSettingUpdate(
            arabic_greeting="شرطة النجدة 122 معاك يا فندم.",
            acknowledgment_message="تمام يا فندم، اطمن.",
            closing_message="اطمن يا فندم، تم إخطار أقرب دورية أمنية.",
            questions=mock_questions,
            is_active=True,
        ),
        db=db_session,
    )

    orchestrator = CallOrchestrator(
        call_id="00000000-0000-0000-0000-000000000099",
        customer_name="Ahmed",
        initial_language="ar-EG",
    )

    # Initial Turn: Greeting + Q1 (Name)
    init_res = orchestrator.get_initial_greeting()
    assert "اسم حضرتك بالكامل" in init_res.assistant_text

    # Turn 1: Caller answers Name -> MUST acknowledge Name and ask Phone (Q2)!
    reply_phone, _, _ = await orchestrator._run_llm_reasoning("أنا اسمي أحمد محمد علي")
    assert "أهلاً بحضرتك يا فندم." in reply_phone
    assert "رقم تليفون حضرتك" in reply_phone
    # MUST NOT say "سجلت الرقم" when caller gave their name!
    assert "سجلت الرقم" not in reply_phone

    # Turn 2: Caller answers Phone -> MUST acknowledge Phone and ask Location (Q3)!
    reply_loc, _, _ = await orchestrator._run_llm_reasoning("رقمي 01012345678")
    assert "تمام يا فندم سجلت الرقم." in reply_loc
    assert "مكان البلاغ فين بالتفصيل" in reply_loc
    # MUST NOT say "حددت الموقع" when caller gave their phone number!
    assert "حددت الموقع" not in reply_loc

    # Turn 3: Caller answers Location -> MUST acknowledge Location and ask Incident Type (Q4)!
    reply_type, _, _ = await orchestrator._run_llm_reasoning("شارع مصطفى النحاس في مدينة نصر")
    assert "تمام يا فندم، حددت الموقع." in reply_type
    assert "إيه نوع البلاغ" in reply_type
    # MUST NOT say "فهمت حضرتك تماماً" when caller gave their location!
    assert "فهمت حضرتك تماماً" not in reply_type

    # Turn 4: Caller answers Incident Type -> MUST acknowledge Incident Type and ask Sub-Question!
    reply_subq, _, _ = await orchestrator._run_llm_reasoning("في حادث تصادم بين عربيتين")
    assert "فهمت حضرتك تماماً." in reply_subq
    assert "في حد مصاب في الحادثة؟" in reply_subq


@pytest.mark.asyncio
async def test_polite_words_like_shokran_do_not_end_call_early(db_session):
    """
    Verify that saying 'شكرا' or 'thank you' at the end of answering a question
    (e.g. 'محمد محمود إبراهيم شكرا') does NOT prematurely conclude an emergency call.
    """
    orchestrator = CallOrchestrator(
        call_id="00000000-0000-0000-0000-000000000101",
        customer_name="Caller",
        initial_language="ar-EG",
    )
    init_res = orchestrator.get_initial_greeting()
    assert "اسم حضرتك بالكامل" in init_res.assistant_text

    # Caller answers name politely: 'محمد محمود إبراهيم شكرا'
    reply, tool, should_end = await orchestrator._run_llm_reasoning("محمد محمود إبراهيم شكرا")

    # MUST NOT end call!
    assert should_end is False
    assert tool is None
    # MUST advance to Question 2 (Phone number)
    assert "رقم تليفون حضرتك" in reply

