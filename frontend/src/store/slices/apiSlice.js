import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token
      if (token) headers.set('authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['Wallet', 'Transaction', 'Report'],
  endpoints: (builder) => ({
    // ─── Auth ───────────────────────────────────────────────────────────────
    login: builder.mutation({
      query: (credentials) => {
        const formData = new URLSearchParams()
        formData.append('username', credentials.email)
        formData.append('password', credentials.password)
        return {
          url: '/api/auth/login',
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      },
    }),
    register: builder.mutation({
      query: (data) => ({
        url: '/api/auth/register',
        method: 'POST',
        body: data,
      }),
    }),

    // ─── Health / Auth / Employee Wallet ────────────────────────────────────
    getHealth: builder.query({
      query: () => '/api/health',
    }),
    getBalance: builder.query({
      query: () => '/api/wallet/balance',
      providesTags: ['Wallet'],
    }),
    createSpend: builder.mutation({
      query: (data) => ({ url: '/api/wallet/spend', method: 'POST', body: data }),
      invalidatesTags: ['Transaction', 'Wallet'],
    }),
    uploadProof: builder.mutation({
      query: ({ txnId, formData }) => ({
        url: `/api/wallet/proof/${txnId}`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Transaction'],
    }),
    skipProof: builder.mutation({
      query: (txnId) => ({
        url: `/api/wallet/skip-proof/${txnId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Transaction'],
    }),
    setupPin: builder.mutation({
      query: (data) => ({ url: '/api/wallet/setup-pin', method: 'POST', body: data }),
      invalidatesTags: ['Wallet'],
    }),
    requestPinChange: builder.mutation({
      query: () => ({ url: '/api/wallet/request-pin-change', method: 'POST' }),
      invalidatesTags: ['Wallet'],
    }),
    setDob: builder.mutation({
      query: (data) => ({ url: '/api/wallet/set-dob', method: 'POST', body: data }),
      invalidatesTags: ['Wallet'],
    }),
    payWithPin: builder.mutation({
      query: ({ txnId, upi_pin }) => ({
        url: `/api/wallet/pay/${txnId}`,
        method: 'POST',
        body: { upi_pin },
      }),
      invalidatesTags: ['Transaction', 'Wallet'],
    }),
    getMyTransactions: builder.query({
      query: () => '/api/wallet/my-transactions',
      providesTags: ['Transaction'],
    }),

    // ─── Company ────────────────────────────────────────────────────────────
    createEmployee: builder.mutation({
      query: (data) => ({ url: '/api/company/employees', method: 'POST', body: data }),
      invalidatesTags: ['Wallet', 'Report'], // Invalidating to refresh employee lists somewhere
    }),
    getEmployees: builder.query({
      query: () => '/api/company/employees',
      providesTags: ['Wallet'],
    }),
    changeEmployeeRole: builder.mutation({
      query: ({ userId, role }) => ({
        url: `/api/company/employees/${userId}/role`,
        method: 'PUT',
        body: { role },
      }),
      invalidatesTags: ['Wallet'],
    }),

    // ─── Admin ──────────────────────────────────────────────────────────────
    listEmployeeWallets: builder.query({
      query: () => '/api/admin/wallets',
      providesTags: ['Wallet'],
    }),
    setEmployeeLimit: builder.mutation({
      query: ({ userId, limit }) => ({
        url: `/api/admin/limit/${userId}`,
        method: 'POST',
        body: { limit },
      }),
      invalidatesTags: ['Wallet'],
    }),
    adminApprove: builder.mutation({
      query: (txnId) => ({ url: `/api/admin/approve/${txnId}`, method: 'POST' }),
      invalidatesTags: ['Transaction', 'Wallet'],
    }),
    adminReject: builder.mutation({
      query: (txnId) => ({ url: `/api/admin/reject/${txnId}`, method: 'POST' }),
      invalidatesTags: ['Transaction'],
    }),
    approvePinChange: builder.mutation({
      query: (userId) => ({ url: `/api/admin/approve-pin-change/${userId}`, method: 'POST' }),
      invalidatesTags: ['Wallet'],
    }),
    getAllTransactions: builder.query({
      query: (status) => status ? `/api/admin/txns?status=${status}` : '/api/admin/txns',
      providesTags: ['Transaction'],
    }),
    getReports: builder.query({
      query: () => '/api/admin/reports',
      providesTags: ['Report'],
    }),
    initiateTopUp: builder.mutation({
      query: (amount) => ({ url: '/api/admin/topup', method: 'POST', body: { limit: amount } }),
    }),
    directTopUp: builder.mutation({
      query: (amount) => ({ url: '/api/admin/topup/direct', method: 'POST', body: { limit: amount } }),
      invalidatesTags: ['Wallet', 'Report'],
    }),
    confirmTopUp: builder.mutation({
      query: (data) => ({
        url: `/api/admin/topup/confirm?order_id=${data.order_id}&payment_id=${data.payment_id}&signature=${data.signature}&amount=${data.amount}`,
        method: 'POST',
      }),
      invalidatesTags: ['Wallet', 'Report'],
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetHealthQuery,
  useGetBalanceQuery,
  useCreateSpendMutation,
  useUploadProofMutation,
  useSetupPinMutation,
  useRequestPinChangeMutation,
  usePayWithPinMutation,
  useGetMyTransactionsQuery,
  useListEmployeeWalletsQuery,
  useSetEmployeeLimitMutation,
  useAdminApproveMutation,
  useAdminRejectMutation,
  useApprovePinChangeMutation,
  useGetAllTransactionsQuery,
  useGetReportsQuery,
  useInitiateTopUpMutation,
  useConfirmTopUpMutation,
  useCreateEmployeeMutation,
  useGetEmployeesQuery,
  useChangeEmployeeRoleMutation,
  useSkipProofMutation,
  useDirectTopUpMutation,
  useSetDobMutation,
} = apiSlice
