import { useState } from 'react'
import { useListEmployeeWalletsQuery, useSetEmployeeLimitMutation } from '../store/slices/apiSlice'
import toast from 'react-hot-toast'
import { Users, Edit2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function LimitModal({ wallet, onClose }) {
  const [limit, setLimit] = useState(wallet.limit)
  const [setEmployeeLimit, { isLoading }] = useSetEmployeeLimitMutation()

  const handleSave = async () => {
    try {
      await setEmployeeLimit({ userId: wallet.user_id, limit: parseFloat(limit) }).unwrap()
      toast.success(`Limit updated for ${wallet.user?.name}`)
      onClose()
    } catch (err) {
      toast.error(err?.data?.detail || 'Failed to update limit')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="card p-6 w-full max-w-sm"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-[var(--text-primary)]">Set Spending Limit</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={18} /></button>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-4">Employee: <strong>{wallet.user?.name}</strong></p>
        <div className="mb-5">
          <label className="label" htmlFor="limit-input">Monthly limit (₹)</label>
          <input id="limit-input" type="number" className="input" min="0" step="100"
            value={limit} onChange={(e) => setLimit(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handleSave} disabled={isLoading} className="btn-primary flex-1 justify-center">
            {isLoading ? 'Saving...' : 'Save Limit'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function AdminEmployees() {
  const { data: wallets = [], isLoading } = useListEmployeeWalletsQuery()
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = wallets.filter((w) =>
    w.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    w.user?.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
            <Users size={17} className="text-white" />
          </div>
          <h1 className="page-title">Employees</h1>
        </div>
        <input
          type="search" placeholder="Search employees..."
          className="input w-56" value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[var(--text-muted)]">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Employee</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Spent</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Limit</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Usage</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((w) => {
                  const pct = w.limit > 0 ? Math.min((w.spent_amount / w.limit) * 100, 100) : 0
                  return (
                    <tr key={w.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-[var(--text-primary)]">{w.user?.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{w.user?.email}</p>
                      </td>
                      <td className="px-5 py-4 font-medium text-[var(--text-primary)]">₹{w.spent_amount.toFixed(2)}</td>
                      <td className="px-5 py-4 text-[var(--text-secondary)]">₹{w.limit.toFixed(2)}</td>
                      <td className="px-5 py-4 w-32">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                            <div style={{ width: `${pct}%` }}
                              className={`h-full rounded-full ${pct > 80 ? 'bg-coral-500' : 'bg-brand-600'}`} />
                          </div>
                          <span className="text-xs text-[var(--text-muted)]">{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setSelected(w)}
                          className="btn-secondary py-1.5 text-xs flex items-center gap-1.5"
                        >
                          <Edit2 size={12} /> Set Limit
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && <LimitModal wallet={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  )
}
