import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { MdLock, MdPerson, MdVisibility, MdVisibilityOff, MdPointOfSale } from 'react-icons/md'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) return toast.error('Please fill all fields')
    setLoading(true)
    try {
      await login(form.username, form.password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 50%, #1565c0 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.04,
        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
        backgroundSize: '30px 30px'
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, background: 'rgba(255,255,255,0.15)',
            borderRadius: 16, display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', marginBottom: 16, backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <MdPointOfSale />
          </div>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
            SmartBill <span style={{ color: '#ffa040' }}>Pro</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>
            Billing & Inventory Management
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', borderRadius: 20,
          padding: '36px 36px 28px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Welcome back</h2>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 28 }}>Sign in to your account</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="input-group">
                <MdPerson className="input-group-icon" />
                <input
                  className="form-control"
                  placeholder="Enter username"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-group" style={{ position: 'relative' }}>
                <MdLock className="input-group-icon" />
                <input
                  className="form-control"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  style={{ paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)',
                  display: 'flex', alignItems: 'center'
                }}>
                  {showPwd ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              style={{ marginTop: 8, justifyContent: 'center', borderRadius: 10 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{
            marginTop: 24, padding: 14,
            background: 'var(--surface-2)', borderRadius: 10,
            border: '1px dashed var(--border)'
          }}>
            <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6, fontWeight: 600 }}>
              Demo Credentials
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-2)' }}>
              Admin: <strong>admin</strong> / <strong>admin123</strong>
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-2)' }}>
              Cashier: <strong>cashier</strong> / <strong>cashier123</strong>
            </p>
          </div>

          <div style={{ textAlign: 'center', marginTop: 22 }}>
            <span style={{ color: 'var(--text-2)', fontSize: 13 }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#1565c0', fontWeight: 700, textDecoration: 'none' }}>
                Sign up
              </Link>
            </span>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 20 }}>
          SmartBill Pro v1.0 • Final Year Project
        </p>
      </div>
    </div>
  )
}

function MdPointOfSaleIcon() {
  return (
    <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
      <path d="M17 2H7c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 4H7V4h10v2zm3 16H4c-1.1 0-2-.9-2-2v-1h20v1c0 1.1-.9 2-2 2zM3 13l1.5-6h15L21 13H3zm8-4H9v1H8v1h1v1h2v-1h1v-1h-1V9zm4 2h2v-1h-2v1z"/>
    </svg>
  )
}
