"""冥想配置 API 测试。

``/api/meditation`` 是纯静态数据接口（不涉及数据库），
因此本文件主要校验返回结构是否包含
``breathing_exercise``、``meditation_guides``、``available_durations`` 三个关键字段，
并验证具体值的合理性。
"""


def test_meditation_returns_200(client):
    """``GET /api/meditation`` 应返回 HTTP 200。"""
    response = client.get("/api/meditation")
    assert response.status_code == 200


def test_meditation_response_has_all_required_top_level_fields(client):
    """响应顶层应包含 ``breathing_exercise``、``meditation_guides``、``available_durations``。"""
    data = client.get("/api/meditation").json()
    assert "breathing_exercise" in data
    assert "meditation_guides" in data
    assert "available_durations" in data


def test_breathing_exercise_has_expected_values(client):
    """``breathing_exercise`` 三个字段均为正整数（4-4-6 节拍）。"""
    be = client.get("/api/meditation").json()["breathing_exercise"]

    # 字段存在性
    assert "inhale_seconds" in be
    assert "hold_seconds" in be
    assert "exhale_seconds" in be

    # 字段类型
    for k, v in be.items():
        assert isinstance(v, int), f"{k} 应为 int，实际为 {type(v)}"
        assert v > 0, f"{k} 应为正整数，实际为 {v}"

    # 业务值（4-4-6 节拍）
    assert be["inhale_seconds"] == 4
    assert be["hold_seconds"] == 4
    assert be["exhale_seconds"] == 6


def test_meditation_guides_is_non_empty_list(client):
    """``meditation_guides`` 至少包含一项，且每项都有完整字段。"""
    guides = client.get("/api/meditation").json()["meditation_guides"]

    assert isinstance(guides, list)
    assert len(guides) >= 1

    for guide in guides:
        # 每项必须包含 title / content / duration_minutes
        assert "title" in guide and isinstance(guide["title"], str) and guide["title"]
        assert "content" in guide and isinstance(guide["content"], str) and guide["content"]
        assert "duration_minutes" in guide
        assert isinstance(guide["duration_minutes"], int)
        assert guide["duration_minutes"] > 0


def test_available_durations_are_positive_ints(client):
    """``available_durations`` 应是至少一项的正整数列表。"""
    durations = client.get("/api/meditation").json()["available_durations"]

    assert isinstance(durations, list)
    assert len(durations) >= 1
    for d in durations:
        assert isinstance(d, int)
        assert d > 0


def test_available_durations_are_sorted_ascending(client):
    """``available_durations`` 应当按升序排列（方便前端做选项）。"""
    durations = client.get("/api/meditation").json()["available_durations"]
    assert durations == sorted(durations)
