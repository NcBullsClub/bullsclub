import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const SEASON = '2026'
const SEASON_FEE = 120

const TEAMS = [
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls',   label: 'Royal Bulls'   },
]

export default function FinancesTab() {
  const { isSuperAdmin, adminTeam } = useAuth()

  const defaultTeam = isSuperAdmin ? 'raising-bulls' : adminTeam
  const [teamFilter, setTeamFilter]   = useState(defaultTeam)
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'paid' | 'unpaid'
  const [rosterPlayers, setRosterPlayers] = useState([])   // from profiles table
  const [financeMap, setFinanceMap]   = useState({})       // full_name::team → record
  const [loading, setLoading]         = useState(true)
  const [toggling, setToggling]       = useState(null)     // profile id being saved

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [{ data: profileData }, { data: finData }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, team, role')
        .order('full_name'),
      supabase
        .from('player_finances')
        .select('*')
        .eq('season', SEASON),
    ])

    setRosterPlayers(profileData || [])

    const map = {}
    ;(finData || []).forEach((r) => { map[`${r.player_name}::${r.team}`] = r })
    setFinanceMap(map)
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  function getRecord(player) {
    return financeMap[`${player.full_name}::${player.team}`] || null
  }

  async function togglePaid(player) {
    setToggling(player.id)
    const existing = getRecord(player)
    const nowPaid  = !existing?.paid

    await supabase
      .from('player_finances')
      .upsert({
        player_name: player.full_name,
        team:        player.team,
        season:      SEASON,
        amount_due:  SEASON_FEE,
        paid:        nowPaid,
        paid_at:     nowPaid ? new Date().toISOString() : null,
      }, { onConflict: 'player_name,team,season' })

    await loadAll()
    setToggling(null)
  }

  // Derived stats for the selected team
  const teamPlayers    = rosterPlayers.filter((p) => p.team === teamFilter)
  const paidCount      = teamPlayers.filter((p) => getRecord(p)?.paid).length
  const unpaidCount    = teamPlayers.length - paidCount
  const totalDue       = teamPlayers.length * SEASON_FEE
  const totalCollected = paidCount * SEASON_FEE

  // List after status filter
  const visiblePlayers = teamPlayers.filter((p) => {
    if (statusFilter === 'paid')   return !!getRecord(p)?.paid
    if (statusFilter === 'unpaid') return !getRecord(p)?.paid
    return true
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="font-display font-bold text-primary text-2xl mb-1">Finances</h2>
          <p className="text-sm text-gray-500">
            Season 2026 · Fee per player: <strong className="text-gray-700">${SEASON_FEE}</strong>
          </p>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Team filter — superAdmin only */}
        {isSuperAdmin && (
          <div className="flex gap-1.5">
            {TEAMS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTeamFilter(t.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  teamFilter === t.id
                    ? t.id === 'raising-bulls' ? 'bg-primary-dark text-accent' : 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Divider */}
        {isSuperAdmin && <span className="w-px h-5 bg-gray-200 hidden sm:block" />}

        {/* Status filter */}
        <div className="flex gap-1.5">
          {[
            { id: 'all',    label: 'All'    },
            { id: 'paid',   label: '✓ Paid',   cls: 'bg-green-600 text-white' },
            { id: 'unpaid', label: '✕ Unpaid', cls: 'bg-red-500 text-white'   },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                statusFilter === f.id
                  ? f.cls || 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Players</p>
            <p className="text-2xl font-black text-primary">{teamPlayers.length}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-green-500 mb-0.5">Paid</p>
            <p className="text-2xl font-black text-green-700">{paidCount}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-red-400 mb-0.5">Unpaid</p>
            <p className="text-2xl font-black text-red-600">{unpaidCount}</p>
          </div>
          <div className="bg-accent/10 border border-accent/30 rounded-2xl px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 mb-0.5">Collected</p>
            <p className="text-2xl font-black text-primary">
              ${totalCollected}
              <span className="text-sm font-semibold text-gray-400"> / ${totalDue}</span>
            </p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {!loading && teamPlayers.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Collection progress</span>
            <span className="font-semibold">{Math.round((paidCount / teamPlayers.length) * 100)}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
              style={{ width: `${teamPlayers.length ? (paidCount / teamPlayers.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Player list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : visiblePlayers.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          {statusFilter === 'paid' ? 'No paid players yet.' : statusFilter === 'unpaid' ? 'All players have paid!' : 'No players found.'}
        </div>
      ) : (
        <div className="space-y-2">
          {visiblePlayers.map((player) => {
            const record     = getRecord(player)
            const paid       = !!record?.paid
            const isToggling = toggling === player.id

            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                  paid ? 'bg-green-50/60 border-green-200' : 'bg-white border-gray-200'
                }`}
              >
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                  paid ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {(player.full_name || '?')[0].toUpperCase()}
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-800">{player.full_name}</span>
                    {player.role === 'admin' && (
                      <span className="text-[10px] font-bold bg-accent/20 text-primary px-1.5 py-0.5 rounded-full">Admin</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400">{player.email}</p>
                </div>

                {/* Amount + date */}
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className={`text-sm font-bold tabular-nums ${paid ? 'text-green-600' : 'text-gray-400'}`}>
                    ${SEASON_FEE}
                  </p>
                  {record?.paid_at && (
                    <p className="text-[10px] text-gray-400">
                      {new Date(record.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>

                {/* Toggle button */}
                <button
                  onClick={() => togglePaid(player)}
                  disabled={isToggling}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all disabled:opacity-50 ${
                    paid
                      ? 'bg-green-100 text-green-700 border-green-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300'
                      : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-green-50 hover:text-green-700 hover:border-green-300'
                  }`}
                >
                  {isToggling ? (
                    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : paid ? (
                    <>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Paid
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Mark Paid
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
