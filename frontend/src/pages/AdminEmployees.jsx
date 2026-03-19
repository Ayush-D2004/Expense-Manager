import { useState } from 'react'
import { useSelector } from 'react-redux'
import { 
  useListEmployeeWalletsQuery, 
  useSetEmployeeLimitMutation,
  useCreateEmployeeMutation,
  useChangeEmployeeRoleMutation
} from '../store/slices/apiSlice'
import toast from 'react-hot-toast'
import { Users, Edit2, X, PlusCircle, UserCheck, UserMinus } from 'lucide-react'
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
      const detail = err?.data?.detail
      toast.error(Array.isArray(detail) ? detail[0].msg : (detail || 'Failed to update limit'))
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

function CreateEmployeeModal({ onClose }) {
  const [createEmployee, { isLoading }] = useCreateEmployeeMutation()
  const [form, setForm] = useState({ name: '', email: '', dob_string: '' })

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      await createEmployee(form).unwrap()
      toast.success(`Employee ${form.name} created!`)
      onClose()
    } catch (err) {
      const detail = err?.data?.detail
      toast.error(Array.isArray(detail) ? detail[0].msg : (detail || 'Failed to create employee'))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="card p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-[var(--text-primary)]">Add New Employee</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={18} /></button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input type="text" className="input" placeholder="Jane Doe" required
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input type="email" className="input" placeholder="jane@company.com" required
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Birthdate (DDMMYY)</label>
            <p className="text-xs text-[var(--text-muted)] mb-1">Provides initial login password and UPI PIN.</p>
            <input type="text" className="input" placeholder="e.g. 150895" required maxLength={6} pattern="\d{6}"
              value={form.dob_string} onChange={(e) => setForm({ ...form, dob_string: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={isLoading} className="btn-primary flex-1 justify-center">
              {isLoading ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function AdminEmployees() {
  const { user: currentUser } = useSelector((s) => s.auth)
  const isCompany = currentUser?.role === 'COMPANY'

  const { data: wallets = [], isLoading } = useListEmployeeWalletsQuery()
  const [changeRole] = useChangeEmployeeRoleMutation()

  const [selectedLimit, setSelectedLimit] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = wallets.filter((w) =>
    w.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    w.user?.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleToggleRole = async (wallet) => {
    const newRole = wallet.user.role === 'ADMIN' ? 'EMPLOYEE' : 'ADMIN'
    try {
      await changeRole({ userId: wallet.user_id, role: newRole }).unwrap()
      toast.success(`${wallet.user.name} is now ${newRole}`)
    } catch {
      toast.error('Failed to change role')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
            <Users size={17} className="text-white" />
          </div>
          <h1 className="page-title">Employees & Admins</h1>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="search" placeholder="Search team..."
            className="input w-56" value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {isCompany && (
            <button onClick={() => setShowCreate(true)} className="btn-primary py-2">
              <PlusCircle size={15} /> Add Member
            </button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[var(--text-muted)]">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Member Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Spent / Limit</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Usage</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((w) => {
                  const isAdmin = w.user?.role === 'ADMIN'
                  const pct = w.limit > 0 ? Math.min((w.spent_amount / w.limit) * 100, 100) : 0
                  
                  return (
                    <tr key={w.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                      <td className="px-5 py-4">
                        <div className={`inline-flex items-center px-2.5 py-1 rounded font-medium text-xs ${
                           isAdmin 
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' 
                            : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                        }`}>
                          {w.user?.name}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[var(--text-secondary)]">{w.user?.email}</td>
                      <td className="px-5 py-4 font-medium text-[var(--text-primary)]">
                        {isAdmin ? (
                          <span className="text-xs text-[var(--text-muted)]">Unrestricted (Company Wallet)</span>
                        ) : (
                          <>₹{w.spent_amount.toFixed(2)} <span className="text-xs text-[var(--text-muted)] font-normal">/ ₹{w.limit.toFixed(2)}</span></>
                        )}
                      </td>
                      <td className="px-5 py-4 w-32">
                        {!isAdmin && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                              <div style={{ width: `${pct}%` }}
                                className={`h-full rounded-full ${pct > 80 ? 'bg-coral-500' : 'bg-brand-600'}`} />
                            </div>
                            <span className="text-xs text-[var(--text-muted)]">{pct.toFixed(0)}%</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {!isAdmin && (
                            <button
                              onClick={() => setSelectedLimit(w)}
                              className="btn-secondary py-1 px-2 text-xs flex items-center gap-1.5"
                              title="Set Spending Limit"
                            >
                              <Edit2 size={12} /> Limit
                            </button>
                          )}
                          {isCompany && (
                            <button
                              onClick={() => handleToggleRole(w)}
                              className={`py-1 px-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                                isAdmin
                                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-900 dark:text-yellow-500'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900 dark:text-emerald-500'
                              }`}
                              title={isAdmin ? "Demote to Employee" : "Promote to Admin"}
                            >
                              {isAdmin ? <UserMinus size={12} /> : <UserCheck size={12} />}
                              {isAdmin ? 'Make Employee' : 'Make Admin'}
                            </button>
                          )}
                        </div>
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
        {selectedLimit && <LimitModal wallet={selectedLimit} onClose={() => setSelectedLimit(null)} />}
        {showCreate && <CreateEmployeeModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
    </div>
  )
}
