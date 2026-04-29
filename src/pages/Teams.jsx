import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const teams = [
  {
    id: 'raising-bulls',
    name: 'Raising Bulls',
    tagline: 'Rising with every match — unstoppable, relentless.',
    description:
      'The Raising Bulls are NC Bulls Cricket Club\'s flagship T20 squad. Known for aggressive batting and intelligent bowling, the Raising Bulls have claimed the Triangle Cricket League title three years running. They represent determination, grit, and the never-say-die spirit that defines this club.',
    colors: ['#1a3a6b', '#f5c518'],
    colorNames: ['Royal Blue', 'Gold Yellow'],
    founded: '2022',
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
    founded: '2023',
    titles: 1,
    accentBar: 'bg-accent-light',
    headingColor: 'text-accent-light',
  },
]

const squadCards = [
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
]

function firstNameOf(fullName) {
  return (fullName || '').trim().split(/\s+/)[0] || ''
}

export default function Teams() {
  const [rosterByTeam, setRosterByTeam] = useState({
    'raising-bulls': [],
    'royal-bulls': [],
  })
  const [loadingRoster, setLoadingRoster] = useState(true)
  const [rosterError, setRosterError] = useState('')

  useEffect(() => {
    let active = true

    async function loadRoster() {
      setLoadingRoster(true)
      setRosterError('')

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, team')
        .in('team', ['raising-bulls', 'royal-bulls'])
        .not('full_name', 'is', null)

      if (!active) return

      if (error) {
        setRosterError('Unable to load squad list right now.')
        setLoadingRoster(false)
        return
      }

      const grouped = {
        'raising-bulls': [],
        'royal-bulls': [],
      }

      for (const player of data || []) {
        const first = firstNameOf(player.full_name)
        if (!first || !grouped[player.team]) continue
        grouped[player.team].push(first)
      }

      grouped['raising-bulls'].sort((a, b) => a.localeCompare(b))
      grouped['royal-bulls'].sort((a, b) => a.localeCompare(b))

      setRosterByTeam(grouped)
      setLoadingRoster(false)
    }

    loadRoster()
    return () => { active = false }
  }, [])

  const totalRosterCount = useMemo(
    () => rosterByTeam['raising-bulls'].length + rosterByTeam['royal-bulls'].length,
    [rosterByTeam],
  )

  return (
    <div>
      {/* Header — compact on mobile */}
      <section className="bg-primary-dark text-white py-8 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="font-display text-[9px] sm:text-xs tracking-[0.3em] text-white/60 uppercase mb-1.5">NC Bulls Cricket Club</div>
            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold mb-2 md:mb-4">
              OUR <span className="text-accent">TEAMS</span>
            </h1>
            <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
              Two squads. One club. Built on passion for cricket in North Carolina.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Team Sections */}
      {teams.map((team, i) => (
        <section key={team.id} className={`py-8 md:py-16 ${i % 2 === 0 ? 'bg-white' : 'bg-surface'}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              {/* Accent bar + name */}
              <div className={`w-8 md:w-12 h-1 ${team.accentBar} rounded mb-3 md:mb-4`} />
              <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold mb-1.5 md:mb-2 text-primary-dark">
                <span className={team.headingColor}>{team.name.split(' ')[0].toUpperCase()}</span>{' '}
                {team.name.split(' ').slice(1).join(' ').toUpperCase()}
              </h2>
              <p className="text-gray-500 italic text-xs sm:text-sm md:text-base mb-4 md:mb-6">"{team.tagline}"</p>

              {/* Stats */}
              <div className="flex gap-6 md:gap-10 mb-4 md:mb-6">
                <div>
                  <div className="font-display text-2xl md:text-3xl font-bold text-primary-dark">{team.founded}</div>
                  <div className="text-gray-400 text-[10px] md:text-xs uppercase tracking-wider mt-0.5 md:mt-1">Founded</div>
                </div>
                <div>
                  <div className="font-display text-2xl md:text-3xl font-bold text-primary-dark">{team.titles}</div>
                  <div className="text-gray-400 text-[10px] md:text-xs uppercase tracking-wider mt-0.5 md:mt-1">Titles</div>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed text-sm md:text-lg mb-4 md:mb-6">{team.description}</p>

              {/* Team Colors */}
              <h3 className="font-display font-bold text-primary uppercase tracking-wider text-xs md:text-sm mb-2 md:mb-3">Team Colors</h3>
              <div className="flex gap-3 md:gap-4 mb-6 md:mb-8">
                {team.colors.map((color, ci) => (
                  <div key={color} className="flex items-center gap-1.5 md:gap-2">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-gray-200 shadow-sm flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs md:text-sm text-gray-500">{team.colorNames[ci]}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Link to="/fixtures" className="btn-primary text-sm px-4 py-2 md:px-6 md:py-2.5">Upcoming Fixtures</Link>
                <Link to="/results" className="btn-outline text-sm px-4 py-2 md:px-6 md:py-2.5">Results</Link>
              </div>
            </motion.div>
          </div>
        </section>
      ))}

      {/* Squad — Both Rosters */}
      <section className="py-8 md:py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-heading mb-6 md:mb-10 text-center text-xl md:text-3xl">Our Squads</h2>
          {!loadingRoster && !rosterError && (
            <p className="text-center text-xs sm:text-sm text-gray-500 mb-4 md:mb-6">
              Showing {totalRosterCount} roster players.
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 md:gap-6 max-w-3xl mx-auto">
            {squadCards.map((squad) => (
              <motion.div
                key={squad.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`bg-gradient-to-br ${squad.bg} rounded-2xl p-4 sm:p-8 text-center text-white shadow-lg flex flex-col items-center`}
              >
                <div className="w-10 h-10 sm:w-16 sm:h-16 mb-3 sm:mb-4 bg-white/10 border-2 border-accent rounded-full flex items-center justify-center font-display font-bold text-accent text-sm sm:text-xl">
                  {squad.badge}
                </div>
                <h3 className="font-display font-bold text-base sm:text-2xl mb-0.5 sm:mb-1">{squad.label}</h3>
                <p className="text-gray-300 text-xs sm:text-sm mb-4 sm:mb-6">{squad.sub}</p>

                <div className="w-full bg-white/10 border border-white/20 rounded-xl p-2.5 sm:p-3 mb-4 sm:mb-6 text-left">
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
                    Player Roster
                  </p>

                  {loadingRoster && (
                    <div className="flex justify-center py-2">
                      <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {!loadingRoster && rosterError && (
                    <p className="text-[10px] sm:text-xs text-red-100">{rosterError}</p>
                  )}

                  {!loadingRoster && !rosterError && rosterByTeam[squad.id].length === 0 && (
                    <p className="text-[10px] sm:text-xs text-white/70">No players found in roster.</p>
                  )}

                  {!loadingRoster && !rosterError && rosterByTeam[squad.id].length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {rosterByTeam[squad.id].map((first, idx) => (
                        <span
                          key={`${squad.id}-${first}-${idx}`}
                          className="text-[10px] sm:text-xs bg-white/15 border border-white/15 rounded-md px-2 py-1 truncate sm:text-left text-center"
                          title={first}
                        >
                          {first}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <a
                  href={squad.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-accent text-primary-dark font-bold px-3 py-2 sm:px-6 sm:py-2.5 rounded-full hover:bg-yellow-300 active:scale-95 transition-all text-[11px] sm:text-sm"
                >
                  <span className="sm:hidden">View Roster ↗</span>
                  <span className="hidden sm:inline">View Roster on CricHeroes</span>
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
