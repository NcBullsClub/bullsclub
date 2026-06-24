import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { SEASONS } from '../../config/seasons'

// Only show fixtures within the last 7 days or upcoming
function isRelevantFixture(f) {
  const d = new Date(f.date + 'T00:00:00')
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  return d >= cutoff
}

function isPastFixture(f) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [y, m, d] = f.date.split('-').map(Number)
  return new Date(y, m - 1, d) < today
}

function teamLabel(t) {
  return t === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const month = dt.toLocaleDateString('en-US', { month: 'long' })
  return `${month} ${ordinal(dt.getDate())}, ${y}`
}

function subtractMinutes(timeStr, mins) {
  if (!timeStr) return null
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!match) return null
  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const meridiem = match[3].toUpperCase()
  if (meridiem === 'PM' && hours !== 12) hours += 12
  if (meridiem === 'AM' && hours === 12) hours = 0
  const total = hours * 60 + minutes - mins
  let h = Math.floor(total / 60)
  const m2 = total % 60
  const newMer = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${String(m2).padStart(2, '0')} ${newMer}`
}

function titleCaseSlug(value) {
  return String(value || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function seasonMetaFromFixture(fixture) {
  const fallbackYear = fixture?.date ? Number(String(fixture.date).slice(0, 4)) : new Date().getFullYear()
  const seasonId = String(fixture?.season || '').trim()
  const known = SEASONS.find((s) => s.id === seasonId)
  if (known) {
    return { year: known.year, shortLabel: known.shortLabel }
  }

  if (!seasonId) {
    return { year: fallbackYear, shortLabel: 'Mega Bash' }
  }

  const yyMatch = seasonId.match(/-(\d{2})$/)
  const inferredYear = yyMatch ? Number(`20${yyMatch[1]}`) : fallbackYear
  const inferredLabel = titleCaseSlug(seasonId.replace(/-(\d{2})$/, ''))
  return { year: inferredYear, shortLabel: inferredLabel || 'Mega Bash' }
}

function defaultDivisionFromFixture(fixture, shortLabel) {
  const explicitDivision = String(fixture?.division || '').trim()
  if (explicitDivision) {
    const normalized = explicitDivision.replace(/\s+/g, '').toUpperCase()
    const numberMatch = normalized.match(/^(?:D|DIVISION)?(\d+)$/)
    if (numberMatch) return `Division - ${numberMatch[1]}`

    const divisionTextMatch = explicitDivision.match(/^division\s*[-:]?\s*(\d+)$/i)
    if (divisionTextMatch) return `Division - ${divisionTextMatch[1]}`

    return explicitDivision
  }

  if (String(shortLabel || '').toLowerCase().includes('winter')) {
    return 'Division - 4'
  }

  return fixture?.team === 'royal-bulls' ? 'Division - 9' : 'Division - 5'
}

function defaultSeasonDivisionText(fixture) {
  if (!fixture) return '2026 HT Mega Bash - Division 5'
  const { shortLabel } = seasonMetaFromFixture(fixture)
  const matchYear = fixture?.date ? Number(String(fixture.date).slice(0, 4)) : new Date().getFullYear()
  const matchFormat = String(fixture?.format || 'HT').trim() || 'HT'
  const division = defaultDivisionFromFixture(fixture, shortLabel)
  return `${matchYear} ${matchFormat} ${shortLabel} - ${division}`
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

// ─── Shared player row used in the picker ────────────────────────────────────
function PlayerPickerRow({ name, isSel, onToggle, badge }) {
  const displayName = name.split(' ')[0]
  const fullLastName = name.split(' ').slice(1).join(' ')
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-all ${
        isSel
          ? 'bg-primary-dark text-white font-medium ring-1 ring-accent/40'
          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
      }`}
    >
      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-[10px] ${
        isSel ? 'border-accent bg-accent text-primary-dark' : 'border-gray-300'
      }`}>
        {isSel && '✓'}
      </span>
      <span className="flex-1 truncate">
        <span className="font-medium">{displayName}</span>
        {fullLastName && <span className="opacity-60 ml-1 text-xs">{fullLastName}</span>}
      </span>
      {badge && !isSel && (
        <span className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500">
          {badge}
        </span>
      )}
    </button>
  )
}

// ─── Collapsible "No Response" section ───────────────────────────────────────
function NoResponseSection({ players, selected, onToggle }) {
  const [expanded, setExpanded] = useState(false)
  const selectedCount = players.filter((p) => selected.includes(p.full_name)).length

  return (
    <div className="border border-dashed border-gray-300 rounded-xl overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">
            ⚠️ No Response ({players.length})
          </span>
          {selectedCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-dark text-accent">
              {selectedCount} selected
            </span>
          )}
        </div>
        <span className={`text-gray-400 text-xs transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Collapsible body */}
      {expanded && (
        <div className="px-3 py-2.5 space-y-1 bg-white">
          <p className="text-[11px] text-gray-400 mb-2">
            These players haven't submitted their availability. You can still include them in the XI.
          </p>
          {players.map((p) => {
            const isSel = selected.includes(p.full_name)
            return (
              <PlayerPickerRow
                key={p.id}
                name={p.full_name}
                isSel={isSel}
                onToggle={() => onToggle(p.full_name)}
                badge="?"
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Guest Players Section ──────────────────────────────────────────────────
function GuestPlayersSection({ guests, selected, onToggle, onAdd, onRemove }) {
  const [expanded, setExpanded] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [err, setErr] = useState('')
  const selectedCount = guests.filter((g) => selected.includes(g)).length

  function handleAdd() {
    const name = inputVal.trim()
    if (!name) { setErr('Enter a name first.'); return }
    if (name.length < 2) { setErr('Name is too short.'); return }
    if (guests.some((g) => g.toLowerCase() === name.toLowerCase())) {
      setErr('Already added.'); return
    }
    onAdd(name)
    setInputVal('')
    setErr('')
  }

  function handleKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
  }

  return (
    <div className="border border-dashed border-blue-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 transition-colors touch-manipulation"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-blue-600">
            ➕ Guest Players
          </span>
          {selectedCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-dark text-accent">
              {selectedCount} selected
            </span>
          )}
          {guests.length > 0 && selectedCount === 0 && (
            <span className="text-[10px] font-normal text-blue-400">({guests.length} added)</span>
          )}
        </div>
        <span className={`text-blue-400 text-xs transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Body */}
      {expanded && (
        <div className="px-3 py-3 bg-white space-y-2.5">
          <p className="text-[11px] text-gray-400">
            Temporary players not on the roster — available for this match only.
          </p>

          {/* Input row */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => { setInputVal(e.target.value); setErr('') }}
              onKeyDown={handleKey}
              placeholder="Full name e.g. Ravi Kumar"
              maxLength={50}
              className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-300"
            />
            <button
              onClick={handleAdd}
              className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
            >
              Add
            </button>
          </div>
          {err && <p className="text-[11px] text-red-500">{err}</p>}

          {/* Guest list */}
          {guests.length > 0 && (
            <div className="space-y-1 pt-0.5">
              {guests.map((name) => {
                const isSel = selected.includes(name)
                return (
                  <div key={name} className="flex items-center gap-1">
                    <div className="flex-1 min-w-0">
                      <PlayerPickerRow
                        name={name}
                        isSel={isSel}
                        onToggle={() => onToggle(name)}
                        badge="Guest"
                      />
                    </div>
                    <button
                      onClick={() => onRemove(name)}
                      title="Remove guest player"
                      className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 active:bg-red-100 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {guests.length === 0 && (
            <p className="text-[11px] text-gray-400 text-center py-1">
              No guest players added yet.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function WhatsAppSummaryTab({ initialFixtureKey = '' }) {
  const { isSuperAdmin } = useAuth()

  // Fixtures from Supabase
  const [allFixtures, setAllFixtures] = useState([])
  useEffect(() => {
    supabase.from('fixtures').select('*').order('date', { ascending: true })
      .then(({ data }) => setAllFixtures(data || []))
  }, [])

  const visibleFixtures = allFixtures
    .filter((f) => {
      return isRelevantFixture(f)
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const [selectedKey, setSelectedKey]   = useState(initialFixtureKey)
  const [availability, setAvailability]  = useState([])
  const [allTeamPlayers, setAllTeamPlayers] = useState([])
  const [loading, setLoading]            = useState(false)
  const [selected, setSelected]          = useState([])
  const [guestPlayers, setGuestPlayers]   = useState([])

  // Sync when parent navigates here with a pre-selected fixture
  useEffect(() => {
    if (initialFixtureKey) setSelectedKey(initialFixtureKey)
  }, [initialFixtureKey])

  const [season,     setSeason]     = useState('2026 HT Mega Bash - Division 5')
  const [gameNumber, setGameNumber] = useState('')
  const [umpires,    setUmpires]    = useState('')
  const [arriveBy,   setArriveBy]   = useState('')

  const selectedFixture = visibleFixtures.find(
    (f) => `${f.date}::${f.team}` === selectedKey,
  )

  // Auto-set season/division and umpires based on selected fixture
  useEffect(() => {
    if (!selectedFixture) return
    setSeason(defaultSeasonDivisionText(selectedFixture))
    // Auto-fill umpires from fixture data
    const u1 = selectedFixture.umpire1_team || ''
    const u2 = selectedFixture.umpire2_team || ''
    if (u1 || u2) {
      setUmpires(u1 === u2 ? u1 : [u1, u2].filter(Boolean).join(' & '))
    }
    // Auto-set arriveBy to 30 mins before fixture time
    if (selectedFixture.time) {
      const arrive = subtractMinutes(selectedFixture.time, 30)
      if (arrive) setArriveBy(arrive)
    }
  }, [selectedFixture?.id])

  useEffect(() => {
    if (!selectedKey) { setAvailability([]); setAllTeamPlayers([]); setSelected([]); return }
    const [date, team] = selectedKey.split('::')
    setLoading(true)
    setSelected([])
    setGuestPlayers([])
    Promise.all([
      supabase
        .from('availability')
        .select('*, profiles(full_name)')
        .eq('fixture_date', date)
        .eq('fixture_team', team)
        .order('status'),
      supabase
        .from('profiles')
        .select('id, full_name')
        .eq('team', team)
        .order('full_name'),
    ]).then(([{ data: avail }, { data: players }]) => {
      setAvailability(avail || [])
      setAllTeamPlayers(players || [])
      setLoading(false)
    })
  }, [selectedKey])

  function togglePlayer(name) {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    )
  }

  function addGuest(name) {
    setGuestPlayers((prev) => [...prev, name])
    // Auto-select them into the XI immediately
    setSelected((prev) => prev.includes(name) ? prev : [...prev, name])
  }

  function removeGuest(name) {
    setGuestPlayers((prev) => prev.filter((g) => g !== name))
    setSelected((prev) => prev.filter((n) => n !== name))
  }

  function moveUp(idx) {
    if (idx === 0) return
    setSelected((prev) => {
      const arr = [...prev]
      ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
      return arr
    })
  }

  function moveDown(idx) {
    setSelected((prev) => {
      if (idx === prev.length - 1) return prev
      const arr = [...prev]
      ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
      return arr
    })
  }

  function buildMessage() {
    if (!selectedFixture || selected.length === 0) return ''
    const gameLabel = gameNumber ? `${ordinal(Number(gameNumber))} Game` : 'Game'
    const fixtureTypeLabel = getFixtureTypeLabel(selectedFixture?.type)
    const playingLabel = fixtureTypeLabel ? `${fixtureTypeLabel} Game` : gameLabel
    const playerLines = [...selected]
      .sort((a, b) => a.split(' ')[0].localeCompare(b.split(' ')[0]))
      .map((name, i) => `${String(i + 1).padStart(2, ' ')}. ${name.split(' ')[0]}`)
      .join('\n')

    const lines = [
      `${season}🏆`,
      '',
      `Playing 11 for ${playingLabel}:`,
      `⚔️ *${teamLabel(selectedFixture.team)} Vs ${selectedFixture.opponent}*`,
      `📅 *Date: ${formatDate(selectedFixture.date)}*`,
      `⏰ *Time: ${selectedFixture.time || 'TBD'}*`,
      `🏟️ *Venue: ${selectedFixture.venue}*`,
    ]
    if (umpires) lines.push(`🧢 *Umpires: ${umpires}*`)
    if (selectedFixture.venue_address) lines.push(`*Ground Address: ${selectedFixture.venue_address}*`)
    lines.push(`📍 Maps & Details: https://ncbullscricketclub.com/#/fixtures/${selectedFixture.id}`)
    
    lines.push('', playerLines, '')
    lines.push(`Please come by ${arriveBy || 'on time'} and acknowledge!!!`)
    return lines.join('\n')
  }

  const message = buildMessage()

  const inPlayers    = availability.filter((r) => r.status === 'in')
    .sort((a, b) => (a.profiles?.full_name || '').localeCompare(b.profiles?.full_name || ''))
  const maybePlayers = availability.filter((r) => r.status === 'maybe')
    .sort((a, b) => (a.profiles?.full_name || '').localeCompare(b.profiles?.full_name || ''))
  const respondedIds = new Set(availability.map((r) => r.user_id))
  const noResponsePlayers = allTeamPlayers
    .filter((p) => !respondedIds.has(p.id))
    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h2 className="font-display font-bold text-primary text-2xl mb-1">Team Selection</h2>
        <p className="text-sm text-gray-500 hidden sm:block">
          Pick your Playing XI from available players and generate the announcement message.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* ── Left column ── fixture + meta + player picker */}
        <div className="space-y-3 sm:space-y-5">
          {/* Fixture selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Fixture</label>
            {visibleFixtures.length === 0 ? (
              <p className="text-sm text-gray-400">No upcoming fixtures found.</p>
            ) : (
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
              >
                <option value="">— Choose a fixture —</option>
                {visibleFixtures.map((f) => {
                  const [y, m, d] = f.date.split('-').map(Number)
                  const label = new Date(y, m - 1, d).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric',
                  })
                  const past = isPastFixture(f)
                  return (
                    <option
                      key={`${f.date}::${f.team}`}
                      value={`${f.date}::${f.team}`}
                      disabled={past}
                    >
                      {past ? '⛔ ' : ''}{label} — vs {f.opponent} ({teamLabel(f.team)}){past ? ' (Past)' : ''}
                    </option>
                  )
                })}
              </select>
            )}
          </div>

          {/* Match detail fields */}
          <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-5 space-y-2.5 sm:space-y-4">
            <h3 className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wide">Match Details</h3>

            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 mb-1">Season / Division</label>
              <input
                type="text"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                placeholder="e.g. 2026 HT Mega Bash - Division 5"
                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 mb-1">Game #</label>
                <input
                  type="number"
                  min="1"
                  value={gameNumber}
                  onChange={(e) => setGameNumber(e.target.value)}
                  placeholder="3"
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 mb-1">Arrive By</label>
                <input
                  type="text"
                  value={arriveBy}
                  onChange={(e) => setArriveBy(e.target.value)}
                  placeholder="12:30 PM"
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 mb-1">Umpires</label>
                <input
                  type="text"
                  value={umpires}
                  onChange={(e) => setUmpires(e.target.value)}
                  placeholder="Team HT"
                  className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </div>

          {/* Player picker */}
          {selectedKey && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
                Available Players
                <span className="ml-2 text-xs font-normal text-gray-400 normal-case">
                  tap to add to Playing XI
                </span>
              </h3>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* ── Confirmed ── */}
                  {inPlayers.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-green-600 mb-2">✅ Confirmed ({inPlayers.length})</p>
                      <div className="space-y-1">
                        {inPlayers.map((r) => {
                          const name = r.profiles?.full_name || 'Unknown'
                          const isSel = selected.includes(name)
                          return (
                            <PlayerPickerRow
                              key={r.id}
                              name={name}
                              isSel={isSel}
                              onToggle={() => togglePlayer(name)}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Maybe ── */}
                  {maybePlayers.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-600 mb-2">🤔 Maybe ({maybePlayers.length})</p>
                      <div className="space-y-1">
                        {maybePlayers.map((r) => {
                          const name = r.profiles?.full_name || 'Unknown'
                          const isSel = selected.includes(name)
                          return (
                            <PlayerPickerRow
                              key={r.id}
                              name={name}
                              isSel={isSel}
                              onToggle={() => togglePlayer(name)}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── No Response ── */}
                  {noResponsePlayers.length > 0 && (
                    <NoResponseSection
                      players={noResponsePlayers}
                      selected={selected}
                      onToggle={togglePlayer}
                    />
                  )}

                  {/* ── Guest Players ── */}
                  <GuestPlayersSection
                    guests={guestPlayers}
                    selected={selected}
                    onToggle={togglePlayer}
                    onAdd={addGuest}
                    onRemove={removeGuest}
                  />

                  {inPlayers.length === 0 && maybePlayers.length === 0 && noResponsePlayers.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No players found for this team.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right column ── ordered XI + message preview */}
        <div className="space-y-5">
          {selected.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
                Playing XI ({selected.length})
              </h3>
              <div className="space-y-1.5">
                {selected.map((name, idx) => (
                  <div
                    key={name}
                    className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5"
                  >
                    <span className="w-5 text-center text-xs font-bold text-gray-400">{idx + 1}</span>
                    <span className="flex-1 text-sm font-medium text-gray-800">{name.split(' ')[0]}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-primary hover:bg-gray-200 disabled:opacity-20 transition-all text-xs"
                      >▲</button>
                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === selected.length - 1}
                        className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-primary hover:bg-gray-200 disabled:opacity-20 transition-all text-xs"
                      >▼</button>
                      <button
                        onClick={() => togglePlayer(name)}
                        className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-all text-xs"
                      >✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {message && (
            <div className="bg-gray-900 rounded-2xl p-5">
              <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide font-semibold">
                Message Preview
              </p>
              <pre className="text-green-400 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                {message}
              </pre>
            </div>
          )}

          {message && (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-[#25D366] hover:bg-[#1ebe59] text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.852L.057 23.428a.75.75 0 00.914.914l5.638-1.47A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.708 9.708 0 01-4.943-1.35l-.355-.21-3.676.958.978-3.589-.23-.368A9.75 9.75 0 1112 21.75z"/>
              </svg>
              Post on WhatsApp
            </a>
          )}

          {selectedKey && !loading && selected.length === 0 && availability.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-700">
              Select players from the left panel to build your Playing XI.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
