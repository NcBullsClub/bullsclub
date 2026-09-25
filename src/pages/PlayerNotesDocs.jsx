import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const CATEGORIES = [
  { id: 'note', label: 'Note', icon: '📝' },
  { id: 'spreadsheet', label: 'Spreadsheet', icon: '📊' },
  { id: 'document', label: 'Document', icon: '📄' },
  { id: 'other', label: 'Other', icon: '🔗' },
]

const EMPTY_FORM = { title: '', body: '', link_url: '', category: 'note' }

function categoryMeta(category) {
  return CATEGORIES.find((item) => item.id === category) || CATEGORIES[0]
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function PlayerNotesDocs() {
  const { user, isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  async function loadItems() {
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from('player_notes_docs')
      .select('*')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })

    if (loadError) {
      console.error('Failed to load player notes and docs:', loadError)
      setError('Notes and docs are not available yet. Please ask an admin to apply the database migration.')
    } else {
      setItems(data || [])
      setError('')
    }
    setLoading(false)
  }

  useEffect(() => { loadItems() }, [])

  const filteredItems = items.filter((item) => {
    if (filter !== 'all' && item.category !== filter) return false
    if (!search.trim()) return true
    const query = search.trim().toLowerCase()
    return [item.title, item.body, item.link_url].some((value) => value?.toLowerCase().includes(query))
  })

  function openAdd() {
    setEditingItem(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  function openEdit(item) {
    if (!isAdmin && item.created_by !== user?.id) return
    setEditingItem(item)
    setForm({
      title: item.title || '',
      body: item.body || '',
      link_url: item.link_url || '',
      category: item.category || 'note',
    })
    setError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingItem(null)
    setForm(EMPTY_FORM)
  }

  async function handleSave(event) {
    event.preventDefault()
    if (!form.title.trim()) return
    if (editingItem && !isAdmin && editingItem.created_by !== user?.id) return
    setSaving(true)
    setError('')

    const payload = {
      title: form.title.trim(),
      body: form.body.trim() || null,
      link_url: form.link_url.trim() || null,
      category: form.category,
    }

    const result = editingItem
      ? await supabase.from('player_notes_docs').update(payload).eq('id', editingItem.id)
      : await supabase.from('player_notes_docs').insert({ ...payload, created_by: user.id })

    if (result.error) {
      console.error('Failed to save player note or doc:', result.error)
      setError(result.error.message || 'Could not save this entry.')
    } else {
      await loadItems()
      closeForm()
    }
    setSaving(false)
  }

  async function handleDelete(item) {
    const canDelete = isAdmin || item.created_by === user?.id
    if (!canDelete) return
    if (!window.confirm(`Delete “${item.title}” from Notes & Docs? This cannot be undone.`)) return
    setDeletingId(item.id)
    const { data: deletedItems, error: deleteError } = await supabase
      .from('player_notes_docs')
      .delete()
      .eq('id', item.id)
      .select('id')
    if (deleteError) {
      console.error('Failed to delete player note or doc:', deleteError)
      setError(deleteError.message || 'Could not delete this entry.')
    } else if (!deletedItems?.length) {
      setError('Could not delete this entry. You may not have permission to remove it.')
    } else {
      setItems((current) => current.filter((entry) => entry.id !== item.id))
    }
    setDeletingId(null)
  }

  return (
    <div className="bg-surface min-h-[calc(100vh-5rem)]">
      <section className="bg-primary-dark text-white py-10 md:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-accent text-xs font-bold uppercase tracking-[0.2em] mb-2">Documents</p>
            <h1 className="font-display text-3xl md:text-5xl font-bold">NOTES <span className="text-accent">&amp; DOCS</span></h1>
            <p className="text-gray-300 text-sm md:text-base mt-2 max-w-xl">Keep useful notes, old spreadsheets, and shared team links in one place.</p>
          </motion.div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="flex flex-col md:flex-row gap-3 md:items-center mb-6">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search notes and links"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button onClick={() => setFilter('all')} className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap ${filter === 'all' ? 'bg-primary-dark text-accent' : 'bg-white border border-gray-200 text-gray-600'}`}>All</button>
            {CATEGORIES.map((category) => (
              <button key={category.id} onClick={() => setFilter(category.id)} className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap ${filter === category.id ? 'bg-primary-dark text-accent' : 'bg-white border border-gray-200 text-gray-600'}`}>
                {category.icon} {category.label}
              </button>
            ))}
          </div>
          <button onClick={openAdd} className="bg-primary-dark text-accent px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary transition-colors whitespace-nowrap">+ Add entry</button>
        </div>

        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl text-center py-16 px-6">
            <div className="text-4xl mb-3">🗂️</div>
            <h2 className="font-display font-bold text-primary text-xl">Nothing here yet</h2>
            <p className="text-gray-500 text-sm mt-1 mb-5">Add a note or save a useful spreadsheet link for the team.</p>
            <button onClick={openAdd} className="btn-primary text-sm">Create the first entry</button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item, index) => {
              const meta = categoryMeta(item.category)
              return (
                <motion.article key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-accent/20 text-primary-dark">{meta.icon} {meta.label}</span>
                    <span className="text-[11px] text-gray-400">{formatDate(item.updated_at || item.created_at)}</span>
                  </div>
                  <h2 className="font-display font-bold text-primary text-xl leading-snug">{item.title}</h2>
                  {item.body && <p className="text-gray-600 text-sm leading-relaxed mt-2 whitespace-pre-wrap line-clamp-5">{item.body}</p>}
                  <div className="mt-auto pt-5 flex items-center gap-2">
                    {item.link_url && <a href={item.link_url} target="_blank" rel="noreferrer" className="flex-1 text-center bg-primary-dark text-accent rounded-lg px-3 py-2 text-xs font-semibold hover:bg-primary transition-colors">Open link ↗</a>}
                    {(isAdmin || item.created_by === user?.id) && (
                      <button onClick={() => openEdit(item)} className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50">Edit</button>
                    )}
                    {(isAdmin || item.created_by === user?.id) && (
                      <button onClick={() => handleDelete(item)} disabled={deletingId === item.id} aria-label={`Remove ${item.title}`} className="px-3 py-2 rounded-lg border border-red-100 text-red-500 text-xs font-semibold hover:bg-red-50 disabled:opacity-50">{deletingId === item.id ? '…' : 'Remove'}</button>
                    )}
                  </div>
                </motion.article>
              )
            })}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button aria-label="Close form" onClick={closeForm} className="absolute inset-0 bg-black/40 cursor-default" />
          <form onSubmit={handleSave} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-7">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="font-display font-bold text-primary text-2xl">{editingItem ? 'Edit entry' : 'New entry'}</h2>
                <p className="text-gray-500 text-sm mt-1">Save a note or a link the team can use later.</p>
              </div>
              <button type="button" onClick={closeForm} aria-label="Close" className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Title <span className="text-red-400">*</span></label>
                <input autoFocus value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. 2024 season spreadsheet" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((category) => (
                    <button type="button" key={category.id} onClick={() => setForm((current) => ({ ...current, category: category.id }))} className={`px-3 py-2.5 rounded-lg border text-xs font-semibold text-left ${form.category === category.id ? 'bg-primary-dark text-accent border-primary-dark' : 'border-gray-200 text-gray-600'}`}>
                      {category.icon} {category.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Note</label>
                <textarea value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} rows={5} placeholder="Write details, reminders, or context" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Link</label>
                <input type="url" value={form.link_url} onChange={(event) => setForm((current) => ({ ...current, link_url: event.target.value }))} placeholder="https://docs.google.com/..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={closeForm} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving || !form.title.trim()} className="flex-1 bg-primary-dark text-accent rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50">{saving ? 'Saving…' : editingItem ? 'Save changes' : 'Add entry'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
