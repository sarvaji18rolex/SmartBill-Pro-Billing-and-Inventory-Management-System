import { useState, useEffect } from 'react'
import { productsAPI } from '../services/api'
import { fmtCurrency, fmtDate } from '../utils/format'
import toast from 'react-hot-toast'
import { MdAdd, MdEdit, MdDelete, MdSearch, MdFilterList, MdInventory, MdClose } from 'react-icons/md'

const EMPTY_FORM = {
  name: '', category: '', sku: '', barcode: '', hsn_code: '', unit: 'pcs',
  description: '', purchase_price: '', selling_price: '', mrp: '',
  tax_rate: 18, stock_quantity: 0, min_stock_level: 10,
  reorder_quantity: 50, supplier: ''
}

export default function Inventory() {
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [lowStockFilter, setLowStockFilter] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [stockModal, setStockModal] = useState(null)
  const [stockAdj, setStockAdj] = useState(0)
  const [stockReason, setStockReason] = useState('')

  useEffect(() => { loadProducts() }, [page, search, catFilter, lowStockFilter])
  useEffect(() => {
    productsAPI.getCategories().then(r => setCategories(r.data.data))
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const r = await productsAPI.getAll({
        page, per_page: 20, search, category: catFilter,
        low_stock: lowStockFilter, active_only: true
      })
      setProducts(r.data.data.products)
      setTotal(r.data.data.total)
      setPages(r.data.data.pages)
    } catch { toast.error('Failed to load products') }
    finally { setLoading(false) }
  }

  const openAdd = () => { setForm(EMPTY_FORM); setEditProduct(null); setShowModal(true) }
  const openEdit = (p) => {
    setForm({ ...EMPTY_FORM, ...p })
    setEditProduct(p)
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name || !form.selling_price) return toast.error('Name and selling price required')
    setSaving(true)
    try {
      if (editProduct) {
        await productsAPI.update(editProduct._id, form)
        toast.success('Product updated')
      } else {
        await productsAPI.create(form)
        toast.success('Product created')
      }
      setShowModal(false)
      loadProducts()
      productsAPI.getCategories().then(r => setCategories(r.data.data))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    try {
      await productsAPI.delete(id)
      toast.success('Product deleted')
      loadProducts()
    } catch { toast.error('Delete failed') }
  }

  const handleStockAdjust = async () => {
    if (!stockAdj) return toast.error('Enter adjustment')
    try {
      await productsAPI.updateStock(stockModal._id, {
        adjustment: Number(stockAdj), reason: stockReason || 'Manual adjustment'
      })
      toast.success('Stock updated')
      setStockModal(null)
      setStockAdj(0)
      setStockReason('')
      loadProducts()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Inventory Management</h2>
          <p>{total} products • {products.filter(p => p.stock_quantity <= p.min_stock_level).length} low stock</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><MdAdd /> Add Product</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="input-group" style={{ flex: '1 1 220px', minWidth: 220 }}>
            <MdSearch className="input-group-icon" />
            <input className="form-control" placeholder="Search products..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <select className="form-control" style={{ width: 160 }}
            value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1) }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={lowStockFilter}
              onChange={e => { setLowStockFilter(e.target.checked); setPage(1) }} />
            Low Stock Only
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th><th>Category</th><th>SKU/Barcode</th>
                <th>Purchase</th><th>Selling</th><th>GST%</th>
                <th>Stock</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40 }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={9} className="empty-state"><MdInventory size={32} /><br />No products found</td></tr>
              ) : products.map(p => (
                <tr key={p._id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.hsn_code && `HSN: ${p.hsn_code}`}</div>
                  </td>
                  <td><span className="badge badge-neutral">{p.category}</span></td>
                  <td style={{ fontFamily: 'Space Mono', fontSize: 11 }}>
                    {p.sku && <div>{p.sku}</div>}
                    {p.barcode && <div style={{ color: 'var(--text-3)' }}>{p.barcode}</div>}
                  </td>
                  <td>{fmtCurrency(p.purchase_price)}</td>
                  <td style={{ fontWeight: 600 }}>{fmtCurrency(p.selling_price)}</td>
                  <td>{p.tax_rate}%</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => setStockModal(p)}
                      style={{ color: p.stock_quantity <= p.min_stock_level ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                      {p.stock_quantity} {p.unit}
                    </button>
                    {p.stock_quantity <= p.min_stock_level && (
                      <div style={{ fontSize: 10, color: 'var(--warning)' }}>⚠ Low</div>
                    )}
                  </td>
                  <td>
                    {p.stock_quantity === 0
                      ? <span className="badge badge-danger">Out of Stock</span>
                      : p.stock_quantity <= p.min_stock_level
                        ? <span className="badge badge-warning">Low Stock</span>
                        : <span className="badge badge-success">In Stock</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(p)} title="Edit"><MdEdit /></button>
                      <button className="btn btn-ghost btn-icon btn-sm text-danger" onClick={() => handleDelete(p._id)} title="Delete"><MdDelete /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex-between" style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Page {page} of {pages}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
              <button className="btn btn-outline btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <span className="modal-title">{editProduct ? 'Edit Product' : 'Add Product'}</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><MdClose /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Product Name *</label>
                    <input className="form-control" value={form.name} onChange={e => setField('name', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input className="form-control" list="cat-list" value={form.category} onChange={e => setField('category', e.target.value)} placeholder="e.g. Electronics" />
                    <datalist id="cat-list">{categories.map(c => <option key={c} value={c} />)}</datalist>
                  </div>
                  <div className="form-group">
                    <label className="form-label">SKU</label>
                    <input className="form-control" value={form.sku} onChange={e => setField('sku', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Barcode</label>
                    <input className="form-control" value={form.barcode} onChange={e => setField('barcode', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">HSN Code</label>
                    <input className="form-control" value={form.hsn_code} onChange={e => setField('hsn_code', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <select className="form-control" value={form.unit} onChange={e => setField('unit', e.target.value)}>
                      {['pcs','kg','g','ltr','ml','box','pack','dozen','bag','bottle','can','jar'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Purchase Price (₹)</label>
                    <input type="number" min="0" step="0.01" className="form-control" value={form.purchase_price} onChange={e => setField('purchase_price', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Selling Price (₹) *</label>
                    <input type="number" min="0" step="0.01" className="form-control" value={form.selling_price} onChange={e => setField('selling_price', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">MRP (₹)</label>
                    <input type="number" min="0" step="0.01" className="form-control" value={form.mrp} onChange={e => setField('mrp', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GST Rate (%)</label>
                    <select className="form-control" value={form.tax_rate} onChange={e => setField('tax_rate', e.target.value)}>
                      {[0,5,12,18,28].map(r => <option key={r} value={r}>{r}%</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock Quantity</label>
                    <input type="number" min="0" className="form-control" value={form.stock_quantity} onChange={e => setField('stock_quantity', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Min Stock Level</label>
                    <input type="number" min="0" className="form-control" value={form.min_stock_level} onChange={e => setField('min_stock_level', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reorder Quantity</label>
                    <input type="number" min="0" className="form-control" value={form.reorder_quantity} onChange={e => setField('reorder_quantity', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Supplier</label>
                    <input className="form-control" value={form.supplier} onChange={e => setField('supplier', e.target.value)} />
                  </div>
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={2} value={form.description} onChange={e => setField('description', e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editProduct ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {stockModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <span className="modal-title">Adjust Stock</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setStockModal(null)}><MdClose /></button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 16 }}>
                <strong>{stockModal.name}</strong><br />
                <span style={{ color: 'var(--text-2)', fontSize: 13 }}>Current stock: <strong>{stockModal.stock_quantity}</strong> {stockModal.unit}</span>
              </p>
              <div className="form-group">
                <label className="form-label">Adjustment (positive = add, negative = remove)</label>
                <input type="number" className="form-control" value={stockAdj} onChange={e => setStockAdj(e.target.value)} placeholder="e.g. 50 or -5" />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Reason</label>
                <input className="form-control" value={stockReason} onChange={e => setStockReason(e.target.value)} placeholder="e.g. Received new stock" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setStockModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleStockAdjust}>Update Stock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
