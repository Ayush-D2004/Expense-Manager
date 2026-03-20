import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  useGetBalanceQuery, useGetMyTransactionsQuery,
  useGetAllTransactionsQuery, useGetReportsQuery,
  useListEmployeeWalletsQuery, useAdminApproveMutation, useAdminRejectMutation,
} from '../store/slices/apiSlice'
import StatusBadge from '../components/StatusBadge'
import { Wallet, TrendingUp, Clock, PlusCircle, Users, CheckCheck, X, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

function StatCard({ label, value, icon: Icon, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="stat-card"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={15} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{value}</p>
    </motion.div>
  )
}

function AdminDashboard() {
  const navigate = useNavigate()
  const { data: reportsData, refetch: refetchReports, isError: reportsError } = useGetReportsQuery()
  const { data: allTxns = [], refetch: refetchTxns, isError: txnsError } = useGetAllTransactionsQuery()
  const [adminApprove] = useAdminApproveMutation()
  const [adminReject] = useAdminRejectMutation()

  const handleRefresh = () => {
    refetchReports()
    refetchTxns()
    toast.success('Refreshing dashboard...')
  }

  const summary = reportsData?.summary || {}
  const pending = allTxns.filter((t) => t.status === 'PENDING' || t.status === 'FLAGGED').slice(0, 5)
  const recent = allTxns.filter((t) => t.status === 'PAID').slice(0, 5)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Company expense overview</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} className="btn-secondary p-2.5" title="Refresh Data">
            <RefreshCw size={15} />
          </button>
          <button onClick={() => navigate('admin/topup')} className="btn-primary">
            <PlusCircle size={15} /> Load Wallet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Company Balance" value={`₹${(summary.wallet_balance ?? 0).toFixed(2)}`} icon={Wallet} color="bg-brand-600" delay={0} />
        <StatCard label="Total Paid Out" value={`₹${(summary.total_paid ?? 0).toFixed(2)}`} icon={TrendingUp} color="bg-emerald-500" delay={0.05} />
        <StatCard label="Pending Actions" value={summary.pending_count ?? 0} icon={Clock} color="bg-amber-500" delay={0.1} />
        <StatCard label="Employees" value={summary.employee_count ?? 0} icon={Users} color="bg-indigo-500" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Pending Approvals</h2>
            <button onClick={() => navigate('/admin/transactions')} className="text-xs text-brand-600 hover:underline">View all</button>
          </div>
          {pending.length === 0 ? (
            <div className="p-6 text-center text-sm text-[var(--text-muted)]">All clear — no pending approvals 🎉</div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {pending.map((txn) => (
                <div key={txn.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{txn.description}</p>
                      {txn.is_over_limit_request && (
                        <span className="shrink-0 text-xs bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded font-medium">OVER LIMIT</span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">₹{txn.amount.toFixed(2)} · <StatusBadge status={txn.status} /></p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={async () => { try { await adminApprove(txn.id).unwrap(); toast.success('Approved') } catch { toast.error('Failed') }}}
                      className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors"
                      title="Approve"
                    >
                      <CheckCheck size={14} />
                    </button>
                    <button
                      onClick={async () => { try { await adminReject(txn.id).unwrap(); toast.success('Rejected') } catch { toast.error('Failed') }}}
                      className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 hover:bg-rose-200 dark:hover:bg-rose-800/50 transition-colors"
                      title="Reject"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Paid */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recent Payments</h2>
          </div>
          {recent.length === 0 ? (
            <div className="p-6 text-center text-sm text-[var(--text-muted)]">No paid transactions yet</div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {recent.map((txn) => (
                <div key={txn.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{txn.description}</p>
                    <p className="text-xs text-[var(--text-muted)]">{txn.category || 'Uncategorized'} · {new Date(txn.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">-₹{txn.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmployeeDashboard() {
  const navigate = useNavigate()
  const { data: wallet } = useGetBalanceQuery()
  const { data: txns = [] } = useGetMyTransactionsQuery()

  const available = wallet ? wallet.limit - wallet.spent_amount : 0
  const pending = txns.filter((t) => t.status === 'PENDING' || t.status === 'FLAGGED').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Manage your expense wallet</p>
        </div>
        <button id="new-spend-btn" onClick={() => navigate('/dashboard/spend/new')} className="btn-primary">
          <PlusCircle size={15} /> New Spend
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Available" value={`₹${available.toFixed(2)}`} icon={Wallet} color="bg-brand-600" delay={0} />
        <StatCard label="Spent" value={`₹${wallet?.spent_amount?.toFixed(2) ?? '0.00'}`} icon={TrendingUp} color="bg-emerald-500" delay={0.05} />
        <StatCard label="Pending Actions" value={pending} icon={Clock} color="bg-amber-500" delay={0.1} />
      </div>

      {wallet && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Spend Usage</span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              ₹{wallet.spent_amount.toFixed(2)} / ₹{wallet.limit.toFixed(2)}
            </span>
          </div>
          <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${wallet.limit > 0 ? Math.min((wallet.spent_amount / wallet.limit) * 100, 100) : 0}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full bg-brand-600"
            />
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recent Activity</h2>
        </div>
        {txns.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)] text-sm">No transactions yet</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {txns.slice(0, 5).map((txn) => (
              <div key={txn.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--bg-secondary)] transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{txn.description}</p>
                    {txn.is_over_limit_request && (
                      <span className="text-xs bg-rose-100 dark:bg-rose-900/40 text-rose-600 px-1.5 py-0.5 rounded font-medium">OVER LIMIT</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {txn.category || 'Uncategorized'} · {new Date(txn.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={txn.status} />
                  <span className="text-sm font-semibold text-[var(--text-primary)]">₹{txn.amount.toFixed(2)}</span>
                  {txn.status === 'PENDING' && !txn.is_over_limit_request && (
                    <button onClick={() => navigate(`/dashboard/proof/${txn.id}`)} className="btn-primary py-1 text-xs">Upload Proof</button>
                  )}
                  {txn.status === 'APPROVED' && (
                    <button onClick={() => navigate(`/dashboard/pay/${txn.id}`)} className="btn-success py-1 text-xs">Pay Now</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useSelector((s) => s.auth)
  return (user?.role === 'ADMIN' || user?.role === 'COMPANY') ? <AdminDashboard /> : <EmployeeDashboard />
}
