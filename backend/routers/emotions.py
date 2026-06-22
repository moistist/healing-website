"""情绪记录相关路由"""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, cast, Date
from sqlalchemy.orm import Session

from database import get_db
from models import EmotionRecord
from schemas import (
    EmotionCreate,
    EmotionResponse,
    EmotionListResponse,
    EmotionTrendsResponse,
)

router = APIRouter(prefix="/api/emotions", tags=["情绪记录"])


@router.post("", response_model=EmotionResponse, status_code=201)
def create_emotion(
    payload: EmotionCreate,
    db: Session = Depends(get_db),
):
    """创建一条情绪记录"""
    if not payload.emotion_type.strip():
        raise HTTPException(status_code=400, detail="emotion_type 不能为空")

    record = EmotionRecord(
        emotion_type=payload.emotion_type.strip(),
        description=payload.description,
    )
    db.add(record)
    try:
        db.commit()
        db.refresh(record)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="数据库写入失败") from exc
    return record


@router.get("", response_model=EmotionListResponse)
def list_emotions(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页条数"),
    db: Session = Depends(get_db),
):
    """获取情绪历史记录（分页，按时间倒序）"""
    total: int = db.query(func.count(EmotionRecord.id)).scalar() or 0

    records = (
        db.query(EmotionRecord)
        .order_by(EmotionRecord.timestamp.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return EmotionListResponse(
        emotions=records,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/trends", response_model=EmotionTrendsResponse)
def get_emotion_trends(
    days: int = Query(7, ge=1, le=30, description="统计天数（7 或 30）"),
    db: Session = Depends(get_db),
):
    """获取最近 N 天的情绪趋势统计

    返回格式：
    {
        "dates": ["2024-01-01", "2024-01-02", ...],
        "emotions": {"焦虑": [2, 1, ...], "平静": [1, 3, ...]}
    }
    """
    since = datetime.utcnow() - timedelta(days=days)

    # SQL 聚合：按日期 + 情绪类型统计次数
    date_col = cast(EmotionRecord.timestamp, Date).label("date")
    rows = (
        db.query(
            date_col,
            EmotionRecord.emotion_type,
            func.count(EmotionRecord.id).label("cnt"),
        )
        .filter(EmotionRecord.timestamp >= since)
        .group_by(date_col, EmotionRecord.emotion_type)
        .order_by(date_col)
        .all()
    )

    # 构建完整日期序列（确保没有记录的日期也出现，计数为 0）
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days - 1)
    dates: list[str] = []
    current = start_date
    while current <= end_date:
        dates.append(current.isoformat())
        current += timedelta(days=1)

    # 收集所有出现过的情绪类型
    emotion_types: set[str] = {row.emotion_type for row in rows}

    # 构建 {emotion_type: {date: count}} 映射
    counts: dict[str, dict[str, int]] = {et: {} for et in emotion_types}
    for row in rows:
        date_str = row.date.isoformat()
        counts[row.emotion_type][date_str] = row.cnt

    # 按日期序列生成每个情绪类型的数组
    emotions: dict[str, list[int]] = {
        et: [counts[et].get(d, 0) for d in dates]
        for et in sorted(emotion_types)
    }

    return EmotionTrendsResponse(dates=dates, emotions=emotions)
