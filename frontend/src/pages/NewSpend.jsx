import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateSpendMutation, useGetBalanceQuery } from '../store/slices/apiSlice'
import toast from 'react-hot-toast'
import { ArrowLeft, IndianRupee, AlertTriangle, QrCode, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import QRScanner from '../components/QRScanner'

const CATEGORIES = ['Office Supplies', 'Travel', 'Meals', 'Equipment', 'Software', 'Other']

export default function NewSpend() {
  const navigate = useNavigate()
  const [createSpend, { isLoading }] = useCreateSpendMutation()
  const { data: wallet } = useGetBalanceQuery()
  const [form, setForm] = useState({ amount: '', description: '', category: '', merchant_upi: '' })
  const [showOverLimitWarning, setShowOverLimitWarning] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  const available = wallet ? wallet.limit - wallet.spent_amount : Infinity
  const isAdmin = !wallet?.limit  // admin has no limit model
  const amountNum = parseFloat(form.amount) || 0
  const isOverLimit = !isAdmin && amountNum > available && amountNum > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isOverLimit && !showOverLimitWarning) {
      setShowOverLimitWarning(true)
      return
    }
    try {
      const txn = await createSpend({
        amount: parseFloat(form.amount),
        description: form.description,
        category: form.category || null,
        merchant_upi: form.merchant_upi || null,
      }).unwrap()
      toast.success(isOverLimit ? 'Over-limit request sent to admin!' : 'Spend request created!')
      navigate(isOverLimit ? '/dashboard' : `/dashboard/proof/${txn.id}`)
    } catch (err) {
      const detail = err?.data?.detail
      toast.error(Array.isArray(detail) ? detail[0].msg : (detail || 'Failed to create spend'))
    }
  }

  const handleQRScan = (data) => {
    setForm(prev => ({
      ...prev,
      amount: data.amount > 0 ? String(data.amount) : prev.amount,
      description: data.name || prev.description,
      merchant_upi: data.vpa || '',
    }))
    setShowQR(false)
    toast.success('QR scanned! Details auto-filled.')
  }

  return (
    <div className="max-w-lg">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="page-title mb-1">New Expense</h1>
      <p className="text-sm text-[var(--text-muted)] mb-4">Submit a spend request. You'll need to upload a receipt next.</p>

      {form.merchant_upi && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-3 shadow-sm shadow-emerald-500/10">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300">QR Scanned & Auto-filled!</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400/80 mt-0.5">Details for <span className="font-semibold">{form.description || 'the merchant'}</span> captured. Check the fields below.</p>
          </div>
          <button onClick={() => setForm(p => ({ ...p, merchant_upi: '', amount: '', description: '' }))} className="text-xs font-semibold text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 underline underline-offset-2">Reset</button>
        </motion.div>
      )}

      {/* QR Scan Button */}
      <button
        onClick={() => setShowQR(true)}
        className="w-full card p-4 mb-4 flex items-center gap-3 hover:bg-[var(--bg-secondary)] transition-colors text-left border-2 border-dashed border-brand-300 dark:border-brand-700"
      >
        <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
          <QrCode size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">Scan UPI QR Code</p>
          <p className="text-xs text-[var(--text-muted)]">Auto-fill merchant details from a UPI QR</p>
        </div>
      </button>

      <AnimatePresence>{showScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />}</AnimatePresence>

      {wallet && !isAdmin && (
        <div className="card p-4 mb-4 flex items-center gap-3 text-sm">
          <div className="flex-1">
            <span className="text-[var(--text-muted)]">Available: </span>
            <span className="font-semibold text-[var(--text-primary)]">₹{available.toFixed(2)}</span>
          </div>
          <div className="w-32 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              style={{ width: `${wallet.limit > 0 ? Math.min((wallet.spent_amount / wallet.limit) * 100, 100) : 0}%` }}
              className="h-full rounded-full bg-brand-600"
            />
          </div>
        </div>
      )}

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label" htmlFor="amount">Amount (₹)</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <IndianRupee size={15} />
              </div>
              <input
                id="amount" type="number" step="0.01" min="1"
                className={`input pl-8 ${isOverLimit ? 'border-amber-500 focus:ring-amber-500/30' : ''}`}
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => { setForm({ ...form, amount: e.target.value }); setShowOverLimitWarning(false) }}
                required
              />
            </div>
            <AnimatePresence>
              {isOverLimit && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 flex items-start gap-2 text-amber-600 dark:text-amber-400 text-xs bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-lg"
                >
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>
                    This exceeds your available limit of <strong>₹{available.toFixed(2)}</strong>.
                    Submitting will send a <strong>special approval request to your admin</strong>.
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div>
            <label className="label" htmlFor="description">Description</label>
            <input id="description" type="text" className="input" placeholder="Office chair purchase"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div>
            <label className="label" htmlFor="category">Category</label>
            <select id="category" className="input" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Merchant UPI (auto-filled or manual) */}
          <div>
            <label className="label" htmlFor="merchant_upi">Merchant UPI ID</label>
            <input id="merchant_upi" type="text" className="input font-mono text-sm" placeholder="merchant@upi"
              value={form.merchant_upi} onChange={(e) => setForm({ ...form, merchant_upi: e.target.value })} />
            <p className="text-xs text-[var(--text-muted)] mt-1">Auto-filled from QR scan or enter manually.</p>
          </div>

          <button id="submit-spend-btn" type="submit" disabled={isLoading}
            className={`w-full justify-center py-2.5 ${isOverLimit ? 'btn-secondary border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'btn-primary'}`}>
            {isLoading ? 'Submitting...' : isOverLimit
              ? showOverLimitWarning ? 'Confirm & Send Request to Admin →' : 'Submit Over-Limit Request'
              : 'Submit & Upload Proof →'}
          </button>
        </form>
      </div>
    </div>
  )
}
