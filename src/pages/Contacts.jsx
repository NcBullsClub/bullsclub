import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const PLAYER_TEAMS = [
  { id: 'all', label: 'All Teams' },
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls', label: 'Royal Bulls' },
]

function normalizePhone(value) {
  return String(value || '').replace(/\s+/g, '').trim()
}

function makeCallHref(phone) {
  const p = normalizePhone(phone)
  return p ? `tel:${p}` : null
}

function makeWhatsAppHref(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : null
}

function teamLabel(team) {
  if (team === 'raising-bulls') return 'Raising Bulls'
  if (team === 'royal-bulls') return 'Royal Bulls'
  return team || 'Unknown Team'
}

function ContactMethodButton({ href, label, icon, tone = 'slate' }) {
  const tones = {
    slate: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200',
    green: 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100',
  }

  if (!href) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border opacity-60 ${tones[tone]}`}>
        <span>{icon}</span>
        <span>{label}</span>
      </span>
    )
  }

  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noreferrer' : undefined}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${tones[tone]}`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </a>
  )
}

function PlayerCard({ player }) {
  const phone = player.phone || ''
  const email = player.email || ''

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">{player.full_name}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">{teamLabel(player.team)}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${player.team === 'raising-bulls' ? 'bg-primary-dark text-accent' : 'bg-primary text-white'}`}>
          {player.team === 'raising-bulls' ? 'RB' : player.team === 'royal-bulls' ? 'RY' : '--'}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <ContactMethodButton href={makeCallHref(phone)} label="Call" icon="📞" tone="slate" />
        <ContactMethodButton href={makeWhatsAppHref(phone)} label="WhatsApp" icon="💬" tone="green" />
        <ContactMethodButton href={email ? `mailto:${email}` : null} label="Email" icon="✉️" tone="blue" />
      </div>
    </div>
  )
}

function ServiceContactCard({ contact, notes, user, onAddNote, onDelete, canDelete }) {
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await onDelete(contact.id)
    setDeleting(false)
  }

  async function submitNote(e) {
    e.preventDefault()
    if (!draft.trim() || !user?.id) return
    setSaving(true)
    await onAddNote(contact.id, draft.trim())
    setDraft('')
    setSaving(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm">{contact.name}</h3>
          {contact.special_note && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mt-2 inline-block">
              {contact.special_note}
            </p>
          )}
        </div>
        {canDelete && (
          <div className="shrink-0">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Delete contact"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-red-600 font-semibold">Delete?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {deleting ? '...' : 'Yes'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  No
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <ContactMethodButton href={makeCallHref(contact.phone)} label="Phone" icon="📞" tone="slate" />
        <ContactMethodButton href={makeWhatsAppHref(contact.whatsapp_number || contact.phone)} label="WhatsApp" icon="💬" tone="green" />
        <ContactMethodButton href={contact.email ? `mailto:${contact.email}` : null} label="Email" icon="✉️" tone="blue" />
      </div>

      <div className="mt-3 border-t border-gray-100 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">Shared Notes</p>
        {notes.length === 0 ? (
          <p className="text-xs text-gray-400">No notes yet. Add one to help the team.</p>
        ) : (
          <div className="space-y-1.5 mb-3">
            {notes.slice(0, 4).map((n) => (
              <div key={n.id} className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
                <span className="font-semibold text-gray-700">{n.authorName || 'Player'}:</span>{' '}
                <span className="text-gray-600">{n.note}</span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={submitNote} className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a useful note for other players"
            className="flex-1 px-3 py-2 rounded-xl border border-gray-300 bg-gray-50 text-xs focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            maxLength={220}
          />
          <button
            type="submit"
            disabled={saving || !draft.trim()}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-primary-dark text-accent disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add'}
          </button>
        </form>
      </div>
    </div>
  )
}

function DeleteSectionButton({ sectionId, sectionName, onDelete }) {
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await onDelete(sectionId)
    setDeleting(false)
  }

  return (
    <div className="shrink-0 flex items-center pr-3">
      {!confirm ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setConfirm(true) }}
          className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
          title={`Delete section "${sectionName}"`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      ) : (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <span className="text-[10px] text-red-600 font-semibold">Delete section?</span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
          >
            {deleting ? '...' : 'Yes'}
          </button>
          <button
            onClick={() => setConfirm(false)}
            className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            No
          </button>
        </div>
      )}
    </div>
  )
}

export default function Contacts() {
  const { user, profile, isAdmin } = useAuth()

  const [activeTab, setActiveTab] = useState('players')
  const [playerTeamFilter, setPlayerTeamFilter] = useState('all')
  const [playerSearch, setPlayerSearch] = useState('')

  const [players, setPlayers] = useState([])
  const [sections, setSections] = useState([])
  const [serviceContacts, setServiceContacts] = useState([])
  const [serviceNotes, setServiceNotes] = useState([])

  const [loadingPlayers, setLoadingPlayers] = useState(true)
  const [loadingServices, setLoadingServices] = useState(true)
  const [serviceSearch, setServiceSearch] = useState('')
  const [addingSection, setAddingSection] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')
  // per-section UI state: collapsed + inline add-contact form
  const [sectionOpen, setSectionOpen] = useState({})
  const [sectionAddOpen, setSectionAddOpen] = useState({})
  const [sectionAddForm, setSectionAddForm] = useState({})
  const [sectionAddSaving, setSectionAddSaving] = useState({})

  useEffect(() => {
    let active = true
    async function loadPlayers() {
      setLoadingPlayers(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, team, phone, email')
        .in('team', ['raising-bulls', 'royal-bulls'])
        .order('team')
        .order('full_name')
      if (!active) return
      setPlayers(data || [])
      setLoadingPlayers(false)
    }
    loadPlayers()
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    async function loadServices() {
      setLoadingServices(true)
      const [{ data: sectionRows }, { data: contactRows }, { data: noteRows }, { data: profilesRows }] = await Promise.all([
        supabase
          .from('service_contact_sections')
          .select('id, name, slug, sort_order, is_active')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true }),
        supabase
          .from('service_contacts')
          .select('id, section_id, name, phone, whatsapp_number, email, special_note, is_active')
          .eq('is_active', true)
          .order('name', { ascending: true }),
        supabase
          .from('service_contact_notes')
          .select('id, service_contact_id, user_id, note, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, full_name'),
      ])
      if (!active) return

      const nameById = {}
      ;(profilesRows || []).forEach((p) => { nameById[p.id] = p.full_name })

      setSections(sectionRows || [])
      setServiceContacts(contactRows || [])
      setServiceNotes((noteRows || []).map((n) => ({ ...n, authorName: nameById[n.user_id] || 'Player' })))
      setLoadingServices(false)
    }
    loadServices()
    return () => { active = false }
  }, [])

  const filteredPlayers = useMemo(() => {
    const q = playerSearch.trim().toLowerCase()
    return players
      .filter((p) => (playerTeamFilter === 'all' ? true : p.team === playerTeamFilter))
      .filter((p) => {
        if (!q) return true
        return (
          String(p.full_name || '').toLowerCase().includes(q)
          || String(p.email || '').toLowerCase().includes(q)
          || String(p.phone || '').toLowerCase().includes(q)
        )
      })
  }, [players, playerTeamFilter, playerSearch])

  const contactsBySection = useMemo(() => {
    const byId = {}
    serviceContacts.forEach((c) => {
      if (!byId[c.section_id]) byId[c.section_id] = []
      byId[c.section_id].push(c)
    })
    return byId
  }, [serviceContacts])

  const { filteredSections, filteredContactsBySection } = useMemo(() => {
    const q = serviceSearch.trim().toLowerCase()
    if (!q) return { filteredSections: sections, filteredContactsBySection: contactsBySection }

    const filteredContactsBySection = {}
    const filteredSections = sections.filter((s) => {
      const sectionMatch = s.name.toLowerCase().includes(q)
      const contacts = (contactsBySection[s.id] || []).filter((c) =>
        String(c.name || '').toLowerCase().includes(q) ||
        String(c.phone || '').toLowerCase().includes(q) ||
        String(c.whatsapp_number || '').toLowerCase().includes(q) ||
        String(c.email || '').toLowerCase().includes(q) ||
        String(c.special_note || '').toLowerCase().includes(q)
      )
      filteredContactsBySection[s.id] = sectionMatch ? (contactsBySection[s.id] || []) : contacts
      return sectionMatch || contacts.length > 0
    })
    return { filteredSections, filteredContactsBySection }
  }, [serviceSearch, sections, contactsBySection])

  const notesByContact = useMemo(() => {
    const byId = {}
    serviceNotes.forEach((n) => {
      if (!byId[n.service_contact_id]) byId[n.service_contact_id] = []
      byId[n.service_contact_id].push(n)
    })
    return byId
  }, [serviceNotes])

  async function handleAddSection(e) {
    e.preventDefault()
    const name = newSectionName.trim()
    if (!name || !user?.id) return

    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section'
    let slug = baseSlug
    let idx = 2
    while (sections.some((s) => s.slug === slug)) {
      slug = `${baseSlug}-${idx}`
      idx += 1
    }

    setAddingSection(true)
    const { data, error } = await supabase
      .from('service_contact_sections')
      .insert({ name, slug, sort_order: (sections.length + 1) * 10, created_by: user.id })
      .select('id, name, slug, sort_order, is_active')
      .single()
    setAddingSection(false)

    if (error) {
      alert(error.message || 'Unable to add section')
      return
    }

    setSections((prev) => [...prev, data].sort((a, b) => (a.sort_order - b.sort_order) || a.name.localeCompare(b.name)))
    setNewSectionName('')
  }

  function getSectionForm(sectionId) {
    return sectionAddForm[sectionId] || { name: '', phone: '', whatsapp: '', email: '', specialNote: '' }
  }

  function setSectionForm(sectionId, patch) {
    setSectionAddForm((prev) => ({
      ...prev,
      [sectionId]: { ...getSectionForm(sectionId), ...patch },
    }))
  }

  async function handleAddContact(e, sectionId) {
    e.preventDefault()
    if (!user?.id) return
    const form = getSectionForm(sectionId)
    const payload = {
      section_id: sectionId,
      name: form.name.trim(),
      phone: normalizePhone(form.phone) || null,
      whatsapp_number: normalizePhone(form.whatsapp) || null,
      email: String(form.email || '').trim() || null,
      special_note: String(form.specialNote || '').trim() || null,
      created_by: user.id,
      is_active: true,
    }
    if (!payload.name) return

    setSectionAddSaving((prev) => ({ ...prev, [sectionId]: true }))
    const { data, error } = await supabase
      .from('service_contacts')
      .insert(payload)
      .select('id, section_id, name, phone, whatsapp_number, email, special_note, is_active')
      .single()
    setSectionAddSaving((prev) => ({ ...prev, [sectionId]: false }))

    if (error) {
      alert(error.message || 'Unable to add contact')
      return
    }

    setServiceContacts((prev) => [...prev, data].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))))
    setSectionAddForm((prev) => ({ ...prev, [sectionId]: { name: '', phone: '', whatsapp: '', email: '', specialNote: '' } }))
    setSectionAddOpen((prev) => ({ ...prev, [sectionId]: false }))
  }

  async function handleDeleteContact(contactId) {
    const { error } = await supabase
      .from('service_contacts')
      .update({ is_active: false })
      .eq('id', contactId)
    if (error) {
      alert(error.message || 'Unable to delete contact')
      return
    }
    setServiceContacts((prev) => prev.filter((c) => c.id !== contactId))
  }

  async function handleDeleteSection(sectionId) {
    // soft-delete the section and all its contacts
    const { error } = await supabase
      .from('service_contact_sections')
      .update({ is_active: false })
      .eq('id', sectionId)
    if (error) {
      alert(error.message || 'Unable to delete section')
      return
    }
    setSections((prev) => prev.filter((s) => s.id !== sectionId))
    setServiceContacts((prev) => prev.filter((c) => c.section_id !== sectionId))
  }

  async function handleAddNote(serviceContactId, note) {
    if (!user?.id) return
    const { data, error } = await supabase
      .from('service_contact_notes')
      .insert({ service_contact_id: serviceContactId, user_id: user.id, note })
      .select('id, service_contact_id, user_id, note, created_at')
      .single()

    if (error) {
      alert(error.message || 'Unable to save note')
      return
    }

    setServiceNotes((prev) => [{ ...data, authorName: profile?.full_name || 'Player' }, ...prev])
  }

  return (
    <div>
      <section className="bg-primary-dark text-white py-8 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl md:text-6xl font-bold leading-tight">CONTACTS</h1>
            <p className="text-gray-300 text-sm md:text-lg mt-2 max-w-3xl">
              A private club directory for player contacts and trusted service references.
            </p>

            <div className="mt-6 inline-flex p-1 rounded-2xl bg-white/10 border border-white/20">
              <button
                onClick={() => setActiveTab('players')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'players' ? 'bg-accent text-primary-dark' : 'text-white/80 hover:text-white'}`}
              >
                Players
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'services' ? 'bg-accent text-primary-dark' : 'text-white/80 hover:text-white'}`}
              >
                Services
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-surface py-6 md:py-10 min-h-[60vh]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === 'players' ? (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {PLAYER_TEAMS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setPlayerTeamFilter(t.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                      playerTeamFilter === t.id
                        ? 'bg-primary-dark text-accent border-primary-dark'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
                <input
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  placeholder="Search name, phone, or email"
                  className="ml-auto min-w-[220px] px-3 py-2 rounded-xl border border-gray-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>

              {loadingPlayers ? (
                <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPlayers.map((p) => <PlayerCard key={p.id} player={p} />)}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Toolbar: search + add section */}
              <div className="mb-4 flex flex-col sm:flex-row gap-2">
                <input
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  placeholder="Search contacts by name, phone, email…"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                />
                <form onSubmit={handleAddSection} className="flex gap-2">
                  <input
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    placeholder="New section name…"
                    className="w-44 px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={addingSection || !newSectionName.trim()}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-primary-dark text-accent disabled:opacity-50 shrink-0"
                  >
                    {addingSection ? 'Adding...' : '+ Section'}
                  </button>
                </form>
              </div>

              {loadingServices ? (
                <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>
              ) : (
                <div className="space-y-3">
                  {filteredSections.length === 0 && (
                    <p className="text-center text-gray-400 py-10">No contacts match your search.</p>
                  )}
                  {filteredSections.map((section) => {
                    const contacts = filteredContactsBySection[section.id] || []
                    const isOpen = serviceSearch.trim() ? true : !!sectionOpen[section.id]
                    const isAddOpen = !!sectionAddOpen[section.id]
                    const form = getSectionForm(section.id)
                    const isSaving = !!sectionAddSaving[section.id]

                    return (
                      <div key={section.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                        {/* Section header — click to collapse/expand */}
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => setSectionOpen((prev) => ({ ...prev, [section.id]: !isOpen }))}
                            className="flex-1 flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-2">
                              <svg
                                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                              </svg>
                              <h2 className="font-display text-base font-bold text-primary">{section.name}</h2>
                            </div>
                            <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
                            </span>
                          </button>
                          {isAdmin && (
                            <DeleteSectionButton sectionId={section.id} sectionName={section.name} onDelete={handleDeleteSection} />
                          )}
                        </div>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              key="body"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div className="px-4 pb-4">
                                {/* Contacts grid */}
                                {contacts.length === 0 ? (
                                  <p className="text-sm text-gray-400 py-2">No contacts yet.</p>
                                ) : (
                                  <div className="grid sm:grid-cols-2 gap-3 mb-3">
                                    {contacts.map((c) => (
                                      <ServiceContactCard
                                        key={c.id}
                                        contact={c}
                                        notes={notesByContact[c.id] || []}
                                        user={user}
                                        onAddNote={handleAddNote}
                                        onDelete={handleDeleteContact}
                                        canDelete={isAdmin}
                                      />
                                    ))}
                                  </div>
                                )}

                                {/* Add contact toggle */}
                                {!isAddOpen ? (
                                  <button
                                    type="button"
                                    onClick={() => setSectionAddOpen((prev) => ({ ...prev, [section.id]: true }))}
                                    className="text-xs font-bold text-accent bg-primary-dark/90 px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors"
                                  >
                                    + Add Contact
                                  </button>
                                ) : (
                                  <form
                                    onSubmit={(e) => handleAddContact(e, section.id)}
                                    className="mt-2 border border-dashed border-gray-300 rounded-xl p-3 bg-gray-50"
                                  >
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">New Contact in {section.name}</p>
                                    <div className="grid sm:grid-cols-2 gap-2">
                                      <input
                                        value={form.name}
                                        onChange={(e) => setSectionForm(section.id, { name: e.target.value })}
                                        placeholder="Name *"
                                        required
                                        className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                      />
                                      <input
                                        value={form.phone}
                                        onChange={(e) => setSectionForm(section.id, { phone: e.target.value })}
                                        placeholder="Phone"
                                        className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                      />
                                      <input
                                        value={form.whatsapp}
                                        onChange={(e) => setSectionForm(section.id, { whatsapp: e.target.value })}
                                        placeholder="WhatsApp"
                                        className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                      />
                                      <input
                                        value={form.email}
                                        onChange={(e) => setSectionForm(section.id, { email: e.target.value })}
                                        placeholder="Email"
                                        className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                      />
                                      <textarea
                                        rows={2}
                                        value={form.specialNote}
                                        onChange={(e) => setSectionForm(section.id, { specialNote: e.target.value })}
                                        placeholder="Special note (optional)"
                                        className="sm:col-span-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                                      />
                                    </div>
                                    <div className="mt-2 flex gap-2">
                                      <button
                                        type="submit"
                                        disabled={isSaving || !form.name.trim()}
                                        className="px-4 py-2 rounded-lg text-xs font-bold bg-primary-dark text-accent disabled:opacity-50"
                                      >
                                        {isSaving ? 'Saving...' : 'Save Contact'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setSectionAddOpen((prev) => ({ ...prev, [section.id]: false }))}
                                        className="px-4 py-2 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </form>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
