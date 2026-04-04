import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import fixtures from '../data/fixtures.json'
import { fetchAvailability, getFixtureAvailability, buildFixtureId, isSheetConfigured } from '../utils/availability'

const teamsFilter = [
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls', label: 'Royal Bulls' },
]

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
        <span className="mt-0.5">📍</span>
        <span><span className="font-medium text-gray-700">{venue}</span>{venueAddress ? ` — ${venueAddress}` : ''}</span>
      </div>
      <div className="flex flex-wrap gap-2 ml-5">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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

  useEffect(() => {
    if (!isSheetConfigured()) return
    fetchAvailability().then(setAvailRecords).catch(() => {})
  }, [])

  const filtered = fixtures.filter((f) => f.team === teamFilter)

  return (
    <div>
      {/* Header */}
      <section className="bg-primary-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-3">
              <span className="text-accent">FIXTURES</span>
            </h1>
            <p className="text-gray-300 text-lg">Upcoming matches — mark your calendars!</p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white sticky top-16 z-30 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex gap-2">
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
      <section className="py-12 bg-surface min-h-[60vh]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {filtered.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 hover:border-accent hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Date block — vertical calendar tile */}
                  {(() => {
                    const [year, month, day] = f.date.split('-').map(Number)
                    const d = new Date(year, month - 1, day)
                    return (
                      <div className="flex-shrink-0 w-full sm:w-20 rounded-2xl overflow-hidden border border-primary-dark/20 shadow-sm">
                        <div className="bg-accent text-primary-dark text-center py-1.5 text-xs font-bold uppercase tracking-widest">
                          {d.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="bg-primary-dark text-white text-center py-3">
                          <div className="font-display font-black text-4xl leading-none text-accent">
                            {String(day).padStart(2, '0')}
                          </div>
                          <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider mt-1">
                            {d.toLocaleDateString('en-US', { month: 'short' })} {year}
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Match info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${f.team === 'raising-bulls' ? 'bg-primary-dark text-accent' : 'bg-primary text-white'}`}>
                        {f.team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{f.format}</span>
                      <span className="text-xs bg-accent/20 text-primary font-medium px-2.5 py-1 rounded-full">{f.type}</span>
                    </div>
                    <h3 className="font-display font-bold text-primary text-xl mb-1">
                      {f.team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'} vs {f.opponent}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <span>⏰ {f.time}</span>
                    </div>
                    <VenueActions venue={f.venue} venueAddress={f.venueAddress} />
                  </div>

                  {/* Status / result */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    {f.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
                        ✓ Completed
                      </span>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full border border-blue-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          Upcoming
                        </span>
                        {/* Availability count */}
                        {isSheetConfigured() && (() => {
                          const avail = getFixtureAvailability(availRecords, buildFixtureId(f))
                          const total = avail.inCount + avail.maybeCount + avail.outCount
                          return total > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-end">
                              {avail.inCount > 0 && (
                                <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">✅ {avail.inCount}</span>
                              )}
                              {avail.maybeCount > 0 && (
                                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">🤔 {avail.maybeCount}</span>
                              )}
                              {avail.outCount > 0 && (
                                <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">❌ {avail.outCount}</span>
                              )}
                            </div>
                          ) : null
                        })()}
                        {/* Mark availability CTA */}
                        <Link
                          to={`/availability?fixture=${f.id}&team=${f.team}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-accent text-primary-dark px-3 py-1.5 rounded-full hover:bg-accent-dark transition-colors"
                        >
                          🏏 Mark Availability
                        </Link>
                      </>
                    )}
                    {f.status === 'completed' && (f.homeScore || f.result) && (
                      <div className="text-right space-y-0.5">
                        {f.homeScore && (
                          <div className="text-xs font-mono font-semibold text-gray-700">
                            {f.team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'}: {f.homeScore}
                          </div>
                        )}
                        {f.awayScore && (
                          <div className="text-xs font-mono font-semibold text-gray-700">
                            {f.opponent}: {f.awayScore}
                          </div>
                        )}
                        {f.result && (
                          <div className="text-xs text-gray-500 mt-0.5 max-w-[160px]">{f.result}</div>
                        )}
                        {f.scorecardUrl && (
                          <a
                            href={f.scorecardUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors mt-1"
                          >
                            📋 Scorecard ↗
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-20 text-gray-400">No fixtures for the selected team.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
