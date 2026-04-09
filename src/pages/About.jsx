import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

function InstagramIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}
function YouTubeIcon() {
  return (
    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

const milestones = [
  { year: '2022', event: 'NC Bulls founded. Raising Bulls — Table Toppers & Winter Finalists in debut season.' },
  { year: '2023', event: 'Spring, Summer, Fall & Winter titles — Raising Bulls dominate all four seasons.' },
  { year: '2024', event: 'Winter Champions — another title added to the cabinet.' },
  { year: '2025', event: 'Triple honour: Smash Table Toppers, Winter Table Toppers & Finalists, APEX Table Toppers & Finalists.' },
  { year: '2026', event: '2026 Mega Bash underway — aiming for more silverware.' },
]

const values = [
  { icon: '🏏', title: 'Competitive Spirit', desc: 'Play to win with passion, discipline, and respect.' },
  { icon: '🤝', title: 'Community', desc: 'Cricket connects — friendships beyond the boundary.' },
  { icon: '🌱', title: 'Development', desc: 'Nurturing talent from beginners to seasoned players.' },
  { icon: '🏆', title: 'Excellence', desc: 'High standards on and off the field, always.' },
]

export default function About() {
  return (
    <div>
      {/* Hero — compact on mobile */}
      <section className="bg-primary-dark text-white py-10 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="font-display text-3xl md:text-6xl font-bold mb-2 md:mb-4 leading-tight">
              ABOUT <span className="text-accent">NC BULLS CRICKET CLUB</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-xl max-w-2xl mx-auto">
              Our story, our values, our people
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Club Honours — shown first on all screen sizes ── */}
      <section className="py-8 md:py-16 bg-accent">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-5 md:mb-10"
          >
            <div className="text-primary-dark/60 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] mb-1">Trophy Cabinet</div>
            <h2 className="font-display text-2xl md:text-5xl font-bold text-primary-dark">
              CLUB <span className="text-primary">HONOURS</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-3 md:gap-6">
            {/* Raising Bulls */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-primary-dark rounded-2xl p-4 md:p-8 shadow-xl"
            >
              <div className="flex items-center gap-2.5 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-accent rounded-full flex items-center justify-center font-display font-bold text-primary-dark text-xs md:text-sm flex-shrink-0">RB</div>
                <div>
                  <div className="font-display font-bold text-white text-base md:text-xl leading-none">Raising Bulls</div>
                  <div className="text-gray-400 text-[10px] md:text-xs mt-0.5">Est. 2021 · Mega Bash</div>
                </div>
              </div>
              <div className="space-y-2 md:space-y-3">
                {[
                  { icon: '🏆', count: '3', label: 'Champions' },
                  { icon: '⭐', count: '4', label: 'Table Toppers' },
                  { icon: '🥈', count: '3', label: 'Runners-Up' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <span className="text-base md:text-xl w-6 md:w-7 text-center flex-shrink-0">{item.icon}</span>
                    <div className="flex-1 bg-white/10 rounded-lg md:rounded-xl px-3 md:px-4 py-1.5 md:py-2.5 flex items-center gap-2">
                      <span className="font-display font-bold text-base md:text-xl text-accent">{item.count} <span className="text-[9px] md:text-[11px] font-semibold">times</span></span>
                      <span className="text-gray-200 text-xs md:text-sm font-medium">{item.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Royal Bulls */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-primary-dark rounded-2xl p-4 md:p-8 shadow-xl"
            >
              <div className="flex items-center gap-2.5 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-accent rounded-full flex items-center justify-center font-display font-bold text-primary-dark text-xs md:text-sm flex-shrink-0">RY</div>
                <div>
                  <div className="font-display font-bold text-white text-base md:text-xl leading-none">Royal Bulls</div>
                  <div className="text-gray-400 text-[10px] md:text-xs mt-0.5">Est. 2022 · League</div>
                </div>
              </div>
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-base md:text-xl w-6 md:w-7 text-center flex-shrink-0">🏆</span>
                  <div className="flex-1 bg-white/10 rounded-lg md:rounded-xl px-3 md:px-4 py-1.5 md:py-2.5 flex items-center gap-2">
                    <span className="font-display font-bold text-base md:text-xl text-accent">1 <span className="text-[9px] md:text-[11px] font-semibold">time</span></span>
                    <span className="text-gray-200 text-xs md:text-sm font-medium">Champions</span>
                    <span className="text-gray-400 text-[10px] ml-1">Debut Season</span>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg md:rounded-xl px-3 py-2 md:p-4 text-center">
                  <div className="text-accent text-xs md:text-sm font-semibold">Growing force in the Triangle</div>
                  <div className="text-gray-400 text-[10px] md:text-xs mt-0.5">Semi-finalists 2025 · Competing at the highest level</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Story + Values ── */}
      <section className="py-8 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Values — 2×2 grid, compact on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4 mb-8 md:mb-12"
          >
            {values.map((v) => (
              <div key={v.title} className="bg-surface border border-gray-100 rounded-xl p-3 md:p-5">
                <div className="text-xl md:text-3xl mb-1.5 md:mb-3">{v.icon}</div>
                <h3 className="font-display font-bold text-primary text-xs md:text-base mb-1 md:mb-2 leading-tight">{v.title}</h3>
                <p className="text-gray-500 text-[11px] md:text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </motion.div>

          {/* Story text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl"
          >
            <h2 className="font-display font-bold text-primary text-xl md:text-3xl mb-3 md:mb-6 uppercase tracking-wide">Our Story</h2>
            <div className="space-y-3 text-gray-600 text-sm md:text-base leading-relaxed">
              <p>
                NC Bulls Cricket Club was founded in 2022 in Apex, North Carolina, from a shared love for cricket among the South Asian community in the Triangle area. What started as a single squad quickly grew into a celebrated club.
              </p>
              <p>
                The <strong className="text-primary">Raising Bulls</strong> have been the standout side — winning titles across Spring, Summer, Fall, and Winter seasons, cementing themselves as one of the most consistent teams in the region.
              </p>
              <p>
                With 9 titles and finals appearances since 2022, and a growing squad of 16+ active players, NC Bulls Cricket Club has established itself as a powerhouse of cricket in North Carolina.
              </p>
            </div>
            <div className="mt-5 md:mt-8">
              <Link to="/contact" className="btn-primary">Join Our Club</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Follow Us ── */}
      <section className="bg-gray-900 py-5 px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-[9px] font-black tracking-[0.25em] text-gray-500 uppercase mb-3 text-center">Follow Our Journey</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <motion.a
              href="https://www.instagram.com/ncbullscricketclub/"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden flex-1 flex items-center gap-3 rounded-xl px-4 py-3 border border-white/5 bg-gray-950 active:scale-[0.98] transition-transform"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #f0943308, #bc188808)' }} />
              <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #f09433 0%, #dc2743 50%, #bc1888 100%)' }}>
                <InstagramIcon />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-xs leading-tight">@ncbullscricketclub</p>
                <p className="text-gray-500 text-[10px]">Instagram</p>
              </div>
              <span className="flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg text-white"
                style={{ background: 'linear-gradient(135deg, #f09433 0%, #dc2743 50%, #bc1888 100%)' }}>
                Follow
              </span>
            </motion.a>
            <motion.a
              href="https://www.youtube.com/@NCBullsCricketClub"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden flex-1 flex items-center gap-3 rounded-xl px-4 py-3 border border-white/5 bg-gray-950 active:scale-[0.98] transition-transform"
            >
              <div className="absolute inset-0 bg-red-900/0 group-hover:bg-red-900/10 transition-colors" />
              <div className="w-9 h-9 rounded-lg flex-shrink-0 bg-red-600 flex items-center justify-center">
                <YouTubeIcon />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-xs leading-tight">NC Bulls Cricket Club</p>
                <p className="text-gray-500 text-[10px]">YouTube</p>
              </div>
              <span className="flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-red-600 text-white group-hover:bg-red-500 transition-colors">
                Subscribe
              </span>
            </motion.a>
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="py-8 md:py-16 bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 md:mb-12">
            <h2 className="section-heading">Club Timeline</h2>
          </div>

          {/* Mobile: simple stacked list */}
          <div className="sm:hidden space-y-2">
            {milestones.map((m, i) => (
              <motion.div
                key={m.year}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl px-3.5 py-3"
              >
                <div className="flex-shrink-0 w-9 h-9 bg-primary-dark border-2 border-accent rounded-full flex items-center justify-center font-display font-bold text-accent text-xs">
                  {m.year.slice(2)}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="font-display font-bold text-primary text-sm leading-none mb-1">{m.year}</div>
                  <p className="text-gray-500 text-[11px] leading-relaxed">{m.event}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop: zigzag timeline */}
          <div className="hidden sm:block relative">
            <div className="absolute left-1/2 -translate-x-0.5 top-0 bottom-0 w-0.5 bg-accent/30" />
            <div className="space-y-6">
              {milestones.map((m, i) => (
                <motion.div
                  key={m.year}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex gap-8 items-start ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div className={`w-1/2 ${i % 2 === 0 ? 'text-right' : 'text-left'}`}>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <p className="text-gray-600 text-sm">{m.event}</p>
                    </div>
                  </div>
                  <div className="relative w-0 flex justify-center my-2">
                    <div className="w-10 h-10 bg-primary-dark border-2 border-accent rounded-full flex items-center justify-center font-display font-bold text-accent text-xs z-10">
                      {m.year.slice(2)}
                    </div>
                  </div>
                  <div className="w-1/2">
                    <div className={`font-display font-bold text-primary text-xl ${i % 2 === 0 ? 'pl-2' : 'text-right pr-2'}`}>{m.year}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
