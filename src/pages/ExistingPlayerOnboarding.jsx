import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

// ── Constants ─────────────────────────────────────────────────────────────────

const TEAMS = [
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls',   label: 'Royal Bulls' },
]

const PLAYING_ROLES = [
  { id: 'batsman',               label: 'Batsman',               icon: '🏏' },
  { id: 'bowler',                label: 'Bowler',                icon: '⚡' },
  { id: 'all-rounder',           label: 'All-Rounder',           icon: '🌟' },
  { id: 'wicket-keeper',         label: 'Wicket-Keeper',         icon: '🧤' },
  { id: 'wicket-keeper-batsman', label: 'Wicket-Keeper Batsman', icon: '🧤' },
  { id: 'beginner',              label: 'Beginner / Learning',   icon: '🌱' },
]

const BATTING_HANDS = [
  { id: 'right-hand-bat', label: 'Right-Hand Bat' },
  { id: 'left-hand-bat',  label: 'Left-Hand Bat' },
]

const BOWLING_STYLES = [
  { id: 'right-arm-fast',        label: 'Right-Arm Fast' },
  { id: 'right-arm-medium-fast', label: 'Right-Arm Medium-Fast' },
  { id: 'right-arm-medium-pace', label: 'Right-Arm Medium-Pace' },
  { id: 'right-arm-off-spin',    label: 'Right-Arm Off-Spin' },
  { id: 'leg-spin',              label: 'Leg-Spin (Wrist Spin)' },
  { id: 'left-arm-fast',         label: 'Left-Arm Fast' },
  { id: 'left-arm-medium-fast',  label: 'Left-Arm Medium-Fast' },
  { id: 'left-arm-medium-pace',  label: 'Left-Arm Medium-Pace' },
  { id: 'left-arm-orthodox',     label: 'Left-Arm Orthodox Spin' },
]

const ROLES_WITH_BATTING = ['batsman', 'all-rounder', 'wicket-keeper', 'wicket-keeper-batsman']
const ROLES_WITH_BOWLING = ['bowler', 'all-rounder']

// ── ToggleGroup helper ────────────────────────────────────────────────────────

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

// ── Main Component ────────────────────────────────────────────────────────────

export default function ExistingPlayerOnboarding() {
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '',
    team: '', playing_role: '', batting_hand: '', bowling_style: '', message: '',
  })
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const setField = (key) => (val) =>
    setFormData((prev) => {
      const next = { ...prev, [key]: val }
      if (key === 'playing_role') {
        next.batting_hand  = ''
        next.bowling_style = ''
      }
      return next
    })

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const showBatting = ROLES_WITH_BATTING.includes(formData.playing_role)
  const showBowling = ROLES_WITH_BOWLING.includes(formData.playing_role)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.team)         { setError('Please select your team.'); return }
    if (!formData.playing_role) { setError('Please select your playing role.'); return }
    if (showBatting && !formData.batting_hand)  { setError('Please select your batting hand.'); return }
    if (showBowling && !formData.bowling_style) { setError('Please select your bowling style.'); return }

    // Check for duplicate submission
    const { data: existing } = await supabase
      .from('join_requests')
      .select('id, status')
      .eq('email', formData.email.trim().toLowerCase())
      .eq('request_type', 'existing_player')
      .maybeSingle()

    if (existing) {
      if (existing.status === 'approved') {
        setError('Your request has already been approved. Please proceed to Sign Up to create your account.')
      } else if (existing.status === 'pending') {
        setError('You already have a pending request. An admin will review it shortly.')
      } else {
        setError('A request for this email was previously submitted. Please contact an admin if you need help.')
      }
      return
    }

    setLoading(true)
    const { error: err } = await supabase.from('join_requests').insert({
      full_name:    formData.full_name.trim(),
      email:        formData.email.trim().toLowerCase(),
      phone:        formData.phone.trim() || null,
      team:         formData.team,
      playing_role: formData.playing_role,
      batting_hand: formData.batting_hand || null,
      bowling_style:formData.bowling_style || null,
      message:      formData.message.trim() || null,
      request_type: 'existing_player',
    })
    setLoading(false)

    if (err) { setError(err.message); return }
    setSubmitted(true)
  }

  // ── Success screen ───────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-[90vh] bg-surface flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-10 text-center"
        >
          <div className="text-5xl mb-4">🏏</div>
          <h2 className="font-display font-bold text-primary text-2xl mb-2">
            Request Received!
          </h2>
          <p className="text-gray-500 text-sm mb-3 leading-relaxed">
            Your details have been submitted to the club admins for review.
            Once approved, you will receive confirmation and can complete your
            account setup at the link below — it only takes a minute.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-left">
            <p className="text-xs font-semibold text-amber-700 mb-0.5">Next step after approval</p>
            <p className="text-xs text-amber-600">
              Visit <span className="font-mono font-semibold">/signup</span> with the same email address to set your password and activate your account.
            </p>
          </div>
          <Link to="/" className="btn-primary">Back to Home</Link>
        </motion.div>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[90vh] bg-surface px-4 py-16">
      <div className="max-w-lg mx-auto">

        {/* ── Professional announcement banner ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-primary-dark rounded-2xl px-6 py-5 text-center"
        >
          <span className="inline-block bg-accent/20 text-accent text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            Temporary · Existing Members Only
          </span>
          <h1 className="font-display font-bold text-white text-2xl mb-2">
            NC <span className="text-accent">BULLS</span> — Player Onboarding
          </h1>
          <p className="text-gray-300 text-sm leading-relaxed">
            We're streamlining how existing players join the club portal. Instead
            of submitting a join request <em>and</em> signing up separately, simply
            complete this single form with your full playing profile. Once an admin
            approves your submission, you'll only need to set a password to
            activate your account — everything else is already done.
          </p>
          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-accent/30 text-accent flex items-center justify-center font-bold text-[10px]">1</span>
              Fill this form
            </span>
            <span className="text-gray-600">→</span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-accent/30 text-accent flex items-center justify-center font-bold text-[10px]">2</span>
              Admin approves
            </span>
            <span className="text-gray-600">→</span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-accent/30 text-accent flex items-center justify-center font-bold text-[10px]">3</span>
              Set password &amp; done
            </span>
          </div>
        </motion.div>

        {/* ── Form card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">

            {/* Personal Details */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Personal Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input
                    type="text" name="full_name" value={formData.full_name}
                    onChange={handleChange} required autoComplete="name"
                    placeholder="Steve Smith"
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
                  <p className="mt-1.5 text-xs text-gray-400">Use the email you'll sign in with — this locks your approved slot.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="tel" name="phone" value={formData.phone}
                    onChange={handleChange} autoComplete="tel"
                    placeholder="+1 919 XXX XXXX"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Team */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Your Team</h2>
              <ToggleGroup
                options={TEAMS}
                value={formData.team}
                onChange={setField('team')}
                cols={2}
                accent
              />
            </div>

            {/* Playing Profile */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Playing Profile</h2>
              <div className="space-y-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PLAYING_ROLES.map((r) => (
                      <button
                        key={r.id} type="button"
                        onClick={() => setField('playing_role')(r.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                          formData.playing_role === r.id
                            ? 'border-primary-dark bg-primary-dark text-white'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <span>{r.icon}</span>{r.label}
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
                      <ToggleGroup
                        options={BATTING_HANDS}
                        value={formData.batting_hand}
                        onChange={setField('batting_hand')}
                        cols={2}
                      />
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
                      <ToggleGroup
                        options={BOWLING_STYLES}
                        value={formData.bowling_style}
                        onChange={setField('bowling_style')}
                        cols={2}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Optional note */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                Anything Else? <span className="text-gray-300 font-normal normal-case tracking-normal">(optional)</span>
              </h2>
              <textarea
                name="message" value={formData.message}
                onChange={handleChange}
                rows={3}
                placeholder="Cricket experience, availability notes, questions for admin…"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting…
                </>
              ) : (
                'Submit Onboarding Request'
              )}
            </button>

            <p className="text-center text-xs text-gray-400">
              Already approved?{' '}
              <Link to="/signup" className="text-primary font-medium hover:text-accent transition-colors">
                Go to Sign Up →
              </Link>
            </p>
          </form>
        </motion.div>

        {/* Footer note */}
        <p className="mt-4 text-center text-xs text-gray-400 px-4">
          This form is temporarily available for existing NC Bulls players only.
          New to the club? Use the{' '}
          <Link to="/contact" className="underline hover:text-primary transition-colors">Join the Bulls</Link>{' '}
          page instead.
        </p>
      </div>
    </div>
  )
}
