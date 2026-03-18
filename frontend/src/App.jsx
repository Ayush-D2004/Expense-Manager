import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { initTheme } from './store/slices/themeSlice'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import AdminEmployees from './pages/AdminEmployees'
import AdminReports from './pages/AdminReports'
import AdminTransactions from './pages/AdminTransactions'
import NewSpend from './pages/NewSpend'
import UploadProof from './pages/UploadProof'
import PaymentPage from './pages/PaymentPage'
import TransactionHistory from './pages/TransactionHistory'

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user } = useSelector((s) => s.auth)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (adminOnly && user?.role !== 'ADMIN') return <Navigate to="/" replace />
  return children
}

export default function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(initTheme())
  }, [dispatch])

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'dark:bg-slate-800 dark:text-slate-100',
          duration: 4000,
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="history" element={<TransactionHistory />} />
          <Route path="spend/new" element={<ProtectedRoute><NewSpend /></ProtectedRoute>} />
          <Route path="proof/:txnId" element={<ProtectedRoute><UploadProof /></ProtectedRoute>} />
          <Route path="pay/:txnId" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
          <Route path="admin/employees" element={<ProtectedRoute adminOnly><AdminEmployees /></ProtectedRoute>} />
          <Route path="admin/reports" element={<ProtectedRoute adminOnly><AdminReports /></ProtectedRoute>} />
          <Route path="admin/txns" element={<ProtectedRoute adminOnly><AdminTransactions /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
