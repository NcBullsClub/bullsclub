import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import logo from '../assets/images/logo_without_background.png'
import fixtures from '../data/fixtures.json'
import results from '../data/results.json'
import news from '../data/news.json'

function CountUp({ end, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const startTime = performance.now()
          const tick = (now) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            setCount(Math.floor(progress * end))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])

  return <span ref={ref}>{count}{suffix}</span>
}

const teamData = {
  'raising-bulls': { name: 'Raising Bulls', color: 'bg-accent', badge: 'RB', accent: 'border-primary-dark', textColor: 'text-primary-dark', subTextColor: 'text-primary-dark/70', badgeBg: 'bg-primary-dark', badgeText: 'text-accent' },
  'royal-bulls': { name: 'Royal Bulls', color: 'bg-primary', badge: 'RY', accent: 'border-accent-light', textColor: 'text-white', subTextColor: 'text-gray-300', badgeBg: 'bg-accent', badgeText: 'text-primary-dark' },
}

export default function Home() {
  const upcomingFixtures = fixtures.slice(0, 3)
  const latestResults = results.slice(0, 3)
  const latestNews = news.slice(0, 3)

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-primary-dark text-white overflow-hidden min-h-[90vh] flex items-center">
        {/* Background logo watermark */}
        <div className="absolute inset-0 flex items-start justify-center pointer-events-none" style={{paddingTop: '6%'}}>
          <img src={logo} alt="" className="w-[550px] max-w-[70vw] opacity-[0.28] select-none" />
        </div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-96 h-96 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-20 left-10 w-64 h-64 rounded-full bg-accent-light blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-full px-4 py-1.5 text-accent text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                2026 Season Underway
              </div>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-none mb-6">
                NC BULLS<br />
                <span className="text-accent">CRICKET</span><br />
                CLUB
              </h1>
              <p className="text-gray-300 text-lg mb-8 max-w-lg leading-relaxed">
                Home of the <strong className="text-accent">Raising Bulls</strong> &amp; <strong className="text-accent">Royal Bulls</strong> — North Carolina's premier cricket club based in Cary, NC.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/teams" className="btn-primary text-base">
                  Our Teams →
                </Link>
                <Link to="/contact" className="btn-outline text-base">
                  Join the Club
                </Link>
              </div>
            </motion.div>

            {/* Team Cards */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="grid grid-cols-2 gap-4"
            >
              {['raising-bulls', 'royal-bulls'].map((teamId) => {
                const team = teamData[teamId]
                const teamResults = results.filter(r => r.team === teamId)
                const wins = teamResults.filter(r => r.result === 'Won').length
                return (
                  <Link
                    key={teamId}
                    to="/teams"
                    className={`${team.color} border-t-4 ${team.accent} rounded-xl p-5 hover:scale-105 transition-transform duration-200`}
                  >
                    <div className={`w-12 h-12 ${team.badgeBg} rounded-full flex items-center justify-center font-display font-bold ${team.badgeText} text-lg mb-3`}>
                      {team.badge}
                    </div>
                    <h3 className={`font-display font-bold ${team.textColor} text-lg leading-tight mb-2`}>{team.name}</h3>
                    <div className={`${team.subTextColor} text-sm`}>{wins} wins this season</div>
                  </Link>
                )
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-accent py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Total Players', value: 119, suffix: '+' },
              { label: 'Matches Played', value: 170, suffix: '+' },
              { label: 'Wins 2025 Winter Season', value: 4, suffix: '' },
              { label: 'Years in Cricket', value: 4, suffix: '+' },
            ].map((stat) => (
              <div key={stat.label} className="text-primary-dark">
                <div className="font-display text-4xl md:text-5xl font-bold">
                  <CountUp end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="font-medium text-sm mt-1 uppercase tracking-wider opacity-80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Fixtures */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-heading">Upcoming Fixtures</h2>
            <Link to="/fixtures" className="text-primary font-medium hover:text-accent transition-colors text-sm">
              View All →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingFixtures.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border border-gray-200 rounded-xl p-5 hover:border-accent hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${f.team === 'raising-bulls' ? 'bg-primary-dark text-accent' : 'bg-primary text-white'}`}>
                    {f.team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'}
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{f.type}</span>
                </div>
                <div className="font-display font-bold text-primary text-xl mb-1">vs {f.opponent}</div>
                <div className="text-sm text-gray-500">{new Date(f.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {f.time}</div>
                <div className="text-sm text-gray-400 mt-1 truncate">📍 {f.venue}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Results */}
      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-heading">Latest Results</h2>
            <Link to="/results" className="text-primary font-medium hover:text-accent transition-colors text-sm">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {latestResults.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={`flex items-center gap-4 p-4 rounded-xl border-l-4 bg-white shadow-sm ${r.result === 'Won' ? 'border-green-500' : 'border-red-400'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${r.result === 'Won' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {r.result === 'Won' ? 'W' : 'L'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 truncate">
                    <span className={`text-xs mr-2 px-2 py-0.5 rounded-full ${r.team === 'raising-bulls' ? 'bg-primary-dark text-accent' : 'bg-primary text-white'}`}>
                      {r.team === 'raising-bulls' ? 'RB' : 'RY'}
                    </span>
                    vs {r.opponent}
                  </div>
                  <div className="text-sm text-gray-400">{new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary text-sm">{r.ncbScore}</div>
                  <div className="text-gray-400 text-sm">{r.oppScore}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-heading">Latest News</h2>
            <Link to="/news" className="text-primary font-medium hover:text-accent transition-colors text-sm">
              View All →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestNews.map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="bg-gradient-to-br from-primary to-primary-light h-40 flex items-center justify-center">
                  <span className="font-display text-accent text-4xl font-bold opacity-30">NCB</span>
                </div>
                <div className="p-5">
                  <div className="text-xs text-gray-400 mb-2">{new Date(article.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                  <h3 className="font-semibold text-gray-800 text-base mb-2 group-hover:text-primary transition-colors leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{article.excerpt}</p>
                  <Link to={`/news/${article.slug}`} className="inline-block mt-3 text-sm font-medium text-primary hover:text-accent transition-colors">
                    Read More →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-dark text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
              READY TO <span className="text-accent">PLAY?</span>
            </h2>
            <p className="text-gray-300 text-lg mb-8">
              Join NC Bulls Cricket Club — we welcome players of all skill levels to our Raising Bulls and Royal Bulls squads.
            </p>
            <Link to="/contact" className="btn-primary text-lg px-10 py-4">
              Join the Club Today
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
