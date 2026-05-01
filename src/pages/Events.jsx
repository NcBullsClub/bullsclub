import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

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

function EventList({ events }) {
  return (
    <div className="space-y-3 sm:space-y-5">
      {events.map((event, i) => {
        const meta = categoryMeta[event.category] || {
          icon: '📌', label: event.category, color: 'bg-gray-100 text-gray-700', border: 'border-gray-300',
        }
        const [y, m, d] = event.date.split('-').map(Number)
        const dateObj = new Date(y, m - 1, d)
        const dateShort = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        const dateFull  = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className={`bg-white rounded-2xl border-l-4 ${meta.border} shadow-sm p-3.5 sm:p-6 flex gap-3 sm:gap-5 ${
              event.status === 'past' ? 'opacity-70' : ''
            }`}
          >
            {/* Icon */}
            <div className="text-2xl sm:text-4xl flex-shrink-0 mt-0.5">{meta.icon}</div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full ${meta.color}`}>
                  {meta.label}
                </span>
              </div>

              <h2 className="font-display font-bold text-primary text-base sm:text-2xl mb-1 leading-snug">{event.title}</h2>

              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-0.5 sm:gap-x-5 sm:gap-y-1 text-xs sm:text-sm text-gray-500 mb-2">
                <span className="sm:hidden">📅 {dateShort} · 🕐 {event.time}</span>
                <span className="hidden sm:inline">📅 {dateFull}</span>
                <span className="hidden sm:inline">🕐 {event.time}</span>
                <span>📍 {event.venue}</span>
              </div>

              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{event.description}</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default function Events() {
  const [active, setActive] = useState('All')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEvents() {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false })

      if (error) {
        console.error('Failed to load events from Supabase:', error)
      } else {
        setEvents(data || [])
      }

      setLoading(false)
    }

    loadEvents()
  }, [])

  const upcomingEvents = events
    .filter((e) => e.status === 'upcoming')
    .sort((a, b) => new Date(a.date) - new Date(b.date)) // soonest first

  const pastEvents = events
    .filter((e) => e.status === 'past')
    .sort((a, b) => new Date(b.date) - new Date(a.date)) // most recent first

  const filtered =
    active === 'Upcoming' ? upcomingEvents
    : active === 'Past'   ? pastEvents
    : null // null = show grouped sections

  return (
    <div>
      {/* Header — compact on mobile */}
      <section className="bg-primary-dark text-white py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl md:text-6xl font-bold mb-1 md:mb-3">
              CLUB <span className="text-accent">EVENTS</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-lg">Meetups, reveals &amp; celebrations from NC Bulls Cricket Club</p>
          </motion.div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1.5 py-2.5">
            {[
              { id: 'All',      label: 'All',      count: null },
              { id: 'Upcoming', label: '● Upcoming', count: upcomingEvents.length },
              { id: 'Past',     label: '✓ Past',    count: pastEvents.length },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActive(f.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                  active === f.id
                    ? 'bg-primary-dark text-white'
                    : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                }`}
              >
                {f.label}
                {f.count !== null && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    active === f.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>{f.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Events List */}
      <section className="py-8 md:py-16 bg-surface min-h-[60vh]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered !== null ? (
            /* Single filtered list — Upcoming or Past */
            filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400 text-sm">No events found.</div>
            ) : (
              <EventList events={filtered} />
            )
          ) : (
            /* All — grouped sections */
            <div className="space-y-8">
              {upcomingEvents.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <h3 className="font-display font-bold text-sm uppercase tracking-widest text-green-600">Upcoming</h3>
                    <div className="h-px flex-1 bg-green-200" />
                  </div>
                  <EventList events={upcomingEvents} />
                </div>
              )}
              {pastEvents.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    <h3 className="font-display font-bold text-sm uppercase tracking-widest text-gray-400">Past Events</h3>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>
                  <EventList events={pastEvents} />
                </div>
              )}
              {upcomingEvents.length === 0 && pastEvents.length === 0 && (
                <div className="text-center py-20 text-gray-400 text-sm">No events yet.</div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
