import { useState } from 'react'
import { useGetAllTransactionsQuery, useAdminApproveMutation } from '../store/slices/apiSlice'
import StatusBadge from '../components/StatusBadge'
import toast from 'react-hot-toast'
import { CheckCheck, List } from 'lucide-react'

export default function AdminTransactions() {
  const [statusFilter, setStatusFilter] = useState('')
  const { data: txns = [], isLoading } = useGetAllTransactionsQuery(statusFilter || undefined)
  const [adminApprove, { isLoading: approving }] = useAdminApproveMutation()

  const handleApprove = async (txnId) => {
    try {
      await adminApprove(txnId).unwrap()
      toast.success(`Transaction #${txnId} approved`)
    } catch (err) {
      toast.error(err?.data?.detail || 'Approval failed')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
            <List size={17} className="text-white" />
          </div>
          <h1 className="page-title">All Transactions</h1>
        </div>
        <select id="status-filter" className="input w-44" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="FLAGGED">Flagged</option>
          <option value="PAID">Paid</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[var(--text-muted)]">Loading...</div>
        ) : txns.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)] text-sm">No transactions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                  {['ID', 'Description', 'Category', 'Amount', 'Status', 'AI Reason', 'Date', 'Action'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {txns.map((txn) => (
                  <tr key={txn.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-5 py-3.5 text-[var(--text-muted)] font-mono text-xs">#{txn.id}</td>
                    <td className="px-5 py-3.5 font-medium text-[var(--text-primary)] max-w-xs truncate">{txn.description}</td>
                    <td className="px-5 py-3.5 text-[var(--text-secondary)]">{txn.category || '—'}</td>
                    <td className="px-5 py-3.5 font-semibold text-[var(--text-primary)]">₹{txn.amount.toFixed(2)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={txn.status} /></td>
                    <td className="px-5 py-3.5 max-w-xs">
                      {txn.proof ? (
                        <span className="text-xs text-[var(--text-muted)] line-clamp-2">{txn.proof.ai_reason}</span>
                      ) : <span className="text-xs text-[var(--text-muted)]">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-[var(--text-muted)] text-xs">{new Date(txn.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5">
                      {(txn.status === 'PENDING' || txn.status === 'FLAGGED') && (
                        <button
                          onClick={() => handleApprove(txn.id)}
                          disabled={approving}
                          className="btn-success py-1 text-xs flex items-center gap-1"
                        >
                          <CheckCheck size={12} /> Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
