import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const TEAM_OPTIONS = [
  { value: 'raising-bulls', label: 'Raising Bulls' },
  { value: 'royal-bulls',   label: 'Royal Bulls' },
]

const ROLE_COLORS = {
  player: 'bg-gray-100 text-gray-600',
  admin:  'bg-accent/20 text-primary-dark',
}

export default function PlayerRosterTab() {
  const { isSuperAdmin, adminTeam } = useAuth()

  const [profiles, setProfiles]               = useState([])
  const [loading, setLoading]                 = useState(true)
  const [search, setSearch]                   = useState('')
  const [teamFilter, setTeamFilter]           = useState('all')
  const [updatingProfile, setUpdatingProfile] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleteError, setDeleteError]         = useState('')
  const [editingNameId, setEditingNameId]     = useState(null)
  const [editNameValue, setEditNameValue]     = useState('')

  async function loadProfiles() {
    setLoading(true)
    let q = supabase
      .from('profiles')
      .select('id, full_name, email, team, role, created_at')
      .order('full_name')
    const { data } = await q
    setProfiles(data || [])
    setLoading(false)
  }

  useEffect(() => { loadProfiles() }, [isSuperAdmin, adminTeam])

  async function handleProfileUpdate(id, changes) {
    // Optimistic update
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...changes } : p)))
    setUpdatingProfile(id)
    await supabase.from('profiles').update(changes).eq('id', id)
    setUpdatingProfile(null)
    loadProfiles()
  }

  async function handleDeleteConfirmed(player) {
    setConfirmDeleteId(null)
    setDeleteError('')
    setUpdatingProfile(player.id)
    const { error } = await supabase.from('profiles').delete().eq('id', player.id)
    if (error) {
      setDeleteError(`Failed to delete "${player.full_name}": ${error.message}`)
      setUpdatingProfile(null)
      loadProfiles()
      return
    }
    setProfiles((prev) => prev.filter((p) => p.id !== player.id))
    setUpdatingProfile(null)
  }

  const filtered = profiles
    .filter((p) => {
      const q = search.toLowerCase()
      const matchesSearch =
        (p.full_name || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q)
      const matchesTeam = teamFilter === 'all' || p.team === teamFilter
      return matchesSearch && matchesTeam
    })
    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="font-display font-bold text-primary text-2xl mb-1">Player Roster</h2>
        <p className="text-sm text-gray-500">
          Manage roles and team assignments for players who have created an account.
        </p>
      </div>

      {deleteError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3">
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError('')} className="text-red-400 hover:text-red-600 font-bold flex-shrink-0">✕</button>
        </div>
      )}

      {/* Team filter tags */}
      <div className="flex gap-2 mb-3">
        {[
          { value: 'all',           label: 'All' },
          { value: 'raising-bulls', label: 'Raising Bulls' },
          { value: 'royal-bulls',   label: 'Royal Bulls' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setTeamFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              teamFilter === f.value
                ? f.value === 'raising-bulls'
                  ? 'bg-primary-dark text-accent'
                  : f.value === 'royal-bulls'
                  ? 'bg-primary text-white'
                  : 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">
          {search ? 'No players match your search.' : 'No signed-up players yet.'}
        </p>
      ) : (
        <>
          {/* ── Mobile cards ── */}
          <div className="sm:hidden space-y-3">
            {filtered.map((p) => {
              const saving = updatingProfile === p.id
              return (
                <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                  {/* Name + role */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      {editingNameId === p.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editNameValue}
                            onChange={(e) => setEditNameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { handleProfileUpdate(p.id, { full_name: editNameValue }); setEditingNameId(null) }
                              if (e.key === 'Escape') setEditingNameId(null)
                            }}
                            autoFocus
                            className="text-sm font-semibold text-gray-800 border border-accent rounded-lg px-2 py-0.5 w-36 focus:outline-none focus:ring-1 focus:ring-accent"
                          />
                          <button onClick={() => { handleProfileUpdate(p.id, { full_name: editNameValue }); setEditingNameId(null) }} className="text-green-600 font-bold text-base leading-none">✓</button>
                          <button onClick={() => setEditingNameId(null)} className="text-gray-400 font-bold text-sm leading-none">✕</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingNameId(p.id); setEditNameValue(p.full_name || '') }}
                          className="font-semibold text-gray-800 text-sm hover:text-primary text-left flex items-center gap-1"
                        >
                          {p.full_name}
                          <span className="text-gray-300 text-[10px]">✏︎</span>
                        </button>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5 break-all">{p.email || '—'}</p>
                    </div>
                    {saving ? (
                      <span className="text-xs text-gray-400 italic flex-shrink-0">Saving…</span>
                    ) : p.role === 'superadmin' ? (
                      <span className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        ★ Super Admin
                      </span>
                    ) : (
                      <select
                        value={p.role}
                        onChange={(e) => handleProfileUpdate(p.id, { role: e.target.value })}
                        className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent ${ROLE_COLORS[p.role] || 'bg-gray-100 text-gray-600'}`}
                      >
                        <option value="player">Player</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </div>
                  {/* Team + joined */}
                  <div className="flex items-center justify-between gap-2">
                    {saving ? (
                      <span className="text-xs text-gray-400 italic">Saving…</span>
                    ) : (
                      <select
                        value={p.team || ''}
                        onChange={(e) => handleProfileUpdate(p.id, { team: e.target.value })}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent ${
                          p.team === 'raising-bulls'
                            ? 'bg-primary-dark text-accent'
                            : p.team === 'royal-bulls'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <option value="">No team</option>
                        {TEAM_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    )}
                    <span className="text-xs text-gray-400">
                      {p.created_at
                        ? new Date(p.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })
                        : '—'}
                    </span>
                  </div>
                  {/* Delete */}
                  {p.role !== 'superadmin' && (
                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex justify-end">
                      {confirmDeleteId === p.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDeleteConfirmed(p)}
                            className="text-xs bg-red-500 text-white px-2.5 py-1 rounded-lg hover:bg-red-600 font-medium"
                          >Yes</button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg hover:bg-gray-300 font-medium"
                          >No</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(p.id)}
                          disabled={saving}
                          className="text-[11px] font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-full transition-colors disabled:opacity-40"
                        >
                          {saving ? 'Removing…' : 'Remove from roster'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Team</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Role</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Joined</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => {
                  const saving = updatingProfile === p.id
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-800">
                        {editingNameId === p.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editNameValue}
                              onChange={(e) => setEditNameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { handleProfileUpdate(p.id, { full_name: editNameValue }); setEditingNameId(null) }
                                if (e.key === 'Escape') setEditingNameId(null)
                              }}
                              autoFocus
                              className="text-sm font-medium text-gray-800 border border-accent rounded-lg px-2 py-0.5 w-44 focus:outline-none focus:ring-1 focus:ring-accent"
                            />
                            <button onClick={() => { handleProfileUpdate(p.id, { full_name: editNameValue }); setEditingNameId(null) }} className="text-green-600 font-bold text-base leading-none">✓</button>
                            <button onClick={() => setEditingNameId(null)} className="text-gray-400 font-bold text-sm leading-none">✕</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingNameId(p.id); setEditNameValue(p.full_name || '') }}
                            className="font-medium text-gray-800 hover:text-primary text-left flex items-center gap-1 group"
                          >
                            {p.full_name}
                            <span className="text-gray-300 text-[10px] group-hover:text-gray-400">✏︎</span>
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{p.email || '—'}</td>
                      <td className="px-5 py-3">
                        {saving ? (
                          <span className="text-xs text-gray-400 italic">Saving…</span>
                        ) : (
                          <select
                            value={p.team || ''}
                            onChange={(e) => handleProfileUpdate(p.id, { team: e.target.value })}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent ${
                              p.team === 'raising-bulls'
                                ? 'bg-primary-dark text-accent'
                                : p.team === 'royal-bulls'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            <option value="">No team</option>
                            {TEAM_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {saving ? (
                          <span className="text-xs text-gray-400 italic">Saving…</span>
                        ) : p.role === 'superadmin' ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 cursor-not-allowed select-none">
                            ★ Super Admin
                          </span>
                        ) : (
                          <select
                            value={p.role}
                            onChange={(e) => handleProfileUpdate(p.id, { role: e.target.value })}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent ${ROLE_COLORS[p.role] || 'bg-gray-100 text-gray-600'}`}
                          >
                            <option value="player">Player</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {p.created_at
                          ? new Date(p.created_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.role !== 'superadmin' && (
                          confirmDeleteId === p.id ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleDeleteConfirmed(p)}
                                className="text-xs bg-red-500 text-white px-2.5 py-1 rounded-lg hover:bg-red-600 font-medium"
                              >Yes</button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-xs bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg hover:bg-gray-300 font-medium"
                              >No</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(p.id)}
                              disabled={saving}
                              className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-full transition-colors disabled:opacity-40"
                            >
                              {saving ? 'Removing…' : 'Remove'}
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
