# 心理疗愈网站

一个温柔、私密的 AI 心理疗愈平台，集对话、情绪记录、冥想练习和心情日记于一体。

## 技术栈

- **后端**：FastAPI + SQLAlchemy + SQLite
- **前端**：React 19 + TypeScript + Vite + TailwindCSS 4
- **LLM**：兼容 OpenAI Chat Completions API 的任意服务（OpenAI、DeepSeek、Moonshot、Qwen 等）

## 项目结构

```
.
├── backend/                # FastAPI 后端
│   ├── main.py             # 应用入口
│   ├── config.py           # 配置管理（pydantic-settings）
│   ├── database.py         # 数据库连接和会话
│   ├── models.py           # SQLAlchemy 数据模型
│   ├── schemas.py          # Pydantic 请求/响应模型
│   ├── routers/            # API 路由
│   │   ├── chat.py         #   - AI 对话（流式 + 历史）
│   │   ├── emotions.py     #   - 情绪记录（含趋势统计）
│   │   ├── journal.py      #   - 心情日记（CRUD + 分页筛选）
│   │   └── meditation.py   #   - 冥想配置（呼吸参数 + 引导文字）
│   ├── services/
│   │   └── llm_client.py   # OpenAI 兼容异步 LLM 客户端
│   ├── data/               # SQLite 数据库文件目录（自动创建）
│   ├── .env.example        # 环境变量示例
│   └── requirements.txt
├── frontend/               # React 前端
│   ├── src/
│   │   ├── components/     # 布局组件（Layout/Navbar/Sidebar）
│   │   ├── pages/          # 页面（Home/Chat/Emotions/Meditation/Journal）
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css       # 全局样式（柔和疗愈主题）
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 功能

| 模块 | 说明 |
| --- | --- |
| AI 对话 | 温暖、共情的疗愈师角色，支持流式（SSE）逐字输出，自动保存历史 |
| 情绪记录 | 10 种预设情绪 + 自定义标签，含描述、最近 7 天趋势柱状图 |
| 冥想练习 | 呼吸练习动画（吸气-屏气-呼气循环）、3 套冥想引导文字、可选 5/10/15/20 分钟 |
| 心情日记 | 标题/内容/心情标签、按今天/昨天/本周分组展示、日期范围筛选、CRUD |
| 首页 | 欢迎语、每日一句疗愈语（每日稳定 + 可换一换）、快速入口卡片 |

UI 风格：柔和色调（淡蓝/淡紫/浅绿/米白）、圆润边角、舒缓动画、桌面+移动端响应式布局。

## 快速开始

### 1. 配置后端

```bash
cd backend
cp .env.example .env
# 编辑 .env，至少填入 OPENAI_API_KEY
pip install -r requirements.txt
```

`OPENAI_BASE_URL` 和 `OPENAI_MODEL` 留空时会使用默认值（OpenAI 官方 + gpt-3.5-turbo）。使用其他兼容服务时改写即可，例如 DeepSeek：

```env
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
```

### 2. 启动后端

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

健康检查：`curl http://localhost:8000/health`

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

浏览器访问 `http://localhost:5173`。

## 生产部署

```bash
# 前端构建
cd frontend
npm run build       # 输出到 frontend/dist

# 后端启动（生产模式）
cd ../backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
```

生产环境建议用 Nginx 反向代理：前端静态文件走 `/`，后端 API 走 `/api/`，并把 `/api/` 的 SSE 响应关闭缓冲（`proxy_buffering off`）。

## API 概览

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET  | `/health` | 健康检查 |
| POST | `/api/chat` | 发送消息（body: `{message, stream}`，stream=true 走 SSE） |
| GET  | `/api/chat/history?limit&offset` | 对话历史（默认 50 条） |
| POST | `/api/emotions` | 创建情绪记录 |
| GET  | `/api/emotions?page&page_size` | 情绪历史（分页） |
| GET  | `/api/emotions/trends?days` | 情绪趋势统计（7/30 天） |
| POST | `/api/journal` | 创建日记 |
| GET  | `/api/journal?page&page_size&start_date&end_date` | 日记列表（分页+日期筛选） |
| GET  | `/api/journal/{id}` | 日记详情 |
| DELETE | `/api/journal/{id}` | 删除日记 |
| GET  | `/api/meditation` | 冥想配置（呼吸参数 + 引导文字） |

完整 OpenAPI 文档：后端启动后访问 `http://localhost:8000/docs`。
