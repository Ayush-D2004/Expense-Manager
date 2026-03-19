import { useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Brain, Wallet, BarChart3, ShieldCheck, ArrowRight, Zap } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Verification',
    desc: 'Gemini Vision AI scans receipts and cross-checks amount, vendor, and context in seconds.',
    color: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
  },
  {
    icon: Wallet,
    title: 'Internal UPI Payments',
    desc: 'Employees pay directly from the company wallet using a secure personal UPI PIN — no personal bank account needed.',
    color: 'text-brand-600',
    bg: 'bg-brand-50 dark:bg-brand-900/20',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    desc: 'Live dashboards show spend trends by category, employee, and month — always up to date.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  {
    icon: ShieldCheck,
    title: 'RBAC & JWT Security',
    desc: 'Role-based access control keeps employee and admin surfaces completely separate.',
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
  },
  {
    icon: Zap,
    title: 'Instant Notifications',
    desc: 'WebSocket sync means approvals, payments, and limit changes reflect instantly — no refresh required.',
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
  },
  {
    icon: ShieldCheck,
    title: 'Smart Spend Limits',
    desc: 'Admin sets per-employee limits. Over-limit requests get routed to admin for explicit approval.',
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
  },
]

const steps = [
  { n: '01', title: 'Submit Expense', desc: 'Employee submits spend amount and description from their dashboard.' },
  { n: '02', title: 'Upload & Verify', desc: 'Upload a receipt photo — Gemini AI verifies it within seconds.' },
  { n: '03', title: 'Pay via UPI PIN', desc: 'Enter your private UPI PIN to authorise payment from the company wallet.' },
]

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

export default function LandingPage() {
  const navigate = useNavigate()
  const { token } = useSelector((s) => s.auth)

  if (token) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* ─── Navbar ──────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Wallet size={16} className="text-white" />
            </div>
            <span className="font-bold text-[var(--text-primary)] text-sm tracking-tight">ExpenseManager</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="btn-secondary py-2 text-sm">Sign In</button>
            <button onClick={() => navigate('/register')} className="btn-primary py-2 text-sm">Get Started</button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Gradient blobs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500 opacity-[0.08] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 -left-40 w-96 h-96 bg-indigo-500 opacity-[0.06] rounded-full blur-3xl pointer-events-none" />

        <motion.div
          variants={containerVariants} initial="hidden" animate="show"
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div variants={itemVariants}>
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-brand-600 bg-brand-50 dark:bg-brand-900/30 px-3 py-1.5 rounded-full mb-6">
              <Zap size={12} /> AI-Powered · UPI Wallet · Real-Time
            </span>
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-5xl sm:text-6xl font-extrabold text-[var(--text-primary)] leading-tight mb-6">
            Company expenses,{' '}
            <span className="bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent">
              finally intelligent
            </span>
          </motion.h1>
          <motion.p variants={itemVariants} className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-verified receipts, internal UPI wallet payments, and real-time spend dashboards — all in one platform built for modern SMBs.
          </motion.p>
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('/register')} className="btn-primary px-8 py-3 text-base gap-2">
              Get Started Free <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate('/login')} className="btn-secondary px-8 py-3 text-base">
              Sign In
            </button>
          </motion.div>
        </motion.div>

        {/* Floating stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="max-w-3xl mx-auto mt-16 grid grid-cols-3 gap-4"
        >
          {[
            { v: '< 3s', l: 'AI Verification' },
            { v: '₹0', l: 'Transaction Fees' },
            { v: '100%', l: 'Traceable Spend' },
          ].map(({ v, l }) => (
            <div key={l} className="card p-5 text-center">
              <p className="text-2xl font-extrabold text-[var(--text-primary)]">{v}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{l}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ─── Features ────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-3">Everything you need</h2>
            <p className="text-[var(--text-muted)]">A complete expense stack built on modern technology.</p>
          </div>
          <motion.div
            variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map(({ icon: Icon, title, desc, color, bg }) => (
              <motion.div key={title} variants={itemVariants} className="card p-6 group hover:shadow-lg transition-shadow duration-300">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                  <Icon size={20} className={color} />
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-3">How it works</h2>
            <p className="text-[var(--text-muted)]">Three steps from expense to paid.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {steps.map(({ n, title, desc }, i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative text-center"
              >
                <div className="text-6xl font-black text-[var(--border)] mb-4">{n}</div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
                <p className="text-sm text-[var(--text-muted)]">{desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-8 right-0 translate-x-1/2 text-[var(--border)]">
                    <ArrowRight size={20} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-[var(--bg-secondary)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Ready to modernise your expense workflow?</h2>
          <p className="text-[var(--text-muted)] mb-8">Create your company account and onboard your team in minutes.</p>
          <button onClick={() => navigate('/register')} className="btn-primary px-10 py-3.5 text-base gap-2">
            Get Started Free <ArrowRight size={18} />
          </button>
        </motion.div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-[var(--border)] text-center">
        <p className="text-sm text-[var(--text-muted)]">
          © 2025 ExpenseManager · Built for SMBs · AI by Gemini · Payments by Razorpay
        </p>
      </footer>
    </div>
  )
}
