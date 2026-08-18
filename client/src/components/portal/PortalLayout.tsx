import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { usePortal } from '../../contexts/PortalContext'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import Header from './Header'

export default function PortalLayout() {
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const { roleAtivo } = usePortal()

  return (
    <div className="flex h-screen bg-[#0B0F17] text-white">
      <Sidebar aberta={sidebarAberta} onFechar={() => setSidebarAberta(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarAberta(true)} />

        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6"
          key={roleAtivo}
        >
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
