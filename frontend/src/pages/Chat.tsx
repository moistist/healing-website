import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Loader2 } from 'lucide-react'

// ===== 类型定义 =====
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

const API_BASE = 'http://localhost:8000'

export default function Chat() {
  // ===== 状态管理 =====
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [initialLoading, setInitialLoading] = useState(true)

  // ===== Refs =====
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // ===== 自动滚动到底部 =====
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

  // ===== 加载对话历史 =====
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/chat/history`)
        if (res.ok) {
          const data = await res.json()
          // 取最近 50 条消息
          const history: Message[] = (data.messages || data || []).slice(-50).map((m: any, i: number) => ({
            id: m.id || `hist-${i}`,
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content || '',
            timestamp: m.timestamp || m.created_at,
          }))
          setMessages(history)
        }
      } catch (err) {
        console.error('加载对话历史失败:', err)
      } finally {
        setInitialLoading(false)
      }
    }
    loadHistory()
  }, [])

  // ===== 发送消息（流式） =====
  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isStreaming) return

    // 添加用户消息到列表
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsStreaming(true)
    setStreamingContent('')

    // 重置 textarea 高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      // 使用 AbortController 支持取消
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, stream: true }),
        signal: abortController.signal,
      })

      if (!res.ok) {
        throw new Error(`请求失败: ${res.status}`)
      }

      // 读取 SSE 流式响应
      const reader = res.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')

      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        // 解析 SSE 格式: "data: {...}\n\n"
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              // 兼容多种后端响应格式
              const content = parsed.content || parsed.delta || parsed.text || parsed.message || ''
              if (content) {
                fullContent += content
                setStreamingContent(fullContent)
              }
            } catch {
              // 如果不是 JSON，直接作为文本内容
              if (data && data !== '[DONE]') {
                fullContent += data
                setStreamingContent(fullContent)
              }
            }
          }
        }
      }

      // 流结束，将完整内容加入消息列表
      if (fullContent) {
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: fullContent,
          timestamp: new Date().toISOString(),
        }
        setMessages(prev => [...prev, aiMsg])
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('发送消息失败:', err)
        // 添加错误提示消息
        const errorMsg: Message = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '抱歉，连接出现了一点问题。请稍后再试一次吧 🌿',
          timestamp: new Date().toISOString(),
        }
        setMessages(prev => [...prev, errorMsg])
      }
    } finally {
      setIsStreaming(false)
      setStreamingContent('')
      abortControllerRef.current = null
    }
  }

  // ===== 键盘事件：Enter 发送，Shift+Enter 换行 =====
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ===== Textarea 自动调整高度 =====
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  // ===== 格式化时间戳 =====
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return ''
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  // ===== 初始加载状态 =====
  if (initialLoading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-sm min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="text-primary-dark animate-spin" size={32} />
          <p className="text-text-secondary text-sm">正在加载对话...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] max-w-4xl mx-auto">
      {/* ===== 顶部标题区 ===== */}
      <div className="flex-shrink-0 mb-4">
        <h1 className="text-2xl font-semibold text-text-primary">AI 对话</h1>
        <p className="text-text-secondary text-sm mt-1">
          在这里，你可以放心地卸下所有防备，和温柔的 AI 伙伴聊聊心事。
        </p>
      </div>

      {/* ===== 消息列表区域 ===== */}
      <div className="flex-1 overflow-y-auto rounded-3xl bg-white/50 backdrop-blur-sm p-4 md:p-6 shadow-sm space-y-4">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <span className="text-3xl">🌿</span>
            </div>
            <p className="text-text-secondary text-lg mb-1">开始一段新的对话吧</p>
            <p className="text-text-muted text-sm">说点什么，让心灵得到片刻的休憩</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            time={formatTime(msg.timestamp)}
          />
        ))}

        {/* 流式响应中的 AI 消息 */}
        {isStreaming && streamingContent && (
          <MessageBubble
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingContent,
            }}
            isStreaming
          />
        )}

        {/* 正在输入指示器 */}
        {isStreaming && !streamingContent && (
          <div className="flex justify-start">
            <div className="bg-secondary/20 rounded-2xl rounded-bl-md px-4 py-3 max-w-xs">
              <div className="flex items-center gap-1">
                <TypingDot delay={0} />
                <TypingDot delay={150} />
                <TypingDot delay={300} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ===== 输入区域 ===== */}
      <div className="flex-shrink-0 mt-4">
        <div className="flex items-end gap-3 bg-white/70 backdrop-blur-sm rounded-2xl p-3 shadow-sm border border-white/50">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="说说你的想法..."
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none bg-transparent outline-none text-text-primary placeholder:text-text-muted text-base leading-relaxed max-h-[120px] disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/80 hover:bg-primary disabled:bg-neutral-dark disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 hover:shadow-md disabled:shadow-none active:scale-95"
            aria-label="发送"
          >
            {isStreaming ? (
              <Loader2 className="text-white animate-spin" size={18} />
            ) : (
              <Send className="text-white" size={18} />
            )}
          </button>
        </div>
        <p className="text-text-muted text-xs mt-2 text-center">
          按 Enter 发送，Shift + Enter 换行
        </p>
      </div>
    </div>
  )
}

// ===== 消息气泡组件 =====
function MessageBubble({
  message,
  time,
  isStreaming,
}: {
  message: Message
  time?: string
  isStreaming?: boolean
}) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-[fadeSlideIn_0.3s_ease-out]`}
    >
      <div className={`max-w-[80%] md:max-w-[70%] ${isUser ? 'order-1' : 'order-1'}`}>
        {/* 气泡 */}
        <div
          className={`
            rounded-2xl px-4 py-3 shadow-sm
            ${isUser
              ? 'bg-primary/25 rounded-br-md text-text-primary'
              : 'bg-secondary/20 rounded-bl-md text-text-primary'
            }
            ${isStreaming ? 'border border-secondary/30' : ''}
          `}
        >
          <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
            {isStreaming && (
              <span className="inline-block w-0.5 h-4 bg-secondary-dark ml-0.5 animate-pulse align-middle" />
            )}
          </p>
        </div>
        {/* 时间戳 */}
        {time && (
          <p
            className={`text-xs text-text-muted mt-1 ${isUser ? 'text-right mr-1' : 'text-left ml-1'}`}
          >
            {time}
          </p>
        )}
      </div>
    </div>
  )
}

// ===== 正在输入动画点 =====
function TypingDot({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full bg-secondary-dark/60 animate-bounce"
      style={{ animationDelay: `${delay}ms` }}
    />
  )
}
