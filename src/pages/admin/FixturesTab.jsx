import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const TEAMS = [
  { id: 'all',           label: 'All Teams' },
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls',   label: 'Royal Bulls' },
]

const TEAM_LABELS = {
  'raising-bulls': 'Raising Bulls',
  'royal-bulls':   'Royal Bulls',
}

const EMPTY_FORM = {
  date: '',
  time: '',
  opponent: '',
  team: 'raising-bulls',
  venue: '',
  venue_address: '',
  format: 'HT',
  type: 'Mega Bash',
  division: '',
  umpire1_team: '',
  umpire2_team: '',
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function isPast(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return new Date(y, m - 1, d) < today
}

// ── Fixture Form (add / edit) ──────────────────────────────────────────────
function FixtureForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)

  function set(field, val) {
    setForm((prev) => ({ ...prev, [field]: val }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave(form)
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent'
  const labelCls = 'block text-xs font-semibold text-gray-500 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Date *</label>
          <input type="date" required value={form.date} onChange={(e) => set('date', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Time</label>
          <input type="text" value={form.time} onChange={(e) => set('time', e.target.value)} placeholder="1:00 PM" className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Opponent *</label>
          <input type="text" required value={form.opponent} onChange={(e) => set('opponent', e.target.value)} placeholder="NC Jordans" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Team *</label>
          <select required value={form.team} onChange={(e) => set('team', e.target.value)} className={inputCls}>
            <option value="raising-bulls">Raising Bulls</option>
            <option value="royal-bulls">Royal Bulls</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Venue *</label>
        <input type="text" required value={form.venue} onChange={(e) => set('venue', e.target.value)} placeholder="RTP 3" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Venue Address</label>
        <input type="text" value={form.venue_address} onChange={(e) => set('venue_address', e.target.value)} placeholder="2500 S Tricenter Blvd, Durham, NC 27714" className={inputCls} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Format</label>
          <input type="text" value={form.format} onChange={(e) => set('format', e.target.value)} placeholder="HT" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Type</label>
          <input type="text" value={form.type} onChange={(e) => set('type', e.target.value)} placeholder="Mega Bash" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Division</label>
          <input type="text" value={form.division} onChange={(e) => set('division', e.target.value)} placeholder="D5" className={inputCls} />
        </div>
      </div>

      {/* Umpiring section */}
      <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
        <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3">🧢 Umpiring Assignment</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Umpire 1 Team</label>
            <input type="text" value={form.umpire1_team} onChange={(e) => set('umpire1_team', e.target.value)} placeholder="Hollysprings HT" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Umpire 2 Team</label>
            <input type="text" value={form.umpire2_team} onChange={(e) => set('umpire2_team', e.target.value)} placeholder="Hollysprings HT" className={inputCls} />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2.5 bg-primary-dark text-accent font-semibold rounded-xl text-sm disabled:opacity-50 transition-all hover:bg-primary"
        >
          {saving ? 'Saving…' : 'Save Fixture'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-200 transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Umpiring Assignments Section ───────────────────────────────────────────
const EMPTY_UMP = {
  date: '',
  time: '',
  ncb_team: 'raising-bulls',
  match_visitor: '',
  match_home: '',
  venue: '',
  division: '',
}

function UmpAssignmentForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_UMP)
  function set(field, val) { setForm((prev) => ({ ...prev, [field]: val })) }
  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent'
  const labelCls = 'block text-xs font-semibold text-gray-500 mb-1'
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Date *</label>
          <input type="date" required value={form.date} onChange={(e) => set('date', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Time</label>
          <input type="text" value={form.time} onChange={(e) => set('time', e.target.value)} placeholder="1:00 PM" className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Our Team *</label>
        <select required value={form.ncb_team} onChange={(e) => set('ncb_team', e.target.value)} className={inputCls}>
          <option value="raising-bulls">Raising Bulls</option>
          <option value="royal-bulls">Royal Bulls</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Visitor Team *</label>
          <input type="text" required value={form.match_visitor} onChange={(e) => set('match_visitor', e.target.value)} placeholder="Team A" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Home Team *</label>
          <input type="text" required value={form.match_home} onChange={(e) => set('match_home', e.target.value)} placeholder="Team B" className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Venue</label>
          <input type="text" value={form.venue} onChange={(e) => set('venue', e.target.value)} placeholder="RTP 3" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Division</label>
          <input type="text" value={form.division} onChange={(e) => set('division', e.target.value)} placeholder="D5" className={inputCls} />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-primary-dark text-accent font-semibold rounded-xl text-sm disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Assignment'}
        </button>
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-200">
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function FixturesTab() {
  const { isSuperAdmin, adminTeam } = useAuth()

  // ── Fixtures state ──
  const [teamFilter, setTeamFilter]   = useState(adminTeam ?? 'all')
  const [fixtures, setFixtures]       = useState([])
  const [loadingFix, setLoadingFix]   = useState(true)
  const [errorFix, setErrorFix]       = useState('')
  const [editingFix, setEditingFix]   = useState(null)   // null = closed, 'new' or fixture object
  const [savingFix, setSavingFix]     = useState(false)
  const [deletingFix, setDeletingFix] = useState(null)

  // ── Umpiring assignments state ──
  const [assignments, setAssignments]   = useState([])
  const [loadingUmp, setLoadingUmp]     = useState(true)
  const [editingUmp, setEditingUmp]     = useState(null)
  const [savingUmp, setSavingUmp]       = useState(false)
  const [deletingUmp, setDeletingUmp]   = useState(null)

  const [activeSection, setActiveSection] = useState('fixtures')  // 'fixtures' | 'umpiring'

  // ── Load fixtures ──
  async function loadFixtures() {
    setLoadingFix(true)
    setErrorFix('')
    try {
      let q = supabase.from('fixtures').select('*').order('date', { ascending: true })
      const eff = isSuperAdmin ? teamFilter : adminTeam
      if (eff && eff !== 'all') q = q.eq('team', eff)
      const { data, error } = await q
      if (error) throw error
      setFixtures(data || [])
    } catch (e) {
      setErrorFix(e.message)
    } finally {
      setLoadingFix(false)
    }
  }

  async function loadAssignments() {
    setLoadingUmp(true)
    try {
      let q = supabase.from('umpiring_assignments').select('*').order('date', { ascending: true })
      const eff = isSuperAdmin ? teamFilter : adminTeam
      if (eff && eff !== 'all') q = q.eq('ncb_team', eff)
      const { data } = await q
      setAssignments(data || [])
    } finally {
      setLoadingUmp(false)
    }
  }

  useEffect(() => { loadFixtures(); loadAssignments() }, [teamFilter])

  // ── Save fixture ──
  async function saveFixture(form) {
    setSavingFix(true)
    try {
      const payload = {
        date:          form.date,
        time:          form.time || null,
        opponent:      form.opponent,
        team:          form.team,
        venue:         form.venue,
        venue_address: form.venue_address || null,
        format:        form.format || 'HT',
        type:          form.type || 'Mega Bash',
        division:      form.division || null,
        umpire1_team:  form.umpire1_team || null,
        umpire2_team:  form.umpire2_team || null,
      }
      if (editingFix === 'new') {
        const { error } = await supabase.from('fixtures').insert(payload)
        if (error) throw error
      } else {
        const { error } = await supabase.from('fixtures').update(payload).eq('id', editingFix.id)
        if (error) throw error
      }
      setEditingFix(null)
      await loadFixtures()
    } catch (e) {
      alert('Error saving fixture: ' + e.message)
    } finally {
      setSavingFix(false)
    }
  }

  async function deleteFixture(id) {
    if (!confirm('Delete this fixture? This cannot be undone.')) return
    setDeletingFix(id)
    try {
      const { error } = await supabase.from('fixtures').delete().eq('id', id)
      if (error) throw error
      await loadFixtures()
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setDeletingFix(null)
    }
  }

  // ── Save umpiring assignment ──
  async function saveAssignment(form) {
    setSavingUmp(true)
    try {
      const payload = {
        date:          form.date,
        time:          form.time || null,
        ncb_team:      form.ncb_team,
        match_visitor: form.match_visitor,
        match_home:    form.match_home,
        venue:         form.venue || null,
        division:      form.division || null,
      }
      if (editingUmp === 'new') {
        const { error } = await supabase.from('umpiring_assignments').insert(payload)
        if (error) throw error
      } else {
        const { error } = await supabase.from('umpiring_assignments').update(payload).eq('id', editingUmp.id)
        if (error) throw error
      }
      setEditingUmp(null)
      await loadAssignments()
    } catch (e) {
      alert('Error saving assignment: ' + e.message)
    } finally {
      setSavingUmp(false)
    }
  }

  async function deleteAssignment(id) {
    if (!confirm('Delete this umpiring assignment?')) return
    setDeletingUmp(id)
    try {
      const { error } = await supabase.from('umpiring_assignments').delete().eq('id', id)
      if (error) throw error
      await loadAssignments()
    } finally {
      setDeletingUmp(null)
    }
  }

  const editInitial = editingFix && editingFix !== 'new'
    ? {
        date:          editingFix.date,
        time:          editingFix.time || '',
        opponent:      editingFix.opponent,
        team:          editingFix.team,
        venue:         editingFix.venue,
        venue_address: editingFix.venue_address || '',
        format:        editingFix.format || 'HT',
        type:          editingFix.type || 'Mega Bash',
        division:      editingFix.division || '',
        umpire1_team:  editingFix.umpire1_team || '',
        umpire2_team:  editingFix.umpire2_team || '',
      }
    : null

  const umpEditInitial = editingUmp && editingUmp !== 'new'
    ? {
        date:          editingUmp.date,
        time:          editingUmp.time || '',
        ncb_team:      editingUmp.ncb_team,
        match_visitor: editingUmp.match_visitor,
        match_home:    editingUmp.match_home,
        venue:         editingUmp.venue || '',
        division:      editingUmp.division || '',
      }
    : null

  return (
    <div>
      {/* Header + team filter */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {isSuperAdmin && TEAMS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTeamFilter(t.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              teamFilter === t.id ? 'bg-primary-dark text-accent' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
        {!isSuperAdmin && (
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
            adminTeam === 'raising-bulls' ? 'bg-primary-dark text-accent' : 'bg-primary text-white'
          }`}>
            {TEAM_LABELS[adminTeam]}
          </span>
        )}
        <button onClick={() => { loadFixtures(); loadAssignments() }} className="ml-auto text-xs font-medium text-gray-500 hover:text-primary">
          ↻ Refresh
        </button>
      </div>

      {/* Section switcher */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-4">
        {[
          { id: 'fixtures',  label: '🏏 Match Fixtures' },
          { id: 'umpiring',  label: '🧢 Umpiring Duties' },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeSection === s.id ? 'bg-primary-dark text-accent' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ══ FIXTURES SECTION ══════════════════════════════════════════ */}
      {activeSection === 'fixtures' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-primary text-lg">
              Match Fixtures <span className="text-sm font-normal text-gray-400">({fixtures.length})</span>
            </h3>
            {editingFix === null && (
              <button
                onClick={() => setEditingFix('new')}
                className="flex items-center gap-2 px-4 py-2 bg-primary-dark text-accent font-semibold text-sm rounded-xl hover:bg-primary transition-all"
              >
                + Add Fixture
              </button>
            )}
          </div>

          {/* Add / Edit form */}
          <AnimatePresence>
            {editingFix !== null && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-white border border-accent/40 rounded-2xl p-6 mb-6 shadow-sm"
              >
                <h4 className="font-bold text-primary mb-4">
                  {editingFix === 'new' ? '+ Add New Fixture' : `Edit: ${editingFix.opponent} (${editingFix.date})`}
                </h4>
                <FixtureForm
                  initial={editInitial}
                  onSave={saveFixture}
                  onCancel={() => setEditingFix(null)}
                  saving={savingFix}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {errorFix && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm mb-4">{errorFix}</div>
          )}

          {loadingFix ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {fixtures.length === 0 && (
                <p className="text-center text-gray-400 py-12">No fixtures found. Add one above.</p>
              )}
              {fixtures.map((f) => {
                const past = isPast(f.date)
                const isRaising = f.team === 'raising-bulls'
                const hasUmpires = f.umpire1_team || f.umpire2_team
                return (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white border rounded-2xl overflow-hidden ${past ? 'border-gray-200 opacity-75' : 'border-gray-200 hover:border-accent/40 hover:shadow-sm'} transition-all`}
                  >
                    <div className={`px-4 py-3 flex items-center gap-3 ${isRaising ? 'bg-primary-dark' : 'bg-primary'}`}>
                      <div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isRaising ? 'bg-accent text-primary-dark' : 'bg-white/20 text-white'}`}>
                          {TEAM_LABELS[f.team]}
                        </span>
                        {f.division && (
                          <span className="ml-2 text-xs text-white/60">{f.division}</span>
                        )}
                      </div>
                      {past && <span className="text-xs text-white/40 ml-auto">Past</span>}
                    </div>
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-bold text-primary text-base">vs {f.opponent}</span>
                          <span className="text-xs text-gray-400">{f.format} · {f.type}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {formatDate(f.date)}{f.time ? ` · ${f.time}` : ''}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{f.venue}{f.venue_address ? ` — ${f.venue_address}` : ''}</p>
                        {hasUmpires && (
                          <p className="text-xs text-blue-600 mt-1.5">
                            🧢 {f.umpire1_team || '—'}{f.umpire2_team && f.umpire2_team !== f.umpire1_team ? ` & ${f.umpire2_team}` : ''}
                          </p>
                        )}
                        {!hasUmpires && (
                          <p className="text-xs text-amber-500 mt-1.5">⚠️ Umpires not assigned yet</p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => setEditingFix(f)}
                          className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteFixture(f.id)}
                          disabled={deletingFix === f.id}
                          className="px-3 py-1.5 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all disabled:opacity-50"
                        >
                          {deletingFix === f.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ UMPIRING DUTIES SECTION ═══════════════════════════════════ */}
      {activeSection === 'umpiring' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-primary text-lg">
              Umpiring Duties <span className="text-sm font-normal text-gray-400">({assignments.length})</span>
            </h3>
            {editingUmp === null && (
              <button
                onClick={() => setEditingUmp('new')}
                className="flex items-center gap-2 px-4 py-2 bg-primary-dark text-accent font-semibold text-sm rounded-xl hover:bg-primary transition-all"
              >
                + Add Duty
              </button>
            )}
          </div>

          <AnimatePresence>
            {editingUmp !== null && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-white border border-accent/40 rounded-2xl p-6 mb-6 shadow-sm"
              >
                <h4 className="font-bold text-primary mb-4">
                  {editingUmp === 'new' ? '+ Add Umpiring Duty' : 'Edit Umpiring Duty'}
                </h4>
                <UmpAssignmentForm
                  initial={umpEditInitial}
                  onSave={saveAssignment}
                  onCancel={() => setEditingUmp(null)}
                  saving={savingUmp}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {loadingUmp ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.length === 0 && (
                <p className="text-center text-gray-400 py-12">No umpiring duties found.</p>
              )}
              {assignments.map((a) => {
                const past = isPast(a.date)
                const isRaising = a.ncb_team === 'raising-bulls'
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white border rounded-2xl overflow-hidden ${past ? 'border-gray-200 opacity-75' : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'} transition-all`}
                  >
                    <div className={`px-4 py-2.5 flex items-center gap-3 ${isRaising ? 'bg-primary-dark' : 'bg-primary'}`}>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isRaising ? 'bg-accent text-primary-dark' : 'bg-white/20 text-white'}`}>
                        {TEAM_LABELS[a.ncb_team]}
                      </span>
                      <span className="text-xs text-white/60">Umpiring Duty</span>
                      {a.division && <span className="text-xs text-white/40 ml-auto">{a.division}</span>}
                    </div>
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{a.match_visitor} <span className="font-normal text-gray-400">vs</span> {a.match_home}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {formatDate(a.date)}{a.time ? ` · ${a.time}` : ''}
                          {a.venue ? ` · ${a.venue}` : ''}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => setEditingUmp(a)} className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">Edit</button>
                        <button
                          onClick={() => deleteAssignment(a.id)}
                          disabled={deletingUmp === a.id}
                          className="px-3 py-1.5 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg disabled:opacity-50"
                        >
                          {deletingUmp === a.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
