import { useState, useRef, useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, Upload, X, QrCode, CheckCircle, Type } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function parseUpiUri(text) {
  try {
    if (!text.toLowerCase().startsWith('upi://pay')) return null
    const url = new URL(text)
    return {
      vpa: url.searchParams.get('pa') || '',
      name: url.searchParams.get('pn') || '',
      amount: parseFloat(url.searchParams.get('am')) || 0,
    }
  } catch {
    return null
  }
}

export default function QRScanner({ onScan, onClose }) {
  const [mode, setMode] = useState('choose') // choose | camera | manual
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [manualVpa, setManualVpa] = useState('')
  const [manualName, setManualName] = useState('')
  const [manualAmount, setManualAmount] = useState('')
  const scannerRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  const startCamera = async () => {
    setMode('camera')
    setError('')
    // Give the DOM a tick to render the #qr-reader div
    await new Promise(r => setTimeout(r, 100))
    try {
      const html5QrCode = new Html5Qrcode('qr-reader')
      scannerRef.current = html5QrCode
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          html5QrCode.stop().catch(() => {})
          const parsed = parseUpiUri(decodedText)
          if (parsed) {
            setResult(parsed)
          } else {
            setError('Not a valid UPI QR code. Please try again.')
            setMode('choose')
          }
        },
        () => {}
      )
    } catch (err) {
      setError('Camera not available. Use Upload or Manual Entry instead.')
      setMode('choose')
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    try {
      // Create a unique hidden container for the scanner
      const containerId = 'qr-file-reader-' + Date.now()
      const container = document.createElement('div')
      container.id = containerId
      container.style.display = 'none'
      document.body.appendChild(container)

      const html5QrCode = new Html5Qrcode(containerId)
      const decodedText = await html5QrCode.scanFile(file, true)

      // Clean up
      document.body.removeChild(container)

      const parsed = parseUpiUri(decodedText)
      if (parsed) {
        setResult(parsed)
      } else {
        setError('Not a valid UPI QR code image.')
      }
    } catch {
      setError('Could not read QR from this image. Try a clearer screenshot.')
    }
    // Reset file input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleManualConfirm = () => {
    if (!manualVpa.includes('@')) return setError('Enter a valid UPI ID (e.g. merchant@upi)')
    setResult({
      vpa: manualVpa,
      name: manualName || manualVpa.split('@')[0],
      amount: parseFloat(manualAmount) || 0,
    })
  }

  const handleConfirm = () => {
    if (result) onScan(result)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="card p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <QrCode size={18} className="text-brand-600" /> Scan UPI QR
          </h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={18} /></button>
        </div>

        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
              <CheckCircle size={40} className="text-emerald-500 mx-auto" />
              <div className="card p-4 text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Merchant:</span>
                  <span className="font-medium text-[var(--text-primary)]">{result.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">UPI ID:</span>
                  <span className="font-mono text-xs text-brand-600">{result.vpa}</span>
                </div>
                {result.amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Amount:</span>
                    <span className="font-semibold text-[var(--text-primary)]">₹{result.amount.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <button onClick={handleConfirm} className="btn-primary w-full justify-center py-2.5">Use These Details</button>
            </motion.div>
          ) : mode === 'manual' ? (
            <motion.div key="manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <p className="text-sm text-[var(--text-muted)] mb-2">Enter UPI details manually:</p>
              <div>
                <label className="label text-xs">UPI ID *</label>
                <input type="text" className="input font-mono text-sm" placeholder="merchant@upi"
                  value={manualVpa} onChange={(e) => setManualVpa(e.target.value)} />
              </div>
              <div>
                <label className="label text-xs">Merchant Name</label>
                <input type="text" className="input text-sm" placeholder="Shop Name"
                  value={manualName} onChange={(e) => setManualName(e.target.value)} />
              </div>
              <div>
                <label className="label text-xs">Amount (optional)</label>
                <input type="number" className="input text-sm" placeholder="0.00" step="0.01"
                  value={manualAmount} onChange={(e) => setManualAmount(e.target.value)} />
              </div>
              <button onClick={handleManualConfirm} className="btn-primary w-full justify-center py-2.5 mt-2">Confirm Details</button>
              <button onClick={() => setMode('choose')} className="btn-secondary w-full justify-center py-2 text-sm">← Back</button>
            </motion.div>
          ) : mode === 'camera' ? (
            <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <p className="text-sm text-[var(--text-muted)] mb-4">Point camera at the QR code...</p>
              <div id="qr-reader" className="rounded-xl overflow-hidden mx-auto" style={{ maxWidth: 300 }} />
              <button onClick={() => { if (scannerRef.current) scannerRef.current.stop().catch(() => {}); setMode('choose') }}
                className="btn-secondary w-full justify-center py-2 mt-4 text-sm">Cancel</button>
            </motion.div>
          ) : (
            <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <p className="text-sm text-[var(--text-muted)] mb-4">Choose how to scan the merchant's UPI QR code:</p>
              <button onClick={startCamera} className="w-full card p-4 flex items-center gap-3 hover:bg-[var(--bg-secondary)] transition-colors text-left">
                <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
                  <Camera size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Open Camera</p>
                  <p className="text-xs text-[var(--text-muted)]">Point at the QR code to auto-scan</p>
                </div>
              </button>
              <label className="w-full card p-4 flex items-center gap-3 hover:bg-[var(--bg-secondary)] transition-colors text-left cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shrink-0">
                  <Upload size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Upload QR Image</p>
                  <p className="text-xs text-[var(--text-muted)]">Select a screenshot or photo of a QR</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
              <button onClick={() => setMode('manual')} className="w-full card p-4 flex items-center gap-3 hover:bg-[var(--bg-secondary)] transition-colors text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                  <Type size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Enter Manually</p>
                  <p className="text-xs text-[var(--text-muted)]">Type the UPI ID directly</p>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="text-xs text-rose-500 mt-3 text-center">{error}</p>
        )}
      </motion.div>
    </div>
  )
}
