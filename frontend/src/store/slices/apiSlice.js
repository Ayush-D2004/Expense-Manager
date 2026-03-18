import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['Wallet', 'Transaction', 'Employee'],
  endpoints: (builder) => ({
    // Auth
    login: builder.mutation({
      query: (credentials) => ({
        url: '/api/auth/login',
        method: 'POST',
        body: new URLSearchParams({
          username: credentials.email,
          password: credentials.password,
        }),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    }),
    register: builder.mutation({
      query: (data) => ({ url: '/api/auth/register', method: 'POST', body: data }),
    }),

    // Wallet
    getBalance: builder.query({
      query: () => '/api/wallet/balance',
      providesTags: ['Wallet'],
    }),
    createSpend: builder.mutation({
      query: (data) => ({ url: '/api/wallet/spend', method: 'POST', body: data }),
      invalidatesTags: ['Transaction'],
    }),
    uploadProof: builder.mutation({
      query: ({ txnId, formData }) => ({
        url: `/api/wallet/proof/${txnId}`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Transaction', 'Wallet'],
    }),
    initiatePayment: builder.mutation({
      query: (txnId) => ({ url: `/api/wallet/pay/${txnId}`, method: 'POST' }),
    }),
    confirmPayment: builder.mutation({
      query: ({ txnId, razorpay_payment_id, razorpay_signature }) => ({
        url: `/api/wallet/pay/${txnId}/confirm`,
        method: 'POST',
        params: { razorpay_payment_id, razorpay_signature },
      }),
      invalidatesTags: ['Wallet', 'Transaction'],
    }),
    getMyTransactions: builder.query({
      query: () => '/api/wallet/my-transactions',
      providesTags: ['Transaction'],
    }),

    // Admin
    listEmployeeWallets: builder.query({
      query: () => '/api/admin/wallets',
      providesTags: ['Employee', 'Wallet'],
    }),
    setEmployeeLimit: builder.mutation({
      query: ({ userId, limit }) => ({
        url: `/api/admin/limit/${userId}`,
        method: 'POST',
        body: { limit },
      }),
      invalidatesTags: ['Employee', 'Wallet'],
    }),
    adminApprove: builder.mutation({
      query: (txnId) => ({ url: `/api/admin/approve/${txnId}`, method: 'POST' }),
      invalidatesTags: ['Transaction'],
    }),
    getAllTransactions: builder.query({
      query: (status) => ({
        url: '/api/admin/txns',
        params: status ? { status } : {},
      }),
      providesTags: ['Transaction'],
    }),
    getReports: builder.query({
      query: () => '/api/admin/reports',
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetBalanceQuery,
  useCreateSpendMutation,
  useUploadProofMutation,
  useInitiatePaymentMutation,
  useConfirmPaymentMutation,
  useGetMyTransactionsQuery,
  useListEmployeeWalletsQuery,
  useSetEmployeeLimitMutation,
  useAdminApproveMutation,
  useGetAllTransactionsQuery,
  useGetReportsQuery,
} = apiSlice
