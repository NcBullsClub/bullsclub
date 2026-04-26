import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { turso } from '../../lib/turso'
import { useAuth } from '../../contexts/AuthContext'
import CloudinaryUpload from '../../components/ui/CloudinaryUpload'

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
  // Cloudinary URLs - keep as is
  if (url.includes('cloudinary.com')) return url
  // Already a direct URL
  return url
}

const SYSTEM_TAGS = new Set(['_public'])

const EMPTY = {
  title: '', description: '', image_url: '', thumb_url: '', video_url: '',
  tags: '', match_date: '', uploaded_by: '', show_in_gallery: false,
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
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const [mediaType, setMediaType] = useState('photo') // 'photo' | 'video'
  const [imageErrors, setImageErrors] = useState({}) // Track broken images
  const titleRef = useRef(null)

  const load = () => {
    setLoading(true)
    turso
      .execute('SELECT * FROM gallery ORDER BY created_at DESC')
      .then(({ rows }) =>
        setItems(
          rows.map((r) => ({
            ...r,
            image_url: r.image_url ? convertDriveUrl(r.image_url) : r.image_url,
            thumb_url: r.thumb_url ? convertDriveUrl(r.thumb_url) : r.thumb_url,
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

  function openAdd(type = 'photo') {
    setMediaType(type)
    setEditItem(null)
    setForm({ ...EMPTY, uploaded_by: profile?.full_name ?? '' })
    setShowForm(true)
  }

  function openEdit(g) {
    setMediaType(g.video_url && !g.image_url ? 'video' : 'photo')
    setEditItem(g)
    setForm({
      title:           g.title       ?? '',
      description:     g.description ?? '',
      image_url:       g.image_url   ?? '',
      thumb_url:       g.thumb_url   ?? '',
      video_url:       g.video_url   ?? '',
      tags:            Array.isArray(g.tags) ? g.tags.filter((t) => !SYSTEM_TAGS.has(t)).join(', ') : '',
      match_date:      g.match_date  ?? '',
      uploaded_by:     g.uploaded_by ?? '',
      show_in_gallery: Array.isArray(g.tags) && g.tags.includes('_public'),
    })
    setShowForm(true)
  }

  function closeForm() { setShowForm(false); setEditItem(null); setForm(EMPTY); setMediaType('photo') }

  async function handleSave() {
    if (!form.title.trim()) return
    if (mediaType === 'video' && !form.video_url.trim()) return
    setSaving(true)
    // Route fields by type so videos never end up in the photo grid
    const imageUrl = mediaType === 'video' ? '' : form.image_url
    const thumbUrl = mediaType === 'video' ? '' : form.thumb_url
    const videoUrl = mediaType === 'photo' ? '' : form.video_url
    const userTags = mediaType === 'photo'
      ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : []
    const allTags = form.show_in_gallery ? [...userTags, '_public'] : userTags
    const tagsJson = JSON.stringify(allTags)
    const now = new Date().toISOString()
    try {
      if (editItem) {
        await turso.execute({
          sql: `UPDATE gallery
                SET title=?, description=?, image_url=?, thumb_url=?, video_url=?,
                    tags=?, match_date=?, uploaded_by=?
                WHERE id=?`,
          args: [
            form.title, form.description, imageUrl, thumbUrl, videoUrl,
            tagsJson, form.match_date, form.uploaded_by, editItem.id,
          ],
        })
      } else {
        await turso.execute({
          sql: `INSERT INTO gallery
                  (title, description, image_url, thumb_url, video_url, tags, match_date, uploaded_by, created_at)
                VALUES (?,?,?,?,?,?,?,?,?)`,
          args: [
            form.title, form.description, imageUrl, thumbUrl, videoUrl,
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
    setDeletingId(id)
    await turso.execute({ sql: 'DELETE FROM gallery WHERE id=?', args: [id] })
    setItems((prev) => prev.filter((g) => g.id !== id))
    setDeletingId(null)
    setConfirmDeleteId(null)
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3 sm:p-4 mb-4 sm:mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-primary-dark text-base sm:text-lg">Gallery Manager</h3>
          <span className="text-[10px] sm:text-xs font-semibold bg-primary-dark/10 text-primary-dark px-2 py-1 rounded-full">
            {filtered.length} shown
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-2 py-2">
            <div className="text-lg sm:text-xl leading-none font-display font-bold text-primary-dark">{items.length}</div>
            <div className="text-[10px] text-gray-500 mt-1">Photos</div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-2 py-2">
            <div className="text-sm sm:text-lg leading-none font-display font-bold text-amber-700">{items.filter((g) => isTrophy(g.tags)).length}</div>
            <div className="text-[10px] text-amber-600 mt-1">🏆 Trophy</div>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-2 py-2">
            <div className="text-sm sm:text-lg leading-none font-display font-bold text-blue-700">{items.filter((g) => !!g.image_url && !isTrophy(g.tags)).length}</div>
            <div className="text-[10px] text-blue-600 mt-1">📸 Moments</div>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 px-2 py-2">
            <div className="text-sm sm:text-lg leading-none font-display font-bold text-red-600">{items.filter((g) => g.video_url && !g.image_url).length}</div>
            <div className="text-[10px] text-red-500 mt-1">🎬 Videos</div>
          </div>
        </div>

        {/* Search + Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, caption, or tags"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openAdd('photo')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-primary-dark text-accent px-3 py-2 rounded-xl text-sm font-semibold hover:bg-primary transition-colors"
            >
              <span>📸</span>
              <span>Add Photo</span>
            </button>
            <button
              onClick={() => openAdd('video')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-red-600 text-white px-3 py-2 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
            >
              <span>🎬</span>
              <span>Add Video</span>
            </button>
          </div>
        </div>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((g, i) => (
            <motion.div
              key={g.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="group relative bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              {/* Thumbnail */}
              <div
                className="aspect-square cursor-pointer overflow-hidden bg-gradient-to-br from-primary-dark to-primary relative group/thumb"
                onClick={() => setLightbox(g)}
              >
                {g.image_url ? (
                  <>
                    <img
                      src={convertDriveUrl(g.thumb_url || g.image_url)}
                      alt={g.title}
                      className={`w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300 ${imageErrors[g.id] ? 'hidden' : ''}`}
                      onError={(e) => {
                        setImageErrors((prev) => ({ ...prev, [g.id]: true }))
                        console.warn(`Failed to load image: ${convertDriveUrl(g.thumb_url || g.image_url)}`)
                      }}
                    />
                    {imageErrors[g.id] && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 text-white p-2">
                        <div className="text-2xl mb-1">⚠️</div>
                        <p className="text-[10px] font-semibold text-center leading-tight mb-1">Image not accessible</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openEdit(g)
                          }}
                          className="text-[9px] text-blue-300 hover:text-blue-100 underline"
                        >
                          Fix URL
                        </button>
                      </div>
                    )}
                  </>
                ) : g.video_url ? (
                  (() => {
                    const ytMatch = g.video_url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/)
                    const thumb = ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg` : null
                    return (
                      <div className="relative w-full h-full">
                        {thumb ? (
                          <img src={thumb} alt={g.title} className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-900">
                            <span className="text-3xl">▶️</span>
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          </div>
                        </div>
                      </div>
                    )
                  })()
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-display text-accent/30 text-4xl font-bold">NCB</span>
                  </div>
                )}

              </div>

              {/* Card info */}
              <div className="p-3">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    g.video_url && !g.image_url ? 'bg-red-50 text-red-500' : isTrophy(g.tags) ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-500'
                  }`}>
                    {g.video_url && !g.image_url ? '🎬 Video' : isTrophy(g.tags) ? '🏆 Trophy' : '📸 Moment'}
                  </span>
                  {/* Public / Internal badge */}
                  {Array.isArray(g.tags) && g.tags.includes('_public') ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-600 flex-shrink-0">🌐 Public</span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 flex-shrink-0">🔒 Internal</span>
                  )}
                </div>
                <div className="text-xs font-semibold text-gray-700 truncate">{g.title}</div>
                {g.match_date && (
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(g.match_date + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </div>
                )}
                {Array.isArray(g.tags) && g.tags.filter((t) => !SYSTEM_TAGS.has(t)).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {g.tags.filter((t) => !SYSTEM_TAGS.has(t)).slice(0, 2).map((t) => (
                      <span key={t} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Hover action buttons / delete confirm overlay */}
              <AnimatePresence>
                {confirmDeleteId === g.id ? (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-2 px-3 z-10"
                  >
                    <p className="text-white text-xs font-semibold text-center leading-snug">
                      Delete this {g.video_url && !g.image_url ? 'video' : 'photo'}?
                    </p>
                    <p className="text-gray-400 text-[10px] text-center">This cannot be undone.</p>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => handleDelete(g.id)}
                        disabled={deletingId === g.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                      >
                        {deletingId === g.id
                          ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : 'Yes, delete'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/20 text-white hover:bg-white/30 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="actions"
                    className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  >
                    <button
                      onClick={() => openEdit(g)}
                      className="w-7 h-7 rounded-lg bg-white/95 shadow text-primary text-xs font-bold hover:bg-white transition-colors flex items-center justify-center"
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(g.id)}
                      className="w-7 h-7 rounded-lg bg-white/95 shadow text-red-400 text-xs font-bold hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Expand hint */}
              <div className="absolute inset-0 pointer-events-none hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
                  src={convertDriveUrl(lightbox.image_url)}
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
              <div className={`flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0 ${
                mediaType === 'video' ? 'bg-red-700' : 'bg-primary-dark'
              }`}>
                <div>
                  <h3 className="font-display font-bold text-white text-lg leading-none">
                    {editItem
                      ? (mediaType === 'video' ? 'Edit Video' : 'Edit Photo')
                      : (mediaType === 'video' ? 'Add Video' : 'Add Photo')}
                  </h3>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {editItem ? 'Update media details' : (mediaType === 'video' ? 'Add a YouTube video to Featured Videos' : 'Add a new photo to the gallery')}
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

                {/* ── Media type toggle (only when adding new) ── */}
                {!editItem && (
                  <div className="flex rounded-xl overflow-hidden border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setMediaType('photo')}
                      className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        mediaType === 'photo' ? 'bg-primary-dark text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      📸 Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaType('video')}
                      className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        mediaType === 'video' ? 'bg-red-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      🎬 Video
                    </button>
                  </div>
                )}

                {/* Image preview (photo only) */}
                {mediaType === 'photo' && form.image_url && (
                  <div className="rounded-xl overflow-hidden border border-gray-200 h-44 bg-gray-50">
                    <img
                      src={convertDriveUrl(form.thumb_url || form.image_url)}
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

                {/* ── PHOTO fields ── */}
                {mediaType === 'photo' && (
                  <>
                    {/* Cloudinary Upload */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2.5 uppercase tracking-wide">
                        Upload Image to Cloudinary
                      </label>
                      <CloudinaryUpload
                        onUploadSuccess={(uploadedData) => {
                          setForm((f) => ({
                            ...f,
                            image_url: uploadedData.secure_url,
                            thumb_url: uploadedData.thumb_url,
                          }))
                        }}
                        onUploadError={(error) => {
                          alert(`Upload failed: ${error}`)
                        }}
                        disabled={saving}
                      />
                    </div>

                    <div className="flex items-center gap-2 py-2">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs text-gray-400 font-medium">OR</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>

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
                  </>
                )}

                {/* ── VIDEO fields ── */}
                {mediaType === 'video' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      YouTube URL <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.video_url}
                      onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                    {form.video_url && (() => {
                      const ytMatch = form.video_url.match(/(?:youtu\.be\/|v=|embed\/)([\.\w-]{11})/)
                      const thumb = ytMatch?.[1] ? `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg` : null
                      return thumb ? (
                        <div className="mt-2 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 relative">
                          <img src={thumb} alt="YouTube thumbnail" className="w-full h-32 object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                              <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-amber-600 mt-1">⚠️ Paste a full YouTube URL to see a preview</p>
                      )
                    })()}
                    <p className="text-[10px] text-gray-400 mt-1.5">
                      This will appear in the <span className="font-semibold text-gray-600">🎬 Featured Videos</span> section of the public gallery.
                    </p>
                  </div>
                )}

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
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                      </span>
                      <input
                        type="date"
                        value={form.match_date}
                        onChange={(e) => setForm((f) => ({ ...f, match_date: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg pl-8 pr-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
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

                {/* Public Gallery Toggle */}
                <div className={`rounded-xl p-3 border-2 transition-colors ${form.show_in_gallery ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, show_in_gallery: !f.show_in_gallery }))}
                    className="w-full flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{form.show_in_gallery ? '🌐' : '🔒'}</span>
                      <div className="text-left">
                        <p className={`text-xs font-bold ${form.show_in_gallery ? 'text-green-700' : 'text-gray-600'}`}>
                          {form.show_in_gallery ? 'Visible in Public Gallery' : 'Internal Only'}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {form.show_in_gallery ? 'Fans can see this on the Gallery page.' : 'Only admins can see this. Toggle to make public.'}
                        </p>
                      </div>
                    </div>
                    {/* Toggle pill */}
                    <div className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${form.show_in_gallery ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.show_in_gallery ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </button>
                </div>

                {/* Tags — photo only */}
                {mediaType === 'photo' && (
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
                )}
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
                  {saving ? 'Saving…' : editItem ? 'Save Changes' : mediaType === 'video' ? 'Add to Featured Videos' : 'Add to Gallery'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
