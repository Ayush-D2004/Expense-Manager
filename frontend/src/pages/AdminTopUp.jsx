import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInitiateTopUpMutation, useConfirmTopUpMutation, useGetBalanceQuery, useGetReportsQuery, useDirectTopUpMutation } from '../store/slices/apiSlice'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { ArrowRight, ArrowLeft, CheckCircle, Wallet, Building2, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AdminTopUp() {
  const navigate = useNavigate()
  const { user } = useSelector((s) => s.auth)
  const isManager = user?.role === 'ADMIN' || user?.role === 'COMPANY'
  const { data: reports } = useGetReportsQuery(undefined, { skip: !isManager })

  const companyBalance = reports?.summary?.wallet_balance ?? 0

  const [initiate, { isLoading: initiating }] = useInitiateTopUpMutation()
  const [confirm] = useConfirmTopUpMutation()
  const [amount, setAmount] = useState('')
  const [success, setSuccess] = useState(null)
  const [directTopUp, { isLoading: directLoading }] = useDirectTopUpMutation()

  // Dummy Bank Account state for dynamic UI
  const [bankBalance, setBankBalance] = useState(5000000)

  const handleTopUp = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt < 1) return toast.error('Enter a valid amount')
    if (amt > bankBalance) return toast.error('Insufficient funds in connected bank account')

    try {
      const order = await initiate(amt).unwrap()
      const options = {
        key: order.razorpay_key,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: user?.company?.name || 'Company Workspace',
        description: 'Fund Transfer to Digital Wallet',
        theme: { color: '#0ea5e9' },
        handler: async (response) => {
          try {
            const result = await confirm({
              order_id: order.order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              amount: amt,
            }).unwrap()
            
            // Deduct from dummy bank account after successful wallet credit
            setBankBalance(prev => prev - amt)
            setSuccess(result.new_balance)
            toast.success(`₹${amt.toFixed(2)} transferred to digital wallet!`)
          } catch {
            toast.error('Transaction verification failed.')
          }
        },
        modal: { ondismiss: () => toast('Transfer cancelled') },
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      const detail = err?.data?.detail
      toast.error(Array.isArray(detail) ? detail[0].msg : (detail || 'Failed to initiate transfer'))
    }
  }

  if (success !== null) return (
    <div className="max-w-md mx-auto">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="card p-8 text-center mt-8 shadow-xl">
        <CheckCircle size={56} className="text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Transfer Successful!</h2>
        <p className="text-sm text-[var(--text-muted)] mb-2">New Company Wallet Balance:</p>
        <p className="text-4xl font-bold text-brand-600 mb-8">₹{success.toFixed(2)}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary w-full justify-center py-3 text-sm font-medium">Return to Dashboard</button>
      </motion.div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-brand-600 mb-6 transition-colors">
        <ArrowLeft size={16} /> Dashboard
      </button>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Fund Management</h1>
        <p className="text-[var(--text-muted)] mt-1 text-sm">Transfer funds securely from your connected bank account to the company digital wallet.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* Left Side: Accounts Overview */}
        <div className="space-y-6">
          <div className="card p-6 border-l-4 border-l-slate-700 dark:border-l-slate-400 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Building2 size={18} className="text-slate-600 dark:text-slate-300" />
                  <h2 className="font-semibold text-slate-800 dark:text-slate-200">Corporate Current Account</h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">HDFC Bank ··· 9832</p>
              </div>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wide">Connected</span>
            </div>
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700/50">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Available Balance</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white">₹{bankBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>

          <div className="flex justify-center -my-3 relative z-10">
            <div className="bg-[var(--bg-primary)] p-2 rounded-full border border-[var(--border)] shadow-sm">
              <ArrowRight className="text-brand-600 rotate-90 md:rotate-0" size={20} />
            </div>
          </div>

          <div className="card p-6 border-l-4 border-l-brand-500 bg-brand-50/50 dark:bg-brand-900/10">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Wallet size={18} className="text-brand-600 dark:text-brand-400" />
                  <h2 className="font-semibold text-brand-900 dark:text-brand-100">Digital Expense Wallet</h2>
                </div>
                <p className="text-xs text-brand-600/70 dark:text-brand-400/70 font-medium">Central Pool</p>
              </div>
              <span className="bg-brand-100 text-brand-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wide">Active</span>
            </div>
            <div className="mt-6 pt-5 border-t border-brand-200/50 dark:border-brand-800/50">
              <p className="text-xs font-semibold text-brand-600/70 dark:text-brand-400/70 mb-1 uppercase tracking-wider">Current Balance</p>
              <h3 className="text-3xl font-bold text-brand-700 dark:text-brand-300">₹{(companyBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>
        </div>

        {/* Right Side: Transfer Form */}
        <div className="card p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[var(--border)]">
            <div className="p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg">
              <ShieldCheck size={18} />
            </div>
            <h2 className="font-semibold text-[var(--text-primary)]">Initiate Transfer</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="label text-sm font-medium" htmlFor="transfer-amount">Transfer Amount (₹)</label>
              <div className="relative mt-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-medium text-lg">₹</span>
                <input id="transfer-amount" type="number" min="1" step="100" className="input pl-8 py-3 text-lg font-semibold w-full"
                  placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="flex justify-between items-center mt-2 px-1">
                <p className="text-xs text-[var(--text-muted)]">Minimum transfer: ₹100</p>
                {amount && parseFloat(amount) > bankBalance && (
                  <p className="text-xs text-rose-500 font-medium">Exceeds bank balance</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[10000, 50000, 100000, bankBalance].map((q, idx) => (
                <button key={q} onClick={() => setAmount(q.toString())}
                  className="btn-secondary py-1.5 text-xs justify-center border hover:border-brand-500 hover:text-brand-600 transition-colors">
                  {idx === 3 ? 'Max' : `₹${q/1000}k`}
                </button>
              ))}
            </div>

            <div className="pt-4 mt-2 border-t border-[var(--border)] space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Transfer Fee</span>
                <span className="font-medium text-emerald-600">Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Estimated Time</span>
                <span className="font-medium text-[var(--text-primary)]">Instant (UPI integration)</span>
              </div>

              <button id="topup-btn" onClick={handleTopUp} disabled={initiating || (amount && parseFloat(amount) > bankBalance)}
                className="btn-primary w-full justify-center py-3 text-[15px] font-semibold mt-2 shadow-md shadow-brand-500/20 active:translate-y-0.5 transition-all">
                {initiating ? 'Authenticating...' : 'Authorize Transfer'}
              </button>

              <button
                onClick={async () => {
                  const amt = parseFloat(amount)
                  if (!amt || amt < 1) return toast.error('Enter a valid amount')
                  try {
                    const result = await directTopUp(amt).unwrap()
                    setBankBalance(prev => prev - amt)
                    setSuccess(result.new_balance)
                    toast.success(`₹${amt.toFixed(2)} added directly!`)
                  } catch (err) {
                    const detail = err?.data?.detail
                    toast.error(Array.isArray(detail) ? detail[0].msg : (detail || 'Failed'))
                  }
                }}
                disabled={directLoading}
                className="w-full justify-center py-2 text-xs rounded-lg border border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors flex items-center gap-2"
              >
                {directLoading ? 'Adding...' : '⚡ Quick Add (Demo — Skip Razorpay)'}
              </button>
              <p className="text-[10px] text-center text-[var(--text-muted)] mt-3 flex items-center justify-center gap-1">
                Secured by Razorpay Setup
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
