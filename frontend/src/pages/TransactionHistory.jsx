import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useGetMyTransactionsQuery, useGetAllTransactionsQuery } from '../store/slices/apiSlice'
import StatusBadge from '../components/StatusBadge'

export default function TransactionHistory() {
  const { user } = useSelector((s) => s.auth)
  const navigate = useNavigate()
  const isAdmin = user?.role === 'ADMIN'

  const { data: myTxns = [], isLoading: loadingMine } = useGetMyTransactionsQuery(undefined, { skip: isAdmin })
  const { data: allTxns = [], isLoading: loadingAll } = useGetAllTransactionsQuery(undefined, { skip: !isAdmin })

  const txns = isAdmin ? allTxns : myTxns
  const isLoading = isAdmin ? loadingAll : loadingMine

  return (
    <div>
      <h1 className="page-title mb-6">Transaction History</h1>
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
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Description</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Date</th>
                  {!isAdmin && <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Actions</th>}
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
                    <td className="px-5 py-3.5 text-[var(--text-muted)] text-xs">{new Date(txn.created_at).toLocaleDateString()}</td>
                    {!isAdmin && (
                      <td className="px-5 py-3.5">
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
                      </td>
                    )}
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
