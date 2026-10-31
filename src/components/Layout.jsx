import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Mic2, Library, Layers, SlidersHorizontal, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../context/hooks'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/generate', label: 'Voice Generator', icon: Mic2 },
  { to: '/library', label: 'Audio Library', icon: Library },
  { to: '/bulk', label: 'Bulk Generation', icon: Layers },
  { to: '/voices', label: 'Voices & Approval', icon: SlidersHorizontal },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">ॐ</div>
          <div>
            <div className="brand-name">Swarakosh</div>
            <div className="brand-sub">Voice Studio</div>
          </div>
        </div>
        <nav className="nav">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="who">{user?.email}</div>
          <button className="btn sm block" onClick={logout}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>
      <div className="main">
        <div className="topbar-mobile">
          <button className="btn icon" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
          <strong style={{ fontFamily: 'var(--font-head)', fontSize: 18 }}>Swarakosh Voice Studio</strong>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
