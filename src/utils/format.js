export const fmtCurrency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n ?? 0)

export const fmtNumber = (n) =>
  new Intl.NumberFormat('en-IN').format(n ?? 0)

export const fmtDate = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const fmtDateTime = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export const paymentLabel = (method) => ({
  cash: 'Cash', card: 'Card', upi: 'UPI', credit: 'Credit', cheque: 'Cheque', bank_transfer: 'Bank Transfer'
})[method] || method
