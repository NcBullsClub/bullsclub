import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'

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
              className="grid lg:grid-cols-1 gap-10"
            >
              {/* About */}
              <div>
                <h2 className="section-heading mb-4">About the Team</h2>
                <p className="text-gray-600 leading-relaxed text-lg mb-6">{team.description}</p>

                {/* Team Colors */}
                <h3 className="font-display font-bold text-primary uppercase tracking-wider text-sm mb-3">Team Colors</h3>
                <div className="flex gap-3 mb-8">
                  {team.colors.map((color, i) => (
                    <div key={color} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full border-2 border-gray-200" style={{ backgroundColor: color }} />
                      <span className="text-sm text-gray-500">{team.colorNames[i]}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <Link to="/fixtures" className="btn-primary">Upcoming Fixtures</Link>
                  <Link to="/results" className="btn-outline">Results</Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Squad — Both Rosters */}
      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-heading mb-10 text-center">Our Squads</h2>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              {
                id: 'raising-bulls',
                label: 'Raising Bulls',
                sub: 'Mega Bash · T20',
                url: 'https://cricheroes.com/team-profile/12480147/raising-bulls/members',
                bg: 'from-primary-dark to-primary',
                badge: 'RB',
              },
              {
                id: 'royal-bulls',
                label: 'Royal Bulls',
                sub: 'League · T20',
                url: 'https://cricheroes.com/team-profile/12480151/royal-bulls/members',
                bg: 'from-primary to-primary-light',
                badge: 'RY',
              },
            ].map((squad) => (
              <motion.div
                key={squad.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`bg-gradient-to-br ${squad.bg} rounded-2xl p-8 text-center text-white shadow-lg`}
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-white/10 border-2 border-accent rounded-full flex items-center justify-center font-display font-bold text-accent text-xl">
                  {squad.badge}
                </div>
                <h3 className="font-display font-bold text-2xl mb-1">{squad.label}</h3>
                <p className="text-gray-300 text-sm mb-6">{squad.sub}</p>
                <a
                  href={squad.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-accent text-primary-dark font-bold px-6 py-2.5 rounded-full hover:bg-yellow-300 transition-colors text-sm"
                >
                  View Roster on CricHeroes
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
