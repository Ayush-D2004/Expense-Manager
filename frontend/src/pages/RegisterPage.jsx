import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useRegisterMutation } from '../store/slices/apiSlice'
import toast from 'react-hot-toast'
import { Building } from 'lucide-react'
import { motion } from 'framer-motion'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [register, { isLoading }] = useRegisterMutation()
  const [form, setForm] = useState({ name: '', owner_name: '', owner_email: '', owner_password: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await register(form).unwrap()
      toast.success('Company registered successfully! Please sign in.')
      navigate('/login')
    } catch (err) {
      const detail = err?.data?.detail
      toast.error(Array.isArray(detail) ? detail[0].msg : (detail || 'Registration failed'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)] py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="card p-8 shadow-lg">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center mb-4">
              <Building size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Register Company</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Set up your company's expense platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="company_name">Company Name</label>
              <input id="company_name" type="text" className="input" placeholder="Acme Corp"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label" htmlFor="owner_name">Your Name</label>
              <input id="owner_name" type="text" className="input" placeholder="John Doe"
                value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} required />
            </div>
            <div>
              <label className="label" htmlFor="reg-email">Work Email</label>
              <input id="reg-email" type="email" className="input" placeholder="you@company.com"
                value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} required autoComplete="email" />
            </div>
            <div>
              <label className="label" htmlFor="reg-password">Password</label>
              <input id="reg-password" type="password" className="input" placeholder="••••••••"
                value={form.owner_password} onChange={(e) => setForm({ ...form, owner_password: e.target.value })} required autoComplete="new-password" />
            </div>
            <button id="register-btn" type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-2.5 mt-2">
              {isLoading ? 'Creating account...' : 'Create Company'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
