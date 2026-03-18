export default function StatusBadge({ status }) {
  const classes = {
    PENDING: 'badge-pending',
    APPROVED: 'badge-approved',
    REJECTED: 'badge-rejected',
    PAID: 'badge-paid',
    FLAGGED: 'badge-flagged',
  }
  return (
    <span className={classes[status] || 'badge bg-gray-100 text-gray-600'}>
      {status}
    </span>
  )
}
