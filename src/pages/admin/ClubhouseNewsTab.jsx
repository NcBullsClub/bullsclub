import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { turso } from '../../lib/turso'

const TEAMS = [
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls',   label: 'Royal Bulls'   },
  { id: 'both',          label: 'Both Teams'    },
]

const CATEGORIES = [
  { id: 'match-report', label: 'Match Report'  },
  { id: 'announcement', label: 'Announcement'  },
]

const TEAM_META = {
  'raising-bulls': { label: 'Raising Bulls', cls: 'bg-accent/20 text-primary-dark'   },
  'royal-bulls':   { label: 'Royal Bulls',   cls: 'bg-primary/10 text-primary'        },
  'both':          { label: 'Both',          cls: 'bg-purple-100 text-purple-700'     },
}

const CAT_META = {
  'match-report': { label: 'Match Report', cls: 'bg-green-100 text-green-700' },
  'announcement': { label: 'Announcement', cls: 'bg-blue-100 text-blue-700'   },
}

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const EMPTY = {
  title: '', slug: '', summary: '', content: '',
  cover_image_url: '', author: 'NCB Admin',
  status: 'draft', published_at: '',
  tags: '', team: 'both', category: 'announcement',
}

export default function ClubhouseNewsTab() {
  const [articles, setArticles]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterTeam, setFilterTeam]     = useState('all')
  const [showForm, setShowForm]   = useState(false)
  const [editItem, setEditItem]   = useState(null)
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const titleRef = useRef(null)

  const load = () => {
    setLoading(true)
    turso
      .execute('SELECT * FROM news ORDER BY published_at DESC, created_at DESC')
      .then(({ rows }) =>
        setArticles(
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

  const filtered = articles.filter((a) => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false
    if (filterTeam !== 'all' && a.team !== filterTeam) return false
    if (search) {
      const q = search.toLowerCase()
      return a.title?.toLowerCase().includes(q) || a.author?.toLowerCase().includes(q)
    }
    return true
  })

  function openAdd() {
    setEditItem(null)
    setForm(EMPTY)
    setShowForm(true)
  }

  function openEdit(a) {
    setEditItem(a)
    setForm({
      title:           a.title           ?? '',
      slug:            a.slug            ?? '',
      summary:         a.summary         ?? '',
      content:         a.content         ?? '',
      cover_image_url: a.cover_image_url ?? '',
      author:          a.author          ?? 'NCB Admin',
      status:          a.status          ?? 'draft',
      published_at:    a.published_at    ? a.published_at.split('T')[0] : '',
      tags:            Array.isArray(a.tags) ? a.tags.join(', ') : '',
      team:            a.team            ?? 'both',
      category:        a.category        ?? 'announcement',
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditItem(null)
    setForm(EMPTY)
  }

  function handleTitleChange(val) {
    setForm((f) => ({
      ...f,
      title: val,
      slug: editItem ? f.slug : slugify(val),
    }))
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    const tagsJson = JSON.stringify(
      form.tags.split(',').map((t) => t.trim()).filter(Boolean)
    )
    const now   = new Date().toISOString()
    const pubAt =
      form.status === 'published'
        ? form.published_at
          ? form.published_at + 'T00:00:00.000Z'
          : now
        : form.published_at
        ? form.published_at + 'T00:00:00.000Z'
        : null
    try {
      if (editItem) {
        await turso.execute({
          sql: `UPDATE news
                SET title=?, slug=?, summary=?, content=?,
                    cover_image_url=?, author=?, status=?, published_at=?,
                    tags=?, team=?, category=?, updated_at=?
                WHERE id=?`,
          args: [
            form.title, form.slug, form.summary, form.content,
            form.cover_image_url, form.author, form.status, pubAt,
            tagsJson, form.team, form.category, now, editItem.id,
          ],
        })
      } else {
        await turso.execute({
          sql: `INSERT INTO news
                  (title, slug, summary, content, cover_image_url, author,
                   status, published_at, tags, team, category, created_at, updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          args: [
            form.title, form.slug, form.summary, form.content,
            form.cover_image_url, form.author, form.status, pubAt,
            tagsJson, form.team, form.category, now, now,
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
    if (!confirm('Delete this article? This cannot be undone.')) return
    setDeletingId(id)
    await turso.execute({ sql: 'DELETE FROM news WHERE id=?', args: [id] })
    setArticles((prev) => prev.filter((a) => a.id !== id))
    setDeletingId(null)
  }

  async function toggleStatus(a) {
    setTogglingId(a.id)
    const newStatus = a.status === 'published' ? 'draft' : 'published'
    const now       = new Date().toISOString()
    const pubAt     = newStatus === 'published' ? now : a.published_at
    await turso.execute({
      sql:  'UPDATE news SET status=?, published_at=?, updated_at=? WHERE id=?',
      args: [newStatus, pubAt, now, a.id],
    })
    setArticles((prev) =>
      prev.map((x) => (x.id === a.id ? { ...x, status: newStatus, published_at: pubAt } : x))
    )
    setTogglingId(null)
  }

  const stats = {
    total:     articles.length,
    published: articles.filter((a) => a.status === 'published').length,
    draft:     articles.filter((a) => a.status === 'draft').length,
  }

  return (
    <div>
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Articles', value: stats.total,     cls: 'border-gray-300'  },
          { label: 'Published',      value: stats.published, cls: 'border-green-400' },
          { label: 'Drafts',         value: stats.draft,     cls: 'border-amber-400' },
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
          placeholder="Search articles…"
          className="flex-1 min-w-[160px] px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All Teams</option>
          <option value="raising-bulls">Raising Bulls</option>
          <option value="royal-bulls">Royal Bulls</option>
          <option value="both">Both</option>
        </select>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-primary-dark text-accent px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary transition-colors"
        >
          + Add Article
        </button>
      </div>

      {/* Article list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No articles found.</div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((a) => (
            <motion.div
              key={a.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 hover:border-primary/30 transition-colors shadow-sm"
            >
              {/* Left meta */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      a.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {a.status === 'published' ? '● Live' : '○ Draft'}
                  </span>
                  {a.category && CAT_META[a.category] && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CAT_META[a.category].cls}`}>
                      {CAT_META[a.category].label}
                    </span>
                  )}
                  {a.team && TEAM_META[a.team] && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TEAM_META[a.team].cls}`}>
                      {TEAM_META[a.team].label}
                    </span>
                  )}
                </div>
                <div className="font-semibold text-gray-800 text-sm leading-snug truncate">{a.title}</div>
                {a.summary && (
                  <div className="text-xs text-gray-400 truncate mt-0.5">{a.summary}</div>
                )}
                <div className="text-[10px] text-gray-400 mt-1 flex flex-wrap gap-1.5">
                  <span>{a.author}</span>
                  <span>·</span>
                  <span>
                    {a.published_at
                      ? new Date(a.published_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })
                      : 'No date'}
                  </span>
                  {a.tags?.length > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-gray-300">{a.tags.slice(0, 3).join(' · ')}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleStatus(a)}
                  disabled={togglingId === a.id}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                    a.status === 'published'
                      ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'
                      : 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                  }`}
                >
                  {togglingId === a.id ? '…' : a.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => openEdit(a)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  disabled={deletingId === a.id}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 transition-colors"
                >
                  {deletingId === a.id ? '…' : '✕'}
                </button>
              </div>
            </motion.div>
          ))}
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
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 bg-primary-dark border-b border-white/10 flex-shrink-0">
                <div>
                  <h3 className="font-display font-bold text-white text-lg leading-none">
                    {editItem ? 'Edit Article' : 'New Article'}
                  </h3>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {editItem ? 'Update article details' : 'Create and publish a new article'}
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
                    placeholder="Article title"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Slug</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    placeholder="auto-generated-from-title"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Summary */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Summary / Excerpt
                  </label>
                  <textarea
                    value={form.summary}
                    onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                    rows={2}
                    placeholder="Short summary shown in article cards"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Content</label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    rows={8}
                    placeholder="Full article content (plain text or HTML)"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                  />
                </div>

                {/* Cover image */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Cover Image URL
                  </label>
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

                {/* Author + Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Author</label>
                    <input
                      type="text"
                      value={form.author}
                      onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Status</label>
                    <div className="flex rounded-lg overflow-hidden border border-gray-200 h-[42px]">
                      {['draft', 'published'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, status: s }))}
                          className={`flex-1 text-xs font-semibold transition-colors capitalize ${
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
                </div>

                {/* Published date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Published Date
                  </label>
                  <input
                    type="date"
                    value={form.published_at}
                    onChange={(e) => setForm((f) => ({ ...f, published_at: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
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
                    placeholder="Match Report, Raising Bulls, Championship"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {form.tags && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.tags
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .map((t) => (
                          <span key={t} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                            {t}
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                {/* Team */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Team</label>
                  <div className="flex gap-2">
                    {TEAMS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, team: t.id }))}
                        className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold border transition-colors ${
                          form.team === t.id
                            ? 'bg-primary-dark text-accent border-primary-dark'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Category</label>
                  <div className="flex gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, category: c.id }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                          form.category === c.id
                            ? 'bg-primary-dark text-accent border-primary-dark'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
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
                  {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Publish Article'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
