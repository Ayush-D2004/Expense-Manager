import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateSpendMutation } from '../store/slices/apiSlice'
import toast from 'react-hot-toast'
import { ArrowLeft, IndianRupee } from 'lucide-react'

const CATEGORIES = ['Office Supplies', 'Travel', 'Meals', 'Equipment', 'Software', 'Other']

export default function NewSpend() {
  const navigate = useNavigate()
  const [createSpend, { isLoading }] = useCreateSpendMutation()
  const [form, setForm] = useState({ amount: '', description: '', category: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const txn = await createSpend({
        amount: parseFloat(form.amount),
        description: form.description,
        category: form.category || null,
      }).unwrap()
      toast.success('Spend request created!')
      navigate(`/proof/${txn.id}`)
    } catch (err) {
      toast.error(err?.data?.detail || 'Failed to create spend')
    }
  }

  return (
    <div className="max-w-lg">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="page-title mb-1">New Expense</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">Submit a spend request. You'll need to upload a receipt next.</p>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label" htmlFor="amount">Amount (₹)</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <IndianRupee size={15} />
              </div>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                className="input pl-8"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="description">Description</label>
            <input
              id="description"
              type="text"
              className="input"
              placeholder="Office chair purchase"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="category">Category</label>
            <select id="category" className="input" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button id="submit-spend-btn" type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-2.5">
            {isLoading ? 'Submitting...' : 'Submit & Upload Proof →'}
          </button>
        </form>
      </div>
    </div>
  )
}
