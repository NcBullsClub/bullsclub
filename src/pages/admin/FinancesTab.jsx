import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { SEASONS } from '../../config/seasons'

const SEASON_FEE = 120

const TEAMS = [
  { id: 'all',           label: 'All Teams'    },
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls',   label: 'Royal Bulls'   },
]

const EXPENSE_CATS = [
  { id: 'drinks',       label: 'Drinks',       icon: '💧' },
  { id: 'snacks',       label: 'Snacks',        icon: '🍌' },
  { id: 'food',         label: 'Food',          icon: '🍕' },
  { id: 'equipment',    label: 'Equipment',     icon: '🏏' },
  { id: 'registration', label: 'Registration',  icon: '📋' },
  { id: 'umpiring',     label: 'Umpiring',      icon: '🧑‍⚖️' },
  { id: 'other',        label: 'Other',         icon: '📦' },
]

function getFinanceSeasonIds(seasonId) {
  if (seasonId === 'mega-bash-26') return ['mega-bash-26', 'mega-smash-26', '2026']
  return [seasonId]
}

/* ══════════════════════════════════════════════════════
   Season Fees Panel
══════════════════════════════════════════════════════ */
function SeasonFeesPanel({ rosterPlayers, financeMap, loading, getRecord, togglePaid, toggling }) {
  const [teamFilter, setTeamFilter]     = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery]   = useState('')
  const [confirmToggleId, setConfirmToggleId] = useState(null)

  const teamPlayers    = teamFilter === 'all'
    ? rosterPlayers
    : rosterPlayers.filter((p) => p.team === teamFilter)
  const paidCount      = teamPlayers.filter((p) => getRecord(p)?.paid).length
  const unpaidCount    = teamPlayers.length - paidCount
  const totalDue       = teamPlayers.length * SEASON_FEE
  const totalCollected = paidCount * SEASON_FEE

  const visiblePlayers = teamPlayers
    .filter((p) => {
      if (statusFilter === 'paid')   return !!getRecord(p)?.paid
      if (statusFilter === 'unpaid') return !getRecord(p)?.paid
      return true
    })
    .filter((p) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        (p.full_name || '').toLowerCase().includes(q) ||
        (p.email     || '').toLowerCase().includes(q)
      )
    })

  return (
    <div>
      {/* Stats cards */}
      {!loading && (
        <div className="grid grid-cols-4 gap-1.5 sm:gap-3 mb-4">
          <div className="bg-white border border-gray-200 rounded-xl p-2.5 sm:px-4 sm:py-3 text-center">
            <p className="text-xl sm:text-2xl font-black text-primary leading-none">{teamPlayers.length}</p>
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-gray-400 mt-1">Players</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 sm:px-4 sm:py-3 text-center">
            <p className="text-xl sm:text-2xl font-black text-green-700 leading-none">{paidCount}</p>
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-green-500 mt-1">Paid</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 sm:px-4 sm:py-3 text-center">
            <p className="text-xl sm:text-2xl font-black text-red-600 leading-none">{unpaidCount}</p>
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-red-400 mt-1">Unpaid</p>
          </div>
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-2.5 sm:px-4 sm:py-3 text-center">
            <p className="text-xl sm:text-2xl font-black text-primary leading-none truncate">${totalCollected}</p>
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-amber-600 mt-1 truncate">of ${totalDue}</p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {!loading && teamPlayers.length > 0 && (
        <div className="mb-4">
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

      {/* Filters */}
      <div className="mb-5 space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {TEAMS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTeamFilter(t.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                teamFilter === t.id
                  ? t.id === 'raising-bulls' ? 'bg-primary-dark text-accent'
                    : t.id === 'royal-bulls' ? 'bg-primary text-white'
                    : 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 active:bg-gray-200'
              }`}
            >
              <span className="sm:hidden">
                {t.id === 'all' ? 'All' : t.id === 'raising-bulls' ? 'Raising' : 'Royal'}
              </span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
          <span className="w-px h-4 bg-gray-300 flex-shrink-0 mx-0.5" />
          {[
            { id: 'all',    label: 'All',    cls: 'bg-gray-800 text-white'  },
            { id: 'paid',   label: '✓ Paid', cls: 'bg-green-600 text-white' },
            { id: 'unpaid', label: '✕ Due',  cls: 'bg-red-500 text-white'   },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === f.id ? f.cls : 'bg-gray-100 text-gray-500 active:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search player name or email…"
            className="w-full pl-9 pr-8 py-2 rounded-full text-xs border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">✕</button>
          )}
        </div>
      </div>

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
            const isConfirm  = confirmToggleId === player.id
            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                  paid ? 'bg-green-50/60 border-green-200' : 'bg-white border-gray-200'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                  paid ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {(player.full_name || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-800">{player.full_name}</span>
                    {player.role === 'admin' && (
                      <span className="text-[10px] font-bold bg-accent/20 text-primary px-1.5 py-0.5 rounded-full">Admin</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400">{player.email}</p>
                  {record?.updated_by && record?.updated_at && (
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {record.updated_by} marked as {record.paid ? 'paid' : 'unpaid'} on {new Date(record.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className={`text-sm font-bold tabular-nums ${paid ? 'text-green-600' : 'text-gray-400'}`}>${SEASON_FEE}</p>
                  {record?.paid_at && (
                    <p className="text-[10px] text-gray-400">
                      Paid {new Date(record.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>

                {/* Confirm flow */}
                {isConfirm ? (
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <p className="text-[10px] text-gray-500 whitespace-nowrap">
                      {paid ? 'Mark as unpaid?' : 'Mark as paid?'}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => { setConfirmToggleId(null); togglePaid(player) }}
                        disabled={isToggling}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white transition-colors disabled:opacity-50 ${
                          paid ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'
                        }`}
                      >
                        {isToggling
                          ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        }
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmToggleId(null)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                      >
                        No
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmToggleId(player.id)}
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
                      <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Paid</>
                    ) : (
                      <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Mark Paid</>
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   Expenses Panel
══════════════════════════════════════════════════════ */
const EMPTY_FORM = {
  paid_by:      '',
  amount:       '',
  category:     'drinks',
  description:  '',
  expense_date: new Date().toISOString().split('T')[0],
  team:         'raising-bulls',
  split_enabled: false,
  split_mode:    'equal',
  split_type:    'team_due',
}

function ExpensesPanel({ rosterPlayers, currentUserName, seasonId }) {
  const [expenses, setExpenses]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [teamFilter, setTeamFilter]     = useState('all')
  const [showForm, setShowForm]         = useState(false)
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [saving, setSaving]             = useState(false)
  const [deletingId, setDeletingId]     = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [editingId, setEditingId]       = useState(null)
  const [editAmount, setEditAmount]     = useState('')
  const [updatingId, setUpdatingId]     = useState(null)
  const [editingTeamId, setEditingTeamId] = useState(null)
  const [editTeam, setEditTeam]         = useState('')
  const [updatingTeamId, setUpdatingTeamId] = useState(null)
  const [settlingId, setSettlingId]     = useState(null)
  const [editingDescId, setEditingDescId] = useState(null)
  const [editDesc, setEditDesc]         = useState('')
  const [updatingDescId, setUpdatingDescId] = useState(null)
  const [splitTargets, setSplitTargets] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    const seasonIds = getFinanceSeasonIds(seasonId)

    try {
      if (seasonId === 'mega-bash-26') {
        await supabase
          .from('team_expenses')
          .update({ season: seasonId })
          .eq('season', 'mega-smash-26')
          .is('deleted_at', null)
      }

      const { data } = await supabase
        .from('team_expenses')
        .select('*')
        .in('season', seasonIds)
        .is('deleted_at', null)
        .order('expense_date', { ascending: false })

      setExpenses(data || [])
    } finally {
      setLoading(false)
    }
  }, [seasonId])

  const splitCandidatePlayers = rosterPlayers.filter((p) => {
    if (!['raising-bulls', 'royal-bulls'].includes(p.team)) return false
    if (form.team === 'both') return true
    return p.team === form.team
  })

  useEffect(() => { load() }, [load])

  const filtered    = teamFilter === 'all' ? expenses : expenses.filter((e) => e.team === teamFilter)
  const totalSpent  = filtered.reduce((sum, e) => sum + Number(e.amount), 0)
  const entryCount  = filtered.length

  // Top contributor
  const byPayer = {}
  filtered.forEach((e) => { byPayer[e.paid_by] = (byPayer[e.paid_by] || 0) + Number(e.amount) })
  const [topName, topAmt] = Object.entries(byPayer).sort((a, b) => b[1] - a[1])[0] ?? ['—', 0]

  // Category totals for breakdown
  const byCat = {}
  EXPENSE_CATS.forEach((c) => { byCat[c.id] = 0 })
  filtered.forEach((e) => { byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount) })

  async function handleAdd(ev) {
    ev.preventDefault()
    if (!form.paid_by || !form.amount || isNaN(parseFloat(form.amount))) return
    if (form.split_enabled && splitTargets.length === 0) return
    setSaving(true)
    const totalAmount = parseFloat(parseFloat(form.amount).toFixed(2))
    const nowIso = new Date().toISOString()
    const { data: expenseRow } = await supabase.from('team_expenses').insert({
      season:       seasonId,
      team:         form.team,
      paid_by:      form.paid_by,
      amount:       totalAmount,
      category:     form.category,
      description:  form.description.trim() || null,
      expense_date: form.expense_date,
      created_by:   currentUserName || 'Admin',
      created_at:   nowIso,
    }).select('*').single()

    if (form.split_enabled && splitTargets.length > 0) {
      const eachAmount = form.split_mode === 'equal'
        ? Number((totalAmount / splitTargets.length).toFixed(2))
        : totalAmount

      const rows = splitTargets
        .map((id) => rosterPlayers.find((p) => p.id === id))
        .filter(Boolean)
        .map((p) => ({
          player_id: p.id,
          season: seasonId,
          team: p.team,
          entry_type: 'personal_due',
          amount: eachAmount,
          description: form.description?.trim()
            ? `${form.description.trim()} · split from ${form.category} expense`
            : `Split ${form.category} expense (${form.paid_by})`,
          is_team_amount: form.split_type === 'team_due',
          can_self_mark_paid: form.split_type !== 'team_due',
          paid: false,
          added_by_user_id: null,
          added_by_name: currentUserName || 'Admin',
          source_expense_id: expenseRow?.id || null,
          created_at: nowIso,
          updated_at: nowIso,
        }))

      if (rows.length > 0) {
        await supabase.from('player_finance_entries').insert(rows)
      }
    }

    load()
    setSaving(false)
    setShowForm(false)
    setForm(EMPTY_FORM)
    setSplitTargets([])
  }

  async function handleDelete(id) {
    setDeletingId(id)
    await supabase
      .from('team_expenses')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    load()
    setDeletingId(null)
    setConfirmDeleteId(null)
  }

  async function handleUpdateAmount(id) {
    const val = parseFloat(editAmount)
    if (isNaN(val) || val <= 0) return
    setUpdatingId(id)
    await supabase
      .from('team_expenses')
      .update({ amount: parseFloat(val.toFixed(2)) })
      .eq('id', id)
    load()
    setUpdatingId(null)
    setEditingId(null)
    setEditAmount('')
  }

  async function handleUpdateDesc(id) {
    setUpdatingDescId(id)
    await supabase
      .from('team_expenses')
      .update({ description: editDesc.trim() || null })
      .eq('id', id)
    load()
    setUpdatingDescId(null)
    setEditingDescId(null)
    setEditDesc('')
  }

  async function handleUpdateTeam(id) {
    if (!editTeam) return
    setUpdatingTeamId(id)
    await supabase
      .from('team_expenses')
      .update({ team: editTeam })
      .eq('id', id)
    load()
    setUpdatingTeamId(null)
    setEditingTeamId(null)
    setEditTeam('')
  }

  async function handleToggleSettled(id, isSettled) {
    setSettlingId(id)
    await supabase
      .from('team_expenses')
      .update({ settled_at: isSettled ? null : new Date().toISOString() })
      .eq('id', id)
    load()
    setSettlingId(null)
  }

  return (
    <div>
      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mb-4">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-2.5 sm:px-4 sm:py-3 text-center">
            <p className="text-xl sm:text-2xl font-black text-orange-700 leading-none">${totalSpent.toFixed(2)}</p>
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-orange-500 mt-1">Total Spent</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-2.5 sm:px-4 sm:py-3 text-center">
            <p className="text-xl sm:text-2xl font-black text-primary leading-none">{entryCount}</p>
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-gray-400 mt-1">Entries</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-2.5 sm:px-4 sm:py-3 text-center overflow-hidden">
            <p className="text-sm sm:text-base font-black text-purple-700 leading-none truncate">{topName}</p>
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-purple-400 mt-1">Top Payer</p>
            {topAmt > 0 && <p className="text-[9px] text-purple-500 font-semibold">${topAmt.toFixed(2)}</p>}
          </div>
        </div>
      )}

      {/* Category breakdown mini-bar */}
      {!loading && entryCount > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-3 mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">By Category</p>
          <div className="space-y-1.5">
            {EXPENSE_CATS.filter((c) => byCat[c.id] > 0).map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <span className="text-sm w-5">{c.icon}</span>
                <span className="text-xs text-gray-600 w-16 flex-shrink-0">{c.label}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-400 rounded-full"
                    style={{ width: `${totalSpent > 0 ? (byCat[c.id] / totalSpent) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-700 tabular-nums w-12 text-right">${byCat[c.id].toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team filter + Add button */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-0.5">
        {TEAMS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTeamFilter(t.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              teamFilter === t.id
                ? t.id === 'raising-bulls' ? 'bg-primary-dark text-accent'
                  : t.id === 'royal-bulls' ? 'bg-primary text-white'
                  : 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 active:bg-gray-200'
            }`}
          >
            <span className="sm:hidden">
              {t.id === 'all' ? 'All' : t.id === 'raising-bulls' ? 'Raising' : 'Royal'}
            </span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
        <button
          onClick={() => setShowForm((v) => !v)}
          className={`flex-shrink-0 ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            showForm ? 'bg-gray-200 text-gray-600' : 'bg-primary-dark text-white active:bg-primary'
          }`}
        >
          {showForm ? '✕ Cancel' : '+ Log Expense'}
        </button>
      </div>

      {/* Add expense form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4 space-y-3"
        >
          <p className="text-xs font-black uppercase tracking-widest text-orange-600 mb-2">New Expense</p>

          {/* Row 1: Who paid + Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Paid By</label>
              <select
                required
                value={form.paid_by}
                onChange={(e) => setForm((f) => ({ ...f, paid_by: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-xs border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select player…</option>
                {rosterPlayers.map((p) => (
                  <option key={p.id} value={p.full_name}>{p.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Amount ($)</label>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-xs border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Row 2: Category + Team */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-xs border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {EXPENSE_CATS.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Team</label>
              <select
                value={form.team}
                onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-xs border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="raising-bulls">Raising Bulls</option>
                <option value="royal-bulls">Royal Bulls</option>
                <option value="both">Both Teams</option>
              </select>
            </div>
          </div>

          {/* Row 3: Date + Description */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Date</label>
              <input
                required
                type="date"
                value={form.expense_date}
                onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-xs border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Description</label>
              <input
                type="text"
                placeholder="e.g. Gatorades for match"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-xs border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="border border-orange-200 bg-white rounded-xl p-3 space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={!!form.split_enabled}
                onChange={(e) => {
                  const enabled = e.target.checked
                  setForm((f) => ({ ...f, split_enabled: enabled }))
                  if (!enabled) setSplitTargets([])
                }}
                className="rounded border-gray-300"
              />
              Split this expense to selected players
            </label>

            {form.split_enabled && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Split Amount</label>
                    <select
                      value={form.split_mode}
                      onChange={(e) => setForm((f) => ({ ...f, split_mode: e.target.value }))}
                      className="w-full px-2.5 py-2 rounded-lg text-xs border border-gray-200 bg-white"
                    >
                      <option value="equal">Equal for all selected</option>
                      <option value="full">Full amount per selected</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Amount Type</label>
                    <select
                      value={form.split_type}
                      onChange={(e) => setForm((f) => ({ ...f, split_type: e.target.value }))}
                      className="w-full px-2.5 py-2 rounded-lg text-xs border border-gray-200 bg-white"
                    >
                      <option value="team_due">Owe to team (admin clears)</option>
                      <option value="personal_due">Personal due (player can self-mark)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Players ({splitTargets.length} selected)</p>
                  <div className="max-h-36 overflow-auto border border-gray-200 rounded-lg p-2 bg-gray-50 space-y-1">
                    {splitCandidatePlayers.length === 0 ? (
                      <p className="text-[11px] text-gray-400">No players for selected team.</p>
                    ) : splitCandidatePlayers.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-xs text-gray-700">
                        <input
                          type="checkbox"
                          checked={splitTargets.includes(p.id)}
                          onChange={(e) => {
                            setSplitTargets((prev) => e.target.checked
                              ? [...prev, p.id]
                              : prev.filter((id) => id !== p.id))
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="font-medium">{p.full_name}</span>
                        <span className="text-[10px] text-gray-400">{p.team === 'raising-bulls' ? 'Raising' : 'Royal'}</span>
                      </label>
                    ))}
                  </div>
                  {form.split_mode === 'equal' && splitTargets.length > 0 && (
                    <p className="text-[10px] text-gray-500 mt-1">
                      Each player gets {`$${(Number(form.amount || 0) / splitTargets.length).toFixed(2)}`} due.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-primary-dark text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
            {saving ? 'Saving…' : 'Save Expense'}
          </button>
        </form>
      )}

      {/* Expenses list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-3xl mb-2">🧾</p>
          <p className="text-gray-400 text-sm">No expenses logged yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-xs font-bold text-primary hover:text-accent transition-colors"
          >
            + Log your first expense
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => {
            const cat = EXPENSE_CATS.find((c) => c.id === e.category) || EXPENSE_CATS[4]
            const [y, m, d] = e.expense_date.split('-').map(Number)
            const dateStr = new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            const isDeleting      = deletingId === e.id
            const isConfirm      = confirmDeleteId === e.id
            const isEditing      = editingId === e.id
            const isUpdating     = updatingId === e.id
            const isEditingTeam  = editingTeamId === e.id
            const isUpdatingTeam = updatingTeamId === e.id
            const isSettled      = !!e.settled_at
            const isSettling     = settlingId === e.id

            const teamLabel =
              e.team === 'raising-bulls' ? 'Raising Bulls'
              : e.team === 'royal-bulls' ? 'Royal Bulls'
              : 'Both'
            const teamCls =
              e.team === 'raising-bulls' ? 'bg-primary-dark/10 text-primary-dark'
              : e.team === 'royal-bulls' ? 'bg-primary/10 text-primary'
              : 'bg-purple-100 text-purple-700'

            const catCls = {
              drinks:       'bg-blue-100 text-blue-700',
              snacks:       'bg-yellow-100 text-yellow-700',
              food:         'bg-orange-100 text-orange-700',
              equipment:    'bg-indigo-100 text-indigo-700',
              registration: 'bg-teal-100 text-teal-700',
              other:        'bg-gray-200 text-gray-700',
            }[e.category] || 'bg-gray-200 text-gray-700'

            return (
              <div
                key={e.id}
                className={`border rounded-2xl px-4 py-3 flex items-start transition-colors ${
                  isSettled ? 'bg-green-50/60 border-green-200' : 'bg-white border-gray-200'
                }`}
              >
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wide leading-none">paid by</span>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className="font-semibold text-sm text-gray-800">{e.paid_by}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${catCls}`}>{cat.icon} {cat.label}</span>
                    {isEditingTeam ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <select
                          autoFocus
                          value={editTeam}
                          onChange={(ev) => setEditTeam(ev.target.value)}
                          className="text-[10px] border border-accent rounded-lg px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-accent bg-white"
                        >
                          <option value="raising-bulls">Raising Bulls</option>
                          <option value="royal-bulls">Royal Bulls</option>
                          <option value="both">Both</option>
                        </select>
                        <button
                          onClick={() => handleUpdateTeam(e.id)}
                          disabled={isUpdatingTeam}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
                        >
                          {isUpdatingTeam ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          Save
                        </button>
                        <button
                          onClick={() => { setEditingTeamId(null); setEditTeam('') }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-500 text-white hover:bg-red-600 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingTeamId(e.id); setEditTeam(e.team) }}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${teamCls} hover:opacity-70 transition-opacity`}
                        title="Click to edit team"
                      >
                        {teamLabel}
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {dateStr}{isSettled && e.settled_at ? ` · Settled ${new Date(e.settled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                  </p>
                  {editingDescId === e.id ? (
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <input
                        type="text"
                        autoFocus
                        value={editDesc}
                        onChange={(ev) => setEditDesc(ev.target.value)}
                        placeholder="Add a description…"
                        className="flex-1 min-w-0 px-2 py-1 rounded-lg text-[11px] border border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <button
                        onClick={() => handleUpdateDesc(e.id)}
                        disabled={updatingDescId === e.id}
                        className="text-[10px] font-bold bg-green-100 text-green-700 hover:bg-green-200 px-2 py-0.5 rounded-md disabled:opacity-50 transition-colors"
                      >
                        {updatingDescId === e.id ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" /> : 'Save'}
                      </button>
                      <button
                        onClick={() => { setEditingDescId(null); setEditDesc('') }}
                        className="text-[10px] font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 px-2 py-0.5 rounded-md transition-colors"
                      >Cancel</button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-1 mt-1 group cursor-pointer"
                      onClick={() => { setEditingDescId(e.id); setEditDesc(e.description || '') }}
                      title="Click to edit description"
                    >
                      {e.description
                        ? <p className="text-[11px] text-gray-500 leading-snug">{e.description}</p>
                        : <p className="text-[11px] text-gray-300 leading-snug italic">Add description…</p>
                      }
                      <svg className="w-2.5 h-2.5 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </div>
                  )}
                  {e.created_by && (
                    <p className="text-[9px] text-gray-600 font-medium mt-0.5">
                      Added by {rosterPlayers.find((p) => p.email === e.created_by)?.full_name || e.created_by}
                    </p>
                  )}
                </div>

                {/* Right column: settle top, amount+delete bottom */}
                <div className="flex flex-col items-end justify-between self-stretch gap-2 flex-shrink-0">
                  {/* TOP — Settle toggle */}
                  <button
                    onClick={() => handleToggleSettled(e.id, isSettled)}
                    disabled={isSettling}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all disabled:opacity-50 ${
                      isSettled
                        ? 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700'
                        : 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700'
                    }`}
                    title={isSettled ? 'Mark as unsettled' : 'Mark as settled'}
                  >
                    {isSettling ? (
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isSettled ? (
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : null}
                    <span className="whitespace-nowrap">{isSettled ? 'Settled' : 'Need to settle'}</span>
                  </button>

                  {/* BOTTOM — Amount + Delete */}
                  <div className="flex items-center gap-2">
                    {/* Amount — inline editable */}
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">$</span>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={editAmount}
                          onChange={(ev) => setEditAmount(ev.target.value)}
                          autoFocus
                          className="w-16 px-2 py-1 rounded-lg text-xs border border-accent focus:outline-none focus:ring-2 focus:ring-accent text-right"
                        />
                        <button
                          onClick={() => handleUpdateAmount(e.id)}
                          disabled={isUpdating}
                          className="text-[10px] font-bold bg-green-100 text-green-700 hover:bg-green-200 px-2 py-0.5 rounded-md disabled:opacity-50 transition-colors"
                        >
                          {isUpdating ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" /> : 'Save'}
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setEditAmount('') }}
                          className="text-[10px] font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 px-2 py-0.5 rounded-md transition-colors"
                        >Cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingId(e.id); setEditAmount(String(Number(e.amount).toFixed(2))) }}
                        className="font-black text-base text-orange-600 tabular-nums hover:text-orange-700 transition-colors"
                        title="Click to edit amount"
                      >
                        ${Number(e.amount).toFixed(2)}
                      </button>
                    )}

                    {/* Delete / Confirm */}
                    {isConfirm ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-500 whitespace-nowrap">Delete?</span>
                        <button
                          onClick={() => handleDelete(e.id)}
                          disabled={isDeleting}
                          className="text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-full transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> : 'Yes'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[10px] font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full transition-colors"
                        >No</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(e.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-red-500 text-red-500 hover:text-white transition-all"
                        title="Delete expense"
                      >
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        </svg>
                        <span className="hidden sm:inline text-[10px] font-bold">Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   Umpiring Fees Panel
══════════════════════════════════════════════════════ */
const UMP_FEE = 60

function parseMatchDateTime(dateStr, timeStr) {
  if (!dateStr) return null
  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) return null

  const dt = new Date(year, month - 1, day, 23, 59, 59, 999)
  if (!timeStr) return dt

  const cleaned = String(timeStr).trim().toUpperCase()
  const m = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/)
  if (!m) return dt

  let hour = Number(m[1])
  const min = Number(m[2] || '0')
  const ampm = m[3]
  if (ampm === 'AM' && hour === 12) hour = 0
  if (ampm === 'PM' && hour !== 12) hour += 12
  dt.setHours(hour, min, 0, 0)
  return dt
}

function UmpFeesPanel({ rosterPlayers, seasonId, currentUserName }) {
  const [teamFilter, setTeamFilter] = useState('all')
  const [assignments, setAssignments] = useState([])
  const [availability, setAvailability] = useState([])
  const [feeRecords, setFeeRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)               // `${userId}::${assignmentId}`
  const [confirmPay, setConfirmPay] = useState(null)         // `${userId}::${assignmentId}`
  const [confirmUncomplete, setConfirmUncomplete] = useState(null) // `${userId}::${assignmentId}`
  const [savingUncomplete, setSavingUncomplete]   = useState(null) // `${userId}::${assignmentId}`
  const [confirmCarryForward, setConfirmCarryForward] = useState(null) // `${userId}::${assignmentId}`
  const [carryForwardSeason, setCarryForwardSeason]   = useState('')   // target season id
  const [savingCarryForward, setSavingCarryForward]   = useState(null) // `${userId}::${assignmentId}`
  const [expanded, setExpanded] = useState({})               // playerId -> open/close
  const [markingComplete, setMarkingComplete] = useState(null) // playerId whose picker is open
  const [savingComplete, setSavingComplete]   = useState(null) // `${playerId}::${assignmentId}`
  const [reassigning, setReassigning]         = useState(null) // `${userId}::${assignmentId}`
  const [savingReassign, setSavingReassign]   = useState(null) // `${userId}::${oldId}::${newId}`

  const load = useCallback(async () => {
    setLoading(true)
    const seasonIds = getFinanceSeasonIds(seasonId)

    if (seasonId === 'mega-bash-26') {
      await supabase
        .from('umpiring_fees')
        .update({ season: seasonId })
        .eq('season', 'mega-smash-26')
    }

    const seasonDef = SEASONS.find((s) => s.id === seasonId)
    let assignmentsQ = supabase.from('umpiring_assignments').select('*').order('date')
    if (seasonDef?.startDate) assignmentsQ = assignmentsQ.gte('date', seasonDef.startDate)
    if (seasonDef?.endDate)   assignmentsQ = assignmentsQ.lte('date', seasonDef.endDate)
    const [{ data: assgn }, { data: avail }, { data: fees }] = await Promise.all([
      assignmentsQ,
      supabase.from('umpiring_availability').select('*').eq('status', 'in'),
      supabase.from('umpiring_fees').select('*').in('season', seasonIds),
    ])
    const assignmentsData = assgn || []
    const availabilityData = avail || []
    let feeData = fees || []

    const now = new Date()
    const nowIso = now.toISOString()
    const elapsedSet = new Set(
      assignmentsData
        .filter((a) => {
          const dt = parseMatchDateTime(a.date, a.time)
          return dt && dt <= now
        })
        .map((a) => a.id)
    )
    const feeKeySet = new Set(feeData.map((r) => `${r.user_id}::${r.umpiring_assignment_id}`))

    const missingRows = availabilityData
      .filter((av) => elapsedSet.has(av.umpiring_assignment_id))
      .map((av) => {
        const player = rosterPlayers.find((p) => p.id === av.user_id)
        if (!player) return null
        const key = `${av.user_id}::${av.umpiring_assignment_id}`
        if (feeKeySet.has(key)) return null
        const assignment = assignmentsData.find((a) => a.id === av.umpiring_assignment_id)
        const completedAt = parseMatchDateTime(assignment?.date, assignment?.time)?.toISOString() || nowIso
        return {
          user_id: av.user_id,
          player_name: player.full_name,
          team: player.team,
          umpiring_assignment_id: av.umpiring_assignment_id,
          season: seasonId,
          amount: UMP_FEE,
          paid: false,
          completion_source: 'automatic',
          completed_at: completedAt,
          updated_by: 'System',
          updated_at: nowIso,
        }
      })
      .filter(Boolean)

    if (missingRows.length > 0) {
      const { data: inserted } = await supabase
        .from('umpiring_fees')
        .upsert(missingRows, { onConflict: 'user_id,umpiring_assignment_id' })
        .select('*')
      if (inserted?.length) {
        const existingKeys = new Set(feeData.map((r) => `${r.user_id}::${r.umpiring_assignment_id}`))
        const addOnly = inserted.filter((r) => !existingKeys.has(`${r.user_id}::${r.umpiring_assignment_id}`))
        feeData = [...feeData, ...addOnly]
      }
    }

    setAssignments(assignmentsData)
    setAvailability(availabilityData)
    setFeeRecords(feeData)
    setLoading(false)
  }, [seasonId, rosterPlayers])

  useEffect(() => { load() }, [load])

  // Completed assignments are those where match time has already passed.
  const pastAssignments = assignments.filter((a) => {
    const dt = parseMatchDateTime(a.date, a.time)
    return dt && dt <= new Date()
  })
  const pastIds = new Set(pastAssignments.map((a) => a.id))

  // Map: userId -> list of past assignment ids they were 'in' for
  const completedByUser = {}
  availability.forEach((av) => {
    if (!pastIds.has(av.umpiring_assignment_id)) return
    if (!completedByUser[av.user_id]) completedByUser[av.user_id] = []
    completedByUser[av.user_id].push(av.umpiring_assignment_id)
  })

  // Fee record lookup: `userId::assignmentId` -> record
  const feeMap = {}
  feeRecords.forEach((r) => { feeMap[`${r.user_id}::${r.umpiring_assignment_id}`] = r })

  const visiblePlayers = teamFilter === 'all'
    ? rosterPlayers
    : rosterPlayers.filter((p) => p.team === teamFilter)

  const completedPlayers = visiblePlayers.filter((p) => completedByUser[p.id]?.length > 0)
  const notCompletedPlayers = visiblePlayers.filter((p) => !completedByUser[p.id]?.length)

  // Stats
  const totalAssignmentsDone = completedPlayers.reduce((s, p) => s + (completedByUser[p.id]?.length || 0), 0)
  const totalOwed = totalAssignmentsDone * UMP_FEE
  const totalPaid = feeRecords.filter((r) => r.paid).reduce((s) => s + UMP_FEE, 0)
  const totalPending = totalOwed - totalPaid

  async function togglePaid(player, assignmentId) {
    const key = `${player.id}::${assignmentId}`
    setToggling(key)
    const existing = feeMap[key]
    const now = new Date().toISOString()

    let error
    if (existing) {
      const newPaid = !existing.paid
      const newPaidAt = newPaid ? now : null
      ;({ error } = await supabase.from('umpiring_fees')
        .update({
          paid: newPaid,
          paid_at: newPaidAt,
          updated_by: currentUserName || 'Admin',
          updated_at: now,
        })
        .eq('user_id', player.id)
        .eq('umpiring_assignment_id', assignmentId))
      if (!error) {
        setFeeRecords((prev) => prev.map((r) =>
          r.user_id === player.id && r.umpiring_assignment_id === assignmentId
            ? {
              ...r,
              paid: newPaid,
              paid_at: newPaidAt,
              updated_by: currentUserName || 'Admin',
              updated_at: now,
            }
            : r
        ))
      }
    } else {
      const newRecord = {
        user_id: player.id,
        player_name: player.full_name,
        team: player.team,
        umpiring_assignment_id: assignmentId,
        season: seasonId,
        amount: UMP_FEE,
        paid: true,
        paid_at: now,
        updated_by: currentUserName || 'Admin',
        updated_at: now,
      }
      const { data: inserted, error: insertErr } = await supabase.from('umpiring_fees')
        .insert(newRecord)
        .select()
        .single()
      error = insertErr
      if (!error) {
        setFeeRecords((prev) => [...prev, inserted || { ...newRecord, id: Date.now() }])
      }
    }
    if (error) alert(`Failed to update payment: ${error.message}`)
    setToggling(null)
  }

  async function handleAdminMarkUncomplete(player, assignmentId) {
    const key = `${player.id}::${assignmentId}`
    setSavingUncomplete(key)
    const [{ error: avErr }, { error: feeErr }] = await Promise.all([
      supabase.from('umpiring_availability')
        .delete().eq('user_id', player.id).eq('umpiring_assignment_id', assignmentId),
      supabase.from('umpiring_fees')
        .delete().eq('user_id', player.id).eq('umpiring_assignment_id', assignmentId),
    ])
    if (!avErr) {
      setAvailability((prev) =>
        prev.filter((r) => !(r.user_id === player.id && r.umpiring_assignment_id === assignmentId))
      )
    }
    if (!feeErr) {
      setFeeRecords((prev) =>
        prev.filter((r) => !(r.user_id === player.id && r.umpiring_assignment_id === assignmentId))
      )
    }
    setSavingUncomplete(null)
    setConfirmUncomplete(null)
    setReassigning(null)
  }

  async function handleAdminMarkComplete(player, assignmentId) {
    const key = `${player.id}::${assignmentId}`
    setSavingComplete(key)
    const nowIso = new Date().toISOString()
    const newRow = {
      user_id: player.id,
      umpiring_assignment_id: assignmentId,
      ncb_team: player.team,
      status: 'in',
      notes: 'Admin marked',
    }
    const feeRow = {
      user_id: player.id,
      player_name: player.full_name,
      team: player.team,
      umpiring_assignment_id: assignmentId,
      season: seasonId,
      amount: UMP_FEE,
      paid: false,
      completion_source: 'admin_marked',
      completed_at: nowIso,
      updated_by: currentUserName || 'Admin',
      updated_at: nowIso,
    }
    const [{ data: upserted, error }, { data: feeUpserted, error: feeErr }] = await Promise.all([
      supabase.from('umpiring_availability')
        .upsert(newRow, { onConflict: 'user_id,umpiring_assignment_id' })
        .select()
        .single(),
      supabase.from('umpiring_fees')
        .upsert(feeRow, { onConflict: 'user_id,umpiring_assignment_id' })
        .select()
        .single(),
    ])
    if (!error) {
      setAvailability((prev) => {
        const filtered = prev.filter(
          (r) => !(r.user_id === player.id && r.umpiring_assignment_id === assignmentId)
        )
        return [...filtered, upserted || { ...newRow, id: Date.now() }]
      })
    }
    if (!feeErr) {
      setFeeRecords((prev) => {
        const filtered = prev.filter(
          (r) => !(r.user_id === player.id && r.umpiring_assignment_id === assignmentId)
        )
        return [...filtered, feeUpserted || { ...feeRow, id: Date.now() + 1 }]
      })
    }
    setSavingComplete(null)
    setMarkingComplete(null)
  }

  async function handleReassign(player, oldAssignId, newAssignId) {
    const saveKey = `${player.id}::${oldAssignId}::${newAssignId}`
    const newAssgn = assignments.find((a) => a.id === newAssignId)
    if (!newAssgn) return

    setSavingReassign(saveKey)
    try {
      const oldFee = feeMap[`${player.id}::${oldAssignId}`]

      const { error: newAvailErr } = await supabase.from('umpiring_availability').upsert(
        {
          user_id: player.id,
          umpiring_assignment_id: newAssignId,
          ncb_team: newAssgn.ncb_team || player.team,
          status: 'in',
          notes: 'Admin reassigned',
        },
        { onConflict: 'user_id,umpiring_assignment_id' }
      )
      if (newAvailErr) throw newAvailErr

      if (oldFee) {
        const { error: newFeeErr } = await supabase.from('umpiring_fees').upsert(
          {
            user_id: player.id,
            player_name: player.full_name,
            team: player.team,
            umpiring_assignment_id: newAssignId,
            season: seasonId,
            amount: UMP_FEE,
            paid: !!oldFee.paid,
            paid_at: oldFee.paid ? (oldFee.paid_at || new Date().toISOString()) : null,
            updated_by: currentUserName || 'Admin',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,umpiring_assignment_id' }
        )
        if (newFeeErr) throw newFeeErr
      }

      const { error: oldAvailErr } = await supabase.from('umpiring_availability')
        .delete().eq('user_id', player.id).eq('umpiring_assignment_id', oldAssignId)
      if (oldAvailErr) throw oldAvailErr

      const { error: oldFeeErr } = await supabase.from('umpiring_fees')
        .delete().eq('user_id', player.id).eq('umpiring_assignment_id', oldAssignId)
      if (oldFeeErr) throw oldFeeErr

      // Optimistic local state update — no full reload
      setAvailability((prev) => {
        const filtered = prev.filter(
          (r) => !(r.user_id === player.id && r.umpiring_assignment_id === oldAssignId)
        )
        return [...filtered, {
          user_id: player.id,
          umpiring_assignment_id: newAssignId,
          ncb_team: newAssgn.ncb_team || player.team,
          status: 'in',
          notes: 'Admin reassigned',
          id: Date.now(),
        }]
      })
      setFeeRecords((prev) => {
        const filtered = prev.filter(
          (r) => !(r.user_id === player.id && r.umpiring_assignment_id === oldAssignId)
        )
        if (!oldFee) return filtered
        return [...filtered, {
          ...oldFee,
          umpiring_assignment_id: newAssignId,
          id: Date.now() + 1,
        }]
      })
      setReassigning(null)
    } catch (e) {
      alert(`Error reassigning match: ${e.message || 'Unknown error'}`)
    } finally {
      setSavingReassign(null)
    }
  }

  async function handleAdminCarryForward(player, assignmentId, toSeason) {
    const feeKey = `${player.id}::${assignmentId}`
    setSavingCarryForward(feeKey)
    try {
      const fee = feeMap[feeKey]
      if (!fee) throw new Error('Fee record not found')
      const nowIso = new Date().toISOString()
      const carryAmount = Number(fee.amount || UMP_FEE)
      const carryDescription = `Umpiring due (carry forward used from ${seasonId})`

      // 1. Mark the umpiring fee as paid
      const { error: feeUpdateErr } = await supabase
        .from('umpiring_fees')
        .update({ paid: true, paid_at: nowIso, updated_by: currentUserName || 'Admin', updated_at: nowIso })
        .eq('id', fee.id)
      if (feeUpdateErr) throw feeUpdateErr

        // 2. Create player_finance_entries record in the target season (critical)
      let supportsSourceFeeColumn = true
      let existingCredit = null
      const { data: creditBySource, error: existingErr } = await supabase
        .from('player_finance_entries')
        .select('id')
        .eq('player_id', player.id)
        .eq('season', toSeason)
        .eq('source_umpiring_fee_id', fee.id)
        .maybeSingle()
      if (existingErr) {
        if ((existingErr.message || '').includes('source_umpiring_fee_id')) {
          supportsSourceFeeColumn = false
        } else {
          throw existingErr
        }
      } else {
        existingCredit = creditBySource
      }

      if (!supportsSourceFeeColumn) {
        const { data: fallbackCredits, error: fallbackErr } = await supabase
          .from('player_finance_entries')
          .select('id')
          .eq('player_id', player.id)
          .eq('season', toSeason)
          .eq('description', carryDescription)
          .order('created_at', { ascending: false })
          .limit(1)
        if (fallbackErr) throw fallbackErr
        existingCredit = fallbackCredits?.[0] || null
      }

      if (existingCredit?.id) {
        const { error: creditUpdateErr } = await supabase
          .from('player_finance_entries')
          .update({
            team: fee.team,
            entry_type: 'personal_due',
            amount: carryAmount,
            description: carryDescription,
            is_team_amount: true,
            can_self_mark_paid: false,
            paid: false,
            paid_at: null,
            paid_marked_by: null,
            added_by_name: currentUserName || 'Admin',
            updated_at: nowIso,
          })
          .eq('id', existingCredit.id)
        if (creditUpdateErr) throw creditUpdateErr
      } else {
        const insertPayload = {
          player_id: player.id,
          season: toSeason,
          team: fee.team,
          entry_type: 'personal_due',
          amount: carryAmount,
          description: carryDescription,
          is_team_amount: true,
          can_self_mark_paid: false,
          paid: false,
          added_by_user_id: null,
          added_by_name: currentUserName || 'Admin',
          created_at: nowIso,
          updated_at: nowIso,
        }
        if (supportsSourceFeeColumn) insertPayload.source_umpiring_fee_id = fee.id
        const { error: creditInsertErr } = await supabase
          .from('player_finance_entries')
          .insert(insertPayload)
        if (creditInsertErr) throw creditInsertErr
      }

        // 3. Create carry-forward request for audit trail (non-blocking —
        //    requires fix_carry_forward_admin_insert.sql to be run in Supabase)
        const cfPayload = {
          user_id: player.id,
          umpiring_fee_id: fee.id,
          from_season: seasonId,
          to_season: toSeason,
          status: 'approved',
          requested_at: nowIso,
        }
        const cfFullPayload = { ...cfPayload, reviewed_at: nowIso, reviewed_by_name: currentUserName || 'Admin' }
        const { error: cfFullErr } = await supabase
          .from('umpiring_carry_forward_requests')
          .upsert(cfFullPayload, { onConflict: 'user_id,umpiring_fee_id,to_season' })
        if (cfFullErr) {
          if ((cfFullErr.message || '').includes('reviewed_at') || (cfFullErr.message || '').includes('reviewed_by_name')) {
            // Retry without extended columns
            await supabase
              .from('umpiring_carry_forward_requests')
              .upsert(cfPayload, { onConflict: 'user_id,umpiring_fee_id,to_season' })
          }
          // Non-fatal: fee + entries already saved; admin needs to run the SQL migration for audit records
          console.warn('carry-forward audit record skipped (run fix_carry_forward_admin_insert.sql):', cfFullErr.message)
        }

        // 4. Update local fee state to reflect paid
      setFeeRecords((prev) => prev.map((r) =>
        r.user_id === player.id && r.umpiring_assignment_id === assignmentId
          ? { ...r, paid: true, paid_at: nowIso, updated_by: currentUserName || 'Admin', updated_at: nowIso }
          : r
      ))
      setConfirmCarryForward(null)
      setCarryForwardSeason('')
    } catch (e) {
      alert(`Failed to carry forward: ${e.message || 'Unknown error'}`)
    } finally {
      setSavingCarryForward(null)
    }
  }

  function formatAssignmentDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const isRaising = (p) => p.team === 'raising-bulls'

  return (
    <div>
      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-4 gap-1.5 sm:gap-3 mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 sm:px-4 sm:py-3 text-center">
            <p className="text-xl sm:text-2xl font-black text-blue-700 leading-none">{totalAssignmentsDone}</p>
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-blue-400 mt-1">Completed</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-2.5 sm:px-4 sm:py-3 text-center">
            <p className="text-xl sm:text-2xl font-black text-orange-700 leading-none">${totalOwed}</p>
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-orange-400 mt-1">Total Owed</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 sm:px-4 sm:py-3 text-center">
            <p className="text-xl sm:text-2xl font-black text-green-700 leading-none">${totalPaid}</p>
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-green-500 mt-1">Paid Out</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 sm:px-4 sm:py-3 text-center">
            <p className="text-xl sm:text-2xl font-black text-red-600 leading-none">${totalPending}</p>
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-red-400 mt-1">Pending</p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {!loading && totalOwed > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Payout progress</span>
            <span className="font-semibold">{Math.round((totalPaid / totalOwed) * 100)}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${totalOwed ? (totalPaid / totalOwed) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Team filter */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-0.5">
        {TEAMS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTeamFilter(t.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              teamFilter === t.id
                ? t.id === 'raising-bulls' ? 'bg-primary-dark text-accent'
                  : t.id === 'royal-bulls' ? 'bg-primary text-white'
                  : 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 active:bg-gray-200'
            }`}
          >
            <span className="sm:hidden">
              {t.id === 'all' ? 'All' : t.id === 'raising-bulls' ? 'Raising' : 'Royal'}
            </span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── Umpiring Completed ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100">
                <span className="text-xs">🧢</span>
              </div>
              <h3 className="font-display font-bold text-gray-800 text-sm">Umpiring Completed</h3>
              <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {completedPlayers.length} player{completedPlayers.length !== 1 ? 's' : ''}
              </span>
            </div>

            {completedPlayers.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl px-5 py-8 text-center">
                <p className="text-sm text-gray-400">No completed umpiring sessions yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {completedPlayers.map((player) => {
                  const assignIds = completedByUser[player.id] || []
                  const paidCount = assignIds.filter((aid) => feeMap[`${player.id}::${aid}`]?.paid).length
                  const allPaid = paidCount === assignIds.length
                  const totalEarned = assignIds.length * UMP_FEE
                  const isOpen = !!expanded[player.id]

                  return (
                    <div
                      key={player.id}
                      className={`border rounded-2xl overflow-hidden transition-all ${
                        allPaid ? 'border-green-200 bg-green-50/40' : 'border-blue-200 bg-white'
                      }`}
                    >
                      {/* Player header row — clickable to expand */}
                      <button
                        type="button"
                        onClick={() => setExpanded((prev) => ({ ...prev, [player.id]: !prev[player.id] }))}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.02] transition-colors"
                      >
                        {/* Avatar */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                          allPaid ? 'bg-green-500 text-white' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {(player.full_name || '?')[0].toUpperCase()}
                        </div>

                        {/* Name + team */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-gray-800">{player.full_name}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              isRaising(player) ? 'bg-primary-dark/10 text-primary-dark' : 'bg-primary/10 text-primary'
                            }`}>
                              {isRaising(player) ? 'Raising' : 'Royal'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-gray-400">
                              {assignIds.length} umpiring · ${totalEarned} earned
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              allPaid
                                ? 'bg-green-100 text-green-700'
                                : paidCount > 0
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-50 text-red-500'
                            }`}>
                              {allPaid ? '✓ All paid' : paidCount > 0 ? `${paidCount}/${assignIds.length} paid` : 'Unpaid'}
                            </span>
                          </div>
                        </div>

                        {/* Total amount + chevron */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`font-black text-base tabular-nums ${allPaid ? 'text-green-600' : 'text-blue-600'}`}>
                            ${totalEarned}
                          </span>
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {/* Expanded: per-assignment rows */}
                      {isOpen && (
                        <div className="border-t border-gray-100 divide-y divide-gray-100">
                          {assignIds.map((aid) => {
                            const assgn = assignments.find((a) => a.id === aid)
                            if (!assgn) return null
                            const feeKey = `${player.id}::${aid}`
                            const record = feeMap[feeKey]
                            const isPaid = !!record?.paid
                            const isTogglingThis = toggling === feeKey
                            const isConfirming = confirmPay === feeKey
                            const isConfirmingUndo = confirmUncomplete === feeKey
                            const isSavingUndo = savingUncomplete === feeKey
                            const isReassigningThis = reassigning === feeKey
                            const reassignTargets = pastAssignments.filter(
                              (a) => a.id !== aid && a.ncb_team === player.team && !assignIds.includes(a.id)
                            )
                            const isReassignBusy = !!savingReassign && savingReassign.startsWith(`${player.id}::${aid}::`)
                            const isConfirmingCarryFwd = confirmCarryForward === feeKey
                            const isSavingCarryFwd = savingCarryForward === feeKey
                            const nextSeasons = SEASONS.filter((s) => s.id !== seasonId)

                            return (
                              <div key={aid} className="flex items-center gap-3 px-4 py-2.5">
                                {/* Assignment info */}
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold text-gray-700 truncate">
                                    {assgn.match_visitor} <span className="font-normal text-gray-400">vs</span> {assgn.match_home}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span className="text-[10px] text-gray-400">{formatAssignmentDate(assgn.date)}</span>
                                    {assgn.venue && <span className="text-[10px] text-gray-400">· {assgn.venue}</span>}
                                    {assgn.division && (
                                      <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                                        {assgn.division.replace(/^D(\d+)$/, 'Div$1')}
                                      </span>
                                    )}
                                  </div>
                                  {isPaid && record?.paid_at && (
                                    <p className="text-[10px] text-green-600 mt-0.5">
                                      Paid {new Date(record.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </p>
                                  )}
                                  {record?.completion_source === 'automatic' && (!record?.updated_by || record.updated_by === 'System') ? (
                                    <p className="text-[10px] text-gray-500 mt-0.5">automatically completed</p>
                                  ) : record?.updated_by && record?.updated_at ? (
                                    <p className="text-[10px] text-gray-500 mt-0.5">
                                      {record.updated_by} marked as {record.paid ? 'paid' : 'unpaid'} on {new Date(record.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                  ) : null}
                                </div>

                                {/* Amount */}
                                <span className={`font-black text-sm tabular-nums flex-shrink-0 ${isPaid ? 'text-green-600' : 'text-gray-400'}`}>
                                  ${UMP_FEE}
                                </span>

                                {/* Action buttons group */}
                                <div className="flex-shrink-0 flex flex-col items-end gap-1.5">

                                  {/* Confirm pay flow / pay toggle */}
                                  {isConfirming ? (
                                    <div className="flex flex-col items-end gap-1">
                                      <p className="text-[10px] text-gray-500 whitespace-nowrap">
                                        {isPaid ? 'Mark as unpaid?' : 'Mark as paid?'}
                                      </p>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() => { setConfirmPay(null); togglePaid(player, aid) }}
                                          disabled={isTogglingThis}
                                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white transition-colors disabled:opacity-50 ${
                                            isPaid ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'
                                          }`}
                                        >
                                          {isTogglingThis
                                            ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                          }
                                          Yes
                                        </button>
                                        <button
                                          onClick={() => setConfirmPay(null)}
                                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                                        >
                                          No
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => { setReassigning(null); setConfirmUncomplete(null); setConfirmPay(feeKey) }}
                                      disabled={isTogglingThis}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all disabled:opacity-50 ${
                                        isPaid
                                          ? 'bg-green-100 text-green-700 border-green-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300'
                                          : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-green-50 hover:text-green-700 hover:border-green-300'
                                      }`}
                                    >
                                      {isTogglingThis ? (
                                        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                      ) : isPaid ? (
                                        <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Paid</>
                                      ) : (
                                        <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Mark Paid</>
                                      )}
                                    </button>
                                  )}

                                  {/* Confirm undo / move to Not Completed */}
                                  {isConfirmingUndo ? (
                                    <div className="flex flex-col items-end gap-1">
                                      <p className="text-[10px] text-gray-500 whitespace-nowrap">Move to Not Completed?</p>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() => handleAdminMarkUncomplete(player, aid)}
                                          disabled={isSavingUndo}
                                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                                        >
                                          {isSavingUndo
                                            ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                          }
                                          Yes
                                        </button>
                                        <button
                                          onClick={() => setConfirmUncomplete(null)}
                                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                                        >
                                          No
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => { setReassigning(null); setConfirmPay(null); setConfirmUncomplete(feeKey) }}
                                      disabled={isSavingUndo}
                                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-semibold border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                                    >
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                      Not Completed
                                    </button>
                                  )}

                                  {/* Reassign wrong assignment to another past match */}
                                  {isReassigningThis ? (
                                    <div className="flex flex-col items-end gap-1.5 max-w-[260px]">
                                      <p className="text-[10px] text-gray-500 whitespace-nowrap">Select the correct match</p>
                                      {reassignTargets.length === 0 ? (
                                        <p className="text-[10px] text-gray-400">No other past matches for this team.</p>
                                      ) : (
                                        <div className="w-full flex flex-col gap-1">
                                          {reassignTargets.map((target) => {
                                            const saveKey = `${player.id}::${aid}::${target.id}`
                                            const isSavingThisTarget = savingReassign === saveKey
                                            return (
                                              <button
                                                key={target.id}
                                                onClick={() => handleReassign(player, aid, target.id)}
                                                disabled={isReassignBusy}
                                                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                                              >
                                                <span className="truncate">
                                                  {formatAssignmentDate(target.date)} · {target.match_visitor} vs {target.match_home}
                                                </span>
                                                {isSavingThisTarget ? (
                                                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
                                                ) : (
                                                  <span className="text-[9px] font-bold flex-shrink-0">Assign</span>
                                                )}
                                              </button>
                                            )
                                          })}
                                        </div>
                                      )}
                                      <button
                                        onClick={() => setReassigning(null)}
                                        disabled={isReassignBusy}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-50"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => { setConfirmPay(null); setConfirmUncomplete(null); setReassigning(feeKey) }}
                                      disabled={isReassignBusy}
                                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-semibold border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all disabled:opacity-50"
                                    >
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15M4.5 12h7.5M12 19.5V12" /></svg>
                                      Reassign Match
                                    </button>
                                  )}

                                  {/* Carry Forward to next season (only for unpaid fees) */}
                                  {!isPaid && (
                                    isConfirmingCarryFwd ? (
                                      <div className="flex flex-col items-end gap-1.5 max-w-[220px]">
                                        <p className="text-[10px] text-gray-500 whitespace-nowrap">Carry forward to:</p>
                                        <select
                                          value={carryForwardSeason}
                                          onChange={(e) => setCarryForwardSeason(e.target.value)}
                                          className="w-full px-2 py-1 rounded-lg text-[10px] border border-indigo-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                        >
                                          <option value="">Select season…</option>
                                          {nextSeasons.map((s) => (
                                            <option key={s.id} value={s.id}>{s.label}</option>
                                          ))}
                                        </select>
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            onClick={() => {
                                              if (!carryForwardSeason) return
                                              handleAdminCarryForward(player, aid, carryForwardSeason)
                                            }}
                                            disabled={isSavingCarryFwd || !carryForwardSeason}
                                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                          >
                                            {isSavingCarryFwd
                                              ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                              : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            }
                                            Confirm
                                          </button>
                                          <button
                                            onClick={() => { setConfirmCarryForward(null); setCarryForwardSeason('') }}
                                            disabled={isSavingCarryFwd}
                                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-50"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => { setConfirmPay(null); setConfirmUncomplete(null); setReassigning(null); setCarryForwardSeason(''); setConfirmCarryForward(feeKey) }}
                                        disabled={isSavingCarryFwd}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-semibold border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all disabled:opacity-50"
                                      >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                        Carry Forward
                                      </button>
                                    )
                                  )}

                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Not Completed ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100">
                <span className="text-xs">⏳</span>
              </div>
              <h3 className="font-display font-bold text-gray-800 text-sm">Not Completed</h3>
              <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {notCompletedPlayers.length} player{notCompletedPlayers.length !== 1 ? 's' : ''}
              </span>
            </div>

            {notCompletedPlayers.length === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-6 text-center">
                <p className="text-sm text-green-700 font-semibold">All players have completed at least one umpiring!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notCompletedPlayers.map((player) => {
                  const isOpen = markingComplete === player.id
                  return (
                    <div
                      key={player.id}
                      className={`border rounded-2xl overflow-hidden transition-all ${
                        isOpen ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200 bg-white'
                      }`}
                    >
                      {/* Player header row */}
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 bg-gray-100 text-gray-400">
                          {(player.full_name || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-gray-700">{player.full_name}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              isRaising(player) ? 'bg-primary-dark/10 text-primary-dark' : 'bg-primary/10 text-primary'
                            }`}>
                              {isRaising(player) ? 'Raising' : 'Royal'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {isOpen ? 'Select a past assignment to mark complete' : 'No past umpiring completed'}
                          </p>
                        </div>
                        <button
                          onClick={() => setMarkingComplete(isOpen ? null : player.id)}
                          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                            isOpen
                              ? 'bg-gray-100 text-gray-500 border-gray-300'
                              : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                          }`}
                        >
                          {isOpen ? (
                            <>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                              Cancel
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              Mark Complete
                            </>
                          )}
                        </button>
                      </div>

                      {/* Expanded: past assignment picker */}
                      {isOpen && (
                        <div className="border-t border-amber-200 bg-white">
                          {(() => {
                            const teamAssignments = pastAssignments.filter((a) => a.ncb_team === player.team)
                            return teamAssignments.length === 0 ? (
                              <p className="text-xs text-gray-400 text-center py-4">No past assignments found for {player.team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'}.</p>
                            ) : (
                              <div className="divide-y divide-gray-100">
                                {teamAssignments.map((assgn) => {
                                const key = `${player.id}::${assgn.id}`
                                const isSaving = savingComplete === key
                                return (
                                  <div key={assgn.id} className="flex items-center gap-3 px-4 py-2.5">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-semibold text-gray-700 truncate">
                                        {assgn.match_visitor} <span className="font-normal text-gray-400">vs</span> {assgn.match_home}
                                      </div>
                                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <span className="text-[10px] text-gray-400">{formatAssignmentDate(assgn.date)}</span>
                                        {assgn.venue && <span className="text-[10px] text-gray-400">· {assgn.venue}</span>}
                                        {assgn.division && (
                                          <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                                            {assgn.division.replace(/^D(\d+)$/, 'Div$1')}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleAdminMarkComplete(player, assgn.id)}
                                      disabled={!!isSaving}
                                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 transition-all disabled:opacity-50"
                                    >
                                      {isSaving ? (
                                        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <>
                                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                          Mark Done
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          )
                          })()} 
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

function CarryForwardRequestsPanel({ seasonId, currentUserName }) {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [feesMap, setFeesMap] = useState({})
  const [resolvingId, setResolvingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: reqs, error: reqsErr }, { data: profiles, error: profilesErr }] = await Promise.all([
        supabase
          .from('umpiring_carry_forward_requests')
          .select('*')
          .eq('from_season', seasonId)
          .order('requested_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, full_name, team'),
      ])
      if (reqsErr) throw reqsErr
      if (profilesErr) throw profilesErr

      const feeIds = [...new Set((reqs || []).map((r) => r.umpiring_fee_id).filter(Boolean))]
      let fees = []
      if (feeIds.length > 0) {
        const { data: feeRows, error: feesErr } = await supabase
          .from('umpiring_fees')
          .select('*')
          .in('id', feeIds)
        if (feesErr) throw feesErr
        fees = feeRows || []
      }

      const profileMap = {}
      ;(profiles || []).forEach((p) => { profileMap[p.id] = p })
      const fMap = {}
      ;(fees || []).forEach((f) => { fMap[f.id] = f })
      const rows = (reqs || []).map((r) => ({
        ...r,
        player: profileMap[r.user_id] || null,
      }))
      setRequests(rows)
      setFeesMap(fMap)
    } catch (e) {
      console.error('Failed to load carry-forward requests', e)
      setRequests([])
      setFeesMap({})
    } finally {
      setLoading(false)
    }
  }, [seasonId])

  useEffect(() => { load() }, [load])

  async function resolveRequest(req, status) {
    setResolvingId(req.id)
    try {
      const nowIso = new Date().toISOString()
      const fee = feesMap[req.umpiring_fee_id]

      if (status === 'approved') {
        if (!fee) throw new Error('Linked umpiring fee record not found for this request')
        const carryDescription = `Umpiring due (carry forward used from ${req.from_season})`
        const carryAmount = Number(fee.amount || UMP_FEE)

        const { error: feeUpdateErr } = await supabase
          .from('umpiring_fees')
          .update({ paid: true, paid_at: nowIso, updated_by: currentUserName, updated_at: nowIso })
          .eq('id', fee.id)
        if (feeUpdateErr) throw feeUpdateErr

        let supportsSourceFeeColumn = true
        let existingCredit = null
        const { data: creditBySource, error: existingErr } = await supabase
          .from('player_finance_entries')
          .select('id')
          .eq('player_id', req.user_id)
          .eq('season', req.to_season)
          .eq('source_umpiring_fee_id', fee.id)
          .maybeSingle()
        if (existingErr) {
          if ((existingErr.message || '').includes('source_umpiring_fee_id')) {
            supportsSourceFeeColumn = false
          } else {
            throw existingErr
          }
        } else {
          existingCredit = creditBySource
        }

        if (!supportsSourceFeeColumn) {
          const { data: fallbackCredits, error: fallbackErr } = await supabase
            .from('player_finance_entries')
            .select('id')
            .eq('player_id', req.user_id)
            .eq('season', req.to_season)
            .eq('description', carryDescription)
            .order('created_at', { ascending: false })
            .limit(1)
          if (fallbackErr) throw fallbackErr
          existingCredit = fallbackCredits?.[0] || null
        }

        if (existingCredit?.id) {
          const { error: creditUpdateErr } = await supabase
            .from('player_finance_entries')
            .update({
              team: fee.team,
              entry_type: 'personal_due',
              amount: carryAmount,
              description: carryDescription,
              is_team_amount: true,
              can_self_mark_paid: false,
              paid: false,
              paid_at: null,
              paid_marked_by: null,
              added_by_name: currentUserName,
              updated_at: nowIso,
            })
            .eq('id', existingCredit.id)
          if (creditUpdateErr) throw creditUpdateErr
        } else {
          const insertPayload = {
            player_id: req.user_id,
            season: req.to_season,
            team: fee.team,
            entry_type: 'personal_due',
            amount: carryAmount,
            description: carryDescription,
            is_team_amount: true,
            can_self_mark_paid: false,
            paid: false,
            added_by_user_id: null,
            added_by_name: currentUserName,
            created_at: nowIso,
            updated_at: nowIso,
          }
          if (supportsSourceFeeColumn) {
            insertPayload.source_umpiring_fee_id = fee.id
          }

          const { error: creditInsertErr } = await supabase
            .from('player_finance_entries')
            .insert(insertPayload)
          if (creditInsertErr) throw creditInsertErr
        }
      }

      let requestData = null
      let requestUpdateErr = null

      const fullUpdatePayload = {
        status,
        updated_at: nowIso,
        reviewed_by_name: currentUserName,
        reviewed_at: nowIso,
      }
      const fallbackUpdatePayload = {
        status,
        updated_at: nowIso,
      }

      const { data: fullData, error: fullErr } = await supabase
        .from('umpiring_carry_forward_requests')
        .update(fullUpdatePayload)
        .eq('id', req.id)
        .select('*')
        .single()

      if (fullErr) {
        const msg = fullErr.message || ''
        if (msg.includes('reviewed_at') || msg.includes('reviewed_by_name')) {
          const { data: fallbackData, error: fallbackErr } = await supabase
            .from('umpiring_carry_forward_requests')
            .update(fallbackUpdatePayload)
            .eq('id', req.id)
            .select('*')
            .single()
          requestData = fallbackData
          requestUpdateErr = fallbackErr
        } else {
          requestUpdateErr = fullErr
        }
      } else {
        requestData = fullData
      }

      if (requestUpdateErr) throw requestUpdateErr

      if (requestData) {
        setRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, ...requestData } : r))
      }
      await load()
    } catch (e) {
      alert(`Failed to ${status} carry-forward request: ${e.message || 'Unknown error'}`)
    } finally {
      setResolvingId(null)
    }
  }

  return (
    <div>
      {loading ? (
        <div className="flex justify-center py-14"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-400">No carry-forward requests for this season.</div>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => {
            const fee = feesMap[r.umpiring_fee_id]
            const busy = resolvingId === r.id
            const statusCls = r.status === 'approved'
              ? 'bg-green-100 text-green-700'
              : r.status === 'rejected'
                ? 'bg-red-100 text-red-600'
                : 'bg-amber-100 text-amber-700'
            return (
              <div key={r.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{r.player?.full_name || 'Player'} · {fee ? `$${Number(fee.amount || UMP_FEE).toFixed(2)}` : '$60.00'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.from_season} → {r.to_season}</p>
                    <p className="text-[11px] text-gray-500 mt-1">Requested on {new Date(r.requested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    {r.reviewed_by_name && r.reviewed_at && (
                      <p className="text-[11px] text-gray-500 mt-1">{r.reviewed_by_name} {r.status} on {new Date(r.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    )}
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusCls}`}>{r.status}</span>
                </div>

                {r.status === 'pending' && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => resolveRequest(r, 'approved')}
                      disabled={busy}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-600 text-white disabled:opacity-50"
                    >
                      {busy ? 'Saving…' : 'Approve'}
                    </button>
                    <button
                      onClick={() => resolveRequest(r, 'rejected')}
                      disabled={busy}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500 text-white disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   Main FinancesTab
══════════════════════════════════════════════════════ */
export default function FinancesTab() {
  const { user } = useAuth()
  const { activeSeason } = useSeason()
  const seasonId = activeSeason?.id || '2026'
  const seasonLabel = activeSeason?.label || 'Season 2026'
  const legacySeasonIds = useMemo(
    () => getFinanceSeasonIds(seasonId),
    [seasonId]
  )
  const [activeTab, setActiveTab]         = useState('fees')
  const [rosterPlayers, setRosterPlayers] = useState([])
  const [financeMap, setFinanceMap]       = useState({})
  const [loading, setLoading]             = useState(true)
  const [toggling, setToggling]           = useState(null)
  const currentUserName = rosterPlayers.find((p) => p.email === user?.email)?.full_name || 'Admin'

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [{ data: profileData }, { data: finData }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, team, role').order('full_name'),
      supabase.from('player_finances').select('id, player_name, team, season, amount_due, paid, paid_at, created_at, updated_at, updated_by').in('season', legacySeasonIds),
    ])
    setRosterPlayers(profileData || [])
    const map = {}
    ;(finData || []).forEach((r) => {
      const key = `${r.player_name}::${r.team}`
      const existing = map[key]
      if (!existing) {
        map[key] = r
        return
      }
      if (existing.season !== seasonId && r.season === seasonId) {
        map[key] = r
      }
    })
    setFinanceMap(map)
    setLoading(false)
  }, [legacySeasonIds, seasonId])

  useEffect(() => { loadAll() }, [loadAll])

  function getRecord(player) {
    return financeMap[`${player.full_name}::${player.team}`] || null
  }

  async function togglePaid(player) {
    if (!['raising-bulls', 'royal-bulls'].includes(player.team)) return
    setToggling(player.id)
    const existing = getRecord(player)
    const nowPaid  = !existing?.paid
    const currentUserName = rosterPlayers.find((p) => p.email === user?.email)?.full_name || 'Unknown'

    // Optimistic update
    const optimisticRecord = {
      ...existing,
      paid: nowPaid,
      paid_at: nowPaid ? new Date().toISOString() : null,
      updated_by: currentUserName,
      updated_at: new Date().toISOString(),
    }
    setFinanceMap((prev) => ({
      ...prev,
      [`${player.full_name}::${player.team}`]: optimisticRecord,
    }))

    let error
    if (existing) {
      // Record exists → UPDATE only the relevant fields
      const res = await supabase
        .from('player_finances')
        .update({
          paid:       nowPaid,
          paid_at:    nowPaid ? new Date().toISOString() : null,
          updated_by: currentUserName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
      error = res.error
    } else {
      // No record yet → INSERT a fresh row
      const res = await supabase
        .from('player_finances')
        .insert({
          player_name: player.full_name,
          team:        player.team,
          season:      seasonId,
          amount_due:  SEASON_FEE,
          paid:        nowPaid,
          paid_at:     nowPaid ? new Date().toISOString() : null,
          updated_by:  currentUserName,
          updated_at:  new Date().toISOString(),
        })
      error = res.error
    }

    if (error) {
      console.error('togglePaid error:', error.message)
      // Revert optimistic update on error
      setFinanceMap((prev) => {
        const newMap = { ...prev }
        if (existing) {
          newMap[`${player.full_name}::${player.team}`] = existing
        } else {
          delete newMap[`${player.full_name}::${player.team}`]
        }
        return newMap
      })
    }
    setToggling(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-display font-bold text-primary text-2xl mb-1">Finances</h2>
          <p className="text-sm text-gray-500">
            {seasonLabel} · Fee per player: <strong className="text-gray-700">${SEASON_FEE}</strong>
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5">
        <button
          onClick={() => setActiveTab('fees')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'fees' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 active:bg-white/50'
          }`}
        >
          <span>💰</span>
          <span>Season Fees</span>
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'expenses' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500 active:bg-white/50'
          }`}
        >
          <span>🧾</span>
          <span>Team Expenses</span>
        </button>
        <button
          onClick={() => setActiveTab('umpiring')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'umpiring' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 active:bg-white/50'
          }`}
        >
          <span>🧢</span>
          <span>Ump Fees</span>
        </button>
      </div>

      {/* Active panel */}
      {activeTab === 'fees' ? (
        <SeasonFeesPanel
          rosterPlayers={rosterPlayers}
          financeMap={financeMap}
          loading={loading}
          getRecord={getRecord}
          togglePaid={togglePaid}
          toggling={toggling}
        />
      ) : activeTab === 'expenses' ? (
        <ExpensesPanel
          rosterPlayers={rosterPlayers}
          currentUserName={currentUserName}
          seasonId={seasonId}
        />
      ) : activeTab === 'umpiring' ? (
        <UmpFeesPanel rosterPlayers={rosterPlayers} seasonId={seasonId} currentUserName={currentUserName} />
      ) : null}
    </div>
  )
}


