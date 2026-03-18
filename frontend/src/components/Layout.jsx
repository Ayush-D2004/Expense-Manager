import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toggleTheme } from '../store/slices/themeSlice'
import { logout } from '../store/slices/authSlice'
import { useGetBalanceQuery } from '../store/slices/apiSlice'
import {
  LayoutDashboard, Users, BarChart3, List, PlusCircle,
  History, Sun, Moon, LogOut, Wallet, ChevronRight
} from 'lucide-react'
import { motion } from 'framer-motion'

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
          isActive
            ? 'bg-brand-600 text-white shadow-sm'
            : 'text-[var(--text-secondary)] hover:bg-[var(--border)] hover:text-[var(--text-primary)]'
        }`
      }
    >
      <Icon size={17} />
      <span>{label}</span>
    </NavLink>
  )
}

export default function Layout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((s) => s.auth)
  const { isDark } = useSelector((s) => s.theme)
  const isAdmin = user?.role === 'ADMIN'

  const { data: wallet } = useGetBalanceQuery(undefined, { skip: isAdmin })

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 h-full flex flex-col bg-[var(--bg-card)] border-r border-[var(--border)]">
        <div className="p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Wallet size={16} className="text-white" />
            </div>
            <span className="font-bold text-[var(--text-primary)] text-base">ExpenseManager</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase text-[var(--text-muted)] tracking-widest">
            Overview
          </p>
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/history" icon={History} label="History" />

          {!isAdmin && (
            <>
              <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase text-[var(--text-muted)] tracking-widest">
                Expenses
              </p>
              <NavItem to="/spend/new" icon={PlusCircle} label="New Spend" />
            </>
          )}

          {isAdmin && (
            <>
              <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase text-[var(--text-muted)] tracking-widest">
                Admin
              </p>
              <NavItem to="/admin/employees" icon={Users} label="Employees" />
              <NavItem to="/admin/txns" icon={List} label="Transactions" />
              <NavItem to="/admin/reports" icon={BarChart3} label="Reports" />
            </>
          )}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-[var(--border)]">
          <div className="p-3 rounded-lg bg-[var(--bg-secondary)]">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{user?.name}</p>
            <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
            <span className={`mt-1.5 badge ${user?.role === 'ADMIN' ? 'badge-approved' : 'badge-paid'}`}>
              {user?.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--border)] hover:text-coral-500 transition-all"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-6 bg-[var(--bg-card)] border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
            <span>Good day,</span>
            <span className="font-semibold text-[var(--text-primary)]">{user?.name?.split(' ')[0]}</span>
          </div>

          <div className="flex items-center gap-3">
            {!isAdmin && wallet && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                <Wallet size={14} className="text-brand-500" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  ₹{(wallet.limit - wallet.spent_amount).toFixed(2)}
                </span>
                <span className="text-xs text-[var(--text-muted)]">available</span>
              </div>
            )}

            <button
              id="theme-toggle"
              onClick={() => dispatch(toggleTheme())}
              className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="p-6 max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
