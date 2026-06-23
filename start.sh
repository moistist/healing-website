#!/usr/bin/env bash
# 心理疗愈网站一键启动脚本
# 同时启动后端 (FastAPI, 端口 8000) 和前端 (Vite, 端口 5173)
# Ctrl+C 退出时会同时关闭两个进程

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# ===== 颜色输出 =====
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; }

# ===== 检查环境 =====
command -v python3 >/dev/null 2>&1 || { err "未找到 python3"; exit 1; }
command -v node    >/dev/null 2>&1 || { err "未找到 node"; exit 1; }
command -v npm     >/dev/null 2>&1 || { err "未找到 npm"; exit 1; }

# ===== 后端环境检查 =====
if [ ! -d "$BACKEND_DIR" ] || [ ! -f "$BACKEND_DIR/main.py" ]; then
  err "未找到后端目录或 main.py：$BACKEND_DIR"
  exit 1
fi

if [ ! -f "$BACKEND_DIR/.env" ]; then
  warn "未发现 backend/.env，将从 .env.example 复制"
  if [ -f "$BACKEND_DIR/.env.example" ]; then
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    warn "已生成 .env，请编辑后端 $BACKEND_DIR/.env 填入真实的 OPENAI_API_KEY 后再次启动"
  else
    err "缺少 .env.example 模板文件"
    exit 1
  fi
fi

# ===== 安装依赖（首次运行）=====
if [ ! -d "$BACKEND_DIR/.venv" ]; then
  info "首次运行，正在创建后端虚拟环境..."
  python3 -m venv "$BACKEND_DIR/.venv"
fi
info "安装/更新后端依赖..."
"$BACKEND_DIR/.venv/bin/pip" install -q -r "$BACKEND_DIR/requirements.txt" || {
  err "后端依赖安装失败"
  exit 1
}

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  info "首次运行，正在安装前端依赖（可能需要几分钟）..."
  (cd "$FRONTEND_DIR" && npm install)
fi

# ===== 启动后端 =====
info "启动后端服务 (http://localhost:8000) ..."
(cd "$BACKEND_DIR" && "$BACKEND_DIR/.venv/bin/uvicorn" main:app --host 0.0.0.0 --port 8000 --reload) &
BACKEND_PID=$!

# ===== 启动前端 =====
info "启动前端服务 (http://localhost:5173) ..."
(cd "$FRONTEND_DIR" && npm run dev) &
FRONTEND_PID=$!

# ===== 优雅退出 =====
cleanup() {
  echo
  info "正在关闭服务..."
  kill "$BACKEND_PID" 2>/dev/null || true
  kill "$FRONTEND_PID" 2>/dev/null || true
  wait 2>/dev/null || true
  info "已退出"
}
trap cleanup INT TERM EXIT

echo
info "=========================================="
info "  心理疗愈网站已启动"
info "  前端地址: http://localhost:5173"
info "  后端地址: http://localhost:8000"
info "  API 文档: http://localhost:8000/docs"
info "  按 Ctrl+C 退出"
info "=========================================="
echo

wait
