import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { turso } from '../../lib/turso'

const CATEGORIES = [
  { id: 'pre-season',   label: 'Pre-Season Meetup',    icon: '🏏' },
  { id: 'jersey',       label: 'Jersey Curtain Raiser', icon: '👕' },
  { id: 'championship', label: 'Championship Meetup',   icon: '🏆' },
  { id: 'social',       label: 'Social / Other',        icon: '🎉' },
]

const CAT_META = {
  'pre-season':   { label: 'Pre-Season',   cls: 'bg-blue-100 text-blue-800',       icon: '🏏' },
  'jersey':       { label: 'Jersey',       cls: 'bg-accent/20 text-yellow-800',     icon: '👕' },
  'championship': { label: 'Championship', cls: 'bg-green-100 text-green-800',      icon: '🏆' },
  'social':       { label: 'Social',       cls: 'bg-purple-100 text-purple-800',    icon: '🎉' },
}

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const EMPTY = {
  title: '', slug: '', description: '', type: 'social',
  date: '', time: '', venue: '', venue_address: '',
  cover_image_url: '', status: 'upcoming', category: 'social',
}

export default function ClubhouseEventsTab() {
  const [events, setEvents]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const titleRef = useRef(null)

  const load = () => {
    setLoading(true)
    turso
      .execute('SELECT * FROM events ORDER BY date ASC')
      .then(({ rows }) => setEvents(rows))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (showForm && titleRef.current) titleRef.current.focus() }, [showForm])

  const filtered = events.filter((e) => {
    if (filterStatus !== 'all' && e.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      return e.title?.toLowerCase().includes(q) || e.venue?.toLowerCase().includes(q)
    }
    return true
  })

  function openAdd()  { setEditItem(null); setForm(EMPTY); setShowForm(true) }
  function openEdit(e) {
    setEditItem(e)
    setForm({
      title:           e.title           ?? '',
      slug:            e.slug            ?? '',
      description:     e.description     ?? '',
      type:            e.type            ?? 'social',
      date:            e.date            ?? '',
      time:            e.time            ?? '',
      venue:           e.venue           ?? '',
      venue_address:   e.venue_address   ?? '',
      cover_image_url: e.cover_image_url ?? '',
      status:          e.status          ?? 'upcoming',
      category:        e.category        ?? 'social',
    })
    setShowForm(true)
  }
  function closeForm() { setShowForm(false); setEditItem(null); setForm(EMPTY) }

  function handleTitleChange(val) {
    setForm((f) => ({ ...f, title: val, slug: editItem ? f.slug : slugify(val) }))
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    const now = new Date().toISOString()
    try {
      if (editItem) {
        await turso.execute({
          sql: `UPDATE events
                SET title=?, slug=?, description=?, type=?, date=?, time=?,
                    venue=?, venue_address=?, cover_image_url=?, status=?, category=?, updated_at=?
                WHERE id=?`,
          args: [
            form.title, form.slug, form.description, form.category, form.date, form.time,
            form.venue, form.venue_address, form.cover_image_url, form.status, form.category, now,
            editItem.id,
          ],
        })
      } else {
        await turso.execute({
          sql: `INSERT INTO events
                  (title, slug, description, type, date, time, venue, venue_address,
                   cover_image_url, status, category, created_at, updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          args: [
            form.title, form.slug, form.description, form.category, form.date, form.time,
            form.venue, form.venue_address, form.cover_image_url, form.status, form.category,
            now, now,
          ],
        })
      }
      load()
      closeForm()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this event? This cannot be undone.')) return
    setDeletingId(id)
    await turso.execute({ sql: 'DELETE FROM events WHERE id=?', args: [id] })
    setEvents((prev) => prev.filter((e) => e.id !== id))
    setDeletingId(null)
  }

  async function toggleStatus(e) {
    setTogglingId(e.id)
    const newStatus = e.status === 'upcoming' ? 'past' : 'upcoming'
    const now = new Date().toISOString()
    await turso.execute({
      sql:  'UPDATE events SET status=?, updated_at=? WHERE id=?',
      args: [newStatus, now, e.id],
    })
    setEvents((prev) => prev.map((x) => (x.id === e.id ? { ...x, status: newStatus } : x)))
    setTogglingId(null)
  }

  const stats = {
    total:    events.length,
    upcoming: events.filter((e) => e.status === 'upcoming').length,
    past:     events.filter((e) => e.status === 'past').length,
  }

  return (
    <div>
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Events', value: stats.total,    cls: 'border-gray-300'  },
          { label: 'Upcoming',     value: stats.upcoming, cls: 'border-green-400' },
          { label: 'Past',         value: stats.past,     cls: 'border-gray-400'  },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-xl border-l-4 ${s.cls} px-4 py-3 shadow-sm`}>
            <div className="text-2xl font-display font-bold text-primary-dark">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events…"
          className="flex-1 min-w-[160px] px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
        </select>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-primary-dark text-accent px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary transition-colors"
        >
          + Add Event
        </button>
      </div>

      {/* Event list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No events found.</div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((e) => {
            const meta = CAT_META[e.category] ?? CAT_META['social']
            return (
              <motion.div
                key={e.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-200 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 hover:border-primary/30 transition-colors shadow-sm"
              >
                {/* Category icon */}
                <div className="text-2xl flex-shrink-0 hidden sm:block">{meta.icon}</div>

                {/* Left meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        e.status === 'upcoming'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {e.status === 'upcoming' ? '● Upcoming' : '✓ Past'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.cls}`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="font-semibold text-gray-800 text-sm leading-snug truncate">{e.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-2">
                    {e.date && (
                      <span>
                        📅{' '}
                        {new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                    )}
                    {e.time     && <span>🕐 {e.time}</span>}
                    {e.venue    && <span>📍 {e.venue}</span>}
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleStatus(e)}
                    disabled={togglingId === e.id}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                      e.status === 'upcoming'
                        ? 'border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100'
                        : 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                    }`}
                  >
                    {togglingId === e.id ? '…' : e.status === 'upcoming' ? 'Mark Past' : 'Mark Upcoming'}
                  </button>
                  <button
                    onClick={() => openEdit(e)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(e.id)}
                    disabled={deletingId === e.id}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 transition-colors"
                  >
                    {deletingId === e.id ? '…' : '✕'}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Slide-over drawer */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={closeForm}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 bg-primary-dark border-b border-white/10 flex-shrink-0">
                <div>
                  <h3 className="font-display font-bold text-white text-lg leading-none">
                    {editItem ? 'Edit Event' : 'New Event'}
                  </h3>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {editItem ? 'Update event details' : 'Create a new club event'}
                  </p>
                </div>
                <button
                  onClick={closeForm}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    ref={titleRef}
                    type="text"
                    value={form.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Event title"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Slug</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder="Event description"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>

                {/* Date + Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Date</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Time</label>
                    <input
                      type="text"
                      value={form.time}
                      onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                      placeholder="e.g. 6:00 PM"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                {/* Venue */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Venue Name</label>
                  <input
                    type="text"
                    value={form.venue}
                    onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                    placeholder="Venue name"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Venue Address</label>
                  <input
                    type="text"
                    value={form.venue_address}
                    onChange={(e) => setForm((f) => ({ ...f, venue_address: e.target.value }))}
                    placeholder="Full address"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Cover image */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Cover Image URL</label>
                  {form.cover_image_url && (
                    <div className="mb-2 h-28 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                      <img
                        src={form.cover_image_url}
                        alt="preview"
                        className="w-full h-full object-cover"
                        onError={(e) => (e.target.style.display = 'none')}
                      />
                    </div>
                  )}
                  <input
                    type="text"
                    value={form.cover_image_url}
                    onChange={(e) => setForm((f) => ({ ...f, cover_image_url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Status</label>
                  <div className="flex rounded-lg overflow-hidden border border-gray-200">
                    {['upcoming', 'past'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, status: s }))}
                        className={`flex-1 py-2.5 text-xs font-semibold transition-colors capitalize ${
                          form.status === s
                            ? 'bg-primary-dark text-accent'
                            : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, category: c.id, type: c.id }))}
                        className={`flex items-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                          form.category === c.id
                            ? 'bg-primary-dark text-accent border-primary-dark'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span>{c.icon}</span>
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
                <button
                  onClick={closeForm}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.title.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-primary-dark text-accent text-sm font-semibold hover:bg-primary transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
