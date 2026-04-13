import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

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

// ── Collapsible section wrapper ────────────────────────────────────────────
const sectionVariants = {
  open:   { height: 'auto', opacity: 1, transition: { height: { type: 'spring', stiffness: 300, damping: 35, mass: 0.5 }, opacity: { duration: 0.2 } } },
  closed: { height: 0,      opacity: 0, transition: { height: { type: 'spring', stiffness: 300, damping: 35, mass: 0.5 }, opacity: { duration: 0.15 } } },
}

// ── MatchCard — module-level so React never remounts it ────────────────────
function MatchCard({ cardKey, rows, fixtureMap, collapsedKeys, toggleCollapse, onSelectFixture }) {
  const [date, team] = cardKey.split('::')
  const fixture   = fixtureMap[cardKey]
  const inList    = rows.filter((r) => r.status === 'in')
  const outList   = rows.filter((r) => r.status === 'out')
  const maybeList = rows.filter((r) => r.status === 'maybe')

  const [y, m, d] = date.split('-').map(Number)
  const dateObj   = new Date(y, m - 1, d)
  const today     = new Date(); today.setHours(0, 0, 0, 0)
  const isPastCard = dateObj < today
  const isRaising  = team === 'raising-bulls'
  const isCollapsed = collapsedKeys.has(cardKey)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
    >
      <div className={`px-4 sm:px-6 py-4 flex flex-col gap-3 ${isRaising ? 'bg-primary-dark' : 'bg-primary'}`}>
        {/* Top row: meta tags + WhatsApp notification button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${isRaising ? 'bg-accent text-primary-dark' : 'bg-white/20 text-white'}`}>
              {isRaising ? 'Raising Bulls' : 'Royal Bulls'}
            </span>
            {fixture && (
              <span className="text-xs bg-white/10 text-gray-300 px-2.5 py-0.5 rounded-full">{fixture.format}</span>
            )}
            {isPastCard && (
              <span className="text-xs bg-white/10 text-gray-400 px-2.5 py-0.5 rounded-full">Past</span>
            )}
          </div>
          {/* WhatsApp notification — top right */}
          {!isPastCard && fixture && (
            <button
              onClick={() => {
                const teamName = isRaising ? 'Raising Bulls' : 'Royal Bulls'
                const msg =
`🏏 *NC Bulls Cricket Club — ${teamName}*

Hi Team 👋,
Please update your *availability* for our upcoming match:

📅 *Date:* ${dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
⏰ *Time:* ${fixture.time || 'TBD'}
⚔️ *Opponent:* ${fixture.opponent || 'TBD'}
🏟️ *Ground:* ${fixture.venue || 'TBD'}
🧢 *Umpires:* ${[fixture.umpire1_team, fixture.umpire2_team].filter(Boolean).reduce((acc, v) => acc === v ? acc : acc ? `${acc} & ${v}` : v, '') || 'TBD'}

👉 Visit the app and mark your availability as ✅ IN, ❌ OUT, or 🤔 MAYBE.

Your response helps us plan the squad. Please respond *at least by Wednesday*.
Thank you! 🙌`
                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer')
              }}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-green-600/90 hover:bg-green-500 text-white border border-green-400/30 transition-all whitespace-nowrap shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.852L0 24l6.335-1.507A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.372l-.36-.214-3.727.977.994-3.634-.234-.374A9.818 9.818 0 1112 21.818z"/></svg>
              <span className="hidden sm:inline">Send Availability Notification</span>
              <span className="sm:hidden">Notify Availability</span>
            </button>
          )}
        </div>

        {/* Bottom row: match title, date, counts, select players */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-white text-lg sm:text-xl truncate">
              vs {fixture?.opponent || 'Unknown'}
            </h3>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
              {dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              {fixture?.time && ` · ${fixture.time}`}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {onSelectFixture && (
              <button
                onClick={() => !isPastCard && onSelectFixture(cardKey)}
                disabled={isPastCard}
                title={isPastCard ? 'Cannot select players for a past match' : ''}
                className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${
                  isPastCard
                    ? 'bg-white/5 text-white/30 border-white/10 cursor-not-allowed'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20 active:scale-95'
                }`}
              >
                🏏 Select Players
              </button>
            )}
            {[
              { label: 'In',    count: inList.length,    bg: 'bg-green-500' },
              { label: 'Maybe', count: maybeList.length, bg: 'bg-amber-400' },
              { label: 'Out',   count: outList.length,   bg: 'bg-red-500'   },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-xl px-2 sm:px-2.5 py-1.5 sm:py-2 text-center text-white flex-shrink-0`}>
                <div className="font-display font-bold text-lg sm:text-xl leading-none">{s.count}</div>
                <div className="text-[9px] sm:text-[10px] font-medium opacity-90 mt-0.5 whitespace-nowrap">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expandable player list */}
      <motion.div
        initial={{ height: isCollapsed ? 0 : 'auto', opacity: isCollapsed ? 0 : 1 }}
        animate={{
          height: isCollapsed ? 0 : 'auto',
          opacity: isCollapsed ? 0 : 1,
        }}
        transition={{
          height: { type: 'spring', stiffness: 300, damping: 35, mass: 0.5 },
          opacity: { duration: 0.2 },
        }}
        style={{ overflow: 'hidden' }}
      >
            <div className="px-3 sm:px-6 py-4">
              {rows.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No responses yet.</p>
              ) : (() => {
                const sorted = [...rows].sort((a, b) => {
                  const order = { in: 0, maybe: 1, out: 2 }
                  return (order[a.status] ?? 3) - (order[b.status] ?? 3)
                })
                return (
                  <>
                    {/* ── Mobile cards ── */}
                    <div className="sm:hidden space-y-1">
                      {sorted.map((r) => (
                        <div key={r.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 active:bg-gray-100 transition-colors">
                          <span className={`flex-shrink-0 w-2 h-2 rounded-full ${
                            r.status === 'in' ? 'bg-green-500' : r.status === 'maybe' ? 'bg-amber-400' : 'bg-red-400'
                          }`} />
                          <span className="flex-1 text-xs font-medium text-gray-800 truncate">
                            {(r.profiles?.full_name || '—').split(' ')[0]}
                          </span>
                          {r.notes && (
                            <span className="flex-shrink-0 text-[10px] text-gray-400 italic truncate max-w-[80px]" title={r.notes}>
                              {r.notes}
                            </span>
                          )}
                          {r.profiles?.team && (
                            <span className="flex-shrink-0 text-[9px] text-gray-400 font-normal leading-tight text-right">
                              {r.profiles.team === 'raising-bulls' ? 'RB' : 'RoyB'}
                            </span>
                          )}
                          <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${STATUS_COLORS[r.status]}`}>
                            {r.status}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* ── Desktop table ── */}
                    <div className="hidden sm:block overflow-x-auto">
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
                          {sorted.map((r) => (
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
                  </>
                )
              })()}
            </div>
          </motion.div>

      {/* Toggle players list */}
      <button
        onClick={() => toggleCollapse(cardKey)}
        className="w-full border-t border-gray-100 px-4 sm:px-6 py-2.5 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
      >
        <motion.svg
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          className="flex-shrink-0 text-gray-400"
        >
          <path d="M19 9l-7 7-7-7" />
        </motion.svg>
        {isCollapsed ? `Show Players (${rows.length})` : 'Hide Players'}
      </button>
    </motion.div>
  )
}

export default function AvailabilityTab({ onSelectFixture }) {
  const { isSuperAdmin, adminTeam } = useAuth()

  const [teamFilter, setTeamFilter] = useState(adminTeam ?? 'all')
  const [responses, setResponses]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [collapsedKeys, setCollapsedKeys] = useState(new Set())
  const initializedCollapse = useRef(false)
  const [pastSectionOpen, setPastSectionOpen] = useState(false)

  // Fixtures fetched from Supabase
  const [fixturesData, setFixturesData] = useState([])
  useEffect(() => {
    supabase.from('fixtures').select('*').order('date', { ascending: true })
      .then(({ data }) => setFixturesData(data || []))
  }, [])

  const fixtureMap = Object.fromEntries(
    fixturesData.map((f) => [`${f.date}::${f.team}`, f]),
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

  // Auto-collapse past matches on first data load
  useEffect(() => {
    if (!responses.length || initializedCollapse.current) return
    initializedCollapse.current = true
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const pastKeys = new Set(
      responses
        .map((r) => `${r.fixture_date}::${r.fixture_team}`)
        .filter((key) => {
          const [y, m, d] = key.split('::')[0].split('-').map(Number)
          return new Date(y, m - 1, d) < today
        })
    )
    setCollapsedKeys(pastKeys)
  }, [responses])

  function toggleCollapse(key) {
    setCollapsedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

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

      {!loading && (() => {
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const allKeys = Object.entries(grouped)
        const pastEntries     = allKeys.filter(([key]) => {
          const [y, m, d] = key.split('::')[0].split('-').map(Number)
          return new Date(y, m - 1, d) < today
        })
        const upcomingEntries = allKeys.filter(([key]) => {
          const [y, m, d] = key.split('::')[0].split('-').map(Number)
          return new Date(y, m - 1, d) >= today
        })

        return (
          <div className="space-y-6">
            {/* \u2500\u2500 Past Matches \u2500\u2500 */}
            {pastEntries.length > 0 && (
              <div>
                <button
                  onClick={() => setPastSectionOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl text-sm font-semibold text-gray-500 transition-colors mb-0 touch-manipulation"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                    Past Matches
                    <span className="text-xs font-normal text-gray-400">({pastEntries.length})</span>
                  </span>
                  <motion.svg
                    animate={{ rotate: pastSectionOpen ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                    width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                    className="flex-shrink-0 text-gray-500"
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </button>
                <AnimatePresence initial={false}>
                  {pastSectionOpen && (
                    <motion.div
                      key="past-section"
                      initial="closed"
                      animate="open"
                      exit="closed"
                      variants={sectionVariants}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="space-y-4 pt-3">
                        {pastEntries.map(([k, r]) => (
                          <MatchCard
                            key={k}
                            cardKey={k}
                            rows={r}
                            fixtureMap={fixtureMap}
                            collapsedKeys={collapsedKeys}
                            toggleCollapse={toggleCollapse}
                            onSelectFixture={onSelectFixture}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* \u2500\u2500 Upcoming Matches \u2500\u2500 */}
            <div>
              <div className="flex items-center gap-2 px-1 mb-3">
                <span className="w-2 h-2 rounded-full bg-accent inline-block" />
                <span className="text-sm font-semibold text-gray-700">Upcoming Matches</span>
                <span className="text-xs font-normal text-gray-400">({upcomingEntries.length})</span>
              </div>
              {upcomingEntries.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No upcoming matches.</p>
              ) : (
                <div className="space-y-4">
                  {upcomingEntries.map(([k, r]) => (
                    <MatchCard
                      key={k}
                      cardKey={k}
                      rows={r}
                      fixtureMap={fixtureMap}
                      collapsedKeys={collapsedKeys}
                      toggleCollapse={toggleCollapse}
                      onSelectFixture={onSelectFixture}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
