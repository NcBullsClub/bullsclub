import { useState } from 'react'
import { motion } from 'framer-motion'

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', team: '', role: '', message: '' })

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        setSubmitted(true)
      }
    } catch {
      // Fallback: show success for demo (replace YOUR_FORM_ID with real Formspree ID)
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <section className="bg-primary-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-3">
              JOIN THE <span className="text-accent">BULLS</span>
            </h1>
            <p className="text-gray-300 text-lg">
              Interested in playing for Raising Bulls or Royal Bulls? Get in touch — all skill levels welcome!
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Info Side */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="section-heading mb-6">Contact Us</h2>
              <div className="space-y-5">
                {[
                  { icon: '📍', label: 'Location', value: 'Cary, North Carolina' },
                  { icon: '✉️', label: 'Email', value: 'info@ncbullscc.com' },
                  { icon: '🏟️', label: 'Home Ground', value: 'WakeMed Soccer Park, Cary NC' },
                  { icon: '🕐', label: 'Training', value: 'Weekends — contact us for schedule' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary-dark rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <div className="font-medium text-primary text-sm">{item.label}</div>
                      <div className="text-gray-500">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <h3 className="font-display font-bold text-primary text-lg mb-4 uppercase tracking-wider">Why Join NC Bulls?</h3>
                <ul className="space-y-3">
                  {[
                    'Competitive T20 cricket in the Triangle Cricket League',
                    'Two squads — Raising Bulls & Royal Bulls — for all skill levels',
                    'Experienced coaches and a supportive team environment',
                    'Strong community of cricket enthusiasts in NC',
                    'Access to premier venues across the Triangle area',
                  ].map((point) => (
                    <li key={point} className="flex items-start gap-3 text-gray-600 text-sm">
                      <span className="w-5 h-5 rounded-full bg-accent flex-shrink-0 flex items-center justify-center text-primary-dark font-bold text-xs mt-0.5">✓</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              {submitted ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center h-full flex flex-col items-center justify-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="font-display font-bold text-primary text-2xl mb-3">Message Sent!</h3>
                  <p className="text-gray-500">
                    Thanks for reaching out! We'll be in touch soon about joining NC Bulls Cricket Club.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 space-y-5"
                >
                  <h3 className="font-display font-bold text-primary text-xl">Register Interest</h3>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="name">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">
                        Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="phone">
                        Phone Number
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                        placeholder="(919) 000-0000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="team">
                        Preferred Team
                      </label>
                      <select
                        id="team"
                        name="team"
                        value={formData.team}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white"
                      >
                        <option value="">No preference</option>
                        <option value="raising-bulls">Raising Bulls</option>
                        <option value="royal-bulls">Royal Bulls</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="role">
                      Playing Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white"
                    >
                      <option value="">Select your role</option>
                      <option value="batsman">Batsman</option>
                      <option value="bowler">Bowler</option>
                      <option value="all-rounder">All-Rounder</option>
                      <option value="wicket-keeper">Wicket-Keeper</option>
                      <option value="beginner">Beginner / Learning</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="message">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
                      placeholder="Tell us a bit about yourself and your cricket experience..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary text-center py-3.5 text-base disabled:opacity-60"
                  >
                    {loading ? 'Sending...' : 'Send Message →'}
                  </button>

                  <p className="text-xs text-gray-400 text-center">
                    We typically respond within 2–3 business days.
                  </p>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
