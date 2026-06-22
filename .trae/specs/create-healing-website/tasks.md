# Tasks

## 后端开发

- [ ] Task 1: 搭建 FastAPI 后端基础架构
  - [ ] SubTask 1.1: 创建 FastAPI 应用入口，配置 CORS 中间件
  - [ ] SubTask 1.2: 配置 SQLite 数据库连接（使用 SQLAlchemy）
  - [ ] SubTask 1.3: 创建数据库模型（对话记录、情绪记录、心情日记）
  - [ ] SubTask 1.4: 实现环境变量配置读取（API Key、Base URL、模型名称）

- [ ] Task 2: 实现 AI 对话 API
  - [ ] SubTask 2.1: 创建对话接口（POST /api/chat），支持普通和流式响应
  - [ ] SubTask 2.2: 实现 OpenAI 格式 API 调用客户端（支持流式 SSE）
  - [ ] SubTask 2.3: 实现对话历史保存和查询接口（GET /api/chat/history）
  - [ ] SubTask 2.4: 设计疗愈师系统提示词（温暖、共情、倾听风格）

- [ ] Task 3: 实现情绪记录 API
  - [ ] SubTask 3.1: 创建情绪记录接口（POST /api/emotions），保存情绪标签和描述
  - [ ] SubTask 3.2: 实现情绪历史查询接口（GET /api/emotions）
  - [ ] SubTask 3.3: 实现情绪趋势统计接口（GET /api/emotions/trends）

- [ ] Task 4: 实现心情日记 API
  - [ ] SubTask 4.1: 创建日记接口（POST /api/journal），保存日记内容
  - [ ] SubTask 4.2: 实现日记列表查询接口（GET /api/journal），支持分页和日期筛选
  - [ ] SubTask 4.3: 实现日记详情和删除接口（GET/DELETE /api/journal/{id}）

- [ ] Task 5: 实现冥想/呼吸练习 API（可选配置）
  - [ ] SubTask 5.1: 创建冥想配置接口（GET /api/meditation），返回预设的冥想引导文字和呼吸练习参数

## 前端开发

- [ ] Task 6: 搭建 React 前端基础架构
  - [ ] SubTask 6.1: 初始化 React 项目（使用 Vite），配置 TailwindCSS
  - [ ] SubTask 6.2: 设计全局样式主题（柔和色调、圆润边角、舒适字体）
  - [ ] SubTask 6.3: 创建路由结构（首页、对话页、情绪页、冥想页、日记页）
  - [ ] SubTask 6.4: 实现响应式布局组件（导航栏、侧边栏、主内容区）

- [ ] Task 7: 实现 AI 对话页面
  - [ ] SubTask 7.1: 创建对话界面组件（消息列表、输入框、发送按钮）
  - [ ] SubTask 7.2: 实现流式响应显示（SSE 接收，逐字显示）
  - [ ] SubTask 7.3: 实现对话历史加载和展示
  - [ ] SubTask 7.4: 设计对话页面 UI（柔和背景、气泡式消息、温暖色调）

- [ ] Task 8: 实现情绪记录页面
  - [ ] SubTask 8.1: 创建情绪选择组件（情绪标签选择器，如焦虑、平静、悲伤、快乐等）
  - [ ] SubTask 8.2: 实现情绪记录表单（选择情绪 + 输入描述）
  - [ ] SubTask 8.3: 实现情绪历史列表展示
  - [ ] SubTask 8.4: 实现情绪趋势图表展示（使用简单柱状图或折线图）

- [ ] Task 9: 实现冥想/呼吸练习页面
  - [ ] SubTask 9.1: 创建呼吸练习组件（呼吸动画引导：吸气-屏气-呼气循环）
  - [ ] SubTask 9.2: 实现计时器功能（可设置练习时长）
  - [ ] SubTask 9.3: 实现冥想引导文字展示组件
  - [ ] SubTask 9.4: 设计冥想页面 UI（柔和渐变背景、舒缓动画）

- [ ] Task 10: 实现心情日记页面
  - [ ] SubTask 10.1: 创建日记编辑组件（富文本或 Markdown 编辑器）
  - [ ] SubTask 10.2: 实现日记列表展示（按日期分组，卡片式布局）
  - [ ] SubTask 10.3: 实现日记详情查看和删除功能
  - [ ] SubTask 10.4: 实现日期筛选功能

- [ ] Task 11: 实现首页
  - [ ] SubTask 11.1: 设计首页布局（欢迎语、功能入口卡片、每日一句疗愈语）
  - [ ] SubTask 11.2: 实现功能入口导航（跳转至对话、情绪、冥想、日记页面）

## 集成与测试

- [ ] Task 12: 前后端联调
  - [ ] SubTask 12.1: 配置前端 API 请求（axios 或 fetch）
  - [ ] SubTask 12.2: 联调对话功能（普通和流式）
  - [ ] SubTask 12.3: 联调情绪记录和日记功能
  - [ ] SubTask 12.4: 测试响应式布局在不同屏幕尺寸下的表现

- [ ] Task 13: 部署配置
  - [ ] SubTask 13.1: 创建环境变量配置文件示例（.env.example）
  - [ ] SubTask 13.2: 编写启动脚本（后端 + 前端）
  - [ ] SubTask 13.3: 配置生产环境构建（前端 build，后端 uvicorn）

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 1]
- [Task 5] depends on [Task 1]
- [Task 7] depends on [Task 6, Task 2]
- [Task 8] depends on [Task 6, Task 3]
- [Task 9] depends on [Task 6]
- [Task 10] depends on [Task 6, Task 4]
- [Task 11] depends on [Task 6]
- [Task 12] depends on [Task 7, Task 8, Task 9, Task 10, Task 11]
- [Task 13] depends on [Task 12]
