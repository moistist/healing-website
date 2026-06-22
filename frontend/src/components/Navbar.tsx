import { NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { navItems } from './navItems'

interface NavbarProps {
  isOpen: boolean
  onToggle: () => void
}

export default function Navbar({ isOpen, onToggle }: NavbarProps) {
  return (
    <nav className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-semibold text-text-primary">心灵疗愈</h1>
        <button
          onClick={onToggle}
          className="p-2 rounded-xl hover:bg-neutral transition-colors"
          aria-label="切换菜单"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 移动端下拉菜单 */}
      {isOpen && (
        <div className="bg-white/95 backdrop-blur-md border-t border-neutral-dark">
          <ul className="flex flex-col py-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onToggle}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-xl transition-all ${
                      isActive
                        ? 'bg-primary/20 text-primary-dark font-medium'
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
        </div>
      )}
    </nav>
  )
}
