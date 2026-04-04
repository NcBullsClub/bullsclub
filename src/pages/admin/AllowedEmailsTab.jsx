import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const TEAM_OPTIONS = [
  { value: 'raising-bulls', label: 'Raising Bulls' },
  { value: 'royal-bulls',   label: 'Royal Bulls' },
]



export default function AllowedEmailsTab() {
  const { isSuperAdmin, adminTeam } = useAuth()

  // ── Allowlist state ──────────────────────────────────────────────────────
  const [allowlist, setAllowlist]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [newEmail, setNewEmail]         = useState('')
  const [newName, setNewName]           = useState('')
  const [newTeam, setNewTeam]           = useState('')
  const [adding, setAdding]             = useState(false)
  const [addError, setAddError]         = useState('')
  const [confirmEmail, setConfirmEmail] = useState(null)
  const [removingEmail, setRemovingEmail] = useState(null)
  const [updatingTeam, setUpdatingTeam]   = useState(null)



  async function loadAllowlist() {
    setLoading(true)
    const { data } = await supabase
      .from('allowed_emails')
      .select('*')
      .order('added_at', { ascending: false })
    setAllowlist(data || [])
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
    await supabase.from('allowed_emails').delete().eq('email', email)
    setRemovingEmail(null)
    loadAllowlist()
  }

  const filtered = allowlist.filter((row) => {
    const q = search.toLowerCase()
    return (
      row.email.toLowerCase().includes(q) ||
      (row.full_name || '').toLowerCase().includes(q)
    )
  })

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
          <select
            value={newTeam}
            onChange={(e) => setNewTeam(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
          >
            <option value="">Team (optional)</option>
            <option value="raising-bulls">Raising Bulls</option>
            <option value="royal-bulls">Royal Bulls</option>
          </select>
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
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Team</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Added</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((row) => (
                <tr key={row.email} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-800">{row.email}</td>
                  <td className="px-5 py-3 text-gray-600">{row.full_name || <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-3">
                    {updatingTeam === row.email ? (
                      <span className="text-xs text-gray-400 italic">Saving…</span>
                    ) : (
                      <select
                        value={row.team || ''}
                        onChange={(e) => handleTeamChange(row.email, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent ${
                          row.team === 'raising-bulls'
                            ? 'bg-primary-dark text-accent'
                            : row.team === 'royal-bulls'
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
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmEmail(null)}
                          className="text-xs bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmEmail(row.email)}
                        disabled={removingEmail === row.email}
                        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-40"
                      >
                        {removingEmail === row.email ? 'Removing…' : 'Remove'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
