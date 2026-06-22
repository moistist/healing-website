"""聊天相关路由"""
import json
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from models import ChatMessage
from schemas import ChatRequest, ChatResponse, ChatHistoryResponse
from services.llm_client import chat_completion, chat_completion_stream

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _get_recent_messages(db: Session, limit: int = 20) -> list:
    """
    获取最近 N 条对话消息，按时间正序排列，用于构建 LLM 上下文。
    """
    rows = (
        db.query(ChatMessage)
        .order_by(ChatMessage.timestamp.desc())
        .limit(limit)
        .all()
    )
    # 反转为时间正序
    rows.reverse()
    return [{"role": m.role, "content": m.content} for m in rows]


def _save_message(db: Session, role: str, content: str) -> ChatMessage:
    """将消息保存到数据库"""
    msg = ChatMessage(role=role, content=content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


# ---------- POST /api/chat ----------
@router.post("", response_model=ChatResponse)
async def send_message(
    req: ChatRequest,
    db: Session = Depends(get_db),
):
    """
    接收用户消息，调用 OpenAI API，返回 AI 回复。
    支持流式（SSE）和非流式两种模式。
    """
    # 1. 保存用户消息
    _save_message(db, "user", req.message)

    # 2. 构建上下文消息列表
    context = _get_recent_messages(db, limit=20)

    # 3. 流式模式：返回 SSE StreamingResponse
    if req.stream:
        async def event_generator():
            full_reply = ""
            try:
                async for piece in chat_completion_stream(context):
                    full_reply += piece
                    # SSE 格式：data: {...}\n\n
                    sse_data = json.dumps(
                        {"content": piece, "done": False},
                        ensure_ascii=False,
                    )
                    yield f"data: {sse_data}\n\n"

                # 流结束后保存 AI 回复到数据库
                _save_message(db, "assistant", full_reply)

                # 发送结束标记
                yield f"data: {json.dumps({'done': True})}\n\n"

            except Exception as e:
                logger.exception("流式调用 LLM 失败")
                err = json.dumps(
                    {"error": f"AI 服务暂时不可用：{e}", "done": True},
                    ensure_ascii=False,
                )
                yield f"data: {err}\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",  # 禁用 Nginx 缓冲
            },
        )

    # 4. 非流式模式
    try:
        reply_text = await chat_completion(context)
    except Exception as e:
        logger.exception("调用 LLM 失败")
        raise HTTPException(
            status_code=502,
            detail=f"AI 服务暂时不可用，请稍后再试：{e}",
        )

    # 保存 AI 回复
    assistant_msg = _save_message(db, "assistant", reply_text)

    return ChatResponse(
        role=assistant_msg.role,
        content=assistant_msg.content,
        timestamp=assistant_msg.timestamp,
    )


# ---------- GET /api/chat/history ----------
@router.get("/history", response_model=ChatHistoryResponse)
async def get_history(
    limit: int = Query(default=50, ge=1, le=200, description="返回条数"),
    offset: int = Query(default=0, ge=0, description="偏移量"),
    db: Session = Depends(get_db),
):
    """
    获取对话历史（分页），默认返回最近 50 条消息。
    """
    total = db.query(ChatMessage).count()

    rows = (
        db.query(ChatMessage)
        .order_by(ChatMessage.timestamp.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    # 反转为时间正序
    rows.reverse()

    messages = [
        ChatResponse(
            role=m.role,
            content=m.content,
            timestamp=m.timestamp,
        )
        for m in rows
    ]

    return ChatHistoryResponse(messages=messages, total=total)
