import { useGetReportsQuery } from '../store/slices/apiSlice'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { BarChart3 } from 'lucide-react'

const COLORS = ['#4f46e5', '#10b981', '#f43f5e', '#f59e0b', '#6366f1', '#8b5cf6']

export default function AdminReports() {
  const { data, isLoading } = useGetReportsQuery()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
          <BarChart3 size={17} className="text-white" />
        </div>
        <h1 className="page-title">Reports & Analytics</h1>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-[var(--text-muted)]">Loading analytics...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Spend by Category</h2>
            {data?.by_category?.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.by_category}
                    dataKey="total"
                    nameKey="category"
                    cx="50%" cy="50%"
                    outerRadius={100}
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.by_category.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-[var(--text-muted)]">No data yet</div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Monthly Spend Trend</h2>
            {data?.by_month?.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.by_month} margin={{ left: 10, right: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(v) => [`₹${v.toFixed(2)}`, 'Total']} />
                  <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 4, fill: '#4f46e5' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-[var(--text-muted)]">No data yet</div>
            )}
          </div>

          <div className="card p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Category Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Category</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Total Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {(data?.by_category || []).map((row, i) => (
                    <tr key={i} className="hover:bg-[var(--bg-secondary)]">
                      <td className="px-4 py-2.5 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        {row.category}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-[var(--text-primary)]">₹{row.total.toFixed(2)}</td>
                    </tr>
                  ))}
                  {!data?.by_category?.length && (
                    <tr><td colSpan={2} className="px-4 py-8 text-center text-[var(--text-muted)] text-sm">No paid transactions yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
