import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import fixtures from '../data/fixtures.json'

const TEAMS = [
  { id: 'all',           label: 'All Teams' },
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls',   label: 'Royal Bulls' },
]

const STATUS_COLORS = {
  in:    'bg-green-100 text-green-700',
  out:   'bg-red-100   text-red-600',
  maybe: 'bg-amber-100 text-amber-700',
}
const STATUS_EMOJI = { in: '✅', out: '❌', maybe: '🤔' }

function StatCard({ label, value, accent }) {
  return (
    <div className={`rounded-2xl p-5 text-center ${accent}`}>
      <div className="font-display font-bold text-3xl">{value}</div>
      <div className="text-sm font-medium mt-1 opacity-80">{label}</div>
    </div>
  )
}

export default function AdminDashboard() {
  const { profile } = useAuth()

  const [teamFilter, setTeamFilter]     = useState('all')
  const [allResponses, setAllResponses] = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')

  const [allowlist, setAllowlist]         = useState([])
  const [allowlistLoading, setAllowlistLoading] = useState(true)
  const [newEmail, setNewEmail]           = useState('')
  const [newName, setNewName]             = useState('')
  const [newTeam, setNewTeam]             = useState('')
  const [addingEmail, setAddingEmail]     = useState(false)
  const [addError, setAddError]           = useState('')
  const [removingEmail, setRemovingEmail] = useState(null)

  // Map fixture id → fixture object for quick lookups
  const fixtureMap = Object.fromEntries(
    fixtures.map((f) => [`${f.date}::${f.team}`, f]),
  )

  async function loadAll() {
    setLoading(true)
    setError('')
    try {
      let query = supabase
        .from('availability')
        .select('*, profiles(full_name, team, role)')
        .order('fixture_date', { ascending: true })

      if (teamFilter !== 'all') {
        query = query.eq('fixture_team', teamFilter)
      }

      const { data, error: sbErr } = await query
      if (sbErr) throw sbErr
      setAllResponses(data || [])
    } catch (err) {
      setError(err.message || 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [teamFilter])

  async function loadAllowlist() {
    setAllowlistLoading(true)
    const { data } = await supabase.from('allowed_emails').select('*').order('added_at', { ascending: false })
    setAllowlist(data || [])
    setAllowlistLoading(false)
  }

  async function handleAddEmail(e) {
    e.preventDefault()
    if (!newEmail.trim()) return
    setAddError('')
    setAddingEmail(true)
    const { error: sbErr } = await supabase.from('allowed_emails').insert({
      email: newEmail.trim().toLowerCase(),
      full_name: newName.trim() || null,
      team: newTeam || null,
    })
    if (sbErr) { setAddError(sbErr.message); setAddingEmail(false); return }
    setNewEmail(''); setNewName(''); setNewTeam('')
    setAddingEmail(false)
    loadAllowlist()
  }

  async function handleRemoveEmail(email) {
    setRemovingEmail(email)
    await supabase.from('allowed_emails').delete().eq('email', email)
    setRemovingEmail(null)
    loadAllowlist()
  }

  useEffect(() => { loadAllowlist() }, [])

  // Group responses by fixture key
  const grouped = allResponses.reduce((acc, r) => {
    const k = `${r.fixture_date}::${r.fixture_team}`
    if (!acc[k]) acc[k] = []
    acc[k].push(r)
    return acc
  }, {})

  // Summary stats
  const totalIn    = allResponses.filter((r) => r.status === 'in').length
  const totalOut   = allResponses.filter((r) => r.status === 'out').length
  const totalMaybe = allResponses.filter((r) => r.status === 'maybe').length

  return (
    <div>
      {/* Header */}
      <section className="bg-primary-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/40 rounded-full px-4 py-1.5 text-accent text-xs font-semibold mb-4">
              🔐 Admin Dashboard
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-2">
              AVAILABILITY <span className="text-accent">OVERVIEW</span>
            </h1>
            <p className="text-gray-400 text-sm">Logged in as <strong className="text-white">{profile?.full_name}</strong></p>
          </motion.div>
        </div>
      </section>

      {/* Summary stats */}
      <section className="bg-accent py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total In"    value={totalIn}    accent="bg-green-500 text-white" />
            <StatCard label="Total Maybe" value={totalMaybe} accent="bg-amber-400 text-primary-dark" />
            <StatCard label="Total Out"   value={totalOut}   accent="bg-red-500 text-white" />
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white sticky top-16 z-30 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          {TEAMS.map((t) => (
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
          <div className="ml-auto">
            <button
              onClick={loadAll}
              className="text-xs font-medium text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
            >
              ↻ Refresh
            </button>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="py-12 bg-surface min-h-[60vh]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          {loading && (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">{error}</div>
          )}

          {!loading && Object.keys(grouped).length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-lg font-medium text-gray-500">No availability responses yet.</p>
            </div>
          )}

          {!loading && Object.entries(grouped).map(([key, responses]) => {
            const [date, team] = key.split('::')
            const fixture = fixtureMap[key]
            const inList    = responses.filter((r) => r.status === 'in')
            const outList   = responses.filter((r) => r.status === 'out')
            const maybeList = responses.filter((r) => r.status === 'maybe')

            const [y, m, d] = date.split('-').map(Number)
            const dateObj   = new Date(y, m - 1, d)
            const isRaising = team === 'raising-bulls'

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
              >
                {/* Fixture header */}
                <div className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 ${isRaising ? 'bg-primary-dark' : 'bg-primary'}`}>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-1">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${isRaising ? 'bg-accent text-primary-dark' : 'bg-white/20 text-white'}`}>
                        {isRaising ? 'Raising Bulls' : 'Royal Bulls'}
                      </span>
                      {fixture && (
                        <span className="text-xs bg-white/10 text-gray-300 px-2.5 py-0.5 rounded-full">{fixture.format}</span>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-white text-xl">
                      vs {fixture?.opponent || 'Unknown'}
                    </h3>
                    <p className="text-gray-400 text-sm mt-0.5">
                      {dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      {fixture?.time && ` · ${fixture.time}`}
                    </p>
                  </div>
                  {/* Counts */}
                  <div className="flex gap-3">
                    {[
                      { label: 'In',    count: inList.length,    bg: 'bg-green-500' },
                      { label: 'Maybe', count: maybeList.length, bg: 'bg-amber-400' },
                      { label: 'Out',   count: outList.length,   bg: 'bg-red-500'   },
                    ].map((s) => (
                      <div key={s.label} className={`${s.bg} rounded-xl px-4 py-2 text-center text-white min-w-[52px]`}>
                        <div className="font-display font-bold text-xl leading-none">{s.count}</div>
                        <div className="text-xs font-medium opacity-90 mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Player list */}
                <div className="px-6 py-5">
                  {responses.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No responses yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Player</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Team</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Status</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Notes</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Updated</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {responses
                            .sort((a, b) => {
                              const order = { in: 0, maybe: 1, out: 2 }
                              return (order[a.status] ?? 3) - (order[b.status] ?? 3)
                            })
                            .map((r) => (
                              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                <td className="py-2.5 pr-4 font-medium text-gray-800">
                                  {r.profiles?.full_name || '—'}
                                </td>
                                <td className="py-2.5 pr-4 text-gray-500 text-xs">
                                  {r.profiles?.team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'}
                                </td>
                                <td className="py-2.5 pr-4">
                                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[r.status]}`}>
                                    {STATUS_EMOJI[r.status]} {r.status}
                                  </span>
                                </td>
                                <td className="py-2.5 pr-4 text-gray-400 text-xs max-w-[200px] truncate">
                                  {r.notes || '—'}
                                </td>
                                <td className="py-2.5 text-gray-400 text-xs whitespace-nowrap">
                                  {new Date(r.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Approved Players Allowlist */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display font-bold text-primary text-2xl mb-1">Approved Players</h2>
          <p className="text-sm text-gray-500 mb-6">Only emails on this list can create an account. Add players before they sign up.</p>

          {/* Add form */}
          <form onSubmit={handleAddEmail} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6">
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
              disabled={addingEmail}
              className="btn-primary text-sm px-6 py-2.5 disabled:opacity-60"
            >
              {addingEmail ? 'Adding…' : '+ Add Player'}
            </button>
          </form>

          {/* List */}
          {allowlistLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : allowlist.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No approved emails yet.</p>
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
                  {allowlist.map((row) => (
                    <tr key={row.email} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-800">{row.email}</td>
                      <td className="px-5 py-3 text-gray-600">{row.full_name || <span className="text-gray-300">—</span>}</td>
                      <td className="px-5 py-3">
                        {row.team ? (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${row.team === 'raising-bulls' ? 'bg-primary-dark text-accent' : 'bg-primary text-white'}`}>
                            {row.team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'}
                          </span>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(row.added_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleRemoveEmail(row.email)}
                          disabled={removingEmail === row.email}
                          className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-40"
                        >
                          {removingEmail === row.email ? 'Removing…' : 'Remove'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
