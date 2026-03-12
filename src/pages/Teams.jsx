import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import playersData from '../data/players.json'
import results from '../data/results.json'

const teams = {
  'raising-bulls': {
    name: 'Raising Bulls',
    tagline: 'Rising with every match — unstoppable, relentless.',
    description:
      'The Raising Bulls are NC Bulls Cricket Club\'s flagship T20 squad. Known for aggressive batting and intelligent bowling, the Raising Bulls have claimed the Triangle Cricket League title three years running. They represent determination, grit, and the never-say-die spirit that defines this club.',
    colors: ['#1a3a6b', '#f5c518'],
    colorNames: ['Royal Blue', 'Gold Yellow'],
    founded: '2021',
    titles: 3,
    bg: 'from-primary-dark to-primary',
    badgeBg: 'bg-primary-dark',
    accent: 'text-accent border-accent',
    tabActive: 'bg-primary-dark text-accent',
  },
  'royal-bulls': {
    name: 'Royal Bulls',
    tagline: 'Playing with pride, performing with royalty.',
    description:
      'The Royal Bulls are NC Bulls Cricket Club\'s second T20 squad, providing a pathway for developing players while still competing at a high level. In 2025, the Royal Bulls reached the semi-finals for the first time — signaling their growth into a genuine force in the Triangle cricket scene.',
    colors: ['#2a5499', '#ffd84d'],
    colorNames: ['Deep Blue', 'Bright Yellow'],
    founded: '2022',
    titles: 0,
    bg: 'from-primary to-primary-light',
    badgeBg: 'bg-primary',
    accent: 'text-accent-light border-accent-light',
    tabActive: 'bg-primary text-white',
  },
}

export default function Teams() {
  const [activeTeam, setActiveTeam] = useState('raising-bulls')
  const team = teams[activeTeam]
  const players = playersData.filter((p) => p.team === activeTeam)
  const teamResults = results.filter((r) => r.team === activeTeam)
  const wins = teamResults.filter((r) => r.result === 'Won').length
  const captain = players.find((p) => p.captain)

  return (
    <div>
      {/* Header */}
      <section className={`bg-gradient-to-br ${team.bg} text-white py-16 transition-all duration-500`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-10 justify-center">
            {Object.entries(teams).map(([id, t]) => (
              <button
                key={id}
                onClick={() => setActiveTeam(id)}
                className={`px-6 py-2.5 rounded-full font-display font-bold text-sm transition-all duration-200 border-2 ${
                  activeTeam === id
                    ? t.tabActive + ' border-transparent'
                    : 'bg-transparent border-white/30 text-gray-200 hover:border-white/60'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTeam}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="font-display text-xs tracking-[0.3em] text-white/60 uppercase mb-2">NC Bulls Cricket Club</div>
              <h1 className="font-display text-5xl md:text-6xl font-bold mb-3">
                {team.name === 'Raising Bulls' ? (
                  <><span className="text-accent">RAISING</span> BULLS</>
                ) : (
                  <><span className="text-accent-light">ROYAL</span> BULLS</>
                )}
              </h1>
              <p className="text-gray-300 text-lg italic mb-8">"{team.tagline}"</p>

              {/* Stats row */}
              <div className="flex flex-wrap justify-center gap-8 text-center">
                <div>
                  <div className="font-display text-3xl font-bold text-accent">{team.founded}</div>
                  <div className="text-gray-300 text-xs uppercase tracking-wider mt-1">Founded</div>
                </div>
                <div>
                  <div className="font-display text-3xl font-bold text-accent">{players.length}</div>
                  <div className="text-gray-300 text-xs uppercase tracking-wider mt-1">Players</div>
                </div>
                <div>
                  <div className="font-display text-3xl font-bold text-accent">{wins}</div>
                  <div className="text-gray-300 text-xs uppercase tracking-wider mt-1">Wins (Season)</div>
                </div>
                <div>
                  <div className="font-display text-3xl font-bold text-accent">{team.titles}</div>
                  <div className="text-gray-300 text-xs uppercase tracking-wider mt-1">Titles</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Team Details */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTeam + '-details'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid lg:grid-cols-3 gap-10"
            >
              {/* About */}
              <div className="lg:col-span-2">
                <h2 className="section-heading mb-4">About the Team</h2>
                <p className="text-gray-600 leading-relaxed text-lg mb-6">{team.description}</p>

                {/* Team Colors */}
                <h3 className="font-display font-bold text-primary uppercase tracking-wider text-sm mb-3">Team Colors</h3>
                <div className="flex gap-3">
                  {team.colors.map((color, i) => (
                    <div key={color} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full border-2 border-gray-200" style={{ backgroundColor: color }} />
                      <span className="text-sm text-gray-500">{team.colorNames[i]}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex gap-4">
                  <Link to="/players" className="btn-primary">View Full Roster</Link>
                  <Link to="/fixtures" className="btn-outline">Upcoming Fixtures</Link>
                </div>
              </div>

              {/* Captain Card */}
              {captain && (
                <div>
                  <h3 className="font-display font-bold text-primary uppercase tracking-wider text-sm mb-4">Captain</h3>
                  <div className="bg-surface border border-gray-200 rounded-2xl p-6 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-primary-dark rounded-full flex items-center justify-center font-display font-bold text-accent text-2xl">
                      {captain.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="font-display font-bold text-primary text-xl">{captain.name}</div>
                    <div className="text-gray-400 text-sm mt-1">{captain.role}</div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-white rounded-lg p-2 border border-gray-100">
                        <div className="font-bold text-primary text-base">{captain.stats.matches}</div>
                        <div className="text-gray-400">Matches</div>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-gray-100">
                        <div className="font-bold text-primary text-base">{captain.stats.runs}</div>
                        <div className="text-gray-400">Runs</div>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-gray-100">
                        <div className="font-bold text-primary text-base">{captain.stats.avg}</div>
                        <div className="text-gray-400">Avg</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Squad Preview */}
      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-heading">Squad</h2>
            <Link to="/players" className="text-primary font-medium hover:text-accent transition-colors text-sm">
              Full Roster →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {players.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md hover:border-accent transition-all"
              >
                <div className="w-14 h-14 mx-auto mb-3 bg-primary-dark rounded-full flex items-center justify-center font-display font-bold text-accent">
                  {p.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="font-semibold text-gray-800 text-sm leading-tight">{p.name}</div>
                <div className="text-xs text-gray-400 mt-1">{p.role}</div>
                {p.captain && (
                  <span className="inline-block mt-2 text-xs bg-accent text-primary-dark font-bold px-2 py-0.5 rounded-full">Captain</span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
