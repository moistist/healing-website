"""数据库模型定义"""
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from database import Base


class ChatMessage(Base):
    """对话消息模型"""
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(20), nullable=False)  # user 或 assistant
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<ChatMessage(id={self.id}, role={self.role})>"


class EmotionRecord(Base):
    """情绪记录模型"""
    __tablename__ = "emotion_records"
    
    id = Column(Integer, primary_key=True, index=True)
    emotion_type = Column(String(50), nullable=False)  # 焦虑/平静/悲伤/快乐等
    description = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<EmotionRecord(id={self.id}, emotion_type={self.emotion_type})>"


class JournalEntry(Base):
    """心情日记模型"""
    __tablename__ = "journal_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    mood = Column(String(50), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<JournalEntry(id={self.id}, title={self.title})>"
