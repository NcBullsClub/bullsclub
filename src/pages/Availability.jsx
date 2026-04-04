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

  const key = `${fixture.date}::${fixture.team}`
  const counts = availabilityMap[key] || { in: 0, out: 0, maybe: 0, players: [] }
  const myResponse = userResponseMap[key]

  const [expanded, setExpanded] = useState(false)
  const [status, setStatus]     = useState(myResponse?.status || '')
  const [notes, setNotes]       = useState(myResponse?.notes  || '')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    setStatus(myResponse?.status || '')
    setNotes(myResponse?.notes  || '')
  }, [myResponse])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!status) { setError('Please select a status.'); return }
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
      setExpanded(false)
      onResponseSaved()
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`bg-white border-2 rounded-2xl p-5 transition-all ${
        expanded ? 'border-accent shadow-lg' : 'border-gray-200 hover:border-accent/40 hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="bg-primary-dark text-white rounded-xl px-3 py-2 text-center flex-shrink-0">
          {(() => {
            const [y, m, d] = fixture.date.split('-').map(Number)
            const date = new Date(y, m - 1, d)
            return (
              <>
                <div className="text-accent font-display font-bold text-base leading-none">
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="text-gray-400 text-xs mt-0.5">{date.getFullYear()}</div>
              </>
            )
          })()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isRaising ? 'bg-primary-dark text-accent' : 'bg-primary text-white'}`}>
              {teamLabel}
            </span>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{fixture.format}</span>
          </div>
          <div className="font-display font-bold text-primary text-lg leading-tight truncate">
            vs {fixture.opponent}
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-1">⏰ {fixture.time}</p>
      <p className="text-sm text-gray-500 mb-4 truncate">📍 {fixture.venue}</p>

      {user ? (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <StatusPill value="in"    count={counts.in}    />
            <StatusPill value="out"   count={counts.out}   />
            <StatusPill value="maybe" count={counts.maybe} />
            {!counts.in && !counts.out && !counts.maybe && (
              <span className="text-xs text-gray-400">No responses yet</span>
            )}
          </div>

          {counts.players.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Responses</div>
              <div className="flex flex-wrap gap-1.5">
                {counts.players.map((p, i) => {
                  const opt = STATUS_OPTIONS.find((o) => o.value === p.status)
                  return (
                    <span
                      key={i}
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${
                    p.status === 'in'    ? 'bg-green-50 text-green-700 border-green-200' :
                    p.status === 'out'   ? 'bg-red-50   text-red-600   border-red-200'   :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {opt?.emoji} {p.name}
                </span>
              )
            })}
          </div>
        </div>
      )}
        </>
      ) : (
        <div className="flex items-center gap-2 mb-4 text-xs text-gray-400 border border-gray-100 rounded-xl px-3 py-2 bg-gray-50">
          🔒 Sign in to see team responses
        </div>
      )}

      {!user ? (
        <button
          onClick={() => navigate('/login', { state: { next: '/availability' } })}
          className="w-full text-sm font-semibold text-center border-2 border-accent text-primary-dark rounded-xl px-4 py-2.5 hover:bg-accent transition-all"
        >
          Sign in to mark your availability
        </button>
      ) : profile && profile.team !== fixture.team ? (
        <div className="w-full text-sm text-center text-gray-400 border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50">
          Only {fixture.team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'} players can respond to this fixture
        </div>
      ) : saved ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center text-sm font-semibold text-green-700"
        >
          ✓ Saved! You're marked as <span className="capitalize">{status}</span>
        </motion.div>
      ) : myResponse && !expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="w-full text-sm font-semibold text-center border-2 border-gray-200 text-gray-600 rounded-xl px-4 py-2.5 hover:border-accent hover:text-primary-dark transition-all"
        >
          You're <span className="capitalize font-bold">{myResponse.status}</span> — tap to update
        </button>
      ) : !expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="w-full text-sm font-semibold text-center border-2 border-accent text-primary-dark rounded-xl px-4 py-2.5 hover:bg-accent transition-all"
        >
          🏏 Mark My Availability
        </button>
      ) : null}

      <AnimatePresence>
        {expanded && (
          <motion.form
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="mt-4 pt-4 border-t border-gray-100 space-y-4 overflow-hidden"
          >
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
              <span className="font-medium text-gray-800">{profile?.full_name}</span>
              {profile?.team && (
                <>
                  <span className="text-gray-400">·</span>
                  <span>{profile.team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'}</span>
                </>
              )}
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">
                Your availability <span className="text-red-500">*</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full border-2 text-sm font-semibold transition-all ${
                      status === opt.value ? opt.selected : opt.idle
                    }`}
                  >
                    {opt.emoji} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Notes <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. might be 15 min late…"
                maxLength={300}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-sm px-6 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-primary-dark border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </span>
                ) : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => { setExpanded(false); setError('') }}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
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
