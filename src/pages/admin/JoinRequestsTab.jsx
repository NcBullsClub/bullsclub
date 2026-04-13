import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import SponsorInquiriesTab from './SponsorInquiriesTab'

const ROLE_LABELS = {
  'batsman':               '🏏 Batsman',
  'bowler':                '⚡ Bowler',
  'all-rounder':           '🌟 All-Rounder',
  'wicket-keeper':         '🧤 Wicket-Keeper',
  'wicket-keeper-batsman': '🧤 Wicket-Keeper Batsman',
  'beginner':              '🌱 Beginner',
}

const TEAM_LABELS = {
  'raising-bulls': 'Raising Bulls',
  'royal-bulls':   'Royal Bulls',
}

const STATUS_STYLES = {
  pending:  'bg-amber-100 text-amber-700 border border-amber-200',
  approved: 'bg-green-100 text-green-700 border border-green-200',
  rejected: 'bg-red-100 text-red-600 border border-red-200',
}

const FILTERS = [
  { value: 'all',      label: 'All' },
  { value: 'pending',  label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export default function JoinRequestsTab({ onPendingCount }) {
  const { profile } = useAuth()
  const [subTab, setSubTab]               = useState('players')
  // 'new' = public join requests | 'existing' = existing player onboarding
  const [requestView, setRequestView]     = useState('new')
  const [requests, setRequests]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [filter, setFilter]               = useState('pending')
  const [actionId, setActionId]           = useState(null)
  const [confirmId, setConfirmId]         = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [search, setSearch]               = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('join_requests')
      .select('*')
      .order('created_at', { ascending: false })
    const all = data || []
    setRequests(all)
    onPendingCount?.(all.filter((r) => r.status === 'pending').length)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleApprove(req) {
    setActionId(req.id)
    // Check if already in allowed_emails
    const { data: existing } = await supabase
      .from('allowed_emails')
      .select('email')
      .eq('email', req.email)
      .maybeSingle()

    if (!existing) {
      await supabase.from('allowed_emails').insert({
        email:     req.email,
        full_name: req.full_name,
        // Existing-player requests carry team; public requests leave it for admin to set later
        team:      req.team || null,
      })
    }

    await supabase
      .from('join_requests')
      .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: profile?.id })
      .eq('id', req.id)

    setConfirmId(null)
    setConfirmAction(null)
    setActionId(null)
    load()
  }

  async function handleReject(req) {
    setActionId(req.id)
    await supabase
      .from('join_requests')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: profile?.id })
      .eq('id', req.id)
    setConfirmId(null)
    setConfirmAction(null)
    setActionId(null)
    load()
  }

  function askConfirm(req, action) {
    setConfirmId(req.id)
    setConfirmAction(action)
  }

  const viewRequests = requests.filter((r) =>
    requestView === 'existing'
      ? r.request_type === 'existing_player'
      : r.request_type !== 'existing_player'
  )

  const filtered = viewRequests.filter((r) => {
    const matchesFilter = filter === 'all' || r.status === filter
    const q = search.toLowerCase()
    const matchesSearch =
      r.full_name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  const pendingCount         = requests.filter((r) => r.status === 'pending' && r.request_type !== 'existing_player').length
  const existingPendingCount = requests.filter((r) => r.status === 'pending' && r.request_type === 'existing_player').length
  const [sponsorNewCount, setSponsorNewCount] = useState(0)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Sub-tab switcher */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'players',  label: 'Join Requests',       icon: '📩' },
          { id: 'sponsors', label: 'Sponsor Inquiries',   icon: '💼' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              subTab === t.id
                ? 'bg-primary-dark text-accent'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>{t.icon}</span>{t.label}
            {t.id === 'players' && pendingCount > 0 && (
              <span className="ml-0.5 bg-amber-400 text-primary-dark rounded-full px-1.5 text-[10px] font-bold leading-none py-0.5">{pendingCount}</span>
            )}
            {t.id === 'sponsors' && sponsorNewCount > 0 && (
              <span className="ml-0.5 bg-amber-400 text-primary-dark rounded-full px-1.5 text-[10px] font-bold leading-none py-0.5">{sponsorNewCount}</span>
            )}
          </button>
        ))}
      </div>

      {subTab === 'sponsors' && (
        <SponsorInquiriesTab onNewCount={setSponsorNewCount} />
      )}

      {subTab === 'players' && (<div>
        {/* ── Request-type toggle ── */}
        <div className="flex gap-2 mb-5">
          {[
            { id: 'new',      label: 'New Requests',      icon: '📩', count: pendingCount },
            { id: 'existing', label: 'Existing Players',  icon: '🏏', count: existingPendingCount },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => { setRequestView(v.id); setFilter('pending'); setSearch('') }}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                requestView === v.id
                  ? 'bg-primary-dark text-accent'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{v.icon}</span>{v.label}
              {v.count > 0 && (
                <span className="ml-0.5 bg-amber-400 text-primary-dark rounded-full px-1.5 text-[10px] font-bold leading-none py-0.5">
                  {v.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {requestView === 'existing' && (
          <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-blue-700 mb-0.5">Existing Player Onboarding</p>
            <p className="text-xs text-blue-600 leading-relaxed">
              These players submitted the fast-track onboarding form. Approving adds them directly to
              the allowed list with their team pre-set — they only need to set a password to activate their account.
            </p>
          </div>
        )}

        {requestView === 'new' && (
          <p className="text-sm text-gray-500 mb-5">
            Players who submitted the Join the Club form. Approve to add them to the allowed list.
          </p>
        )}

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === f.value
                  ? 'bg-primary-dark text-accent'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {f.label}
              {f.value === 'pending' && pendingCount > 0 && (
                <span className="ml-1 bg-amber-400 text-primary-dark rounded-full px-1.5 text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-sm">
          {search ? 'No requests match your search.' : `No ${filter === 'all' ? '' : filter} requests.`}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const isBusy    = actionId === req.id
            const isConfirm = confirmId === req.id

            return (
              <div
                key={req.id}
                className="bg-white border border-gray-200 rounded-2xl p-4"
              >
                {/* Top row: name + status */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm leading-tight">{req.full_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 break-all">{req.email}</p>
                  </div>
                  <span className={`flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[req.status]}`}>
                    {req.status}
                  </span>
                </div>

                {/* Meta row: role + team (existing) + date */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                    {ROLE_LABELS[req.playing_role] || req.playing_role}
                  </span>
                  {req.team && (
                    <span className="text-xs bg-primary-dark/10 text-primary-dark px-2.5 py-1 rounded-full font-medium">
                      🏏 {TEAM_LABELS[req.team] || req.team}
                    </span>
                  )}
                  {req.batting_hand && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                      {req.batting_hand.replace(/-/g, ' ')}
                    </span>
                  )}
                  {req.bowling_style && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                      {req.bowling_style.replace(/-/g, ' ')}
                    </span>
                  )}
                  {req.phone && (
                    <span className="text-xs text-gray-400">📞 {req.phone}</span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(req.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Optional message */}
                {req.message && (
                  <p className="text-xs text-gray-500 italic bg-gray-50 rounded-lg px-3 py-2 mb-3">
                    "{req.message}"
                  </p>
                )}

                {/* Actions — only for pending */}
                {req.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    {isConfirm ? (
                      <>
                        <span className="text-xs text-gray-500 mr-1">
                          {confirmAction === 'approve'
                            ? req.team
                              ? `Approve and add to allowed list with ${TEAM_LABELS[req.team] || req.team}?`
                              : 'Approve and add to allowed list?'
                            : 'Reject this request?'}
                        </span>
                        <button
                          onClick={() => confirmAction === 'approve' ? handleApprove(req) : handleReject(req)}
                          disabled={isBusy}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                            confirmAction === 'approve'
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-red-500 text-white hover:bg-red-600'
                          }`}
                        >
                          {isBusy ? '…' : 'Yes'}
                        </button>
                        <button
                          onClick={() => { setConfirmId(null); setConfirmAction(null) }}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => askConfirm(req, 'approve')}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 transition-colors"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => askConfirm(req, 'reject')}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                        >
                          ✕ Reject
                        </button>
                      </>
                    )}
                  </div>
                )}

                {req.status === 'approved' && (
                  <p className="text-xs text-green-600 font-medium">
                    ✓ {req.team ? `Added to allowed list · ${TEAM_LABELS[req.team] || req.team}` : 'Added to approved players list'}
                    {req.reviewed_at && ` · ${new Date(req.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                  </p>
                )}

                {req.status === 'rejected' && (
                  <p className="text-xs text-red-500 font-medium">
                    Request rejected
                    {req.reviewed_at && ` · ${new Date(req.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )} {/* end subTab === 'players' */}
    </div>
  )
}
