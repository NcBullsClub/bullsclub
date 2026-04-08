import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const TIER_META = {
  gold:   { label: '🥇 Gold',        cls: 'bg-amber-100 text-amber-700 border-amber-200'  },
  silver: { label: '🥈 Silver',      cls: 'bg-gray-100 text-gray-600 border-gray-200'     },
  bronze: { label: '🥉 Bronze',      cls: 'bg-orange-100 text-orange-700 border-orange-200'},
  event:  { label: '🎪 Event',       cls: 'bg-purple-100 text-purple-700 border-purple-200'},
  open:   { label: '💬 Open to ideas',cls: 'bg-blue-100 text-blue-700 border-blue-200'    },
}

const STATUS_META = {
  new:       { label: 'New',       cls: 'bg-amber-100 text-amber-700 border border-amber-200'   },
  contacted: { label: 'Contacted', cls: 'bg-blue-100 text-blue-700 border border-blue-200'      },
  confirmed: { label: 'Confirmed', cls: 'bg-green-100 text-green-700 border border-green-200'   },
  declined:  { label: 'Declined',  cls: 'bg-red-100 text-red-600 border border-red-200'         },
}

const STATUS_OPTIONS = ['new', 'contacted', 'confirmed', 'declined']
const FILTERS = ['all', 'new', 'contacted', 'confirmed', 'declined']

export default function SponsorInquiriesTab({ onNewCount }) {
  const { profile } = useAuth()
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('new')
  const [search, setSearch]       = useState('')
  const [actionId, setActionId]   = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('sponsor_inquiries')
      .select('*')
      .order('created_at', { ascending: false })
    const all = data || []
    setInquiries(all)
    onNewCount?.(all.filter((r) => r.status === 'new').length)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id, status) {
    setActionId(id)
    await supabase
      .from('sponsor_inquiries')
      .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: profile?.id })
      .eq('id', id)
    setInquiries((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    onNewCount?.(inquiries.filter((r) => r.id !== id ? r.status === 'new' : status === 'new').length)
    setActionId(null)
  }

  const filtered = inquiries.filter((r) => {
    const matchesFilter = filter === 'all' || r.status === filter
    const q = search.toLowerCase()
    const matchesSearch =
      r.contact_name?.toLowerCase().includes(q) ||
      r.brand_name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  const newCount = inquiries.filter((r) => r.status === 'new').length

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { label: 'Total',     value: inquiries.length,                         cls: 'border-gray-300'  },
          { label: 'New',       value: newCount,                                  cls: 'border-amber-400' },
          { label: 'Contacted', value: inquiries.filter(r=>r.status==='contacted').length, cls: 'border-blue-400'  },
          { label: 'Confirmed', value: inquiries.filter(r=>r.status==='confirmed').length, cls: 'border-green-400' },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-xl border-l-4 ${s.cls} px-3 py-2.5 shadow-sm`}>
            <div className="text-xl font-display font-bold text-primary-dark">{s.value}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${
              filter === f ? 'bg-primary-dark text-accent' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'All' : STATUS_META[f]?.label}
            {f === 'new' && newCount > 0 && (
              <span className="ml-1 bg-amber-400 text-primary-dark rounded-full px-1.5 text-[9px] font-bold py-0.5">
                {newCount}
              </span>
            )}
          </button>
        ))}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, brand, email…"
          className="flex-1 min-w-[180px] px-3 py-1.5 border border-gray-200 rounded-full text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button onClick={load} className="text-xs font-medium text-gray-400 hover:text-primary transition-colors px-2">
          ↻ Refresh
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">💼</div>
          <p className="font-medium text-gray-500">No inquiries found.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((r) => {
            const tier = TIER_META[r.tier_interest] ?? TIER_META.open
            const stat = STATUS_META[r.status] ?? STATUS_META.new
            const isExpanded = expandedId === r.id
            return (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:border-primary/30 transition-colors overflow-hidden"
              >
                {/* Header row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-primary-dark text-accent font-display font-bold flex items-center justify-center text-sm flex-shrink-0">
                    {r.brand_name?.[0]?.toUpperCase() ?? '?'}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <span className="font-semibold text-gray-800 text-sm truncate">{r.brand_name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.cls}`}>
                        {tier.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {r.contact_name} · {r.email}
                    </div>
                  </div>

                  {/* Status + date */}
                  <div className="flex-shrink-0 text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stat.cls}`}>
                      {stat.label}
                    </span>
                    <div className="text-[10px] text-gray-400 mt-1">
                      {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>

                  {/* Chevron */}
                  <span className="text-gray-400 text-xs flex-shrink-0">{isExpanded ? '▲' : '▼'}</span>
                </div>

                {/* Expanded body */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-gray-50">
                    <div className="grid sm:grid-cols-2 gap-3 pt-3">
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Contact</p>
                        <p className="text-sm text-gray-700 font-medium">{r.contact_name}</p>
                        <p className="text-xs text-gray-500">{r.email}</p>
                        <p className="text-xs text-gray-500">{r.mobile}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Interest</p>
                        <p className="text-sm text-gray-700 font-medium">{r.brand_name}</p>
                        <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.cls}`}>
                          {tier.label}
                        </span>
                      </div>
                    </div>

                    {r.message && (
                      <div className="mt-3">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Message</p>
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">{r.message}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mr-1">Update Status:</p>
                      {STATUS_OPTIONS.filter((s) => s !== r.status).map((s) => (
                        <button
                          key={s}
                          onClick={() => updateStatus(r.id, s)}
                          disabled={actionId === r.id}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${STATUS_META[s].cls} hover:opacity-80 disabled:opacity-40 capitalize`}
                        >
                          {actionId === r.id ? '…' : `→ ${STATUS_META[s].label}`}
                        </button>
                      ))}
                      <a
                        href={`mailto:${r.email}?subject=NC Bulls Cricket Club Sponsorship Inquiry`}
                        className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary-dark text-accent hover:bg-primary transition-colors"
                      >
                        ✉ Email
                      </a>
                    </div>
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
