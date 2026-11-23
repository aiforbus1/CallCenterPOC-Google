import asyncio
from app.services.call_orchestrator import CallOrchestrator
from app.services.agent_settings_service import get_cached_agent_settings

async def test():
    settings = get_cached_agent_settings()
    print("Agent Settings Chat Model:", settings.get("chat_model"))
    
    orch = CallOrchestrator(
        call_id="test-gemma-001",
        customer_name="احمد علي",
        initial_language="ar-EG",
        agent_settings=settings,
    )
    print("Orchestrator chat model:", orch.chat.model)
    
    # Test Whisper correction with Gemma
    raw_whisper_sample = "انا محمد احمد حسن ورقمي زيرو عشره اتناشر اربعه وتلاتين"
    print(f"Testing STT correction on sample: '{raw_whisper_sample}'")
    corrected = await orch._correct_transcription_with_llm(raw_whisper_sample)
    print("Original Whisper:", raw_whisper_sample)
    print("Gemma Corrected: ", corrected)
    
    # Test turn processing with Gemma LLM
    res = await orch.process_caller_text("أنا في شارع فيصل الرئيسي قدام محطة حسن محمد وفي خناقة كبيرة")
    print("Gemma Assistant Reply:", res.assistant_text)
    print("Options:", res.options)

if __name__ == "__main__":
    asyncio.run(test())
