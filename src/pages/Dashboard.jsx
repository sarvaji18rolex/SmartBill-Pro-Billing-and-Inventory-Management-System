import { useEffect, useState } from 'react'
import { dashboardAPI } from '../services/api'
import { fmtCurrency, fmtDate } from '../utils/format'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  MdTrendingUp, MdReceipt, MdInventory, MdPeople,
  MdWarning, MdAccessTime, MdLightbulb
} from 'react-icons/md'
import { Link } from 'react-router-dom'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler)

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [trend, setTrend] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [recentInvoices, setRecentInvoices] = useState([])
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dashboardAPI.getSummary(),
      dashboardAPI.getSalesTrend(30),
      dashboardAPI.getTopProducts({ limit: 5 }),
      dashboardAPI.getPaymentMethods(30),
      dashboardAPI.getLowStock(),
      dashboardAPI.getRecentInvoices(8),
    ]).then(([s, t, tp, pm, ls, ri]) => {
      setSummary(s.data.data)
      setTrend(t.data.data)
      setTopProducts(tp.data.data)
      setPaymentMethods(pm.data.data)
      setLowStock(ls.data.data)
      setRecentInvoices(ri.data.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex-center" style={{ height: 400 }}>
      <div className="spinner" />
    </div>
  )

  const trendChart = {
    labels: trend.map(d => d.date.slice(5)),
    datasets: [{
      label: 'Daily Sales (₹)',
      data: trend.map(d => d.total),
      borderColor: '#3949ab',
      backgroundColor: 'rgba(57,73,171,0.08)',
      tension: 0.4,
      fill: true,
      pointRadius: 2,
    }]
  }

  const topChart = {
    labels: topProducts.map(p => p.product_name.slice(0, 18)),
    datasets: [{
      label: 'Units Sold',
      data: topProducts.map(p => p.total_qty),
      backgroundColor: ['#3949ab','#ff6f00','#2e7d32','#0277bd','#7b1fa2'],
      borderRadius: 6,
    }]
  }

  const pmColors = { cash: '#2e7d32', upi: '#0277bd', card: '#7b1fa2', credit: '#c62828', cheque: '#f57f17' }
  const donutChart = {
    labels: paymentMethods.map(p => p.method?.toUpperCase()),
    datasets: [{
      data: paymentMethods.map(p => p.total),
      backgroundColor: paymentMethods.map(p => pmColors[p.method] || '#9e9e9e'),
      borderWidth: 0,
    }]
  }

  const chartOpts = { responsive: true, plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: '#f0f2f8' } } } }

  return (
    <div>
      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-icon blue"><MdTrendingUp /></div>
          <div className="stat-label">Today's Sales</div>
          <div className="stat-value">{fmtCurrency(summary?.today_sales)}</div>
          <div className="stat-sub">{summary?.today_invoices} invoices today</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon orange"><MdReceipt /></div>
          <div className="stat-label">Monthly Revenue</div>
          <div className="stat-value">{fmtCurrency(summary?.month_sales)}</div>
          <div className="stat-sub">{summary?.month_invoices} invoices this month</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green"><MdInventory /></div>
          <div className="stat-label">Total Products</div>
          <div className="stat-value">{summary?.total_products}</div>
          <div className="stat-sub" style={{ color: summary?.low_stock_count > 0 ? 'var(--warning)' : undefined }}>
            {summary?.low_stock_count} low stock alerts
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple"><MdPeople /></div>
          <div className="stat-label">Total Customers</div>
          <div className="stat-value">{summary?.total_customers}</div>
          <div className="stat-sub">{summary?.pending_payments} pending payments</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Sales Trend (30 days)</span>
          </div>
          <div className="card-body" style={{ height: 220 }}>
            <Line data={trendChart} options={{ ...chartOpts, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Top Products</span>
          </div>
          <div className="card-body" style={{ height: 220 }}>
            {topProducts.length ? (
              <Bar data={topChart} options={{ ...chartOpts, maintainAspectRatio: false }} />
            ) : <div className="empty-state"><p>No sales data</p></div>}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Payment Methods</span>
          </div>
          <div className="card-body flex-center" style={{ flexDirection: 'column', gap: 12 }}>
            {paymentMethods.length ? (
              <>
                <div style={{ width: 140, height: 140 }}>
                  <Doughnut data={donutChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                  {paymentMethods.map(pm => (
                    <div key={pm.method} className="flex-between" style={{ fontSize: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: pmColors[pm.method] || '#9e9e9e', display: 'inline-block' }} />
                        {pm.method?.toUpperCase()}
                      </span>
                      <span style={{ fontWeight: 600 }}>{fmtCurrency(pm.total)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <div className="empty-state"><p>No data</p></div>}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Invoices</span>
            <Link to="/invoices" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice#</th><th>Customer</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map(inv => (
                  <tr key={inv._id}>
                    <td style={{ fontFamily: 'Space Mono', fontSize: 12 }}>{inv.invoice_number}</td>
                    <td>{inv.customer_name}</td>
                    <td style={{ fontWeight: 600 }}>{fmtCurrency(inv.grand_total)}</td>
                    <td><span className="badge badge-neutral">{inv.payment_method?.toUpperCase()}</span></td>
                    <td><span className={`badge ${inv.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                      {inv.payment_status}
                    </span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{fmtDate(inv.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Low Stock + Smart Insights */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header" style={{ borderLeft: '3px solid var(--warning)' }}>
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MdWarning style={{ color: 'var(--warning)' }} /> Low Stock Alerts
            </span>
            <Link to="/inventory?low_stock=true" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {lowStock.length ? lowStock.slice(0, 6).map(p => (
              <div key={p._id} className="flex-between" style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.category} • Min: {p.min_stock_level}</div>
                </div>
                <span className={`badge ${p.stock_quantity === 0 ? 'badge-danger' : 'badge-warning'}`}>
                  {p.stock_quantity} left
                </span>
              </div>
            )) : (
              <div className="empty-state" style={{ padding: 30 }}>
                <p>✅ All products adequately stocked</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MdLightbulb style={{ color: 'var(--accent)' }} /> Smart Insights
            </span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {insights?.reorder_alerts?.length > 0 && (
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Reorder Predictions
                </div>
                {insights.reorder_alerts.slice(0, 3).map((a, i) => (
                  <div key={i} className="flex-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{a.product_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>~{a.avg_daily_sales}/day • {a.days_remaining}d left</div>
                    </div>
                    <span className="badge badge-danger">Reorder {a.suggested_reorder}</span>
                  </div>
                ))}
              </div>
            )}
            {insights?.frequently_together?.length > 0 && (
              <div style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Frequently Bought Together
                </div>
                {insights.frequently_together.slice(0, 4).map((p, i) => (
                  <div key={i} style={{ fontSize: 12, padding: '4px 0', color: 'var(--text-2)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{p.pair}</span>
                    <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{p.count}x</span>
                  </div>
                ))}
              </div>
            )}
            {(!insights?.reorder_alerts?.length && !insights?.frequently_together?.length) && (
              <div className="empty-state" style={{ padding: 30 }}>
                <p>Insights will appear after more sales data</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
