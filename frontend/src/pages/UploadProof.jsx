import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUploadProofMutation, useSkipProofMutation } from '../store/slices/apiSlice'
import toast from 'react-hot-toast'
import { Upload, FileImage, ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function UploadProof() {
  const { txnId } = useParams()
  const navigate = useNavigate()
  const [uploadProof, { isLoading }] = useUploadProofMutation()
  const [skipProof, { isLoading: isSkipping }] = useSkipProofMutation()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef()

  const handleFile = (f) => {
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('image/')) handleFile(f)
  }

  const handleSubmit = async () => {
    if (!file) return toast.error('Please select a receipt image')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const txn = await uploadProof({ txnId, formData }).unwrap()
      setResult({ status: txn.status, proof: txn.proof })
    } catch (err) {
      const detail = err?.data?.detail
      toast.error(Array.isArray(detail) ? detail[0].msg : (detail || 'Upload failed'))
    }
  }

  if (result) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg">
        <div className="card p-8 text-center">
          {result.status === 'APPROVED' ? (
            <>
              <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Receipt Verified ✓</h2>
              <p className="text-sm text-[var(--text-muted)] mb-4">{result.proof?.ai_reason}</p>
              <button onClick={() => navigate(`/dashboard/pay/${txnId}`)} className="btn-success w-full justify-center py-2.5">
                Proceed to Payment
              </button>
            </>
          ) : (
            <>
              <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Flagged for Review</h2>
              <p className="text-sm text-[var(--text-muted)] mb-4">{result.proof?.ai_reason}</p>
              <p className="text-xs text-[var(--text-muted)] mb-4">An admin will review and approve your request manually.</p>
              <button onClick={() => navigate('/dashboard')} className="btn-secondary w-full justify-center py-2.5">
                Back to Dashboard
              </button>
            </>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-lg">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="page-title mb-1">Upload Receipt</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">Transaction #{txnId} — Upload your business receipt. AI will verify it automatically.</p>

      <div className="card p-6 space-y-5">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-[var(--border)] hover:border-brand-400'
          }`}
        >
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
          <Upload size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
          <p className="text-sm font-medium text-[var(--text-primary)]">Drop your receipt here</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">or click to browse · PNG, JPG, WEBP</p>
        </div>

        <AnimatePresence>
          {preview && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="rounded-xl overflow-hidden border border-[var(--border)]">
              <img src={preview} alt="Receipt preview" className="w-full object-contain max-h-64" />
              <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] border-t border-[var(--border)]">
                <FileImage size={14} className="text-brand-500" />
                <span className="text-xs text-[var(--text-secondary)] truncate">{file?.name}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          id="verify-btn"
          onClick={handleSubmit}
          disabled={isLoading || !file}
          className="btn-primary w-full justify-center py-2.5"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Verifying with AI...
            </span>
          ) : 'Verify with AI →'}
        </button>

        <button
          onClick={async () => {
            try {
              await skipProof(txnId).unwrap()
              setResult({ status: 'APPROVED', proof: { ai_reason: 'Demo: Verification skipped.' } })
            } catch (err) {
              const detail = err?.data?.detail
              toast.error(Array.isArray(detail) ? detail[0].msg : (detail || 'Skip failed'))
            }
          }}
          disabled={isSkipping}
          className="w-full justify-center py-2 text-xs rounded-lg border border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors flex items-center gap-2"
        >
          {isSkipping ? 'Skipping...' : '⚡ Skip AI Verification (Demo Only)'}
        </button>
      </div>
    </div>
  )
}
