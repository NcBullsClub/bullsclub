import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const PLAYER_ROLES = [
  'Batsman',
  'Bowler',
  'All-Rounder',
  'Wicket-Keeper Batsman',
  'Wicket-Keeper',
]

const TEAMS = [
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls',   label: 'Royal Bulls' },
]

function teamLabel(t) {
  return t === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'
}

const EMPTY_FORM = {
  name: '', team: 'raising-bulls', role: 'Batsman', captain: false, nationality: 'India', display_order: 99,
}

export default function PlayersTab() {
  const { isSuperAdmin, adminTeam } = useAuth()

  const [teamFilter, setTeamFilter] = useState(adminTeam ?? 'raising-bulls')
  const [players, setPlayers]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  // Add form
  const [showAddForm, setShowAddForm]   = useState(false)
  const [addForm, setAddForm]           = useState({ ...EMPTY_FORM, team: adminTeam ?? 'raising-bulls' })
  const [adding, setAdding]             = useState(false)
  const [addError, setAddError]         = useState('')

  // Edit
  const [editingId, setEditingId]       = useState(null)
  const [editForm, setEditForm]         = useState({})
  const [saving, setSaving]             = useState(false)
  const [editError, setEditError]       = useState('')

  // Delete
  const [deletingId, setDeletingId]     = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  async function loadPlayers() {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase
      .from('players')
      .select('*')
      .eq('team', teamFilter)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })
    if (err) { setError(err.message); setLoading(false); return }
    setPlayers(data || [])
    setLoading(false)
  }

  useEffect(() => { loadPlayers() }, [teamFilter])

  // ── Add ──────────────────────────────────────────────────────────────────────
  async function handleAdd(e) {
    e.preventDefault()
    setAdding(true)
    setAddError('')
    const { error: err } = await supabase.from('players').insert({
      name:          addForm.name.trim(),
      team:          isSuperAdmin ? addForm.team : adminTeam,
      role:          addForm.role,
      captain:       addForm.captain,
      nationality:   addForm.nationality.trim() || 'India',
      display_order: Number(addForm.display_order) || 99,
    })
    if (err) { setAddError(err.message); setAdding(false); return }
    setAddForm({ ...EMPTY_FORM, team: isSuperAdmin ? addForm.team : adminTeam })
    setShowAddForm(false)
    setAdding(false)
    loadPlayers()
  }

  // ── Edit ─────────────────────────────────────────────────────────────────────
  function startEdit(player) {
    setEditingId(player.id)
    setEditForm({
      name:          player.name,
      role:          player.role,
      captain:       player.captain,
      nationality:   player.nationality,
      display_order: player.display_order,
    })
    setEditError('')
  }

  async function handleSaveEdit(id) {
    setSaving(true)
    setEditError('')
    const { error: err } = await supabase
      .from('players')
      .update({
        name:          editForm.name.trim(),
        role:          editForm.role,
        captain:       editForm.captain,
        nationality:   editForm.nationality.trim() || 'India',
        display_order: Number(editForm.display_order) || 99,
      })
      .eq('id', id)
    if (err) { setEditError(err.message); setSaving(false); return }
    setEditingId(null)
    setSaving(false)
    loadPlayers()
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  async function handleDelete(id) {
    setDeletingId(id)
    await supabase.from('players').delete().eq('id', id)
    setDeletingId(null)
    setConfirmDeleteId(null)
    loadPlayers()
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="font-display font-bold text-primary text-2xl mb-1">Player Roster</h2>
          <p className="text-sm text-gray-500">Add, edit, or remove players team-wise.</p>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="btn-primary text-sm px-5 py-2.5"
        >
          {showAddForm ? '✕ Cancel' : '+ Add Player'}
        </button>
      </div>

      {/* Team filter — superadmin only */}
      {isSuperAdmin ? (
        <div className="flex gap-2 mb-6">
          {TEAMS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTeamFilter(t.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                teamFilter === t.id
                  ? 'bg-primary-dark text-accent'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="mb-6">
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
            adminTeam === 'raising-bulls' ? 'bg-primary-dark text-accent' : 'bg-primary text-white'
          }`}>
            {teamLabel(adminTeam)}
          </span>
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <form
          onSubmit={handleAdd}
          className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6 space-y-4"
        >
          <h3 className="font-semibold text-gray-700 text-sm">New Player</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input
              required
              placeholder="Full name *"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            {isSuperAdmin && (
              <select
                value={addForm.team}
                onChange={(e) => setAddForm((f) => ({ ...f, team: e.target.value }))}
                className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
              >
                {TEAMS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            )}
            <select
              value={addForm.role}
              onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
              className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
            >
              {PLAYER_ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
            <input
              placeholder="Nationality"
              value={addForm.nationality}
              onChange={(e) => setAddForm((f) => ({ ...f, nationality: e.target.value }))}
              className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              type="number"
              placeholder="Display order (1 = first)"
              value={addForm.display_order}
              onChange={(e) => setAddForm((f) => ({ ...f, display_order: e.target.value }))}
              className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={addForm.captain}
                onChange={(e) => setAddForm((f) => ({ ...f, captain: e.target.checked }))}
                className="accent-accent w-4 h-4"
              />
              Captain
            </label>
          </div>
          {addError && <p className="text-red-600 text-sm">{addError}</p>}
          <button type="submit" disabled={adding} className="btn-primary text-sm px-6 py-2.5 disabled:opacity-60">
            {adding ? 'Adding…' : 'Add Player'}
          </button>
        </form>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm mb-4">{error}</div>
      )}

      {/* Player list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">👤</div>
          <p className="font-medium text-gray-500">No players in this team yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">#</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Role</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Nationality</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Captain</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {players.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  {editingId === p.id ? (
                    <>
                      <td className="px-5 py-3">
                        <input
                          type="number"
                          value={editForm.display_order}
                          onChange={(e) => setEditForm((f) => ({ ...f, display_order: e.target.value }))}
                          className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <input
                          value={editForm.name}
                          onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent w-full max-w-[180px]"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                          className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          {PLAYER_ROLES.map((r) => <option key={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <input
                          value={editForm.nationality}
                          onChange={(e) => setEditForm((f) => ({ ...f, nationality: e.target.value }))}
                          className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent w-full max-w-[120px]"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="checkbox"
                          checked={editForm.captain}
                          onChange={(e) => setEditForm((f) => ({ ...f, captain: e.target.checked }))}
                          className="accent-accent w-4 h-4"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          {editError && (
                            <span className="text-red-500 text-xs mr-2">{editError}</span>
                          )}
                          <button
                            onClick={() => handleSaveEdit(p.id)}
                            disabled={saving}
                            className="text-xs bg-accent text-primary-dark font-semibold px-3 py-1.5 rounded-lg hover:bg-accent/90 disabled:opacity-60"
                          >
                            {saving ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3 text-gray-400 text-xs">{p.display_order}</td>
                      <td className="px-5 py-3 font-semibold text-gray-800">
                        {p.name}
                        {p.captain && (
                          <span className="ml-2 text-xs bg-accent text-primary-dark font-bold px-2 py-0.5 rounded-full">C</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-600 text-xs">{p.role}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{p.nationality}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{p.captain ? '✓' : '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3 justify-end">
                          <button
                            onClick={() => startEdit(p)}
                            className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                          >
                            Edit
                          </button>
                          {confirmDeleteId === p.id ? (
                            <span className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Sure?</span>
                              <button
                                onClick={() => handleDelete(p.id)}
                                disabled={deletingId === p.id}
                                className="text-xs text-red-600 font-semibold hover:text-red-800 disabled:opacity-40"
                              >
                                {deletingId === p.id ? 'Deleting…' : 'Yes, delete'}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-xs text-gray-400 hover:text-gray-600"
                              >
                                No
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(p.id)}
                              className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
