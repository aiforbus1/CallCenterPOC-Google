"""
WebSocket Handler for Mobile In-App Voice Calls.

Direct bidirectional real-time audio and speech stream between Flutter mobile client
and the LLM Call Orchestrator.
"""
import asyncio
import base64
import json
import logging
import uuid
from datetime import datetime, timezone
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy import select
from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.call import Call
from app.models.customer import Customer
from app.services.agent_settings_service import get_agent_settings, get_cached_agent_settings
from app.services.call_orchestrator import CallOrchestrator

logger = logging.getLogger(__name__)


def _calculate_audio_wait_seconds(turn_res) -> float:
    """Calculates how long to wait for the assistant's speech playback to complete."""
    if turn_res.audio_base64:
        try:
            audio_bytes = base64.b64decode(turn_res.audio_base64)
            # 24kHz 16-bit mono PCM/WAV = 48,000 bytes per second
            duration = len(audio_bytes) / 48000.0
            # Add 2.0s buffer for mobile buffering/network latency and graceful pause
            return max(5.0, duration + 2.0)
        except Exception:
            pass
    # Fallback estimation based on Arabic words (approx 2.5 words/sec)
    words = len((turn_res.assistant_text or "").split())
    return max(5.0, (words / 2.5) + 2.0)


async def _wait_for_playback_completion(websocket: WebSocket, wait_seconds: float):
    """Wait for the client to signal playback_finished or until timeout expires."""
    try:
        receive_task = asyncio.create_task(websocket.receive_text())
        done, pending = await asyncio.wait([receive_task], timeout=wait_seconds)
        if receive_task in done:
            raw_event = receive_task.result()
            try:
                data = json.loads(raw_event)
                logger.info(f"Client signal received during conclusion wait: {data.get('event')}")
            except Exception:
                pass
        else:
            receive_task.cancel()
            try:
                await receive_task
            except asyncio.CancelledError:
                pass
    except Exception as e:
        logger.debug(f"Wait for playback finished exception: {e}")


async def handle_mobile_stream(websocket: WebSocket, call_id: str):
    """
    WebSocket endpoint for mobile in-app bidirectional voice calls.
    Orchestrated by CallOrchestrator (STT -> LLM with Tool Calling -> Neural TTS).
    """
    await websocket.accept()
    logger.info(f"Mobile call stream connected: {call_id}")

    # Load initial call details and live DB agent settings
    customer_name = "Valued Customer"
    language = "ar-EG"
    call_direction = "inbound"
    fresh_settings = None

    async with AsyncSessionLocal() as db:
        # Fetch dynamic agent settings (Whisper STT model, LLM chat model, TTS voice, VAD) directly from DB
        try:
            await get_agent_settings(db)
            fresh_settings = get_cached_agent_settings()
            logger.info(
                f"Mobile call stream [{call_id}] dynamic DB settings loaded: "
                f"STT='{fresh_settings.get('stt_model')}', LLM='{fresh_settings.get('chat_model')}', Voice='{fresh_settings.get('tts_voice')}', VAD={fresh_settings.get('vad_silence_timeout_seconds')}s"
            )
        except Exception as e:
            logger.warning(f"Could not load agent settings from DB for call {call_id}: {e}")
            try:
                await db.rollback()
            except Exception:
                pass
            fresh_settings = get_cached_agent_settings()

        call_uuid = None
        try:
            call_uuid = uuid.UUID(str(call_id))
        except (ValueError, TypeError):
            pass

        call = None
        if call_uuid:
            result = await db.execute(select(Call).where(Call.id == call_uuid))
            call = result.scalar_one_or_none()

        if not call:
            result = await db.execute(select(Call).order_by(Call.created_at.desc()))
            call = result.scalars().first()

        if not call:
            call = Call(
                id=call_uuid or uuid.uuid4(),
                direction="inbound",
                call_mode="mobile",
                status="in_progress",
                from_number="+201012345678",
                to_number="+20200000000",
                started_at=datetime.now(timezone.utc),
                answered_at=datetime.now(timezone.utc),
                language="ar-EG",
                processing_status="pending",
            )
            db.add(call)
            await db.commit()
            await db.refresh(call)
            logger.info(f"Auto-provisioned Call record for mobile stream: {call.id}")

        call.status = "in_progress"
        if not call.answered_at:
            call.answered_at = datetime.now(timezone.utc)
        language = call.language or "ar-EG"
        call_direction = call.direction

        if call.customer_id:
            c_res = await db.execute(select(Customer).where(Customer.id == call.customer_id))
            cust = c_res.scalar_one_or_none()
            if cust:
                customer_name = cust.full_name

        await db.commit()

    # Initialize the LLM Call Orchestrator with DB settings
    orchestrator = CallOrchestrator(
        call_id=call_id,
        customer_name=customer_name,
        initial_language=language,
        direction=call_direction,
        agent_settings=fresh_settings,
    )

    try:
        # 1. Send Connected Event with live DB model metadata
        await websocket.send_text(json.dumps({
            "event": "connected",
            "call_id": call_id,
            "status": "in_progress",
            "direction": call_direction,
            "customer_name": customer_name,
            "language": language,
            "stt_model": fresh_settings.get("stt_model"),
            "chat_model": fresh_settings.get("chat_model"),
            "tts_voice": fresh_settings.get("tts_voice"),
            "vad_timeout": fresh_settings.get("vad_silence_timeout_seconds"),
            "conversation_state": "INITIAL_GREETING",
        }, ensure_ascii=False))

        # 2. Generate and Send Initial Greeting
        greeting_result = orchestrator.get_initial_greeting()
        audio_b64 = None
        try:
            synth_greeting = await orchestrator._synthesize_result(
                user_text="",
                assistant_text=greeting_result.assistant_text,
            )
            audio_b64 = synth_greeting.audio_base64
        except Exception as e:
            logger.warning(f"Error synthesizing initial greeting: {e}")

        await websocket.send_text(json.dumps({
            "event": "assistant_message",
            "text": greeting_result.assistant_text,
            "language": greeting_result.language,
            "audio_base64": audio_b64,
            "options": greeting_result.options,
            "conversation_state": "AI_SPEAKING",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }, ensure_ascii=False))

        # 3. Message loop
        while True:
            raw_msg = await websocket.receive_text()
            try:
                data = json.loads(raw_msg)
            except json.JSONDecodeError:
                continue

            event = data.get("event", "")

            if event == "user_message":
                user_text = data.get("text", "").strip()
                if not user_text:
                    continue

                # Signal processing state
                await websocket.send_text(json.dumps({"event": "ai_state", "state": "PROCESSING"}))

                # Process turn through Stateful LLM Conversation Manager
                turn_res = await orchestrator.process_caller_text(user_text)

                # Send rich context update
                await websocket.send_text(json.dumps({
                    "event": "conversation_context_update",
                    "state": turn_res.conversation_state,
                    "intent": turn_res.intent or orchestrator.context.customer_intent,
                    "urgency": turn_res.urgency_level or orchestrator.context.urgency_level,
                    "extracted_info": turn_res.extracted_info or orchestrator.context.extracted_info,
                    "missing_info": turn_res.missing_info or orchestrator.context.missing_info,
                    "call_summary": turn_res.call_summary or orchestrator.context.call_summary,
                    "next_action": turn_res.next_action or orchestrator.context.next_action,
                }, ensure_ascii=False))

                # Send assistant reply to mobile
                await websocket.send_text(json.dumps({
                    "event": "assistant_message",
                    "text": turn_res.assistant_text,
                    "language": turn_res.language,
                    "audio_base64": turn_res.audio_base64,
                    "tool_action": turn_res.tool_action,
                    "options": turn_res.options,
                    "conversation_state": "AI_SPEAKING",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }, ensure_ascii=False))

                if turn_res.should_end_call:
                    wait_time = _calculate_audio_wait_seconds(turn_res)
                    logger.info(f"Orchestrator concluded call {call_id}. Waiting {wait_time:.1f}s for client playback completion.")
                    await _wait_for_playback_completion(websocket, wait_time)
                    await websocket.send_text(json.dumps({"event": "ai_state", "state": "COMPLETED"}))
                    break

            elif event == "user_audio":
                audio_b64 = data.get("audio_base64", "")
                audio_fmt = data.get("format", "wav")
                if not audio_b64:
                    continue

                # Signal listening ended, Whisper STT processing started
                await websocket.send_text(json.dumps({"event": "ai_state", "state": "PROCESSING"}))

                try:
                    audio_bytes = base64.b64decode(audio_b64)
                    turn_res = await orchestrator.process_caller_audio(
                        audio_bytes=audio_bytes,
                        audio_format=audio_fmt,
                    )

                    if turn_res.user_text:
                        # Echo back Whisper transcription and Gemma post-correction with validation fields
                        await websocket.send_text(json.dumps({
                            "event": "user_transcription",
                            "text": str(turn_res.user_text),
                            "original_whisper": turn_res.original_whisper or str(turn_res.user_text),
                            "stt_corrector_model": turn_res.stt_corrector_model or "google/gemma-4-26b-a4b-it",
                            "needs_review": bool(getattr(turn_res, "stt_needs_review", False)),
                            "validation_reasons": list(getattr(turn_res, "stt_validation_reasons", [])),
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        }, ensure_ascii=False))

                    # Send rich context update from LLM
                    await websocket.send_text(json.dumps({
                        "event": "conversation_context_update",
                        "state": turn_res.conversation_state,
                        "intent": turn_res.intent or orchestrator.context.customer_intent,
                        "urgency": turn_res.urgency_level or orchestrator.context.urgency_level,
                        "extracted_info": turn_res.extracted_info or orchestrator.context.extracted_info,
                        "missing_info": turn_res.missing_info or orchestrator.context.missing_info,
                        "call_summary": turn_res.call_summary or orchestrator.context.call_summary,
                        "next_action": turn_res.next_action or orchestrator.context.next_action,
                    }, ensure_ascii=False))

                    # Send assistant reply to mobile
                    await websocket.send_text(json.dumps({
                        "event": "assistant_message",
                        "text": turn_res.assistant_text,
                        "language": turn_res.language,
                        "audio_base64": turn_res.audio_base64,
                        "tool_action": turn_res.tool_action,
                        "options": turn_res.options,
                        "conversation_state": "AI_SPEAKING",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }, ensure_ascii=False))

                    if turn_res.should_end_call:
                        wait_time = _calculate_audio_wait_seconds(turn_res)
                        logger.info(f"Orchestrator concluded call {call_id} from audio turn. Waiting {wait_time:.1f}s for client playback completion.")
                        await _wait_for_playback_completion(websocket, wait_time)
                        await websocket.send_text(json.dumps({"event": "ai_state", "state": "COMPLETED"}))
                        break

                except Exception as e:
                    logger.error(f"Error processing audio turn [{call_id}]: {e}")

            elif event == "end_call":
                logger.info(f"Mobile client requested end of call {call_id}")
                break

    except WebSocketDisconnect:
        logger.info(f"Mobile WebSocket disconnected for call {call_id}")
    except Exception as e:
        logger.error(f"Mobile stream error [{call_id}]: {e}")
    finally:
        # Finalize Call in DB, persist complete transcript & generate AI summary + extraction
        await orchestrator.finalize_call(final_status="completed")

        try:
            await websocket.send_text(json.dumps({
                "event": "call_ended",
                "call_id": call_id,
                "status": "completed",
            }, ensure_ascii=False))
            await websocket.close()
        except Exception:
            pass
