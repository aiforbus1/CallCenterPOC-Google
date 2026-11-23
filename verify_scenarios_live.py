import asyncio
from app.db.session import AsyncSessionLocal
from app.services.call_orchestrator import CallOrchestrator
from app.services.agent_settings_service import get_agent_settings

async def test():
    async with AsyncSessionLocal() as session:
        st_obj = await get_agent_settings(session)
        settings = st_obj.model_dump()
        print("GREETING:", settings.get("arabic_greeting"))
        print("TOTAL QUESTIONS:", len(settings.get("questions", [])))
        print("Q4 OPTIONS COUNT:", len(settings.get("questions", [])[3].get("options", [])))
        
        orch = CallOrchestrator(
            call_id="test-scenarios-002",
            customer_name="يوسف أمين الهواري",
            initial_language="ar-EG",
            agent_settings=settings,
        )
        
        # Test Scenario 2: حادثة خطيرة / انقلاب سيارة
        print("\n--- Testing Scenario 2 (انقلاب سيارة) ---")
        t1 = orch.get_initial_greeting()
        print("Officer (T1):", t1.assistant_text)
        
        t2 = await orch.process_caller_text("أنا يوسف أمين الهواري")
        print("Officer (T2):", t2.assistant_text)
        
        t3 = await orch.process_caller_text("01012345678")
        print("Officer (T3):", t3.assistant_text)
        
        t4 = await orch.process_caller_text("على الدائري، عند نزلة المريوطية في اتجاه المعادي")
        print("Officer (T4):", t4.assistant_text)
        
        # Caller reports rollover
        print("\nCaller says: 'إلحقونا بسرعة! فيه عربية اتقلبت على سقفها'")
        t5 = await orch.process_caller_text("إلحقونا بسرعة! فيه عربية اتقلبت على سقفها")
        print("Officer (T5 - Sub-Q 1):", t5.assistant_text)
        print("Should end call:", t5.should_end_call)
        
        # Caller answers sub-question 1
        print("\nCaller says: 'على سقفها وفيه اتنين جواها ومش عارفين يخرجوا'")
        t6 = await orch.process_caller_text("على سقفها وفيه اتنين جواها ومش عارفين يخرجوا")
        print("Officer (T6 - Sub-Q 2):", t6.assistant_text)
        print("Should end call:", t6.should_end_call)
        
        # Caller answers sub-question 2
        print("\nCaller says: 'واحد بس بيتكلم والتاني مش بيتحرك والطريق خطر جدا'")
        t7 = await orch.process_caller_text("واحد بس بيتكلم والتاني مش بيتحرك والطريق خطر جدا")
        print("Officer (T7 - Conclusion):", t7.assistant_text)
        print("Should end call:", t7.should_end_call)

if __name__ == "__main__":
    asyncio.run(test())
