import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const milestones = [
  { year: '2022', event: 'NC Bulls Cricket Club founded. Raising Bulls hit the ground running — Table Toppers & Winter Finalists in their debut season.' },
  { year: '2023', event: 'Dominant year across four seasons: Spring Table Toppers, Summer Table Toppers & Summer Champions, Fall Champions, and Winter Table Toppers.' },
  { year: '2024', event: 'Winter Champions — continued excellence with another title to the cabinet.' },
  { year: '2025', event: 'Triple honour: Smash Table Toppers, Winter Table Toppers & Finalists, and APEX League Table Toppers & Finalists.' },
  { year: '2026', event: '2026 Mega Bash season underway — aiming to add more silverware to an already outstanding record.' },
]

const values = [
  { icon: '🏏', title: 'Competitive Spirit', desc: 'We play to win with passion, discipline, and respect for the game.' },
  { icon: '🤝', title: 'Community', desc: 'Cricket is a way to connect — we build friendships that extend beyond the boundary.' },
  { icon: '🌱', title: 'Development', desc: 'We nurture talent at all levels, from beginners to seasoned cricketers.' },
  { icon: '🏆', title: 'Excellence', desc: 'We set high standards on and off the field, striving to be the best we can be.' },
]

export default function About() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-primary-dark text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">
              ABOUT <span className="text-accent">NC BULLS CRICKET CLUB</span>
            </h1>
            <p className="text-gray-300 text-xl max-w-2xl mx-auto">
              Our story, our values, our people — the heart of NC Bulls Cricket Club
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="section-heading mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  NC Bulls Cricket Club was founded in 2022 in Apex, North Carolina, out of a shared love for cricket among the South Asian community in the Triangle area. What started as a single competitive squad quickly grew into a celebrated club.
                </p>
                <p>
                  The <strong className="text-primary">Raising Bulls</strong> have been the standout side from day one — winning titles across Spring, Summer, Fall, and Winter seasons, cementing themselves as one of the most consistent teams in the region.
                </p>
                <p>
                  With 9 titles and finals appearances since 2022, and a growing squad of 16+ active players, NC Bulls Cricket Club has established itself as a powerhouse of cricket in North Carolina.
                </p>
              </div>
              <div className="mt-8">
                <Link to="/contact" className="btn-primary">Join Our Club</Link>
              </div>
            </motion.div>

            {/* Values */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {values.map((v) => (
                <div key={v.title} className="bg-surface border border-gray-100 rounded-xl p-5">
                  <div className="text-3xl mb-3">{v.icon}</div>
                  <h3 className="font-display font-bold text-primary text-base mb-2">{v.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Honours Board */}
      <section className="py-16 bg-accent">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <div className="text-primary-dark/60 text-xs font-bold uppercase tracking-[0.3em] mb-2">Trophy Cabinet</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary-dark">
              CLUB <span className="text-primary">HONOURS</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Raising Bulls */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-primary-dark rounded-2xl p-8 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center font-display font-bold text-primary-dark text-sm">RB</div>
                <div>
                  <div className="font-display font-bold text-white text-xl leading-none">Raising Bulls</div>
                  <div className="text-gray-400 text-xs mt-0.5">Est. 2021 · Mega Bash</div>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { icon: '🏆', count: '3×', label: 'Champions', countColor: 'text-accent' },
                  { icon: '🔝', count: '4×', label: 'Table Toppers', countColor: 'text-accent' },
                  { icon: '🥈', count: '2×', label: 'Runners-Up', countColor: 'text-accent' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-xl w-7 text-center flex-shrink-0">{item.icon}</span>
                    <div className="flex-1 bg-white/10 rounded-xl px-4 py-2.5 flex items-center justify-between">
                      <span className="text-gray-200 text-sm font-medium">{item.label}</span>
                      <span className={`font-display font-bold text-xl ${item.countColor}`}>{item.count}</span>
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
              className="bg-primary-dark rounded-2xl p-8 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center font-display font-bold text-primary-dark text-sm">RY</div>
                <div>
                  <div className="font-display font-bold text-white text-xl leading-none">Royal Bulls</div>
                  <div className="text-gray-400 text-xs mt-0.5">Est. 2022 · League</div>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { icon: '🏆', count: '1×', label: 'Champions', note: 'Debut Season' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-xl w-7 text-center flex-shrink-0">{item.icon}</span>
                    <div className="flex-1 bg-white/10 rounded-xl px-4 py-2.5 flex items-center justify-between">
                      <div>
                        <span className="text-gray-200 text-sm font-medium">{item.label}</span>
                        {item.note && <span className="text-gray-400 text-xs ml-2">— {item.note}</span>}
                      </div>
                      <span className="font-display font-bold text-xl text-accent">{item.count}</span>
                    </div>
                  </div>
                ))}
                <div className="mt-4 bg-white/10 rounded-xl p-4 text-center">
                  <div className="text-accent text-sm font-semibold">Growing force in the Triangle</div>
                  <div className="text-gray-400 text-xs mt-1">Semi-finalists 2025 · Competing at the highest level</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-heading">Club Timeline</h2>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 -translate-x-0.5 top-0 bottom-0 w-0.5 bg-accent/30 hidden sm:block" />
            <div className="space-y-6">
              {milestones.map((m, i) => (
                <motion.div
                  key={m.year}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={`sm:flex gap-8 items-start ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}
                >
                  <div className={`sm:w-1/2 ${i % 2 === 0 ? 'sm:text-right' : 'sm:text-left'}`}>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <p className="text-gray-600 text-sm">{m.event}</p>
                    </div>
                  </div>
                  <div className="relative sm:w-0 flex justify-start sm:justify-center my-2 sm:my-0">
                    <div className="w-10 h-10 bg-primary-dark border-2 border-accent rounded-full flex items-center justify-center font-display font-bold text-accent text-xs z-10">
                      {m.year.slice(2)}
                    </div>
                  </div>
                  <div className="sm:w-1/2">
                    <div className={`font-display font-bold text-primary text-xl ${i % 2 === 0 ? 'sm:pl-2' : 'sm:text-right sm:pr-2'}`}>{m.year}</div>
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
