# 心理疗愈网站 Spec

## Why
现代人面临压力、焦虑、情绪困扰等问题，需要一个温和、私密的数字空间来获得心理支持和情绪疏导。通过AI驱动的综合疗愈平台，用户可以随时获得倾听、情绪记录、冥想引导等服务，降低心理支持的门槛。

## What Changes
- 新建完整的前后端项目结构
- 后端：FastAPI 服务，提供 API 接口，集成 OpenAI 格式的 LLM API
- 前端：React + TailwindCSS，柔和简约的 UI 设计
- 数据库：SQLite 存储用户数据（对话记录、心情日记等）
- 功能模块：AI 对话疗愈、情绪记录、冥想/呼吸练习、心情日记

## Impact
- Affected specs: 无（全新项目）
- Affected code: 整个项目目录

## ADDED Requirements

### Requirement: AI 对话疗愈
系统 SHALL 提供 AI 对话功能，AI 以温暖、共情的疗愈师角色与用户交流，提供倾听、情绪疏导和正念引导。

#### Scenario: 用户发起对话
- **WHEN** 用户进入对话页面并输入消息
- **THEN** 系统调用后端 API，后端转发至 OpenAI 格式的 LLM API，返回疗愈师的回复
- **AND** 对话内容保存至数据库

#### Scenario: 流式响应
- **WHEN** AI 生成回复时
- **THEN** 系统支持流式输出（SSE），用户可实时看到回复内容

### Requirement: 情绪记录
系统 SHALL 提供情绪记录功能，用户可记录当前的情绪状态、触发事件和感受。

#### Scenario: 记录情绪
- **WHEN** 用户选择情绪标签（如焦虑、平静、悲伤、快乐等）并输入描述
- **THEN** 系统将情绪记录保存至数据库
- **AND** 显示历史情绪记录列表

#### Scenario: 情绪趋势查看
- **WHEN** 用户查看情绪历史
- **THEN** 系统展示情绪变化趋势（按日期分组的情绪统计）

### Requirement: 冥想/呼吸练习
系统 SHALL 提供引导式冥想和呼吸练习功能，帮助用户放松身心。

#### Scenario: 呼吸练习
- **WHEN** 用户选择呼吸练习模式
- **THEN** 系统展示呼吸动画引导（吸气-屏气-呼气循环）
- **AND** 提供计时器和完成提示

#### Scenario: 冥想引导
- **WHEN** 用户选择冥想练习
- **THEN** 系统展示冥想引导文字和计时器
- **AND** 可选背景音乐或自然音效

### Requirement: 心情日记
系统 SHALL 提供心情日记功能，用户可记录每日心情、事件和反思。

#### Scenario: 写日记
- **WHEN** 用户进入日记页面并撰写内容
- **THEN** 系统保存日记至数据库，支持富文本或 Markdown 格式
- **AND** 显示日记列表，支持按日期筛选

#### Scenario: 查看历史日记
- **WHEN** 用户浏览历史日记
- **THEN** 系统按时间倒序展示日记列表
- **AND** 支持点击查看详情

### Requirement: API 配置管理
系统 SHALL 通过服务端环境变量配置 OpenAI 格式的 API（API Key、Base URL、模型名称）。

#### Scenario: 读取配置
- **WHEN** 后端服务启动时
- **THEN** 系统从环境变量读取 API 配置
- **AND** 若配置缺失，启动失败并提示

#### Scenario: 调用 LLM API
- **WHEN** 需要调用 AI 时
- **THEN** 系统使用配置的 Base URL、API Key 和模型名称发起请求
- **AND** 支持流式和非流式两种模式

### Requirement: 前端 UI 设计
系统 SHALL 采用柔和、简约、符合心理安慰风格的 UI 设计。

#### Scenario: 视觉风格
- **WHEN** 用户访问网站
- **THEN** 界面采用柔和的色调（如淡蓝、淡紫、米白、浅绿等）
- **AND** 使用圆润的边角、柔和的阴影、舒适的字体
- **AND** 整体布局简洁，避免视觉压迫感

#### Scenario: 响应式设计
- **WHEN** 用户在不同设备上访问
- **THEN** 界面自适应桌面和移动端屏幕

## MODIFIED Requirements
无（全新项目）

## REMOVED Requirements
无（全新项目）
