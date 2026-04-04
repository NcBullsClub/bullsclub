import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { lastAuthEvent } = useAuth()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [loading, setLoading]   = useState(false)

  // AuthContext already captures PASSWORD_RECOVERY before this page mounts — no race condition
  const ready = lastAuthEvent === 'PASSWORD_RECOVERY'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) throw err
      setSuccess(true)
      await supabase.auth.signOut()
      setTimeout(() => navigate('/login', { replace: true }), 3000)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
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
            <h1 className="font-display font-bold text-white text-3xl mt-2">New Password</h1>
            <p className="text-gray-400 text-sm mt-1">Choose a strong password</p>
          </div>

          <div className="px-8 py-8">
            {success ? (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-700 text-sm font-medium">Password updated successfully!</p>
                <p className="text-gray-500 text-sm">Redirecting you to sign in…</p>
              </div>
            ) : !ready ? (
              <div className="text-center py-8 space-y-3">
                <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin inline-block" />
                <p className="text-gray-500 text-sm">Verifying your reset link…</p>
                <p className="text-gray-400 text-xs">
                  If nothing happens, the link may have expired.{' '}
                  <a href="/forgot-password" className="text-primary hover:text-accent font-medium">
                    Request a new one
                  </a>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    New password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Re-enter password"
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
                      Updating…
                    </span>
                  ) : 'Update Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
