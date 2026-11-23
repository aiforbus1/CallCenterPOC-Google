import asyncio
import json
from app.db.session import AsyncSessionLocal
from app.models.setting import AgentSetting
from sqlalchemy import select
from build_scenarios import SCENARIOS_QUESTIONS

async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(AgentSetting).limit(1))
        setting = result.scalar_one_or_none()
        if not setting:
            print("No agent setting found to update!")
            return
        
        setting.questions = SCENARIOS_QUESTIONS
        setting.arabic_greeting = "نجدة القاهرة 122، أقدر أساعدك إزاي يا فندم؟"
        setting.acknowledgment_message = "تمام يا فندم، فاهم حضرتك تماماً."
        setting.clarification_message = "معلش يا فندم الصوت مكنش واضح، ممكن تعيد عليا تاني بعد إذنك؟"
        setting.hangup_reassurance_message = "تحت أمرك يا فندم، البلاغ وصل ومتابع، والدورية في طريقها فوراً."
        setting.closing_message = "تمام يا فندم تم تسجيل البلاغ بالكامل وإخطار الدورية وقسم الشرطة المختص للتحرك فوراً لموقع الحادث. خليك في مكان آمن."
        
        await session.commit()
        print("Successfully updated agent_settings with all 20 emergency scenarios!")
        print(f"Top-level questions: {len(setting.questions)}")
        print(f"Scenario 4 options: {len(setting.questions[3]['options'])}")

if __name__ == "__main__":
    asyncio.run(main())
