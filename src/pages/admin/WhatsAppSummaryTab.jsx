import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import fixtures from '../../data/fixtures.json'

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

export default function WhatsAppSummaryTab({ initialFixtureKey = '' }) {
  const { isSuperAdmin, adminTeam } = useAuth()

  const visibleFixtures = fixtures
    .filter((f) => {
      if (!isSuperAdmin && f.team !== adminTeam) return false
      return isRelevantFixture(f)
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const [selectedKey, setSelectedKey] = useState(initialFixtureKey)
  const [availability, setAvailability] = useState([])
  const [loading, setLoading]           = useState(false)
  const [selected, setSelected]         = useState([])

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

  // Auto-set season/division based on selected fixture's team
  useEffect(() => {
    if (!selectedFixture) return
    setSeason(
      selectedFixture.team === 'royal-bulls'
        ? '2026 HT Mega Bash - Division 9'
        : '2026 HT Mega Bash - Division 5',
    )
  }, [selectedFixture?.team])

  useEffect(() => {
    if (!selectedKey) { setAvailability([]); setSelected([]); return }
    const [date, team] = selectedKey.split('::')
    setLoading(true)
    setSelected([])
    supabase
      .from('availability')
      .select('*, profiles(full_name)')
      .eq('fixture_date', date)
      .eq('fixture_team', team)
      .in('status', ['in', 'maybe'])
      .order('status')
      .then(({ data }) => {
        setAvailability(data || [])
        setLoading(false)
      })
  }, [selectedKey])

  function togglePlayer(name) {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    )
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
    const playerLines = [...selected]
      .sort((a, b) => a.split(' ')[0].localeCompare(b.split(' ')[0]))
      .map((name, i) => `${String(i + 1).padStart(2, ' ')}. ${name.split(' ')[0]}`)
      .join('\n')

    const lines = [
      `${season}🏆`,
      '',
      `Playing 11 for ${gameLabel}:`,
      `${teamLabel(selectedFixture.team)} Vs ${selectedFixture.opponent}`,
      `Date: ${formatDate(selectedFixture.date)}`,
      `Time: ${selectedFixture.time || 'TBD'}`,
      `Venue: ${selectedFixture.venue}`,
    ]
    if (selectedFixture.venueAddress) lines.push(`*Ground Address: ${selectedFixture.venueAddress}*`)
    lines.push(`📍 Maps & Details: https://ncbullscricketclub.com/#/fixtures/${selectedFixture.id}`)
    if (umpires) lines.push(`Umpires: ${umpires}`)
    lines.push('', playerLines, '')
    lines.push(`Please come by ${arriveBy || 'on time'} and acknowledge!!!`)
    return lines.join('\n')
  }

  const message = buildMessage()

  const inPlayers    = availability.filter((r) => r.status === 'in')
    .sort((a, b) => (a.profiles?.full_name || '').localeCompare(b.profiles?.full_name || ''))
  const maybePlayers = availability.filter((r) => r.status === 'maybe')
    .sort((a, b) => (a.profiles?.full_name || '').localeCompare(b.profiles?.full_name || ''))

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
              ) : availability.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No availability responses yet.</p>
              ) : (
                <div className="space-y-3">
                  {inPlayers.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-green-600 mb-2">✅ Confirmed</p>
                      <div className="space-y-1">
                        {inPlayers.map((r) => {
                          const name = r.profiles?.full_name || 'Unknown'
                          const displayName = name.split(' ')[0]
                          const isSel = selected.includes(name)
                          return (
                            <button
                              key={r.id}
                              onClick={() => togglePlayer(name)}
                              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-left transition-all ${
                                isSel
                                  ? 'bg-primary-dark text-white font-medium'
                                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-[10px] ${
                                isSel ? 'border-accent bg-accent text-primary-dark' : 'border-gray-300'
                              }`}>
                                {isSel && '✓'}
                              </span>
                              {displayName}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {maybePlayers.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-600 mb-2">🤔 Maybe</p>
                      <div className="space-y-1">
                        {maybePlayers.map((r) => {
                          const name = r.profiles?.full_name || 'Unknown'
                          const displayName = name.split(' ')[0]
                          const isSel = selected.includes(name)
                          return (
                            <button
                              key={r.id}
                              onClick={() => togglePlayer(name)}
                              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-left transition-all ${
                                isSel
                                  ? 'bg-primary-dark text-white font-medium'
                                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-[10px] ${
                                isSel ? 'border-accent bg-accent text-primary-dark' : 'border-gray-300'
                              }`}>
                                {isSel && '✓'}
                              </span>
                              {displayName}
                            </button>
                          )
                        })}
                      </div>
                    </div>
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
