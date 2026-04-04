import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

const teamsFilter = [
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls', label: 'Royal Bulls' },
]

const ROLE_BADGE = {
  'Batsman':                  'bg-blue-100 text-blue-700',
  'Bowler':                   'bg-red-100 text-red-600',
  'All-Rounder':              'bg-green-100 text-green-700',
  'Wicket-Keeper Batsman':    'bg-purple-100 text-purple-700',
  'Wicket-Keeper':            'bg-purple-100 text-purple-700',
}

export default function Players() {
  const [teamFilter, setTeamFilter] = useState('raising-bulls')
  const [players, setPlayers]       = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('players')
      .select('*')
      .eq('team', teamFilter)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })
      .then(({ data }) => {
        setPlayers(data || [])
        setLoading(false)
      })
  }, [teamFilter])

  return (
    <div>
      {/* Header */}
      <section className="bg-primary-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-3">
              OUR <span className="text-accent">PLAYERS</span>
            </h1>
            <p className="text-gray-300 text-lg">Meet the athletes behind NC Bulls Cricket Club</p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white sticky top-16 z-30 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2">
              {teamsFilter.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTeamFilter(t.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    teamFilter === t.id
                      ? 'bg-primary-dark text-accent'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
        </div>
      </section>

      {/* Player Grid */}
      <section className="py-12 bg-surface min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : players.length === 0 ? (
            /* Fallback — no players in DB yet, link to CricHeroes */
            <motion.div
              key={teamFilter}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-20 h-20 bg-primary-dark rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5.477-3.716M9 20H4v-2a4 4 0 015.477-3.716M15 7a4 4 0 11-8 0 4 4 0 018 0zm6 3a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="font-display text-3xl font-bold text-primary-dark mb-3">
                {teamFilter === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'}{' '}
                <span className="text-accent">Roster</span>
              </h2>
              <p className="text-gray-500 mb-8 max-w-md">
                View the full squad, stats, and profiles on CricHeroes — our official league platform.
              </p>
              <a
                href={
                  teamFilter === 'raising-bulls'
                    ? 'https://cricheroes.com/team-profile/12480147/raising-bulls/members'
                    : 'https://cricheroes.com/team-profile/12480151/royal-bulls/members'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary-dark text-accent font-bold px-8 py-3 rounded-full hover:bg-primary transition-colors text-base"
              >
                View Squad on CricHeroes
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </motion.div>
          ) : (
            <motion.div
              key={teamFilter}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {players.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow"
                  >
                    {/* Avatar */}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 text-xl font-bold ${
                      teamFilter === 'raising-bulls'
                        ? 'bg-primary-dark text-accent'
                        : 'bg-primary text-white'
                    }`}>
                      {p.photo ? (
                        <img src={p.photo} alt={p.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        p.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <p className="font-display font-bold text-primary text-sm leading-tight mb-1">
                      {p.name}
                      {p.captain && (
                        <span className="ml-1.5 text-[10px] bg-accent text-primary-dark font-bold px-1.5 py-0.5 rounded-full align-middle">C</span>
                      )}
                    </p>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[p.role] || 'bg-gray-100 text-gray-600'}`}>
                      {p.role}
                    </span>
                    <p className="text-xs text-gray-400 mt-1.5">{p.nationality}</p>
                  </motion.div>
                ))}
              </div>

              {/* CricHeroes link */}
              <div className="mt-10 text-center">
                <a
                  href={
                    teamFilter === 'raising-bulls'
                      ? 'https://cricheroes.com/team-profile/12480147/raising-bulls/members'
                      : 'https://cricheroes.com/team-profile/12480151/royal-bulls/members'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary transition-colors"
                >
                  View full stats on CricHeroes →
                </a>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  )
}
