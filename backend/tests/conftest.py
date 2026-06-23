"""pytest 共享夹具（fixtures）配置。

本文件为整个 tests/ 目录提供可复用的测试夹具：

- ``db_engine``  ：每个测试函数独立的内存 SQLite 引擎（使用 StaticPool
  保证同一测试内所有会话共享同一份内存数据库）。
- ``db``         ：直接返回 SQLAlchemy Session，方便在测试中直接断言
  数据库状态。
- ``override_get_db``：返回覆盖 ``get_db`` 依赖的生成器函数。
- ``client``     ：FastAPI ``TestClient``，已经将 ``get_db`` 覆盖为
  使用本测试专属的内存数据库，因此不会污染 ``data/healing.db``。
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from database import get_db, Base


@pytest.fixture
def db_engine():
    """每个测试函数独立的内存 SQLite 引擎。

    使用 ``StaticPool`` 让所有 session 共享同一个连接，从而共享同一份
    内存数据库；否则每次获取连接都会拿到一个全新的、空的 ``:memory:``
    数据库，导致数据无法跨请求累积。
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # 在内存数据库上创建所有业务表
    Base.metadata.create_all(bind=engine)
    try:
        yield engine
    finally:
        engine.dispose()


@pytest.fixture
def db(db_engine):
    """直接返回 SQLAlchemy Session，便于绕过 HTTP 直接断言数据库状态。"""
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=db_engine
    )
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def override_get_db(db_engine):
    """返回一个用于覆盖 ``get_db`` 依赖的生成器函数。

    使用本夹具返回的函数替换 ``get_db`` 后，FastAPI 的所有路由都将
    从本测试专属的内存数据库读取 / 写入数据。
    """
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=db_engine
    )

    def _override():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    return _override


@pytest.fixture
def client(db_engine, override_get_db):
    """FastAPI ``TestClient``，``get_db`` 依赖已被覆盖为使用内存数据库。

    使用 ``with TestClient(app) as c`` 触发 ``main.py`` 中定义的
    ``lifespan``（其中会调用 ``init_db()`` 在文件型 ``healing.db``
    上建表，但不会写入测试数据）。测试结束后会清理依赖覆盖，避免
    影响后续测试。
    """
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    # 清理依赖覆盖，防止影响其他测试
    app.dependency_overrides.clear()
