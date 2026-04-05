import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const ROLE_LABELS = {
  'batsman':       '🏏 Batsman',
  'bowler':        '⚡ Bowler',
  'all-rounder':   '🌟 All-Rounder',
  'wicket-keeper': '🧤 Wicket-Keeper',
  'beginner':      '🌱 Beginner',
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
  const [requests, setRequests]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('pending')
  const [actionId, setActionId]     = useState(null)
  const [confirmId, setConfirmId]   = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [search, setSearch]         = useState('')

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
        team:      null, // admin can set team later in Access tab
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

  const filtered = requests.filter((r) => {
    const matchesFilter = filter === 'all' || r.status === filter
    const q = search.toLowerCase()
    const matchesSearch =
      r.full_name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  const pendingCount = requests.filter((r) => r.status === 'pending').length

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="font-display font-bold text-primary text-2xl mb-1 flex items-center gap-3">
          Join Requests
          {pendingCount > 0 && (
            <span className="text-sm font-semibold bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">
              {pendingCount} pending
            </span>
          )}
        </h2>
        <p className="text-sm text-gray-500">
          Players who submitted the Join the Club form. Approve to add them to the allowed list.
        </p>
      </div>

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

                {/* Meta row: role + date */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                    {ROLE_LABELS[req.playing_role] || req.playing_role}
                  </span>
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
                          {confirmAction === 'approve' ? 'Approve and add to allowed list?' : 'Reject this request?'}
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
                    ✓ Added to approved players list
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
  )
}
