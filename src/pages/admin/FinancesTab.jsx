import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const SEASON = '2026'
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
  { id: 'other',        label: 'Other',         icon: '📦' },
]

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
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className={`text-sm font-bold tabular-nums ${paid ? 'text-green-600' : 'text-gray-400'}`}>${SEASON_FEE}</p>
                  {record?.paid_at && (
                    <p className="text-[10px] text-gray-400">
                      {new Date(record.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
}

function ExpensesPanel({ rosterPlayers, currentUserName }) {
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

  const load = useCallback(() => {
    setLoading(true)
    supabase
      .from('team_expenses')
      .select('*')
      .eq('season', SEASON)
      .is('deleted_at', null)
      .order('expense_date', { ascending: false })
      .then(({ data }) => {
        setExpenses(data || [])
        setLoading(false)
      })
  }, [])

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
    setSaving(true)
    await supabase.from('team_expenses').insert({
      season:       SEASON,
      team:         form.team,
      paid_by:      form.paid_by,
      amount:       parseFloat(parseFloat(form.amount).toFixed(2)),
      category:     form.category,
      description:  form.description.trim() || null,
      expense_date: form.expense_date,
      created_by:   currentUserName || 'Admin',
      created_at:   new Date().toISOString(),
    })
    load()
    setSaving(false)
    setShowForm(false)
    setForm(EMPTY_FORM)
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
                className={`border rounded-2xl px-4 py-3 flex items-start gap-3 transition-colors ${
                  isSettled ? 'bg-green-50/60 border-green-200' : 'bg-white border-gray-200'
                }`}
              >
                {/* Category icon */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 mt-0.5 ${isSettled ? 'bg-green-100' : 'bg-orange-100'}`}>
                  {cat.icon}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
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
                    {dateStr}{e.description ? ` · ${e.description}` : ''}{isSettled && e.settled_at ? ` · Settled ${new Date(e.settled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                  </p>
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
                          className="text-[10px] font-bold text-green-600 hover:text-green-700 disabled:opacity-50"
                        >
                          {isUpdating ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" /> : '✓'}
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setEditAmount('') }}
                          className="text-[10px] text-gray-400 hover:text-gray-600"
                        >✕</button>
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
   Main FinancesTab
══════════════════════════════════════════════════════ */
export default function FinancesTab() {
  const { user } = useAuth()
  const [activeTab, setActiveTab]         = useState('fees')
  const [rosterPlayers, setRosterPlayers] = useState([])
  const [financeMap, setFinanceMap]       = useState({})
  const [loading, setLoading]             = useState(true)
  const [toggling, setToggling]           = useState(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [{ data: profileData }, { data: finData }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, team, role').order('full_name'),
      supabase.from('player_finances').select('*').eq('season', SEASON),
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
    if (!['raising-bulls', 'royal-bulls'].includes(player.team)) return
    setToggling(player.id)
    const existing = getRecord(player)
    const nowPaid  = !existing?.paid

    let error
    if (existing) {
      // Record exists → UPDATE only the relevant fields
      const res = await supabase
        .from('player_finances')
        .update({
          paid:    nowPaid,
          paid_at: nowPaid ? new Date().toISOString() : null,
        })
        .eq('player_name', player.full_name)
        .eq('team',        player.team)
        .eq('season',      SEASON)
      error = res.error
    } else {
      // No record yet → INSERT a fresh row
      const res = await supabase
        .from('player_finances')
        .insert({
          player_name: player.full_name,
          team:        player.team,
          season:      SEASON,
          amount_due:  SEASON_FEE,
          paid:        nowPaid,
          paid_at:     nowPaid ? new Date().toISOString() : null,
        })
      error = res.error
    }

    if (error) {
      console.error('togglePaid error:', error.message)
    }
    await loadAll()
    setToggling(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-display font-bold text-primary text-2xl mb-1">Finances</h2>
          <p className="text-sm text-gray-500">
            Season 2026 · Fee per player: <strong className="text-gray-700">${SEASON_FEE}</strong>
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
            activeTab === 'expenses' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 active:bg-white/50'
          }`}
        >
          <span>🧾</span>
          <span>Team Expenses</span>
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
      ) : (
        <ExpensesPanel
          rosterPlayers={rosterPlayers}
          currentUserName={rosterPlayers.find((p) => p.email === user?.email)?.full_name}
        />
      )}
    </div>
  )
}


