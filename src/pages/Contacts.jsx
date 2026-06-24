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

function normalizeSectionName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function normalizeCountryCode(value) {
  const cleaned = String(value || '').replace(/\s+/g, '').trim()
  if (!cleaned) return ''
  return cleaned.startsWith('+') ? cleaned : `+${cleaned.replace(/^\++/, '')}`
}

function applyCountryCode(number, selection, otherCode) {
  const normalizedNumber = normalizePhone(number)
  if (!normalizedNumber) return null
  if (normalizedNumber.startsWith('+')) return normalizedNumber

  if (selection === 'us') {
    return `+1${normalizedNumber}`
  }

  const customCode = normalizeCountryCode(otherCode)
  return customCode ? `${customCode}${normalizedNumber}` : normalizedNumber
}

function normalizePhoneForComparison(value) {
  return String(value || '').replace(/\D/g, '')
}

function splitPhoneForForm(value) {
  const normalized = normalizePhone(value)
  if (!normalized) {
    return { country: 'us', otherCode: '', number: '' }
  }

  if (normalized.startsWith('+1') && /^\+1\d{10}$/.test(normalized)) {
    return { country: 'us', otherCode: '', number: normalized.slice(2) }
  }

  if (normalized.startsWith('+')) {
    const parsed = normalized.match(/^\+(\d{1,3})(\d+)$/)
    if (parsed) {
      const code = `+${parsed[1]}`
      if (code === '+1') {
        return { country: 'us', otherCode: '', number: parsed[2] || '' }
      }
      return { country: 'other', otherCode: code, number: parsed[2] || '' }
    }
    return { country: 'other', otherCode: '', number: normalized.replace(/^\+/, '') }
  }

  return { country: 'us', otherCode: '', number: normalized }
}

function buildServiceEditForm(contact) {
  const phone = splitPhoneForForm(contact.phone)
  const whatsapp = splitPhoneForForm(contact.whatsapp_number)
  return {
    name: contact.name || '',
    phone: phone.number,
    phoneCountry: phone.country,
    phoneOtherCode: phone.otherCode,
    whatsapp_number: whatsapp.number,
    whatsappCountry: whatsapp.country,
    whatsappOtherCode: whatsapp.otherCode,
    email: contact.email || '',
    special_note: contact.special_note || '',
  }
}

function makeCallHref(phone) {
  const p = normalizePhone(phone)
  return p ? `tel:${p}` : null
}

function makeWhatsAppHref(phone) {
  const normalized = normalizePhone(phone)
  if (!normalized) return null

  let digits = String(normalized).replace(/\D/g, '')
  if (!digits) return null

  // If no country code is provided (plain 10-digit number), default to US +1.
  if (digits.length === 10) {
    digits = `1${digits}`
  }

  return `https://wa.me/${digits}`
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

function CopyPhoneButton({ value }) {
  const [copied, setCopied] = useState(false)
  const text = String(value || '').trim()

  if (!text) return null

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy phone number'}
      className={`inline-flex items-center p-0.5 rounded transition-colors ${
        copied ? 'text-green-600' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
      }`}
    >
      {copied ? (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  )
}

function PlayerCard({ player, canManage, onSave }) {
  const phone = player.phone || ''
  const email = player.email || ''
  const initialPhone = splitPhoneForForm(phone)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: player.full_name || '',
    email: email || '',
    phone: initialPhone.number,
    phoneCountry: initialPhone.country,
    phoneOtherCode: initialPhone.otherCode,
    team: player.team || 'raising-bulls',
  })

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    await onSave(player.id, {
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: applyCountryCode(form.phone, form.phoneCountry, form.phoneOtherCode),
      team: form.team,
    })
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">{player.full_name}</h3>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${player.team === 'raising-bulls' ? 'bg-primary-dark text-accent' : 'bg-primary text-white'}`}>
          {teamLabel(player.team)}
        </span>
      </div>

      {canManage && (
        <div className="mt-2">
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-[11px] font-bold text-primary hover:text-primary-dark"
            >
              Edit Player Contact
            </button>
          ) : (
            <form onSubmit={handleSave} className="mt-2 space-y-2 border border-dashed border-gray-300 rounded-xl p-2.5 bg-gray-50">
              <input
                value={form.full_name}
                onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                placeholder="Full name"
                className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email"
                className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <select
                  value={form.phoneCountry}
                  onChange={(e) => setForm((prev) => ({ ...prev, phoneCountry: e.target.value }))}
                  className="px-2 py-1.5 rounded-lg text-xs border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="us">🇺🇸 +1</option>
                  <option value="other">Other</option>
                </select>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone"
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {form.phoneCountry === 'other' && (
                  <input
                    value={form.phoneOtherCode}
                    onChange={(e) => setForm((prev) => ({ ...prev, phoneOtherCode: e.target.value }))}
                    placeholder="Country code (e.g. +91)"
                    className="col-span-2 w-full px-2.5 py-1.5 rounded-lg text-xs border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                )}
              </div>
              <select
                value={form.team}
                onChange={(e) => setForm((prev) => ({ ...prev, team: e.target.value }))}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="raising-bulls">Raising Bulls</option>
                <option value="royal-bulls">Royal Bulls</option>
              </select>
              <div className="flex gap-1.5">
                <button
                  type="submit"
                  disabled={saving || !form.full_name.trim()}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-primary-dark text-accent disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const resetPhone = splitPhoneForForm(phone)
                    setForm({
                      full_name: player.full_name || '',
                      email: email || '',
                      phone: resetPhone.number,
                      phoneCountry: resetPhone.country,
                      phoneOtherCode: resetPhone.otherCode,
                      team: player.team || 'raising-bulls',
                    })
                    setEditing(false)
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <ContactMethodButton href={makeCallHref(phone)} label="Call" icon="📞" tone="slate" />
        <ContactMethodButton href={makeWhatsAppHref(phone)} label="WhatsApp" icon="💬" tone="green" />
        {email && <ContactMethodButton href={`mailto:${email}`} label="Email" icon="✉️" tone="blue" />}
      </div>
    </div>
  )
}

function ServiceContactCard({ contact, notes, user, onAddNote, onDelete, onEdit, canDelete, canEdit }) {
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editForm, setEditForm] = useState(() => buildServiceEditForm(contact))

  useEffect(() => {
    setEditForm(buildServiceEditForm(contact))
  }, [contact])

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

  async function submitEdit(e) {
    e.preventDefault()
    if (!editForm.name.trim()) return
    setSavingEdit(true)
    await onEdit(contact.id, {
      name: editForm.name.trim(),
      phone: applyCountryCode(editForm.phone, editForm.phoneCountry, editForm.phoneOtherCode),
      whatsapp_number: applyCountryCode(editForm.whatsapp_number, editForm.whatsappCountry, editForm.whatsappOtherCode),
      email: String(editForm.email || '').trim() || null,
      special_note: String(editForm.special_note || '').trim() || null,
    })
    setSavingEdit(false)
    setEditing(false)
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
          {(contact.phone || contact.whatsapp_number) && (
            <div className="mt-2 space-y-0.5">
              {contact.phone && (
                <p className="text-[11px] text-gray-600 flex items-center gap-0.5">
                  <span className="font-semibold text-gray-700">Phone:</span>
                  <span>{contact.phone}</span>
                  <CopyPhoneButton value={contact.phone} />
                </p>
              )}
              {contact.whatsapp_number && (
                <p className="text-[11px] text-gray-600">
                  <span className="font-semibold text-gray-700">WhatsApp:</span> {contact.whatsapp_number}
                </p>
              )}
            </div>
          )}
        </div>
        {canEdit && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="p-1 rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit contact"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
          </button>
        )}
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

      {editing && (
        <form onSubmit={submitEdit} className="mt-3 space-y-2 border border-dashed border-gray-300 rounded-xl p-3 bg-gray-50">
          <div className="grid sm:grid-cols-2 gap-2">
            <input
              value={editForm.name}
              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Name"
              className="px-2.5 py-1.5 rounded-lg text-xs border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <select
                value={editForm.phoneCountry}
                onChange={(e) => setEditForm((prev) => ({ ...prev, phoneCountry: e.target.value }))}
                className="px-2 py-1.5 rounded-lg text-xs border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="us">🇺🇸 +1</option>
                <option value="other">Other</option>
              </select>
              <input
                value={editForm.phone}
                onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone"
                className="px-2.5 py-1.5 rounded-lg text-xs border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              />
              {editForm.phoneCountry === 'other' && (
                <input
                  value={editForm.phoneOtherCode}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phoneOtherCode: e.target.value }))}
                  placeholder="Country code (e.g. +91)"
                  className="col-span-2 px-2.5 py-1.5 rounded-lg text-xs border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
                />
              )}
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <select
                value={editForm.whatsappCountry}
                onChange={(e) => setEditForm((prev) => ({ ...prev, whatsappCountry: e.target.value }))}
                className="px-2 py-1.5 rounded-lg text-xs border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="us">🇺🇸 +1</option>
                <option value="other">Other</option>
              </select>
              <input
                value={editForm.whatsapp_number}
                onChange={(e) => setEditForm((prev) => ({ ...prev, whatsapp_number: e.target.value }))}
                placeholder="WhatsApp"
                className="px-2.5 py-1.5 rounded-lg text-xs border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              />
              {editForm.whatsappCountry === 'other' && (
                <input
                  value={editForm.whatsappOtherCode}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, whatsappOtherCode: e.target.value }))}
                  placeholder="Country code (e.g. +44)"
                  className="col-span-2 px-2.5 py-1.5 rounded-lg text-xs border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
                />
              )}
            </div>
            <input
              value={editForm.email}
              onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Email"
              className="px-2.5 py-1.5 rounded-lg text-xs border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <textarea
              rows={2}
              value={editForm.special_note}
              onChange={(e) => setEditForm((prev) => ({ ...prev, special_note: e.target.value }))}
              placeholder="Special note"
              className="sm:col-span-2 px-2.5 py-1.5 rounded-lg text-xs border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>
          <div className="flex gap-1.5">
            <button
              type="submit"
              disabled={savingEdit || !editForm.name.trim()}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-primary-dark text-accent disabled:opacity-50"
            >
              {savingEdit ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditForm(buildServiceEditForm(contact))
                setEditing(false)
              }}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <ContactMethodButton href={makeCallHref(contact.phone)} label="Phone" icon="📞" tone="slate" />
        <ContactMethodButton href={makeWhatsAppHref(contact.whatsapp_number || contact.phone)} label="WhatsApp" icon="💬" tone="green" />
        {contact.email && <ContactMethodButton href={`mailto:${contact.email}`} label="Email" icon="✉️" tone="blue" />}
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
    <div className="shrink-0 flex items-center">
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

function EditSectionButton({ sectionId, sectionName, onRename }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draftName, setDraftName] = useState(sectionName)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!editing) {
      setDraftName(sectionName)
      setError('')
    }
  }, [sectionName, editing])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const result = await onRename(sectionId, draftName)
    setSaving(false)

    if (!result?.ok) {
      setError(result?.message || 'Unable to rename section right now.')
      return
    }

    setEditing(false)
    setError('')
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setEditing(true) }}
        className="p-1 rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        title={`Edit section "${sectionName}"`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
        </svg>
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSave}
      className="flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        value={draftName}
        onChange={(e) => {
          setDraftName(e.target.value)
          if (error) setError('')
        }}
        placeholder="Section name"
        className={`w-36 px-2 py-1 rounded-lg text-xs border bg-white focus:outline-none focus:ring-2 ${error ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-accent'}`}
      />
      <button
        type="submit"
        disabled={saving || !draftName.trim()}
        className="px-2 py-1 rounded text-[10px] font-bold bg-primary-dark text-accent disabled:opacity-50"
      >
        {saving ? '...' : 'Save'}
      </button>
      <button
        type="button"
        onClick={() => {
          setDraftName(sectionName)
          setError('')
          setEditing(false)
        }}
        className="px-2 py-1 rounded text-[10px] font-bold bg-gray-100 text-gray-600 hover:bg-gray-200"
      >
        Cancel
      </button>
      {error && (
        <span className="text-[10px] font-semibold text-red-600 max-w-[160px] truncate" title={error}>
          {error}
        </span>
      )}
    </form>
  )
}

export default function Contacts() {
  const { user, profile, isAdmin } = useAuth()
  const canManagePlayers = !!isAdmin
  const canEditServices = !!user

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
  const [sectionError, setSectionError] = useState('')
  // per-section UI state: collapsed + inline add-contact form
  const [sectionOpen, setSectionOpen] = useState({})
  const [sectionAddOpen, setSectionAddOpen] = useState({})
  const [sectionAddForm, setSectionAddForm] = useState({})
  const [sectionAddSaving, setSectionAddSaving] = useState({})
  const [sectionAddError, setSectionAddError] = useState({})

  useEffect(() => {
    let active = true
    async function loadPlayers() {
      setLoadingPlayers(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, team, phone, email')
        .in('team', ['raising-bulls', 'royal-bulls'])
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
      .sort((a, b) => String(a.full_name || '').localeCompare(String(b.full_name || '')))
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
    const name = newSectionName.trim().replace(/\s+/g, ' ')
    if (!name || !user?.id || loadingServices) return

    const normalizedName = normalizeSectionName(name)
    const hasLocalDuplicate = sections.some((s) => normalizeSectionName(s.name) === normalizedName)
    if (hasLocalDuplicate) {
      setSectionError('Section already exists. Please use a different name.')
      return
    }

    // Defensive server-side check to avoid duplicates caused by stale client state
    // and to catch case/whitespace variations reliably.
    const { data: existingRows, error: existingRowsError } = await supabase
      .from('service_contact_sections')
      .select('id, name')
      .eq('is_active', true)
      .limit(500)

    if (existingRowsError) {
      setSectionError(existingRowsError.message || 'Unable to validate section name right now.')
      return
    }

    const hasRemoteDuplicate = (existingRows || []).some((row) => normalizeSectionName(row.name) === normalizedName)
    if (hasRemoteDuplicate) {
      setSectionError('Section already exists. Please use a different name.')
      return
    }

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
      const errorCode = String(error.code || '')
      const errorMessage = String(error.message || '')
      const isDuplicateError = errorCode === '23505' || /duplicate|already exists|unique constraint/i.test(errorMessage)
      if (isDuplicateError) {
        setSectionError('Section already exists. Please use a different name.')
      } else {
        alert(errorMessage || 'Unable to add section')
      }
      return
    }

    setSections((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    setNewSectionName('')
    setSectionError('')
  }

  function getSectionForm(sectionId) {
    return sectionAddForm[sectionId] || {
      name: '',
      phone: '',
      phoneCountry: 'us',
      phoneOtherCode: '',
      whatsapp: '',
      whatsappCountry: 'us',
      whatsappOtherCode: '',
      email: '',
      specialNote: '',
    }
  }

  function setSectionForm(sectionId, patch) {
    setSectionAddForm((prev) => ({
      ...prev,
      [sectionId]: { ...getSectionForm(sectionId), ...patch },
    }))
    setSectionAddError((prev) => ({ ...prev, [sectionId]: '' }))
  }

  async function handleAddContact(e, sectionId) {
    e.preventDefault()
    if (!user?.id) return
    const form = getSectionForm(sectionId)
    const normalizedPhone = applyCountryCode(form.phone, form.phoneCountry, form.phoneOtherCode)
    const normalizedWhatsApp = applyCountryCode(form.whatsapp, form.whatsappCountry, form.whatsappOtherCode)

    const requestedNumbers = [normalizedPhone, normalizedWhatsApp]
      .map(normalizePhoneForComparison)
      .filter(Boolean)

    const duplicateByNumber = (rows) => {
      return (rows || []).find((row) => {
        const existingNumbers = [row.phone, row.whatsapp_number]
          .map(normalizePhoneForComparison)
          .filter(Boolean)
        return existingNumbers.some((n) => requestedNumbers.includes(n))
      })
    }

    if (requestedNumbers.length > 0) {
      const localDuplicate = duplicateByNumber(serviceContacts.filter((c) => c.section_id === sectionId))
      if (localDuplicate) {
        setSectionAddError((prev) => ({
          ...prev,
          [sectionId]: `This number already exists in this section under ${localDuplicate.name}. Please edit the existing contact or use a different number.`,
        }))
        return
      }

      const { data: remoteSectionContacts, error: remoteSectionContactsError } = await supabase
        .from('service_contacts')
        .select('id, name, phone, whatsapp_number')
        .eq('section_id', sectionId)
        .eq('is_active', true)
        .limit(500)

      if (remoteSectionContactsError) {
        setSectionAddError((prev) => ({
          ...prev,
          [sectionId]: remoteSectionContactsError.message || 'Unable to validate duplicate contact number right now. Please try again.',
        }))
        return
      }

      const remoteDuplicate = duplicateByNumber(remoteSectionContacts)
      if (remoteDuplicate) {
        setSectionAddError((prev) => ({
          ...prev,
          [sectionId]: `This number already exists in this section under ${remoteDuplicate.name}. Please edit the existing contact or use a different number.`,
        }))
        return
      }
    }

    const payload = {
      section_id: sectionId,
      name: form.name.trim(),
      phone: normalizedPhone,
      whatsapp_number: normalizedWhatsApp,
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
    setSectionAddForm((prev) => ({
      ...prev,
      [sectionId]: {
        name: '',
        phone: '',
        phoneCountry: 'us',
        phoneOtherCode: '',
        whatsapp: '',
        whatsappCountry: 'us',
        whatsappOtherCode: '',
        email: '',
        specialNote: '',
      },
    }))
    setSectionAddError((prev) => ({ ...prev, [sectionId]: '' }))
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

  async function handleRenameSection(sectionId, rawName) {
    const name = String(rawName || '').trim().replace(/\s+/g, ' ')
    if (!name) {
      return { ok: false, message: 'Section name is required.' }
    }

    const current = sections.find((s) => s.id === sectionId)
    if (!current) {
      return { ok: false, message: 'Section not found.' }
    }

    if (normalizeSectionName(current.name) === normalizeSectionName(name)) {
      return { ok: true }
    }

    const normalizedName = normalizeSectionName(name)
    const hasLocalDuplicate = sections.some(
      (s) => s.id !== sectionId && normalizeSectionName(s.name) === normalizedName,
    )
    if (hasLocalDuplicate) {
      return { ok: false, message: 'Section already exists. Please use a different name.' }
    }

    const { data: existingRows, error: existingRowsError } = await supabase
      .from('service_contact_sections')
      .select('id, name')
      .eq('is_active', true)
      .limit(500)

    if (existingRowsError) {
      return { ok: false, message: existingRowsError.message || 'Unable to validate section name right now.' }
    }

    const hasRemoteDuplicate = (existingRows || []).some(
      (row) => row.id !== sectionId && normalizeSectionName(row.name) === normalizedName,
    )
    if (hasRemoteDuplicate) {
      return { ok: false, message: 'Section already exists. Please use a different name.' }
    }

    const { data, error } = await supabase
      .from('service_contact_sections')
      .update({ name })
      .eq('id', sectionId)
      .select('id, name, slug, sort_order, is_active')
      .single()

    if (error) {
      const errorCode = String(error.code || '')
      const errorMessage = String(error.message || '')
      const isDuplicateError = errorCode === '23505' || /duplicate|already exists|unique constraint/i.test(errorMessage)
      if (isDuplicateError) {
        return { ok: false, message: 'Section already exists. Please use a different name.' }
      }
      return { ok: false, message: errorMessage || 'Unable to rename section right now.' }
    }

    setSections((prev) => prev.map((s) => (s.id === sectionId ? data : s)).sort((a, b) => a.name.localeCompare(b.name)))
    return { ok: true }
  }

  async function handleEditServiceContact(contactId, updates) {
    const { data, error } = await supabase
      .from('service_contacts')
      .update(updates)
      .eq('id', contactId)
      .select('id, section_id, name, phone, whatsapp_number, email, special_note, is_active')
      .single()

    if (error) {
      alert(error.message || 'Unable to update contact')
      return
    }

    setServiceContacts((prev) => prev.map((c) => (c.id === contactId ? data : c)))
  }

  async function handleEditPlayerContact(playerId, updates) {
    const payload = {
      full_name: updates.full_name,
      email: updates.email,
      phone: updates.phone,
      team: updates.team,
    }
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', playerId)
      .select('id, full_name, team, phone, email')
      .single()

    if (error) {
      alert(error.message || 'Unable to update player contact')
      return
    }

    setPlayers((prev) => prev.map((p) => (p.id === playerId ? data : p)))
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
                  {filteredPlayers.map((p) => (
                    <PlayerCard
                      key={p.id}
                      player={p}
                      canManage={canManagePlayers}
                      onSave={handleEditPlayerContact}
                    />
                  ))}
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
                <div className="flex flex-col gap-1.5">
                  <form onSubmit={handleAddSection} className="flex gap-2">
                    <input
                      value={newSectionName}
                      onChange={(e) => {
                        setNewSectionName(e.target.value)
                        if (sectionError) setSectionError('')
                      }}
                      placeholder="New section name…"
                      className={`w-44 px-3 py-2 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:border-transparent ${sectionError ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-accent'}`}
                    />
                    <button
                      type="submit"
                      disabled={loadingServices || addingSection || !newSectionName.trim()}
                      className="px-4 py-2 rounded-xl text-sm font-bold bg-primary-dark text-accent disabled:opacity-50 shrink-0"
                    >
                      {addingSection ? 'Adding...' : '+ Section'}
                    </button>
                  </form>
                  {sectionError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2" role="alert" aria-live="polite">
                      <p className="text-xs font-semibold text-red-700">{sectionError}</p>
                    </div>
                  )}
                </div>
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
                    const addError = sectionAddError[section.id] || ''

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
                            <div className="shrink-0 flex items-center gap-1 pr-3">
                              <EditSectionButton
                                sectionId={section.id}
                                sectionName={section.name}
                                onRename={handleRenameSection}
                              />
                              <DeleteSectionButton sectionId={section.id} sectionName={section.name} onDelete={handleDeleteSection} />
                            </div>
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
                                {/* Add contact toggle */}
                                {!isAddOpen ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSectionAddOpen((prev) => ({ ...prev, [section.id]: true }))
                                      setSectionAddError((prev) => ({ ...prev, [section.id]: '' }))
                                    }}
                                    className="mb-3 text-xs font-bold text-accent bg-primary-dark/90 px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors"
                                  >
                                    + Add Contact
                                  </button>
                                ) : (
                                  <form
                                    onSubmit={(e) => handleAddContact(e, section.id)}
                                    className="mb-3 border border-dashed border-gray-300 rounded-xl p-3 bg-gray-50"
                                  >
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">New Contact in {section.name}</p>
                                    {addError && (
                                      <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2" role="alert" aria-live="polite">
                                        <p className="text-xs font-semibold text-amber-800">{addError}</p>
                                      </div>
                                    )}
                                    <div className="grid sm:grid-cols-2 gap-2">
                                      <input
                                        value={form.name}
                                        onChange={(e) => setSectionForm(section.id, { name: e.target.value })}
                                        placeholder="Name *"
                                        required
                                        className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                      />
                                      <div className="grid grid-cols-[120px_1fr] gap-2">
                                        <select
                                          value={form.phoneCountry}
                                          onChange={(e) => setSectionForm(section.id, { phoneCountry: e.target.value })}
                                          className="px-2 py-2 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                                        >
                                          <option value="us">🇺🇸 +1</option>
                                          <option value="other">Other</option>
                                        </select>
                                        <input
                                          value={form.phone}
                                          onChange={(e) => setSectionForm(section.id, { phone: e.target.value })}
                                          placeholder="Phone"
                                          className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                        />
                                        {form.phoneCountry === 'other' && (
                                          <input
                                            value={form.phoneOtherCode}
                                            onChange={(e) => setSectionForm(section.id, { phoneOtherCode: e.target.value })}
                                            placeholder="Country code (e.g. +91)"
                                            className="col-span-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                          />
                                        )}
                                      </div>
                                      <div className="grid grid-cols-[120px_1fr] gap-2">
                                        <select
                                          value={form.whatsappCountry}
                                          onChange={(e) => setSectionForm(section.id, { whatsappCountry: e.target.value })}
                                          className="px-2 py-2 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                                        >
                                          <option value="us">🇺🇸 +1</option>
                                          <option value="other">Other</option>
                                        </select>
                                        <input
                                          value={form.whatsapp}
                                          onChange={(e) => setSectionForm(section.id, { whatsapp: e.target.value })}
                                          placeholder="WhatsApp"
                                          className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                        />
                                        {form.whatsappCountry === 'other' && (
                                          <input
                                            value={form.whatsappOtherCode}
                                            onChange={(e) => setSectionForm(section.id, { whatsappOtherCode: e.target.value })}
                                            placeholder="Country code (e.g. +44)"
                                            className="col-span-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                          />
                                        )}
                                      </div>
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
                                        onClick={() => {
                                          setSectionAddOpen((prev) => ({ ...prev, [section.id]: false }))
                                          setSectionAddError((prev) => ({ ...prev, [section.id]: '' }))
                                        }}
                                        className="px-4 py-2 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </form>
                                )}

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
                                        onEdit={handleEditServiceContact}
                                        canDelete={isAdmin}
                                        canEdit={canEditServices}
                                      />
                                    ))}
                                  </div>
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
