import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

function teamLabel(t) {
  return t === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'
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

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

export default function FixtureDetail() {
  const { id } = useParams()
  const [fixture, setFixture]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [result, setResult]     = useState(null)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('fixtures')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        setFixture(data || null)
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    if (!fixture) return
    supabase
      .from('match_results')
      .select('*')
      .eq('fixture_date', fixture.date)
      .eq('team', fixture.team)
      .maybeSingle()
      .then(({ data }) => setResult(data))
  }, [fixture?.id])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!fixture) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="font-display text-6xl font-bold text-gray-100 mb-4">404</div>
        <p className="text-gray-500 mb-6">Fixture not found.</p>
        <Link to="/fixtures" className="btn-primary">← Back to Fixtures</Link>
      </div>
    )
  }

  const isRaising   = fixture.team === 'raising-bulls'
  const mapsUrl     = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fixture.venue + (fixture.venue_address ? `, ${fixture.venue_address}` : ''))}`
  const today       = new Date()
  const [fy, fm, fd] = fixture.date.split('-').map(Number)
  const fixtureDate = new Date(fy, fm - 1, fd)
  const isPast      = fixtureDate < today

  return (
    <div>
      {/* Header */}
      <section className={`py-14 ${isRaising ? 'bg-primary-dark' : 'bg-primary'} text-white`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link
              to="/fixtures"
              className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white mb-6 transition-colors"
            >
              ← All Fixtures
            </Link>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${isRaising ? 'bg-accent text-primary-dark' : 'bg-white/20 text-white'}`}>
                {teamLabel(fixture.team)}
              </span>
              <span className="text-xs bg-white/10 text-gray-300 px-3 py-1 rounded-full">{fixture.format}</span>
              {fixture.type && (
                <span className="text-xs bg-white/10 text-gray-300 px-3 py-1 rounded-full">{fixture.type}</span>
              )}
              {isPast && result && (
                <span className="text-xs bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-1 rounded-full font-semibold">
                  Result Available
                </span>
              )}
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-2">
              vs <span className={isRaising ? 'text-accent' : 'text-accent-light'}>{fixture.opponent}</span>
            </h1>
            <p className="text-gray-300 text-lg">
              {formatDate(fixture.date)}{fixture.time && ` · ${fixture.time}`}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Details */}
      <section className="py-12 bg-surface">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

          {/* Venue card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-gray-200 rounded-2xl p-6"
          >
            <h2 className="font-display font-bold text-primary text-lg mb-4">📍 Venue</h2>
            <div className="mb-1 font-semibold text-gray-800 text-base">{fixture.venue}</div>
            {fixture.venue_address && (
              <p className="text-gray-500 text-sm mb-5">{fixture.venue_address}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Open in Google Maps
              </a>
            </div>
          </motion.div>

          {/* Match info */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white border border-gray-200 rounded-2xl p-6"
          >
            <h2 className="font-display font-bold text-primary text-lg mb-4">🏏 Match Info</h2>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-sm">
              <div>
                <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Team</dt>
                <dd className="font-semibold text-gray-800">{teamLabel(fixture.team)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Format</dt>
                <dd className="font-semibold text-gray-800">{fixture.format}</dd>
              </div>
              {fixture.type && (
                <div>
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Type</dt>
                  <dd className="font-semibold text-gray-800">{fixture.type}</dd>
                </div>
              )}
              {fixture.division && (
                <div>
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Division</dt>
                  <dd className="font-semibold text-gray-800">{fixture.division.replace(/^D(\d+)$/, 'Div$1')}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Date</dt>
                <dd className="font-semibold text-gray-800">{formatDate(fixture.date)}</dd>
              </div>
              {fixture.time && (
                <div>
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Time</dt>
                  <dd className="font-semibold text-gray-800">{fixture.time}</dd>
                </div>
              )}
            </dl>
          </motion.div>

          {/* Umpiring info */}
          {(fixture.umpire1_team || fixture.umpire2_team) && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="bg-white border border-blue-200 rounded-2xl p-6"
            >
              <h2 className="font-display font-bold text-primary text-lg mb-4">🧢 Umpiring</h2>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                {fixture.umpire1_team && (
                  <div>
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Umpire 1</dt>
                    <dd className="font-semibold text-gray-800">{fixture.umpire1_team}</dd>
                  </div>
                )}
                {fixture.umpire2_team && (
                  <div>
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Umpire 2</dt>
                    <dd className="font-semibold text-gray-800">{fixture.umpire2_team}</dd>
                  </div>
                )}
              </dl>
            </motion.div>
          )}

          {/* Result (if available) */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-gray-200 rounded-2xl p-6"
            >
              <h2 className="font-display font-bold text-primary text-lg mb-4">🏆 Result</h2>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                {result.ncb_score && (
                  <div>
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">NCB Score</dt>
                    <dd className="font-semibold text-gray-800">{result.ncb_score}</dd>
                  </div>
                )}
                {result.opp_score && (
                  <div>
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Opponent Score</dt>
                    <dd className="font-semibold text-gray-800">{result.opp_score}</dd>
                  </div>
                )}
                {result.mom_stat && (
                  <div>
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Player of the Match</dt>
                    <dd className="font-semibold text-gray-800">{result.mom_stat}</dd>
                  </div>
                )}
                {result.result && (
                  <div className="col-span-2 sm:col-span-3">
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Result</dt>
                    <dd className="text-base font-semibold text-green-700">{renderResult(result.result)}</dd>
                  </div>
                )}
              </dl>
            </motion.div>
          )}

          <div className="pt-2">
            <Link to="/fixtures" className="text-sm font-medium text-primary hover:text-accent transition-colors">
              ← Back to all fixtures
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
