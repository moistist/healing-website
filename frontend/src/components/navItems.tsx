import { Home, MessageCircle, Smile, Flower2, BookOpen } from 'lucide-react'

export interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
}

export const navItems: NavItem[] = [
  { path: '/', label: '首页', icon: <Home size={20} /> },
  { path: '/chat', label: 'AI 对话', icon: <MessageCircle size={20} /> },
  { path: '/emotions', label: '情绪记录', icon: <Smile size={20} /> },
  { path: '/meditation', label: '冥想练习', icon: <Flower2 size={20} /> },
  { path: '/journal', label: '心情日记', icon: <BookOpen size={20} /> },
]
