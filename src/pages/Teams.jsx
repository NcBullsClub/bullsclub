import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const teams = [
  {
    id: 'raising-bulls',
    name: 'Raising Bulls',
    tagline: 'Rising with every match — unstoppable, relentless.',
    description:
      'The Raising Bulls are NC Bulls Cricket Club\'s flagship T20 squad. Known for aggressive batting and intelligent bowling, the Raising Bulls have claimed the Triangle Cricket League title three years running. They represent determination, grit, and the never-say-die spirit that defines this club.',
    colors: ['#1a3a6b', '#f5c518'],
    colorNames: ['Royal Blue', 'Gold Yellow'],
    founded: '2021',
    titles: 3,
    accentBar: 'bg-accent',
    headingColor: 'text-accent',
  },
  {
    id: 'royal-bulls',
    name: 'Royal Bulls',
    tagline: 'Playing with pride, performing with royalty.',
    description:
      'The Royal Bulls are NC Bulls Cricket Club\'s second T20 squad, providing a pathway for developing players while still competing at a high level. In 2025, the Royal Bulls reached the semi-finals for the first time — signaling their growth into a genuine force in the Triangle cricket scene.',
    colors: ['#2a5499', '#ffd84d'],
    colorNames: ['Deep Blue', 'Bright Yellow'],
    founded: '2022',
    titles: 0,
    accentBar: 'bg-accent-light',
    headingColor: 'text-accent-light',
  },
]

export default function Teams() {
  return (
    <div>
      {/* Header */}
      <section className="bg-primary-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="font-display text-xs tracking-[0.3em] text-white/60 uppercase mb-2">NC Bulls Cricket Club</div>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">
              OUR <span className="text-accent">TEAMS</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Two squads. One club. Built on passion for cricket in North Carolina.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Team Sections */}
      {teams.map((team, i) => (
        <section key={team.id} className={`py-16 ${i % 2 === 0 ? 'bg-white' : 'bg-surface'}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              {/* Accent bar + name */}
              <div className={`w-12 h-1 ${team.accentBar} rounded mb-4`} />
              <h2 className={`font-display text-4xl md:text-5xl font-bold mb-2 text-primary-dark`}>
                <span className={team.headingColor}>{team.name.split(' ')[0].toUpperCase()}</span>{' '}
                {team.name.split(' ').slice(1).join(' ').toUpperCase()}
              </h2>
              <p className="text-gray-500 italic mb-6">"{team.tagline}"</p>

              {/* Stats */}
              <div className="flex gap-10 mb-6">
                <div>
                  <div className="font-display text-3xl font-bold text-primary-dark">{team.founded}</div>
                  <div className="text-gray-400 text-xs uppercase tracking-wider mt-1">Founded</div>
                </div>
                <div>
                  <div className="font-display text-3xl font-bold text-primary-dark">{team.titles}</div>
                  <div className="text-gray-400 text-xs uppercase tracking-wider mt-1">Titles</div>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed text-lg mb-6">{team.description}</p>

              {/* Team Colors */}
              <h3 className="font-display font-bold text-primary uppercase tracking-wider text-sm mb-3">Team Colors</h3>
              <div className="flex gap-4 mb-8">
                {team.colors.map((color, ci) => (
                  <div key={color} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full border-2 border-gray-200 shadow-sm" style={{ backgroundColor: color }} />
                    <span className="text-sm text-gray-500">{team.colorNames[ci]}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Link to="/fixtures" className="btn-primary">Upcoming Fixtures</Link>
                <Link to="/results" className="btn-outline">Results</Link>
              </div>
            </motion.div>
          </div>
        </section>
      ))}

      {/* Squad — Both Rosters */}
      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-heading mb-10 text-center">Our Squads</h2>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              {
                id: 'raising-bulls',
                label: 'Raising Bulls',
                sub: 'Mega Bash',
                url: 'https://cricheroes.com/team-profile/12480147/raising-bulls/members',
                bg: 'from-primary-dark to-primary',
                badge: 'RB',
              },
              {
                id: 'royal-bulls',
                label: 'Royal Bulls',
                sub: 'Mega Bash',
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
