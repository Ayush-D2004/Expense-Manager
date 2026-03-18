import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useRegisterMutation } from '../store/slices/apiSlice'
import toast from 'react-hot-toast'
import { Wallet } from 'lucide-react'
import { motion } from 'framer-motion'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [register, { isLoading }] = useRegisterMutation()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'EMPLOYEE' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await register(form).unwrap()
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err) {
      toast.error(err?.data?.detail || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)] px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="card p-8 shadow-lg">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center mb-4">
              <Wallet size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Create account</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">Join your company's expense platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <input id="name" type="text" className="input" placeholder="Ayush Sharma"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label" htmlFor="reg-email">Email</label>
              <input id="reg-email" type="email" className="input" placeholder="you@company.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label" htmlFor="reg-password">Password</label>
              <input id="reg-password" type="password" className="input" placeholder="••••••••"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div>
              <label className="label" htmlFor="role">Role</label>
              <select id="role" className="input" value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button id="register-btn" type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-2.5">
              {isLoading ? 'Creating account...' : 'Create account'}
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
