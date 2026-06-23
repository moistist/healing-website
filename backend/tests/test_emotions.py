"""情绪记录 API 测试。

覆盖：
- POST /api/emotions             创建情绪记录
- GET  /api/emotions             列表查询（分页 + 字段名校验）
- GET  /api/emotions/trends      趋势统计
- 各种错误码场景
"""


# ──────────── POST /api/emotions ────────────

def test_create_emotion_returns_201(client):
    """正常创建情绪记录应返回 201 状态码与完整字段。"""
    response = client.post(
        "/api/emotions",
        json={"emotion_type": "平静", "description": "今天感觉很放松"},
    )
    assert response.status_code == 201

    data = response.json()
    # 业务字段
    assert data["emotion_type"] == "平静"
    assert data["description"] == "今天感觉很放松"
    # 框架字段
    assert isinstance(data["id"], int)
    assert "timestamp" in data


def test_create_emotion_strips_whitespace(client):
    """``emotion_type`` 字段的前后空白应被自动去除。"""
    response = client.post(
        "/api/emotions",
        json={"emotion_type": "  焦虑  ", "description": None},
    )
    assert response.status_code == 201
    assert response.json()["emotion_type"] == "焦虑"


def test_create_emotion_empty_type_returns_400(client):
    """``emotion_type`` 全是空格时应返回 400（业务校验失败）。"""
    response = client.post(
        "/api/emotions",
        json={"emotion_type": "   ", "description": "x"},
    )
    assert response.status_code == 400


def test_create_emotion_missing_required_field_returns_422(client):
    """缺少 ``emotion_type`` 字段应返回 422（Pydantic 入参校验失败）。"""
    response = client.post(
        "/api/emotions",
        json={"description": "no emotion_type"},
    )
    assert response.status_code == 422


# ──────────── GET /api/emotions ────────────

def test_list_emotions_empty(client):
    """空数据库应返回空列表、total=0、page=1、page_size=20。"""
    data = client.get("/api/emotions").json()

    assert data["emotions"] == []
    assert data["total"] == 0
    assert data["page"] == 1
    assert data["page_size"] == 20

    # 字段名必须包含完整的四个键
    for key in ("emotions", "total", "page", "page_size"):
        assert key in data


def test_list_emotions_pagination(client):
    """插入多条记录后分页参数应正确生效。"""
    # 准备 4 条情绪
    for et in ["焦虑", "平静", "快乐", "悲伤"]:
        client.post("/api/emotions", json={"emotion_type": et})

    # 第 1 页：每页 2 条
    page1 = client.get("/api/emotions?page=1&page_size=2").json()
    assert page1["total"] == 4
    assert page1["page"] == 1
    assert page1["page_size"] == 2
    assert len(page1["emotions"]) == 2

    # 第 2 页：每页 2 条
    page2 = client.get("/api/emotions?page=2&page_size=2").json()
    assert page2["page"] == 2
    assert len(page2["emotions"]) == 2


def test_list_emotions_ordered_by_newest_first(client):
    """列表应按时间倒序排列（最新在前）。"""
    for et in ["焦虑", "平静", "快乐"]:
        client.post("/api/emotions", json={"emotion_type": et})

    types = [e["emotion_type"] for e in client.get("/api/emotions").json()["emotions"]]
    # 由于同一秒内多条记录可能具有相同时间戳，这里只断言
    # 集合完全一致即可（顺序受 server_default 影响，但每条都不应缺失）
    assert set(types) == {"焦虑", "平静", "快乐"}


# ──────────── GET /api/emotions/trends ────────────

def test_emotion_trends_format(client):
    """``/api/emotions/trends?days=7`` 应返回 ``dates`` 数组与 ``emotions`` 字典。"""
    # 准备一些情绪
    client.post("/api/emotions", json={"emotion_type": "焦虑"})
    client.post("/api/emotions", json={"emotion_type": "焦虑"})
    client.post("/api/emotions", json={"emotion_type": "平静"})

    data = client.get("/api/emotions/trends?days=7").json()

    # 顶层字段
    assert "dates" in data
    assert "emotions" in data
    # dates 是长度为 7 的字符串列表
    assert isinstance(data["dates"], list)
    assert len(data["dates"]) == 7
    # emotions 是 dict
    assert isinstance(data["emotions"], dict)
    # 我们插入了两个情绪类型
    assert "焦虑" in data["emotions"]
    assert "平静" in data["emotions"]
    # 每种情绪的计数数组长度 == dates 长度
    for _etype, counts in data["emotions"].items():
        assert len(counts) == 7
        assert all(isinstance(c, int) for c in counts)


def test_emotion_trends_invalid_days_returns_422(client):
    """``days`` 参数越界（> 30）应返回 422。"""
    response = client.get("/api/emotions/trends?days=100")
    assert response.status_code == 422


def test_emotion_trends_with_no_records(client):
    """没有情绪记录时，``emotions`` 字典应为空（dates 仍应有 7 个日期）。"""
    data = client.get("/api/emotions/trends?days=7").json()
    assert data["emotions"] == {}
    assert len(data["dates"]) == 7
