import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// ── Inline SVG eye icons ────────────────────────────────────────────────────
function EyeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}
function EyeOffIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

// ── Password strength scorer ────────────────────────────────────────────────
function getStrength(pwd) {
  if (!pwd) return null
  let score = 0
  if (pwd.length >= 8)             score++
  if (pwd.length >= 12)            score++
  if (/[A-Z]/.test(pwd))           score++
  if (/[0-9]/.test(pwd))           score++
  if (/[^A-Za-z0-9]/.test(pwd))    score++
  if (score <= 1) return { label: 'Weak',   bar: 'bg-red-400',    width: 'w-1/4',  text: 'text-red-500'    }
  if (score <= 2) return { label: 'Fair',   bar: 'bg-orange-400', width: 'w-2/4',  text: 'text-orange-500' }
  if (score <= 3) return { label: 'Good',   bar: 'bg-blue-400',   width: 'w-3/4',  text: 'text-blue-500'   }
  return               { label: 'Strong', bar: 'bg-green-500',  width: 'w-full', text: 'text-green-600'  }
}

export default function ResetPassword() {
  const navigate          = useNavigate()
  const location          = useLocation()
  const { lastAuthEvent } = useAuth()

  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState(false)
  const [loading, setLoading]         = useState(false)
  const [showPwd, setShowPwd]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // ready = we have received a PASSWORD_RECOVERY event
  const [ready, setReady] = useState(lastAuthEvent === 'PASSWORD_RECOVERY')

  useEffect(() => {
    // Fast path: PASSWORD_RECOVERY already captured by AuthContext
    if (lastAuthEvent === 'PASSWORD_RECOVERY') {
      setReady(true)
      return
    }

    // Subscribe locally to catch PASSWORD_RECOVERY fired by code exchange or hard refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    // Resolve auth params from one of two sources:
    //  • sessionStorage — populated by main.jsx when Supabase redirected to a real path
    //    (e.g. /reset-password?code=xxx or /reset-password#error=otp_expired) in dev.
    //  • location.search — in production, 404.html preserves ?code=xxx in the hash query.
    const stored = sessionStorage.getItem('supabase_auth_params')
    console.log('[ResetPassword] sessionStorage supabase_auth_params:', stored)
    console.log('[ResetPassword] location.search:', location.search)

    let paramsSource = null
    if (stored) {
      sessionStorage.removeItem('supabase_auth_params')
      paramsSource = new URLSearchParams(stored)
    } else if (location.search) {
      paramsSource = new URLSearchParams(location.search)
    }

    console.log('[ResetPassword] paramsSource:', paramsSource ? paramsSource.toString() : 'null')

    if (paramsSource) {
      const errorCode = paramsSource.get('error_code')
      const code      = paramsSource.get('code')
      console.log('[ResetPassword] errorCode:', errorCode, '| code:', code ? code.slice(0,12)+'…' : 'null')

      if (errorCode) {
        // Link is expired or invalid — show error immediately, skip verification spinner
        const desc = (paramsSource.get('error_description') || errorCode).replace(/\+/g, ' ')
        setError(
          errorCode === 'otp_expired'
            ? 'This reset link has expired. Please request a new one.'
            : decodeURIComponent(desc)
        )
      } else if (code) {
        // PKCE flow: exchange the one-time code for a session
        supabase.auth.exchangeCodeForSession(code)
          .then(({ error: err }) => {
            if (err) {
              console.error('[ResetPassword] exchangeCodeForSession error:', err)
              setError('This reset link has expired or is invalid. Please request a new one.')
            } else {
              console.log('[ResetPassword] exchangeCodeForSession success → setReady(true)')
              setReady(true)
            }
          })
          .catch((ex) => {
            console.error('[ResetPassword] exchangeCodeForSession threw:', ex)
            setError('Something went wrong verifying your link. Please request a new one.')
          })
      } else {
        // Implicit flow: email link delivers access_token + refresh_token in the URL hash
        // Supabase sets type=recovery for password-reset links
        const accessToken  = paramsSource.get('access_token')
        const refreshToken = paramsSource.get('refresh_token')
        const tokenType    = paramsSource.get('type')
        console.log('[ResetPassword] implicit flow — type:', tokenType, '| has access_token:', !!accessToken)

        if (accessToken && tokenType === 'recovery') {
          supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken || '' })
            .then(({ error: err }) => {
              if (err) {
                console.error('[ResetPassword] setSession error:', err)
                setError('This reset link has expired or is invalid. Please request a new one.')
              } else {
                console.log('[ResetPassword] setSession success → setReady(true)')
                setReady(true)
              }
            })
            .catch((ex) => {
              console.error('[ResetPassword] setSession threw:', ex)
              setError('Something went wrong verifying your link. Please request a new one.')
            })
        } else {
          console.warn('[ResetPassword] unrecognised params — no code, no access_token+recovery:', paramsSource.toString())
          setError('Reset link is missing required parameters. Please request a new one.')
        }
      }
    } else {
      console.warn('[ResetPassword] No auth params found in sessionStorage or location.search — spinner will stay until PASSWORD_RECOVERY event fires')
    }

    return () => subscription.unsubscribe()
  }, [lastAuthEvent, location.search])

  const strength     = getStrength(password)
  const confirmMatch = confirm.length > 0 && confirm === password
  const confirmMiss  = confirm.length > 0 && confirm !== password
  const canSubmit    = password.length >= 8 && confirmMatch && !loading

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

          {/* ── Header stripe ── */}
          <div className="bg-primary-dark px-8 py-8 text-center">
            <div className="font-display font-bold text-white text-2xl">
              NC <span className="text-accent">BULLS</span> CRICKET CLUB
            </div>
            <h1 className="font-display font-bold text-white text-3xl mt-2">New Password</h1>
            <p className="text-gray-400 text-sm mt-1">Choose a strong password to secure your account</p>
          </div>

          <div className="px-8 py-8">

            {/* ── Success ── */}
            {success ? (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-800 font-semibold">Password updated!</p>
                  <p className="text-gray-500 text-sm mt-1">Redirecting you to sign in…</p>
                </div>
                <Link to="/login" className="block w-full btn-primary py-3 text-center text-base">
                  Sign In Now
                </Link>
              </div>

            /* ── Waiting / invalid link ── */
            ) : !ready ? (
              <div className="text-center py-8 space-y-4">
                {error ? (
                  /* Expired / invalid link */
                  <>
                    <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
                      <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-800 font-semibold text-sm">Link expired</p>
                      <p className="text-gray-500 text-sm mt-1">{error}</p>
                    </div>
                    <Link
                      to="/forgot-password"
                      className="block w-full btn-primary py-3 text-center text-base"
                    >
                      Request a New Link
                    </Link>
                  </>
                ) : (
                  /* Still verifying */
                  <>
                    <div className="w-12 h-12 rounded-full bg-yellow-50 border border-yellow-200 flex items-center justify-center mx-auto">
                      <svg className="w-5 h-5 text-yellow-500 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-700 font-medium text-sm">Verifying your reset link…</p>
                      <p className="text-gray-400 text-xs mt-1">
                        If this takes too long, the link may have expired.
                      </p>
                    </div>
                    <Link
                      to="/forgot-password"
                      className="inline-block text-sm font-semibold text-primary hover:text-accent transition-colors"
                    >
                      Request a new link →
                    </Link>
                  </>
                )}
              </div>

            /* ── Reset form ── */
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* New password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="Min. 8 characters"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      tabIndex={-1}
                      aria-label={showPwd ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPwd ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>

                  {/* Strength meter */}
                  {strength && (
                    <div className="mt-2 space-y-1">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${strength.bar} ${strength.width}`} />
                      </div>
                      <p className="text-xs text-gray-400">
                        Strength:{' '}
                        <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="Re-enter password"
                      className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors ${
                        confirmMiss  ? 'border-red-300 bg-red-50/50'   :
                        confirmMatch ? 'border-green-300 bg-green-50/50' :
                                       'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      tabIndex={-1}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {confirmMiss  && <p className="text-xs text-red-500   mt-1">Passwords don't match</p>}
                  {confirmMatch && <p className="text-xs text-green-600 mt-1">Passwords match ✓</p>}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-dark border-t-transparent rounded-full animate-spin" />
                      Updating…
                    </span>
                  ) : 'Update Password'}
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
