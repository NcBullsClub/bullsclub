import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const TEAMS = [
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls',   label: 'Royal Bulls' },
]

export default function Signup() {
  const { signUp } = useAuth()
  const navigate   = useNavigate()

  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', confirmPassword: '', team: '',
  })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.team) { setError('Please select your team.'); return }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      // Pre-check: verify email is on the approved list before hitting auth
      const { data: allowed, error: rpcErr } = await supabase.rpc('is_email_allowed', { check_email: formData.email.trim() })
      if (rpcErr) throw rpcErr
      if (!allowed) {
        setError('This email is not on the approved player list. Please contact your club admin.')
        setLoading(false)
        return
      }
      await signUp(formData.email.trim(), formData.password, formData.fullName.trim(), formData.team)
      setDone(true)
    } catch (err) {
      setError(err.message || 'Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-[90vh] bg-surface flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-10 text-center"
        >
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="font-display font-bold text-primary text-2xl mb-2">Welcome to NC Bulls!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your account is ready. Sign in to mark your availability.
          </p>
          <Link to="/login" className="btn-primary">Go to Sign In</Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-[90vh] bg-surface flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Header stripe */}
          <div className="bg-primary-dark px-8 py-8 text-center">
            <div className="font-display font-bold text-white text-2xl">
              NC <span className="text-accent">BULLS</span> CRICKET CLUB
            </div>
            <h1 className="font-display font-bold text-white text-3xl mt-2">Create Account</h1>
            <p className="text-gray-400 text-sm mt-1">Join the club portal</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            {/* Full name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                autoComplete="name"
                placeholder="Ravi Kumar"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>

            {/* Team */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Team</label>
              <div className="grid grid-cols-2 gap-3">
                {TEAMS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, team: t.id }))}
                    className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      formData.team === t.id
                        ? t.id === 'raising-bulls'
                          ? 'border-accent bg-accent text-primary-dark'
                          : 'border-primary bg-primary text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-dark border-t-transparent rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:text-accent transition-colors">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
