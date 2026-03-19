import { useGetReportsQuery } from '../store/slices/apiSlice'
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'

const COLORS = ['#4f46e5', '#10b981', '#f43f5e', '#f59e0b', '#6366f1', '#8b5cf6', '#06b6d4']

function ChartCard({ title, children, span = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`card p-5 ${span}`}
    >
      <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{title}</h2>
      {children}
    </motion.div>
  )
}

const tooltipStyle = {
  backgroundColor: 'var(--bg-primary)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontSize: '12px',
}

export default function AdminReports() {
  const { data, isLoading } = useGetReportsQuery()

  if (isLoading) return <div className="p-8 text-center text-[var(--text-muted)]">Loading analytics...</div>

  const summary = data?.summary || {}
  const hasCategory = data?.by_category?.length > 0
  const hasMonthly = data?.by_month?.length > 0
  const hasEmployee = data?.by_employee?.length > 0

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
          <BarChart3 size={17} className="text-white" />
        </div>
        <h1 className="page-title">Reports & Analytics</h1>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { l: 'Total Paid', v: `₹${(summary.total_paid ?? 0).toFixed(2)}` },
          { l: 'Wallet Balance', v: `₹${(summary.wallet_balance ?? 0).toFixed(2)}` },
          { l: 'Pending', v: summary.pending_count ?? 0 },
          { l: 'Employees', v: summary.employee_count ?? 0 },
        ].map(({ l, v }) => (
          <div key={l} className="card p-4 text-center">
            <p className="text-xl font-bold text-[var(--text-primary)]">{v}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{l}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spend by Category (Pie) */}
        <ChartCard title="Spend by Category">
          {hasCategory ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.by_category} dataKey="total" nameKey="category"
                  cx="50%" cy="50%" outerRadius={95} innerRadius={50}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data.by_category.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => `₹${v.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-sm text-[var(--text-muted)]">No paid transactions yet</div>
          )}
        </ChartCard>

        {/* Monthly Trend (Line) */}
        <ChartCard title="Monthly Spend Trend">
          {hasMonthly ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.by_month} margin={{ left: 5, right: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(v) => `₹${v}`} width={60} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`₹${v.toFixed(2)}`, 'Total']} />
                <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }}
                  activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-sm text-[var(--text-muted)]">No data yet</div>
          )}
        </ChartCard>

        {/* Per-Employee Spend (Bar) */}
        <ChartCard title="Spend per Employee" span="lg:col-span-2">
          {hasEmployee ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.by_employee} margin={{ left: 5, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(v) => `₹${v}`} width={60} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`₹${v.toFixed(2)}`, 'Total Paid']} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {data.by_employee.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-sm text-[var(--text-muted)]">No employee spending yet</div>
          )}
        </ChartCard>
      </div>
    </div>
  )
}
