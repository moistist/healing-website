import { useState, useEffect, useCallback } from 'react'
import { Smile, Plus, Clock, ChevronDown, TrendingUp, Check, X } from 'lucide-react'

// ===== 类型定义 =====
interface EmotionRecord {
  id: number
  emotion_type: string
  description: string | null
  created_at: string
}

interface EmotionTrend {
  date: string
  emotions: Record<string, number>
}

// ===== 预设情绪标签及颜色 =====
const PRESET_EMOTIONS: { label: string; color: string; bg: string; ring: string }[] = [
  { label: '焦虑', color: 'text-orange-700', bg: 'bg-orange-100', ring: 'ring-orange-300' },
  { label: '平静', color: 'text-sky-700', bg: 'bg-sky-100', ring: 'ring-sky-300' },
  { label: '悲伤', color: 'text-blue-700', bg: 'bg-blue-100', ring: 'ring-blue-300' },
  { label: '快乐', color: 'text-yellow-700', bg: 'bg-yellow-100', ring: 'ring-yellow-300' },
  { label: '愤怒', color: 'text-red-700', bg: 'bg-red-100', ring: 'ring-red-300' },
  { label: '疲惫', color: 'text-gray-600', bg: 'bg-gray-100', ring: 'ring-gray-300' },
  { label: '兴奋', color: 'text-pink-700', bg: 'bg-pink-100', ring: 'ring-pink-300' },
  { label: '孤独', color: 'text-indigo-700', bg: 'bg-indigo-100', ring: 'ring-indigo-300' },
  { label: '感恩', color: 'text-emerald-700', bg: 'bg-emerald-100', ring: 'ring-emerald-300' },
  { label: '恐惧', color: 'text-purple-700', bg: 'bg-purple-100', ring: 'ring-purple-300' },
]

// 趋势图表的颜色映射
const TREND_COLORS: Record<string, string> = {
  '焦虑': '#F97316',
  '平静': '#38BDF8',
  '悲伤': '#60A5FA',
  '快乐': '#FACC15',
  '愤怒': '#EF4444',
  '疲惫': '#9CA3AF',
  '兴奋': '#EC4899',
  '孤独': '#818CF8',
  '感恩': '#34D399',
  '恐惧': '#A855F7',
}

const API_BASE = 'http://localhost:8000'

// ===== 工具函数：获取情绪标签颜色 =====
function getEmotionStyle(label: string) {
  return PRESET_EMOTIONS.find((e) => e.label === label) ?? {
    label,
    color: 'text-secondary-dark',
    bg: 'bg-secondary/20',
    ring: 'ring-secondary/40',
  }
}

// ===== 工具函数：格式化时间 =====
function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  if (diffHr < 24) return `${diffHr} 小时前`
  if (diffDay < 7) return `${diffDay} 天前`
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

export default function Emotions() {
  // ===== 表单状态 =====
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null)
  const [customEmotion, setCustomEmotion] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // ===== 历史列表状态 =====
  const [history, setHistory] = useState<EmotionRecord[]>([])
  const [historyPage, setHistoryPage] = useState(1)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  // ===== 趋势状态 =====
  const [trends, setTrends] = useState<EmotionTrend[]>([])
  const [trendsLoading, setTrendsLoading] = useState(false)

  // ===== 加载情绪历史 =====
  const loadHistory = useCallback(async (page: number, append = false) => {
    setHistoryLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/emotions?page=${page}&page_size=10`)
      if (!res.ok) throw new Error('加载失败')
      const data: EmotionRecord[] = await res.json()
      if (data.length < 10) setHasMore(false)
      setHistory((prev) => (append ? [...prev, ...data] : data))
    } catch {
      // 静默处理
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  // ===== 加载情绪趋势 =====
  const loadTrends = useCallback(async () => {
    setTrendsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/emotions/trends?days=7`)
      if (!res.ok) throw new Error('加载失败')
      const data: EmotionTrend[] = await res.json()
      setTrends(data)
    } catch {
      // 静默处理
    } finally {
      setTrendsLoading(false)
    }
  }, [])

  // ===== 初始化加载 =====
  useEffect(() => {
    loadHistory(1)
    loadTrends()
  }, [loadHistory, loadTrends])

  // ===== 选择情绪标签 =====
  const handleSelectEmotion = (label: string) => {
    setShowCustomInput(false)
    setCustomEmotion('')
    setSelectedEmotion((prev) => (prev === label ? null : label))
  }

  // ===== 提交情绪记录 =====
  const handleSubmit = async () => {
    const emotionType = customEmotion.trim() || selectedEmotion
    if (!emotionType) return

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/emotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emotion_type: emotionType,
          description: description.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error('提交失败')

      // 成功：清空表单、显示提示、刷新列表和趋势
      setSelectedEmotion(null)
      setCustomEmotion('')
      setDescription('')
      setShowCustomInput(false)
      setSuccessMsg('记录成功，继续保持觉察 ✨')
      setTimeout(() => setSuccessMsg(''), 3000)

      // 重新加载第一页
      setHistoryPage(1)
      setHasMore(true)
      loadHistory(1)
      loadTrends()
    } catch {
      setSuccessMsg('提交失败，请稍后重试')
      setTimeout(() => setSuccessMsg(''), 3000)
    } finally {
      setSubmitting(false)
    }
  }

  // ===== 加载更多历史 =====
  const handleLoadMore = () => {
    const next = historyPage + 1
    setHistoryPage(next)
    loadHistory(next, true)
  }

  // ===== 收集趋势中所有出现的情绪类型 =====
  const allTrendEmotions = Array.from(
    new Set(trends.flatMap((t) => Object.keys(t.emotions)))
  )

  // ===== 计算趋势柱状图最大值 =====
  const maxTrendCount = Math.max(
    1,
    ...trends.flatMap((t) => Object.values(t.emotions))
  )

  return (
    <div className="space-y-6">
      {/* ===== 页面标题 ===== */}
      <section className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 lg:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-secondary/30 flex items-center justify-center">
            <Smile className="text-secondary-dark" size={22} />
          </div>
          <h2 className="text-2xl font-semibold text-text-primary">情绪记录</h2>
        </div>
        <p className="text-text-secondary">
          每一种情绪都值得被看见，记录此刻的心情，慢慢了解自己。
        </p>
      </section>

      {/* ===== 情绪选择 + 表单 ===== */}
      <section className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 lg:p-8 shadow-sm space-y-5">
        <h3 className="text-lg font-medium text-text-primary">此刻的心情</h3>

        {/* 情绪标签选择器 */}
        <div className="flex flex-wrap gap-3">
          {PRESET_EMOTIONS.map((em) => {
            const isSelected = selectedEmotion === em.label && !customEmotion.trim()
            return (
              <button
                key={em.label}
                onClick={() => handleSelectEmotion(em.label)}
                className={`
                  px-4 py-2 rounded-2xl text-sm font-medium
                  transition-all duration-200 cursor-pointer
                  ${isSelected
                    ? `${em.bg} ${em.color} ring-2 ${em.ring} shadow-sm scale-105`
                    : `${em.bg}/60 ${em.color} hover:${em.bg} hover:shadow-sm`
                  }
                `}
              >
                {em.label}
              </button>
            )
          })}

          {/* 自定义情绪按钮 */}
          <button
            onClick={() => {
              setShowCustomInput((v) => !v)
              setSelectedEmotion(null)
              setCustomEmotion('')
            }}
            className={`
              px-4 py-2 rounded-2xl text-sm font-medium
              transition-all duration-200 cursor-pointer
              ${showCustomInput
                ? 'bg-secondary/30 text-secondary-dark ring-2 ring-secondary/40 shadow-sm scale-105'
                : 'bg-neutral text-text-secondary hover:bg-neutral-dark/50'
              }
            `}
          >
            <span className="flex items-center gap-1">
              <Plus size={14} />
              自定义
            </span>
          </button>
        </div>

        {/* 自定义情绪输入 */}
        {showCustomInput && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
            <input
              type="text"
              value={customEmotion}
              onChange={(e) => {
                setCustomEmotion(e.target.value)
                setSelectedEmotion(null)
              }}
              placeholder="输入你的情绪..."
              maxLength={20}
              className="
                w-full max-w-xs px-4 py-2.5 rounded-2xl
                bg-neutral-light border border-neutral-dark/50
                text-text-primary text-sm
                placeholder:text-text-muted
                focus:outline-none focus:ring-2 focus:ring-secondary/50
                transition-all duration-200
              "
            />
          </div>
        )}

        {/* 情绪描述 */}
        <div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="想说些什么吗？（可选）"
            rows={3}
            maxLength={500}
            className="
              w-full px-4 py-3 rounded-2xl
              bg-neutral-light border border-neutral-dark/30
              text-text-primary text-sm
              placeholder:text-text-muted
              focus:outline-none focus:ring-2 focus:ring-secondary/50
              resize-none transition-all duration-200
            "
          />
        </div>

        {/* 提交按钮 + 成功提示 */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={submitting || (!selectedEmotion && !customEmotion.trim())}
            className="
              px-6 py-2.5 rounded-2xl text-sm font-medium
              bg-secondary text-white
              hover:bg-secondary-dark
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-200
              shadow-sm hover:shadow-md
              cursor-pointer
            "
          >
            {submitting ? '提交中...' : '记录此刻'}
          </button>

          {successMsg && (
            <span className="text-sm text-accent-dark flex items-center gap-1 animate-in fade-in duration-200">
              {successMsg.includes('失败') ? (
                <X size={14} />
              ) : (
                <Check size={14} />
              )}
              {successMsg}
            </span>
          )}
        </div>
      </section>

      {/* ===== 情绪趋势图表 ===== */}
      <section className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 lg:p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-secondary-dark" />
          <h3 className="text-lg font-medium text-text-primary">最近 7 天情绪趋势</h3>
        </div>

        {trendsLoading ? (
          <div className="text-center py-8 text-text-muted text-sm">加载中...</div>
        ) : trends.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-sm">
            暂无趋势数据，开始记录你的情绪吧
          </div>
        ) : (
          <div className="space-y-4">
            {/* 柱状图区域 */}
            <div className="overflow-x-auto">
              <div className="flex items-end gap-2 min-w-[400px] h-48 px-2">
                {trends.map((day) => {
                  const total = Object.values(day.emotions).reduce((a, b) => a + b, 0)
                  const barHeight = total > 0 ? (total / maxTrendCount) * 100 : 0
                  const dateLabel = day.date.slice(5) // MM-DD
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                      {/* 堆叠柱 */}
                      <div className="w-full flex flex-col-reverse rounded-xl overflow-hidden" style={{ height: '160px' }}>
                        {allTrendEmotions.map((em) => {
                          const count = day.emotions[em] || 0
                          if (count === 0) return null
                          const pct = total > 0 ? (count / total) * 100 : 0
                          return (
                            <div
                              key={em}
                              className="w-full transition-all duration-500"
                              style={{
                                height: `${pct}%`,
                                backgroundColor: TREND_COLORS[em] || '#C8B6E2',
                                minHeight: count > 0 ? '4px' : '0',
                              }}
                              title={`${em}: ${count}`}
                            />
                          )
                        })}
                        {total === 0 && (
                          <div className="w-full h-full bg-neutral/50 rounded-xl" />
                        )}
                      </div>
                      {/* 日期标签 */}
                      <span className="text-xs text-text-muted">{dateLabel}</span>
                      {/* 总数 */}
                      <span className="text-xs text-text-secondary font-medium">{total}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 图例 */}
            {allTrendEmotions.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-2 border-t border-neutral-dark/20">
                {allTrendEmotions.map((em) => (
                  <div key={em} className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: TREND_COLORS[em] || '#C8B6E2' }}
                    />
                    <span className="text-xs text-text-secondary">{em}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ===== 情绪历史列表 ===== */}
      <section className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 lg:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Clock size={20} className="text-secondary-dark" />
          <h3 className="text-lg font-medium text-text-primary">情绪历史</h3>
        </div>

        {historyLoading && history.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-sm">加载中...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-sm">
            还没有记录，写下你的第一条情绪吧
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((record) => {
              const style = getEmotionStyle(record.emotion_type)
              return (
                <div
                  key={record.id}
                  className="
                    p-4 rounded-2xl bg-neutral-light/80
                    hover:bg-neutral-light transition-colors duration-200
                  "
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* 情绪标签 */}
                      <span
                        className={`
                          inline-block px-3 py-1 rounded-2xl text-xs font-medium
                          ${style.bg} ${style.color}
                        `}
                      >
                        {record.emotion_type}
                      </span>
                      {/* 描述 */}
                      {record.description && (
                        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                          {record.description}
                        </p>
                      )}
                    </div>
                    {/* 时间 */}
                    <span className="text-xs text-text-muted whitespace-nowrap shrink-0">
                      {formatTime(record.created_at)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 加载更多 */}
        {hasMore && history.length > 0 && (
          <div className="text-center pt-2">
            <button
              onClick={handleLoadMore}
              disabled={historyLoading}
              className="
                inline-flex items-center gap-1 px-5 py-2 rounded-2xl
                text-sm text-text-secondary
                bg-neutral hover:bg-neutral-dark/50
                transition-all duration-200 cursor-pointer
                disabled:opacity-50
              "
            >
              {historyLoading ? (
                '加载中...'
              ) : (
                <>
                  加载更多
                  <ChevronDown size={14} />
                </>
              )}
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
