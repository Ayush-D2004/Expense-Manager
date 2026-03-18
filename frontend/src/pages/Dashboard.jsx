import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useGetBalanceQuery, useGetMyTransactionsQuery } from '../store/slices/apiSlice'
import StatusBadge from '../components/StatusBadge'
import { ArrowUpRight, Wallet, TrendingUp, Clock, PlusCircle } from 'lucide-react'
import { motion } from 'framer-motion'

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

export default function Dashboard() {
  const { user } = useSelector((s) => s.auth)
  const navigate = useNavigate()
  const isAdmin = user?.role === 'ADMIN'

  const { data: wallet } = useGetBalanceQuery(undefined, { skip: isAdmin })
  const { data: txns = [] } = useGetMyTransactionsQuery(undefined, { skip: isAdmin })

  const available = wallet ? wallet.limit - wallet.spent_amount : 0
  const pending = txns.filter((t) => t.status === 'PENDING' || t.status === 'FLAGGED').length

  if (isAdmin) {
    return (
      <div>
        <h1 className="page-title mb-2">Dashboard</h1>
        <p className="text-[var(--text-muted)] mb-6">Welcome back, {user.name}. You have admin access.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Quick Access" value="Employees" icon={Wallet} color="bg-brand-600" delay={0} />
          <StatCard label="Quick Access" value="Transactions" icon={TrendingUp} color="bg-emerald-500" delay={0.05} />
          <StatCard label="Quick Access" value="Reports" icon={ArrowUpRight} color="bg-indigo-500" delay={0.1} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Manage your expense wallet</p>
        </div>
        <button id="new-spend-btn" onClick={() => navigate('/spend/new')} className="btn-primary">
          <PlusCircle size={15} />
          New Spend
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
                  <p className="text-sm font-medium text-[var(--text-primary)]">{txn.description}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {txn.category || 'Uncategorized'} · {new Date(txn.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={txn.status} />
                  <span className="text-sm font-semibold text-[var(--text-primary)]">₹{txn.amount.toFixed(2)}</span>
                  {txn.status === 'PENDING' && (
                    <button onClick={() => navigate(`/proof/${txn.id}`)} className="btn-primary py-1 text-xs">
                      Upload Proof
                    </button>
                  )}
                  {txn.status === 'APPROVED' && (
                    <button onClick={() => navigate(`/pay/${txn.id}`)} className="btn-success py-1 text-xs">
                      Pay Now
                    </button>
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
