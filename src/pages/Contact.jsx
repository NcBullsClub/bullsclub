import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

const ROLES = [
  { value: 'batsman',        label: '🏏 Batsman' },
  { value: 'bowler',         label: '⚡ Bowler' },
  { value: 'all-rounder',    label: '🌟 All-Rounder' },
  { value: 'wicket-keeper',  label: '🧤 Wicket-Keeper' },
  { value: 'beginner',       label: '🌱 Beginner / Learning' },
]

const TEAMS = [
  { value: 'raising-bulls', label: 'Raising Bulls' },
  { value: 'royal-bulls',   label: 'Royal Bulls' },
]

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [formData, setFormData]   = useState({ full_name: '', email: '', team: '', playing_role: '', message: '' })

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!formData.team) { setError('Please select a team.'); setLoading(false); return }
    setLoading(true)
    const { error: err } = await supabase.from('join_requests').insert({
      full_name:    formData.full_name.trim(),
      email:        formData.email.trim().toLowerCase(),
      team:         formData.team || null,
      playing_role: formData.playing_role,
      message:      formData.message.trim() || null,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSubmitted(true)
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
                  { icon: '📍', label: 'Location', value: 'Apex, North Carolina' },
                  { icon: '✉️', label: 'Email', value: 'ncbullscricketclub@gmail.com' },
                  { icon: '🕐', label: 'Training', value: 'Weekends — contact us for schedule' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary-dark rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <div className="font-medium text-primary text-sm">{item.label}</div>
                      {item.label === 'Email' ? (
                        <a href={`mailto:${item.value}`} className="text-primary hover:text-accent transition-colors">{item.value}</a>
                      ) : (
                        <div className="text-gray-500">{item.value}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <h3 className="font-display font-bold text-primary text-lg mb-4 uppercase tracking-wider">Why Join NC Bulls Cricket Club?</h3>
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
                  <h3 className="font-display font-bold text-primary text-2xl mb-3">Request Received!</h3>
                  <p className="text-gray-500">
                    Thanks for your interest! Our admins will review your request and add you to the approved list shortly. Keep an eye on your email.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 space-y-5"
                >
                  <h3 className="font-display font-bold text-primary text-xl">Register Interest</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="full_name">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="full_name"
                      name="full_name"
                      type="text"
                      required
                      value={formData.full_name}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Team <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {TEAMS.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, team: t.value }))}
                          className={`px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                            formData.team === t.value
                              ? 'border-primary-dark bg-primary-dark text-white'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="playing_role">
                      Playing Role <span className="text-red-400">*</span>
                    </label>
                    <select
                      id="playing_role"
                      name="playing_role"
                      required
                      value={formData.playing_role}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white"
                    >
                      <option value="">Select your role</option>
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="message">
                      Message <span className="text-gray-400 font-normal text-xs">(optional)</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={3}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
                      placeholder="Tell us a bit about your cricket experience…"
                    />
                  </div>

                  {error && (
                    <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary text-center py-3.5 text-base disabled:opacity-60"
                  >
                    {loading ? 'Submitting…' : 'Request to Join →'}
                  </button>

                  <p className="text-xs text-gray-400 text-center">
                    Admins will review and add you to the approved list. You'll then be able to sign up.
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
