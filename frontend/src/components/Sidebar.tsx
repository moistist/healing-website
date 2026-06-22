import { NavLink } from 'react-router-dom'
import { navItems } from './navItems'

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white/60 backdrop-blur-md border-r border-neutral-dark/50 shadow-sm">
      {/* Logo 区域 */}
      <div className="px-6 py-8 border-b border-neutral-dark/30">
        <h1 className="text-2xl font-semibold text-text-primary">心灵疗愈</h1>
        <p className="text-sm text-text-muted mt-1">温柔的陪伴，静待花开</p>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                    isActive
                      ? 'bg-primary/20 text-primary-dark font-medium shadow-sm'
                      : 'text-text-secondary hover:bg-neutral hover:text-text-primary'
                  }`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* 底部信息 */}
      <div className="px-6 py-4 border-t border-neutral-dark/30 text-xs text-text-muted">
        <p>© 2026 心灵疗愈</p>
      </div>
    </aside>
  )
}
