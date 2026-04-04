import { useState, useEffect } from 'react'
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

function FixtureCard({ fixture, availabilityMap, userResponseMap, onResponseSaved }) {
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
        {!user ? (
          <button
            onClick={() => navigate('/login', { state: { next: '/availability' } })}
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

        {/* ── SECTION 2: Counts */}
        {user && (counts.in > 0 || counts.out > 0 || counts.maybe > 0) && (
          <div className="flex gap-2">
            {counts.in > 0 && (
              <div className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                ✅ {counts.in} In
              </div>
            )}
            {counts.maybe > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                🤔 {counts.maybe} Maybe
              </div>
            )}
            {counts.out > 0 && (
              <div className="flex items-center gap-1.5 bg-red-50 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                ❌ {counts.out} Out
              </div>
            )}
          </div>
        )}

        {/* ── SECTION 3: Available players list */}
        {user && counts.players.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Available Players
            </div>
            <div className="space-y-1">
              {availablePlayers.map((p, i) => (
                <div key={i} className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg ${
                  p.status === 'in' ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'
                }`}>
                  <span className="flex-shrink-0">{p.status === 'in' ? '✅' : '🤔'}</span>
                  <span className="font-medium truncate">{p.name}</span>
                  {p.status === 'maybe' && <span className="ml-auto text-amber-500 text-xs">maybe</span>}
                </div>
              ))}
              {outPlayers.length > 0 && (
                <details className="mt-1">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none">
                    {outPlayers.length} not available
                  </summary>
                  <div className="mt-1 space-y-1">
                    {outPlayers.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700">
                        <span>❌</span>
                        <span className="truncate">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
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

  return (
    <div>
      <section className="bg-primary-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-3 text-center">
              PLAYER <span className="text-accent">AVAILABILITY</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto text-center">
              Let your captain know if you can make the next match.
            </p>
            {user && profile && (
              <div className="flex justify-center mt-5">
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

      <section className="py-12 bg-surface min-h-[60vh]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
