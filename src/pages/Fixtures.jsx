import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import fixtures from '../data/fixtures.json'
import { supabase } from '../lib/supabase'
import { fetchAvailability, getFixtureAvailability, buildFixtureId, isSheetConfigured } from '../utils/availability'

const teamsFilter = [
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls', label: 'Royal Bulls' },
]

function firstName(name) {
  return (name || '').split(' ')[0]
}

function VenueActions({ venue, venueAddress }) {
  const [copied, setCopied] = useState(false)

  const fullAddress = venueAddress || venue
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`

  const handleCopy = () => {
    navigator.clipboard.writeText(fullAddress).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="mt-2">
      <div className="flex items-start gap-1.5 text-sm text-gray-500 mb-1.5">
        <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.013 3.5-4.628 3.5-7.327A8 8 0 004 12c0 2.699 1.556 5.315 3.5 7.327a19.58 19.58 0 002.683 2.282 16.974 16.974 0 001.144.742zM12 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" />
        </svg>
        <span><span className="font-medium text-gray-700">{venue}</span>{venueAddress ? ` — ${venueAddress}` : ''}</span>
      </div>
      <div className="flex flex-wrap gap-2 ml-5">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
        >
          <svg className="w-3.5 h-3.5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.013 3.5-4.628 3.5-7.327A8 8 0 004 12c0 2.699 1.556 5.315 3.5 7.327a19.58 19.58 0 002.683 2.282 16.974 16.974 0 001.144.742zM12 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" />
          </svg>
          Open in Maps
        </a>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Address
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default function Fixtures() {
  const [teamFilter, setTeamFilter] = useState('raising-bulls')
  const [availRecords, setAvailRecords] = useState([])
  const [resultMap, setResultMap] = useState({})

  useEffect(() => {
    if (!isSheetConfigured()) return
    fetchAvailability().then(setAvailRecords).catch(() => {})
  }, [])

  useEffect(() => {
    supabase
      .from('match_results')
      .select('fixture_date, team, result, ncb_score, opp_score, scorecard_url')
      .then(({ data }) => {
        const map = {}
        ;(data || []).forEach((r) => { map[`${r.fixture_date}::${r.team}`] = r })
        setResultMap(map)
      })
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const filtered = fixtures.filter((f) => f.team === teamFilter)

  function isPast(f) {
    return new Date(f.date + 'T00:00:00') < today
  }

  return (
    <div>
      {/* Hero — compact on mobile */}
      <section className="bg-primary-dark text-white py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl md:text-6xl font-bold mb-1 md:mb-3">
              <span className="text-accent">FIXTURES</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-lg">Upcoming matches — mark your calendars!</p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white sticky top-16 z-30 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex gap-2">
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
      </section>

      {/* Fixtures List */}
      <section className="py-6 md:py-12 bg-surface min-h-[60vh]">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="space-y-3 md:space-y-4">
            {filtered.map((f, i) => {
              const past      = isPast(f)
              const dbResult  = resultMap[`${f.date}::${f.team}`]
              const teamLabel = f.team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'
              const teamShort = f.team === 'raising-bulls' ? 'RB' : 'RY'

              const [year, month, day] = f.date.split('-').map(Number)
              const d = new Date(year, month - 1, day)
              const dayNum   = String(day).padStart(2, '0')
              const monthShort = d.toLocaleDateString('en-US', { month: 'short' })
              const weekday  = d.toLocaleDateString('en-US', { weekday: 'short' })
              const mapsUrl  = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.venueAddress || f.venue)}`

              let avail = { inCount: 0, maybeCount: 0, outCount: 0, inNames: [], maybeNames: [], outNames: [] }
              if (isSheetConfigured()) {
                avail = getFixtureAvailability(availRecords, buildFixtureId(f))
              }
              const hasAvail = avail.inCount + avail.maybeCount + avail.outCount > 0

              return (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  {/* ── Mobile card ── */}
                  <div className="sm:hidden bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-accent/60 hover:shadow-md transition-all">
                    {/* Top bar */}
                    <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                      {/* Date pill */}
                      <div className="flex-shrink-0 bg-primary-dark rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
                        <span className="font-display font-black text-lg leading-none text-accent">{dayNum}</span>
                        <div className="flex flex-col leading-none">
                          <span className="text-[9px] text-gray-300 uppercase font-semibold">{monthShort}</span>
                          <span className="text-[9px] text-gray-400">{year}</span>
                        </div>
                      </div>
                      {/* Team + format */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${f.team === 'raising-bulls' ? 'bg-primary-dark/10 text-primary-dark' : 'bg-primary/10 text-primary'}`}>
                        {teamShort}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">{f.format}</span>
                      <div className="flex-1" />
                      {/* Status */}
                      {past ? (
                        <span className="text-[10px] font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">✓ Done</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />Upcoming
                        </span>
                      )}
                    </div>

                    {/* Match title */}
                    <div className="px-3 pb-1">
                      <h3 className="font-display font-bold text-primary text-base leading-tight">
                        {teamLabel} <span className="font-normal text-gray-400">vs</span> {f.opponent}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                        <span>⏰ {f.time}</span>
                        <span>·</span><span>{weekday}</span>
                        <span>·</span><span>{f.type}</span>
                      </div>
                    </div>

                    {/* Venue compact */}
                    <div className="px-3 pb-2.5 flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.013 3.5-4.628 3.5-7.327A8 8 0 004 12c0 2.699 1.556 5.315 3.5 7.327a19.58 19.58 0 002.683 2.282 16.974 16.974 0 001.144.742zM12 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[11px] text-gray-500 flex-1 truncate">{f.venue}</span>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors"
                      >
                        <svg className="w-2.5 h-2.5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.013 3.5-4.628 3.5-7.327A8 8 0 004 12c0 2.699 1.556 5.315 3.5 7.327a19.58 19.58 0 002.683 2.282 16.974 16.974 0 001.144.742zM12 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" />
                        </svg>
                        Open in Maps
                      </a>
                    </div>

                    {/* Availability / result */}
                    {past ? (
                      dbResult && (
                        <div className="border-t border-gray-100 px-3 py-2 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            {dbResult.ncb_score && (
                              <span className="text-[11px] font-mono font-semibold text-gray-700">{teamShort}: {dbResult.ncb_score}</span>
                            )}
                            {dbResult.opp_score && (
                              <span className="text-[11px] font-mono font-semibold text-gray-700">Opp: {dbResult.opp_score}</span>
                            )}
                          </div>
                          {dbResult.result && (
                            <div className="text-[11px] text-gray-500">{dbResult.result}</div>
                          )}
                          {dbResult.scorecard_url && (
                            <a href={dbResult.scorecard_url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600">
                              📋 Scorecard ↗
                            </a>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="border-t border-gray-100 px-3 py-2 space-y-2">
                        {/* Player names */}
                        {hasAvail && (
                          <div className="space-y-1">
                            {avail.inNames.length > 0 && (
                              <div className="flex flex-wrap gap-1 items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                {avail.inNames.map((n) => (
                                  <span key={n} className="text-[10px] font-medium bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-md">{firstName(n)}</span>
                                ))}
                              </div>
                            )}
                            {avail.maybeNames.length > 0 && (
                              <div className="flex flex-wrap gap-1 items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                {avail.maybeNames.map((n) => (
                                  <span key={n} className="text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md">{firstName(n)}</span>
                                ))}
                              </div>
                            )}
                            {avail.outNames.length > 0 && (
                              <div className="flex flex-wrap gap-1 items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                                {avail.outNames.map((n) => (
                                  <span key={n} className="text-[10px] font-medium bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-md">{firstName(n)}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        <Link
                          to={`/availability?fixture=${f.id}&team=${f.team}`}
                          className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-accent text-primary-dark px-3 py-2 rounded-xl hover:bg-accent-dark transition-colors w-full"
                        >
                          🏏 Mark Availability
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* ── Desktop card (unchanged layout) ── */}
                  <div className="hidden sm:block bg-white border border-gray-200 rounded-2xl p-5 md:p-6 hover:border-accent hover:shadow-md transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Date block */}
                      <div className="flex-shrink-0 w-20 rounded-2xl overflow-hidden border border-primary-dark/20 shadow-sm">
                        <div className="bg-accent text-primary-dark text-center py-1.5 text-xs font-bold uppercase tracking-widest">
                          {weekday}
                        </div>
                        <div className="bg-primary-dark text-white text-center py-3">
                          <div className="font-display font-black text-4xl leading-none text-accent">{dayNum}</div>
                          <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider mt-1">
                            {monthShort} {year}
                          </div>
                        </div>
                      </div>

                      {/* Match info */}
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${f.team === 'raising-bulls' ? 'bg-primary-dark text-accent' : 'bg-primary text-white'}`}>
                            {teamLabel}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{f.format}</span>
                          <span className="text-xs bg-accent/20 text-primary font-medium px-2.5 py-1 rounded-full">{f.type}</span>
                        </div>
                        <h3 className="font-display font-bold text-primary text-xl mb-1">
                          {teamLabel} vs {f.opponent}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                          <span>⏰ {f.time}</span>
                        </div>
                        <VenueActions venue={f.venue} venueAddress={f.venueAddress} />
                      </div>

                      {/* Status / result */}
                      <div className="flex-shrink-0 flex flex-col items-end gap-2">
                        {past ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
                            ✓ Completed
                          </span>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full border border-blue-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                              Upcoming
                            </span>
                            {hasAvail && (
                              <div className="space-y-1 w-full">
                                {avail.inNames.length > 0 && (
                                  <div className="flex flex-wrap gap-1 justify-end">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                                    {avail.inNames.map((n) => (
                                      <span key={n} className="text-[10px] font-medium bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-md">{firstName(n)}</span>
                                    ))}
                                  </div>
                                )}
                                {avail.maybeNames.length > 0 && (
                                  <div className="flex flex-wrap gap-1 justify-end">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 flex-shrink-0" />
                                    {avail.maybeNames.map((n) => (
                                      <span key={n} className="text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md">{firstName(n)}</span>
                                    ))}
                                  </div>
                                )}
                                {avail.outNames.length > 0 && (
                                  <div className="flex flex-wrap gap-1 justify-end">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 flex-shrink-0" />
                                    {avail.outNames.map((n) => (
                                      <span key={n} className="text-[10px] font-medium bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-md">{firstName(n)}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            <Link
                              to={`/availability?fixture=${f.id}&team=${f.team}`}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-accent text-primary-dark px-3 py-1.5 rounded-full hover:bg-accent-dark transition-colors"
                            >
                              🏏 Mark Availability
                            </Link>
                          </>
                        )}
                        {past && dbResult && (
                          <div className="text-right space-y-0.5">
                            {dbResult.ncb_score && (
                              <div className="text-xs font-mono font-semibold text-gray-700">{teamLabel}: {dbResult.ncb_score}</div>
                            )}
                            {dbResult.opp_score && (
                              <div className="text-xs font-mono font-semibold text-gray-700">{f.opponent}: {dbResult.opp_score}</div>
                            )}
                            {dbResult.result && (
                              <div className="text-xs text-gray-500 mt-0.5 max-w-[160px]">{dbResult.result}</div>
                            )}
                            {dbResult.scorecard_url && (
                              <a href={dbResult.scorecard_url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors mt-1">
                                📋 Scorecard ↗
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}

            {filtered.length === 0 && (
              <div className="text-center py-20 text-gray-400">No fixtures for the selected team.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
