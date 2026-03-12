import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const milestones = [
  { year: '2019', event: 'NC Bulls Cricket Club founded in Cary, NC by a group of cricket enthusiasts.' },
  { year: '2021', event: 'Launched the Raising Bulls — our first competitive T20 squad in the Triangle Cricket League.' },
  { year: '2022', event: 'Reached our first league final. Royal Bulls squad formed to grow the club further.' },
  { year: '2023', event: 'Raising Bulls win their first league championship title.' },
  { year: '2024', event: 'Club membership exceeds 30 active players. Ground partnership secured at WakeMed Soccer Park.' },
  { year: '2025', event: 'Raising Bulls win back-to-back titles. Royal Bulls reach the semi-finals for the first time.' },
  { year: '2026', event: '2026 season underway — aiming for a historic third straight title for Raising Bulls.' },
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
              ABOUT <span className="text-accent">NC BULLS</span>
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
                  NC Bulls Cricket Club was born in 2019 in Cary, North Carolina, out of a shared love of cricket among the growing South Asian community in the Triangle area. What started as informal weekend matches quickly grew into something much bigger.
                </p>
                <p>
                  Today, NC Bulls fields two competitive T20 squads — the <strong className="text-primary">Raising Bulls</strong> and the <strong className="text-primary">Royal Bulls</strong> — competing in the Triangle Cricket League and other regional tournaments across North Carolina.
                </p>
                <p>
                  With over 16 active players, a dedicated coaching setup, and a passionate supporter base, NC Bulls has become one of the most recognised cricket clubs in North Carolina.
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
