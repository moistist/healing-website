import { useState, useEffect, useCallback, useRef } from 'react'
import { Flower2, Play, Pause, RotateCcw, ChevronDown, ChevronUp, Clock } from 'lucide-react'

// API 返回的数据类型
interface BreathingExercise {
  inhale_seconds: number
  hold_seconds: number
  exhale_seconds: number
}

interface MeditationGuide {
  title: string
  content: string
  duration_minutes: number
}

interface MeditationConfig {
  breathing_exercise: BreathingExercise
  meditation_guides: MeditationGuide[]
  available_durations: number[]
}

// 呼吸阶段类型
type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'idle'

const PHASE_LABELS: Record<BreathPhase, string> = {
  inhale: '吸气',
  hold: '屏气',
  exhale: '呼气',
  idle: '准备开始',
}

export default function Meditation() {
  const [config, setConfig] = useState<MeditationConfig | null>(null)
  const [loading, setLoading] = useState(true)

  // 呼吸练习状态
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('idle')
  const [breathRunning, setBreathRunning] = useState(false)
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(0)
  const [breathDuration, setBreathDuration] = useState(5) // 分钟
  const [breathTimeLeft, setBreathTimeLeft] = useState(0) // 秒
  const [breathCompleted, setBreathCompleted] = useState(false)
  const breathTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 冥想引导状态
  const [expandedGuide, setExpandedGuide] = useState<number | null>(null)
  const [meditationRunning, setMeditationRunning] = useState(false)
  const [meditationTimeLeft, setMeditationTimeLeft] = useState(0) // 秒
  const [meditationCompleted, setMeditationCompleted] = useState(false)
  const [activeGuideIndex, setActiveGuideIndex] = useState<number | null>(null)
  const meditationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 获取配置
  useEffect(() => {
    fetch('http://localhost:8000/api/meditation')
      .then((res) => res.json())
      .then((data) => {
        setConfig(data)
        setBreathTimeLeft(data.available_durations[0] * 60)
        setBreathDuration(data.available_durations[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // 呼吸练习逻辑
  useEffect(() => {
    if (!breathRunning || !config) return

    const exercise = config.breathing_exercise
    let phase: BreathPhase = 'inhale'
    let timeLeft = exercise.inhale_seconds
    setBreathPhase('inhale')
    setPhaseTimeLeft(timeLeft)

    breathTimerRef.current = setInterval(() => {
      timeLeft -= 1
      if (timeLeft <= 0) {
        // 切换到下一阶段
        if (phase === 'inhale') {
          phase = 'hold'
          timeLeft = exercise.hold_seconds
        } else if (phase === 'hold') {
          phase = 'exhale'
          timeLeft = exercise.exhale_seconds
        } else {
          phase = 'inhale'
          timeLeft = exercise.inhale_seconds
        }
        setBreathPhase(phase)
      }
      setPhaseTimeLeft(timeLeft)

      // 更新总计时
      setBreathTimeLeft((prev) => {
        if (prev <= 1) {
          // 练习结束
          setBreathRunning(false)
          setBreathPhase('idle')
          setBreathCompleted(true)
          if (breathTimerRef.current) clearInterval(breathTimerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (breathTimerRef.current) clearInterval(breathTimerRef.current)
    }
  }, [breathRunning, config])

  // 冥想计时逻辑
  useEffect(() => {
    if (!meditationRunning) return

    meditationTimerRef.current = setInterval(() => {
      setMeditationTimeLeft((prev) => {
        if (prev <= 1) {
          setMeditationRunning(false)
          setMeditationCompleted(true)
          if (meditationTimerRef.current) clearInterval(meditationTimerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (meditationTimerRef.current) clearInterval(meditationTimerRef.current)
    }
  }, [meditationRunning])

  // 格式化时间为 mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // 呼吸练习控制
  const startBreathing = useCallback(() => {
    if (!config) return
    setBreathCompleted(false)
    setBreathRunning(true)
  }, [config])

  const pauseBreathing = useCallback(() => {
    setBreathRunning(false)
    if (breathTimerRef.current) clearInterval(breathTimerRef.current)
    setBreathPhase('idle')
  }, [])

  const resetBreathing = useCallback(() => {
    setBreathRunning(false)
    if (breathTimerRef.current) clearInterval(breathTimerRef.current)
    setBreathPhase('idle')
    setPhaseTimeLeft(0)
    setBreathTimeLeft(breathDuration * 60)
    setBreathCompleted(false)
  }, [breathDuration])

  const changeBreathDuration = useCallback(
    (mins: number) => {
      if (breathRunning) return
      setBreathDuration(mins)
      setBreathTimeLeft(mins * 60)
      setBreathCompleted(false)
    },
    [breathRunning]
  )

  // 冥想引导控制
  const startMeditation = useCallback(
    (guideIndex: number) => {
      if (!config) return
      const guide = config.meditation_guides[guideIndex]
      setActiveGuideIndex(guideIndex)
      setMeditationTimeLeft(guide.duration_minutes * 60)
      setMeditationRunning(true)
      setMeditationCompleted(false)
    },
    [config]
  )

  const pauseMeditation = useCallback(() => {
    setMeditationRunning(false)
    if (meditationTimerRef.current) clearInterval(meditationTimerRef.current)
  }, [])

  const resumeMeditation = useCallback(() => {
    setMeditationRunning(true)
  }, [])

  const resetMeditation = useCallback(() => {
    setMeditationRunning(false)
    if (meditationTimerRef.current) clearInterval(meditationTimerRef.current)
    setMeditationTimeLeft(0)
    setMeditationCompleted(false)
    setActiveGuideIndex(null)
  }, [])

  // 计算呼吸圆圈动画的缩放比例
  const getBreathScale = () => {
    if (breathPhase === 'inhale') return 'scale-100'
    if (breathPhase === 'hold') return 'scale-100'
    if (breathPhase === 'exhale') return 'scale-50'
    return 'scale-75'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-text-secondary text-lg">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <section className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-sm text-center">
        <Flower2 className="text-accent-dark mx-auto mb-4" size={48} />
        <h2 className="text-3xl font-semibold text-text-primary mb-2">冥想练习</h2>
        <p className="text-text-secondary text-lg max-w-lg mx-auto">
          闭上眼睛，深呼吸，让思绪慢慢沉淀，感受当下的宁静。
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ===== 呼吸练习区域 ===== */}
        <section className="bg-gradient-to-br from-accent/20 via-primary/10 to-secondary/20 rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-semibold text-text-primary mb-6 text-center">呼吸练习</h3>

          {/* 时长选择 */}
          <div className="flex justify-center gap-3 mb-8">
            {config?.available_durations.map((d) => (
              <button
                key={d}
                onClick={() => changeBreathDuration(d)}
                disabled={breathRunning}
                className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
                  breathDuration === d
                    ? 'bg-accent-dark text-white shadow-md'
                    : 'bg-white/60 text-text-secondary hover:bg-white/80'
                } ${breathRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {d} 分钟
              </button>
            ))}
          </div>

          {/* 呼吸动画圆圈 */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="relative w-52 h-52 flex items-center justify-center">
              {/* 外圈光晕 */}
              <div
                className={`absolute inset-0 rounded-full bg-accent/20 transition-transform ${
                  breathPhase === 'inhale'
                    ? 'duration-[4000ms] scale-110'
                    : breathPhase === 'hold'
                      ? 'duration-300 scale-110'
                      : breathPhase === 'exhale'
                        ? 'duration-[6000ms] scale-90'
                        : 'duration-500 scale-100'
                }`}
                style={{
                  boxShadow:
                    breathPhase !== 'idle'
                      ? '0 0 40px rgba(143, 204, 168, 0.4)'
                      : '0 0 20px rgba(143, 204, 168, 0.15)',
                }}
              />
              {/* 主圆圈 */}
              <div
                className={`relative w-40 h-40 rounded-full bg-gradient-to-br from-accent-light to-accent flex items-center justify-center transition-transform ${
                  breathPhase === 'inhale'
                    ? 'duration-[4000ms] scale-100'
                    : breathPhase === 'hold'
                      ? 'duration-300 scale-100'
                      : breathPhase === 'exhale'
                        ? 'duration-[6000ms] scale-50'
                        : 'duration-500 scale-75'
                }`}
                style={{
                  boxShadow: '0 8px 32px rgba(143, 204, 168, 0.3)',
                }}
              >
                <div className="text-center">
                  <div className="text-text-primary text-lg font-medium">
                    {PHASE_LABELS[breathPhase]}
                  </div>
                  {breathRunning && phaseTimeLeft > 0 && (
                    <div className="text-text-secondary text-2xl font-light mt-1">
                      {phaseTimeLeft}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 总计时器 */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 text-text-secondary">
              <Clock size={18} />
              <span className="text-2xl font-light">{formatTime(breathTimeLeft)}</span>
            </div>
          </div>

          {/* 完成提示 */}
          {breathCompleted && (
            <div className="text-center mb-4 animate-fade-in">
              <p className="text-accent-dark font-medium text-lg">练习完成 🌿</p>
              <p className="text-text-secondary text-sm mt-1">做得很好，感受此刻的平静</p>
            </div>
          )}

          {/* 控制按钮 */}
          <div className="flex justify-center gap-4">
            {!breathRunning ? (
              <button
                onClick={startBreathing}
                className="flex items-center gap-2 px-6 py-3 bg-accent-dark text-white rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
              >
                <Play size={20} />
                开始
              </button>
            ) : (
              <button
                onClick={pauseBreathing}
                className="flex items-center gap-2 px-6 py-3 bg-secondary text-white rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
              >
                <Pause size={20} />
                暂停
              </button>
            )}
            <button
              onClick={resetBreathing}
              className="flex items-center gap-2 px-6 py-3 bg-white/70 text-text-secondary rounded-2xl shadow-sm hover:shadow-md transition-all hover:scale-105 cursor-pointer"
            >
              <RotateCcw size={20} />
              重置
            </button>
          </div>
        </section>

        {/* ===== 冥想引导区域 ===== */}
        <section className="bg-gradient-to-br from-secondary/15 via-neutral-light to-primary/15 rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-semibold text-text-primary mb-6 text-center">冥想引导</h3>

          {/* 冥想计时器（当有活跃冥想时显示） */}
          {activeGuideIndex !== null && (
            <div className="bg-white/60 rounded-2xl p-6 mb-6 text-center">
              <p className="text-text-secondary text-sm mb-2">
                {config?.meditation_guides[activeGuideIndex].title}
              </p>
              <div className="text-4xl font-light text-text-primary mb-4">
                {formatTime(meditationTimeLeft)}
              </div>

              {meditationCompleted && (
                <p className="text-accent-dark font-medium mb-3">冥想完成 🌸</p>
              )}

              <div className="flex justify-center gap-3">
                {meditationRunning ? (
                  <button
                    onClick={pauseMeditation}
                    className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-white rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <Pause size={18} />
                    暂停
                  </button>
                ) : meditationTimeLeft > 0 ? (
                  <button
                    onClick={resumeMeditation}
                    className="flex items-center gap-2 px-5 py-2.5 bg-accent-dark text-white rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <Play size={18} />
                    继续
                  </button>
                ) : null}
                <button
                  onClick={resetMeditation}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/70 text-text-secondary rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <RotateCcw size={18} />
                  结束
                </button>
              </div>
            </div>
          )}

          {/* 引导列表 */}
          <div className="space-y-4">
            {config?.meditation_guides.map((guide, index) => (
              <div
                key={index}
                className="bg-white/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                {/* 引导标题行 */}
                <div
                  onClick={() =>
                    setExpandedGuide(expandedGuide === index ? null : index)
                  }
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/40 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="text-text-primary font-medium text-lg">
                      {guide.title}
                    </h4>
                    <p className="text-text-secondary text-sm mt-1">
                      {guide.duration_minutes} 分钟
                    </p>
                  </div>
                  <div className="text-text-muted ml-4">
                    {expandedGuide === index ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </div>
                </div>

                {/* 展开的详情 */}
                {expandedGuide === index && (
                  <div className="px-5 pb-5">
                    <p className="text-text-secondary text-sm leading-relaxed mb-4">
                      {guide.content}
                    </p>
                    <button
                      onClick={() => {
                        startMeditation(index)
                        setExpandedGuide(null)
                      }}
                      disabled={meditationRunning}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white transition-all cursor-pointer ${
                        meditationRunning
                          ? 'bg-text-muted opacity-50 cursor-not-allowed'
                          : 'bg-accent-dark hover:shadow-md hover:scale-105'
                      }`}
                    >
                      <Play size={18} />
                      开始冥想
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
