import { useState } from 'react'
import { motion } from 'framer-motion'
import sponsors from '../data/sponsors.json'
import { supabase } from '../lib/supabase'

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
  const EMPTY_FORM = { contact_name: '', email: '', mobile: '', brand_name: '', tier_interest: 'open', message: '' }
  const [form, setForm]       = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [formError, setFormError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.contact_name.trim() || !form.email.trim() || !form.mobile.trim() || !form.brand_name.trim()) {
      setFormError('Please fill in all required fields.')
      return
    }
    setFormError('')
    setSubmitting(true)
    const { error } = await supabase.from('sponsor_inquiries').insert({
      contact_name:  form.contact_name.trim(),
      email:         form.email.trim(),
      mobile:        form.mobile.trim(),
      brand_name:    form.brand_name.trim(),
      tier_interest: form.tier_interest,
      message:       form.message.trim() || null,
    })
    setSubmitting(false)
    if (error) {
      setFormError('Something went wrong. Please try again or email us directly.')
      return
    }
    setSubmitted(true)
    setForm(EMPTY_FORM)
  }

  return (
    <div>
      {/* Header */}
      <section className="bg-primary-dark text-white py-8 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-3">
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
                      className={`border-2 rounded-2xl p-4 sm:p-6 text-center hover:shadow-md transition-all ${style.bg}`}
                    >
                      <div className="h-14 sm:h-20 flex items-center justify-center mb-3">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-xl sm:text-2xl font-bold">
                          {s.name[0]}
                        </div>
                      </div>
                      <h3 className="font-display font-bold text-primary text-sm sm:text-base">{s.name}</h3>
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

      {/* Become a Sponsor — Inquiry Form */}
      <section className="bg-primary-dark text-white py-12 sm:py-16">
        <div className="max-w-2xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-full px-4 py-1.5 text-accent text-xs font-semibold mb-4">
                🤝 Partnership Opportunity
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">
                BECOME A <span className="text-accent">SPONSOR</span>
              </h2>
              <p className="text-gray-300 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                Partner with NC Bulls Cricket Club and place your brand in front of a passionate, growing cricket community across the Research Triangle.
              </p>
            </div>

            {submitted ? (
              <div className="bg-green-500/20 border border-green-400/40 rounded-2xl px-6 py-8 text-center">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="font-display font-bold text-white text-xl mb-2">Inquiry Received!</h3>
                <p className="text-gray-300 text-sm">Thank you for your interest in sponsoring NC Bulls Cricket Club. Our team will be in touch within 2–3 business days.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-5 text-sm font-semibold text-accent hover:underline"
                >
                  Submit another inquiry →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-7 space-y-4">
                {formError && (
                  <div className="bg-red-500/20 border border-red-400/30 text-red-300 text-sm px-4 py-3 rounded-xl">
                    {formError}
                  </div>
                )}

                {/* Row 1: Name + Brand */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wide">
                      Your Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.contact_name}
                      onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
                      placeholder="John Smith"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wide">
                      Brand / Company <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.brand_name}
                      onChange={(e) => setForm((f) => ({ ...f, brand_name: e.target.value }))}
                      placeholder="Acme Corp"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50"
                    />
                  </div>
                </div>

                {/* Row 2: Email + Mobile */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wide">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="john@company.com"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wide">
                      Mobile <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={form.mobile}
                      onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                      placeholder="+1 (919) 000-0000"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50"
                    />
                  </div>
                </div>

                {/* Sponsorship tier interest */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">Sponsorship Interest</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { value: 'gold',   label: '🥇 Gold',    desc: 'Premier partner' },
                      { value: 'silver', label: '🥈 Silver',  desc: 'Core partner'    },
                      { value: 'bronze', label: '🥉 Bronze',  desc: 'Community'       },
                      { value: 'event',  label: '🎪 Event',   desc: 'Match day'       },
                      { value: 'open',   label: '💬 Open',    desc: 'Let’s discuss'  },
                    ].map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, tier_interest: t.value }))}
                        className={`text-left px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                          form.tier_interest === t.value
                            ? 'bg-accent text-primary-dark border-accent'
                            : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        <div>{t.label}</div>
                        <div className="text-[10px] font-normal opacity-70 mt-0.5">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wide">
                    Message <span className="text-gray-500 font-normal normal-case">(optional)</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    rows={3}
                    placeholder="Tell us about your brand, marketing goals, or any specific ideas…"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-accent text-primary-dark font-bold text-sm hover:bg-accent-light transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Sending…' : 'Send Sponsorship Inquiry →'}
                </button>

                <p className="text-center text-[11px] text-gray-500">
                  We typically respond within 2–3 business days. You can also email us at{' '}
                  <a href="mailto:ncbullscricketclub@gmail.com" className="text-accent hover:underline">ncbullscricketclub@gmail.com</a>
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  )
}
