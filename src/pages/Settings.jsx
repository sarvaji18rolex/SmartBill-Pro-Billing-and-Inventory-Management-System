import { useState } from 'react'
import { authAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { MdSave, MdLock, MdBusiness, MdInfo, MdPalette } from 'react-icons/md'

export default function Settings() {
  const { user } = useAuth()

  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm_password: '' })
  const [pwLoading, setPwLoading] = useState(false)

  const [company] = useState({
    name: import.meta.env.VITE_COMPANY_NAME || 'SmartBill Pro',
    address: '123, MG Road, Bangalore, Karnataka - 560001',
    phone: '+91-9876543210',
    email: 'billing@smartbillpro.com',
    gst: '29ABCDE1234F1Z5',
    state: 'Karnataka',
    state_code: '29',
  })

  const handlePwChange = async (e) => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.confirm_password) return toast.error('Passwords do not match')
    if (pwForm.new_password.length < 6) return toast.error('New password must be at least 6 characters')
    setPwLoading(true)
    try {
      await authAPI.changePassword({ old_password: pwForm.old_password, new_password: pwForm.new_password })
      toast.success('Password changed successfully')
      setPwForm({ old_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed')
    } finally { setPwLoading(false) }
  }

  const InfoRow = ({ label, value }) => (
    <div className="flex-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
    </div>
  )

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header">
        <div><h2>Settings</h2><p>System configuration and account settings</p></div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Company Info */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MdBusiness /> Company Information
              </span>
            </div>
            <div className="card-body">
              <div style={{ padding: '8px 16px', background: 'var(--info-light)', borderRadius: 8, marginBottom: 16, fontSize: 13, color: 'var(--info)' }}>
                ℹ️ To change company info, edit the <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 4px', borderRadius: 4 }}>.env</code> file in the backend and restart the server.
              </div>
              <InfoRow label="Company Name" value={company.name} />
              <InfoRow label="GSTIN" value={company.gst} />
              <InfoRow label="State" value={company.state} />
              <InfoRow label="State Code" value={company.state_code} />
              <InfoRow label="Phone" value={company.phone} />
              <InfoRow label="Email" value={company.email} />
              <div style={{ padding: '10px 0' }}>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 4 }}>Address</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{company.address}</div>
              </div>
            </div>
          </div>

          {/* GST Tax Rates Info */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">GST Tax Rates Reference</span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {[
                { rate: '0%', examples: 'Fresh vegetables, milk, eggs, salt' },
                { rate: '5%', examples: 'Edible oils, sugar, spices, tea, coffee' },
                { rate: '12%', examples: 'Processed food, butter, ghee, stationery' },
                { rate: '18%', examples: 'Electronics, personal care, services' },
                { rate: '28%', examples: 'Luxury goods, automobiles, tobacco' },
              ].map(r => (
                <div key={r.rate} className="flex-between" style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-light)', fontFamily: 'Space Mono' }}>{r.rate}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-2)', textAlign: 'right', maxWidth: '75%' }}>{r.examples}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          {/* Account Info */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MdInfo /> Account Information
              </span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: 16, background: 'var(--surface-2)', borderRadius: 10 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'var(--primary-light)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 700
                }}>{user?.name?.[0]?.toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{user?.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)' }}>@{user?.username}</div>
                  <div>
                    <span className="badge badge-info" style={{ marginTop: 4, textTransform: 'capitalize' }}>{user?.role}</span>
                  </div>
                </div>
              </div>
              <InfoRow label="Username" value={user?.username} />
              <InfoRow label="Email" value={user?.email || 'Not set'} />
              <InfoRow label="Role" value={user?.role} />
            </div>
          </div>

          {/* Change Password */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MdLock /> Change Password
              </span>
            </div>
            <div className="card-body">
              <form onSubmit={handlePwChange}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input type="password" className="form-control"
                    value={pwForm.old_password}
                    onChange={e => setPwForm(p => ({ ...p, old_password: e.target.value }))}
                    required />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-control"
                    value={pwForm.new_password}
                    onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))}
                    minLength={6} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" className="form-control"
                    value={pwForm.confirm_password}
                    onChange={e => setPwForm(p => ({ ...p, confirm_password: e.target.value }))}
                    minLength={6} required />
                </div>
                <button type="submit" className="btn btn-primary w-full" style={{ justifyContent: 'center' }} disabled={pwLoading}>
                  <MdSave /> {pwLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>

          {/* System Info */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">System Information</span>
            </div>
            <div className="card-body">
              <InfoRow label="App Version" value="1.0.0" />
              <InfoRow label="Frontend" value="React 18 + Vite" />
              <InfoRow label="Backend" value="Python Flask" />
              <InfoRow label="Database" value="MongoDB (Local)" />
              <InfoRow label="Invoice Format" value="GST Compliant (India)" />
              <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Backend API</div>
                <div style={{ fontSize: 13, fontFamily: 'Space Mono', marginTop: 2 }}>http://localhost:5000/api</div>
              </div>
              <div style={{ marginTop: 16, padding: 12, background: 'var(--success-light)', borderRadius: 8, fontSize: 13, color: 'var(--success)' }}>
                ✅ All systems operational
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
