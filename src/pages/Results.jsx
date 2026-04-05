import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

function isWon(r) {
  if (!r.result) return false
  const label = r.team === 'raising-bulls' ? 'Raising Bulls won' : 'Royal Bulls won'
  return r.result.toLowerCase().includes(label.toLowerCase())
}

const teamsFilter = [
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls', label: 'Royal Bulls' },
]

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
  const [teamFilter, setTeamFilter] = useState('raising-bulls')
  const [results, setResults]       = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('match_results')
      .select('*')
      .eq('team', teamFilter)
      .order('fixture_date', { ascending: false })
      .then(({ data }) => {
        setResults(data || [])
        setLoading(false)
      })
  }, [teamFilter])

  const wins   = results.filter(isWon).length
  const losses = results.filter((r) => !isWon(r)).length

  return (
    <div>
      {/* Hero — compact on mobile */}
      <section className="bg-primary-dark text-white py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl md:text-6xl font-bold mb-1 md:mb-3">
              <span className="text-accent">RESULTS</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-lg">Match results and scorecards</p>
          </motion.div>
        </div>
      </section>

      {/* Filter + record bar */}
      <section className="bg-white sticky top-16 z-30 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
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
      </section>

      {/* Results list */}
      <section className="py-6 md:py-12 bg-surface min-h-[60vh]">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-20 text-gray-400">No results for the selected team yet.</div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {results.map((r, i) => {
                const won       = isWon(r)
                const teamLabel = r.team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'
                const teamShort = r.team === 'raising-bulls' ? 'RB' : 'RY'
                const dt        = formatDate(r.fixture_date)

                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    {/* ── Mobile card ── */}
                    <div className={`sm:hidden bg-white rounded-2xl border-l-4 overflow-hidden shadow-sm ${won ? 'border-green-500' : 'border-red-400'}`}>

                      {/* Top row: W/L + team + date */}
                      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm ${won ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {won ? 'W' : 'L'}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.team === 'raising-bulls' ? 'bg-primary-dark/10 text-primary-dark' : 'bg-primary/10 text-primary'}`}>
                          {teamShort}
                        </span>
                        {r.format && (
                          <span className="text-[10px] text-gray-400 font-medium">{r.format}</span>
                        )}
                        <div className="flex-1" />
                        <div className="text-right">
                          <div className="text-[10px] font-semibold text-gray-600">{dt.day} {dt.month} {dt.year}</div>
                          <div className="text-[9px] text-gray-400">{dt.weekday}</div>
                        </div>
                      </div>

                      {/* Match title */}
                      <div className="px-3 pb-2">
                        <h3 className="font-display font-bold text-primary text-base leading-tight">
                          {teamLabel} <span className="font-normal text-gray-400 text-sm">vs</span> {r.opponent}
                        </h3>
                        {r.venue && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <svg className="w-2.5 h-2.5 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                              <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.013 3.5-4.628 3.5-7.327A8 8 0 004 12c0 2.699 1.556 5.315 3.5 7.327a19.58 19.58 0 002.683 2.282 16.974 16.974 0 001.144.742zM12 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" />
                            </svg>
                            <span className="text-[10px] text-gray-400 truncate">{r.venue}</span>
                          </div>
                        )}
                      </div>

                      {/* Score block */}
                      {(r.ncb_score || r.opp_score) && (
                        <div className="mx-3 mb-2 grid grid-cols-2 gap-1.5">
                          {r.ncb_score && (
                            <div className="bg-gray-50 rounded-xl px-2.5 py-1.5">
                              <div className="text-[9px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">{teamShort}</div>
                              <div className="font-mono font-bold text-sm text-gray-800 leading-none">{r.ncb_score}</div>
                            </div>
                          )}
                          {r.opp_score && (
                            <div className="bg-gray-50 rounded-xl px-2.5 py-1.5">
                              <div className="text-[9px] text-gray-400 font-medium uppercase tracking-wide mb-0.5 truncate">{r.opponent?.split(' ')[0]}</div>
                              <div className="font-mono font-bold text-sm text-gray-500 leading-none">{r.opp_score}</div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Result pill */}
                      {r.result && (
                        <div className="px-3 pb-2">
                          <span className={`inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full ${won ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                            {r.result}
                          </span>
                        </div>
                      )}

                      {/* MoM + Scorecard footer */}
                      {(r.mom || r.scorecard_url) && (
                        <div className="border-t border-gray-100 px-3 py-2 flex items-center gap-2 flex-wrap">
                          {r.mom && (
                            <div className="flex items-center gap-1 flex-1 min-w-0">
                              <span className="text-xs">🏆</span>
                              <span className="text-[10px] font-semibold text-primary truncate">{r.mom}</span>
                              {r.mom_stat && <span className="text-[10px] text-gray-400 truncate">— {r.mom_stat}</span>}
                            </div>
                          )}
                          {r.scorecard_url && (
                            <a href={r.scorecard_url} target="_blank" rel="noopener noreferrer"
                              className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                              📋 Scorecard ↗
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ── Desktop card ── */}
                    <div className={`hidden sm:block bg-white rounded-2xl border-l-4 overflow-hidden shadow-sm hover:shadow-md transition-all ${won ? 'border-green-500' : 'border-red-400'}`}>
                      <div className="p-5 md:p-6">
                        <div className="flex items-start gap-4">
                          {/* W/L badge */}
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center font-display font-bold text-lg flex-shrink-0 ${won ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {won ? 'W' : 'L'}
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
                            </div>
                            <h3 className="font-display font-bold text-primary text-xl mb-1">
                              {teamLabel} vs {r.opponent}
                            </h3>
                            <div className="text-sm text-gray-400 flex items-center gap-1.5">
                              {r.venue && (
                                <>
                                  <svg className="w-3 h-3 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.013 3.5-4.628 3.5-7.327A8 8 0 004 12c0 2.699 1.556 5.315 3.5 7.327a19.58 19.58 0 002.683 2.282 16.974 16.974 0 001.144.742zM12 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" />
                                  </svg>
                                  <span>{r.venue} ·</span>
                                </>
                              )}
                              <span>{dt.full}</span>
                            </div>
                            {r.result && (
                              <span className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full ${won ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                {r.result}
                              </span>
                            )}
                          </div>

                          {/* Scores + scorecard */}
                          <div className="flex-shrink-0 text-right space-y-1 min-w-[140px]">
                            {r.ncb_score && (
                              <div className="bg-gray-50 rounded-xl px-3 py-1.5">
                                <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">{teamShort}</div>
                                <div className="font-mono font-bold text-sm text-gray-800">{r.ncb_score}</div>
                              </div>
                            )}
                            {r.opp_score && (
                              <div className="bg-gray-50 rounded-xl px-3 py-1.5">
                                <div className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5 truncate">{r.opponent}</div>
                                <div className="font-mono font-bold text-sm text-gray-500">{r.opp_score}</div>
                              </div>
                            )}
                            {r.scorecard_url && (
                              <a href={r.scorecard_url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors mt-1">
                                📋 Scorecard ↗
                              </a>
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
          )}
        </div>
      </section>
    </div>
  )
}
