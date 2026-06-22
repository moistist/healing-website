"""心情日记路由"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from datetime import datetime

from database import get_db
from models import JournalEntry
from schemas import JournalCreate, JournalResponse, JournalListResponse

router = APIRouter(prefix="/api/journal", tags=["journal"])


@router.post("", response_model=JournalResponse, status_code=201)
def create_journal(payload: JournalCreate, db: Session = Depends(get_db)):
    """创建一条心情日记"""
    entry = JournalEntry(
        title=payload.title,
        content=payload.content,
        mood=payload.mood,
    )
    db.add(entry)
    try:
        db.commit()
        db.refresh(entry)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"数据库写入失败: {e}")
    return entry


@router.get("", response_model=JournalListResponse)
def list_journals(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=100, description="每页条数"),
    start_date: Optional[datetime] = Query(None, description="起始日期（含），ISO 格式"),
    end_date: Optional[datetime] = Query(None, description="截止日期（含），ISO 格式"),
    db: Session = Depends(get_db),
):
    """获取日记列表，支持分页与日期筛选，按时间倒序"""
    query = db.query(JournalEntry)

    # 日期筛选
    if start_date is not None:
        query = query.filter(JournalEntry.timestamp >= start_date)
    if end_date is not None:
        query = query.filter(JournalEntry.timestamp <= end_date)

    # 总数
    total = query.count()

    # 分页 + 倒序
    journals = (
        query.order_by(desc(JournalEntry.timestamp))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return JournalListResponse(
        journals=journals,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{journal_id}", response_model=JournalResponse)
def get_journal(journal_id: int, db: Session = Depends(get_db)):
    """获取单条日记详情，不存在时返回 404"""
    entry = db.query(JournalEntry).filter(JournalEntry.id == journal_id).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="日记不存在")
    return entry


@router.delete("/{journal_id}")
def delete_journal(journal_id: int, db: Session = Depends(get_db)):
    """删除指定日记，不存在时返回 404"""
    entry = db.query(JournalEntry).filter(JournalEntry.id == journal_id).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="日记不存在")
    try:
        db.delete(entry)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"删除失败: {e}")
    return {"message": "删除成功", "id": journal_id}
