import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { SEASONS } from '../../config/seasons'
import groundsData from '../../data/grounds.json'

// venue name → short Google Maps URL (venue name + state for readability in WhatsApp)
const GROUNDS_MAP = Object.fromEntries(
  groundsData.map((g) => [
    g.name.toLowerCase(),
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(g.name + ', ' + g.address)}`,
  ]),
)
function groundMapsUrl(venueName) {
  if (!venueName) return null
  return GROUNDS_MAP[venueName.toLowerCase()] || `https://maps.google.com/?q=${encodeURIComponent(venueName)}`
}

const TEAMS = [
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls',   label: 'Royal Bulls' },
]

const STATUS_COLORS = {
  in:    'bg-green-100 text-green-700',
  out:   'bg-red-100   text-red-600',
  maybe: 'bg-amber-100 text-amber-700',
}
const STATUS_EMOJI = { in: '✅', out: '❌', maybe: '🤔' }

const sectionVariants = {
  open: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { type: 'spring', stiffness: 300, damping: 35, mass: 0.5 },
      opacity: { duration: 0.2 },
    },
  },
  closed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { type: 'spring', stiffness: 300, damping: 35, mass: 0.5 },
      opacity: { duration: 0.15 },
    },
  },
}

// ── Helpers ────────────────────────────────────────────────────────────────

function teamLabel(team) {
  return team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'
}

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function isPastDateTime(dateStr, timeStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  let dt
  if (timeStr) {
    // parse "4:00 PM" / "10:30 AM" style strings
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
    if (match) {
      let hours = parseInt(match[1], 10)
      const minutes = parseInt(match[2], 10)
      const meridiem = match[3].toUpperCase()
      if (meridiem === 'PM' && hours !== 12) hours += 12
      if (meridiem === 'AM' && hours === 12) hours = 0
      dt = new Date(y, m - 1, d, hours, minutes, 0)
    }
  }
  if (!dt) {
    // no time — treat whole day as past only once the day is over (midnight)
    dt = new Date(y, m - 1, d, 23, 59, 59)
  }
  return dt < new Date()
}

function formatLongDate(dateStr) {
  return parseDate(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatShortDate(dateStr) {
  return parseDate(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function openWhatsApp(text) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
}

function formatFixtureUmpires(fixture) {
  const u1 = fixture?.umpire1_team?.trim()
  const u2 = fixture?.umpire2_team?.trim()
  if (u1 && u2) return u1 === u2 ? u1 : `${u1} & ${u2}`
  return u1 || u2 || 'TBD'
}

function getSeasonTagText(seasonId) {
  if (!seasonId) return 'Season TBD'
  const season = SEASONS.find((s) => s.id === seasonId)
  if (season) return `${season.shortLabel} '${String(season.year).slice(-2)}`
  return String(seasonId).replace(/-/g, ' ')
}

function getFixtureTypeLabel(value) {
  const raw = String(value || '').trim()
  if (!raw) return 'League'
  const v = raw.toLowerCase()
  if (v === 'playoff' || v === 'playoffs') return 'Playoffs'
  if (v === 'championship' || v === 'final') return 'Championship'
  if (v === 'mega smash' || v === 'mega bash') return 'Mega Smash'
  if (v === 'league') return 'League'
  return raw
}

// ── StatusTable ────────────────────────────────────────────────────────────

function StatusTable({ rows }) {
  const sorted = [...rows].sort((a, b) => {
    const order = { in: 0, maybe: 1, out: 2 }
    return (order[a.status] ?? 3) - (order[b.status] ?? 3)
  })

  return (
    <>
      {/* Mobile */}
      <div className="sm:hidden space-y-1">
        {sorted.map((r) => (
          <div key={r.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 transition-colors">
            <span className={`flex-shrink-0 w-2 h-2 rounded-full ${
              r.status === 'in' ? 'bg-green-500' : r.status === 'maybe' ? 'bg-amber-400' : 'bg-red-400'
            }`} />
            <span className="flex-1 text-xs font-medium text-gray-800 truncate">
              {(r.profiles?.full_name || 'Unknown').split(' ')[0]}
            </span>
            {r.profiles?.team && (
              <span className="flex-shrink-0 text-[9px] text-gray-400 font-normal">
                {r.profiles.team === 'raising-bulls' ? 'RB' : 'RoyB'}
              </span>
            )}
            <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${STATUS_COLORS[r.status]}`}>
              {r.status}
            </span>
          </div>
        ))}
      </div>

      {/* Desktop */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Player', 'Email', 'Team', 'Status', 'Notes', 'Updated'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-2.5 pr-4 font-medium text-gray-800">{r.profiles?.full_name || 'Unknown'}</td>
                <td className="py-2.5 pr-4 text-gray-500 text-xs">{r.profiles?.email || '—'}</td>
                <td className="py-2.5 pr-4 text-gray-500 text-xs">{teamLabel(r.profiles?.team || 'royal-bulls')}</td>
                <td className="py-2.5 pr-4">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[r.status]}`}>
                    {STATUS_EMOJI[r.status]} {r.status}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-gray-400 text-xs max-w-[200px] truncate">{r.notes || '—'}</td>
                <td className="py-2.5 text-gray-400 text-xs whitespace-nowrap">
                  {new Date(r.updated_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ── Playing match card ─────────────────────────────────────────────────────

function PlayingMatchCard({ cardKey, rows, fixtureMap, collapsedKeys, toggleCollapse, onSelectFixture, activeSeason }) {
  const [date, team] = cardKey.split('::')
  const fixture     = fixtureMap[cardKey]
  const seasonTag   = fixture?.season ? getSeasonTagText(fixture.season) : (activeSeason?.id ? getSeasonTagText(activeSeason.id) : 'Season TBD')
  const fixtureTypeTag = getFixtureTypeLabel(fixture?.type)
  const inList      = rows.filter((r) => r.status === 'in')
  const outList     = rows.filter((r) => r.status === 'out')
  const maybeList   = rows.filter((r) => r.status === 'maybe')
  const isPastCard  = isPastDateTime(date, fixture?.time)
  const isRaising   = team === 'raising-bulls'
  const isCollapsed = collapsedKeys.has(cardKey)

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
    >
      <div className={`px-4 sm:px-6 py-4 flex flex-col gap-3 ${isRaising ? 'bg-primary-dark' : 'bg-primary'}`}>

        {/* Tags + Notify button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${isRaising ? 'bg-accent text-primary-dark' : 'bg-white/20 text-white'}`}>
              {teamLabel(team)}
            </span>
            {fixture && <span className="text-xs bg-white/10 text-gray-300 px-2.5 py-0.5 rounded-full">{fixture.format}</span>}
            {fixture && <span className="text-xs bg-white/10 text-gray-300 px-2.5 py-0.5 rounded-full">{fixtureTypeTag}</span>}
            {fixture && <span className="text-xs bg-white/10 text-gray-300 px-2.5 py-0.5 rounded-full">{seasonTag}</span>}
            {isPastCard && <span className="text-xs bg-white/10 text-gray-400 px-2.5 py-0.5 rounded-full">Past</span>}
          </div>

          {!isPastCard && fixture && (
            <button
              onClick={() => {
                const msg =
`🏏 *${teamLabel(team)} - PLAYING*
*- NC Bulls Cricket Club*

Hi Team 👋,
Please update your *PLAYING availability* for our upcoming match:

📅 *Date:* ${formatLongDate(date)}
⏰ *Time:* ${fixture.time || 'TBD'}
⚔️ *Opponent:* ${fixture.opponent || 'TBD'}
🏟️ *Ground:* ${fixture.venue || 'TBD'}
🧢 *Umpires:* ${formatFixtureUmpires(fixture)}

👉 Please mark your response as ✅ IN, ❌ OUT, or 🤔 MAYBE in the app.`
                openWhatsApp(msg)
              }}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-green-600/90 hover:bg-green-500 text-white border border-green-400/30 transition-all whitespace-nowrap shadow-sm"
            >
              <span className="hidden sm:inline">Send Availability Notification</span>
              <span className="sm:hidden">Notify Availability</span>
            </button>
          )}
        </div>

        {/* Title + Select Players + counts */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-white text-lg sm:text-xl truncate">vs {fixture?.opponent || 'Unknown'}</h3>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
              {formatShortDate(date)}{fixture?.time && ` · ${fixture.time}`}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {onSelectFixture && (
              <button
                onClick={() => !isPastCard && onSelectFixture(cardKey)}
                disabled={isPastCard}
                className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${
                  isPastCard
                    ? 'bg-white/5 text-white/30 border-white/10 cursor-not-allowed'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20 active:scale-95'
                }`}
              >
                Select Players
              </button>
            )}
            {[
              { label: 'In',    count: inList.length,    bg: 'bg-green-500' },
              { label: 'Maybe', count: maybeList.length, bg: 'bg-amber-400' },
              { label: 'Out',   count: outList.length,   bg: 'bg-red-500'   },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-xl px-2 sm:px-2.5 py-1.5 sm:py-2 text-center text-white flex-shrink-0`}>
                <div className="font-display font-bold text-lg sm:text-xl leading-none">{s.count}</div>
                <div className="text-[9px] sm:text-[10px] font-medium opacity-90 mt-0.5 whitespace-nowrap">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expandable player list */}
      <motion.div
        initial={{ height: isCollapsed ? 0 : 'auto', opacity: isCollapsed ? 0 : 1 }}
        animate={{ height: isCollapsed ? 0 : 'auto', opacity: isCollapsed ? 0 : 1 }}
        transition={{ height: { type: 'spring', stiffness: 300, damping: 35, mass: 0.5 }, opacity: { duration: 0.2 } }}
        style={{ overflow: 'hidden' }}
      >
        <div className="px-3 sm:px-6 py-4">
          {rows.length === 0
            ? <p className="text-gray-400 text-sm text-center py-4">No responses yet.</p>
            : <StatusTable rows={rows} />}
        </div>
      </motion.div>

      <button
        onClick={() => toggleCollapse(cardKey)}
        className="w-full border-t border-gray-100 px-4 sm:px-6 py-2.5 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <motion.svg animate={{ rotate: isCollapsed ? 0 : 180 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-gray-400"
        >
          <path d="M19 9l-7 7-7-7" />
        </motion.svg>
        {isCollapsed ? `Show Players (${rows.length})` : 'Hide Players'}
      </button>
    </motion.div>
  )
}

// ── Player select row (shared) ──────────────────────────────────────────────

function PlayerSelectRow({ name, isSelected, onToggle, note }) {
  const first = name.split(' ')[0]
  const rest  = name.split(' ').slice(1).join(' ')
  return (
    <button
      onClick={onToggle}
      className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all ${
        isSelected
          ? 'bg-primary-dark text-white border-primary-dark'
          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
      }`}
    >
      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-[10px] ${
        isSelected ? 'border-accent bg-accent text-primary-dark' : 'border-gray-300'
      }`}>
        {isSelected ? '✓' : ''}
      </span>
      <span className="flex-1 truncate">
        <span className="font-medium">{first}</span>
        {rest && <span className="opacity-60 ml-1 text-xs">{rest}</span>}
      </span>
      {note && !isSelected && (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500">{note}</span>
      )}
    </button>
  )
}

// ── Umpiring match card — INLINE selector (no overlay) ─────────────────────

function UmpiringMatchCard({ assignment, rows, collapsedIds, toggleCollapse, playersByTeam }) {
  const inList    = rows.filter((r) => r.status === 'in')
  const outList   = rows.filter((r) => r.status === 'out')
  const maybeList = rows.filter((r) => r.status === 'maybe')
  const isPast    = isPastDateTime(assignment.date, assignment.time)
  const isRaising = assignment.ncb_team === 'raising-bulls'
  const isCollapsed = collapsedIds.has(assignment.id)

  // ── Inline selector state (completely local — no overlay, no scroll lock) ──
  const [selectorOpen, setSelectorOpen]     = useState(false)
  const [selected, setSelected]             = useState([])
  const [arriveBy, setArriveBy]             = useState('30 mins before game start')
  const [noResponseOpen, setNoResponseOpen] = useState(false)

  const teamPlayers   = playersByTeam[assignment.ncb_team] || []
  const respondedIds  = useMemo(() => new Set(rows.map((r) => r.user_id).filter(Boolean)), [rows])
  const noResponseRows = useMemo(
    () => teamPlayers.filter((p) => !respondedIds.has(p.id)),
    [teamPlayers, respondedIds],
  )

  function toggle(name) {
    setSelected((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name])
  }

  const message = useMemo(() => {
    if (!assignment || selected.length === 0) return ''
    const names = [...selected]
      .sort((a, b) => a.split(' ')[0].localeCompare(b.split(' ')[0]))
      .map((name, i) => ` ${i + 1}. ${name.split(' ')[0]}`)
      .join('\n')
    const lines = [
      `🧢 *${teamLabel(assignment.ncb_team)} — Umpiring Duty*`,
      '',
      `📅 *Date:* ${formatLongDate(assignment.date)}`,
      `⏰ *Time:* ${assignment.time || 'TBD'}`,
      `🏟️ *Ground:* ${assignment.venue || 'TBD'}`,
      `⚔️ *Match:* ${assignment.match_visitor} vs ${assignment.match_home}`,
    ]
    if (assignment.division) lines.push(`🏆 *Division:* ${assignment.division}`)
    lines.push(
      '',
      `🧑‍⚖️ *Representing ${teamLabel(assignment.ncb_team)} as Umpires:*`,
      names,
      '',
      `👉 Please acknowledge and reach by ${arriveBy}.`,
      `Thanks team.`,
    )
    return lines.join('\n')
  }, [assignment, selected, arriveBy])

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
    >
      {/* ── Card header ── */}
      <div className={`px-4 sm:px-6 py-4 flex flex-col gap-3 ${isRaising ? 'bg-primary-dark' : 'bg-primary'}`}>

        {/* Tags + Notify button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${isRaising ? 'bg-accent text-primary-dark' : 'bg-white/20 text-white'}`}>
              {teamLabel(assignment.ncb_team)}
            </span>
            {assignment.division && (
              <span className="text-xs bg-white/10 text-gray-300 px-2.5 py-0.5 rounded-full">{assignment.division}</span>
            )}
            {isPast && <span className="text-xs bg-white/10 text-gray-400 px-2.5 py-0.5 rounded-full">Past</span>}
          </div>

          {!isPast && (
            <button
              onClick={() => {
                const msg =
`🧢 *${teamLabel(assignment.ncb_team)} - UMPIRING*
*- NC Bulls Cricket Club*

Hi Team 👋,
Please update your *UMPIRING availability* for the duty assignment below:

📅 *Date:* ${formatLongDate(assignment.date)}
⏰ *Time:* ${assignment.time || 'TBD'}
🏟️ *Ground:* ${assignment.venue || 'TBD'}
🥎 *Match:* ${assignment.match_visitor} vs ${assignment.match_home}

👉 Please mark ✅ IN, ❌ OUT, or 🤔 MAYBE in the app.`
                openWhatsApp(msg)
              }}
              className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl bg-green-600/90 hover:bg-green-500 text-white border border-green-400/30 transition-all whitespace-nowrap shadow-sm"
            >
              Notify Umpiring
            </button>
          )}
        </div>

        {/* Match title + Select Umpires button + counts */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-white text-lg sm:text-xl truncate">
              {assignment.match_visitor} vs {assignment.match_home}
            </h3>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
              {formatShortDate(assignment.date)} · {assignment.time || 'TBD'}
              {assignment.venue ? ` · ${assignment.venue}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {!isPast && (
              <button
                onClick={() => {
                  setSelectorOpen((v) => !v)
                  // reset selection when closing
                  if (selectorOpen) { setSelected([]); setArriveBy('30 mins before game start') }
                }}
                className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap active:scale-95 ${
                  selectorOpen
                    ? 'bg-accent text-primary-dark border-accent'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
              >
                {selectorOpen ? '✓ Done' : '🧢 Select Umpires'}
              </button>
            )}

            {[
              { label: 'In',    count: inList.length,    bg: 'bg-green-500' },
              { label: 'Maybe', count: maybeList.length, bg: 'bg-amber-400' },
              { label: 'Out',   count: outList.length,   bg: 'bg-red-500'   },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-xl px-2 sm:px-2.5 py-1.5 sm:py-2 text-center text-white flex-shrink-0`}>
                <div className="font-display font-bold text-lg sm:text-xl leading-none">{s.count}</div>
                <div className="text-[9px] sm:text-[10px] font-medium opacity-90 mt-0.5 whitespace-nowrap">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Expandable responses list ── */}
      <motion.div
        initial={{ height: isCollapsed ? 0 : 'auto', opacity: isCollapsed ? 0 : 1 }}
        animate={{ height: isCollapsed ? 0 : 'auto', opacity: isCollapsed ? 0 : 1 }}
        transition={{ height: { type: 'spring', stiffness: 300, damping: 35, mass: 0.5 }, opacity: { duration: 0.2 } }}
        style={{ overflow: 'hidden' }}
      >
        <div className="px-3 sm:px-6 py-4">
          {rows.length === 0
            ? <p className="text-gray-400 text-sm text-center py-4">No responses yet.</p>
            : <StatusTable rows={rows} />}
        </div>
      </motion.div>

      <button
        onClick={() => toggleCollapse(assignment.id)}
        className="w-full border-t border-gray-100 px-4 sm:px-6 py-2.5 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <motion.svg animate={{ rotate: isCollapsed ? 0 : 180 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-gray-400"
        >
          <path d="M19 9l-7 7-7-7" />
        </motion.svg>
        {isCollapsed ? `Show Players (${rows.length})` : 'Hide Players'}
      </button>

      {/* ── Inline umpire selector — expands below the card, stays in page flow ── */}
      <AnimatePresence initial={false}>
        {selectorOpen && (
          <motion.div
            key="selector"
            initial="closed"
            animate="open"
            exit="closed"
            variants={sectionVariants}
            style={{ overflow: 'hidden' }}
          >
            <div className="border-t-2 border-accent/40 bg-gray-50 px-4 sm:px-6 py-5 space-y-4">

              {/* Section label */}
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                🧑‍⚖️ Select Umpires for this Duty
              </p>

              {/* Player picker */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
                {inList.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-green-600 mb-2">✅ Available ({inList.length})</p>
                    <div className="space-y-1.5">
                      {inList.map((r) => {
                        const name = r.profiles?.full_name || 'Unknown'
                        return (
                          <PlayerSelectRow
                            key={r.id}
                            name={name}
                            isSelected={selected.includes(name)}
                            onToggle={() => toggle(name)}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}

                {maybeList.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-amber-600 mb-2">🤔 Maybe ({maybeList.length})</p>
                    <div className="space-y-1.5">
                      {maybeList.map((r) => {
                        const name = r.profiles?.full_name || 'Unknown'
                        return (
                          <PlayerSelectRow
                            key={r.id}
                            name={name}
                            isSelected={selected.includes(name)}
                            onToggle={() => toggle(name)}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}

                {noResponseRows.length > 0 && (
                  <div>
                    <button
                      onClick={() => setNoResponseOpen((v) => !v)}
                      className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 mb-2 hover:text-gray-700 transition-colors"
                    >
                      <span>⚠️ No Response ({noResponseRows.length})</span>
                      <motion.svg
                        animate={{ rotate: noResponseOpen ? 180 : 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      >
                        <path d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </button>
                    <AnimatePresence initial={false}>
                      {noResponseOpen && (
                        <motion.div
                          key="no-response"
                          initial="closed" animate="open" exit="closed"
                          variants={sectionVariants}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="space-y-1.5">
                            {noResponseRows.map((p) => (
                              <PlayerSelectRow
                                key={p.id}
                                name={p.full_name}
                                isSelected={selected.includes(p.full_name)}
                                onToggle={() => toggle(p.full_name)}
                                note="No Reply"
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {inList.length === 0 && maybeList.length === 0 && noResponseRows.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">No players found for this team.</p>
                )}
              </div>

              {/* Arrival instruction */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Arrival Instruction</label>
                <input
                  type="text"
                  value={arriveBy}
                  onChange={(e) => setArriveBy(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g. 30 mins before gamestart"
                />
              </div>

              {/* Selection summary + Post on WhatsApp */}
              {selected.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                      Representing {teamLabel(assignment.ncb_team)} as Umpires ({selected.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.map((n) => (
                        <span key={n} className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary-dark text-accent">
                          {n.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Message Preview</p>
                    <div className="text-xs bg-gray-900 text-green-400 rounded-xl p-3 leading-relaxed font-mono">
                      {message.split('\n').map((line, i) => {
                        const mapsMatch = line.match(/^📍 Maps & Details: (.+)$/)
                        if (mapsMatch) {
                          return (
                            <div key={i} className="flex items-center gap-2 my-0.5">
                              <span>📍 Maps &amp; Details:</span>
                              <a
                                href={mapsMatch[1]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-md transition-colors no-underline"
                              >
                                Open ↗
                              </a>
                            </div>
                          )
                        }
                        return <div key={i} className="whitespace-pre-wrap min-h-[1em]">{line || '\u00A0'}</div>
                      })}
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe59] active:scale-95 text-white text-sm font-semibold transition-all"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.852L.057 23.428a.75.75 0 00.914.914l5.638-1.47A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.708 9.708 0 01-4.943-1.35l-.355-.21-3.676.958.978-3.589-.23-.368A9.75 9.75 0 1112 21.75z" />
                    </svg>
                    Post on WhatsApp
                  </a>
                </div>
              ) : (
                <p className="text-xs text-center text-gray-400 pb-1">
                  Select umpires above to generate the WhatsApp message.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Section header ─────────────────────────────────────────────────────────

function SectionHeader({ title, count, dotColor = 'bg-accent' }) {
  return (
    <div className="flex items-center gap-2 px-1 mb-3">
      <span className={`w-2 h-2 rounded-full ${dotColor} inline-block`} />
      <span className="text-sm font-semibold text-gray-700">{title}</span>
      <span className="text-xs font-normal text-gray-400">({count})</span>
    </div>
  )
}

// ── Main tab ───────────────────────────────────────────────────────────────

export default function AvailabilityTab({ onSelectFixture }) {
  const { isSuperAdmin, adminTeam } = useAuth()
  const { activeSeason } = useSeason()

  const [teamFilter, setTeamFilter] = useState(adminTeam ?? 'raising-bulls')
  const [activeMode, setActiveMode] = useState('playing')

  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  const [fixturesData,      setFixturesData]      = useState([])
  const [playingResponses,  setPlayingResponses]  = useState([])
  const [playingCollapsedKeys, setPlayingCollapsedKeys] = useState(new Set())
  const [playingPastOpen,   setPlayingPastOpen]   = useState(false)
  const playingInitializedCollapse = useRef(false)

  const [umpAssignments,    setUmpAssignments]    = useState([])
  const [umpResponses,      setUmpResponses]      = useState([])
  const [playersByTeam,     setPlayersByTeam]     = useState({})
  const [umpCollapsedIds,   setUmpCollapsedIds]   = useState(new Set())
  const [umpPastOpen,       setUmpPastOpen]       = useState(false)
  const umpInitializedCollapse = useRef(false)

  const effectiveFilter = isSuperAdmin ? teamFilter : adminTeam

  const fixtureMap = useMemo(
    () => Object.fromEntries(fixturesData.map((f) => [`${f.date}::${f.team}`, f])),
    [fixturesData],
  )

  // ── Load all data ──────────────────────────────────────────────────────

  async function load() {
    setLoading(true)
    setError('')
    try {
      const isFirst   = activeSeason.id === SEASONS[0].id
      const fixtureQ  = isFirst
        ? supabase.from('fixtures').select('*').or(`season.eq.${activeSeason.id},season.is.null`).order('date', { ascending: true })
        : supabase.from('fixtures').select('*').eq('season', activeSeason.id).order('date', { ascending: true })
      const playingQ  = supabase.from('availability').select('*, profiles(full_name, email, team, role)').order('fixture_date', { ascending: true })
      let umpAssnQ  = supabase.from('umpiring_assignments').select('*').order('date', { ascending: true })
      const profilesQ = supabase.from('profiles').select('id, full_name, team')
        .in('team', ['raising-bulls', 'royal-bulls']).order('full_name', { ascending: true })

      if (activeSeason?.startDate) umpAssnQ = umpAssnQ.gte('date', activeSeason.startDate)
      if (activeSeason?.endDate)   umpAssnQ = umpAssnQ.lte('date', activeSeason.endDate)

      if (effectiveFilter) {
        playingQ.eq('fixture_team', effectiveFilter)
        umpAssnQ.eq('ncb_team', effectiveFilter)
        profilesQ.eq('team', effectiveFilter)
      }

      const [
        { data: fixtures,  error: fixtureErr  },
        { data: pRows,     error: pErr        },
        { data: assnRows,  error: aErr        },
        { data: rosterRows, error: rosterErr  },
      ] = await Promise.all([fixtureQ, playingQ, umpAssnQ, profilesQ])

      if (fixtureErr)  throw fixtureErr
      if (pErr)        throw pErr
      if (aErr)        throw aErr
      if (rosterErr)   throw rosterErr

      setFixturesData(fixtures || [])
      setPlayingResponses(pRows || [])

      const assignments = assnRows || []
      setUmpAssignments(assignments)

      const byTeam = (rosterRows || []).reduce((acc, p) => {
        if (!acc[p.team]) acc[p.team] = []
        acc[p.team].push(p)
        return acc
      }, {})
      setPlayersByTeam(byTeam)

      const assnIds = assignments.map((a) => a.id)
      if (assnIds.length === 0) {
        setUmpResponses([])
      } else {
        const { data: uaRows, error: uaErr } = await supabase
          .from('umpiring_availability')
          .select('*, profiles(full_name, email, team, role)')
          .in('umpiring_assignment_id', assnIds)
        if (uaErr) throw uaErr
        setUmpResponses(uaRows || [])
      }
    } catch (e) {
      setError(e.message || 'Failed to load availability data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [teamFilter, isSuperAdmin, adminTeam, activeSeason])

  // Auto-collapse past entries on first load
  useEffect(() => {
    if (!fixturesData.length || playingInitializedCollapse.current) return
    playingInitializedCollapse.current = true
    const pastKeys = new Set(
      fixturesData
        .filter((f) => !effectiveFilter || f.team === effectiveFilter)
        .map((f) => ({ key: `${f.date}::${f.team}`, date: f.date, time: f.time }))
        .filter(({ date, time }) => isPastDateTime(date, time))
        .map(({ key }) => key),
    )
    setPlayingCollapsedKeys(pastKeys)
  }, [fixturesData, effectiveFilter])

  useEffect(() => {
    if (!umpAssignments.length || umpInitializedCollapse.current) return
    umpInitializedCollapse.current = true
    const pastIds = new Set(umpAssignments.filter((a) => isPastDateTime(a.date, a.time)).map((a) => a.id))
    setUmpCollapsedIds(pastIds)
  }, [umpAssignments])

  function togglePlayingCollapse(key) {
    setPlayingCollapsedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  function toggleUmpCollapse(id) {
    setUmpCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  // ── Derived data ───────────────────────────────────────────────────────

  const playingGrouped = useMemo(() =>
    playingResponses.reduce((acc, r) => {
      const k = `${r.fixture_date}::${r.fixture_team}`
      if (!acc[k]) acc[k] = []
      acc[k].push(r)
      return acc
    }, {}),
  [playingResponses])

  const umpGrouped = useMemo(() =>
    umpResponses.reduce((acc, r) => {
      const k = r.umpiring_assignment_id
      if (!acc[k]) acc[k] = []
      acc[k].push(r)
      return acc
    }, {}),
  [umpResponses])

  const playingEntries = (fixturesData || [])
    .filter((f) => !effectiveFilter || f.team === effectiveFilter)
    .map((f) => {
      const cardKey = `${f.date}::${f.team}`
      return {
        id: f.id,
        cardKey,
        rows: playingGrouped[cardKey] || [],
      }
    })

  const playingPastEntries = playingEntries.filter((entry) => {
    const fixture = fixtureMap[entry.cardKey]
    return isPastDateTime(entry.cardKey.split('::')[0], fixture?.time)
  })

  const playingUpcomingEntries = playingEntries.filter((entry) => {
    const fixture = fixtureMap[entry.cardKey]
    return !isPastDateTime(entry.cardKey.split('::')[0], fixture?.time)
  })

  const umpPastAssignments     = umpAssignments.filter((a) => isPastDateTime(a.date, a.time))
  const umpUpcomingAssignments = umpAssignments.filter((a) => !isPastDateTime(a.date, a.time))

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Top bar: mode toggle + refresh ── */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          {[
            { id: 'playing',  label: '🏏 Playing'  },
            { id: 'umpiring', label: '🧢 Umpiring' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveMode(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeMode === t.id
                  ? 'bg-primary-dark text-accent'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="text-xs font-medium text-gray-500 hover:text-primary transition-colors">
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ── Team filter (superadmin only, no "All Teams") ── */}
      {isSuperAdmin ? (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {TEAMS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTeamFilter(t.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                teamFilter === t.id ? 'bg-primary-dark text-accent' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="mb-6">
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
            adminTeam === 'raising-bulls' ? 'bg-primary-dark text-accent' : 'bg-primary text-white'
          }`}>
            {teamLabel(adminTeam || 'royal-bulls')}
          </span>
        </div>
      )}

      {/* ── Loading / error states ── */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">{error}</div>
      )}

      {/* ══════════════════════ PLAYING TAB ══════════════════════ */}
      {!loading && !error && activeMode === 'playing' && (
        <div className="space-y-6">
          {playingPastEntries.length > 0 && (
            <div>
              <button
                onClick={() => setPlayingPastOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-500 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                  Past Matches
                  <span className="text-xs font-normal text-gray-400">({playingPastEntries.length})</span>
                </span>
                <motion.svg animate={{ rotate: playingPastOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-gray-500"
                >
                  <path d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>
              <AnimatePresence initial={false}>
                {playingPastOpen && (
                  <motion.div key="playing-past" initial="closed" animate="open" exit="closed" variants={sectionVariants} style={{ overflow: 'hidden' }}>
                    <div className="space-y-4 pt-3">
                      {playingPastEntries.map((entry) => (
                        <PlayingMatchCard key={entry.id} cardKey={entry.cardKey} rows={entry.rows} fixtureMap={fixtureMap}
                          collapsedKeys={playingCollapsedKeys} toggleCollapse={togglePlayingCollapse} onSelectFixture={onSelectFixture} activeSeason={activeSeason} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div>
            <SectionHeader title="Upcoming Matches" count={playingUpcomingEntries.length} dotColor="bg-accent" />
            {playingUpcomingEntries.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No upcoming matches.</p>
            ) : (
              <div className="space-y-4">
                {playingUpcomingEntries.map((entry) => (
                  <PlayingMatchCard key={entry.id} cardKey={entry.cardKey} rows={entry.rows} fixtureMap={fixtureMap}
                    collapsedKeys={playingCollapsedKeys} toggleCollapse={togglePlayingCollapse} onSelectFixture={onSelectFixture} activeSeason={activeSeason} />
                ))}
              </div>
            )}
          </div>

          {playingEntries.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-lg font-medium text-gray-500">No fixtures found for this selection.</p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════ UMPIRING TAB ══════════════════════ */}
      {!loading && !error && activeMode === 'umpiring' && (
        <div className="space-y-6">
          {umpPastAssignments.length > 0 && (
            <div>
              <button
                onClick={() => setUmpPastOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-500 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                  Past Umpiring Duties
                  <span className="text-xs font-normal text-gray-400">({umpPastAssignments.length})</span>
                </span>
                <motion.svg animate={{ rotate: umpPastOpen ? 180 : 0 }} transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-gray-500"
                >
                  <path d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>
              <AnimatePresence initial={false}>
                {umpPastOpen && (
                  <motion.div key="ump-past" initial="closed" animate="open" exit="closed" variants={sectionVariants} style={{ overflow: 'hidden' }}>
                    <div className="space-y-4 pt-3">
                      {umpPastAssignments.map((assignment) => (
                        <UmpiringMatchCard
                          key={assignment.id}
                          assignment={assignment}
                          rows={umpGrouped[assignment.id] || []}
                          collapsedIds={umpCollapsedIds}
                          toggleCollapse={toggleUmpCollapse}
                          playersByTeam={playersByTeam}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div>
            <SectionHeader title="Upcoming Umpiring Duties" count={umpUpcomingAssignments.length} dotColor="bg-blue-500" />
            {umpUpcomingAssignments.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No upcoming umpiring duties.</p>
            ) : (
              <div className="space-y-4">
                {umpUpcomingAssignments.map((assignment) => (
                  <UmpiringMatchCard
                    key={assignment.id}
                    assignment={assignment}
                    rows={umpGrouped[assignment.id] || []}
                    collapsedIds={umpCollapsedIds}
                    toggleCollapse={toggleUmpCollapse}
                    playersByTeam={playersByTeam}
                  />
                ))}
              </div>
            )}
          </div>

          {umpAssignments.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <div className="text-4xl mb-3">🧢</div>
              <p className="text-lg font-medium text-gray-500">No umpiring duties found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
