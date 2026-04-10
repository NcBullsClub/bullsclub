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
  const [mobileFormOpen, setMobileFormOpen] = useState(false)
  const [teamFilter, setTeamFilter]         = useState('all')

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
      const matchesSearch =
        row.email.toLowerCase().includes(q) ||
        (row.full_name || '').toLowerCase().includes(q)
      const matchesTeam =
        teamFilter === 'all' || row.team === teamFilter
      return matchesSearch && matchesTeam
    })
    .sort((a, b) =>
      (a.full_name || a.email).localeCompare(b.full_name || b.email)
    )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="font-display font-bold text-primary text-2xl mb-1">Approved Players</h2>
        <p className="text-sm text-gray-500 mb-3">
          Only emails on this list can create an account. Add a player's email before they sign up.
        </p>
        {!loading && (
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mt-3">
            <div className="bg-white border border-gray-200 rounded-xl p-2.5 sm:px-4 sm:py-3 text-center">
              <p className="text-xl sm:text-2xl font-black text-primary leading-none">{allowlist.length}</p>
              <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-gray-400 mt-1">Total</p>
            </div>
            <div className="bg-primary-dark border border-primary-dark rounded-xl p-2.5 sm:px-4 sm:py-3 text-center">
              <p className="text-xl sm:text-2xl font-black text-accent leading-none">{allowlist.filter(r => r.team === 'raising-bulls').length}</p>
              <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-accent/60 mt-1">Raising Bulls</p>
            </div>
            <div className="bg-primary border border-primary rounded-xl p-2.5 sm:px-4 sm:py-3 text-center">
              <p className="text-xl sm:text-2xl font-black text-white leading-none">{allowlist.filter(r => r.team === 'royal-bulls').length}</p>
              <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-white/60 mt-1">Royal Bulls</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile add form (collapsible) ── */}
      <div className="sm:hidden mb-4">
        {!mobileFormOpen ? (
          <button
            onClick={() => setMobileFormOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-dark text-accent text-sm font-bold active:opacity-80 transition-opacity"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Player
          </button>
        ) : (
          <form onSubmit={(e) => { handleAdd(e); setMobileFormOpen(false) }} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">New Player</span>
              <button type="button" onClick={() => { setMobileFormOpen(false); setAddError('') }} className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 text-lg leading-none">&times;</button>
            </div>
            <input
              type="email"
              required
              placeholder="Email *"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
            />
            <input
              type="text"
              placeholder="Full name (optional)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
            />
            <div className="flex gap-2">
              {TEAM_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setNewTeam(newTeam === t.value ? '' : t.value)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                    newTeam === t.value
                      ? t.value === 'raising-bulls'
                        ? 'bg-primary-dark text-accent border-primary-dark'
                        : 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-500 border-gray-300'
                  }`}
                >
                  {t.value === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'}
                </button>
              ))}
            </div>
            {addError && <p className="text-red-500 text-xs">{addError}</p>}
            <button
              type="submit"
              disabled={adding}
              className="w-full py-2.5 rounded-lg bg-primary-dark text-accent text-sm font-bold disabled:opacity-60 active:opacity-80 transition-opacity"
            >
              {adding ? 'Adding…' : 'Add Player'}
            </button>
          </form>
        )}
      </div>

      {/* ── Desktop add form ── */}
      <form onSubmit={handleAdd} className="hidden sm:block bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6">
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

      {/* Filters + Search */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {[
          { value: 'all',           label: 'All' },
          { value: 'raising-bulls', label: 'Raising Bulls' },
          { value: 'royal-bulls',   label: 'Royal Bulls' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setTeamFilter(f.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
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
          {/* ── Mobile cards (compact row layout) ── */}
          <div className="sm:hidden space-y-2">
            {filtered.map((row) => {
              const profile = profilesByEmail[row.email?.toLowerCase()]
              const roleMeta = ROLE_META[profile?.role] || null
              const initials = (row.full_name || row.email).charAt(0).toUpperCase()
              return (
                <div key={row.email} className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 flex items-center gap-3 shadow-sm">
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    row.team === 'raising-bulls' ? 'bg-primary-dark text-accent' :
                    row.team === 'royal-bulls'   ? 'bg-primary text-white' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {initials}
                  </div>

                  {/* Name / email / date */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="font-semibold text-gray-800 text-xs truncate leading-tight">
                        {row.full_name || <span className="text-gray-400 italic font-normal">No name</span>}
                      </p>
                      {roleMeta && (
                        <span className={`flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none ${roleMeta.className}`}>
                          {roleMeta.label}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 truncate">{row.email}</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">
                      {new Date(row.added_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Team pill */}
                  <div className="flex-shrink-0 relative">
                    {updatingTeam === row.email ? (
                      <span className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin block" />
                    ) : (
                      <>
                        <select
                          value={row.team || ''}
                          onChange={(e) => handleTeamChange(row.email, e.target.value)}
                          className={`appearance-none text-[9px] font-bold pl-2 pr-4 py-1 rounded-full cursor-pointer focus:outline-none ${
                            row.team === 'raising-bulls' ? 'bg-primary-dark text-accent' :
                            row.team === 'royal-bulls'   ? 'bg-primary text-white' :
                            'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <option value="">Assign</option>
                          {TEAM_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <svg className={`pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 ${
                          row.team === 'raising-bulls' ? 'text-accent/70' :
                          row.team === 'royal-bulls'   ? 'text-white/70' : 'text-gray-400'
                        }`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
                      </>
                    )}
                  </div>

                  {/* Remove */}
                  {confirmEmail === row.email ? (
                    <div className="flex-shrink-0 flex items-center gap-1">
                      <button onClick={handleRemoveConfirmed} className="text-[10px] bg-red-500 text-white px-2 py-1 rounded-lg font-bold">Yes</button>
                      <button onClick={() => setConfirmEmail(null)} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-semibold">No</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmEmail(row.email)}
                      disabled={removingEmail === row.email}
                      className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-red-400 active:bg-red-50 disabled:opacity-40 transition-colors"
                    >
                      {removingEmail === row.email ? (
                        <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      )}
                    </button>
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
