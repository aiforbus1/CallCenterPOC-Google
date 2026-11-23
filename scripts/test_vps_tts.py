import asyncio
from app.providers.tts.openrouter_tts import OpenRouterTTSProvider

async def main():
    tts = OpenRouterTTSProvider()
    res = await tts.synthesize("شرطة النجدة 122", voice="Charon", response_format="wav")
    print("SUCCESS_TTS_GENERATED_BYTES:", len(res.audio_data), res.audio_format)

if __name__ == "__main__":
    asyncio.run(main())
