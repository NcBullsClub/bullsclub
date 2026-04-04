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

export default function WhatsAppSummaryTab() {
  const { isSuperAdmin, adminTeam } = useAuth()

  const visibleFixtures = fixtures
    .filter((f) => {
      if (!isSuperAdmin && f.team !== adminTeam) return false
      return isRelevantFixture(f)
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const [selectedKey, setSelectedKey] = useState('')
  const [availability, setAvailability] = useState([])
  const [loading, setLoading]           = useState(false)
  const [selected, setSelected]         = useState([])

  const [season,     setSeason]     = useState('2026 HT Mega Bash - Division 5')
  const [gameNumber, setGameNumber] = useState('')
  const [umpires,    setUmpires]    = useState('')
  const [arriveBy,   setArriveBy]   = useState('')
  const [copied, setCopied]         = useState(false)

  const selectedFixture = visibleFixtures.find(
    (f) => `${f.date}::${f.team}` === selectedKey,
  )

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
    const playerLines = selected
      .map((name, i) => `${String(i + 1).padStart(2, ' ')}. ${name}`)
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
    if (umpires) lines.push(`Umpires: ${umpires}`)
    lines.push('', playerLines, '')
    lines.push(`Please come by ${arriveBy || 'on time'} and acknowledge!!!`)
    return lines.join('\n')
  }

  const message = buildMessage()

  async function handleCopy() {
    if (!message) return
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const inPlayers    = availability.filter((r) => r.status === 'in')
  const maybePlayers = availability.filter((r) => r.status === 'maybe')

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="font-display font-bold text-primary text-2xl mb-1">Team Selection</h2>
        <p className="text-sm text-gray-500">
          Pick your Playing XI from available players and generate the announcement message.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left column ── fixture + meta + player picker */}
        <div className="space-y-5">
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
                  return (
                    <option key={`${f.date}::${f.team}`} value={`${f.date}::${f.team}`}>
                      {label} — vs {f.opponent} ({teamLabel(f.team)})
                    </option>
                  )
                })}
              </select>
            )}
          </div>

          {/* Match detail fields */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Match Details</h3>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Season / Division</label>
              <input
                type="text"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                placeholder="e.g. 2026 HT Mega Bash - Division 5"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Game Number</label>
                <input
                  type="number"
                  min="1"
                  value={gameNumber}
                  onChange={(e) => setGameNumber(e.target.value)}
                  placeholder="e.g. 3"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Arrive By</label>
                <input
                  type="text"
                  value={arriveBy}
                  onChange={(e) => setArriveBy(e.target.value)}
                  placeholder="e.g. 12:30 PM"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Umpires</label>
              <input
                type="text"
                value={umpires}
                onChange={(e) => setUmpires(e.target.value)}
                placeholder="e.g. Triangle Troopers HT"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
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
                          const isSel = selected.includes(name)
                          return (
                            <button
                              key={r.id}
                              onClick={() => togglePlayer(name)}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-left transition-all ${
                                isSel
                                  ? 'bg-primary-dark text-white font-medium'
                                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs ${
                                isSel ? 'border-accent bg-accent text-primary-dark' : 'border-gray-300'
                              }`}>
                                {isSel && '✓'}
                              </span>
                              {name}
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
                          const isSel = selected.includes(name)
                          return (
                            <button
                              key={r.id}
                              onClick={() => togglePlayer(name)}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-left transition-all ${
                                isSel
                                  ? 'bg-primary-dark text-white font-medium'
                                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs ${
                                isSel ? 'border-accent bg-accent text-primary-dark' : 'border-gray-300'
                              }`}>
                                {isSel && '✓'}
                              </span>
                              {name}
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
                    className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2"
                  >
                    <span className="w-6 text-center text-xs font-bold text-gray-400">{idx + 1}</span>
                    <span className="flex-1 text-sm font-medium text-gray-800">{name}</span>
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
            <button
              onClick={handleCopy}
              className={`w-full btn-primary px-8 py-3 text-sm flex items-center justify-center gap-2 transition-all ${
                copied ? 'bg-green-600 hover:bg-green-600' : ''
              }`}
            >
              {copied ? '✓ Copied!' : '📋 Copy Message'}
            </button>
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
