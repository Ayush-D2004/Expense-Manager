import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { toggleTheme } from '../store/slices/themeSlice'
import { logout } from '../store/slices/authSlice'
import { useGetBalanceQuery, useGetReportsQuery, useGetHealthQuery } from '../store/slices/apiSlice'
import useRealtimeSync from '../hooks/useRealtimeSync'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Receipt, Users, BarChart3, LogOut,
  Sun, Moon, Wallet, PlusCircle, Lock, List, PlusSquare,
} from 'lucide-react'

function NavItem({ to, icon: Icon, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-brand-600 text-white shadow-sm'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
        }`
      }
    >
      <Icon size={17} />
      {label}
    </NavLink>
  )
}

export default function Layout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((s) => s.auth)
  const { isDark } = useSelector((s) => s.theme)
  const isAdmin = user?.role === 'ADMIN'

  const isCompany = user?.role === 'COMPANY'
  const isManager = isAdmin || isCompany

  // Real-time WebSocket sync
  useRealtimeSync()

  // Grab balance data for navbar display
  const { data: wallet } = useGetBalanceQuery(undefined, { skip: false })
  const { data: reports } = useGetReportsQuery(undefined, { skip: !isManager })

  const balance = isManager
    ? reports?.summary?.wallet_balance ?? 0
    : wallet ? wallet.limit - wallet.spent_amount : 0

  const balanceLabel = isManager ? 'Company Wallet' : 'Available'

  // Server health ping for Render cold starts
  const { isLoading: wakingServer, isSuccess: serverReady, isError: serverError } = useGetHealthQuery(undefined, { pollingInterval: 30000 })

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden">
      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="w-56 flex flex-col border-r border-[var(--border)] bg-[var(--bg-primary)] shrink-0">
        <div className="h-16 flex items-center gap-2.5 px-4 border-b border-[var(--border)]">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Wallet size={16} className="text-white" />
          </div>
          <span className="font-bold text-[var(--text-primary)] text-sm tracking-tight">ExpenseManager</span>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" end />

          {/* Both roles can spend */}
          <NavItem to="/dashboard/spend/new" icon={PlusCircle} label="New Expense" />
          <NavItem to="/dashboard/transactions" icon={Receipt} label="Transactions" />
          <NavItem to="/dashboard/setup-pin" icon={Lock} label="UPI PIN" />

          {/* Admin/Company-only */}
          {isManager && (
            <>
              <div className="pt-3 pb-1 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Management</div>
              <NavItem to="/dashboard/admin/employees" icon={Users} label="Employees" />
              <NavItem to="/dashboard/admin/transactions" icon={List} label="All Transactions" />
              <NavItem to="/dashboard/admin/reports" icon={BarChart3} label="Reports" />
              <NavItem to="/dashboard/admin/topup" icon={PlusSquare} label="Load Wallet" />
            </>
          )}
        </nav>

        <div className="p-3 border-t border-[var(--border)]">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs text-[var(--text-muted)] truncate">{user?.name}</p>
            <p className="text-xs text-[var(--text-muted)] truncate opacity-60">{user?.email}</p>
          </div>
          <button
            onClick={() => { dispatch(logout()); navigate('/login') }}
            className="flex items-center gap-2.5 px-3 py-2 w-full text-sm text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-[var(--border)] flex items-center justify-between px-6 bg-[var(--bg-primary)] shrink-0">
          <div />
          <div className="flex items-center gap-4">
            {/* Connection Status Badge */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              serverReady 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                : serverError
                ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
            }`}>
              {serverReady ? (
                <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_theme(colors.emerald.500)]" /> Backend Connected</>
              ) : serverError ? (
                <><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Backend Disconnected</>
              ) : (
                <><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Waking Server (~1m)</>
              )}
            </div>

            {/* Balance chip */}
            <div className="flex items-center gap-2 text-sm bg-[var(--bg-secondary)] px-3 py-1.5 rounded-lg border border-[var(--border)]">
              <Wallet size={14} className="text-brand-600" />
              <span className="text-[var(--text-muted)] text-xs">{balanceLabel}:</span>
              <span className="font-semibold text-[var(--text-primary)]">₹{balance.toFixed(2)}</span>
            </div>
            {/* Theme toggle */}
            <button
              id="theme-toggle"
              onClick={() => dispatch(toggleTheme())}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-muted)]"
              title="Toggle theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
