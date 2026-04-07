import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { turso } from '../../lib/turso'
import { useAuth } from '../../contexts/AuthContext'

const TROPHY_TAGS = new Set(['trophy', 'trophies', 'honours', 'award', 'winners', 'champion', 'champions'])
const isTrophy = (tags) => Array.isArray(tags) && tags.some((t) => TROPHY_TAGS.has(t.toLowerCase()))

/** Convert a Google Drive sharing link to a direct embeddable URL */
function convertDriveUrl(url) {
  if (!url) return url
  // Already a lh3 or thumbnail URL — extract ID and re-normalise
  const lh3Match = url.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/)
  if (lh3Match) return `https://drive.google.com/thumbnail?id=${lh3Match[1]}&sz=w1600`
  // uc?export=view format
  const ucMatch = url.match(/drive\.google\.com\/uc\?.*[?&]id=([a-zA-Z0-9_-]+)/)
  if (ucMatch) return `https://drive.google.com/thumbnail?id=${ucMatch[1]}&sz=w1600`
  // Standard sharing link: /file/d/FILE_ID/view
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w1600`
  // Other Drive URL with ?id= param
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idMatch && url.includes('drive.google.com')) return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1600`
  return url
}

const EMPTY = {
  title: '', description: '', image_url: '', thumb_url: '',
  tags: '', match_date: '', uploaded_by: '',
}

export default function ClubhouseGalleryTab() {
  const { profile }             = useAuth()
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const titleRef = useRef(null)

  const load = () => {
    setLoading(true)
    turso
      .execute('SELECT * FROM gallery ORDER BY created_at DESC')
      .then(({ rows }) =>
        setItems(
          rows.map((r) => ({
            ...r,
            tags: r.tags ? JSON.parse(r.tags) : [],
          }))
        )
      )
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (showForm && titleRef.current) titleRef.current.focus() }, [showForm])

  const filtered = items.filter((g) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      g.title?.toLowerCase().includes(q) ||
      g.description?.toLowerCase().includes(q) ||
      (Array.isArray(g.tags) && g.tags.some((t) => t.toLowerCase().includes(q)))
    )
  })

  function openAdd() {
    setEditItem(null)
    setForm({ ...EMPTY, uploaded_by: profile?.full_name ?? '' })
    setShowForm(true)
  }

  function openEdit(g) {
    setEditItem(g)
    setForm({
      title:       g.title       ?? '',
      description: g.description ?? '',
      image_url:   g.image_url   ?? '',
      thumb_url:   g.thumb_url   ?? '',
      tags:        Array.isArray(g.tags) ? g.tags.join(', ') : '',
      match_date:  g.match_date  ?? '',
      uploaded_by: g.uploaded_by ?? '',
    })
    setShowForm(true)
  }

  function closeForm() { setShowForm(false); setEditItem(null); setForm(EMPTY) }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    const tagsJson = JSON.stringify(
      form.tags.split(',').map((t) => t.trim()).filter(Boolean)
    )
    const now = new Date().toISOString()
    try {
      if (editItem) {
        await turso.execute({
          sql: `UPDATE gallery
                SET title=?, description=?, image_url=?, thumb_url=?,
                    tags=?, match_date=?, uploaded_by=?
                WHERE id=?`,
          args: [
            form.title, form.description, form.image_url, form.thumb_url,
            tagsJson, form.match_date, form.uploaded_by, editItem.id,
          ],
        })
      } else {
        await turso.execute({
          sql: `INSERT INTO gallery
                  (title, description, image_url, thumb_url, tags, match_date, uploaded_by, created_at)
                VALUES (?,?,?,?,?,?,?,?)`,
          args: [
            form.title, form.description, form.image_url, form.thumb_url,
            tagsJson, form.match_date, form.uploaded_by, now,
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
    if (!confirm('Delete this photo? This cannot be undone.')) return
    setDeletingId(id)
    await turso.execute({ sql: 'DELETE FROM gallery WHERE id=?', args: [id] })
    setItems((prev) => prev.filter((g) => g.id !== id))
    setDeletingId(null)
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="bg-white rounded-xl border-l-4 border-accent px-4 py-3 shadow-sm flex-shrink-0">
          <div className="text-2xl font-display font-bold text-primary-dark">{items.length}</div>
          <div className="text-xs text-gray-500">Total Photos</div>
        </div>
        <div className="flex gap-2">
          <div className="bg-amber-50 rounded-xl border-l-4 border-amber-400 px-3 py-2 flex-shrink-0">
            <div className="text-lg font-display font-bold text-amber-700">{items.filter((g) => isTrophy(g.tags)).length}</div>
            <div className="text-[10px] text-amber-500">🏆 Trophies</div>
          </div>
          <div className="bg-blue-50 rounded-xl border-l-4 border-blue-400 px-3 py-2 flex-shrink-0">
            <div className="text-lg font-display font-bold text-blue-700">{items.filter((g) => !isTrophy(g.tags)).length}</div>
            <div className="text-[10px] text-blue-500">📸 Moments</div>
          </div>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search gallery…"
          className="flex-1 min-w-[160px] px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-primary-dark text-accent px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary transition-colors"
        >
          + Add Photo
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🖼️</div>
          <p className="font-medium text-gray-500 mb-1">No photos yet</p>
          <p className="text-sm">Add your first photo to the gallery.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((g, i) => (
            <motion.div
              key={g.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="group relative bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all"
            >
              {/* Thumbnail */}
              <div
                className="aspect-square cursor-pointer overflow-hidden bg-gradient-to-br from-primary-dark to-primary"
                onClick={() => setLightbox(g)}
              >
                {g.image_url ? (
                  <img
                    src={g.thumb_url || g.image_url}
                    alt={g.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-display text-accent/30 text-4xl font-bold">NCB</span>
                  </div>
                )}
              </div>

              {/* Card info */}
              <div className="p-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    isTrophy(g.tags) ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-500'
                  }`}>
                    {isTrophy(g.tags) ? '🏆 Trophy' : '📸 Moment'}
                  </span>
                </div>
                <div className="text-xs font-semibold text-gray-700 truncate">{g.title}</div>
                {g.match_date && (
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(g.match_date + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </div>
                )}
                {Array.isArray(g.tags) && g.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {g.tags.slice(0, 2).map((t) => (
                      <span key={t} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Hover action buttons */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(g)}
                  className="w-7 h-7 rounded-lg bg-white/95 shadow text-primary text-xs font-bold hover:bg-white transition-colors flex items-center justify-center"
                  title="Edit"
                >
                  ✎
                </button>
                <button
                  onClick={() => handleDelete(g.id)}
                  disabled={deletingId === g.id}
                  className="w-7 h-7 rounded-lg bg-white/95 shadow text-red-400 text-xs font-bold hover:bg-white transition-colors flex items-center justify-center"
                  title="Delete"
                >
                  {deletingId === g.id ? '…' : '✕'}
                </button>
              </div>

              {/* Expand hint */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/40 rounded-lg px-2 py-1 text-white text-[10px] font-semibold -mt-6">
                  Click to expand
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative max-w-3xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {lightbox.image_url ? (
                <img
                  src={lightbox.image_url}
                  alt={lightbox.title}
                  className="w-full rounded-2xl max-h-[78vh] object-contain shadow-2xl"
                />
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-primary-dark to-primary rounded-2xl flex items-center justify-center">
                  <span className="font-display text-accent/30 text-6xl font-bold">NCB</span>
                </div>
              )}
              <div className="mt-3 text-white px-1">
                <div className="font-semibold text-lg">{lightbox.title}</div>
                {lightbox.description && (
                  <div className="text-sm text-gray-300 mt-1">{lightbox.description}</div>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {lightbox.match_date && (
                    <span className="text-xs text-gray-400">
                      📅{' '}
                      {new Date(lightbox.match_date + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  )}
                  {lightbox.uploaded_by && (
                    <span className="text-xs text-gray-400">📷 {lightbox.uploaded_by}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setLightbox(null)}
                className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white text-gray-700 font-bold shadow-lg hover:bg-gray-100 transition-colors flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 bg-primary-dark border-b border-white/10 flex-shrink-0">
                <div>
                  <h3 className="font-display font-bold text-white text-lg leading-none">
                    {editItem ? 'Edit Photo' : 'Add Photo'}
                  </h3>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {editItem ? 'Update photo details' : 'Add a new photo to the gallery'}
                  </p>
                </div>
                <button
                  onClick={closeForm}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Drawer body */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                {/* Image preview */}
                {form.image_url && (
                  <div className="rounded-xl overflow-hidden border border-gray-200 h-44 bg-gray-50">
                    <img
                      src={form.thumb_url || form.image_url}
                      alt="preview"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.target.style.display = 'none')}
                    />
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    ref={titleRef}
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Photo title"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Image URL</label>
                  <input
                    type="text"
                    value={form.image_url}
                    onChange={(e) => setForm((f) => ({ ...f, image_url: convertDriveUrl(e.target.value) }))}
                    placeholder="https://... or Google Drive share link"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Google Drive links are auto-converted. Make sure the file is shared as <em>Anyone with the link</em>.
                  </p>
                </div>

                {/* Thumbnail URL */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Thumbnail URL
                    <span className="ml-1 text-gray-400 normal-case font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.thumb_url}
                    onChange={(e) => setForm((f) => ({ ...f, thumb_url: convertDriveUrl(e.target.value) }))}
                    placeholder="Smaller/compressed version or Drive link"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Caption / Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    placeholder="Caption or description"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>

                {/* Match Date + Uploaded By */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Match Date</label>
                    <input
                      type="date"
                      value={form.match_date}
                      onChange={(e) => setForm((f) => ({ ...f, match_date: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Uploaded By</label>
                    <input
                      type="text"
                      value={form.uploaded_by}
                      onChange={(e) => setForm((f) => ({ ...f, uploaded_by: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Tags
                    <span className="ml-1 text-gray-400 normal-case font-normal">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                    placeholder="Match, Raising Bulls, 2026"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    💡 Use <span className="font-semibold text-amber-600">trophy</span>, <span className="font-semibold text-amber-600">champion</span> or <span className="font-semibold text-amber-600">winners</span> to show in the Trophy Cabinet section of the public gallery.
                  </p>
                  {form.tags && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.tags
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .map((t) => (
                          <span key={t} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            TROPHY_TAGS.has(t.toLowerCase()) ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {TROPHY_TAGS.has(t.toLowerCase()) ? '🏆 ' : ''}{t}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer footer */}
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
                  {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add to Gallery'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
