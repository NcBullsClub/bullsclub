import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import fixtures from '../../data/fixtures.json'

const ALL_TEAMS = [
  { id: 'all',           label: 'All Teams' },
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls',   label: 'Royal Bulls' },
]

const TEAM_OPTS = [
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls',   label: 'Royal Bulls' },
]

const STATUS_COLORS = {
  in:    'bg-green-100 text-green-700',
  out:   'bg-red-100   text-red-600',
  maybe: 'bg-amber-100 text-amber-700',
}
const STATUS_EMOJI = { in: '✅', out: '❌', maybe: '🤔' }

export default function AvailabilityTab() {
  const { isSuperAdmin, adminTeam } = useAuth()

  // team filter: superadmin can switch; admin is locked to their team
  const [teamFilter, setTeamFilter] = useState(adminTeam ?? 'all')
  const [responses, setResponses]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  const fixtureMap = Object.fromEntries(
    fixtures.map((f) => [`${f.date}::${f.team}`, f]),
  )

  async function load() {
    setLoading(true)
    setError('')
    try {
      let q = supabase
        .from('availability')
        .select('*, profiles(full_name, email, team, role)')
        .order('fixture_date', { ascending: true })

      // superadmin sees all; admin locked to their team
      const effectiveFilter = isSuperAdmin ? teamFilter : adminTeam
      if (effectiveFilter && effectiveFilter !== 'all') {
        q = q.eq('fixture_team', effectiveFilter)
      }

      const { data, error: err } = await q
      if (err) throw err
      setResponses(data || [])
    } catch (e) {
      setError(e.message || 'Failed to load.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [teamFilter])

  const grouped = responses.reduce((acc, r) => {
    const k = `${r.fixture_date}::${r.fixture_team}`
    if (!acc[k]) acc[k] = []
    acc[k].push(r)
    return acc
  }, {})

  return (
    <div>
      {/* Team filter (superadmin only) */}
      {isSuperAdmin && (
        <div className="flex items-center gap-3 mb-6">
          {ALL_TEAMS.map((t) => (
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
          <button
            onClick={load}
            className="ml-auto text-xs font-medium text-gray-500 hover:text-primary transition-colors"
          >
            ↻ Refresh
          </button>
        </div>
      )}

      {!isSuperAdmin && (
        <div className="flex items-center justify-between mb-6">
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
            adminTeam === 'raising-bulls'
              ? 'bg-primary-dark text-accent'
              : 'bg-primary text-white'
          }`}>
            {adminTeam === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'}
          </span>
          <button
            onClick={load}
            className="text-xs font-medium text-gray-500 hover:text-primary transition-colors"
          >
            ↻ Refresh
          </button>
        </div>
      )}

      {/* Content */}
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

      <div className="space-y-6">
        {!loading && Object.entries(grouped).map(([key, rows]) => {
          const [date, team] = key.split('::')
          const fixture  = fixtureMap[key]
          const inList   = rows.filter((r) => r.status === 'in')
          const outList  = rows.filter((r) => r.status === 'out')
          const maybeList = rows.filter((r) => r.status === 'maybe')

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

              <div className="px-6 py-5">
                {rows.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No responses yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Player</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Email</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Team</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Status</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Notes</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2">Updated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {rows
                          .sort((a, b) => {
                            const order = { in: 0, maybe: 1, out: 2 }
                            return (order[a.status] ?? 3) - (order[b.status] ?? 3)
                          })
                          .map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-2.5 pr-4 font-medium text-gray-800">{r.profiles?.full_name || '—'}</td>
                              <td className="py-2.5 pr-4 text-gray-500 text-xs">{r.profiles?.email || '—'}</td>
                              <td className="py-2.5 pr-4 text-gray-500 text-xs">
                                {r.profiles?.team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'}
                              </td>
                              <td className="py-2.5 pr-4">
                                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[r.status]}`}>
                                  {STATUS_EMOJI[r.status]} {r.status}
                                </span>
                              </td>
                              <td className="py-2.5 pr-4 text-gray-400 text-xs max-w-[200px] truncate">{r.notes || '—'}</td>
                              <td className="py-2.5 text-gray-400 text-xs whitespace-nowrap">
                                {new Date(r.updated_at).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                })}
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
    </div>
  )
}
