import { useState } from 'react'
import { motion } from 'framer-motion'
import results from '../data/results.json'

const teamsFilter = [
  { id: 'all', label: 'All Teams' },
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls', label: 'Royal Bulls' },
]

export default function Results() {
  const [teamFilter, setTeamFilter] = useState('all')

  const filtered = results.filter(
    (r) => teamFilter === 'all' || r.team === teamFilter
  )
  const wins = filtered.filter((r) => r.result === 'Won').length
  const losses = filtered.filter((r) => r.result === 'Lost').length

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
            <span className="text-gray-400">| {filtered.length} matches</span>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-12 bg-surface min-h-[60vh]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {filtered.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className={`bg-white rounded-2xl border-l-4 overflow-hidden shadow-sm hover:shadow-md transition-all ${
                  r.result === 'Won' ? 'border-green-500' : 'border-red-400'
                }`}
              >
                <div className="p-5 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Result badge */}
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center font-display font-bold text-lg flex-shrink-0 ${
                      r.result === 'Won' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {r.result === 'Won' ? 'W' : 'L'}
                    </div>

                    {/* Match details */}
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.team === 'raising-bulls' ? 'bg-primary-dark text-accent' : 'bg-primary text-white'}`}>
                          {r.team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-400 px-2.5 py-1 rounded-full">{r.format}</span>
                      </div>
                      <h3 className="font-display font-bold text-primary text-xl mb-1">
                        NC Bulls vs {r.opponent}
                      </h3>
                      <div className="text-sm text-gray-400">
                        {new Date(r.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · {r.venue}
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="text-right flex-shrink-0">
                      <div className="font-display font-bold text-primary text-xl">{r.ncbScore}</div>
                      <div className="text-gray-400 text-sm">{r.oppScore}</div>
                      <div className={`text-xs font-bold mt-1 ${r.result === 'Won' ? 'text-green-600' : 'text-red-500'}`}>
                        {r.result}
                      </div>
                    </div>
                  </div>

                  {/* MoM */}
                  {r.mom && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3 text-sm">
                      <span className="text-accent text-base">🏆</span>
                      <span className="text-gray-500">Man of the Match:</span>
                      <span className="font-semibold text-primary">{r.mom}</span>
                      <span className="text-gray-400">— {r.momStat}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-20 text-gray-400">No results for the selected team.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
