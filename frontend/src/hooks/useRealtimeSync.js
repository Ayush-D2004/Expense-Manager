import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { useSelector } from 'react-redux'
import { apiSlice } from '../store/slices/apiSlice'
import toast from 'react-hot-toast'

const WS_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000')
  .replace(/^http/, 'ws')

export default function useRealtimeSync() {
  const dispatch = useDispatch()
  const { token, user } = useSelector((s) => s.auth)
  const wsRef = useRef(null)

  useEffect(() => {
    if (!token) return

    const connect = () => {
      const ws = new WebSocket(`${WS_BASE}/ws/txns?token=${token}`)
      wsRef.current = ws

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data)
          switch (msg.type) {
            case 'TXN_UPDATED':
            case 'TXN_PAID':
              dispatch(apiSlice.util.invalidateTags(['Transaction', 'Wallet', 'Report']))
              break
            case 'WALLET_UPDATED':
              dispatch(apiSlice.util.invalidateTags(['Wallet', 'Report']))
              break
            case 'OVER_LIMIT_REQUEST':
              if (user?.role === 'ADMIN')
                toast(`⚠️ ${msg.payload.name} sent an over-limit spend request of ₹${msg.payload.amount}`)
              dispatch(apiSlice.util.invalidateTags(['Transaction']))
              break
            case 'PIN_CHANGE_REQUESTED':
              if (user?.role === 'ADMIN')
                toast(`🔑 ${msg.payload.name} requested a PIN change`)
              break
            case 'PIN_CHANGE_APPROVED':
              if (user?.id === msg.payload.user_id)
                toast.success('Admin approved your PIN change. You can now set a new PIN.')
              dispatch(apiSlice.util.invalidateTags(['Wallet']))
              break
          }
        } catch (_) { /* ignore malformed messages */ }
      }

      ws.onclose = () => {
        // Reconnect after 3s if still authenticated
        setTimeout(() => {
          if (token) connect()
        }, 3000)
      }
    }

    connect()
    return () => wsRef.current?.close()
  }, [token]) // eslint-disable-line
}
