import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useSeason } from '../contexts/SeasonContext'
import { SEASONS } from '../config/seasons'
import SeasonSwitcher, { SeasonSwitcherInline } from '../components/ui/SeasonSwitcher'

const TEAMS = [
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls',   label: 'Royal Bulls' },
]

function formatMoney(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return '$0'
  return `$${num.toFixed(2)}`
}

function getSeasonTagText(seasonId) {
  if (!seasonId) return 'Season TBD'
  const season = SEASONS.find((s) => s.id === seasonId)
  if (season) return `${season.shortLabel} '${String(season.year).slice(-2)}`
  return String(seasonId).replace(/-/g, ' ')
}

function normalizeFixtureType(value) {
  const v = String(value || '').trim().toLowerCase()
  if (!v || v === 'mega bash' || v === 'mega smash' || v === 'league') return 'League'
  if (v === 'playoff' || v === 'playoffs' || v === 'quarterfinal' || v === 'quarterfinals' || v === 'qualifier' || v === 'qualifiers') return 'Playoffs'
  if (v === 'semifinal' || v === 'semi final' || v === 'semi-final' || v === 'semifinals' || v === 'semis') return 'SemiFinal'
  if (v === 'championship' || v === 'final') return 'Championship'
  return 'League'
}

function normalizeDivisionLabel(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const m = raw.match(/^d(?:iv)?[-\s]?(\d+)$/i)
  if (m) return `Div-${m[1]}`
  return raw
}

function getPaymentSummary(finance, fallbackAmount = 120) {
  const parsedAmount = Number(finance?.amountDue ?? finance?.amount_due ?? 0)
  const isPaid = !!finance?.paid

  if (isPaid && parsedAmount >= fallbackAmount) {
    return { isPaid: true, remaining: 0, label: 'Season Fee Paid' }
  }

  if (isPaid && Number.isFinite(parsedAmount) && parsedAmount > 0 && parsedAmount < fallbackAmount) {
    return {
      isPaid: false,
      remaining: fallbackAmount - parsedAmount,
      label: 'Partial payment',
    }
  }

  const remaining = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : fallbackAmount
  return {
    isPaid: false,
    remaining,
    label: remaining < fallbackAmount ? 'Remaining balance' : 'Season Fee Unpaid',
  }
}

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

function FixtureCard({ fixture, availabilityMap, userResponseMap, myPaymentFinance, financeLoaded, onResponseSaved }) {
  const { user, profile } = useAuth()
  const { activeSeason } = useSeason()
  const navigate = useNavigate()
  const isRaising = fixture.team === 'raising-bulls'
  const teamLabel = isRaising ? 'Raising Bulls' : 'Royal Bulls'
  const seasonTag = fixture.season ? getSeasonTagText(fixture.season) : (activeSeason?.id ? getSeasonTagText(activeSeason.id) : 'Season TBD')
  const fixtureTypeTag = normalizeFixtureType(fixture.type)
  const divisionTag = normalizeDivisionLabel(fixture.division || (isRaising ? 'D5' : 'D9'))

  const [fy, fm, fd] = fixture.date.split('-').map(Number)
  const fixtureDate = new Date(fy, fm - 1, fd)
  const fixtureWeekday = fixtureDate.toLocaleDateString('en-US', { weekday: 'short' })
  const isPast = (() => {
    if (fixture.time) {
      const match = fixture.time.match(/(\d+):(\d+)\s*(AM|PM)/i)
      if (match) {
        let hours = parseInt(match[1], 10)
        const minutes = parseInt(match[2], 10)
        const meridiem = match[3].toUpperCase()
        if (meridiem === 'PM' && hours !== 12) hours += 12
        if (meridiem === 'AM' && hours === 12) hours = 0
        return new Date(fy, fm - 1, fd, hours, minutes, 0) < new Date()
      }
    }
    // no time — treat as past only after the full day ends
    return new Date(fy, fm - 1, fd, 23, 59, 59) < new Date()
  })()

  const key = `${fixture.date}::${fixture.team}`
  const counts = availabilityMap[key] || { in: 0, out: 0, maybe: 0, players: [] }
  const myResponse = userResponseMap[key]
  const paymentSummary = getPaymentSummary(myPaymentFinance, 120)
  const isPartialPayment = !paymentSummary.isPaid && paymentSummary.remaining > 0 && paymentSummary.remaining < 120
  const isFullUnpaid = !paymentSummary.isPaid && paymentSummary.remaining >= 120

  const [status, setStatus] = useState(myResponse?.status || '')
  const [notes, setNotes]   = useState(myResponse?.notes  || '')
  const [showNotes, setShowNotes] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState('')
  const lastTapRef = useRef({ value: '', ts: 0 })

  useEffect(() => {
    setStatus(myResponse?.status || '')
    setNotes(myResponse?.notes  || '')
  }, [myResponse])

  const canRespond = user && !isPast && profile?.team === fixture.team

  async function saveResponse(newStatus, newNotes) {
    setError('')
    setSaving(true)
    try {
      const { error: sbErr } = await supabase.from('availability').upsert(
        {
          user_id:          user.id,
          fixture_date:     fixture.date,
          fixture_opponent: fixture.opponent,
          fixture_team:     fixture.team,
          status:           newStatus,
          notes:            (newNotes ?? notes).trim(),
          user_name:        profile?.full_name || 'Unknown',
        },
        { onConflict: 'user_id,fixture_date,fixture_team' },
      )
      if (sbErr) throw sbErr
      setSaved(true)
      onResponseSaved()
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('row-level security') || msg.includes('RLS') || msg.includes('policy')) {
        setError('You are not currently in the players list. Please contact an admin to restore your access.')
      } else {
        setError(msg || 'Failed to save. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function clearResponse() {
    if (!myResponse) { setStatus(''); return }
    setError('')
    setSaving(true)
    try {
      const { error: sbErr } = await supabase.from('availability')
        .delete()
        .eq('user_id', user.id)
        .eq('fixture_date', fixture.date)
        .eq('fixture_team', fixture.team)
      if (sbErr) throw sbErr
      setStatus('')
      setNotes('')
      onResponseSaved()
    } catch (err) {
      setError(err.message || 'Failed to clear. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Single tap: select & save. Double-tap selected option: clear.
  function handleStatusClick(value) {
    if (saving) return
    if (status !== value) {
      lastTapRef.current = { value: '', ts: 0 }
      setStatus(value)
      saveResponse(value)
      return
    }

    const now = Date.now()
    const last = lastTapRef.current
    const isDoubleTap = last.value === value && now - last.ts <= 350

    if (isDoubleTap) {
      lastTapRef.current = { value: '', ts: 0 }
      clearResponse()
    } else {
      lastTapRef.current = { value, ts: now }
    }
  }

  async function handleNotesSave() {
    if (!status) return
    await saveResponse(status, notes)
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
      <div className={`relative overflow-hidden px-4 py-3 flex items-center gap-3 ${isRaising ? 'bg-primary-dark' : 'bg-primary'}`}>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-40 h-30 pointer-events-none z-0 opacity-70">
          <img
            src="/icons/cricket_batting.png"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="bg-white/10 rounded-lg px-2.5 py-1.5 text-center flex-shrink-0 min-w-[48px]">
          <div className="text-accent font-display font-bold text-sm leading-none">
            {fixtureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          <div className="text-white/50 text-xs mt-0.5">{fixtureDate.getFullYear()}</div>
          <div
            className={`mt-1 inline-flex items-center justify-center text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${
              isRaising
                ? 'text-accent bg-accent/10 border-accent/40'
                : 'text-white bg-white/10 border-white/30'
            }`}
          >
            {fixtureWeekday}
          </div>
        </div>
        <div className="relative z-10 flex-1 min-w-0 pr-20">
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
            {fixture.time}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {divisionTag && (
              <span className="text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded-full">{divisionTag}</span>
            )}
            <span className="text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded-full">{seasonTag}</span>
          </div>
        </div>
        {isPast && (
          <span className="relative z-10 text-xs bg-white/10 text-white/50 px-2 py-1 rounded-lg flex-shrink-0">Completed</span>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Venue / time info row */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
          {fixture.venue && (
            <span>📍 {fixture.venue}</span>
          )}
          {fixture.time && (
            <>
              {fixture.venue && <span>·</span>}
              <span>⏰ {fixture.time}</span>
            </>
          )}
          <span className="inline-flex items-center text-[10px] font-medium bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 rounded-full">
            {fixtureTypeTag}
          </span>
          {(fixture.venue_address || fixture.venue) && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fixture.venue + (fixture.venue_address ? `, ${fixture.venue_address}` : ''))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors"
            >
              <svg className="w-3 h-3 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.013 3.5-4.628 3.5-7.327A8 8 0 004 12c0 2.699 1.556 5.315 3.5 7.327a19.58 19.58 0 002.683 2.282 16.974 16.974 0 001.144.742zM12 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" />
              </svg>
              Open in Maps
            </a>
          )}
        </div>

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
          <div>
            {/* Status buttons — single click saves, click again clears */}
            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = status === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleStatusClick(opt.value)}
                    disabled={saving}
                    title={isSelected ? 'Double tap to clear' : `Mark as ${opt.label}`}
                    className={`relative flex items-center gap-1 px-3 py-1.5 rounded-full border-2 text-xs font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                      isSelected ? opt.selected : opt.idle
                    }`}
                  >
                    {saving && isSelected ? (
                      <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      opt.emoji
                    )}
                    {opt.label}
                    {saved && isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-green-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold">✓</span>
                    )}
                  </button>
                )
              })}
              {status && !saving && (
                <span className="text-[10px] text-gray-400 ml-1">double tap selected option to clear</span>
              )}
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
                <div className="mt-1.5 flex gap-2 items-start">
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. might be 15 min late…"
                    maxLength={300}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  />
                  {status && (
                    <button
                      type="button"
                      onClick={handleNotesSave}
                      disabled={saving}
                      className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary-dark text-accent disabled:opacity-40 transition-all"
                    >
                      {saving ? <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin inline-block" /> : 'Save note'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
        )}

        {/* ── PAYMENT BANNER: only shown when fee is unpaid */}
        {user && profile?.team === fixture.team && !isPast && financeLoaded && !paymentSummary.isPaid && (
          <div className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border shadow-sm ${isPartialPayment ? 'bg-amber-50 border-amber-300' : 'bg-red-50 border-red-300'}`}>
            {/* Banknotes icon */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${isPartialPayment ? 'bg-amber-500' : 'bg-red-500'} flex items-center justify-center shadow-sm`}>
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
                <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z" clipRule="evenodd" />
                <path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold leading-tight ${isPartialPayment ? 'text-amber-900' : 'text-red-800'}`}>
                {isPartialPayment ? 'Partial Payment' : 'Season Fee Unpaid'}
              </p>
              <p className={`text-[10px] mt-0.5 ${isPartialPayment ? 'text-amber-700' : 'text-red-600'}`}>
                {isPartialPayment ? 'Pay the remaining balance to complete the season fee' : 'Contact your admin to settle payment'}
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className={`inline-flex items-baseline gap-0.5 text-white px-2.5 py-1 rounded-lg shadow-sm ${isPartialPayment ? 'bg-amber-500' : 'bg-red-500'}`}>
                <span className="text-sm font-black tabular-nums">{formatMoney(paymentSummary.remaining)}</span>
                <span className="text-[9px] font-semibold uppercase tracking-wide ml-0.5">
                  {isPartialPayment ? 'remaining' : 'due'}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* ── SECTION 2 & 3: Player list — two columns */}
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

            <div className="mt-2 grid grid-cols-2 gap-x-3">
              {/* Column 1: Available (in) */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-green-600 mb-1">✅ Available</div>
                {availablePlayers.filter((p) => p.status === 'in').length === 0 ? (
                  <div className="text-[10px] text-gray-400 italic">None yet</div>
                ) : (
                  <div className="space-y-0.5">
                    {availablePlayers.filter((p) => p.status === 'in').map((p, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-50">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                        <span className="text-xs font-medium text-green-800 flex-1 truncate">{p.name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Column 2: Maybe + Out */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Out / Maybe</div>
                {availablePlayers.filter((p) => p.status === 'maybe').length === 0 && outPlayers.length === 0 ? (
                  <div className="text-[10px] text-gray-400 italic">None yet</div>
                ) : (
                  <div className="space-y-0.5">
                    {availablePlayers.filter((p) => p.status === 'maybe').map((p, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                        <span className="text-xs font-medium text-amber-800 flex-1 truncate">{p.name.split(' ')[0]}</span>
                      </div>
                    ))}
                    {outPlayers.map((p, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-50">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                        <span className="text-xs font-medium text-red-700 flex-1 truncate">{p.name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </details>
        )}

      </div>
    </motion.div>
  )
}

// ── Umpiring Assignment Card ───────────────────────────────────────────────
function UmpCard({ assignment, umpAvailMap, myUmpResponseMap, onResponseSaved, seasonId }) {
  const { user, profile } = useAuth()
  const isRaising = assignment.ncb_team === 'raising-bulls'
  const teamLabel = isRaising ? 'Raising Bulls' : 'Royal Bulls'

  const [ay, am, ad]   = assignment.date.split('-').map(Number)
  const assignmentDate = new Date(ay, am - 1, ad)
  const assignmentWeekday = assignmentDate.toLocaleDateString('en-US', { weekday: 'short' })
  const isPast         = assignmentDate < new Date(new Date().setHours(0, 0, 0, 0))

  const counts     = umpAvailMap[assignment.id]     || { in: 0, out: 0, maybe: 0, names: [] }
  const myResponse = myUmpResponseMap[assignment.id]

  const [status, setStatus] = useState(myResponse?.status || '')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')
  const lastTapRef = useRef({ value: '', ts: 0 })

  useEffect(() => {
    setStatus(myResponse?.status || '')
  }, [myResponse])

  const canRespond = user && !isPast && profile?.team === assignment.ncb_team

  async function saveResponse(newStatus) {
    if (!user) return
    setError('')
    setSaving(true)
    try {
      const { error: sbErr } = await supabase.from('umpiring_availability').upsert(
        {
          user_id:               user.id,
          umpiring_assignment_id: assignment.id,
          season:                seasonId,
          ncb_team:              assignment.ncb_team,
          status:                newStatus,
          notes:                 '',
          user_name:             profile?.full_name || 'Unknown',
          updated_at:            new Date().toISOString(),
        },
        { onConflict: 'user_id,umpiring_assignment_id' },
      )
      if (sbErr) throw sbErr
      setSaved(true)
      onResponseSaved()
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      const msg = err.message || ''
      if (msg.includes('row-level security') || msg.includes('RLS') || msg.includes('policy')) {
        setError('You are not currently in the players list. Please contact an admin to restore your access.')
      } else {
        setError(msg || 'Failed to save.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function clearResponse() {
    if (!myResponse && !status) {
      setStatus('')
      return
    }

    setError('')
    setSaving(true)
    try {
      const { error: sbErr } = await supabase.from('umpiring_availability')
        .delete()
        .eq('user_id', user.id)
        .eq('umpiring_assignment_id', assignment.id)
      if (sbErr) throw sbErr
      setStatus('')
      setSaved(false)
      onResponseSaved()
    } catch (err) {
      setError(err.message || 'Failed to clear.')
    } finally {
      setSaving(false)
    }
  }

  function handleStatusClick(value) {
    if (saving) return

    if (status !== value) {
      lastTapRef.current = { value: '', ts: 0 }
      setStatus(value)
      saveResponse(value)
      return
    }

    const now = Date.now()
    const last = lastTapRef.current
    const isDoubleTap = last.value === value && now - last.ts <= 350

    if (isDoubleTap) {
      lastTapRef.current = { value: '', ts: 0 }
      clearResponse()
    } else {
      lastTapRef.current = { value, ts: now }
    }
  }

  const mapsUrl = assignment.venue
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(assignment.venue)}`
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white border border-blue-200 rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className={`relative overflow-hidden px-4 py-3 flex items-center gap-3 ${isRaising ? 'bg-primary-dark' : 'bg-primary'}`}>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-20 h-20 pointer-events-none z-0 opacity-40">
          <img
            src="/icons/umpire.png"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="bg-white/10 rounded-lg px-2.5 py-1.5 text-center flex-shrink-0 min-w-[48px]">
          <div className="text-accent font-display font-bold text-sm leading-none">
            {assignmentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          <div className="text-white/50 text-xs mt-0.5">{assignmentDate.getFullYear()}</div>
          <div
            className={`mt-1 inline-flex items-center justify-center text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${
              isRaising
                ? 'text-accent bg-accent/10 border-accent/40'
                : 'text-white bg-white/10 border-white/30'
            }`}
          >
            {assignmentWeekday}
          </div>
        </div>
        <div className="relative z-10 flex-1 min-w-0 pr-20">
          <div className="flex flex-wrap gap-1 mb-0.5">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isRaising ? 'bg-accent text-primary-dark' : 'bg-white/20 text-white'}`}>
              {teamLabel}
            </span>
            <span className="text-xs bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full">🧢 Umpiring Duty</span>
            {assignment.division && (
              <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full">{assignment.division?.replace(/^D(\d+)$/, 'Div$1')}</span>
            )}
          </div>
          <div className="text-white font-semibold text-sm truncate">
            {assignment.match_visitor} <span className="font-normal opacity-70">vs</span> {assignment.match_home}
          </div>
          <div className="text-white/60 text-xs mt-0.5">
            {assignment.time} · {assignment.venue}
          </div>
        </div>
        {isPast && <span className="relative z-10 text-xs text-white/40 flex-shrink-0">Past</span>}
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Match info */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
          {assignment.time && <span>⏰ {assignment.time}</span>}
          {assignment.venue && (
            <>
              <span>·</span>
              <span>📍 {assignment.venue}</span>
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors">
                  <svg className="w-3 h-3 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.013 3.5-4.628 3.5-7.327A8 8 0 004 12c0 2.699 1.556 5.315 3.5 7.327a19.58 19.58 0 002.683 2.282 16.974 16.974 0 001.144.742zM12 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" />
                  </svg>
                  Open in Maps
                </a>
              )}
            </>
          )}
        </div>

        {/* Availability form */}
        {isPast ? (
          <div className="text-xs text-center text-gray-400 bg-gray-50 rounded-xl px-3 py-2">This assignment has passed</div>
        ) : !user ? (
          <div className="text-xs text-center text-gray-400 bg-gray-50 rounded-xl px-3 py-2">Sign in to mark your availability</div>
        ) : profile?.team !== assignment.ncb_team ? (
          <div className="text-xs text-center text-gray-400 bg-gray-50 rounded-xl px-3 py-2">Only {teamLabel} players can respond</div>
        ) : (
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = status === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleStatusClick(opt.value)}
                    disabled={saving}
                    title={isSelected ? 'Double tap to clear' : `Mark as ${opt.label}`}
                    className={`relative flex items-center gap-1 px-3 py-1.5 rounded-full border-2 text-xs font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                      isSelected ? opt.selected : opt.idle
                    }`}
                  >
                    {saving && isSelected ? (
                      <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      opt.emoji
                    )}
                    {opt.label}
                    {saved && isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-green-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold">✓</span>
                    )}
                  </button>
                )
              })}
              {status && !saving && (
                <span className="text-[10px] text-gray-400 ml-1">double tap selected option to clear</span>
              )}
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
        )}

        {/* Who's going — two columns */}
        {user && counts.names.length > 0 && (
          <details open={!isPast}>
            <summary className="flex items-center gap-2 cursor-pointer select-none list-none">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Umpires</span>
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

            <div className="mt-2 grid grid-cols-2 gap-x-3">
              {/* Column 1: Available (in) */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-green-600 mb-1">✅ Available</div>
                {counts.names.filter(n => n.status === 'in').length === 0 ? (
                  <div className="text-[10px] text-gray-400 italic">None yet</div>
                ) : (
                  <div className="space-y-0.5">
                    {counts.names.filter(n => n.status === 'in').sort((a, b) => a.name.localeCompare(b.name)).map((n, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-50">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                        <span className="text-xs font-medium text-green-800 truncate">{n.name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Column 2: Maybe + Out */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Out / Maybe</div>
                {counts.names.filter(n => n.status === 'maybe' || n.status === 'out').length === 0 ? (
                  <div className="text-[10px] text-gray-400 italic">None yet</div>
                ) : (
                  <div className="space-y-0.5">
                    {counts.names.filter(n => n.status === 'maybe').sort((a, b) => a.name.localeCompare(b.name)).map((n, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                        <span className="text-xs font-medium text-amber-800 truncate">{n.name.split(' ')[0]}</span>
                      </div>
                    ))}
                    {counts.names.filter(n => n.status === 'out').sort((a, b) => a.name.localeCompare(b.name)).map((n, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-50">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                        <span className="text-xs font-medium text-red-700 truncate">{n.name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
  const { activeSeason } = useSeason()

  const paramTeam    = searchParams.get('team')
  const paramFixture = searchParams.get('fixture')

  const defaultTeam = profile?.team || paramTeam || 'raising-bulls'
  const [teamFilter, setTeamFilter] = useState(defaultTeam)
  const [activeTab,  setActiveTab]  = useState('playing') // 'playing' | 'umpiring'

  // Fixtures from Supabase
  const [fixturesData, setFixturesData] = useState([])
  const [loadingFix,   setLoadingFix]   = useState(true)

  // Playing availability
  const [availabilityMap, setAvailabilityMap] = useState({})
  const [userResponseMap, setUserResponseMap] = useState({})
  const [loadingData,     setLoadingData]     = useState(true)
  const [financeMap,      setFinanceMap]      = useState({})
  const [financeLoaded,   setFinanceLoaded]   = useState(false)

  // Umpiring assignments + availability
  const [umpAssignments,  setUmpAssignments]  = useState([])
  const [loadingUmp,      setLoadingUmp]      = useState(true)
  const [umpAvailMap,     setUmpAvailMap]     = useState({})
  const [myUmpResponseMap, setMyUmpResponseMap] = useState({})

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const allFixtures     = fixturesData.filter((f) => f.team === teamFilter)
  const upcomingFixtures = allFixtures.filter((f) => new Date(f.date.replace(/-/g, '/')) >= today)
  const pastFixtures     = allFixtures.filter((f) => new Date(f.date.replace(/-/g, '/')) < today).reverse()
  const [pastOpen, setPastOpen] = useState(false)
  const upcomingUmpAssignments = umpAssignments.filter((a) => new Date(a.date.replace(/-/g, '/')) >= today)
  const pastUmpAssignments     = umpAssignments.filter((a) => new Date(a.date.replace(/-/g, '/')) < today).reverse()
  const [pastUmpOpen, setPastUmpOpen] = useState(false)

  // Load fixtures from Supabase
  useEffect(() => {
    setLoadingFix(true)
    // First season also matches un-tagged rows (season IS NULL) for backward compat
    const isFirst = activeSeason.id === SEASONS[0].id
    const seasonQ = isFirst
      ? supabase.from('fixtures').select('*').or(`season.eq.${activeSeason.id},season.is.null`).order('date', { ascending: true })
      : supabase.from('fixtures').select('*').eq('season', activeSeason.id).order('date', { ascending: true })
    seasonQ
      .then(({ data }) => { setFixturesData(data || []); setLoadingFix(false) })
  }, [activeSeason])

  // Load umpiring assignments
  useEffect(() => {
    setLoadingUmp(true)
    const isFirst = activeSeason.id === SEASONS[0].id
    let q = supabase.from('umpiring_assignments').select('*').eq('ncb_team', teamFilter).order('date', { ascending: true })
    if (activeSeason?.id) {
      q = isFirst
        ? q.or(`season.eq.${activeSeason.id},season.is.null`)
        : q.eq('season', activeSeason.id)
    }
    q.then(({ data }) => { setUmpAssignments(data || []); setLoadingUmp(false) })
  }, [teamFilter, activeSeason])

  // Load umpiring availability
  async function loadUmpAvailability() {
    const ids = umpAssignments.map((a) => a.id)
    if (ids.length === 0) { setUmpAvailMap({}); setMyUmpResponseMap({}); return }
    const isFirst = activeSeason.id === SEASONS[0].id

    // Step 1: fetch availability rows (include user_name)
    const availQ = isFirst
      ? supabase
          .from('umpiring_availability')
          .select('user_id, umpiring_assignment_id, status, notes, user_name')
          .or(`season.eq.${activeSeason.id},season.is.null`)
          .in('umpiring_assignment_id', ids)
      : supabase
          .from('umpiring_availability')
          .select('user_id, umpiring_assignment_id, status, notes, user_name')
          .eq('season', activeSeason.id)
          .in('umpiring_assignment_id', ids)
    const { data: availRows, error: availErr } = await availQ
    if (availErr || !availRows) return

    // Step 2: fetch profile names for those user_ids (for active users)
    const userIds = [...new Set(availRows.map((r) => r.user_id).filter(Boolean))]
    let profileMap = {}
    if (userIds.length > 0) {
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)
      profileMap = Object.fromEntries((profileRows || []).map((p) => [p.id, p.full_name]))
    }

    const agg = {}
    const mine = {}
    for (const row of availRows) {
      const k = row.umpiring_assignment_id
      if (!agg[k]) agg[k] = { in: 0, out: 0, maybe: 0, names: [] }
      agg[k][row.status] = (agg[k][row.status] || 0) + 1
      // Use user_name if available, otherwise profile name, otherwise Unknown
      const name = row.user_name || (row.user_id ? profileMap[row.user_id] : null) || 'Unknown'
      agg[k].names.push({ name, status: row.status })
      if (user && row.user_id === user.id) mine[k] = { status: row.status, notes: row.notes }
    }
    setUmpAvailMap(agg)
    setMyUmpResponseMap(mine)
  }

  useEffect(() => { loadUmpAvailability() }, [umpAssignments, user, activeSeason?.id])

  async function loadData({ showSpinner = true } = {}) {
    if (showSpinner) setLoadingData(true)
    try {
      const { data, error } = await supabase
        .from('availability')
        .select('fixture_date, fixture_team, status, notes, user_id, user_name, profiles(full_name)')
        .eq('fixture_team', teamFilter)

      if (error) throw error

      const agg = {}
      const mine = {}

      for (const row of data || []) {
        const k = `${row.fixture_date}::${row.fixture_team}`
        if (!agg[k]) agg[k] = { in: 0, out: 0, maybe: 0, players: [] }
        agg[k][row.status] = (agg[k][row.status] || 0) + 1
        agg[k].players.push({ name: row.user_name || row.profiles?.full_name || 'Unknown', status: row.status })

        if (user && row.user_id === user.id) {
          mine[k] = { status: row.status, notes: row.notes }
        }
      }

      setAvailabilityMap(agg)
      setUserResponseMap(mine)
    } catch {
      // silently skip
    } finally {
      if (showSpinner) setLoadingData(false)
    }
  }

  useEffect(() => { loadData({ showSpinner: true }) }, [teamFilter, user])

  useEffect(() => {
    if (!user || !profile?.team) {
      setFinanceMap({})
      setFinanceLoaded(true)
      return
    }

    supabase
      .from('player_finances')
      .select('player_name, team, season, paid, amount_due')
      .in('season', (activeSeason?.id || '2026') === SEASONS[0].id ? [SEASONS[0].id, '2026'] : [activeSeason?.id || '2026'])
      .eq('team', profile.team)
      .then(({ data }) => {
        const map = {}
        ;(data || []).forEach((r) => {
          const key = `${r.player_name}::${r.team}`
          const existing = map[key]
          if (existing && existing.season === (activeSeason?.id || '2026') && r.season !== (activeSeason?.id || '2026')) {
            return
          }
          map[key] = {
            season: r.season,
            paid: !!r.paid,
            amountDue: Number(r.amount_due ?? 120),
          }
        })
        setFinanceMap(map)
        setFinanceLoaded(true)
      })
  }, [user, profile?.team, activeSeason?.id])

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

  // Look up the logged-in player's own payment details
  const myPaymentFinance = (() => {
    if (!profile || !financeLoaded) return undefined
    const exactKey = `${profile.full_name}::${profile.team}`
    if (exactKey in financeMap) return financeMap[exactKey]
    // first-name fallback for name mismatches
    const fn = profile.full_name?.split(' ')[0]?.toLowerCase()
    const k = Object.keys(financeMap).find(
      (k) => k.split('::')[0].toLowerCase() === fn && k.split('::')[1] === profile.team
    )
    // default to unpaid and expected due if loaded but no record found
    return k !== undefined ? financeMap[k] : { paid: false, amountDue: 120 }
  })()
  const paymentSummary = getPaymentSummary(myPaymentFinance, 120)

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

      <section className="bg-primary-dark text-white py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-start justify-between gap-3 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
              <span className="hidden md:block" />
              <div className="md:text-center">
                <h1 className="font-display text-3xl md:text-6xl font-bold leading-tight">
                  PLAYER <span className="text-accent">AVAILABILITY</span>
                </h1>
                <p className="text-gray-400 text-xs md:text-lg mt-0.5">
                  Let your captain know if you can make the next match.
                </p>
              </div>
              <div className="flex md:justify-end">
                <SeasonSwitcherInline />
              </div>
            </div>
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
                {myPaymentFinance !== undefined && (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full ${
                    paymentSummary.isPaid
                      ? 'bg-green-500 text-white'
                      : paymentSummary.remaining > 0 && paymentSummary.remaining < 120
                        ? 'bg-amber-500 text-white'
                        : 'bg-red-500 text-white'
                  }`}>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 7.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
                      <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 14.625v-9.75ZM8.25 9.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM18.75 9a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-.008ZM4.5 9.75A.75.75 0 0 1 5.25 9h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75V9.75Z" clipRule="evenodd" />
                      <path d="M2.25 18a.75.75 0 0 0 0 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 0 0-.75-.75H2.25Z" />
                    </svg>
                    {paymentSummary.isPaid
                      ? 'Season Fee Paid'
                      : paymentSummary.remaining > 0 && paymentSummary.remaining < 120
                        ? `${formatMoney(paymentSummary.remaining)} Remaining · Partial Payment`
                        : `${formatMoney(paymentSummary.remaining)} Due · Season Fee Unpaid`}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap gap-2 items-center">
          {/* Team filter */}
          <div className="flex gap-2">
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
          {/* Tab switcher */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveTab('playing')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === 'playing' ? 'bg-primary-dark text-accent' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              🏏 Playing
            </button>
            <button
              onClick={() => setActiveTab('umpiring')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === 'umpiring' ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              🧢 Umpiring
            </button>
          </div>
        </div>
      </section>

      <section className="py-6 md:py-12 bg-surface min-h-[60vh]">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">

          {/* ── Playing Tab ── */}
          {activeTab === 'playing' && (
            <>
              {(loadingData || loadingFix) && (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!loadingData && !loadingFix && upcomingFixtures.length === 0 && pastFixtures.length === 0 && (
                <div className="text-center py-24 text-gray-400">
                  <div className="text-5xl mb-4">🏏</div>
                  <div className="font-display font-bold text-xl text-gray-500 mb-2">No upcoming fixtures</div>
                  <p className="text-sm mb-6">Check back once the next schedule is announced.</p>
                  <Link to="/fixtures" className="btn-primary text-sm">View All Fixtures</Link>
                </div>
              )}

              {!loadingData && !loadingFix && (upcomingFixtures.length > 0 || pastFixtures.length > 0) && (
                <div className="space-y-8">
                  {/* ── Past ── */}
                  {pastFixtures.length > 0 && (
                    <div>
                      <button
                        onClick={() => setPastOpen((o) => !o)}
                        className="flex items-center gap-2 mb-3 group touch-manipulation"
                      >
                        <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                        <span className="font-display font-bold text-gray-500 text-lg group-hover:text-gray-700 transition-colors">
                          Past Matches
                        </span>
                        <span className="text-xs font-normal text-gray-400">({pastFixtures.length})</span>
                        <motion.svg
                          animate={{ rotate: pastOpen ? 180 : 0 }}
                          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                          className="w-4 h-4 text-gray-400 flex-shrink-0"
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </motion.svg>
                      </button>
                      <AnimatePresence initial={false}>
                        {pastOpen && (
                          <motion.div
                            key="past-avail"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
                            exit={{ height: 0, opacity: 0, transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] } }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-2">
                              {pastFixtures.map((f) => (
                                <div key={f.id} id={`fixture-${f.id}`}>
                                  <FixtureCard
                                    fixture={f}
                                    availabilityMap={availabilityMap}
                                    userResponseMap={userResponseMap}
                                    myPaymentFinance={myPaymentFinance}
                                    financeLoaded={financeLoaded}
                                    onResponseSaved={() => loadData({ showSpinner: false })}
                                  />
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* ── Upcoming ── */}
                  <div>
                    <h3 className="font-display font-bold text-primary text-lg mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent inline-block" />
                      Upcoming Matches
                      <span className="text-xs font-normal text-gray-400">({upcomingFixtures.length})</span>
                    </h3>
                    {upcomingFixtures.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No upcoming fixtures scheduled.</p>
                    ) : (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {upcomingFixtures.map((f) => (
                          <div key={f.id} id={`fixture-${f.id}`}>
                            <FixtureCard
                              fixture={f}
                              availabilityMap={availabilityMap}
                              userResponseMap={userResponseMap}
                              myPaymentFinance={myPaymentFinance}
                              financeLoaded={financeLoaded}
                              onResponseSaved={() => loadData({ showSpinner: false })}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Umpiring Tab ── */}
          {activeTab === 'umpiring' && (
            <>
              <div className="mb-5">
                <h2 className="font-display font-bold text-primary text-xl mb-1">Umpiring Duties</h2>
                <p className="text-sm text-gray-500">
                  These are matches where{' '}
                  <span className="font-semibold">{teamFilter === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'}</span>{' '}
                  has been assigned to provide umpires. Mark if you can go.
                </p>
              </div>

              {loadingUmp && (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!loadingUmp && umpAssignments.length === 0 && (
                <div className="text-center py-24 text-gray-400">
                  <div className="text-5xl mb-4">🧢</div>
                  <div className="font-display font-bold text-xl text-gray-500 mb-2">No umpiring assignments yet</div>
                  <p className="text-sm">Check back when assignments are posted.</p>
                </div>
              )}

              {!loadingUmp && umpAssignments.length > 0 && (
                <div className="space-y-8">
                  {/* ── Past ── */}
                  {pastUmpAssignments.length > 0 && (
                    <div>
                      <button
                        onClick={() => setPastUmpOpen((o) => !o)}
                        className="flex items-center gap-2 mb-3 group"
                      >
                        <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                        <span className="font-display font-bold text-gray-500 text-lg group-hover:text-gray-700 transition-colors">
                          Past Matches
                        </span>
                        <span className="text-xs font-normal text-gray-400">({pastUmpAssignments.length})</span>
                        <motion.svg
                          animate={{ rotate: pastUmpOpen ? 180 : 0 }}
                          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                          className="w-4 h-4 text-gray-400 flex-shrink-0"
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </motion.svg>
                      </button>
                      {pastUmpOpen && (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                          {pastUmpAssignments.map((a) => (
                            <UmpCard
                              key={a.id}
                              assignment={a}
                              umpAvailMap={umpAvailMap}
                              myUmpResponseMap={myUmpResponseMap}
                              onResponseSaved={loadUmpAvailability}
                              seasonId={activeSeason.id}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Upcoming ── */}
                  <div>
                    <h3 className="font-display font-bold text-primary text-lg mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent inline-block" />
                      Upcoming Matches
                      <span className="text-xs font-normal text-gray-400">({upcomingUmpAssignments.length})</span>
                    </h3>
                    {upcomingUmpAssignments.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No upcoming umpiring assignments.</p>
                    ) : (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {upcomingUmpAssignments.map((a) => (
                          <UmpCard
                            key={a.id}
                            assignment={a}
                            umpAvailMap={umpAvailMap}
                            myUmpResponseMap={myUmpResponseMap}
                            onResponseSaved={loadUmpAvailability}
                            seasonId={activeSeason.id}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </section>
    </div>
  )
}
