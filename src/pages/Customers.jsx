import { useState, useEffect } from 'react'
import { customersAPI } from '../services/api'
import { fmtCurrency, fmtDate } from '../utils/format'
import toast from 'react-hot-toast'
import {
  MdAdd, MdEdit, MdDelete, MdSearch, MdPerson,
  MdPhone, MdEmail, MdClose, MdHistory, MdBusiness
} from 'react-icons/md'

const EMPTY = {
  name: '', phone: '', email: '', address: '', city: '',
  state: '', pincode: '', gst_number: '', customer_type: 'regular',
  credit_limit: 0, notes: ''
}

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh'
]

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editCustomer, setEditCustomer] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [historyCustomer, setHistoryCustomer] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => { loadCustomers() }, [page, search])

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const r = await customersAPI.getAll({ page, per_page: 20, search })
      setCustomers(r.data.data.customers)
      setTotal(r.data.data.total)
      setPages(r.data.data.pages)
    } catch { toast.error('Failed to load customers') }
    finally { setLoading(false) }
  }

  const openAdd = () => { setForm(EMPTY); setEditCustomer(null); setShowModal(true) }
  const openEdit = (c) => { setForm({ ...EMPTY, ...c }); setEditCustomer(c); setShowModal(true) }

  const openHistory = async (c) => {
    setHistoryCustomer(c)
    setHistoryLoading(true)
    try {
      const r = await customersAPI.getInvoices(c._id, { per_page: 20 })
      setHistory(r.data.data.invoices)
    } catch { toast.error('Failed to load history') }
    finally { setHistoryLoading(false) }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name) return toast.error('Name is required')
    setSaving(true)
    try {
      if (editCustomer) {
        await customersAPI.update(editCustomer._id, form)
        toast.success('Customer updated')
      } else {
        await customersAPI.create(form)
        toast.success('Customer created')
      }
      setShowModal(false)
      loadCustomers()
    } catch (err) {
      const errs = err.response?.data?.errors
      toast.error(errs ? errs.join(', ') : err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer?')) return
    try {
      await customersAPI.delete(id)
      toast.success('Customer deleted')
      loadCustomers()
    } catch { toast.error('Delete failed') }
  }

  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const typeColor = { regular: 'badge-neutral', vip: 'badge-warning', wholesale: 'badge-info' }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Customer Management</h2>
          <p>{total} registered customers</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><MdAdd /> Add Customer</button>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div className="input-group" style={{ maxWidth: 400 }}>
          <MdSearch className="input-group-icon" />
          <input className="form-control" placeholder="Search by name, phone or email..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th><th>Contact</th><th>Location</th>
                <th>Type</th><th>Purchases</th><th>Outstanding</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state"><MdPerson size={36} /><h4>No customers found</h4></div>
                </td></tr>
              ) : customers.map(c => (
                <tr key={c._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'var(--primary-light)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, flexShrink: 0
                      }}>{c.name[0].toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{c.name}</div>
                        {c.gst_number && <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'Space Mono' }}>GST: {c.gst_number}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    {c.phone && <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}><MdPhone size={12} />{c.phone}</div>}
                    {c.email && <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}><MdEmail size={12} />{c.email}</div>}
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>{c.city}{c.city && c.state ? ', ' : ''}{c.state}</div>
                    {c.pincode && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.pincode}</div>}
                  </td>
                  <td><span className={`badge ${typeColor[c.customer_type] || 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>{c.customer_type}</span></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{fmtCurrency(c.total_amount_spent)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.total_purchases} orders</div>
                  </td>
                  <td>
                    {c.outstanding_balance > 0
                      ? <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{fmtCurrency(c.outstanding_balance)}</span>
                      : <span style={{ color: 'var(--success)' }}>Nil</span>}
                    {c.credit_limit > 0 && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Limit: {fmtCurrency(c.credit_limit)}</div>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Purchase History" onClick={() => openHistory(c)}><MdHistory /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => openEdit(c)}><MdEdit /></button>
                      <button className="btn btn-ghost btn-icon btn-sm text-danger" title="Delete" onClick={() => handleDelete(c._id)}><MdDelete /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex-between" style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Page {page} of {pages} • {total} customers</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <button className="btn btn-outline btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <span className="modal-title">{editCustomer ? 'Edit Customer' : 'Add New Customer'}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><MdClose /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Full Name *</label>
                    <input className="form-control" value={form.name} onChange={e => sf('name', e.target.value)} placeholder="Customer full name" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input className="form-control" value={form.phone} onChange={e => sf('phone', e.target.value)} placeholder="10-digit mobile number" maxLength={10} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-control" value={form.email} onChange={e => sf('email', e.target.value)} placeholder="email@example.com" />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Address</label>
                    <input className="form-control" value={form.address} onChange={e => sf('address', e.target.value)} placeholder="Street address" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-control" value={form.city} onChange={e => sf('city', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <select className="form-control" value={form.state} onChange={e => sf('state', e.target.value)}>
                      <option value="">Select State</option>
                      {STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">PIN Code</label>
                    <input className="form-control" value={form.pincode} onChange={e => sf('pincode', e.target.value)} maxLength={6} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GST Number</label>
                    <input className="form-control" value={form.gst_number} onChange={e => sf('gst_number', e.target.value.toUpperCase())} placeholder="29ABCDE1234F1Z5" maxLength={15} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Customer Type</label>
                    <select className="form-control" value={form.customer_type} onChange={e => sf('customer_type', e.target.value)}>
                      <option value="regular">Regular</option>
                      <option value="vip">VIP</option>
                      <option value="wholesale">Wholesale</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Credit Limit (₹)</label>
                    <input type="number" min="0" className="form-control" value={form.credit_limit} onChange={e => sf('credit_limit', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Notes</label>
                    <textarea className="form-control" rows={2} value={form.notes} onChange={e => sf('notes', e.target.value)} placeholder="Any additional notes..." />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editCustomer ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase History Modal */}
      {historyCustomer && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <div>
                <span className="modal-title">Purchase History — {historyCustomer.name}</span>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                  Total: {fmtCurrency(historyCustomer.total_amount_spent)} • {historyCustomer.total_purchases} orders
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setHistoryCustomer(null)}><MdClose /></button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              {historyLoading ? (
                <div className="flex-center" style={{ padding: 40 }}><div className="spinner" /></div>
              ) : history.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}>
                  <MdHistory size={36} /><h4>No purchases yet</h4>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Invoice#</th><th>Date</th><th>Items</th>
                      <th>Amount</th><th>Payment</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(inv => (
                      <tr key={inv._id}>
                        <td style={{ fontFamily: 'Space Mono', fontSize: 12 }}>{inv.invoice_number}</td>
                        <td>{fmtDate(inv.created_at)}</td>
                        <td>{inv.items?.length || 0} items</td>
                        <td style={{ fontWeight: 600 }}>{fmtCurrency(inv.grand_total)}</td>
                        <td><span className="badge badge-neutral">{inv.payment_method?.toUpperCase()}</span></td>
                        <td><span className={`badge ${inv.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{inv.payment_status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setHistoryCustomer(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
