import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  MdDashboard, MdPointOfSale, MdInventory, MdPeople,
  MdBarChart, MdSettings, MdLogout, MdReceipt
} from 'react-icons/md'

const navItems = [
  { section: 'Main' },
  { to: '/', icon: MdDashboard, label: 'Dashboard' },
  { to: '/pos', icon: MdPointOfSale, label: 'POS Billing' },
  { section: 'Management' },
  { to: '/inventory', icon: MdInventory, label: 'Inventory' },
  { to: '/customers', icon: MdPeople, label: 'Customers' },
  { to: '/invoices', icon: MdReceipt, label: 'Invoices' },
  { section: 'Analytics' },
  { to: '/reports', icon: MdBarChart, label: 'Reports' },
  { section: 'System' },
  { to: '/settings', icon: MdSettings, label: 'Settings' },
]

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {open && <div className="modal-backdrop" style={{ zIndex: 99 }} onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>Smart<span>Bill</span> Pro</h1>
          <p>Billing & Inventory System</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, i) =>
            item.section ? (
              <div key={i} className="nav-section">{item.section}</div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <item.icon />
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
            <div style={{ flex: 1 }}>
              <div className="user-name">{user?.name || user?.username}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <button
              className="btn btn-ghost btn-icon"
              onClick={handleLogout}
              title="Logout"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              <MdLogout />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
