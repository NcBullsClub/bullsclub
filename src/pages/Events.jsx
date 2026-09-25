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

function eventSlug(title) {
  return String(title || 'event')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function EventList({ events, onShare, copiedId }) {
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
        const venueText = [event.venue, event.venue_address].filter(Boolean).join(', ')
        const mapsUrl = venueText
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueText)}`
          : null

        return (
          <motion.div
            key={event.id}
            id={`event-${eventSlug(event.title)}`}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className={`bg-white rounded-2xl border-l-4 ${meta.border} shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row gap-3 sm:gap-5 ${
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

              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-x-5 sm:gap-y-1 text-xs sm:text-sm text-gray-500 mb-3">
                <span className="sm:hidden">📅 {dateShort} · 🕐 {event.time}</span>
                <span className="hidden sm:inline">📅 {dateFull}</span>
                <span className="hidden sm:inline">🕐 {event.time}</span>
                <div className="grid grid-cols-2 gap-2 sm:contents">
                  {event.venue && (
                    <span className={!event.venue_address ? 'col-span-2' : ''}>📍 {event.venue}</span>
                  )}
                  {event.venue_address && <span className="text-gray-400 break-words">{event.venue_address}</span>}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg px-3 py-2 transition-colors"
                  >
                    <span aria-hidden="true">📍</span>
                    Open in Maps
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => onShare(event)}
                  className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark border border-primary/20 hover:border-primary/40 rounded-lg px-3 py-2 transition-colors"
                >
                  <span aria-hidden="true">↗</span>
                  {copiedId === event.id ? 'Link copied' : 'Share event'}
                </button>
              </div>

              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{event.description}</p>

              {(event.timeline_items?.length > 0 || event.food_items?.length > 0) && (
                <div className="grid gap-4 sm:grid-cols-2 mt-4 pt-4 border-t border-gray-100">
                  {event.timeline_items?.length > 0 && (
                    <div>
                      <h3 className="font-display font-bold text-primary text-xs uppercase tracking-wider mb-2">Meetup Timeline</h3>
                      <div className="space-y-2">
                        {event.timeline_items.map((item, itemIndex) => (
                          <div key={`${event.id}-timeline-${itemIndex}`} className="flex gap-2 text-xs sm:text-sm">
                            <span className="font-semibold text-primary-dark min-w-[4.25rem]">{item.time}</span>
                            <div>
                              <div className="font-semibold text-gray-700">{item.title}</div>
                              {item.details && <div className="text-gray-500">{item.details}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {event.food_items?.length > 0 && (
                    <div>
                      <h3 className="font-display font-bold text-primary text-xs uppercase tracking-wider mb-2">Food For Guests</h3>
                      <ul className="space-y-1.5 text-xs sm:text-sm text-gray-600">
                        {event.food_items.map((item, itemIndex) => (
                          <li key={`${event.id}-food-${itemIndex}`} className="flex gap-2">
                            <span className="text-accent">•</span>
                            <span><strong className="text-gray-700">{item.name}</strong>{item.details ? ` — ${item.details}` : ''}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
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
  const [copiedId, setCopiedId] = useState(null)

  async function shareEvent(event) {
    const url = `${window.location.origin}/events#event-${eventSlug(event.title)}`
    const shareData = { url }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch (error) {
        if (error.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(event.id)
      window.setTimeout(() => setCopiedId(null), 2200)
    } catch (error) {
      window.prompt('Copy this event link:', url)
    }
  }

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
              <EventList events={filtered} onShare={shareEvent} copiedId={copiedId} />
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
                  <EventList events={upcomingEvents} onShare={shareEvent} copiedId={copiedId} />
                </div>
              )}
              {pastEvents.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    <h3 className="font-display font-bold text-sm uppercase tracking-widest text-gray-400">Past Events</h3>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>
                  <EventList events={pastEvents} onShare={shareEvent} copiedId={copiedId} />
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
