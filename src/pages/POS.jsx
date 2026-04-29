import { useState, useEffect, useRef, useCallback } from 'react'
import { productsAPI, customersAPI, invoicesAPI } from '../services/api'
import { fmtCurrency } from '../utils/format'
import toast from 'react-hot-toast'
import {
  MdSearch, MdAdd, MdRemove, MdDelete, MdPrint,
  MdPictureAsPdf, MdPerson, MdQrCodeScanner, MdShoppingCart, MdClose
} from 'react-icons/md'

export default function POS() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState(['All'])
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [customer, setCustomer] = useState(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState([])
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [loading, setLoading] = useState(false)
  const [lastInvoice, setLastInvoice] = useState(null)
  const searchRef = useRef()
  const barcodeRef = useRef()

  useEffect(() => {
    loadProducts()
    productsAPI.getCategories().then(r => setCategories(['All', ...r.data.data]))
  }, [])

  const loadProducts = async () => {
    try {
      const r = await productsAPI.getAll({ per_page: 200, active_only: true })
      setProducts(r.data.data.products)
    } catch { toast.error('Failed to load products') }
  }

  const filteredProducts = products.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.includes(search)
    return matchCat && matchSearch
  })

  const handleBarcodeSearch = async (e) => {
    if (e.key === 'Enter' && search) {
      try {
        const r = await productsAPI.getByBarcode(search)
        addToCart(r.data.data)
        setSearch('')
      } catch {
        toast.error('Product not found for barcode: ' + search)
      }
    }
  }

  const addToCart = (product) => {
    if (product.stock_quantity <= 0) return toast.error('Out of stock!')
    setCart(prev => {
      const existing = prev.find(i => i._id === product._id)
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          toast.error(`Only ${product.stock_quantity} in stock`)
          return prev
        }
        return prev.map(i => i._id === product._id
          ? { ...i, quantity: i.quantity + 1 }
          : i)
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i._id !== id) return i
      const newQty = i.quantity + delta
      if (newQty <= 0) return null
      if (newQty > i.stock_quantity) { toast.error('Max stock reached'); return i }
      return { ...i, quantity: newQty }
    }).filter(Boolean))
  }

  const removeItem = (id) => setCart(prev => prev.filter(i => i._id !== id))

  const clearCart = () => {
    setCart([])
    setCustomer(null)
    setCustomerSearch('')
    setDiscount(0)
    setPaymentMethod('cash')
    setLastInvoice(null)
  }

  // Calculations
  const subtotal = cart.reduce((s, i) => s + i.quantity * i.selling_price, 0)
  const discountAmt = Math.min(Number(discount) || 0, subtotal)
  const taxable = subtotal - discountAmt
  const totalTax = cart.reduce((s, i) => {
    const itemSub = i.quantity * i.selling_price
    return s + itemSub * (i.tax_rate / 100)
  }, 0) * (taxable / (subtotal || 1))
  const grandTotal = taxable + totalTax

  // Customer search
  useEffect(() => {
    if (!customerSearch || customerSearch.length < 2) { setCustomerResults([]); return }
    const t = setTimeout(async () => {
      try {
        const r = await customersAPI.getAll({ search: customerSearch, per_page: 5 })
        setCustomerResults(r.data.data.customers)
      } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [customerSearch])

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Cart is empty')
    setLoading(true)
    try {
      const payload = {
        customer_id: customer?._id || null,
        customer_name: customer?.name || 'Walk-in Customer',
        customer_phone: customer?.phone || '',
        customer_address: customer?.city || '',
        customer_gst: customer?.gst_number || '',
        items: cart.map(i => ({
          product_id: i._id,
          product_name: i.name,
          sku: i.sku || '',
          hsn_code: i.hsn_code || '',
          quantity: i.quantity,
          unit: i.unit || 'pcs',
          unit_price: i.selling_price,
          mrp: i.mrp || i.selling_price,
          item_discount: 0,
          tax_rate: i.tax_rate || 18,
        })),
        discount_amount: discountAmt,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'credit' ? 'pending' : 'paid',
        amount_paid: paymentMethod === 'credit' ? 0 : grandTotal,
      }
      const r = await invoicesAPI.create(payload)
      setLastInvoice(r.data.data)
      clearCart()
      loadProducts()
      toast.success(`Invoice ${r.data.data.invoice_number} created!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async (invoiceId) => {
    try {
      const r = await invoicesAPI.downloadPDF(invoiceId)
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url; a.download = `Invoice.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('PDF download failed') }
  }

  const printInvoice = (invoice) => {
    const w = window.open('', '_blank')
    w.document.write(buildPrintHTML(invoice))
    w.document.close()
    w.print()
  }

  return (
    <div className="pos-layout">
      {/* Left: Products */}
      <div className="pos-products">
        {/* Search bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div className="input-group" style={{ flex: 1 }}>
            <MdSearch className="input-group-icon" />
            <input
              ref={searchRef}
              className="form-control"
              placeholder="Search product or scan barcode & press Enter..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleBarcodeSearch}
            />
          </div>
          <button className="btn btn-outline btn-icon" title="Barcode Scan">
            <MdQrCodeScanner size={20} />
          </button>
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {categories.map(c => (
            <button
              key={c}
              className={`btn btn-sm ${activeCategory === c ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveCategory(c)}
            >{c}</button>
          ))}
        </div>

        {/* Product grid */}
        <div className="product-grid">
          {filteredProducts.map(p => (
            <div
              key={p._id}
              className={`product-card ${p.stock_quantity <= 0 ? 'out-of-stock' : ''}`}
              onClick={() => addToCart(p)}
            >
              <div style={{
                fontSize: 10, fontWeight: 700, color: 'var(--primary-light)',
                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4
              }}>{p.category}</div>
              <div className="product-card-name">{p.name}</div>
              <div className="product-card-price">{fmtCurrency(p.selling_price)}</div>
              <div className="product-card-stock" style={{
                color: p.stock_quantity <= p.min_stock_level ? 'var(--warning)' : undefined
              }}>
                {p.stock_quantity <= 0 ? '❌ Out of stock' : `📦 ${p.stock_quantity} ${p.unit}`}
              </div>
              {p.tax_rate > 0 && <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
                +{p.tax_rate}% GST
              </div>}
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <MdSearch size={48} />
              <h4>No products found</h4>
              <p>Try a different search or category</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="pos-cart">
        <div className="card-header">
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MdShoppingCart /> Cart {cart.length > 0 && `(${cart.length})`}
          </span>
          {cart.length > 0 && (
            <button className="btn btn-ghost btn-sm text-danger" onClick={clearCart}>
              <MdClose size={14} /> Clear
            </button>
          )}
        </div>

        {/* Customer */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
          <div className="input-group">
            <MdPerson className="input-group-icon" />
            <input
              className="form-control"
              style={{ fontSize: 13 }}
              placeholder={customer ? customer.name : 'Search customer (optional)'}
              value={customerSearch}
              onChange={e => { setCustomerSearch(e.target.value); if (!e.target.value) setCustomer(null) }}
            />
            {customer && (
              <button onClick={() => { setCustomer(null); setCustomerSearch('') }}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
                <MdClose />
              </button>
            )}
          </div>
          {customerResults.length > 0 && !customer && (
            <div style={{
              position: 'absolute', left: 14, right: 14, top: '100%',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 8, boxShadow: 'var(--shadow-md)', zIndex: 10
            }}>
              {customerResults.map(c => (
                <div key={c._id} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                  onClick={() => { setCustomer(c); setCustomerSearch(''); setCustomerResults([]) }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.phone} • {c.city}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="pos-cart-items">
          {cart.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <MdShoppingCart size={40} />
              <h4>Cart is empty</h4>
              <p>Click products to add</p>
            </div>
          ) : cart.map(item => (
            <div key={item._id} className="cart-item">
              <div style={{ flex: 1 }}>
                <div className="cart-item-name">{item.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmtCurrency(item.selling_price)} ea</div>
              </div>
              <div className="cart-qty-control">
                <button className="cart-qty-btn" onClick={() => updateQty(item._id, -1)}>−</button>
                <span className="cart-qty">{item.quantity}</span>
                <button className="cart-qty-btn" onClick={() => updateQty(item._id, 1)}>+</button>
              </div>
              <div className="cart-item-total">{fmtCurrency(item.quantity * item.selling_price)}</div>
              <span className="cart-remove" onClick={() => removeItem(item._id)}><MdDelete size={16} /></span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pos-cart-footer">
          {/* Discount */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>Discount (₹)</label>
            <input
              type="number" min="0"
              className="form-control"
              style={{ height: 32, fontSize: 13 }}
              value={discount}
              onChange={e => setDiscount(Math.max(0, e.target.value))}
            />
          </div>

          {/* Totals */}
          <div className="total-row">
            <span>Subtotal</span><span>{fmtCurrency(subtotal)}</span>
          </div>
          {discountAmt > 0 && (
            <div className="total-row text-danger">
              <span>Discount</span><span>− {fmtCurrency(discountAmt)}</span>
            </div>
          )}
          <div className="total-row">
            <span>Tax (GST)</span><span>{fmtCurrency(totalTax)}</span>
          </div>
          <div className="total-row grand">
            <span>Total</span><span>{fmtCurrency(grandTotal)}</span>
          </div>

          {/* Payment Method */}
          <div style={{ marginTop: 12 }}>
            <label className="form-label">Payment Method</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {['cash','upi','card','credit','cheque'].map(m => (
                <button
                  key={m}
                  className={`btn btn-sm ${paymentMethod === m ? 'btn-primary' : 'btn-outline'}`}
                  style={{ justifyContent: 'center', textTransform: 'capitalize' }}
                  onClick={() => setPaymentMethod(m)}
                >{m}</button>
              ))}
            </div>
          </div>

          <button
            className="btn btn-accent btn-lg w-full"
            style={{ marginTop: 14, justifyContent: 'center', borderRadius: 10 }}
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
          >
            {loading ? 'Processing...' : `💳 Checkout ${cart.length > 0 ? fmtCurrency(grandTotal) : ''}`}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {lastInvoice && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <span className="modal-title" style={{ color: 'var(--success)' }}>✅ Invoice Created!</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setLastInvoice(null)}><MdClose /></button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
              <p style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Mono', color: 'var(--primary)' }}>
                {lastInvoice.invoice_number}
              </p>
              <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '8px 0' }}>
                Customer: <strong>{lastInvoice.customer_name}</strong>
              </p>
              <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--success)', margin: '12px 0' }}>
                {fmtCurrency(lastInvoice.grand_total)}
              </p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center', gap: 12 }}>
              <button className="btn btn-outline" onClick={() => printInvoice(lastInvoice)}>
                <MdPrint /> Print
              </button>
              <button className="btn btn-primary" onClick={() => downloadPDF(lastInvoice._id)}>
                <MdPictureAsPdf /> Download PDF
              </button>
              <button className="btn btn-success" onClick={() => setLastInvoice(null)}>
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function buildPrintHTML(invoice) {
  const items = invoice.items.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.product_name}</td>
      <td>${item.hsn_code || '-'}</td>
      <td>${item.quantity}</td>
      <td>₹${item.unit_price.toFixed(2)}</td>
      <td>${item.tax_rate}%</td>
      <td>₹${item.subtotal.toFixed(2)}</td>
    </tr>`).join('')

  return `<!DOCTYPE html><html><head><title>Invoice ${invoice.invoice_number}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
    h2 { text-align: center; color: #1a237e; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th { background: #1a237e; color: white; padding: 8px; text-align: left; }
    td { padding: 7px 8px; border-bottom: 1px solid #eee; }
    .total { text-align: right; padding: 4px 0; }
    .grand { font-size: 16px; font-weight: bold; }
    @media print { button { display: none; } }
  </style></head><body>
  <h2>TAX INVOICE</h2>
  <div style="display:flex;justify-content:space-between;margin-bottom:12px">
    <div><strong>Invoice#:</strong> ${invoice.invoice_number}<br>
    <strong>Date:</strong> ${new Date(invoice.created_at).toLocaleDateString('en-IN')}</div>
    <div><strong>Customer:</strong> ${invoice.customer_name}<br>
    <strong>Phone:</strong> ${invoice.customer_phone || '-'}</div>
  </div>
  <table>
    <thead><tr><th>#</th><th>Product</th><th>HSN</th><th>Qty</th><th>Rate</th><th>GST</th><th>Amount</th></tr></thead>
    <tbody>${items}</tbody>
  </table>
  <div class="total">Subtotal: ₹${invoice.subtotal?.toFixed(2)}</div>
  <div class="total">CGST: ₹${invoice.cgst?.toFixed(2)}</div>
  <div class="total">SGST: ₹${invoice.sgst?.toFixed(2)}</div>
  <div class="total grand">Grand Total: ₹${invoice.grand_total?.toFixed(2)}</div>
  <script>window.onload=()=>window.print()</script>
  </body></html>`
}
