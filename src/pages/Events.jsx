import { useState } from 'react'
import { motion } from 'framer-motion'
import events from '../data/events.json'

const categoryMeta = {
  'pre-season': {
    icon: '🏏',
    label: 'Pre-Season Meetup',
    color: 'bg-blue-100 text-blue-800',
    border: 'border-blue-300',
  },
  jersey: {
    icon: '👕',
    label: 'Jersey Curtain Raiser',
    color: 'bg-accent/20 text-yellow-800',
    border: 'border-accent',
  },
  championship: {
    icon: '🏆',
    label: 'Championship Meetup',
    color: 'bg-green-100 text-green-800',
    border: 'border-green-400',
  },
}

const filters = ['All', 'Upcoming', 'Past']

export default function Events() {
  const [active, setActive] = useState('All')

  const filtered = events.filter((e) => {
    if (active === 'All') return true
    if (active === 'Upcoming') return e.status === 'upcoming'
    if (active === 'Past') return e.status === 'completed'
    return true
  })

  return (
    <div>
      {/* Header */}
      <section className="bg-primary-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-3">
              CLUB <span className="text-accent">EVENTS</span>
            </h1>
            <p className="text-gray-300 text-lg">Meetups, reveals &amp; celebrations from NC Bulls Cricket Club</p>
          </motion.div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 py-3">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActive(f)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                  active === f
                    ? 'bg-primary-dark text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Events List */}
      <section className="py-16 bg-surface min-h-[60vh]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400 text-lg">No events found.</div>
          ) : (
            <div className="space-y-6">
              {filtered.map((event, i) => {
                const meta = categoryMeta[event.category]
                const [y, m, d] = event.date.split('-').map(Number)
                const dateObj = new Date(y, m - 1, d)
                const dateStr = dateObj.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className={`bg-white rounded-2xl border-l-4 ${meta.border} shadow-sm hover:shadow-md transition-shadow p-6 flex gap-5`}
                  >
                    {/* Icon */}
                    <div className="text-4xl flex-shrink-0 mt-1">{meta.icon}</div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${meta.color}`}>
                          {meta.label}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            event.status === 'upcoming'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {event.status === 'upcoming' ? '● Upcoming' : '✓ Completed'}
                        </span>
                      </div>

                      <h2 className="font-display font-bold text-primary text-2xl mb-1">{event.title}</h2>

                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500 mb-3">
                        <span>📅 {dateStr}</span>
                        <span>🕐 {event.time}</span>
                        <span>📍 {event.location}</span>
                      </div>

                      <p className="text-gray-600 text-sm leading-relaxed">{event.description}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
