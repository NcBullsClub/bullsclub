import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const ROLE_META = {
  superadmin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  admin:      { label: 'Admin',       color: 'bg-accent/20 text-primary-dark border-accent/40' },
  player:     { label: 'Player',      color: 'bg-gray-100 text-gray-600 border-gray-200' },
}

const TEAM_META = {
  'raising-bulls': { label: 'Raising Bulls', color: 'bg-primary-dark text-accent' },
  'royal-bulls':   { label: 'Royal Bulls',   color: 'bg-primary text-white' },
}

function Avatar({ name, size = 'md' }) {
  const letter = (name || '?')[0].toUpperCase()
  const sz = size === 'lg' ? 'w-10 h-10 text-base' : 'w-8 h-8 text-sm'
  return (
    <div className={`${sz} rounded-full bg-primary-dark/10 text-primary-dark flex items-center justify-center font-black flex-shrink-0`}>
      {letter}
    </div>
  )
}

export default function UsersTab() {
  const { profile: myProfile } = useAuth()

  // `users` is the merged list: auth user + profile (if exists)
  const [users, setUsers]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [teamFilter, setTeamFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')

  // Inline edit state
  const [editingRole, setEditingRole]   = useState(null)
  const [editingTeam, setEditingTeam]   = useState(null)
  const [saving, setSaving]             = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting]         = useState(null)

  const [errorMsg, setErrorMsg]         = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: authUsers, error: authErr }, { data: profiles }] = await Promise.all([
      supabase.rpc('list_auth_users'),
      supabase.from('profiles').select('*'),
    ])
    if (authErr) { setErrorMsg(`Failed to load users: ${authErr.message}`); setLoading(false); return }

    // Build a profile map by id
    const profileMap = {}
    ;(profiles || []).forEach((p) => { profileMap[p.id] = p })

    // Merge: every auth user gets profile data attached (or null if soft-deleted)
    const merged = (authUsers || []).map((au) => ({
      ...au,
      profile: profileMap[au.id] || null,
      // convenience accessors used by the UI
      full_name: profileMap[au.id]?.full_name || null,
      role:      profileMap[au.id]?.role      || null,
      team:      profileMap[au.id]?.team      || null,
    }))
    setUsers(merged)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    const matchSearch = !q
      || (u.full_name || '').toLowerCase().includes(q)
      || (u.email || '').toLowerCase().includes(q)
    const matchTeam = teamFilter === 'all'
      || (teamFilter === 'no-profile' ? !u.profile : u.team === teamFilter)
    const matchRole = roleFilter === 'all'
      || (roleFilter === 'no-profile' ? !u.profile : u.role === roleFilter)
    return matchSearch && matchTeam && matchRole
  })

  async function handleRoleChange(user, newRole) {
    if (newRole === user.role) { setEditingRole(null); return }
    setSaving(user.id)
    setErrorMsg('')

    const originalRole = user.role
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: newRole } : u))

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', user.id)

    if (error) {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: originalRole } : u))
      setErrorMsg(`Failed to update role: ${error.message}`)
    }

    setSaving(null)
    setEditingRole(null)
  }

  async function handleTeamChange(user, newTeam) {
    if (newTeam === user.team) { setEditingTeam(null); return }
    setSaving(user.id)
    setErrorMsg('')

    const originalTeam = user.team
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, team: newTeam } : u))

    const { error } = await supabase
      .from('profiles')
      .update({ team: newTeam })
      .eq('id', user.id)

    if (error) {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, team: originalTeam } : u))
      setErrorMsg(`Failed to update team: ${error.message}`)
    }

    setSaving(null)
    setEditingTeam(null)
  }

  async function handleDelete(userId) {
    setDeleting(userId)
    setErrorMsg('')

    const removedUser = users.find((u) => u.id === userId)
    setUsers((prev) => prev.filter((u) => u.id !== userId))

    const { error } = await supabase.rpc('delete_auth_user', { target_user_id: userId })
    if (error) {
      console.error('delete_auth_user error:', error)
      alert(`Delete failed: ${error.message}`)
      if (removedUser) setUsers((prev) => [...prev, removedUser])
      setErrorMsg(`Failed to delete user: ${error.message}`)
    } else {
      setConfirmDelete(null)
    }

    setDeleting(null)
  }

  const totalCount      = users.length
  const playerCount     = users.filter((u) => u.role === 'player').length
  const adminCount      = users.filter((u) => u.role === 'admin').length
  const superAdminCount = users.filter((u) => u.role === 'superadmin').length
  const ghostCount      = users.filter((u) => !u.profile).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="font-display font-bold text-primary text-2xl mb-1">User Management</h2>
          <p className="text-sm text-gray-500">Manage registered members — roles, teams, passwords and access.</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
          Super Admin only
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total in Auth',    value: totalCount,      color: 'bg-gray-50 border-gray-200 text-gray-700' },
          { label: 'Active Players',   value: playerCount,     color: 'bg-blue-50 border-blue-100 text-blue-700' },
          { label: 'Admins',           value: adminCount,      color: 'bg-amber-50 border-amber-100 text-amber-700' },
          { label: 'No Profile (Ghost)', value: ghostCount,    color: 'bg-red-50 border-red-100 text-red-600' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
            <div className="text-2xl font-display font-bold">{s.value}</div>
            <div className="text-xs font-medium mt-0.5 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
        >
          <option value="all">All Teams</option>
          <option value="raising-bulls">Raising Bulls</option>
          <option value="royal-bulls">Royal Bulls</option>
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
        >
          <option value="all">All Roles</option>
          <option value="player">Player</option>
          <option value="admin">Admin</option>
          <option value="superadmin">Super Admin</option>
          <option value="no-profile">No Profile (Ghost)</option>
        </select>
      </div>

      {errorMsg && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center justify-between gap-3">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-600 font-bold text-lg leading-none">×</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No users match your filters.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => {
            const isMe           = user.id === myProfile?.id
            const isSaving       = saving === user.id
            const hasProfile     = !!user.profile
            const roleM          = ROLE_META[user.role] || ROLE_META.player
            const teamM          = TEAM_META[user.team]
            const isEditingRole  = editingRole === user.id
            const isEditingTeam  = editingTeam === user.id
            const isDeleting     = deleting === user.id
            const isConfirmDel   = confirmDelete === user.id

            return (
              <div
                key={user.id}
                className={`bg-white border rounded-2xl overflow-hidden transition-all ${
                  !hasProfile
                    ? 'border-red-200 bg-red-50/20'
                    : isMe
                    ? 'border-purple-200 bg-purple-50/20'
                    : 'border-gray-200'
                }`}
              >
                {/* Main row */}
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Info section: avatar + name/email + pills */}
                  <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
                  <Avatar name={user.full_name || user.email} size="lg" />

                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {hasProfile ? (
                        <span className="font-semibold text-sm text-gray-800 truncate">{user.full_name}</span>
                      ) : (
                        <span className="font-semibold text-sm text-red-500 truncate italic">No Profile</span>
                      )}
                      {!hasProfile && (
                        <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full border border-red-200">Removed from Roster</span>
                      )}
                      {isMe && (
                        <span className="text-[9px] font-bold bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full border border-purple-200">You</span>
                      )}
                    </div>
                    {user.email && (
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">{user.email}</p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-[10px] text-gray-300">
                        Signed up {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      {user.last_sign_in_at && (
                        <p className="text-[10px] text-gray-300">
                          · Last login {new Date(user.last_sign_in_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Role pill / inline picker — only for users with a profile */}
                  <div className="flex-shrink-0">
                    {!hasProfile ? (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-red-50 text-red-400 border-red-200">No Role</span>
                    ) : isEditingRole ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {Object.entries(ROLE_META).map(([key, meta]) => (
                          <button
                            key={key}
                            disabled={isSaving}
                            onClick={() => handleRoleChange(user, key)}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all disabled:opacity-50 ${
                              user.role === key
                                ? meta.color + ' opacity-60 cursor-default'
                                : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400'
                            }`}
                          >
                            {isSaving && user.role !== key ? '…' : meta.label}
                          </button>
                        ))}
                        <button
                          onClick={() => setEditingRole(null)}
                          className="text-gray-400 hover:text-gray-600 text-xs px-1.5"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingRole(user.id); setEditingTeam(null); setConfirmDelete(null) }}
                        disabled={isMe && user.role === 'superadmin'}
                        title={isMe ? 'Cannot change your own role' : 'Change role'}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${roleM.color} ${
                          isMe && user.role === 'superadmin' ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'
                        }`}
                      >
                        {roleM.label}
                      </button>
                    )}
                  </div>

                  {/* Team pill / inline picker — only for users with a profile */}
                  <div className="flex-shrink-0">
                    {!hasProfile ? null : isEditingTeam ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {Object.entries(TEAM_META).map(([key, meta]) => (
                          <button
                            key={key}
                            disabled={isSaving}
                            onClick={() => handleTeamChange(user, key)}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all disabled:opacity-50 ${
                              user.team === key
                                ? meta.color + ' opacity-60 cursor-default'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {isSaving && user.team !== key ? '…' : meta.label}
                          </button>
                        ))}
                        <button
                          onClick={() => setEditingTeam(null)}
                          className="text-gray-400 hover:text-gray-600 text-xs px-1.5"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      teamM && (
                        <button
                          onClick={() => { setEditingTeam(user.id); setEditingRole(null); setConfirmDelete(null) }}
                          title="Change team"
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all hover:opacity-80 cursor-pointer ${teamM.color}`}
                        >
                          {teamM.label}
                        </button>
                      )
                    )}
                  </div>

                  </div>{/* end info section */}
                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 border-t border-gray-100 pt-2.5 sm:border-0 sm:pt-0 sm:flex-shrink-0 sm:ml-auto">
                    {/* Delete */}
                    {!isMe && (
                      <button
                        onClick={() => { setConfirmDelete(user.id); setEditingRole(null); setEditingTeam(null) }}
                        title="Delete profile"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border border-gray-200 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Delete confirmation */}
                {isConfirmDel && (
                  <div className="border-t border-red-100 bg-red-50 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-red-700">
                        Delete {user.full_name || user.email}?
                      </p>
                      <p className="text-xs text-red-500 mt-0.5">
                        {hasProfile
                          ? 'This permanently deletes their account from both the app and Supabase Authentication. They will no longer be able to log in. This cannot be undone.'
                          : 'This ghost account has no profile but still blocks re-signup. Deleting it will permanently remove them from Supabase Authentication and allow them to sign up fresh.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={isDeleting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white transition-all disabled:opacity-60"
                      >
                        {isDeleting ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                        Yes, Delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Footer note */}
      <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
        <p className="text-xs text-amber-700">
          <strong>Note:</strong> Deleting a user here permanently removes them from both the app and Supabase Authentication — they will no longer be able to log in.
          This action cannot be undone.
        </p>
      </div>
    </div>
  )
}
