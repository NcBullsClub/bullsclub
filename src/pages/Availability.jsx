import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import fixtures from '../data/fixtures.json'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const TEAMS = [
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls',   label: 'Royal Bulls' },
]

const STATUS_OPTIONS = [
  {
    value: 'in',
    label: "I'm In",
    emoji: '✅',
    idle:     'border-green-300 bg-green-50  text-green-700',
    selected: 'border-green-500 bg-green-500 text-white',
  },
  {
    value: 'out',
    label: "I'm Out",
    emoji: '❌',
    idle:     'border-red-300   bg-red-50    text-red-600',
    selected: 'border-red-500   bg-red-500   text-white',
  },
  {
    value: 'maybe',
    label: 'Maybe',
    emoji: '🤔',
    idle:     'border-amber-300 bg-amber-50  text-amber-700',
    selected: 'border-amber-400 bg-amber-400 text-white',
  },
]

function StatusPill({ value, count }) {
  if (!count) return null
  const opt = STATUS_OPTIONS.find((o) => o.value === value)
  const colors = {
    in:    'bg-green-50 text-green-700 border-green-200',
    out:   'bg-red-50   text-red-600   border-red-200',
    maybe: 'bg-amber-50 text-amber-700 border-amber-200',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium border px-2.5 py-1 rounded-full ${colors[value]}`}>
      {opt.emoji} {count} {value}
    </span>
  )
}

function FixtureCard({ fixture, availabilityMap, userResponseMap, financeMap, myPaymentPaid, financeLoaded, onResponseSaved }) {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const isRaising = fixture.team === 'raising-bulls'
  const teamLabel = isRaising ? 'Raising Bulls' : 'Royal Bulls'

  const [fy, fm, fd] = fixture.date.split('-').map(Number)
  const fixtureDate = new Date(fy, fm - 1, fd)
  const isPast = fixtureDate < new Date(new Date().setHours(0, 0, 0, 0))

  const key = `${fixture.date}::${fixture.team}`
  const counts = availabilityMap[key] || { in: 0, out: 0, maybe: 0, players: [] }
  const myResponse = userResponseMap[key]

  const [status, setStatus] = useState(myResponse?.status || '')
  const [notes, setNotes]   = useState(myResponse?.notes  || '')
  const [showNotes, setShowNotes] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState('')

  // Track if user changed anything from their existing response
  const hasChange = status !== (myResponse?.status || '') || notes !== (myResponse?.notes || '')

  useEffect(() => {
    setStatus(myResponse?.status || '')
    setNotes(myResponse?.notes  || '')
  }, [myResponse])

  const canRespond = user && !isPast && profile?.team === fixture.team

  async function handleSubmit(e) {
    e.preventDefault()
    if (!status) { setError('Please select your availability.'); return }
    setError('')
    setSaving(true)
    try {
      const { error: sbErr } = await supabase.from('availability').upsert(
        {
          user_id:          user.id,
          fixture_date:     fixture.date,
          fixture_opponent: fixture.opponent,
          fixture_team:     fixture.team,
          status,
          notes: notes.trim(),
        },
        { onConflict: 'user_id,fixture_date,fixture_team' },
      )
      if (sbErr) throw sbErr
      setSaved(true)
      onResponseSaved()
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const availablePlayers = counts.players
    .filter((p) => p.status === 'in' || p.status === 'maybe')
    .sort((a, b) => {
      // in before maybe, then alphabetical
      if (a.status !== b.status) return a.status === 'in' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  const outPlayers = counts.players
    .filter((p) => p.status === 'out')
    .sort((a, b) => a.name.localeCompare(b.name))

  function hasPaid(fullName) {
    const first = (fullName || '').split(' ')[0].toLowerCase()
    const key = Object.keys(financeMap).find(
      (k) => k.split('::')[0].toLowerCase() === first && k.split('::')[1] === fixture.team
    )
    return key ? financeMap[key] : null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Card header */}
      <div className={`px-4 py-3 flex items-center gap-3 ${isRaising ? 'bg-primary-dark' : 'bg-primary'}`}>
        <div className="bg-white/10 rounded-lg px-2.5 py-1.5 text-center flex-shrink-0 min-w-[48px]">
          <div className="text-accent font-display font-bold text-sm leading-none">
            {fixtureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          <div className="text-white/50 text-xs mt-0.5">{fixtureDate.getFullYear()}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1 mb-0.5">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isRaising ? 'bg-accent text-primary-dark' : 'bg-white/20 text-white'}`}>
              {teamLabel}
            </span>
            <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">{fixture.format}</span>
          </div>
          <div className="font-display font-bold text-white text-base leading-tight truncate">
            vs {fixture.opponent}
          </div>
          <div className="text-white/60 text-xs mt-0.5">
            {fixture.time} · {fixture.venue}
          </div>
        </div>
        {isPast && (
          <span className="text-xs bg-white/10 text-white/50 px-2 py-1 rounded-lg flex-shrink-0">Completed</span>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* ── SECTION 1: Mark availability (always shown for eligible users) */}
        {isPast ? (
          <div className="text-xs text-center text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
            This match has passed
          </div>
        ) : !user ? (
          <button
            onClick={() => {
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
              document.documentElement.scrollTop = 0
              document.body.scrollTop = 0
              navigate('/login', { state: { next: '/availability' } })
            }}
            className="w-full text-sm font-semibold text-center border-2 border-accent text-primary-dark rounded-xl px-4 py-2.5 hover:bg-accent transition-all"
          >
            Sign in to mark your availability
          </button>
        ) : isPast ? (
          <div className="text-xs text-center text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
            This match has passed
          </div>
        ) : profile && profile.team !== fixture.team ? (
          <div className="text-xs text-center text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
            Only {teamLabel} players can respond
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Status buttons + Save in one row */}
            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setStatus(opt.value); setError('') }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full border-2 text-xs font-semibold transition-all ${
                    status === opt.value ? opt.selected : opt.idle
                  }`}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
              <button
                type="submit"
                disabled={saving || !status || (!hasChange && !!myResponse)}
                className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-primary-dark text-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {saving ? (
                  <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                ) : saved ? '✓ Saved' : 'Save'}
              </button>
            </div>

            {/* Notes toggle */}
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowNotes(!showNotes)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showNotes ? '▲ Hide notes' : '+ Add a note (optional)'}
              </button>
              {showNotes && (
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. might be 15 min late…"
                  maxLength={300}
                  className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              )}
            </div>

            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </form>
        )}

        {/* ── PAYMENT BANNER: only shown when fee is unpaid */}
        {user && profile?.team === fixture.team && !isPast && financeLoaded && !myPaymentPaid && (
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-300 shadow-sm">
            {/* Banknotes icon */}
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
                <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z" clipRule="evenodd" />
                <path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-900 leading-tight">Season Fee Unpaid</p>
              <p className="text-[10px] text-amber-600 mt-0.5">Contact your admin to settle payment</p>
            </div>
            <div className="flex-shrink-0">
              <span className="inline-flex items-baseline gap-0.5 bg-red-500 text-white px-2.5 py-1 rounded-lg shadow-sm">
                <span className="text-sm font-black tabular-nums">$120</span>
                <span className="text-[9px] font-semibold uppercase tracking-wide ml-0.5">due</span>
              </span>
            </div>
          </div>
        )}

        {/* ── SECTION 2 & 3: Player list grouped by status */}
        {user && counts.players.length > 0 && (
          <details open={!isPast}>
            <summary className="flex items-center gap-2 cursor-pointer select-none list-none">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Players</span>
              {counts.in > 0 && (
                <span className="text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full">
                  ✅ {counts.in} in
                </span>
              )}
              {counts.maybe > 0 && (
                <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
                  🤔 {counts.maybe} maybe
                </span>
              )}
              {counts.out > 0 && (
                <span className="text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full">
                  ❌ {counts.out} out
                </span>
              )}
            </summary>

            <div className="mt-2">
            {/* In — alphabetical list */}
            {availablePlayers.filter((p) => p.status === 'in').length > 0 && (
              <div className="space-y-0.5 mb-1">
                {availablePlayers.filter((p) => p.status === 'in').map((p, i) => {
                  const paid = hasPaid(p.name)
                  return (
                    <div key={i} className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-green-50">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                      <span className="text-xs font-medium text-green-800 flex-1">{p.name.split(' ')[0]}</span>
                      {paid !== null && (
                        <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                          paid ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-50 text-red-500 border-red-200'
                        }`}>
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
                          {paid ? 'Paid' : 'Unpaid'}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Maybe — alphabetical list */}
            {availablePlayers.filter((p) => p.status === 'maybe').length > 0 && (
              <div className="space-y-0.5 mb-1">
                {availablePlayers.filter((p) => p.status === 'maybe').map((p, i) => {
                  const paid = hasPaid(p.name)
                  return (
                    <div key={i} className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-50">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                      <span className="text-xs font-medium text-amber-800 flex-1">{p.name.split(' ')[0]}</span>
                      <span className="ml-auto text-[10px] text-amber-500 font-normal">maybe</span>
                      {paid !== null && (
                        <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                          paid ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-50 text-red-500 border-red-200'
                        }`}>
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
                          {paid ? 'Paid' : 'Unpaid'}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Out — collapsible alphabetical list */}
            {outPlayers.length > 0 && (
              <details>
                <summary className="text-[10px] text-gray-400 cursor-pointer hover:text-gray-600 select-none py-0.5">
                  {outPlayers.length} not available
                </summary>
                <div className="space-y-0.5 mt-1">
                  {outPlayers.map((p, i) => {
                    const paid = hasPaid(p.name)
                    return (
                      <div key={i} className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-red-50">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                        <span className="text-xs font-medium text-red-700 flex-1">{p.name.split(' ')[0]}</span>
                        {paid !== null && (
                          <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                            paid ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-500 border-red-300'
                          }`}>
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
                            {paid ? 'Paid' : 'Unpaid'}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </details>
            )}
            </div>
          </details>
        )}

      </div>
    </motion.div>
  )
}

export default function Availability() {
  const [searchParams]  = useSearchParams()
  const { user, profile } = useAuth()

  const paramTeam    = searchParams.get('team')
  const paramFixture = searchParams.get('fixture')

  const defaultTeam = profile?.team || paramTeam || 'raising-bulls'
  const [teamFilter, setTeamFilter] = useState(defaultTeam)

  const [availabilityMap, setAvailabilityMap] = useState({})
  const [userResponseMap, setUserResponseMap] = useState({})
  const [loadingData, setLoadingData]         = useState(true)
  const [financeMap, setFinanceMap]           = useState({})
  const [financeLoaded, setFinanceLoaded]     = useState(false)

  const upcomingFixtures = fixtures.filter(
    (f) => f.status !== 'completed' && f.team === teamFilter,
  )

  async function loadData() {
    setLoadingData(true)
    try {
      const dates = upcomingFixtures.map((f) => f.date)
      if (dates.length === 0) { setLoadingData(false); return }

      const { data, error } = await supabase
        .from('availability')
        .select('fixture_date, fixture_team, status, notes, user_id, profiles(full_name)')
        .eq('fixture_team', teamFilter)
        .in('fixture_date', dates)

      if (error) throw error

      const agg = {}
      const mine = {}

      for (const row of data || []) {
        const k = `${row.fixture_date}::${row.fixture_team}`
        if (!agg[k]) agg[k] = { in: 0, out: 0, maybe: 0, players: [] }
        agg[k][row.status] = (agg[k][row.status] || 0) + 1
        agg[k].players.push({ name: row.profiles?.full_name || 'Unknown', status: row.status })

        if (user && row.user_id === user.id) {
          mine[k] = { status: row.status, notes: row.notes }
        }
      }

      setAvailabilityMap(agg)
      setUserResponseMap(mine)
    } catch {
      // silently skip
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => { loadData() }, [teamFilter, user])

  useEffect(() => {
    supabase
      .from('player_finances')
      .select('player_name, team, paid')
      .eq('season', '2026')
      .then(({ data }) => {
        const map = {}
        ;(data || []).forEach((r) => { map[`${r.player_name}::${r.team}`] = r.paid })
        setFinanceMap(map)
        setFinanceLoaded(true)
      })
  }, [])

  useEffect(() => {
    if (profile?.team) setTeamFilter(profile.team)
  }, [profile])

  useEffect(() => {
    if (paramFixture) {
      setTimeout(() => {
        const el = document.getElementById(`fixture-${paramFixture}`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 400)
    }
  }, [paramFixture])

  // A2HS
  const [showA2HS, setShowA2HS]         = useState(false)
  const [a2hsPlatform, setA2hsPlatform] = useState('ios')
  const [a2hsDismissed, setA2hsDismissed] = useState(false)
  const deferredPromptRef = useRef(null)

  useEffect(() => {
    const dismissed    = localStorage.getItem('a2hs-dismissed')
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    const ua = navigator.userAgent
    const ios     = /iphone|ipad|ipod/i.test(ua)
    const android = /android/i.test(ua)
    if (!isStandalone && (ios || android)) {
      setA2hsPlatform(ios ? 'ios' : 'android')
      if (dismissed) { setA2hsDismissed(true) } else { setShowA2HS(true) }
    }
  }, [])

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); deferredPromptRef.current = e }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleNativeInstall() {
    if (deferredPromptRef.current) {
      deferredPromptRef.current.prompt()
      const { outcome } = await deferredPromptRef.current.userChoice
      deferredPromptRef.current = null
      if (outcome === 'accepted') dismissA2HS()
    }
  }

  function dismissA2HS() {
    localStorage.setItem('a2hs-dismissed', '1')
    setShowA2HS(false)
    setA2hsDismissed(true)
  }

  function reopenA2HS() {
    localStorage.removeItem('a2hs-dismissed')
    setA2hsDismissed(false)
    setShowA2HS(true)
  }

  // Look up the logged-in player's own payment status
  const myPaymentStatus = (() => {
    if (!profile || !financeLoaded) return undefined
    const exactKey = `${profile.full_name}::${profile.team}`
    if (exactKey in financeMap) return financeMap[exactKey]
    // first-name fallback for name mismatches
    const fn = profile.full_name?.split(' ')[0]?.toLowerCase()
    const k = Object.keys(financeMap).find(
      (k) => k.split('::')[0].toLowerCase() === fn && k.split('::')[1] === profile.team
    )
    // default to unpaid (false) if loaded but no record found
    return k !== undefined ? financeMap[k] : false
  })()

  return (
    <div>
      {/* Floating re-open button — shows after A2HS is dismissed, mobile only */}
      {a2hsDismissed && !showA2HS && (
        <button
          onClick={reopenA2HS}
          className="fixed top-1/2 right-0 -translate-y-1/2 z-50 sm:hidden flex items-center gap-1.5 bg-accent text-primary-dark border border-accent-dark/40 rounded-l-full px-3 py-2.5 text-xs font-semibold shadow-lg active:scale-95 transition-transform"
          aria-label="Add to Home Screen"
        >
          <span>📲</span>
          <span>Add to Home Screen</span>
        </button>
      )}

      {/* Add to Home Screen — fixed bottom sheet, mobile only */}
      {showA2HS && (
        <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
          <div className="bg-white border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.15)] px-4 pt-4 pb-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary-dark flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-xl">📲</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900 leading-tight">Add to Home Screen</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Get the full app experience — fast &amp; easy</p>
                </div>
              </div>
              <button
                onClick={dismissA2HS}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 text-black hover:bg-gray-300 transition-colors flex-shrink-0 -mr-1"
                aria-label="Dismiss"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="h-px bg-gray-100 mb-3" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
              {a2hsPlatform === 'ios' ? '🍎 iPhone / iPad — Safari' : '🤖 Android — Chrome'}
            </p>
            <div className="space-y-2 mb-4">
              {a2hsPlatform === 'ios' ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary-dark text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">1</span>
                    <p className="text-xs text-gray-700">Tap the <span className="font-bold">Share</span> icon <span className="font-bold text-primary-dark">⬆</span> at the <span className="font-semibold">bottom</span> of Safari</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary-dark text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">2</span>
                    <p className="text-xs text-gray-700">Scroll down and tap <span className="font-bold">&ldquo;Add to Home Screen&rdquo;</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary-dark text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">3</span>
                    <p className="text-xs text-gray-700">Tap <span className="font-bold">&ldquo;Add&rdquo;</span> in the top-right corner — done!</p>
                  </div>
                </>
              ) : (
                <>
                  {deferredPromptRef.current ? (
                    <button
                      onClick={handleNativeInstall}
                      className="w-full py-3 rounded-xl bg-primary-dark text-accent font-bold text-sm flex items-center justify-center gap-2"
                    >
                      <span>📲</span> Tap to Install App
                    </button>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-primary-dark text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">1</span>
                        <p className="text-xs text-gray-700">Tap the <span className="font-bold">⋮</span> menu in the <span className="font-semibold">top-right</span> of Chrome</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-primary-dark text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">2</span>
                        <p className="text-xs text-gray-700">Tap <span className="font-bold">&ldquo;Add to Home Screen&rdquo;</span> or <span className="font-bold">&ldquo;Install App&rdquo;</span></p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-primary-dark text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">3</span>
                        <p className="text-xs text-gray-700">Tap <span className="font-bold">&ldquo;Add&rdquo;</span> to confirm — done!</p>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
            <button
              onClick={dismissA2HS}
              className="w-full text-center text-[11px] text-gray-400 hover:text-gray-600 transition-colors py-1"
            >
              Don't show this again
            </button>
          </div>
        </div>
      )}

      <section className="bg-primary-dark text-white py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl md:text-6xl font-bold mb-1 md:mb-3 text-center">
              PLAYER <span className="text-accent">AVAILABILITY</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-lg max-w-2xl mx-auto text-center">
              Let your captain know if you can make the next match.
            </p>
            {user && profile && (
              <div className="flex flex-col items-center gap-3 mt-5">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm">
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-primary-dark font-bold text-xs">
                    {profile.full_name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-white font-medium">{profile.full_name}</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-accent text-xs font-semibold">
                    {profile.team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'}
                  </span>
                </div>

                {/* Payment status tag for the logged-in player */}
                {myPaymentStatus !== undefined && (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full ${
                    myPaymentStatus
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                  }`}>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
                      <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z" clipRule="evenodd" />
                      <path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
                    </svg>
                    {myPaymentStatus ? '$120 · Season Fee Paid' : '$120 Due · Season Fee Unpaid'}
                  </span>
                )}
              </div>
            )}
            {!user && (
              <div className="flex justify-center mt-5">
                <Link to="/login" className="btn-primary text-sm">
                  Sign in to submit your availability →
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="bg-white sticky top-16 z-30 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex gap-2">
          {TEAMS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTeamFilter(t.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                teamFilter === t.id ? 'bg-primary-dark text-accent' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="py-6 md:py-12 bg-surface min-h-[60vh]">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
          {loadingData && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loadingData && upcomingFixtures.length === 0 && (
            <div className="text-center py-24 text-gray-400">
              <div className="text-5xl mb-4">🏏</div>
              <div className="font-display font-bold text-xl text-gray-500 mb-2">No upcoming fixtures</div>
              <p className="text-sm mb-6">Check back once the next schedule is announced.</p>
              <Link to="/fixtures" className="btn-primary text-sm">View All Fixtures</Link>
            </div>
          )}

          {!loadingData && upcomingFixtures.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcomingFixtures.map((f) => (
                <div key={f.id} id={`fixture-${f.id}`}>
                  <FixtureCard
                    fixture={f}
                    availabilityMap={availabilityMap}
                    userResponseMap={userResponseMap}
                    financeMap={financeMap}
                    myPaymentPaid={myPaymentStatus}
                    financeLoaded={financeLoaded}
                    onResponseSaved={loadData}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
