import { useParams, useNavigate } from 'react-router-dom'
import { useInitiatePaymentMutation, useConfirmPaymentMutation } from '../store/slices/apiSlice'
import toast from 'react-hot-toast'
import { CreditCard, ArrowLeft, CheckCircle } from 'lucide-react'
import { useState } from 'react'

export default function PaymentPage() {
  const { txnId } = useParams()
  const navigate = useNavigate()
  const [initiate, { isLoading: initiating }] = useInitiatePaymentMutation()
  const [confirm] = useConfirmPaymentMutation()
  const [paid, setPaid] = useState(false)

  const handlePay = async () => {
    try {
      const orderData = await initiate(txnId).unwrap()

      const options = {
        key: orderData.razorpay_key,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.order_id,
        name: 'ExpenseManager',
        description: `Payment for Txn #${txnId}`,
        theme: { color: '#4f46e5' },
        handler: async (response) => {
          try {
            await confirm({
              txnId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }).unwrap()
            setPaid(true)
            toast.success('Payment successful!')
          } catch {
            toast.error('Payment confirmation failed. Contact admin.')
          }
        },
        modal: { ondismiss: () => toast('Payment cancelled') },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      toast.error(err?.data?.detail || 'Could not initiate payment')
    }
  }

  if (paid) {
    return (
      <div className="max-w-lg">
        <div className="card p-8 text-center">
          <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Payment Complete!</h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">Transaction #{txnId} has been marked as PAID.</p>
          <button onClick={() => navigate('/')} className="btn-primary w-full justify-center py-2.5">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="page-title mb-1">Complete Payment</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">Transaction #{txnId} is approved. Pay via UPI using Razorpay.</p>

      <div className="card p-6 text-center">
        <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard size={28} className="text-brand-600" />
        </div>
        <p className="text-[var(--text-muted)] text-sm mb-6">Click below to open the secure Razorpay UPI checkout.</p>
        <button
          id="pay-btn"
          onClick={handlePay}
          disabled={initiating}
          className="btn-primary w-full justify-center py-3 text-base"
        >
          {initiating ? 'Preparing checkout...' : 'Pay via UPI / Razorpay'}
        </button>
      </div>
    </div>
  )
}
