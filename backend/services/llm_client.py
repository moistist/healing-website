"""OpenAI 兼容的异步 LLM 客户端"""
import json
import logging
from typing import AsyncGenerator, List, Dict, Optional

import httpx

from config import settings

logger = logging.getLogger(__name__)

# 系统提示词：温暖、共情的心理疗愈师角色
SYSTEM_PROMPT = (
    "你是一位温暖、共情的心理疗愈师。你善于倾听他人的心声，"
    "用温柔和理解去回应每一段故事。你不会评判，只会陪伴和引导，"
    "帮助对方发现内心的力量，找到平静与方向。"
    "请用中文回复，语气亲切自然，像一位值得信赖的朋友。"
)


def _build_headers() -> Dict[str, str]:
    """构建请求头"""
    return {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }


def _build_payload(
    messages: List[Dict[str, str]],
    stream: bool = False,
) -> Dict:
    """构建请求体"""
    # 在消息列表最前面插入系统提示词
    full_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages
    payload: Dict = {
        "model": settings.OPENAI_MODEL,
        "messages": full_messages,
    }
    if stream:
        payload["stream"] = True
    return payload


async def chat_completion(
    messages: List[Dict[str, str]],
) -> str:
    """
    非流式调用：发送消息列表，返回 AI 完整回复文本。
    调用失败时抛出异常，由上层统一处理。
    """
    url = f"{settings.OPENAI_BASE_URL}/chat/completions"
    payload = _build_payload(messages, stream=False)

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(url, json=payload, headers=_build_headers())
        resp.raise_for_status()
        data = resp.json()

    # 提取回复内容
    content = data["choices"][0]["message"]["content"]
    return content


async def chat_completion_stream(
    messages: List[Dict[str, str]],
) -> AsyncGenerator[str, None]:
    """
    流式调用：发送消息列表，以 AsyncGenerator 逐块 yield 文本片段。
    每个 yield 的字符串是模型输出的一个增量文本片段。
    """
    url = f"{settings.OPENAI_BASE_URL}/chat/completions"
    payload = _build_payload(messages, stream=True)

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST", url, json=payload, headers=_build_headers()
        ) as resp:
            resp.raise_for_status()
            # 逐行读取 SSE 数据
            async for line in resp.aiter_lines():
                if not line.startswith("data:"):
                    continue
                data_str = line[len("data:"):].strip()
                if data_str == "[DONE]":
                    break
                try:
                    chunk = json.loads(data_str)
                    delta = chunk["choices"][0].get("delta", {})
                    content_piece = delta.get("content", "")
                    if content_piece:
                        yield content_piece
                except (json.JSONDecodeError, KeyError, IndexError):
                    # 跳过无法解析的行
                    continue
