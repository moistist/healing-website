"""Pydantic 请求/响应模型"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ── 情绪记录相关 ──────────────────────────────────────────────

class EmotionCreate(BaseModel):
    """创建情绪记录的请求体"""
    emotion_type: str = Field(..., description="情绪类型，如：焦虑/平静/悲伤/快乐")
    description: Optional[str] = Field(None, description="情绪描述（可选）")


class EmotionResponse(BaseModel):
    """单条情绪记录响应"""
    id: int
    emotion_type: str
    description: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True  # 支持从 ORM 对象转换


class EmotionListResponse(BaseModel):
    """情绪记录列表（分页）响应"""
    emotions: list[EmotionResponse]
    total: int
    page: int
    page_size: int


class EmotionTrendsResponse(BaseModel):
    """情绪趋势统计响应"""
    dates: list[str]
    emotions: dict[str, list[int]]


# ── 聊天相关 ──────────────────────────────────────────────────

class ChatRequest(BaseModel):
    """聊天请求体"""
    message: str = Field(..., description="用户发送的消息")
    stream: bool = Field(False, description="是否使用流式响应")


class ChatResponse(BaseModel):
    """单条聊天消息响应"""
    role: str
    content: str
    timestamp: datetime

    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    """聊天历史响应"""
    messages: list[ChatResponse]
    total: int


# ── 心情日记相关 ──────────────────────────────────────────────

class JournalCreate(BaseModel):
    """创建心情日记的请求体"""
    title: str = Field(..., description="日记标题")
    content: str = Field(..., description="日记内容")
    mood: Optional[str] = Field(None, description="心情标签（可选）")


class JournalResponse(BaseModel):
    """单条日记响应"""
    id: int
    title: str
    content: str
    mood: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


class JournalListResponse(BaseModel):
    """日记列表（分页）响应"""
    journals: list[JournalResponse]
    total: int
    page: int
    page_size: int


# ── 冥想/呼吸练习配置相关 ──────────────────────────────────────

class BreathingExercise(BaseModel):
    """呼吸练习参数配置"""
    inhale_seconds: int = Field(..., description="吸气时间（秒）")
    hold_seconds: int = Field(..., description="屏气时间（秒）")
    exhale_seconds: int = Field(..., description="呼气时间（秒）")


class MeditationGuide(BaseModel):
    """单个冥想引导项"""
    title: str = Field(..., description="冥想引导标题")
    content: str = Field(..., description="冥想引导文字内容")
    duration_minutes: int = Field(..., description="建议冥想时长（分钟）")


class MeditationConfig(BaseModel):
    """冥想配置响应模型"""
    breathing_exercise: BreathingExercise = Field(..., description="呼吸练习参数")
    meditation_guides: list[MeditationGuide] = Field(..., description="预设冥想引导列表")
    available_durations: list[int] = Field(..., description="可选的冥想时长（分钟）")
