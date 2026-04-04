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
      {/* Header */}
      <section className="bg-primary-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-3">
              <span className="text-accent">RESULTS</span>
            </h1>
            <p className="text-gray-300 text-lg">Match results and scorecards</p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white sticky top-16 z-30 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap gap-3 items-center justify-between">
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
          <div className="flex gap-4 text-sm font-medium">
            <span className="text-green-600">W {wins}</span>
            <span className="text-red-500">L {losses}</span>
            <span className="text-gray-400">| {results.length} matches</span>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-12 bg-surface min-h-[60vh]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
          <div className="space-y-4">
            {results.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className={`bg-white rounded-2xl border-l-4 overflow-hidden shadow-sm hover:shadow-md transition-all ${
                  isWon(r) ? 'border-green-500' : 'border-red-400'
                }`}
              >
                <div className="p-5 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Result badge */}
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center font-display font-bold text-lg flex-shrink-0 ${
                      isWon(r) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {isWon(r) ? 'W' : 'L'}
                    </div>

                    {/* Match details */}
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.team === 'raising-bulls' ? 'bg-primary-dark text-accent' : 'bg-primary text-white'}`}>
                          {r.team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'}
                        </span>
                        {r.format && (
                          <span className="text-xs bg-gray-100 text-gray-400 px-2.5 py-1 rounded-full">{r.format}</span>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-primary text-xl mb-1">
                        {r.team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'} vs {r.opponent}
                      </h3>
                      <div className="text-sm text-gray-400">
                        {new Date(r.fixture_date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                        })}
                        {r.venue && ` · ${r.venue}`}
                      </div>
                      {r.result && (
                        <div className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full ${isWon(r) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {r.result}
                        </div>
                      )}
                    </div>

                    {/* Scores */}
                    <div className="text-right flex-shrink-0 space-y-0.5">
                      {r.ncb_score && (
                        <div className="text-xs font-mono font-semibold text-gray-800">
                          {r.team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'}: {r.ncb_score}
                        </div>
                      )}
                      {r.opp_score && (
                        <div className="text-xs font-mono text-gray-500">{r.opponent}: {r.opp_score}</div>
                      )}
                      {r.scorecard_url && (
                        <a href={r.scorecard_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline inline-block mt-0.5">
                          Scorecard ↗
                        </a>
                      )}
                    </div>
                  </div>

                  {/* MoM */}
                  {r.mom && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3 text-sm">
                      <span className="text-accent text-base">🏆</span>
                      <span className="text-gray-500">Man of the Match:</span>
                      <span className="font-semibold text-primary">{r.mom}</span>
                      {r.mom_stat && <span className="text-gray-400">— {r.mom_stat}</span>}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {results.length === 0 && (
              <div className="text-center py-20 text-gray-400">No results for the selected team yet.</div>
            )}
          </div>
          )}
        </div>
      </section>
    </div>
  )
}
