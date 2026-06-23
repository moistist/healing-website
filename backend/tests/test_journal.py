"""心情日记 API 测试。

覆盖：
- POST   /api/journal          创建日记
- GET    /api/journal          列表（分页 + 日期筛选）
- GET    /api/journal/{id}     详情
- DELETE /api/journal/{id}     删除
- 各种 404 / 422 场景
"""


def _create_journal(client, **overrides):
    """辅助函数：快速创建一条日记并返回响应 JSON。

    默认字段是合法的；调用方可以用 ``title=...`` 等关键字覆盖任何字段。
    """
    payload = {
        "title": "美好的一天",
        "content": "今天阳光很好，去公园散步了。",
        "mood": "happy",
    }
    payload.update(overrides)
    response = client.post("/api/journal", json=payload)
    assert response.status_code == 201
    return response.json()


# ──────────── POST /api/journal ────────────

def test_create_journal_returns_201_and_full_fields(client):
    """成功创建日记应返回 201 状态码与完整字段。"""
    data = _create_journal(client, title="雨天随想", mood="calm")

    assert data["title"] == "雨天随想"
    assert data["content"] == "今天阳光很好，去公园散步了。"
    assert data["mood"] == "calm"
    # 框架字段
    assert isinstance(data["id"], int)
    assert "timestamp" in data


def test_create_journal_optional_mood_can_be_null(client):
    """``mood`` 字段为可选（None）。"""
    data = _create_journal(client, mood=None)
    assert data["mood"] is None


def test_create_journal_missing_title_returns_422(client):
    """缺少必填字段 ``title`` 应返回 422。"""
    response = client.post(
        "/api/journal",
        json={"content": "没有标题", "mood": "ok"},
    )
    assert response.status_code == 422


def test_create_journal_missing_content_returns_422(client):
    """缺少必填字段 ``content`` 应返回 422。"""
    response = client.post(
        "/api/journal",
        json={"title": "只有标题", "mood": "ok"},
    )
    assert response.status_code == 422


# ──────────── GET /api/journal ────────────

def test_list_journals_empty(client):
    """空数据库应返回空列表与 total=0。"""
    data = client.get("/api/journal").json()
    assert data["journals"] == []
    assert data["total"] == 0
    # 字段名校验
    for key in ("journals", "total", "page", "page_size"):
        assert key in data


def test_list_journals_pagination(client):
    """插入多条日记后分页参数应正确生效。"""
    for i in range(5):
        _create_journal(client, title=f"日记{i + 1}")

    page1 = client.get("/api/journal?page=1&page_size=2").json()
    assert page1["total"] == 5
    assert page1["page"] == 1
    assert page1["page_size"] == 2
    assert len(page1["journals"]) == 2

    page2 = client.get("/api/journal?page=2&page_size=2").json()
    assert page2["page"] == 2
    assert len(page2["journals"]) == 2


def test_list_journals_with_date_filter(client):
    """使用 ``start_date`` / ``end_date`` 应能正确筛选。"""
    _create_journal(client)
    _create_journal(client)

    # 起始日期非常早：应能返回全部 2 条
    r = client.get("/api/journal?start_date=2000-01-01T00:00:00")
    assert r.status_code == 200
    assert r.json()["total"] == 2

    # 截止日期非常晚：应能返回全部 2 条
    r = client.get("/api/journal?end_date=2099-12-31T23:59:59")
    assert r.status_code == 200
    assert r.json()["total"] == 2

    # 截止日期非常早：应返回 0 条
    r = client.get("/api/journal?end_date=2000-01-01T00:00:00")
    assert r.status_code == 200
    assert r.json()["total"] == 0


# ──────────── GET /api/journal/{id} ────────────

def test_get_journal_returns_detail(client):
    """根据 ID 获取日记详情。"""
    created = _create_journal(client, title="具体某天")
    journal_id = created["id"]

    response = client.get(f"/api/journal/{journal_id}")
    assert response.status_code == 200

    data = response.json()
    assert data["id"] == journal_id
    assert data["title"] == "具体某天"
    assert data["content"] == created["content"]
    assert data["mood"] == created["mood"]


def test_get_journal_not_found_returns_404(client):
    """获取不存在的日记应返回 404。"""
    response = client.get("/api/journal/99999")
    assert response.status_code == 404
    # 错误信息应包含"不存在"
    assert "不存在" in response.json()["detail"]


# ──────────── DELETE /api/journal/{id} ────────────

def test_delete_journal_success(client):
    """成功删除日记应返回成功消息，再次查询返回 404。"""
    created = _create_journal(client)
    journal_id = created["id"]

    # 删除
    response = client.delete(f"/api/journal/{journal_id}")
    assert response.status_code == 200
    body = response.json()
    assert "message" in body
    assert body["id"] == journal_id

    # 再次查询：应不存在
    response = client.get(f"/api/journal/{journal_id}")
    assert response.status_code == 404


def test_delete_journal_not_found_returns_404(client):
    """删除不存在的日记应返回 404。"""
    response = client.delete("/api/journal/99999")
    assert response.status_code == 404
    assert "不存在" in response.json()["detail"]
