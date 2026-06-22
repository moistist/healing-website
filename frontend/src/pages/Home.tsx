import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Sparkles, MessageCircle, Flower2, BookOpen, Zap } from 'lucide-react'

// 预设疗愈语（20 句）
const HEALING_QUOTES = [
  '你今天也辛苦了，记得给自己一个温柔的拥抱。',
  '慢慢来，一切都会好起来的，你已经在努力了。',
  '你值得被温柔以待，也值得拥有内心的平静。',
  '不必急着赶路，花开有时，你也有你的节奏。',
  '允许自己偶尔脆弱，那是内心在轻声呼唤你。',
  '每一个深呼吸，都是你对自己的一次温柔拥抱。',
  '你不需要完美，只需要真实地做自己就好。',
  '此刻的你，已经足够好了，不必再苛责自己。',
  '把心放轻一点，让阳光照进每一个缝隙。',
  '你的感受很重要，你的存在让世界更温暖。',
  '无论今天发生了什么，你都值得一个安稳的夜晚。',
  '温柔地对待自己，就像对待最好的朋友那样。',
  '放下一些重担，你会发现脚步可以很轻盈。',
  '你的每一次微笑，都是对自己最好的奖赏。',
  '不必和别人比较，你有属于自己的光芒。',
  '今天也请记得，你比自己想象中更坚强。',
  '让心静下来，听听内在的声音，它在指引你。',
  '每一个当下，都是重新开始的最好时机。',
  '你不需要独自承担所有，允许自己被帮助。',
  '愿今天的你，被世界温柔相待。',
]

// 根据日期生成稳定的每日索引（同一天内不变）
function getDailyQuoteIndex(): number {
  const today = new Date()
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  )
  // 加入年份因子，跨年也会变化
  const seed = dayOfYear + today.getFullYear() * 365
  return seed % HEALING_QUOTES.length
}

export default function Home() {
  const navigate = useNavigate()
  const [quoteIndex, setQuoteIndex] = useState(getDailyQuoteIndex)
  const [quoteVisible, setQuoteVisible] = useState(false)

  // 页面加载时淡入疗愈语
  useEffect(() => {
    const timer = setTimeout(() => setQuoteVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // 点击 sparkle 图标随机换一句
  const refreshQuote = () => {
    let next = quoteIndex
    while (next === quoteIndex) {
      next = Math.floor(Math.random() * HEALING_QUOTES.length)
    }
    setQuoteVisible(false)
    setTimeout(() => {
      setQuoteIndex(next)
      setQuoteVisible(true)
    }, 300)
  }

  return (
    <div className="space-y-8">
      {/* 欢迎区域 */}
      <section className="relative overflow-hidden bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-sm">
        {/* 装饰渐变 */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <h2 className="text-3xl font-semibold text-text-primary mb-2">
            你好，今天过得怎么样？
          </h2>
          <p className="text-text-secondary text-lg">
            在这里，你可以安静地与自己对话，记录情绪，练习冥想。
          </p>
        </div>
      </section>

      {/* 每日一句疗愈语 */}
      <section className="relative bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/15 rounded-3xl p-8 shadow-sm overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute top-4 right-4 opacity-10 pointer-events-none">
          <Sparkles size={80} className="text-primary-dark" />
        </div>

        <div className="relative flex items-start gap-4">
          <button
            onClick={refreshQuote}
            className="shrink-0 mt-1 p-2 rounded-xl bg-white/60 hover:bg-white/90 transition-all hover:scale-110 active:scale-95 cursor-pointer group"
            title="换一句"
          >
            <Sparkles
              size={20}
              className="text-primary-dark group-hover:rotate-12 transition-transform"
            />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-muted mb-2 tracking-wide">每日一句</p>
            <p
              className={`text-xl md:text-2xl font-light text-text-primary leading-relaxed transition-all duration-300 ${
                quoteVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
              style={{ fontFamily: '"Noto Serif SC", "LXGW WenKai", serif' }}
            >
              「{HEALING_QUOTES[quoteIndex]}」
            </p>
          </div>
        </div>
      </section>

      {/* 快速操作区域 */}
      <section>
        <h3 className="text-lg font-medium text-text-primary mb-4 flex items-center gap-2">
          <Zap size={18} className="text-accent-dark" />
          快速开始
        </h3>
        <div className="flex flex-wrap gap-3">
          <QuickAction
            label="开始对话"
            onClick={() => navigate('/chat')}
            gradient="from-primary-light/40 to-primary/40"
          />
          <QuickAction
            label="记录情绪"
            onClick={() => navigate('/emotions')}
            gradient="from-secondary-light/40 to-secondary/40"
          />
          <QuickAction
            label="开始冥想"
            onClick={() => navigate('/meditation')}
            gradient="from-accent-light/40 to-accent/40"
          />
          <QuickAction
            label="写心情日记"
            onClick={() => navigate('/journal')}
            gradient="from-primary/30 to-secondary/30"
          />
        </div>
      </section>

      {/* 功能卡片 */}
      <section>
        <h3 className="text-lg font-medium text-text-primary mb-4">探索功能</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<MessageCircle className="text-primary-dark" size={32} />}
            title="AI 对话"
            description="与温柔的 AI 伙伴聊聊心事"
            bgColor="bg-primary/20"
            hoverBg="hover:bg-primary/30"
            onClick={() => navigate('/chat')}
          />
          <FeatureCard
            icon={<Heart className="text-secondary-dark" size={32} />}
            title="情绪记录"
            description="记录此刻的心情，看见自己"
            bgColor="bg-secondary/20"
            hoverBg="hover:bg-secondary/30"
            onClick={() => navigate('/emotions')}
          />
          <FeatureCard
            icon={<Flower2 className="text-accent-dark" size={32} />}
            title="冥想练习"
            description="静下心来，感受当下的呼吸"
            bgColor="bg-accent/20"
            hoverBg="hover:bg-accent/30"
            onClick={() => navigate('/meditation')}
          />
          <FeatureCard
            icon={<BookOpen className="text-primary-dark" size={32} />}
            title="心情日记"
            description="用文字记录生活的点滴感悟"
            bgColor="bg-neutral"
            hoverBg="hover:bg-neutral-dark/40"
            onClick={() => navigate('/journal')}
          />
        </div>
      </section>
    </div>
  )
}

// 快速操作按钮
function QuickAction({
  label,
  onClick,
  gradient,
}: {
  label: string
  onClick: () => void
  gradient: string
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-full bg-gradient-to-r ${gradient} text-text-primary text-sm font-medium shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer backdrop-blur-sm`}
    >
      {label}
    </button>
  )
}

// 功能卡片
function FeatureCard({
  icon,
  title,
  description,
  bgColor,
  hoverBg,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  bgColor: string
  hoverBg: string
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`${bgColor} ${hoverBg} rounded-2xl p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group`}
    >
      <div className="mb-4 group-hover:scale-110 transition-transform duration-200">{icon}</div>
      <h3 className="text-xl font-medium text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary">{description}</p>
    </div>
  )
}
