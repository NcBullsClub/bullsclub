import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import logo from '../assets/images/cropped_no bg_nc_bulls_club_logo.png'
import fixtures from '../data/fixtures.json'
import { supabase } from '../lib/supabase'
import { turso } from '../lib/turso'
import sponsors from '../data/sponsors.json'

function isWon(r) {
  if (!r.result) return false
  const label = r.team === 'raising-bulls' ? 'Raising Bulls won' : 'Royal Bulls won'
  return r.result.toLowerCase().includes(label.toLowerCase())
}

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
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingRB = fixtures.filter(f => new Date(f.date + 'T00:00:00') >= today && f.team === 'raising-bulls').slice(0, 3)
  const upcomingRY = fixtures.filter(f => new Date(f.date + 'T00:00:00') >= today && f.team === 'royal-bulls').slice(0, 3)

  const [latestRBResults, setLatestRBResults] = useState([])
  const [latestRYResults, setLatestRYResults] = useState([])
  const [rbWins, setRbWins] = useState(0)
  const [ryWins, setRyWins] = useState(0)
  const [latestNews, setLatestNews] = useState([])
  const [showA2HS, setShowA2HS]         = useState(false)
  const [a2hsPlatform, setA2hsPlatform] = useState('ios')
  const [a2hsDismissed, setA2hsDismissed] = useState(false)
  const deferredPromptRef = useRef(null)

  useEffect(() => {
    const dismissed   = localStorage.getItem('a2hs-dismissed')
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    const ua = navigator.userAgent
    const ios     = /iphone|ipad|ipod/i.test(ua)
    const android = /android/i.test(ua)
    if (!isStandalone && (ios || android)) {
      setA2hsPlatform(ios ? 'ios' : 'android')
      if (dismissed) {
        setA2hsDismissed(true)
      } else {
        setShowA2HS(true)
      }
    }
  }, [])

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      deferredPromptRef.current = e
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleNativeInstall() {
    if (deferredPromptRef.current) {
      deferredPromptRef.current.prompt()
      const { outcome } = await deferredPromptRef.current.userChoice
      deferredPromptRef.current = null
      if (outcome === 'accepted') dismissA2HS()
    }
  }

  function dismissA2HS() {
    localStorage.setItem('a2hs-dismissed', '1')
    setShowA2HS(false)
    setA2hsDismissed(true)
  }

  function reopenA2HS() {
    localStorage.removeItem('a2hs-dismissed')
    setA2hsDismissed(false)
    setShowA2HS(true)
  }

  useEffect(() => {
    turso.execute("SELECT id, title, slug, summary, published_at, cover_image_url FROM news WHERE status='published' ORDER BY published_at DESC LIMIT 3")
      .then(({ rows }) => {
        setLatestNews(rows.map(r => ({
          id: r.id,
          title: r.title,
          slug: r.slug,
          excerpt: r.summary,
          date: r.published_at?.split('T')[0] ?? '',
          cover_image_url: r.cover_image_url ?? '',
        })))
      })
  }, [])

  useEffect(() => {
    supabase
      .from('match_results')
      .select('id, fixture_date, team, opponent, venue, result, ncb_score, opp_score')
      .order('fixture_date', { ascending: false })
      .then(({ data }) => {
        const all = data || []
        const rb = all.filter(r => r.team === 'raising-bulls')
        const ry = all.filter(r => r.team === 'royal-bulls')
        setLatestRBResults(rb.slice(0, 3))
        setLatestRYResults(ry.slice(0, 3))
        setRbWins(rb.filter(isWon).length)
        setRyWins(ry.filter(isWon).length)
      })
  }, [])

  return (
    <div>
      {/* Floating re-open button — shows after A2HS is dismissed, mobile only */}
      {a2hsDismissed && !showA2HS && (
        <button
          onClick={reopenA2HS}
          className="fixed top-1/2 right-0 -translate-y-1/2 z-50 sm:hidden flex items-center gap-1.5 bg-primary-dark text-accent border border-accent/40 rounded-l-full px-3 py-2.5 text-xs font-semibold shadow-lg active:scale-95 transition-transform"
          aria-label="Add to Home Screen"
        >
          <span>📲</span>
          <span>Add to Home Screen</span>
        </button>
      )}

      {/* Add to Home Screen — fixed bottom sheet, mobile only */}
      {showA2HS && (
        <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
          <div className="bg-white border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.15)] px-4 pt-4 pb-6">

            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary-dark flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-xl">📲</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900 leading-tight">Add to Home Screen</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Get the full app experience — fast &amp; easy</p>
                </div>
              </div>
              <button
                onClick={dismissA2HS}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors flex-shrink-0 -mr-1"
                aria-label="Dismiss"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100 mb-3" />

            {/* Platform label */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
              {a2hsPlatform === 'ios' ? '🍎 iPhone / iPad — Safari' : '🤖 Android — Chrome'}
            </p>

            {/* Steps */}
            <div className="space-y-2 mb-4">
              {a2hsPlatform === 'ios' ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary-dark text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">1</span>
                    <p className="text-xs text-gray-700">Tap the <span className="font-bold">Share</span> icon <span className="font-bold text-primary-dark">⬆</span> at the <span className="font-semibold">bottom</span> of Safari</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary-dark text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">2</span>
                    <p className="text-xs text-gray-700">Scroll down and tap <span className="font-bold">&ldquo;Add to Home Screen&rdquo;</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary-dark text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">3</span>
                    <p className="text-xs text-gray-700">Tap <span className="font-bold">&ldquo;Add&rdquo;</span> in the top-right corner — done!</p>
                  </div>
                </>
              ) : (
                <>
                  {deferredPromptRef.current ? (
                    <button
                      onClick={handleNativeInstall}
                      className="w-full py-3 rounded-xl bg-primary-dark text-accent font-bold text-sm flex items-center justify-center gap-2"
                    >
                      <span>📲</span> Tap to Install App
                    </button>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-primary-dark text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">1</span>
                        <p className="text-xs text-gray-700">Tap the <span className="font-bold">⋮</span> menu in the <span className="font-semibold">top-right</span> of Chrome</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-primary-dark text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">2</span>
                        <p className="text-xs text-gray-700">Tap <span className="font-bold">&ldquo;Add to Home Screen&rdquo;</span> or <span className="font-bold">&ldquo;Install App&rdquo;</span></p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-primary-dark text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">3</span>
                        <p className="text-xs text-gray-700">Tap <span className="font-bold">&ldquo;Add&rdquo;</span> to confirm — done!</p>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Dismiss link */}
            <button
              onClick={dismissA2HS}
              className="w-full text-center text-[11px] text-gray-400 hover:text-gray-600 transition-colors py-1"
            >
              Don't show this again
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative bg-primary-dark text-white overflow-hidden min-h-[90vh] flex items-center">
        {/* Background logo watermark */}
        <div className="absolute inset-0 flex items-start justify-center pointer-events-none" style={{paddingTop: '6%'}}>
          <img
            src={logo}
            alt=""
            className="w-[550px] max-w-[70vw] select-none"
            style={{
              opacity: 0.22,
              filter: 'sepia(1) saturate(4) hue-rotate(5deg) drop-shadow(0 0 40px rgba(245,197,24,0.5))',
            }}
          />
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
                Home of the <strong className="text-accent">Raising Bulls</strong> &amp; <strong className="text-accent">Royal Bulls</strong> — representing the spirit of cricket across the Research Triangle (RTP) region of North Carolina.
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
                const wins = teamId === 'raising-bulls' ? rbWins : ryWins
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
              { label: 'Wins 2025 Winter Season', value: 8, suffix: '' },
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
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-heading">Upcoming Fixtures</h2>
            <Link to="/fixtures" className="text-primary font-medium hover:text-accent transition-colors text-sm">
              View All →
            </Link>
          </div>

          {/* Raising Bulls row */}
          {upcomingRB.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-primary-dark text-accent text-xs font-bold px-3 py-1 rounded-full">Raising Bulls</span>
                <span className="text-xs text-gray-400">{upcomingRB[0].type}</span>
              </div>

              {/* Mobile: compact list */}
              <div className="sm:hidden space-y-2.5">
                {upcomingRB.map((f, i) => {
                  const d = new Date(f.date.replace(/-/g, '/'))
                  return (
                    <motion.div key={f.id} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                      className="bg-white border border-gray-100 border-l-4 border-l-accent rounded-xl px-3.5 py-3 shadow-sm"
                    >
                      {/* Row 1: date · opponent · format */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="flex-shrink-0 text-[10px] font-bold uppercase text-white bg-primary-dark px-2 py-0.5 rounded-md tracking-wide">
                          {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="font-bold text-primary-dark text-sm leading-tight truncate">vs {f.opponent}</span>
                        <span className="ml-auto flex-shrink-0 text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{f.format}</span>
                      </div>
                      {/* Row 2: venue · time */}
                      <div className="text-xs text-gray-400 truncate mb-2.5">📍 {f.venue}{f.time ? ` · ${f.time}` : ''}</div>
                      {/* Row 3: CTA */}
                      <Link
                        to={`/availability?fixture=${f.id}&team=raising-bulls`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-accent/15 text-primary-dark border border-accent/40 px-3 py-1.5 rounded-lg hover:bg-accent hover:border-accent transition-colors"
                      >
                        🏏 Mark Availability
                      </Link>
                    </motion.div>
                  )
                })}
              </div>

              {/* Desktop: grid cards */}
              <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {upcomingRB.map((f, i) => (
                  <Link key={f.id} to="/fixtures">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                      className="bg-white border border-gray-200 border-t-4 border-t-accent rounded-2xl p-6 hover:shadow-lg hover:border-accent transition-all cursor-pointer h-full"
                    >
                      <div className="text-xs font-bold uppercase tracking-widest text-accent mb-2">{new Date(f.date.replace(/-/g, '/')).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      <div className="font-display font-bold text-primary-dark text-2xl mb-1 leading-tight">vs {f.opponent}</div>
                      <div className="text-sm text-gray-500 mb-3">{f.time} &middot; {f.format}</div>
                      <div className="flex items-start gap-1.5 text-xs text-gray-400 mb-4">
                        <span className="mt-0.5">📍</span>
                        <span className="truncate">{f.venue}</span>
                      </div>
                      <Link
                        to={`/availability?fixture=${f.id}&team=raising-bulls`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs font-semibold bg-accent/20 text-primary-dark border border-accent/40 px-3 py-1.5 rounded-full hover:bg-accent hover:border-accent transition-colors"
                      >
                        🏏 Mark Availability
                      </Link>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Royal Bulls row */}
          {upcomingRY.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">Royal Bulls</span>
                <span className="text-xs text-gray-400">{upcomingRY[0].type}</span>
              </div>

              {/* Mobile: compact list */}
              <div className="sm:hidden space-y-2.5">
                {upcomingRY.map((f, i) => {
                  const d = new Date(f.date.replace(/-/g, '/'))
                  return (
                    <motion.div key={f.id} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                      className="bg-white border border-gray-100 border-l-4 border-l-primary rounded-xl px-3.5 py-3 shadow-sm"
                    >
                      {/* Row 1: date · opponent · format */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="flex-shrink-0 text-[10px] font-bold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-md tracking-wide">
                          {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="font-bold text-primary-dark text-sm leading-tight truncate">vs {f.opponent}</span>
                        <span className="ml-auto flex-shrink-0 text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{f.format}</span>
                      </div>
                      {/* Row 2: venue · time */}
                      <div className="text-xs text-gray-400 truncate mb-2.5">📍 {f.venue}{f.time ? ` · ${f.time}` : ''}</div>
                      {/* Row 3: CTA */}
                      <Link
                        to={`/availability?fixture=${f.id}&team=royal-bulls`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-colors"
                      >
                        🏏 Mark Availability
                      </Link>
                    </motion.div>
                  )
                })}
              </div>

              {/* Desktop: grid cards */}
              <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {upcomingRY.map((f, i) => (
                  <Link key={f.id} to="/fixtures">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                      className="bg-white border border-gray-200 border-t-4 border-t-primary rounded-2xl p-6 hover:shadow-lg hover:border-primary transition-all cursor-pointer h-full"
                    >
                      <div className="text-xs font-bold uppercase tracking-widest text-primary mb-2">{new Date(f.date.replace(/-/g, '/')).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      <div className="font-display font-bold text-primary-dark text-2xl mb-1 leading-tight">vs {f.opponent}</div>
                      <div className="text-sm text-gray-500 mb-3">{f.time} &middot; {f.format}</div>
                      <div className="flex items-start gap-1.5 text-xs text-gray-400 mb-4">
                        <span className="mt-0.5">📍</span>
                        <span className="truncate">{f.venue}</span>
                      </div>
                      <Link
                        to={`/availability?fixture=${f.id}&team=royal-bulls`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs font-semibold bg-primary/10 text-primary border border-primary/30 px-3 py-1.5 rounded-full hover:bg-primary hover:text-white hover:border-primary transition-colors"
                      >
                        🏏 Mark Availability
                      </Link>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          )}
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

          <div className="grid lg:grid-cols-2 gap-8">
            {[
              { label: 'Raising Bulls', id: 'raising-bulls', results: latestRBResults, badgeBg: 'bg-primary-dark', badgeText: 'text-accent' },
              { label: 'Royal Bulls',   id: 'royal-bulls',   results: latestRYResults, badgeBg: 'bg-primary',      badgeText: 'text-white'  },
            ].map(({ label, id, results, badgeBg, badgeText }) => (
              <div key={id}>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`${badgeBg} ${badgeText} text-xs font-bold px-3 py-1 rounded-full`}>{label}</span>
                  {results.length > 0 && (
                    <span className="text-xs text-gray-400">
                      {results.filter(isWon).length}W – {results.filter(r => !isWon(r)).length}L last {results.length} matches
                    </span>
                  )}
                </div>

                {results.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-gray-400 text-sm">
                    No results yet this season
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.map((r, i) => (
                      <Link key={r.id} to="/results">
                      <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.07 }}
                        className={`flex items-center gap-2.5 sm:gap-4 bg-white rounded-xl border-l-4 px-2.5 sm:px-4 py-2 sm:py-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${isWon(r) ? 'border-green-500' : 'border-red-400'}`}
                      >
                        <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-display font-bold text-xs sm:text-sm flex-shrink-0 ${isWon(r) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {isWon(r) ? 'W' : 'L'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-800 text-xs sm:text-sm truncate">vs {r.opponent}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {new Date(r.fixture_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {r.venue && <span className="hidden sm:inline"> · {r.venue}</span>}
                          </div>
                          {r.result && (
                            <div className={`text-xs font-medium mt-0.5 line-clamp-1 ${isWon(r) ? 'text-green-600' : 'text-red-500'}`}>{r.result}</div>
                          )}
                        </div>
                        {(r.ncb_score || r.opp_score) && (
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs font-mono font-semibold text-gray-700">{r.ncb_score}</div>
                            <div className="text-xs font-mono text-gray-400">{r.opp_score}</div>
                          </div>
                        )}
                      </motion.div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proud Sponsors */}
      <section className="py-8 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h4 className="font-display font-bold text-primary text-lg">Proud Sponsors</h4>
              <p className="text-gray-500 text-xs mt-0.5">Partners who make NC Bulls Cricket Club possible</p>
            </div>
            <Link to="/sponsors" className="text-primary font-medium hover:text-accent transition-colors text-sm">
              View All →
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {sponsors
              .filter(s => s.tier === 'Gold' || s.tier === 'Silver')
              .map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`flex items-center gap-3 rounded-2xl px-5 py-3 hover:shadow-md transition-all ${
                    s.tier === 'Gold'
                      ? 'bg-amber-50 border-2 border-amber-200'
                      : 'bg-gray-50 border-2 border-gray-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-lg flex-shrink-0 ${
                    s.tier === 'Gold' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {s.name[0]}
                  </div>
                  <div>
                    <div className="font-display font-bold text-primary-dark text-sm leading-tight">{s.name}</div>
                    <div className={`text-xs font-medium mt-0.5 ${s.tier === 'Gold' ? 'text-amber-600' : 'text-gray-400'}`}>
                      {s.tier === 'Gold' ? '🥇 Gold' : '🥈 Silver'}
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>

          <div className="mt-5 text-center">
            <Link
              to="/sponsors"
              className="inline-flex items-center gap-2 border-2 border-primary text-primary font-semibold px-6 py-2.5 rounded-full hover:bg-primary hover:text-white transition-all text-sm"
            >
              Become a Sponsor →
            </Link>
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section className="py-8 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <h2 className="section-heading">Latest News</h2>
            <Link to="/news" className="text-primary font-medium hover:text-accent transition-colors text-sm">
              View All →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {latestNews.map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group flex sm:flex-col border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-all"
              >
                {/* Image */}
                <Link to={`/news/${article.slug}`} className="flex-shrink-0 w-24 sm:w-full h-24 sm:h-40 relative overflow-hidden bg-gradient-to-br from-primary to-primary-light block">
                  {article.cover_image_url ? (
                    <img
                      src={article.cover_image_url}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-display text-accent text-xl sm:text-4xl font-bold opacity-30">NCB</span>
                    </div>
                  )}
                </Link>
                {/* Content */}
                <div className="p-3 sm:p-5 flex-1 min-w-0 flex flex-col justify-center">
                  <div className="text-[10px] sm:text-xs text-gray-400 mb-1">
                    {new Date(article.date.replace(/-/g, '/')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-1 group-hover:text-primary transition-colors leading-snug line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="hidden sm:block text-sm text-gray-500 line-clamp-2">{article.excerpt}</p>
                  <Link to={`/news/${article.slug}`} className="inline-block mt-1.5 sm:mt-3 text-xs sm:text-sm font-medium text-primary hover:text-accent transition-colors">
                    Read More →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-20 bg-primary-dark text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-14 h-14 mx-auto mb-4 bg-accent/20 rounded-full flex items-center justify-center text-2xl">
              🏏
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
              READY TO <span className="text-accent">PLAY?</span>
            </h2>
            <p className="text-gray-300 text-sm sm:text-lg mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed">
              Join NC Bulls Cricket Club — players of all skill levels welcome across our Raising Bulls &amp; Royal Bulls squads.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link to="/contact" className="btn-primary text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 w-full sm:w-auto">
                Join the Club Today
              </Link>
              <Link to="/teams" className="btn-outline text-base px-8 py-3 w-full sm:w-auto">
                Meet Our Teams
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
