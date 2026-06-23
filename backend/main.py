"""FastAPI 应用入口"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings
from database import init_db
from routers.chat import router as chat_router
from routers.emotions import router as emotions_router
from routers.journal import router as journal_router
from routers.meditation import router as meditation_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期：启动时初始化数据库。"""
    init_db()
    yield


# 创建 FastAPI 应用
app = FastAPI(
    title=settings.APP_NAME,
    lifespan=lifespan,
)

# 配置 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册业务路由
app.include_router(chat_router)
app.include_router(emotions_router)
app.include_router(journal_router)
app.include_router(meditation_router)


@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "ok", "message": "Healing AI Backend is running"}


@app.get("/")
async def root():
    """根路径端点"""
    return {
        "message": "Welcome to Healing AI Backend API",
        "docs": "/docs",
    }
