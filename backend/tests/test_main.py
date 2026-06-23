"""主应用测试：根路径 ``/`` 与健康检查 ``/health``。"""


def test_root_returns_200(client):
    """根路径 / 应返回 HTTP 200。"""
    response = client.get("/")
    assert response.status_code == 200


def test_root_payload_contains_welcome_message_and_docs(client):
    """根路径 / 响应体应包含欢迎信息以及 docs 链接。"""
    data = client.get("/").json()
    assert "message" in data
    # 欢迎信息中应包含项目名称
    assert "Healing AI Backend API" in data["message"]
    # 文档链接
    assert data["docs"] == "/docs"


def test_health_check_returns_200(client):
    """健康检查端点 /health 应返回 HTTP 200。"""
    response = client.get("/health")
    assert response.status_code == 200


def test_health_check_status_ok(client):
    """健康检查响应中 status 字段应等于 ok。"""
    data = client.get("/health").json()
    assert data["status"] == "ok"
    # 同时也应包含一段描述性 message
    assert "message" in data
