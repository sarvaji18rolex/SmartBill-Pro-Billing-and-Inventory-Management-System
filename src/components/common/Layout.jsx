import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { MdMenu, MdNotifications } from 'react-icons/md'
import { useAuth } from '../../hooks/useAuth'

const titles = {
  '/': 'Dashboard',
  '/pos': 'POS Billing',
  '/inventory': 'Inventory',
  '/customers': 'Customers',
  '/invoices': 'Invoices',
  '/reports': 'Reports',
  '/settings': 'Settings',
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const { user } = useAuth()

  return (
    <div className="layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-area">
        <header className="topbar">
          <div className="flex" style={{ gap: 12, alignItems: 'center' }}>
            <button className="btn btn-ghost btn-icon" style={{ display: 'none' }}
              onClick={() => setSidebarOpen(true)}>
              <MdMenu size={20} />
            </button>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>{titles[pathname] || 'SmartBill Pro'}</h3>
            </div>
          </div>
          <div className="flex" style={{ gap: 10, alignItems: 'center' }}>
            <button className="btn btn-ghost btn-icon"><MdNotifications size={20} /></button>
            <div className="user-info" style={{ gap: 8 }}>
              <div className="user-avatar" style={{ background: 'var(--primary-light)', color: '#fff' }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{user?.name}</span>
            </div>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
