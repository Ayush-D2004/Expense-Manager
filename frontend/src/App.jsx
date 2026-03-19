import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { initTheme } from './store/slices/themeSlice'
import Layout from './components/Layout'

// Public pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// App pages (all roles)
import Dashboard from './pages/Dashboard'
import TransactionHistory from './pages/TransactionHistory'
import NewSpend from './pages/NewSpend'
import UploadProof from './pages/UploadProof'
import PaymentPage from './pages/PaymentPage'
import SetupPin from './pages/SetupPin'

// Admin-only pages
import AdminEmployees from './pages/AdminEmployees'
import AdminTransactions from './pages/AdminTransactions'
import AdminReports from './pages/AdminReports'
import AdminTopUp from './pages/AdminTopUp'

function ProtectedRoute({ children, adminOnly = false }) {
  const { token, user } = useSelector((s) => s.auth)
  if (!token) return <Navigate to="/login" replace />
  if (adminOnly && user?.role !== 'ADMIN' && user?.role !== 'COMPANY') return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(initTheme())
  }, [])

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{ className: 'text-sm font-medium', duration: 3500 }}
      />
      <Routes>
        {/* ── Public ─────────────────────────────────── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ── Authenticated — all routes share one Layout ── */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute><Layout /></ProtectedRoute>}
        >
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<TransactionHistory />} />
          <Route path="spend/new" element={<NewSpend />} />
          <Route path="proof/:txnId" element={<UploadProof />} />
          <Route path="pay/:txnId" element={<PaymentPage />} />
          <Route path="setup-pin" element={<SetupPin />} />

          {/* Admin-only */}
          <Route path="admin/employees" element={<ProtectedRoute adminOnly><AdminEmployees /></ProtectedRoute>} />
          <Route path="admin/transactions" element={<ProtectedRoute adminOnly><AdminTransactions /></ProtectedRoute>} />
          <Route path="admin/reports" element={<ProtectedRoute adminOnly><AdminReports /></ProtectedRoute>} />
          <Route path="admin/topup" element={<ProtectedRoute adminOnly><AdminTopUp /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
