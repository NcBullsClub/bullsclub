import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const next       = location.state?.next || '/availability'

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
      })
    })
  }, [])

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(formData.email.trim(), formData.password)
      navigate(next, { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[90vh] bg-surface px-4 py-8 md:py-16 md:flex md:items-center md:justify-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Header stripe */}
          <div className="bg-primary-dark px-8 py-8 text-center">
            <div className="font-display font-bold text-white text-2xl">
              NC <span className="text-accent">BULLS</span> CRICKET CLUB
            </div>
            <h1 className="font-display font-bold text-white text-3xl mt-2">Sign In</h1>
            <p className="text-gray-400 text-sm mt-1">Access your player account</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
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

            {/* Password */}
            <div>
              <div className="mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error.toLowerCase().includes('invalid login credentials')
                  ? 'Incorrect email or password. Please try again or contact an admin.'
                  : error}
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
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-primary hover:text-accent transition-colors">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
