import { useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Brain, Wallet, BarChart3, ShieldCheck, ArrowRight, Zap } from 'lucide-react'
import { useGetHealthQuery } from '../store/slices/apiSlice'

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
  const { isSuccess: serverReady, isError: serverError, refetch, isFetching } = useGetHealthQuery(undefined, { pollingInterval: 30000 })

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
          <div className="flex items-center gap-4">
            {/* Connection Status Badge (Click to refresh) */}
            <button 
              onClick={() => refetch()}
              disabled={isFetching}
              title="Click to manually refresh connection status"
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                isFetching ? 'opacity-75 cursor-wait' : 'hover:scale-105 cursor-pointer'
              } ${
              serverReady 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                : serverError
                ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
            }`}>
              {isFetching ? (
                <><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Pinging...</>
              ) : serverReady ? (
                <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_theme(colors.emerald.500)]" /> Backend Connected</>
              ) : serverError ? (
                <><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Backend Disconnected</>
              ) : (
                <><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Waking Server (~1m)</>
              )}
            </button>

            <button className="btn-primary py-2 text-sm"><a href='https://github.com/Ayush-D2004/Expense-Manager'>GitHub</a></button>
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
              Register Company <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate('/login')} className="btn-secondary px-8 py-3 text-base">
              Employee Sign In
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

      {/* ─── Visual Architecture Diagram ─────────────────────────── */}
      <section className="py-24 px-6 overflow-hidden relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-[var(--text-primary)] mb-4">How it works</h2>
            <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
              A unified central wallet powers your entire team. Admins control the funds, and employees spend securely with their own UPI PINs after AI verification.
            </p>
          </div>

          <div className="relative p-6 sm:p-10 bg-slate-900 dark:bg-black border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-500/20 blur-[100px] pointer-events-none rounded-full" />
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full" />

            {/* Top Row: Admin Portal */}
            <div className="relative flex flex-col items-center mb-8 z-10">
              <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-5 rounded-2xl w-full max-w-sm text-center shadow-xl">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck size={24} className="text-indigo-400" />
                </div>
                <h3 className="text-white font-bold text-lg">Company Dashboard</h3>
                <p className="text-slate-400 text-sm mt-1">Admin funds wallet via Razorpay &amp; sets limits</p>
              </div>
              
              {/* Down Arrow */}
              <div className="h-10 w-px bg-gradient-to-b from-indigo-500/50 to-brand-500 my-2 shadow-[0_0_15px_rgba(79,70,229,0.5)]"></div>
              <ArrowRight size={20} className="text-brand-400 rotate-90 -mt-3 relative z-10" />
            </div>

            {/* Middle: Central Wallet */}
            <div className="relative flex flex-col items-center mb-10 z-10">
              <div className="bg-gradient-to-br from-brand-600 to-indigo-600 p-[2px] rounded-3xl w-full max-w-md shadow-2xl shadow-brand-500/20 ring-4 ring-brand-500/10">
                <div className="bg-slate-900 rounded-[22px] p-6 text-center h-full">
                  <div className="w-14 h-14 bg-brand-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-500/30">
                    <Wallet size={28} className="text-brand-400" />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Digital Expense Wallet</h2>
                  <p className="text-brand-200 mt-2 text-sm font-medium">Shared Company Pool</p>
                </div>
              </div>
            </div>

            {/* Branching paths to Employee */}
            <div className="relative z-10">
              {/* Connector lines (Desktop) */}
              <div className="hidden sm:block absolute top-0 left-1/2 w-3/4 max-w-md h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent -translate-x-1/2"></div>
              <div className="hidden sm:block absolute top-0 left-1/4 h-6 w-px bg-gradient-to-b from-brand-500/50 to-transparent"></div>
              <div className="hidden sm:block absolute top-0 right-1/4 h-6 w-px bg-gradient-to-b from-brand-500/50 to-transparent"></div>
              <div className="hidden sm:block absolute top-0 left-1/2 h-6 w-px bg-gradient-to-b from-brand-500/50 to-transparent"></div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 sm:pt-6">
                
                {/* Step 1 */}
                <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-2xl text-center relative hover:bg-slate-800 transition-colors">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-slate-700 text-white text-sm font-bold flex items-center justify-center rounded-full border border-slate-600 shadow-lg">1</div>
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <BarChart3 size={20} className="text-emerald-400" />
                  </div>
                  <h4 className="text-slate-200 font-semibold mb-1">Submit Request</h4>
                  <p className="text-slate-400 text-xs">Employee logs expense amount and category.</p>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-2xl text-center relative hover:bg-slate-800 transition-colors">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-slate-700 text-white text-sm font-bold flex items-center justify-center rounded-full border border-slate-600 shadow-lg">2</div>
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Brain size={20} className="text-amber-400" />
                  </div>
                  <h4 className="text-slate-200 font-semibold mb-1">AI Verification</h4>
                  <p className="text-slate-400 text-xs">Gemini verifies the receipt photo matches the spend.</p>
                </div>

                {/* Step 3 */}
                <div className="bg-brand-900/30 border border-brand-500/30 p-5 rounded-2xl text-center relative shadow-[0_0_20px_rgba(79,70,229,0.1)]">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-brand-600 text-white text-sm font-bold flex items-center justify-center rounded-full shadow-lg shadow-brand-500/40">3</div>
                  <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Zap size={20} className="text-brand-400" />
                  </div>
                  <h4 className="text-white font-semibold mb-1">Pay via UPI</h4>
                  <p className="text-brand-200/70 text-xs">Employee enters PIN, payment pulls from Central Wallet.</p>
                </div>

              </div>
            </div>
            
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
            Register Company <ArrowRight size={18} />
          </button>
        </motion.div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-[var(--border)] text-center">
        <p className="text-sm text-[var(--text-muted)]">
          Project by <a href='https://www.linkedin.com/in/ayush-dhoble-7363b2290/'>Ayush Dhoble</a> | <a href='https://github.com/Ayush-D2004'>Github</a>
        </p>
      </footer>
    </div>
  )
}
