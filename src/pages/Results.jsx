import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useSeason } from '../contexts/SeasonContext'
import { SEASONS } from '../config/seasons'
import SeasonSwitcher, { SeasonSwitcherInline } from '../components/ui/SeasonSwitcher'

function isComplete(r) {
  return !!(r.result && r.ncb_score && r.opp_score)
}

function renderResult(result) {
  if (!result) return null
  for (const team of ['Raising Bulls', 'Royal Bulls']) {
    const idx = result.indexOf(team)
    if (idx !== -1) {
      return (
        <>{result.slice(0, idx)}<strong>{team}</strong>{result.slice(idx + team.length)}</>
      )
    }
  }
  return result
}

function isWon(r) {
  if (!isComplete(r)) return false
  const label = r.team === 'raising-bulls' ? 'Raising Bulls won' : 'Royal Bulls won'
  return r.result.toLowerCase().includes(label.toLowerCase())
}

const teamsFilter = [
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls', label: 'Royal Bulls' },
]

function CoinIcon({ className = 'w-3 h-3 flex-shrink-0' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="9" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="6.5" stroke="#D97706" strokeWidth="0.75" fill="none" />
      <circle cx="10" cy="10" r="2" fill="#D97706" />
    </svg>
  )
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return {
    day:     String(d).padStart(2, '0'),
    month:   date.toLocaleDateString('en-US', { month: 'short' }),
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    full:    date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    year:    y,
  }
}

export default function Results() {
  const { user } = useAuth()
  const { activeSeason } = useSeason()
  const [activeTab, setActiveTab] = useState('matches')
  const [teamFilter, setTeamFilter] = useState('raising-bulls')
  const [results, setResults]       = useState([])
  const [fixtureMap, setFixtureMap] = useState({}) // `date::team` -> fixture
  const [umpAssignments, setUmpAssignments] = useState([])
  const [umpAvailability, setUmpAvailability] = useState([])
  const [playerMap, setPlayerMap] = useState({})
  const [rosterPlayers, setRosterPlayers] = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    setLoading(true)
    const isFirst = activeSeason.id === SEASONS[0].id
    Promise.all([
      supabase.from('match_results').select('*').eq('team', teamFilter).eq('season', activeSeason.id).order('fixture_date', { ascending: false }),
      supabase.from('fixtures').select('id, date, team, umpire1_team, umpire2_team').eq('team', teamFilter).eq('season', activeSeason.id),
      isFirst
        ? supabase.from('umpiring_assignments').select('*').eq('ncb_team', teamFilter).or(`season.eq.${activeSeason.id},season.is.null`)
        : supabase.from('umpiring_assignments').select('*').eq('ncb_team', teamFilter).eq('season', activeSeason.id),
      isFirst
        ? supabase.from('umpiring_availability').select('user_id, umpiring_assignment_id, status, ncb_team').eq('status', 'in').eq('ncb_team', teamFilter).or(`season.eq.${activeSeason.id},season.is.null`)
        : supabase.from('umpiring_availability').select('user_id, umpiring_assignment_id, status, ncb_team').eq('status', 'in').eq('ncb_team', teamFilter).eq('season', activeSeason.id),
      supabase.from('profiles').select('id, full_name, team').eq('team', teamFilter),
    ]).then(([{ data: resData }, { data: fixData }, { data: assgnData }, { data: availData }, { data: playersData }]) => {
      setResults(resData || [])
      const map = {}
      ;(fixData || []).forEach((f) => { map[`${f.date}::${f.team}`] = f })
      setFixtureMap(map)
      setUmpAssignments(assgnData || [])
      setUmpAvailability(availData || [])
      setRosterPlayers(playersData || [])
      const pmap = {}
      ;(playersData || []).forEach((p) => { pmap[p.id] = p.full_name })
      setPlayerMap(pmap)
      setLoading(false)
    })
  }, [teamFilter, activeSeason])

  const wins   = results.filter(isWon).length
  const losses = results.filter((r) => !isWon(r)).length

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const pastAssignments = umpAssignments.filter((a) => {
    const [y, m, d] = a.date.split('-').map(Number)
    return new Date(y, m - 1, d) < today
  })
  const pastIds = new Set(pastAssignments.map((a) => a.id))

  const completedByUser = {}
  umpAvailability.forEach((av) => {
    if (!pastIds.has(av.umpiring_assignment_id) || av.status !== 'in') return
    if (!completedByUser[av.user_id]) completedByUser[av.user_id] = []
    completedByUser[av.user_id].push(av.umpiring_assignment_id)
  })

  const completedPlayers = rosterPlayers.filter((p) => (completedByUser[p.id] || []).length > 0)
  const notCompletedPlayers = rosterPlayers.filter((p) => (completedByUser[p.id] || []).length === 0)

  return (
    <div>
      {/* Hero — compact on mobile */}
      <section className="bg-primary-dark text-white py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between gap-3 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
              <span className="hidden md:block" />
              <div className="md:text-center">
                <h1 className="font-display text-3xl md:text-6xl font-bold leading-tight">
                  <span className="text-accent">RESULTS</span>
                </h1>
                <p className="text-gray-400 text-xs md:text-lg mt-0.5">Match results and scorecards</p>
              </div>
              <div className="flex md:justify-end">
                <SeasonSwitcherInline />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filter + record bar */}
      <section className="bg-white sticky top-16 z-30 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {teamsFilter.map((t) => (
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
            {!loading && results.length > 0 && (
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full">W {wins}</span>
                <span className="bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full">L {losses}</span>
                <span className="text-gray-400 hidden sm:inline">{results.length} matches</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('matches')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'matches' ? 'bg-primary-dark text-accent' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Match Results
            </button>
            {user && (
              <button
                onClick={() => setActiveTab('umpiring')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'umpiring' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Umpirings Completed
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Results list */}
      <section className="py-6 md:py-12 bg-surface min-h-[60vh]">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
          {!loading && activeTab === 'umpiring' && user && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-2xl border border-blue-200 bg-white p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">✅</span>
                </div>
                <div>
                  <div className="text-2xl font-display font-bold text-blue-700">{completedPlayers.length}</div>
                  <div className="text-xs text-gray-500 font-medium">Completed</div>
                </div>
              </div>
              <div className="rounded-2xl border border-red-200 bg-white p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">⏳</span>
                </div>
                <div>
                  <div className="text-2xl font-display font-bold text-red-500">{notCompletedPlayers.length}</div>
                  <div className="text-xs text-gray-500 font-medium">Not Completed</div>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeTab === 'umpiring' && !user ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4 text-2xl">🔒</div>
              <h3 className="font-display font-bold text-gray-700 text-lg mb-1">Members Only</h3>
              <p className="text-sm text-gray-400 mb-4">You need to be logged in to view umpiring records.</p>
              <a href="/login" className="px-5 py-2 rounded-xl bg-primary-dark text-accent text-sm font-semibold hover:opacity-90 transition-all">
                Log in
              </a>
            </div>
          ) : activeTab === 'matches' && results.length === 0 ? (
            <div className="text-center py-20 text-gray-400">No results for the selected team yet.</div>
          ) : activeTab === 'matches' ? (
            <div className="space-y-3 md:space-y-4">
              {results.map((r, i) => {
                const complete  = isComplete(r)
                const won       = isWon(r)
                const teamLabel = r.team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'
                const dt        = formatDate(r.fixture_date)
                const fixture   = fixtureMap[`${r.fixture_date}::${r.team}`]
                const umpires   = fixture
                  ? [fixture.umpire1_team, fixture.umpire2_team].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' & ')
                  : null

                // Border & badge colour helpers
                const borderColor = complete ? (won ? 'border-l-green-500' : 'border-l-red-400') : 'border-l-amber-400'
                const badgeBg     = complete ? (won ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600') : 'bg-amber-100 text-amber-700'
                const badgeLabel  = complete ? (won ? 'W' : 'L') : '~'

                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    {/* ── Mobile card ── */}
                    <div className={`sm:hidden bg-white rounded-2xl overflow-hidden border border-gray-100 border-l-4 ${borderColor}`}>

                      {/* Row 1: badge + match title + date */}
                      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm flex-shrink-0 ${badgeBg}`}>
                          {badgeLabel}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-bold text-primary text-[13px] leading-tight truncate">
                            {teamLabel} <span className="font-normal text-gray-400 text-xs">vs</span> {r.opponent}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.team === 'raising-bulls' ? 'bg-primary-dark/10 text-primary-dark' : 'bg-primary/10 text-primary'}`}>
                              {r.format || (r.team === 'raising-bulls' ? 'Div5' : 'Div9')}
                            </span>
                            {r.format && <span className="text-[9px] font-bold bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">{r.team === 'raising-bulls' ? 'Div5' : 'Div9'}</span>}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="text-[11px] font-semibold text-gray-700 tabular-nums">{dt.day} {dt.month}</div>
                          <div className="text-[9px] text-gray-400">{dt.weekday} {dt.year}</div>
                        </div>
                      </div>

                      {/* Row 2: scores side by side */}
                      {(r.ncb_score || r.opp_score) && (
                        <div className="px-3 pb-2 grid grid-cols-2 gap-1.5">
                          <div className={`rounded-xl px-3 py-1.5 ${won ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}>
                            <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide truncate">{teamLabel}</div>
                            <div className={`font-mono font-bold text-sm leading-tight ${won ? 'text-green-700' : 'text-gray-800'}`}>{r.ncb_score || '—'}</div>
                          </div>
                          <div className="bg-gray-50 rounded-xl px-3 py-1.5">
                            <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide truncate">{r.opponent}</div>
                            <div className="font-mono font-bold text-sm text-gray-500 leading-tight">{r.opp_score || '—'}</div>
                          </div>
                        </div>
                      )}

                      {/* Row 3: venue + umpires in one row */}
                      {(r.venue || umpires) && (
                        <div className="px-3 pb-1.5">
                          <div className="flex items-center gap-1.5 text-[9px] min-w-0">
                            {r.venue && (
                              <>
                                <svg className="w-2.5 h-2.5 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                  <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.013 3.5-4.628 3.5-7.327A8 8 0 004 12c0 2.699 1.556 5.315 3.5 7.327a19.58 19.58 0 002.683 2.282 16.974 16.974 0 001.144.742zM12 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-400 truncate">{r.venue}</span>
                              </>
                            )}
                            {r.venue && umpires && <span className="text-gray-300">|</span>}
                            {umpires && (
                              <div className="flex items-center gap-1 min-w-0">
                                <span className="text-blue-500">🧢</span>
                                <span className="font-semibold text-blue-500">Umpires:</span>
                                <span className="text-blue-600 truncate">{umpires}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Row 4: toss */}
                      {r.toss && (
                        <div className="px-3 pb-1.5">
                          <span className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 italic">
                            <CoinIcon className="w-2.5 h-2.5 flex-shrink-0" /> <span className="font-bold not-italic">Toss:</span> {r.toss}
                          </span>
                        </div>
                      )}

                      {/* Row 5: result + scorecard + highlights */}
                      {(r.result || r.scorecard_url || r.video_url || !complete) && (
                        <div className="px-3 pb-2 flex items-center justify-between gap-2 min-w-0 flex-wrap">
                          <div className="min-w-0">
                            {!complete ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                ⏳ Result Pending
                              </span>
                            ) : (
                              r.result && (
                                <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full truncate ${
                                  won ? 'bg-green-50 text-green-700 border border-green-200'
                                      : 'bg-red-50 text-red-600 border border-red-200'
                                }`}>
                                  {renderResult(r.result)}
                                </span>
                              )
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                          {r.scorecard_url && (
                            <a href={r.scorecard_url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[9px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full whitespace-nowrap hover:bg-blue-100 transition-colors">
                              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Scorecard ↗
                            </a>
                          )}
                          {r.video_url && (
                            <a href={r.video_url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[9px] font-semibold text-white bg-red-600 px-2.5 py-1 rounded-full whitespace-nowrap hover:bg-red-700 transition-colors">
                              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                              Highlights ↗
                            </a>
                          )}
                          </div>
                        </div>
                      )}

                      {/* Row 6: MoM */}
                      {r.mom && (
                        <div className="border-t border-gray-100 px-3 py-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[10px] flex-shrink-0">🏆</span>
                            <div className="min-w-0">
                              <div className="text-[10px] font-semibold text-primary truncate">{r.mom}</div>
                              {r.mom_stat && <div className="text-[9px] text-gray-400 truncate">{r.mom_stat}</div>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── Desktop card ── */}
                    <div className={`hidden sm:block bg-white rounded-2xl border-l-4 overflow-hidden shadow-sm hover:shadow-md transition-all ${borderColor}`}>
                      <div className="p-5 md:p-6">
                        <div className="flex items-start gap-4">
                          {/* W/L/~ badge */}
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center font-display font-bold text-lg flex-shrink-0 ${badgeBg}`}>
                            {badgeLabel}
                          </div>

                          {/* Match info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap gap-2 mb-2">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.team === 'raising-bulls' ? 'bg-primary-dark text-accent' : 'bg-primary text-white'}`}>
                                {teamLabel}
                              </span>
                              {r.format && (
                                <span className="text-xs bg-gray-100 text-gray-400 px-2.5 py-1 rounded-full">{r.format}</span>
                              )}
                              <span className="text-xs bg-gray-100 text-gray-400 px-2.5 py-1 rounded-full">{r.team === 'raising-bulls' ? 'Div5' : 'Div9'}</span>
                            </div>
                            <h3 className="font-display font-bold text-primary text-xl mb-1">
                              {teamLabel} vs {r.opponent}
                            </h3>
                            <div className="text-sm text-gray-400 flex items-center gap-1.5 min-w-0">
                              {r.venue && (
                                <>
                                  <svg className="w-3 h-3 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.013 3.5-4.628 3.5-7.327A8 8 0 004 12c0 2.699 1.556 5.315 3.5 7.327a19.58 19.58 0 002.683 2.282 16.974 16.974 0 001.144.742zM12 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" />
                                  </svg>
                                  <span className="truncate">{r.venue}</span>
                                </>
                              )}
                              {r.venue && umpires && <span className="text-gray-300">|</span>}
                              {umpires && (
                                <span className="text-blue-600 truncate">🧢 Umpires: {umpires}</span>
                              )}
                              {(r.venue || umpires) && <span className="text-gray-300">|</span>}
                              <span>{dt.full}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {r.toss && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200 italic">
                                  <CoinIcon className="w-3.5 h-3.5 flex-shrink-0" /> <span className="font-bold not-italic">Toss:</span> {r.toss}
                                </span>
                              )}
                              {r.result && (
                                <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${
                                  !complete
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : won
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-red-100 text-red-600'
                                }`}>
                                  {renderResult(r.result)}
                                </span>
                              )}
                              {!complete && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                  ⏳ Result Pending
                                </span>
                              )}
                              {r.scorecard_url && (
                                <a href={r.scorecard_url} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors mt-1">
                                  📋 Scorecard ↗
                                </a>
                              )}
                              {r.video_url && (
                                <a href={r.video_url} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-red-600 px-2.5 py-1 rounded-full hover:bg-red-700 transition-colors mt-1">
                                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                                  Watch Highlights ↗
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Scores + scorecard */}
                          <div className="flex-shrink-0 text-right space-y-1 min-w-[140px]">
                            {r.ncb_score && (
                              <div className="bg-gray-50 rounded-xl px-3 py-1.5">
                                <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5 truncate">{teamLabel}</div>
                                <div className="font-mono font-bold text-sm text-gray-800">{r.ncb_score}</div>
                              </div>
                            )}
                            {r.opp_score && (
                              <div className="bg-gray-50 rounded-xl px-3 py-1.5">
                                <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5 truncate">{r.opponent}</div>
                                <div className="font-mono font-bold text-sm text-gray-500">{r.opp_score}</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* MoM */}
                        {r.mom && (
                          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3 text-sm">
                            <span className="text-base">🏆</span>
                            <span className="text-gray-500">Man of the Match:</span>
                            <span className="font-semibold text-primary">{r.mom}</span>
                            {r.mom_stat && <span className="text-gray-400">— {r.mom_stat}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100">
                    <span className="text-xs">🧢</span>
                  </div>
                  <h3 className="font-display font-bold text-gray-800 text-sm">Umpiring Completed</h3>
                  <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {completedPlayers.length} player{completedPlayers.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {completedPlayers.length === 0 ? (
                  <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl px-5 py-8 text-center">
                    <p className="text-sm text-gray-400">No completed umpiring sessions yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {completedPlayers.map((player) => {
                      const assignIds = completedByUser[player.id] || []
                      return (
                        <div key={player.id} className="border border-blue-200 rounded-2xl bg-white overflow-hidden">
                          <div className="px-4 py-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 bg-blue-100 text-blue-700">
                              {(player.full_name || '?')[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm text-gray-800">{player.full_name}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                  player.team === 'raising-bulls' ? 'bg-primary-dark/10 text-primary-dark' : 'bg-primary/10 text-primary'
                                }`}>
                                  {player.team === 'raising-bulls' ? 'Raising' : 'Royal'}
                                </span>
                              </div>
                              <span className="text-[11px] text-gray-400">{assignIds.length} umpiring completed</span>
                            </div>
                          </div>
                          <div className="border-t border-gray-100 divide-y divide-gray-100">
                            {assignIds.map((aid) => {
                              const assgn = umpAssignments.find((a) => a.id === aid)
                              if (!assgn) return null
                              return (
                                <div key={aid} className="px-4 py-2.5">
                                  <div className="text-xs font-semibold text-gray-700 truncate">
                                    {assgn.match_visitor} <span className="font-normal text-gray-400">vs</span> {assgn.match_home}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap text-[10px] text-gray-400">
                                    <span>{formatDate(assgn.date).full}</span>
                                    {assgn.venue && <span>· {assgn.venue}</span>}
                                    {assgn.division && (
                                      <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                                        {assgn.division.replace(/^D(\d+)$/, 'Div$1')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100">
                    <span className="text-xs">⏳</span>
                  </div>
                  <h3 className="font-display font-bold text-gray-800 text-sm">Not Completed</h3>
                  <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {notCompletedPlayers.length} player{notCompletedPlayers.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {notCompletedPlayers.length === 0 ? (
                  <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-6 text-center">
                    <p className="text-sm text-green-700 font-semibold">All players have completed umpiring duties.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notCompletedPlayers.map((player) => (
                      <div key={player.id} className="border border-gray-200 rounded-2xl bg-white px-4 py-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 bg-gray-100 text-gray-400">
                          {(player.full_name || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-gray-700">{player.full_name}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              player.team === 'raising-bulls' ? 'bg-primary-dark/10 text-primary-dark' : 'bg-primary/10 text-primary'
                            }`}>
                              {player.team === 'raising-bulls' ? 'Raising' : 'Royal'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">No past umpiring completed</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
