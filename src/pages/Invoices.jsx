import { useState, useEffect } from 'react'
import { invoicesAPI } from '../services/api'
import { fmtCurrency, fmtDateTime } from '../utils/format'
import toast from 'react-hot-toast'
import {
  MdSearch, MdPictureAsPdf, MdPrint, MdCancel,
  MdReceipt, MdVisibility, MdClose, MdFilterList
} from 'react-icons/md'

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [payStatus, setPayStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewInvoice, setViewInvoice] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(null)

  useEffect(() => { loadInvoices() }, [page, search, dateFrom, dateTo, payStatus])

  const loadInvoices = async () => {
    setLoading(true)
    try {
      const r = await invoicesAPI.getAll({ page, per_page: 20, search, date_from: dateFrom, date_to: dateTo, payment_status: payStatus })
      setInvoices(r.data.data.invoices)
      setTotal(r.data.data.total)
      setPages(r.data.data.pages)
    } catch { toast.error('Failed to load invoices') }
    finally { setLoading(false) }
  }

  const handleCancel = async (id) => {
    if (!confirm('Cancel this invoice? Stock will be restored.')) return
    try {
      await invoicesAPI.cancel(id)
      toast.success('Invoice cancelled')
      loadInvoices()
    } catch (err) { toast.error(err.response?.data?.message || 'Cancel failed') }
  }

  const downloadPDF = async (inv) => {
    setPdfLoading(inv._id)
    try {
      const r = await invoicesAPI.downloadPDF(inv._id)
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url; a.download = `${inv.invoice_number}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('PDF download failed') }
    finally { setPdfLoading(null) }
  }

  const printInvoice = (inv) => {
    const w = window.open('', '_blank')
    const rows = inv.items?.map((item, i) => `
      <tr>
        <td>${i + 1}</td><td>${item.product_name}</td>
        <td>${item.hsn_code || '-'}</td><td>${item.quantity} ${item.unit}</td>
        <td>₹${Number(item.unit_price).toFixed(2)}</td>
        <td>${item.tax_rate}%</td>
        <td>₹${Number(item.subtotal).toFixed(2)}</td>
      </tr>`).join('') || ''
    w.document.write(`<!DOCTYPE html><html><head><title>${inv.invoice_number}</title>
      <style>body{font-family:Arial;font-size:12px;padding:20px}
      h2{text-align:center;color:#1a237e}table{width:100%;border-collapse:collapse;margin:12px 0}
      th{background:#1a237e;color:#fff;padding:8px}td{padding:7px;border-bottom:1px solid #eee}
      .tot{text-align:right;padding:3px 0}.grand{font-size:15px;font-weight:bold}
      @media print{button{display:none}}</style></head><body>
      <h2>TAX INVOICE</h2>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <div><b>Invoice#:</b> ${inv.invoice_number}<br><b>Date:</b> ${new Date(inv.created_at).toLocaleDateString('en-IN')}</div>
        <div><b>Customer:</b> ${inv.customer_name}<br><b>Phone:</b> ${inv.customer_phone || '-'}</div>
      </div>
      <table><thead><tr><th>#</th><th>Product</th><th>HSN</th><th>Qty</th><th>Rate</th><th>GST%</th><th>Amount</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="tot">Subtotal: ₹${Number(inv.subtotal).toFixed(2)}</div>
      <div class="tot">Discount: ₹${Number(inv.discount_amount).toFixed(2)}</div>
      <div class="tot">CGST: ₹${Number(inv.cgst).toFixed(2)}</div>
      <div class="tot">SGST: ₹${Number(inv.sgst).toFixed(2)}</div>
      <div class="tot grand">Grand Total: ₹${Number(inv.grand_total).toFixed(2)}</div>
      <script>window.onload=()=>window.print()</script></body></html>`)
    w.document.close()
  }

  return (
    <div>
      <div className="page-header">
        <div><h2>Invoices</h2><p>{total} total invoices</p></div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="input-group" style={{ flex: '1 1 220px' }}>
            <MdSearch className="input-group-icon" />
            <input className="form-control" placeholder="Invoice#, customer name or phone..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>From:</label>
            <input type="date" className="form-control" style={{ width: 150 }}
              value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>To:</label>
            <input type="date" className="form-control" style={{ width: 150 }}
              value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} />
          </div>
          <select className="form-control" style={{ width: 140 }}
            value={payStatus} onChange={e => { setPayStatus(e.target.value); setPage(1) }}>
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
          </select>
          {(search || dateFrom || dateTo || payStatus) && (
            <button className="btn btn-outline btn-sm" onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setPayStatus(''); setPage(1) }}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice#</th><th>Customer</th><th>Date & Time</th>
                <th>Items</th><th>GST</th><th>Total</th>
                <th>Payment</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40 }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={9}>
                  <div className="empty-state" style={{ padding: 40 }}>
                    <MdReceipt size={36} /><h4>No invoices found</h4>
                  </div>
                </td></tr>
              ) : invoices.map(inv => (
                <tr key={inv._id} style={{ opacity: inv.status === 'cancelled' ? 0.5 : 1 }}>
                  <td>
                    <span style={{ fontFamily: 'Space Mono', fontSize: 12, color: 'var(--primary-light)', fontWeight: 600 }}>
                      {inv.invoice_number}
                    </span>
                    {inv.status === 'cancelled' && <div style={{ fontSize: 10 }}><span className="badge badge-danger">CANCELLED</span></div>}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{inv.customer_name}</div>
                    {inv.customer_phone && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{inv.customer_phone}</div>}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{fmtDateTime(inv.created_at)}</td>
                  <td>{inv.items?.length || 0} items</td>
                  <td>{fmtCurrency((inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0))}</td>
                  <td style={{ fontWeight: 700, fontFamily: 'Space Mono', fontSize: 13 }}>{fmtCurrency(inv.grand_total)}</td>
                  <td><span className="badge badge-neutral">{inv.payment_method?.toUpperCase()}</span></td>
                  <td>
                    <span className={`badge ${inv.payment_status === 'paid' ? 'badge-success' : inv.payment_status === 'pending' ? 'badge-danger' : 'badge-warning'}`}>
                      {inv.payment_status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" title="View" onClick={() => setViewInvoice(inv)}><MdVisibility /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Print" onClick={() => printInvoice(inv)}><MdPrint /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Download PDF"
                        disabled={pdfLoading === inv._id} onClick={() => downloadPDF(inv)}>
                        {pdfLoading === inv._id ? '...' : <MdPictureAsPdf />}
                      </button>
                      {inv.status !== 'cancelled' && (
                        <button className="btn btn-ghost btn-icon btn-sm text-danger" title="Cancel" onClick={() => handleCancel(inv._id)}><MdCancel /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex-between" style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Page {page} of {pages} • {total} invoices</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <button className="btn btn-outline btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* View Invoice Modal */}
      {viewInvoice && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <div>
                <span className="modal-title">Invoice Details</span>
                <div style={{ fontSize: 12, color: 'var(--primary-light)', fontFamily: 'Space Mono', marginTop: 2 }}>{viewInvoice.invoice_number}</div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setViewInvoice(null)}><MdClose /></button>
            </div>
            <div className="modal-body">
              {/* Header info */}
              <div className="grid-2" style={{ marginBottom: 20 }}>
                <div style={{ padding: 16, background: 'var(--surface-2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>Invoice Info</div>
                  <div style={{ fontSize: 13 }}>Invoice#: <strong style={{ fontFamily: 'Space Mono' }}>{viewInvoice.invoice_number}</strong></div>
                  <div style={{ fontSize: 13 }}>Date: <strong>{fmtDateTime(viewInvoice.created_at)}</strong></div>
                  <div style={{ fontSize: 13 }}>Payment: <strong>{viewInvoice.payment_method?.toUpperCase()}</strong></div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>
                    Status: <span className={`badge ${viewInvoice.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{viewInvoice.payment_status}</span>
                  </div>
                </div>
                <div style={{ padding: 16, background: 'var(--surface-2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>Customer</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{viewInvoice.customer_name}</div>
                  {viewInvoice.customer_phone && <div style={{ fontSize: 13 }}>📞 {viewInvoice.customer_phone}</div>}
                  {viewInvoice.customer_address && <div style={{ fontSize: 13 }}>📍 {viewInvoice.customer_address}</div>}
                  {viewInvoice.customer_gst && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>GSTIN: {viewInvoice.customer_gst}</div>}
                </div>
              </div>

              {/* Items */}
              <table style={{ marginBottom: 16 }}>
                <thead>
                  <tr><th>#</th><th>Product</th><th>HSN</th><th>Qty</th><th>Rate</th><th>GST%</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  {viewInvoice.items?.map((item, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{item.product_name}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{item.hsn_code || '-'}</td>
                      <td>{item.quantity} {item.unit}</td>
                      <td>{fmtCurrency(item.unit_price)}</td>
                      <td>{item.tax_rate}%</td>
                      <td style={{ fontWeight: 600 }}>{fmtCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ maxWidth: 280, marginLeft: 'auto' }}>
                {[
                  ['Subtotal', fmtCurrency(viewInvoice.subtotal)],
                  viewInvoice.discount_amount > 0 ? ['Discount', `− ${fmtCurrency(viewInvoice.discount_amount)}`] : null,
                  ['CGST', fmtCurrency(viewInvoice.cgst)],
                  ['SGST', fmtCurrency(viewInvoice.sgst)],
                  viewInvoice.igst > 0 ? ['IGST', fmtCurrency(viewInvoice.igst)] : null,
                ].filter(Boolean).map(([k, v]) => (
                  <div key={k} className="flex-between" style={{ padding: '4px 0', fontSize: 13, color: 'var(--text-2)' }}>
                    <span>{k}</span><span>{v}</span>
                  </div>
                ))}
                <div className="flex-between" style={{ padding: '10px 0 0', borderTop: '2px solid var(--primary-light)', fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>
                  <span>Grand Total</span><span style={{ fontFamily: 'Space Mono' }}>{fmtCurrency(viewInvoice.grand_total)}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => printInvoice(viewInvoice)}><MdPrint /> Print</button>
              <button className="btn btn-primary" onClick={() => downloadPDF(viewInvoice)}><MdPictureAsPdf /> PDF</button>
              <button className="btn btn-ghost" onClick={() => setViewInvoice(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
