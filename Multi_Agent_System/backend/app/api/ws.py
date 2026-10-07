"""WebSocket Endpoint for Real-Time Execution Streaming."""

import asyncio
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..orchestration.runner import orchestrator
from ..schemas.state import ExecutionEvent

logger = logging.getLogger("collaborai.api.ws")
router = APIRouter(tags=["WebSocket"])


@router.websocket("/api/ws/runs/{run_id}")
async def websocket_run_stream(websocket: WebSocket, run_id: str):
    """Real-time bidirectional event stream for a live deliberation run."""
    await websocket.accept()
    logger.info("WebSocket connected for run %s", run_id)

    queue: asyncio.Queue[ExecutionEvent] = asyncio.Queue()

    def event_listener(event: ExecutionEvent):
        queue.put_nowait(event)

    orchestrator.subscribe(run_id, event_listener)

    # Immediately push existing state if run already has events
    existing_state = orchestrator.get_state(run_id)
    if existing_state and existing_state.execution_events:
        for ev in existing_state.execution_events:
            await websocket.send_json(ev.model_dump(mode="json"))

    async def sender_task():
        while True:
            event = await queue.get()
            await websocket.send_json(event.model_dump(mode="json"))

    send_job = asyncio.create_task(sender_task())

    try:
        while True:
            # Keep alive and listen for client heartbeats or messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected for run %s", run_id)
    except Exception as e:
        logger.warning("WebSocket error for run %s: %s", run_id, e)
    finally:
        send_job.cancel()
        orchestrator.unsubscribe(run_id, event_listener)
