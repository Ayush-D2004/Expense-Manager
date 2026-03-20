import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSetupPinMutation, useRequestPinChangeMutation, useGetBalanceQuery, useSetDobMutation } from '../store/slices/apiSlice'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { Lock, RefreshCw, ArrowLeft, CheckCircle, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

function PinPad({ value, onChange }) {
  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫']
  return (
    <div>
      <div className="flex justify-center gap-2 mb-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xl font-bold transition-colors ${
            i < value.length ? 'border-brand-600 text-brand-600' : 'border-[var(--border)]'
          }`}>
            {i < value.length ? '●' : ''}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
        {digits.map((d, i) => (
          <button
            key={i}
            disabled={!d}
            onClick={() => {
              if (d === '⌫') onChange(value.slice(0, -1))
              else if (value.length < 6) onChange(value + d)
            }}
            className={`h-12 rounded-xl text-lg font-semibold transition-all ${
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

export default function SetupPin() {
  const navigate = useNavigate()
  const [setupPin, { isLoading: setting }] = useSetupPinMutation()
  const [requestPinChange, { isLoading: requesting }] = useRequestPinChangeMutation()
  const { data: wallet, refetch: refetchWallet } = useGetBalanceQuery()
  const { user } = useSelector((s) => s.auth)
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [step, setStep] = useState('enter') // 'enter' | 'confirm'
  const [done, setDone] = useState(false)
  const [dob, setDob] = useState('')
  const [setDobMutation, { isLoading: settingDob }] = useSetDobMutation()

  const hasPin = wallet?.has_pin
  const pinChangeRequested = wallet?.pin_change_requested
  const needsDob = !user?.dob_string && !hasPin

  const handleNext = () => {
    if (pin.length < 4) return toast.error('PIN must be at least 4 digits')
    setStep('confirm')
  }

  const handleSetPin = async () => {
    if (pin !== confirm) return toast.error('PINs do not match')
    try {
      await setupPin({ pin }).unwrap()
      toast.success('UPI PIN set successfully!')
      setDone(true)
    } catch (err) {
      const detail = err?.data?.detail
      toast.error(Array.isArray(detail) ? detail[0].msg : (detail || 'Failed to set PIN'))
    }
  }

  const handleRequestChange = async () => {
    try {
      await requestPinChange().unwrap()
      toast.success('Request sent to admin')
    } catch (err) {
      const detail = err?.data?.detail
      toast.error(Array.isArray(detail) ? detail[0].msg : (detail || 'Failed to send request'))
    }
  }

  if (done) return (
    <div className="max-w-sm mx-auto">
      <div className="card p-8 text-center">
        <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">PIN Set Successfully</h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">You can now use your UPI PIN to authorize payments.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary w-full justify-center py-2.5">Go to Dashboard</button>
      </div>
    </div>
  )

  if (hasPin && pinChangeRequested) return (
    <div className="max-w-sm mx-auto">
      <div className="card p-8 text-center">
        <Clock size={48} className="text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Waiting for Admin Approval</h2>
        <p className="text-sm text-[var(--text-muted)] mb-2">Your PIN change request is pending admin approval.</p>
        <p className="text-xs text-[var(--text-muted)]">Once approved, return here to set a new PIN.</p>
      </div>
    </div>
  )

  if (hasPin && !pinChangeRequested) return (
    <div className="max-w-sm mx-auto">
      <div className="card p-8 text-center">
        <RefreshCw size={48} className="text-brand-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Change UPI PIN</h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">Changing your PIN requires admin approval first.</p>
        <button onClick={handleRequestChange} disabled={requesting} className="btn-primary w-full justify-center py-2.5">
          {requesting ? 'Sending...' : 'Request PIN Change from Admin'}
        </button>
      </div>
    </div>
  )

  // If user has no DOB (company/admin), prompt for it first
  if (needsDob) return (
    <div className="max-w-sm mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>
      <div className="card p-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center mx-auto mb-3">
            <Lock size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Set Your Date of Birth</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Your date of birth is used as your default UPI PIN.</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label text-sm">Date of Birth (DDMMYY)</label>
            <input type="text" className="input text-center text-lg font-mono tracking-widest"
              placeholder="e.g. 150899" maxLength={6} pattern="\d{6}"
              value={dob} onChange={(e) => setDob(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            <p className="text-xs text-[var(--text-muted)] mt-1">Format: DDMMYY (e.g. 04062004 → 040604)</p>
          </div>
          <button
            onClick={async () => {
              if (dob.length !== 6) return toast.error('DOB must be exactly 6 digits')
              try {
                await setDobMutation({ dob_string: dob }).unwrap()
                toast.success('DOB saved! Default UPI PIN set to your DOB.')
                await refetchWallet()
                setDone(true)
              } catch (err) {
                const detail = err?.data?.detail
                toast.error(Array.isArray(detail) ? detail[0].msg : (detail || 'Failed to save DOB'))
              }
            }}
            disabled={settingDob || dob.length !== 6}
            className="btn-primary w-full justify-center py-2.5"
          >
            {settingDob ? 'Saving...' : 'Save DOB & Set Default PIN'}
          </button>
        </div>
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
            <Lock size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            {step === 'enter' ? 'Set Your UPI PIN' : 'Confirm PIN'}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {step === 'enter' ? 'Enter a 4–6 digit PIN for wallet payments' : 'Re-enter your PIN to confirm'}
          </p>
        </div>
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          {step === 'enter' ? (
            <>
              <PinPad value={pin} onChange={setPin} />
              <button id="pin-next-btn" onClick={handleNext} disabled={pin.length < 4}
                className="btn-primary w-full justify-center py-2.5 mt-5">
                Next
              </button>
            </>
          ) : (
            <>
              <PinPad value={confirm} onChange={setConfirm} />
              <button id="pin-confirm-btn" onClick={handleSetPin} disabled={setting || confirm.length < 4}
                className="btn-primary w-full justify-center py-2.5 mt-5">
                {setting ? 'Setting PIN...' : 'Set PIN'}
              </button>
              <button onClick={() => { setStep('enter'); setPin(''); setConfirm('') }}
                className="btn-secondary w-full justify-center py-2 mt-2 text-sm">
                Re-enter
              </button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}