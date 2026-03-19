import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { usePayWithPinMutation, useGetBalanceQuery } from '../store/slices/apiSlice'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ShieldCheck, ArrowLeft, CheckCircle, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function PinPad({ value, onChange }) {
  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫']
  return (
    <div>
      <div className="flex justify-center gap-2 mb-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center text-lg font-bold transition-colors ${
            i < value.length ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30' : 'border-[var(--border)]'
          }`}>
            {i < value.length ? '●' : ''}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto">
        {digits.map((d, i) => (
          <button
            key={i}
            disabled={!d}
            onClick={() => {
              if (d === '⌫') onChange(value.slice(0, -1))
              else if (value.length < 6) onChange(value + d)
            }}
            className={`h-11 rounded-xl text-base font-semibold transition-all ${
              d ? 'bg-[var(--bg-secondary)] hover:bg-[var(--border)] text-[var(--text-primary)] active:scale-95' : 'invisible'
            }`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function PaymentPage() {
  const { txnId } = useParams()
  const navigate = useNavigate()
  const { data: wallet } = useGetBalanceQuery()
  const [payWithPin, { isLoading }] = usePayWithPinMutation()
  const [pin, setPin] = useState('')
  const [paid, setPaid] = useState(false)

  // If employee hasn't set a PIN yet, redirect to setup
  if (wallet && !wallet.has_pin) {
    return (
      <div className="max-w-sm mx-auto">
        <div className="card p-8 text-center">
          <Lock size={40} className="text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">UPI PIN Not Set</h2>
          <p className="text-sm text-[var(--text-muted)] mb-5">You need to set your UPI PIN before making payments.</p>
          <button onClick={() => navigate('/setup-pin')} className="btn-primary w-full justify-center py-2.5">Set UPI PIN</button>
        </div>
      </div>
    )
  }

  const handlePay = async () => {
    if (pin.length < 4) return toast.error('Enter your full UPI PIN')
    try {
      await payWithPin({ txnId, upi_pin: pin }).unwrap()
      setPaid(true)
    } catch (err) {
      const detail = err?.data?.detail
      toast.error(Array.isArray(detail) ? detail[0].msg : (detail || 'Payment failed'))
      setPin('')
    }
  }

  if (paid) return (
    <div className="max-w-sm mx-auto">
      <div className="card p-8 text-center">
        <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Payment Successful!</h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">Transaction #{txnId} marked as PAID.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary w-full justify-center py-2.5">Back to Dashboard</button>
      </div>
    </div>
  )

  return (
    <div className="max-w-sm mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>
      <div className="card p-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Enter UPI PIN</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Transaction #{txnId} · Deducted from company wallet</p>
        </div>

        <PinPad value={pin} onChange={setPin} />

        <button
          id="pay-pin-btn"
          onClick={handlePay}
          disabled={isLoading || pin.length < 4}
          className="btn-primary w-full justify-center py-2.5 mt-5"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Authorising...
            </span>
          ) : 'Confirm Payment'}
        </button>
        <p className="text-center text-xs text-[var(--text-muted)] mt-3">
          Forgot PIN?{' '}
          <button onClick={() => navigate('/setup-pin')} className="text-brand-600 hover:underline">Request change</button>
        </p>
      </div>
    </div>
  )
}
