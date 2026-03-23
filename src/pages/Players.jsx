import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import playersData from '../data/players.json'

const roles = ['All', 'Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper']
const teamsFilter = [
  { id: 'all', label: 'All Players' },
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls', label: 'Royal Bulls' },
]

export default function Players() {
  const [teamFilter, setTeamFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('All')

  const filtered = playersData.filter(
    (p) =>
      (teamFilter === 'all' || p.team === teamFilter) &&
      (roleFilter === 'All' || p.role === roleFilter)
  )

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
          <div className="flex flex-wrap gap-3 items-center">
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
            <div className="w-px h-5 bg-gray-200 hidden sm:block" />
            <div className="flex gap-2 flex-wrap">
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    roleFilter === r
                      ? 'bg-accent text-primary-dark font-bold'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Player Grid */}
      <section className="py-12 bg-surface min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Team roster links — external CricHeroes */}
          {teamFilter === 'raising-bulls' || teamFilter === 'royal-bulls' ? (
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
                View the full {teamFilter === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'} squad, stats, and profiles on CricHeroes — our official league platform.
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
          <>
          <div className="text-sm text-gray-400 mb-6">{filtered.length} player{filtered.length !== 1 ? 's' : ''}</div>
          <AnimatePresence>
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">No players match the selected filters.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map((player, i) => (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-accent transition-all group"
                  >
                    {/* Card Header */}
                    <div className={`relative h-32 flex items-center justify-center ${player.team === 'raising-bulls' ? 'bg-primary-dark' : 'bg-primary'}`}>
                      <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center font-display font-bold text-primary-dark text-xl">
                        {player.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      {player.captain && (
                        <div className="absolute top-3 right-3 bg-accent text-primary-dark text-xs font-bold px-2 py-0.5 rounded-full">
                          Captain
                        </div>
                      )}
                      <div className="absolute bottom-2 left-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${player.team === 'raising-bulls' ? 'bg-white/20 text-accent' : 'bg-white/20 text-white'}`}>
                          {player.team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4">
                      <div className="font-display font-bold text-primary text-lg leading-tight mb-0.5">{player.name}</div>
                      <div className="text-sm text-gray-400 mb-4">{player.role}</div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-surface rounded-lg p-2">
                          <div className="font-bold text-primary text-sm">{player.stats.matches}</div>
                          <div className="text-xs text-gray-400">Matches</div>
                        </div>
                        {player.role === 'Bowler' ? (
                          <>
                            <div className="bg-surface rounded-lg p-2">
                              <div className="font-bold text-primary text-sm">{player.stats.wickets}</div>
                              <div className="text-xs text-gray-400">Wickets</div>
                            </div>
                            <div className="bg-surface rounded-lg p-2">
                              <div className="font-bold text-primary text-sm">{player.stats.sr}</div>
                              <div className="text-xs text-gray-400">SR</div>
                            </div>
                          </>
                        ) : player.role === 'All-Rounder' ? (
                          <>
                            <div className="bg-surface rounded-lg p-2">
                              <div className="font-bold text-primary text-sm">{player.stats.runs}</div>
                              <div className="text-xs text-gray-400">Runs</div>
                            </div>
                            <div className="bg-surface rounded-lg p-2">
                              <div className="font-bold text-primary text-sm">{player.stats.wickets}</div>
                              <div className="text-xs text-gray-400">Wickets</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="bg-surface rounded-lg p-2">
                              <div className="font-bold text-primary text-sm">{player.stats.runs}</div>
                              <div className="text-xs text-gray-400">Runs</div>
                            </div>
                            <div className="bg-surface rounded-lg p-2">
                              <div className="font-bold text-primary text-sm">{player.stats.avg}</div>
                              <div className="text-xs text-gray-400">Avg</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
          </>
          )}
        </div>
      </section>
    </div>
  )
}
