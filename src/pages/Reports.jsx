import { useState, useEffect } from 'react'
import { dashboardAPI } from '../services/api'
import { fmtCurrency } from '../utils/format'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler)

const CHART_COLORS = ['#3949ab','#ff6f00','#2e7d32','#0277bd','#7b1fa2','#c62828','#00838f','#f57f17']

export default function Reports() {
  const [trendDays, setTrendDays] = useState(30)
  const [trend, setTrend] = useState([])
  const [monthly, setMonthly] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [topLimit, setTopLimit] = useState(10)
  const [payMethods, setPayMethods] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      dashboardAPI.getSalesTrend(trendDays),
      dashboardAPI.getMonthlyComparison(6),
      dashboardAPI.getTopProducts({ limit: topLimit }),
      dashboardAPI.getPaymentMethods(30),
      dashboardAPI.getSummary(),
    ]).then(([t, m, tp, pm, s]) => {
      setTrend(t.data.data)
      setMonthly(m.data.data)
      setTopProducts(tp.data.data)
      setPayMethods(pm.data.data)
      setSummary(s.data.data)
    }).finally(() => setLoading(false))
  }, [trendDays, topLimit])

  const lineData = {
    labels: trend.map(d => d.date.slice(5)),
    datasets: [
      {
        label: 'Revenue (₹)',
        data: trend.map(d => d.total),
        borderColor: '#3949ab',
        backgroundColor: 'rgba(57,73,171,0.1)',
        tension: 0.4, fill: true, yAxisID: 'y',
      },
      {
        label: 'Orders',
        data: trend.map(d => d.count),
        borderColor: '#ff6f00',
        backgroundColor: 'rgba(255,111,0,0.1)',
        tension: 0.4, fill: false, yAxisID: 'y1',
        borderDash: [5, 5],
      }
    ]
  }

  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'top', labels: { font: { family: 'DM Sans' } } } },
    scales: {
      x: { grid: { display: false } },
      y: { position: 'left', grid: { color: '#f0f2f8' }, ticks: { callback: v => '₹' + v.toLocaleString('en-IN') } },
      y1: { position: 'right', grid: { display: false } }
    }
  }

  const barData = {
    labels: monthly.map(m => m.month),
    datasets: [{
      label: 'Monthly Revenue (₹)',
      data: monthly.map(m => m.total),
      backgroundColor: CHART_COLORS,
      borderRadius: 6,
    }]
  }

  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#f0f2f8' }, ticks: { callback: v => '₹' + v.toLocaleString('en-IN') } }
    }
  }

  const topBarData = {
    labels: topProducts.map(p => p.product_name.length > 20 ? p.product_name.slice(0, 20) + '…' : p.product_name),
    datasets: [{
      label: 'Units Sold',
      data: topProducts.map(p => p.total_qty),
      backgroundColor: CHART_COLORS,
      borderRadius: 6,
    }]
  }

  const pmColors = { cash: '#2e7d32', upi: '#0277bd', card: '#7b1fa2', credit: '#c62828', cheque: '#f57f17', bank_transfer: '#00838f' }
  const donutData = {
    labels: payMethods.map(p => p.method?.toUpperCase()),
    datasets: [{
      data: payMethods.map(p => p.total),
      backgroundColor: payMethods.map(p => pmColors[p.method] || '#9e9e9e'),
      borderWidth: 2, borderColor: '#fff',
    }]
  }

  if (loading) return <div className="flex-center" style={{ height: 400 }}><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div><h2>Sales Reports & Analytics</h2><p>Business performance overview</p></div>
      </div>

      {/* Summary cards */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card blue">
          <div className="stat-label">Today's Revenue</div>
          <div className="stat-value">{fmtCurrency(summary?.today_sales)}</div>
          <div className="stat-sub">{summary?.today_invoices} invoices</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">Monthly Revenue</div>
          <div className="stat-value">{fmtCurrency(summary?.month_sales)}</div>
          <div className="stat-sub">{summary?.month_invoices} invoices</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Total Customers</div>
          <div className="stat-value">{summary?.total_customers}</div>
          <div className="stat-sub">{summary?.pending_payments} pending payments</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Low Stock Items</div>
          <div className="stat-value">{summary?.low_stock_count}</div>
          <div className="stat-sub">Need restocking</div>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Sales Trend</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {[7, 14, 30, 60, 90].map(d => (
              <button key={d}
                className={`btn btn-sm ${trendDays === d ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setTrendDays(d)}>{d}d</button>
            ))}
          </div>
        </div>
        <div className="card-body" style={{ height: 280 }}>
          <Line data={lineData} options={lineOpts} />
        </div>
      </div>

      {/* Monthly + Payment Methods */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Monthly Revenue (6 Months)</span></div>
          <div className="card-body" style={{ height: 260 }}>
            <Bar data={barData} options={barOpts} />
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Payment Method Breakdown</span></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'center' }}>
              <div style={{ height: 200 }}>
                <Doughnut data={donutData} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false } } }} />
              </div>
              <div>
                {payMethods.map(pm => (
                  <div key={pm.method} style={{ marginBottom: 12 }}>
                    <div className="flex-between" style={{ marginBottom: 4 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: pmColors[pm.method] || '#9e9e9e', display: 'inline-block' }} />
                        {pm.method?.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{fmtCurrency(pm.total)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 18 }}>{pm.count} transactions</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Top Selling Products</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {[5, 10, 15].map(n => (
              <button key={n}
                className={`btn btn-sm ${topLimit === n ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setTopLimit(n)}>Top {n}</button>
            ))}
          </div>
        </div>
        <div className="card-body" style={{ height: 300 }}>
          {topProducts.length ? (
            <Bar data={topBarData} options={{
              ...barOpts, indexAxis: 'y',
              scales: {
                x: { grid: { color: '#f0f2f8' } },
                y: { grid: { display: false }, ticks: { font: { size: 11 } } }
              }
            }} />
          ) : <div className="empty-state"><p>No sales data available</p></div>}
        </div>
      </div>

      {/* Top Products Table */}
      <div className="card">
        <div className="card-header"><span className="card-title">Product Performance Table</span></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Rank</th><th>Product</th><th>Units Sold</th><th>Revenue</th><th>Avg. Price</th></tr>
            </thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={p.product_id}>
                  <td>
                    <span style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: i < 3 ? ['#ffd700','#c0c0c0','#cd7f32'][i] : 'var(--surface-2)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: i < 3 ? '#000' : 'var(--text-3)'
                    }}>#{i + 1}</span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{p.product_name}</td>
                  <td style={{ fontFamily: 'Space Mono', fontWeight: 600 }}>{p.total_qty}</td>
                  <td style={{ fontWeight: 700, color: 'var(--success)' }}>{fmtCurrency(p.total_revenue)}</td>
                  <td style={{ color: 'var(--text-2)' }}>{fmtCurrency(p.total_revenue / (p.total_qty || 1))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
