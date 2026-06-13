import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useSeason } from '../contexts/SeasonContext'
import { SEASONS } from '../config/seasons'
import { SeasonSwitcherInline } from '../components/ui/SeasonSwitcher'

function toMoney(v) {
  return `$${Number(v || 0).toFixed(2)}`
}

function splitAmountByCents(totalAmount, count) {
  const totalCents = Math.round(Number(totalAmount || 0) * 100)
  if (totalCents <= 0 || count <= 0) return []
  const base = Math.floor(totalCents / count)
  const remainder = totalCents % count
  return Array.from({ length: count }, (_, idx) => (base + (idx < remainder ? 1 : 0)) / 100)
}

function isLegacyCarryForwardCredit(entry) {
  return entry?.entry_type === 'personal_credit' && /^Carry forward from\s+/i.test(String(entry?.description || ''))
}

function isEffectiveDueEntry(entry) {
  return entry?.entry_type === 'personal_due' || isLegacyCarryForwardCredit(entry)
}

export default function PlayerFinances() {
  const { user, profile } = useAuth()
  const { activeSeason } = useSeason()
  const seasonId = activeSeason?.id || '2026'
  const isFirstSeason = seasonId === SEASONS[0].id
  const legacySeasonIds = useMemo(
    () => (isFirstSeason ? [seasonId, '2026'] : [seasonId]),
    [isFirstSeason, seasonId]
  )
  const [loading, setLoading] = useState(true)
  const [seasonFee, setSeasonFee] = useState(null)
  const [umpiringFees, setUmpiringFees] = useState([])
  const [assignments, setAssignments] = useState([])
  const [entries, setEntries] = useState([])

  const [markingEntryId, setMarkingEntryId] = useState(null)
  const [teammates, setTeammates] = useState([])
  const [createdEntries, setCreatedEntries] = useState([])
  const [showSplitForm, setShowSplitForm] = useState(false)
  const [splitForm, setSplitForm] = useState({
    description: '',
    amount: '',
    split_mode: 'equal',
  })
  const [splitTargets, setSplitTargets] = useState([])
  const [splitPlayerSearch, setSplitPlayerSearch] = useState('')
  const [savingSplit, setSavingSplit] = useState(false)
  const [splitError, setSplitError] = useState('')
  const [splitSuccess, setSplitSuccess] = useState('')
  const [createdEntryActionId, setCreatedEntryActionId] = useState(null)
  const [confirmingDeleteEntryId, setConfirmingDeleteEntryId] = useState(null)
  const [createdEntryError, setCreatedEntryError] = useState('')
  const [createdEntrySuccess, setCreatedEntrySuccess] = useState('')

  useEffect(() => {
    let isMounted = true
    async function load() {
      if (!user?.id || !profile?.team) {
        setLoading(false)
        return
      }
      setLoading(true)

      const [feeRes, umpRes, assgnRes, entriesRes, teammateRes, createdRes] = await Promise.all([
        supabase
          .from('player_finances')
          .select('*')
          .in('season', legacySeasonIds)
          .eq('player_name', profile.full_name)
          .eq('team', profile.team)
          .order('updated_at', { ascending: false }),
        supabase
          .from('umpiring_fees')
          .select('*')
          .eq('user_id', user.id)
          .eq('season', seasonId)
          .order('created_at', { ascending: false }),
        supabase
          .from('umpiring_assignments')
          .select('id, date, time, match_visitor, match_home, venue, ncb_team')
          .order('date', { ascending: false }),
        supabase
          .from('player_finance_entries')
          .select('*')
          .eq('player_id', user.id)
          .eq('season', seasonId)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, full_name, team')
          .in('team', ['raising-bulls', 'royal-bulls'])
          .neq('id', user.id)
          .order('team')
          .order('full_name'),
        supabase
          .from('player_finance_entries')
          .select('*')
          .eq('added_by_user_id', user.id)
          .neq('player_id', user.id)
          .eq('season', seasonId)
          .order('created_at', { ascending: false }),
      ])

      if (!isMounted) return
      const feeRows = feeRes?.data || []
      const preferredFee = feeRows.find((r) => r.season === seasonId) || feeRows[0] || null
      setSeasonFee(preferredFee)
      setUmpiringFees(umpRes?.data || [])
      setAssignments(assgnRes?.data || [])
      setEntries(entriesRes?.error ? [] : (entriesRes?.data || []))
      setTeammates(teammateRes?.error ? [] : (teammateRes?.data || []))
      setCreatedEntries(createdRes?.error ? [] : (createdRes?.data || []))
      setLoading(false)
    }

    load()
    return () => { isMounted = false }
  }, [user?.id, profile?.full_name, profile?.team, seasonId, legacySeasonIds])

  const assignmentMap = useMemo(() => {
    const map = {}
    assignments.forEach((a) => { map[a.id] = a })
    return map
  }, [assignments])

  const teammateMap = useMemo(() => {
    const map = {}
    teammates.forEach((p) => { map[p.id] = p })
    return map
  }, [teammates])

  const teammatesByTeam = useMemo(() => ({
    'raising-bulls': teammates.filter((p) => p.team === 'raising-bulls'),
    'royal-bulls': teammates.filter((p) => p.team === 'royal-bulls'),
  }), [teammates])

  const filteredTeammatesByTeam = useMemo(() => {
    const query = splitPlayerSearch.trim().toLowerCase()
    if (!query) return teammatesByTeam
    return {
      'raising-bulls': (teammatesByTeam['raising-bulls'] || []).filter((p) =>
        String(p.full_name || '').toLowerCase().includes(query)
      ),
      'royal-bulls': (teammatesByTeam['royal-bulls'] || []).filter((p) =>
        String(p.full_name || '').toLowerCase().includes(query)
      ),
    }
  }, [splitPlayerSearch, teammatesByTeam])

  const personalCreditsOwedToYou = useMemo(() => (
    entries
      .filter((e) => e.entry_type === 'personal_credit' && !e.paid && !isLegacyCarryForwardCredit(e))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0)
  ), [entries])

  const personalDuesYouOwe = useMemo(() => (
    entries
      .filter((e) => isEffectiveDueEntry(e) && !e.paid)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0)
  ), [entries])

  const personalCollectionsOwedToYou = useMemo(() => (
    createdEntries
      .filter((e) => !e.paid && e.entry_type === 'personal_due' && !e.is_team_amount)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0)
  ), [createdEntries])

  const totalPersonalOwedToYou = personalCreditsOwedToYou + personalCollectionsOwedToYou
  const personalNetAmount = totalPersonalOwedToYou - personalDuesYouOwe

  const showPersonalSummaryCards = totalPersonalOwedToYou > 0 || personalDuesYouOwe > 0

  const teamOwesYou = useMemo(() => {
    const umpPending = umpiringFees
      .filter((r) => !r.paid)
      .reduce((sum, r) => sum + Number(r.amount || 60), 0)
    return umpPending + personalCreditsOwedToYou
  }, [umpiringFees, personalCreditsOwedToYou])

  const youOweTeam = useMemo(() => {
    const seasonDue = seasonFee && !seasonFee.paid ? Number(seasonFee.amount_due || 120) : 0
    return seasonDue + personalDuesYouOwe
  }, [seasonFee, personalDuesYouOwe])

  async function setPersonalEntryPaidState(entry, paid) {
    if (!entry || entry.is_team_amount || !entry.can_self_mark_paid) return
    setMarkingEntryId(entry.id)
    const now = new Date().toISOString()
    const paidByName = paid ? (profile?.full_name || 'Player') : null
    const { error } = await supabase
      .from('player_finance_entries')
      .update({
        paid,
        paid_at: paid ? now : null,
        paid_marked_by: paidByName,
        updated_at: now,
      })
      .eq('id', entry.id)
      .eq('player_id', user.id)

    if (!error) {
      setEntries((prev) => prev.map((e) => e.id === entry.id
        ? { ...e, paid, paid_at: paid ? now : null, paid_marked_by: paidByName, updated_at: now }
        : e))
    }
    setMarkingEntryId(null)
  }

  async function markPersonalEntryPaid(entry) {
    if (!entry || entry.paid) return
    await setPersonalEntryPaidState(entry, true)
  }

  async function revertPersonalEntryPaid(entry) {
    if (!entry || !entry.paid) return
    await setPersonalEntryPaidState(entry, false)
  }

  async function setCreatedEntryPaidState(entry, paid) {
    if (!entry || entry.added_by_user_id !== user.id || entry.is_team_amount) return
    setCreatedEntryActionId(entry.id)
    setConfirmingDeleteEntryId(null)
    setCreatedEntryError('')
    setCreatedEntrySuccess('')

    const now = new Date().toISOString()
    const paidByName = paid ? (profile?.full_name || 'Player') : null
    const { error } = await supabase
      .from('player_finance_entries')
      .update({
        paid,
        paid_at: paid ? now : null,
        paid_marked_by: paidByName,
        updated_at: now,
      })
      .eq('id', entry.id)
      .eq('added_by_user_id', user.id)

    if (error) {
      setCreatedEntryError(error.message || `Failed to update this split entry.`)
      setCreatedEntryActionId(null)
      return
    }

    setCreatedEntries((prev) => prev.map((item) => (
      item.id === entry.id
        ? { ...item, paid, paid_at: paid ? now : null, paid_marked_by: paidByName, updated_at: now }
        : item
    )))
    setCreatedEntrySuccess(paid ? 'Split entry marked as paid.' : 'Split entry moved back to pending.')
    setCreatedEntryActionId(null)
  }

  async function markCreatedEntryPaid(entry) {
    if (!entry || entry.paid) return
    await setCreatedEntryPaidState(entry, true)
  }

  async function revertCreatedEntryPaid(entry) {
    if (!entry || !entry.paid) return
    await setCreatedEntryPaidState(entry, false)
  }

  function requestDeleteCreatedEntry(entry) {
    if (!entry || entry.paid || entry.added_by_user_id !== user.id) return
    setConfirmingDeleteEntryId(entry.id)
    setCreatedEntryError('')
    setCreatedEntrySuccess('')
  }

  function cancelDeleteCreatedEntry() {
    setConfirmingDeleteEntryId(null)
  }

  async function deleteCreatedEntry(entry) {
    if (!entry || entry.paid || entry.added_by_user_id !== user.id) return

    setCreatedEntryActionId(entry.id)
    setConfirmingDeleteEntryId(null)
    setCreatedEntryError('')
    setCreatedEntrySuccess('')

    const { error } = await supabase
      .from('player_finance_entries')
      .delete()
      .eq('id', entry.id)
      .eq('added_by_user_id', user.id)

    if (error) {
      setCreatedEntryError(error.message || 'Failed to delete this split entry.')
      setCreatedEntryActionId(null)
      return
    }

    setCreatedEntries((prev) => prev.filter((item) => item.id !== entry.id))
    setCreatedEntrySuccess('Split entry deleted.')
    setCreatedEntryActionId(null)
  }



  const splitTargetsCount = splitTargets.length
  const splitTotalAmount = Number(splitForm.amount || 0)
  const splitPreviewAmounts = useMemo(() => {
    if (splitTargetsCount === 0 || splitTotalAmount <= 0) return []
    if (splitForm.split_mode === 'full') {
      return Array.from({ length: splitTargetsCount }, () => splitTotalAmount)
    }
    return splitAmountByCents(splitTotalAmount, splitTargetsCount)
  }, [splitForm.split_mode, splitTargetsCount, splitTotalAmount])

  const splitPreviewText = useMemo(() => {
    if (splitTargetsCount === 0 || splitTotalAmount <= 0) return ''
    if (splitForm.split_mode === 'full') {
      return `Each selected player gets ${toMoney(splitTotalAmount)} due.`
    }
    const minAmount = Math.min(...splitPreviewAmounts)
    const maxAmount = Math.max(...splitPreviewAmounts)
    if (minAmount === maxAmount) {
      return `Each selected player gets ${toMoney(minAmount)} due.`
    }
    return `Amounts are split as ${toMoney(minAmount)}-${toMoney(maxAmount)} to keep the total exact.`
  }, [splitTargetsCount, splitTotalAmount, splitForm.split_mode, splitPreviewAmounts])

  function toggleSplitTarget(targetId) {
    setSplitTargets((prev) => (
      prev.includes(targetId)
        ? prev.filter((id) => id !== targetId)
        : [...prev, targetId]
    ))
  }

  function selectTargetsByTeam(teamId) {
    const teamIds = (teammatesByTeam[teamId] || []).map((p) => p.id)
    setSplitTargets((prev) => [...new Set([...prev, ...teamIds])])
  }

  function resetSplitForm() {
    setSplitForm({ description: '', amount: '', split_mode: 'equal' })
    setSplitTargets([])
    setSplitPlayerSearch('')
    setSplitError('')
  }

  async function handleCreateSplitEntries(e) {
    e.preventDefault()
    setSplitError('')
    setSplitSuccess('')

    const description = splitForm.description.trim()
    const amount = Number(splitForm.amount)
    if (!description) {
      setSplitError('Please add a description for this entry.')
      return
    }
    if (!amount || amount <= 0) {
      setSplitError('Please enter a valid amount greater than 0.')
      return
    }
    if (splitTargets.length === 0) {
      setSplitError('Select at least one player to distribute this amount.')
      return
    }

    const targets = teammates.filter((p) => splitTargets.includes(p.id))
    if (targets.length === 0) {
      setSplitError('Selected players are no longer available. Please reselect players.')
      return
    }

    const perPlayerAmounts = splitForm.split_mode === 'full'
      ? Array.from({ length: targets.length }, () => Number(amount.toFixed(2)))
      : splitAmountByCents(amount, targets.length)

    const nowIso = new Date().toISOString()
    const rows = targets.map((p, idx) => ({
      player_id: p.id,
      season: seasonId,
      team: p.team,
      entry_type: 'personal_due',
      amount: perPlayerAmounts[idx],
      description,
      is_team_amount: false,
      can_self_mark_paid: true,
      paid: false,
      added_by_user_id: user.id,
      added_by_name: profile?.full_name || 'Player',
      created_at: nowIso,
      updated_at: nowIso,
    }))

    setSavingSplit(true)
    const { data, error } = await supabase
      .from('player_finance_entries')
      .insert(rows)
      .select('*')

    if (error) {
      setSplitError(error.message || 'Failed to create split entries. Please try again.')
      setSavingSplit(false)
      return
    }

    setCreatedEntries((prev) => [...(data || []), ...prev])
    setSplitSuccess(`Created ${rows.length} entries. ${splitPreviewText}`)
    setSavingSplit(false)
    setShowSplitForm(false)
    resetSplitForm()
  }

  return (
    <div>
      <section className="bg-primary-dark text-white py-8 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between gap-3 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
              <span className="hidden md:block" />
              <div className="md:text-center">
                <h1 className="font-display text-3xl md:text-6xl font-bold leading-tight">
                  MY <span className="text-accent">FINANCES</span>
                </h1>
                <p className="text-gray-400 text-xs md:text-lg mt-0.5">Track what you owe and what the team owes you.</p>
              </div>
              <div className="flex md:justify-end">
                <SeasonSwitcherInline />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-6 md:py-10 bg-surface min-h-[60vh]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          {loading ? (
            <div className="flex justify-center py-14"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <p className="text-[11px] uppercase tracking-widest font-bold text-red-500">You Owe Team</p>
                  <p className="text-2xl font-black text-red-600 mt-1">{toMoney(youOweTeam)}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                  <p className="text-[11px] uppercase tracking-widest font-bold text-green-600">Team Owes You</p>
                  <p className="text-2xl font-black text-green-700 mt-1">{toMoney(teamOwesYou)}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <p className="text-[11px] uppercase tracking-widest font-bold text-gray-500">Net</p>
                  <p className={`text-2xl font-black mt-1 ${(teamOwesYou - youOweTeam) >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {toMoney(teamOwesYou - youOweTeam)}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h2 className="font-display font-bold text-primary text-lg">Season Fee</h2>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${seasonFee?.paid ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>
                    {seasonFee?.paid ? 'Paid' : 'Pending'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Amount: <strong>{toMoney(seasonFee?.amount_due || 120)}</strong></p>
                {seasonFee?.updated_by && seasonFee?.updated_at && (
                  <p className="text-xs text-gray-500 mt-1">{seasonFee.updated_by} marked as {seasonFee.paid ? 'paid' : 'unpaid'} on {new Date(seasonFee.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                )}
                {!seasonFee?.paid && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mt-2 inline-block">
                    Pending admin update from Season Fees tab.
                  </p>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <h2 className="font-display font-bold text-primary text-lg mb-2">Umpiring Credits</h2>
                {umpiringFees.length === 0 ? (
                  <p className="text-sm text-gray-400">No umpiring credits for this season yet.</p>
                ) : (
                  <div className="space-y-2">
                    {umpiringFees.map((r) => {
                      const assignment = assignmentMap[r.umpiring_assignment_id]
                      return (
                        <div key={r.id} className="border border-gray-200 rounded-xl px-3 py-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-800">
                              {assignment ? `${assignment.match_visitor} vs ${assignment.match_home}` : 'Umpiring assignment'}
                            </p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.paid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                              {r.paid ? 'Paid out' : 'Pending payout'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Amount: <strong>{toMoney(r.amount || 60)}</strong></p>
                          {r.completion_source === 'automatic' && (!r.updated_by || r.updated_by === 'System') ? (
                            <p className="text-xs text-gray-500 mt-1">automatically completed</p>
                          ) : r.updated_by && r.updated_at ? (
                            <p className="text-xs text-gray-500 mt-1">{r.updated_by} marked as {r.paid ? 'paid' : 'unpaid'} on {new Date(r.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <h2 className="font-display font-bold text-primary text-lg mb-2">Personal Entries</h2>
                <p className="text-xs text-gray-500 mb-3">You can mark personal entries as paid once you receive them, and revert them back to pending if you tapped it by mistake. Team dues must still be marked by admin.</p>
                {showPersonalSummaryCards && (
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-rose-500">You Owe</p>
                      <p className="text-xl sm:text-2xl font-black text-rose-600 mt-1">{toMoney(personalDuesYouOwe)}</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-600">Receivable</p>
                      <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">{toMoney(totalPersonalOwedToYou)}</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-amber-600">Net</p>
                      <p className={`text-xl sm:text-2xl font-black mt-1 ${personalNetAmount >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {toMoney(personalNetAmount)}
                      </p>
                    </div>
                  </div>
                )}
                {entries.length === 0 ? (
                  <p className="text-sm text-gray-400">No personal entries yet.</p>
                ) : (
                  <div className="space-y-2">
                    {entries.map((entry) => (
                      <div key={entry.id} className="border border-gray-200 rounded-xl px-3 py-2 flex items-center gap-3">
                        {(() => {
                          const isDue = isEffectiveDueEntry(entry)
                          const entryLabel = entry.description || (isDue ? 'Personal due' : 'Personal credit')
                          return (
                            <>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{entryLabel}</p>
                          <p className="text-xs text-gray-500">Added by {entry.added_by_name || 'Admin'}</p>
                          {entry.paid_marked_by && entry.paid_at && (
                            <p className="text-xs text-gray-500 mt-0.5">{entry.paid_marked_by} marked paid on {new Date(entry.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-black ${isDue ? 'text-red-600' : 'text-green-700'}`}>{toMoney(entry.amount)}</p>
                          <p className={`text-[11px] font-semibold ${entry.paid ? 'text-green-600' : 'text-gray-400'}`}>{entry.paid ? 'Paid' : 'Unpaid'}</p>
                        </div>
                        {!entry.is_team_amount && entry.can_self_mark_paid ? (
                          <button
                            onClick={() => (entry.paid ? revertPersonalEntryPaid(entry) : markPersonalEntryPaid(entry))}
                            disabled={markingEntryId === entry.id}
                            className={`px-2.5 py-1.5 rounded-full text-xs font-bold disabled:opacity-50 ${entry.paid ? 'bg-amber-50 border border-amber-300 text-amber-700' : 'bg-green-50 border border-green-300 text-green-700'}`}
                          >
                            {markingEntryId === entry.id ? 'Saving…' : (entry.paid ? 'Mark Pending' : 'Mark Paid')}
                          </button>
                        ) : !entry.paid && entry.is_team_amount ? (
                          <span className="text-[11px] text-gray-400">Admin action</span>
                        ) : (
                          <span className="text-[11px] text-gray-400">Admin action</span>
                        )}
                            </>
                          )
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h2 className="font-display font-bold text-primary text-lg">Create Split Entry</h2>
                  <button
                    onClick={() => {
                      setShowSplitForm((prev) => !prev)
                      setSplitError('')
                      setSplitSuccess('')
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${showSplitForm ? 'bg-gray-200 text-gray-600' : 'bg-primary-dark text-white'}`}
                  >
                    {showSplitForm ? 'Cancel' : '+ New Split'}
                  </button>
                </div>

                <p className="text-xs text-gray-500">Add a personal due and distribute it to selected teammates. Players can self-mark these entries as paid.</p>

                {splitSuccess && (
                  <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-2 py-1 mt-3 inline-block">{splitSuccess}</p>
                )}

                {showSplitForm && (
                  <form onSubmit={handleCreateSplitEntries} className="mt-3 border border-gray-200 rounded-xl p-3 bg-gray-50 space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Total Amount ($)</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          required
                          value={splitForm.amount}
                          onChange={(e) => setSplitForm((prev) => ({ ...prev, amount: e.target.value }))}
                          placeholder="0.00"
                          className="w-full px-3 py-2 rounded-lg text-xs border border-gray-200 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Split Mode</label>
                        <select
                          value={splitForm.split_mode}
                          onChange={(e) => setSplitForm((prev) => ({ ...prev, split_mode: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg text-xs border border-gray-200 bg-white"
                        >
                          <option value="equal">Equal split of total amount</option>
                          <option value="full">Full amount per selected player</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Description</label>
                      <input
                        type="text"
                        required
                        value={splitForm.description}
                        onChange={(e) => setSplitForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="e.g. Match-day snacks"
                        className="w-full px-3 py-2 rounded-lg text-xs border border-gray-200 bg-white"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Select Players ({splitTargets.length})</p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => selectTargetsByTeam('raising-bulls')}
                            className="text-[10px] font-semibold text-primary"
                          >
                            + Raising Bulls
                          </button>
                          <button
                            type="button"
                            onClick={() => selectTargetsByTeam('royal-bulls')}
                            className="text-[10px] font-semibold text-primary"
                          >
                            + Royal Bulls
                          </button>
                          <button
                            type="button"
                            onClick={() => setSplitTargets(teammates.map((p) => p.id))}
                            className="text-[10px] font-semibold text-primary"
                          >
                            Select all
                          </button>
                          <button
                            type="button"
                            onClick={() => setSplitTargets([])}
                            className="text-[10px] font-semibold text-gray-500"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="mb-2">
                        <input
                          type="text"
                          value={splitPlayerSearch}
                          onChange={(e) => setSplitPlayerSearch(e.target.value)}
                          placeholder="Search player name"
                          className="w-full px-3 py-2 rounded-lg text-xs border border-gray-200 bg-white"
                        />
                      </div>

                      <div className="max-h-56 overflow-auto border border-gray-200 rounded-lg p-2 bg-white space-y-2">
                        {teammates.length === 0 ? (
                          <p className="text-xs text-gray-400">No teammates found.</p>
                        ) : (
                          <>
                            <div className="border border-gray-100 rounded-md p-2">
                              <p className="text-[10px] font-black uppercase tracking-wider text-primary-dark mb-1">Raising Bulls</p>
                              {(filteredTeammatesByTeam['raising-bulls'] || []).length === 0 ? (
                                <p className="text-xs text-gray-400">
                                  {splitPlayerSearch.trim() ? 'No matching players in Raising Bulls.' : 'No players in Raising Bulls.'}
                                </p>
                              ) : (filteredTeammatesByTeam['raising-bulls'] || []).map((player) => (
                                <label key={player.id} className="flex items-center gap-2 text-xs text-gray-700 py-0.5">
                                  <input
                                    type="checkbox"
                                    checked={splitTargets.includes(player.id)}
                                    onChange={() => toggleSplitTarget(player.id)}
                                    className="rounded border-gray-300"
                                  />
                                  <span className="font-medium">{player.full_name}</span>
                                </label>
                              ))}
                            </div>

                            <div className="border border-gray-100 rounded-md p-2">
                              <p className="text-[10px] font-black uppercase tracking-wider text-primary mb-1">Royal Bulls</p>
                              {(filteredTeammatesByTeam['royal-bulls'] || []).length === 0 ? (
                                <p className="text-xs text-gray-400">
                                  {splitPlayerSearch.trim() ? 'No matching players in Royal Bulls.' : 'No players in Royal Bulls.'}
                                </p>
                              ) : (filteredTeammatesByTeam['royal-bulls'] || []).map((player) => (
                                <label key={player.id} className="flex items-center gap-2 text-xs text-gray-700 py-0.5">
                                  <input
                                    type="checkbox"
                                    checked={splitTargets.includes(player.id)}
                                    onChange={() => toggleSplitTarget(player.id)}
                                    className="rounded border-gray-300"
                                  />
                                  <span className="font-medium">{player.full_name}</span>
                                </label>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {splitPreviewText && (
                        <p className="text-[11px] text-gray-500 mt-1">{splitPreviewText}</p>
                      )}
                    </div>

                    {splitError && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1">{splitError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={savingSplit}
                      className="w-full py-2 rounded-lg text-xs font-bold bg-primary-dark text-white disabled:opacity-50"
                    >
                      {savingSplit ? 'Creating…' : 'Create Split Entries'}
                    </button>
                  </form>
                )}

                <div className="mt-3 border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Entries You Created</p>
                    <p className="text-[10px] text-gray-400">Mark paid when someone settles, or move it back to pending if needed. Delete is only available while unpaid.</p>
                  </div>
                  {createdEntrySuccess && (
                    <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-2 py-1 mb-2 inline-block">{createdEntrySuccess}</p>
                  )}
                  {createdEntryError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1 mb-2 inline-block">{createdEntryError}</p>
                  )}
                  {createdEntries.length === 0 ? (
                    <p className="text-sm text-gray-400">No distributed entries created by you this season.</p>
                  ) : (
                    <div className="space-y-2">
                      {createdEntries.slice(0, 8).map((entry) => {
                        const target = teammateMap[entry.player_id]
                        const isActing = createdEntryActionId === entry.id
                        const isConfirmingDelete = confirmingDeleteEntryId === entry.id
                        return (
                          <div key={entry.id} className="border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{entry.description || 'Personal due'}</p>
                              <p className="text-xs text-gray-500">For {target?.full_name || 'Player'} · {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                              {entry.paid_marked_by && entry.paid_at && (
                                <p className="text-xs text-gray-500 mt-0.5">{entry.paid_marked_by} marked paid on {new Date(entry.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0 min-w-[78px]">
                              <p className="text-sm font-black text-red-600">{toMoney(entry.amount)}</p>
                              <p className={`text-[11px] font-semibold ${entry.paid ? 'text-green-600' : 'text-gray-400'}`}>{entry.paid ? 'Paid' : 'Pending'}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              {!entry.paid ? (
                                <>
                                  {isConfirmingDelete ? (
                                    <div className="flex flex-col items-end gap-1 rounded-xl border border-red-200 bg-red-50 px-2 py-2">
                                      <p className="text-[11px] font-semibold text-red-700">Delete this entry?</p>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => deleteCreatedEntry(entry)}
                                          disabled={isActing}
                                          className="px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-red-600 text-white disabled:opacity-50"
                                        >
                                          {isActing ? 'Deleting…' : 'Yes'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={cancelDeleteCreatedEntry}
                                          disabled={isActing}
                                          className="px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-white border border-gray-200 text-gray-600 disabled:opacity-50"
                                        >
                                          No
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => markCreatedEntryPaid(entry)}
                                        disabled={isActing}
                                        className="px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-green-50 border border-green-300 text-green-700 disabled:opacity-50"
                                      >
                                        {isActing ? 'Saving…' : 'Mark Paid'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => requestDeleteCreatedEntry(entry)}
                                        disabled={isActing}
                                        className="px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-red-50 border border-red-200 text-red-600 disabled:opacity-50"
                                      >
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => revertCreatedEntryPaid(entry)}
                                  disabled={isActing}
                                  className="px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-amber-50 border border-amber-300 text-amber-700 disabled:opacity-50"
                                >
                                  {isActing ? 'Saving…' : 'Mark Pending'}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
