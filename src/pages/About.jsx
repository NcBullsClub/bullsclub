import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

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
              ABOUT <span className="text-accent">NC BULLS</span>
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
                With 9 titles and finals appearances since 2022, and a growing squad of 16+ active players, NC Bulls has established itself as a powerhouse of cricket in North Carolina.
              </p>
            </div>
            <div className="mt-5 md:mt-8">
              <Link to="/contact" className="btn-primary">Join Our Club</Link>
            </div>
          </motion.div>
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
