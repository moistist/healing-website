import { useState, useEffect, useCallback } from 'react'
import {
  BookOpen, Plus, ChevronDown, Trash2, ArrowLeft,
  Calendar, Smile, Loader2, CheckCircle,
} from 'lucide-react'

// ===== 类型定义 =====
interface JournalEntry {
  id: number
  title: string
  content: string
  mood?: string
  created_at: string
  updated_at: string
}

// 预设心情标签
const MOOD_OPTIONS = [
  { label: '开心', emoji: '😊' },
  { label: '平静', emoji: '😌' },
  { label: '焦虑', emoji: '😰' },
  { label: '悲伤', emoji: '😢' },
  { label: '兴奋', emoji: '🤩' },
  { label: '疲惫', emoji: '😮‍💨' },
  { label: '感恩', emoji: '🙏' },
  { label: '愤怒', emoji: '😤' },
]

const API_BASE = 'http://localhost:8000/api/journal'

// ===== 日期分组工具函数 =====
function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return '本周'
  return '更早'
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${month}月${day}日 ${hours}:${minutes}`
}

// ===== 心情标签颜色映射 =====
function getMoodColor(mood: string): string {
  const colors: Record<string, string> = {
    '开心': 'bg-accent/30 text-accent-dark',
    '平静': 'bg-primary/30 text-primary-dark',
    '焦虑': 'bg-secondary/30 text-secondary-dark',
    '悲伤': 'bg-primary/20 text-text-secondary',
    '兴奋': 'bg-accent/40 text-accent-dark',
    '疲惫': 'bg-neutral-dark/50 text-text-secondary',
    '感恩': 'bg-accent/30 text-accent-dark',
    '愤怒': 'bg-secondary/40 text-secondary-dark',
  }
  return colors[mood] || 'bg-neutral text-text-secondary'
}

function getMoodEmoji(mood: string): string {
  const found = MOOD_OPTIONS.find(m => m.label === mood)
  return found ? found.emoji : ''
}

// ===== 主组件 =====
export default function Journal() {
  // 视图状态：list | detail | create
  const [view, setView] = useState<'list' | 'detail' | 'create'>('list')
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalEntries, setTotalEntries] = useState(0)

  // 日期筛选
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilter, setShowFilter] = useState(false)

  // 删除确认
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  // 成功提示
  const [successMsg, setSuccessMsg] = useState('')

  // 加载日记列表
  const fetchEntries = useCallback(async (pageNum: number, append = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        page_size: '10',
      })
      if (startDate) params.set('start_date', startDate)
      if (endDate) params.set('end_date', endDate)

      const res = await fetch(`${API_BASE}?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()

      const items: JournalEntry[] = data.items || data.entries || data || []
      const total = data.total || items.length

      if (append) {
        setEntries(prev => [...prev, ...items])
      } else {
        setEntries(items)
      }
      setTotalEntries(total)
      setHasMore(entries.length + items.length < total || items.length >= 10)
    } catch {
      // 静默处理
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate]) // eslint-disable-line react-hooks/exhaustive-deps

  // 初始加载和筛选变化时重新加载
  useEffect(() => {
    setPage(1)
    fetchEntries(1, false)
  }, [fetchEntries])

  // 加载更多
  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchEntries(nextPage, true)
  }

  // 创建日记
  const handleCreate = async (data: { title: string; content: string; mood?: string }) => {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create')
      setSuccessMsg('日记保存成功 ✨')
      setTimeout(() => setSuccessMsg(''), 3000)
      setView('list')
      setPage(1)
      fetchEntries(1, false)
    } catch {
      alert('保存失败，请稍后重试')
    }
  }

  // 删除日记
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setDeleteConfirmId(null)
      setSuccessMsg('日记已删除')
      setTimeout(() => setSuccessMsg(''), 3000)
      if (view === 'detail') {
        setView('list')
        setSelectedEntry(null)
      }
      setPage(1)
      fetchEntries(1, false)
    } catch {
      alert('删除失败，请稍后重试')
    }
  }

  // 查看日记详情
  const viewDetail = async (entry: JournalEntry) => {
    try {
      const res = await fetch(`${API_BASE}/${entry.id}`)
      if (res.ok) {
        const detail = await res.json()
        setSelectedEntry(detail)
      } else {
        setSelectedEntry(entry)
      }
    } catch {
      setSelectedEntry(entry)
    }
    setView('detail')
  }

  // 按日期分组
  const groupedEntries = entries.reduce<Record<string, JournalEntry[]>>((acc, entry) => {
    const group = getDateGroup(entry.created_at)
    if (!acc[group]) acc[group] = []
    acc[group].push(entry)
    return acc
  }, {})

  const groupOrder = ['今天', '昨天', '本周', '更早']

  // ===== 成功提示 =====
  const SuccessToast = () => (
    <div className="fixed top-6 right-6 z-50 animate-[fadeIn_0.3s_ease]">
      <div className="bg-accent/90 backdrop-blur-sm text-accent-dark px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2">
        <CheckCircle size={18} />
        <span className="font-medium">{successMsg}</span>
      </div>
    </div>
  )

  // ===== 渲染 =====
  return (
    <div className="space-y-6">
      {successMsg && <SuccessToast />}

      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {view !== 'list' && (
            <button
              onClick={() => { setView('list'); setSelectedEntry(null) }}
              className="p-2 rounded-xl hover:bg-white/60 transition-colors"
            >
              <ArrowLeft size={20} className="text-text-secondary" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">心情日记</h1>
            <p className="text-text-secondary text-sm mt-0.5">
              {view === 'list'
                ? `共 ${totalEntries} 篇日记`
                : view === 'create' ? '记录此刻的心情' : '日记详情'}
            </p>
          </div>
        </div>
        {view === 'list' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`p-2.5 rounded-xl transition-colors ${showFilter ? 'bg-primary/30 text-primary-dark' : 'bg-white/60 hover:bg-white/80 text-text-secondary'}`}
              title="日期筛选"
            >
              <Calendar size={18} />
            </button>
            <button
              onClick={() => setView('create')}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-primary/30 hover:bg-primary/40 text-primary-dark rounded-xl transition-colors font-medium text-sm"
            >
              <Plus size={16} />
              写日记
            </button>
          </div>
        )}
      </div>

      {/* 日期筛选面板 */}
      {view === 'list' && showFilter && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm animate-[fadeIn_0.2s_ease]">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs text-text-secondary mb-1.5">开始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-white/80 border border-neutral-dark rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs text-text-secondary mb-1.5">结束日期</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-white/80 border border-neutral-dark rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <button
              onClick={() => { setStartDate(''); setEndDate('') }}
              className="px-4 py-2 bg-neutral hover:bg-neutral-dark rounded-xl text-sm text-text-secondary transition-colors"
            >
              清除筛选
            </button>
          </div>
        </div>
      )}

      {/* 创建日记视图 */}
      {view === 'create' && (
        <JournalForm onSave={handleCreate} onCancel={() => setView('list')} />
      )}

      {/* 日记详情视图 */}
      {view === 'detail' && selectedEntry && (
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-sm animate-[fadeIn_0.3s_ease]">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-text-primary mb-2">{selectedEntry.title}</h2>
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <span>{formatTime(selectedEntry.created_at)}</span>
                {selectedEntry.mood && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getMoodColor(selectedEntry.mood)}`}>
                    {getMoodEmoji(selectedEntry.mood)} {selectedEntry.mood}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setDeleteConfirmId(selectedEntry.id)}
              className="p-2 rounded-xl hover:bg-red-50 text-text-muted hover:text-red-400 transition-colors"
              title="删除日记"
            >
              <Trash2 size={18} />
            </button>
          </div>
          <div className="text-text-primary leading-relaxed whitespace-pre-wrap text-[15px]">
            {selectedEntry.content}
          </div>

          {/* 删除确认弹窗 */}
          {deleteConfirmId === selectedEntry.id && (
            <DeleteConfirmDialog
              onConfirm={() => handleDelete(selectedEntry.id)}
              onCancel={() => setDeleteConfirmId(null)}
            />
          )}
        </div>
      )}

      {/* 日记列表视图 */}
      {view === 'list' && (
        <>
          {entries.length === 0 && !loading && (
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-12 shadow-sm flex flex-col items-center justify-center min-h-[40vh]">
              <BookOpen className="text-primary-dark mb-4" size={48} />
              <h3 className="text-xl font-medium text-text-primary mb-2">还没有日记</h3>
              <p className="text-text-secondary text-center max-w-sm mb-6">
                用文字记录生活的点滴，留下属于自己的温柔印记。
              </p>
              <button
                onClick={() => setView('create')}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-primary/30 hover:bg-primary/40 text-primary-dark rounded-xl transition-colors font-medium text-sm"
              >
                <Plus size={16} />
                写下第一篇日记
              </button>
            </div>
          )}

          {/* 按日期分组展示 */}
          {groupOrder.map(group => {
            const items = groupedEntries[group]
            if (!items || items.length === 0) return null
            return (
              <div key={group}>
                <h3 className="text-sm font-medium text-text-secondary mb-3 px-1">{group}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map(entry => (
                    <JournalCard
                      key={entry.id}
                      entry={entry}
                      onClick={() => viewDetail(entry)}
                      onDelete={(e) => { e.stopPropagation(); setDeleteConfirmId(entry.id) }}
                    />
                  ))}
                </div>
              </div>
            )
          })}

          {/* 加载更多 */}
          {hasMore && entries.length > 0 && (
            <div className="flex justify-center pt-2">
              <button
                onClick={loadMore}
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-white/60 hover:bg-white/80 text-text-secondary rounded-xl transition-colors text-sm disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
                加载更多
              </button>
            </div>
          )}

          {/* 列表中的删除确认弹窗 */}
          {deleteConfirmId !== null && view === 'list' && (
            <DeleteConfirmDialog
              onConfirm={() => handleDelete(deleteConfirmId)}
              onCancel={() => setDeleteConfirmId(null)}
            />
          )}
        </>
      )}

      {/* 淡入动画样式 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ===== 日记卡片组件 =====
function JournalCard({ entry, onClick, onDelete }: {
  entry: JournalEntry
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  // 内容预览：截取前 80 字
  const preview = entry.content.length > 80
    ? entry.content.slice(0, 80) + '...'
    : entry.content

  return (
    <div
      onClick={onClick}
      className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-sm hover:shadow-md hover:bg-white/80 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-medium text-text-primary line-clamp-1 flex-1 mr-2">
          {entry.title}
        </h3>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-text-muted hover:text-red-400 transition-all"
          title="删除"
        >
          <Trash2 size={14} />
        </button>
      </div>
      {entry.mood && (
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-2 ${getMoodColor(entry.mood)}`}>
          {getMoodEmoji(entry.mood)} {entry.mood}
        </span>
      )}
      <p className="text-text-secondary text-sm leading-relaxed line-clamp-2 mb-3">
        {preview}
      </p>
      <p className="text-text-muted text-xs">{formatTime(entry.created_at)}</p>
    </div>
  )
}

// ===== 日记编辑表单组件 =====
function JournalForm({ onSave, onCancel }: {
  onSave: (data: { title: string; content: string; mood?: string }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    await onSave({
      title: title.trim(),
      content: content.trim(),
      mood: mood || undefined,
    })
    setSaving(false)
  }

  const canSave = title.trim() && content.trim() && !saving

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-sm animate-[fadeIn_0.3s_ease]">
      {/* 标题输入 */}
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="给今天取个标题..."
        className="w-full text-2xl font-semibold text-text-primary placeholder:text-text-muted bg-transparent border-none outline-none mb-4"
        maxLength={100}
      />

      {/* 心情选择 */}
      <div className="mb-5">
        <label className="block text-sm text-text-secondary mb-2">今天的心情</label>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map(option => (
            <button
              key={option.label}
              onClick={() => setMood(mood === option.label ? '' : option.label)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all ${
                mood === option.label
                  ? 'bg-primary/40 text-primary-dark ring-2 ring-primary/30'
                  : 'bg-neutral hover:bg-neutral-dark text-text-secondary'
              }`}
            >
              <span>{option.emoji}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 内容编辑区 */}
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="写下今天的故事..."
        rows={10}
        className="w-full text-text-primary placeholder:text-text-muted bg-white/50 rounded-2xl p-4 border border-neutral-dark outline-none focus:ring-2 focus:ring-primary/30 resize-none leading-relaxed text-[15px] mb-6"
      />

      {/* 操作按钮 */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 text-text-secondary hover:bg-neutral rounded-xl transition-colors text-sm"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSave}
          className="flex items-center gap-1.5 px-6 py-2.5 bg-primary/40 hover:bg-primary/50 text-primary-dark rounded-xl transition-colors font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Smile size={16} />}
          保存日记
        </button>
      </div>
    </div>
  )
}

// ===== 删除确认对话框组件 =====
function DeleteConfirmDialog({ onConfirm, onCancel }: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
      <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm mx-4">
        <h3 className="text-lg font-medium text-text-primary mb-2">确认删除</h3>
        <p className="text-text-secondary text-sm mb-6">
          删除后将无法恢复这篇日记，确定要删除吗？
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-text-secondary hover:bg-neutral rounded-xl transition-colors text-sm"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors text-sm font-medium"
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  )
}
