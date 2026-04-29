import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { MdLock, MdPerson, MdVisibility, MdVisibilityOff, MdEmail } from 'react-icons/md'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', name: '', email: '', password: '', confirmPassword: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password || !form.confirmPassword || !form.name) {
      return toast.error('Please fill all required fields')
    }
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match')
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters')
    }
    setLoading(true)
    try {
      await register(form)
      toast.success('Registration successful. Please sign in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Registration failed')
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
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.04,
        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
        backgroundSize: '30px 30px'
      }} />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, background: 'rgba(255,255,255,0.15)',
            borderRadius: 16, display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', marginBottom: 16, backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <MdPerson size={28} color="white" />
          </div>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
            SmartBill <span style={{ color: '#ffa040' }}>Pro</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>
            Create your account and start billing.
          </p>
        </div>

        <div style={{
          background: '#fff', borderRadius: 20,
          padding: '36px 36px 28px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Create account</h2>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 28 }}>Register a new user</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-group">
                <MdPerson className="input-group-icon" />
                <input
                  className="form-control"
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="input-group">
                <MdPerson className="input-group-icon" />
                <input
                  className="form-control"
                  placeholder="Choose a username"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email (optional)</label>
              <div className="input-group">
                <MdEmail className="input-group-icon" />
                <input
                  className="form-control"
                  type="email"
                  placeholder="Enter email address"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
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
                  placeholder="Create password"
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

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-group" style={{ position: 'relative' }}>
                <MdLock className="input-group-icon" />
                <input
                  className="form-control"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
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
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 22 }}>
            <span style={{ color: 'var(--text-2)', fontSize: 13 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#1565c0', fontWeight: 700, textDecoration: 'none' }}>
                Sign in
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
