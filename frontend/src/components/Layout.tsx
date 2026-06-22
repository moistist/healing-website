import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function Layout() {
  const [isNavbarOpen, setIsNavbarOpen] = useState(false)

  return (
    <div className="min-h-screen">
      {/* 移动端顶部导航 */}
      <Navbar isOpen={isNavbarOpen} onToggle={() => setIsNavbarOpen(!isNavbarOpen)} />

      {/* 桌面端侧边栏 */}
      <Sidebar />

      {/* 主内容区域 */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
