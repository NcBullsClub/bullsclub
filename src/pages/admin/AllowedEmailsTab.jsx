import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const TEAM_OPTIONS = [
  { value: 'raising-bulls', label: 'Raising Bulls' },
  { value: 'royal-bulls',   label: 'Royal Bulls' },
]



const ROLE_META = {
  superadmin: { label: 'Super Admin', className: 'bg-purple-100 text-purple-700 border border-purple-200' },
  admin:      { label: 'Admin',       className: 'bg-accent/20 text-primary-dark border border-accent/40' },
  player:     { label: 'Player',      className: 'bg-gray-100 text-gray-600 border border-gray-200' },
}

export default function AllowedEmailsTab({ onPlayerDeleted }) {
  const { isSuperAdmin, adminTeam } = useAuth()

  // ── Allowlist state ──────────────────────────────────────────────────────
  const [allowlist, setAllowlist]           = useState([])
  const [profilesByEmail, setProfilesByEmail] = useState({})
  const [loading, setLoading]               = useState(true)
  const [search, setSearch]                 = useState('')
  const [newEmail, setNewEmail]             = useState('')
  const [newName, setNewName]               = useState('')
  const [newTeam, setNewTeam]               = useState('')
  const [adding, setAdding]                 = useState(false)
  const [addError, setAddError]             = useState('')
  const [confirmEmail, setConfirmEmail]     = useState(null)
  const [removingEmail, setRemovingEmail]   = useState(null)
  const [updatingTeam, setUpdatingTeam]     = useState(null)

  async function loadAllowlist() {
    setLoading(true)
    const [{ data: emails }, { data: profiles }] = await Promise.all([
      supabase.from('allowed_emails').select('*').order('added_at', { ascending: false }),
      supabase.from('profiles').select('email, role'),
    ])
    setAllowlist(emails || [])
    const map = {}
    for (const p of profiles || []) if (p.email) map[p.email.toLowerCase()] = p
    setProfilesByEmail(map)
    setLoading(false)
  }

  useEffect(() => { loadAllowlist() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!newEmail.trim()) return
    setAddError('')
    setAdding(true)
    const { error } = await supabase.from('allowed_emails').insert({
      email: newEmail.trim().toLowerCase(),
      full_name: newName.trim() || null,
      team: newTeam || null,
    })
    if (error) { setAddError(error.message); setAdding(false); return }
    setNewEmail(''); setNewName(''); setNewTeam('')
    setAdding(false)
    loadAllowlist()
  }

  async function handleTeamChange(email, team) {
    setUpdatingTeam(email)
    await supabase.from('allowed_emails').update({ team: team || null }).eq('email', email)
    await supabase.from('profiles').update({ team: team || null }).eq('email', email)
    setUpdatingTeam(null)
    loadAllowlist()
  }

  async function handleRemoveConfirmed() {
    const email = confirmEmail
    setConfirmEmail(null)
    setRemovingEmail(email)
    await Promise.all([
      supabase.from('allowed_emails').delete().eq('email', email),
      supabase.from('profiles').delete().eq('email', email),
    ])
    setRemovingEmail(null)
    onPlayerDeleted?.()
    loadAllowlist()
  }

  const filtered = allowlist
    .filter((row) => {
      const q = search.toLowerCase()
      return (
        row.email.toLowerCase().includes(q) ||
        (row.full_name || '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) =>
      (a.full_name || a.email).localeCompare(b.full_name || b.email)
    )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="font-display font-bold text-primary text-2xl mb-1">Approved Players</h2>
        <p className="text-sm text-gray-500">
          Only emails on this list can create an account. Add a player's email before they sign up.
        </p>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <input
            type="email"
            required
            placeholder="player@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            type="text"
            placeholder="Full name (optional)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="flex gap-2 items-center">
            {TEAM_OPTIONS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setNewTeam(newTeam === t.value ? '' : t.value)}
                className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  newTeam === t.value
                    ? t.value === 'raising-bulls'
                      ? 'bg-primary-dark text-accent border-primary-dark'
                      : 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {addError && <p className="text-red-600 text-sm mb-2">{addError}</p>}
        <button
          type="submit"
          disabled={adding}
          className="btn-primary text-sm px-6 py-2.5 disabled:opacity-60"
        >
          {adding ? 'Adding…' : '+ Add Player'}
        </button>
      </form>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">
          {search ? 'No players match your search.' : 'No approved emails yet.'}
        </p>
      ) : (
        <>
          {/* ── Mobile cards ── */}
          <div className="sm:hidden space-y-3">
            {filtered.map((row) => {
              const profile = profilesByEmail[row.email?.toLowerCase()]
              const roleMeta = ROLE_META[profile?.role] || null
              return (
              <div key={row.email} className="bg-white border border-gray-200 rounded-2xl p-4">
                {/* Email + remove */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-semibold text-gray-800 text-sm leading-tight">
                        {row.full_name || <span className="text-gray-400 italic">No name</span>}
                      </p>
                      {roleMeta && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleMeta.className}`}>
                          {roleMeta.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 break-all">{row.email}</p>
                    {/* Team tag — tappable, opens native picker */}
                    <div className="mt-1.5 relative inline-block">
                      {updatingTeam === row.email ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">
                          <span className="w-2.5 h-2.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          Saving…
                        </span>
                      ) : (
                        <select
                          value={row.team || ''}
                          onChange={(e) => handleTeamChange(row.email, e.target.value)}
                          className={`appearance-none text-[10px] font-bold pl-2.5 pr-5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-accent ${
                            row.team === 'raising-bulls'
                              ? 'bg-primary-dark text-accent focus:ring-primary-dark'
                              : row.team === 'royal-bulls'
                              ? 'bg-primary text-white focus:ring-primary'
                              : 'bg-gray-100 text-gray-400 focus:ring-gray-300'
                          }`}
                        >
                          <option value="">＋ Assign team</option>
                          {TEAM_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      )}
                      {/* chevron icon overlay */}
                      {updatingTeam !== row.email && (
                        <svg className={`pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 ${
                          row.team ? (row.team === 'raising-bulls' ? 'text-accent/70' : 'text-white/70') : 'text-gray-400'
                        }`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  {confirmEmail === row.email ? (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={handleRemoveConfirmed}
                        className="text-xs bg-red-500 text-white px-2.5 py-1 rounded-lg hover:bg-red-600 font-medium"
                      >Yes</button>
                      <button
                        onClick={() => setConfirmEmail(null)}
                        className="text-xs bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg hover:bg-gray-300 font-medium"
                      >No</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmEmail(row.email)}
                      disabled={removingEmail === row.email}
                      className="flex-shrink-0 text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-40"
                    >{removingEmail === row.email ? 'Removing…' : 'Remove'}</button>
                  )}
                </div>
                {/* date row */}
                <div className="flex justify-end mt-2">
                  <span className="text-xs text-gray-400">
                    {new Date(row.added_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              )
            })}
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Email</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Role</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Team</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Added</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((row) => {
                  const profile = profilesByEmail[row.email?.toLowerCase()]
                  const roleMeta = ROLE_META[profile?.role] || null
                  return (
                  <tr key={row.email} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">{row.email}</td>
                    <td className="px-5 py-3 text-gray-600">{row.full_name || <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3">
                      {roleMeta ? (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${roleMeta.className}`}>
                          {roleMeta.label}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">Not signed up</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {updatingTeam === row.email ? (
                        <span className="text-xs text-gray-400 italic flex items-center gap-1">
                          <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          Saving…
                        </span>
                      ) : (
                        <select
                          value={row.team || ''}
                          onChange={(e) => handleTeamChange(row.email, e.target.value)}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent text-gray-700"
                        >
                          <option value="">No team</option>
                          {TEAM_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(row.added_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      {confirmEmail === row.email ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="text-xs text-gray-500">Remove?</span>
                          <button
                            onClick={handleRemoveConfirmed}
                            className="text-xs bg-red-500 text-white px-2.5 py-1 rounded-lg hover:bg-red-600 font-medium transition-colors"
                          >Yes</button>
                          <button
                            onClick={() => setConfirmEmail(null)}
                            className="text-xs bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                          >Cancel</button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmEmail(row.email)}
                          disabled={removingEmail === row.email}
                          className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-40"
                        >{removingEmail === row.email ? 'Removing…' : 'Remove'}</button>
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
