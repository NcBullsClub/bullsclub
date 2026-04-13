import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const TEAMS = [
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls',   label: 'Royal Bulls' },
]

const PLAYING_ROLES = [
  { id: 'batsman',              label: 'Batsman',                  icon: '🏏' },
  { id: 'bowler',               label: 'Bowler',                   icon: '⚡' },
  { id: 'all-rounder',          label: 'All-rounder',              icon: '🔄' },
  { id: 'wicket-keeper',        label: 'Wicket-keeper',            icon: '🧤' },
  { id: 'wicket-keeper-batsman',label: 'Wicket-keeper Batsman',    icon: '🧤' },
]

const BATTING_HANDS = [
  { id: 'right-hand-bat', label: 'Right-hand Bat' },
  { id: 'left-hand-bat',  label: 'Left-hand Bat'  },
]

const BOWLING_STYLES = [
  { id: 'right-arm-fast',        label: 'Right-arm Fast'          },
  { id: 'right-arm-medium-fast', label: 'Right-arm Medium-fast'   },
  { id: 'right-arm-medium-pace', label: 'Right-arm Medium-pace'   },
  { id: 'right-arm-off-spin',    label: 'Right-arm Off-spin'      },
  { id: 'leg-spin',              label: 'Leg-spin (Wrist spin)'   },
  { id: 'left-arm-fast',         label: 'Left-arm Fast'           },
  { id: 'left-arm-medium-fast',  label: 'Left-arm Medium-fast'    },
  { id: 'left-arm-medium-pace',  label: 'Left-arm Medium-pace'    },
  { id: 'left-arm-orthodox',     label: 'Left-arm Orthodox Spin'  },
]

const ROLES_WITH_BATTING  = ['batsman', 'all-rounder', 'wicket-keeper', 'wicket-keeper-batsman']
const ROLES_WITH_BOWLING  = ['bowler', 'all-rounder']

function ToggleGroup({ options, value, onChange, cols = 2, accent = false }) {
  return (
    <div className={`grid grid-cols-${cols} gap-2`}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
            value === o.id
              ? accent
                ? 'border-accent bg-accent text-primary-dark'
                : 'border-primary-dark bg-primary-dark text-white'
              : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
          }`}
        >
          {o.icon && <span>{o.icon}</span>}
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function Signup() {
  const { signUp } = useAuth()
  const navigate   = useNavigate()

  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
    team: '', playingRole: '', battingHand: '', bowlingStyle: '',
  })
  const [error, setError]         = useState('')
  const [notAllowed, setNotAllowed] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)

  const handleChange = (e) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }))

  const setField = (key) => (val) =>
    setFormData((p) => {
      const next = { ...p, [key]: val }
      // Clear sub-fields when role changes
      if (key === 'playingRole') {
        next.battingHand  = ''
        next.bowlingStyle = ''
      }
      return next
    })

  const showBatting = ROLES_WITH_BATTING.includes(formData.playingRole)
  const showBowling = ROLES_WITH_BOWLING.includes(formData.playingRole)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.team)        { setError('Please select your team.'); return }
    if (!formData.playingRole) { setError('Please select your playing role.'); return }
    if (showBatting && !formData.battingHand)  { setError('Please select your batting hand.'); return }
    if (showBowling && !formData.bowlingStyle) { setError('Please select your bowling style.'); return }
    const digitsOnly = formData.phone.replace(/\D/g, '')
    if (!digitsOnly) { setError('Phone number is required.'); return }
    if (digitsOnly.length !== 10) { setError('Phone number must be exactly 10 digits.'); return }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); return }

    setLoading(true)
    setNotAllowed(false)
    try {
      const { data: allowed, error: rpcErr } = await supabase.rpc('is_email_allowed', { check_email: formData.email.trim() })
      if (rpcErr) throw rpcErr
      if (!allowed) {
        setNotAllowed(true)
        setLoading(false)
        return
      }
      await signUp(
        formData.email.trim(),
        formData.password,
        formData.fullName.trim(),
        formData.team,
        {
          phone:         formData.phone.trim() || null,
          playing_role:  formData.playingRole  || null,
          batting_hand:  formData.battingHand  || null,
          bowling_style: formData.bowlingStyle || null,
        },
      )
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
          <h2 className="font-display font-bold text-primary text-2xl mb-2">Welcome to NC Bulls Cricket Club!</h2>
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
        className="w-full max-w-lg"
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

          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">

            {/* ── Personal Details ── */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Personal Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input
                    type="text" name="fullName" value={formData.fullName}
                    onChange={handleChange} required autoComplete="name"
                    placeholder="Steve Jobs"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email" name="email" value={formData.email}
                    onChange={handleChange} required autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel" name="phone" value={formData.phone}
                    onChange={handleChange} required autoComplete="tel"
                    placeholder="+1 919 XXX XXXX"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* ── Team ── */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Team</h2>
              <ToggleGroup options={TEAMS} value={formData.team} onChange={setField('team')} cols={2} accent />
            </div>

            {/* ── Playing Profile ── */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Playing Profile</h2>
              <div className="space-y-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PLAYING_ROLES.map((r) => (
                      <button
                        key={r.id} type="button"
                        onClick={() => setField('playingRole')(r.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                          formData.playingRole === r.id
                            ? 'border-primary-dark bg-primary-dark text-white'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span>{r.icon}</span> {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence>
                  {showBatting && (
                    <motion.div
                      key="batting"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">Batting Hand</label>
                      <div className="grid grid-cols-2 gap-2">
                        {BATTING_HANDS.map((b) => (
                          <button
                            key={b.id} type="button"
                            onClick={() => setField('battingHand')(b.id)}
                            className={`px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                              formData.battingHand === b.id
                                ? 'border-accent bg-accent text-primary-dark'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {b.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {showBowling && (
                    <motion.div
                      key="bowling"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bowling Style</label>
                      <div className="grid grid-cols-2 gap-2">
                        {BOWLING_STYLES.map((b) => (
                          <button
                            key={b.id} type="button"
                            onClick={() => setField('bowlingStyle')(b.id)}
                            className={`px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                              formData.bowlingStyle === b.id
                                ? 'border-accent bg-accent text-primary-dark'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {b.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>

            {/* ── Security ── */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Security</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <input
                    type="password" name="password" value={formData.password}
                    onChange={handleChange} required autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                  <input
                    type="password" name="confirmPassword" value={formData.confirmPassword}
                    onChange={handleChange} required autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {notAllowed && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-4 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-amber-500 text-lg leading-none mt-0.5">⚠️</span>
                  <div>
                    <p className="font-semibold text-amber-800 mb-1">Your email isn't on our approved player list yet.</p>
                    <p className="text-amber-700 leading-relaxed">
                      Not a member yet? Submit a{' '}
                      <Link
                        to="/contact"
                        className="font-bold underline underline-offset-2 hover:text-amber-900 transition-colors"
                      >
                        Join Request
                      </Link>
                      {' '}and our admins will review it. Once approved, you'll be able to create your account.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
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
