import { motion } from 'framer-motion'
import sponsors from '../data/sponsors.json'

const tierColors = {
  Gold: { bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', label: '🥇 Gold Sponsor' },
  Silver: { bg: 'bg-gray-50 border-gray-200', badge: 'bg-gray-200 text-gray-600', label: '🥈 Silver Sponsor' },
  Bronze: { bg: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700', label: '🥉 Bronze Sponsor' },
}

const grouped = {
  Gold: sponsors.filter((s) => s.tier === 'Gold'),
  Silver: sponsors.filter((s) => s.tier === 'Silver'),
  Bronze: sponsors.filter((s) => s.tier === 'Bronze'),
}

export default function Sponsors() {
  return (
    <div>
      {/* Header */}
      <section className="bg-primary-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-3">
              OUR <span className="text-accent">SPONSORS</span>
            </h1>
            <p className="text-gray-300 text-lg">
              Thank you to the partners who make NC Bulls Cricket Club possible
            </p>
          </motion.div>
        </div>
      </section>

      {/* Sponsors by tier */}
      <section className="py-16 bg-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {Object.entries(grouped).map(([tier, tierSponsors]) => {
            if (!tierSponsors.length) return null
            const style = tierColors[tier]
            return (
              <motion.div
                key={tier}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-14"
              >
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="section-heading">{tier} Sponsors</h2>
                </div>
                <div className={`grid gap-4 ${tier === 'Gold' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                  {tierSponsors.map((s, i) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className={`border-2 rounded-2xl p-6 text-center hover:shadow-md transition-all ${style.bg}`}
                    >
                      <div className="h-20 flex items-center justify-center mb-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-2xl font-bold">
                          {s.name[0]}
                        </div>
                      </div>
                      <h3 className="font-display font-bold text-primary text-base">{s.name}</h3>
                      <span className={`inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full ${style.badge}`}>
                        {style.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Become a Sponsor CTA */}
      <section className="bg-primary-dark text-white py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl font-bold mb-4">
              BECOME A <span className="text-accent">SPONSOR</span>
            </h2>
            <p className="text-gray-300 mb-8 text-lg">
              Partner with NC Bulls Cricket Club and get your brand in front of a passionate, growing community of cricket fans across North Carolina.
            </p>
            <a href="mailto:info@ncbullscc.com" className="btn-primary text-base">
              Get in Touch →
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
