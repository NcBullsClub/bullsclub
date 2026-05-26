import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail]     = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        // Standard URL (no hash) — must match your Supabase allowed redirect URLs list.
        // GitHub Pages 404.html will forward the ?code= query param to /#/reset-password.
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (err) {
        // Log full error details to browser console for debugging
        console.error('[ForgotPassword] Supabase error:', {
          message: err.message,
          status:  err.status,
          code:    err.code,
          name:    err.name,
        })
        throw err
      }
      setSubmitted(true)
    } catch (err) {
      const msg = err.message || ''
      if (msg.toLowerCase().includes('sending') || msg.toLowerCase().includes('smtp')) {
        setError('Email delivery failed. The SMTP/email provider is not configured correctly in Supabase. Check Settings → Auth → SMTP in your Supabase dashboard.')
      } else if (err.status === 429 || msg.toLowerCase().includes('rate')) {
        setError('Too many requests. Please wait a few minutes before trying again.')
      } else {
        setError(msg || 'Something went wrong. Please try again.')
      }
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
            <h1 className="font-display font-bold text-white text-3xl mt-2">Reset Password</h1>
            <p className="text-gray-400 text-sm mt-1">We'll email you a recovery link</p>
          </div>

          <div className="px-8 py-8">
            {submitted ? (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-700 text-sm">
                  If <span className="font-semibold">{email}</span> is registered, you'll receive a reset link shortly. Check your inbox (and spam folder).
                </p>
                <Link to="/login" className="block w-full btn-primary py-3 text-center text-base mt-4">
                  Back to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
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
                      Sending…
                    </span>
                  ) : 'Send Reset Link'}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Remembered it?{' '}
                  <Link to="/login" className="font-semibold text-primary hover:text-accent transition-colors">
                    Sign in
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
