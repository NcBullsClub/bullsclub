import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useSeason } from '../../contexts/SeasonContext'
import { SEASONS } from '../../config/seasons'

function cleanText(value) {
  return String(value || '').trim()
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function getGroundLabel(fixture) {
  const venue = cleanText(fixture?.venue)
  const address = cleanText(fixture?.venue_address)
  if (venue && address) return `${venue} · ${address}`
  return venue || address || 'Unknown ground'
}

export default function AnalyticsTab() {
  const { activeSeason, setActiveSeason } = useSeason()
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState('raising-bulls')
  const [playerSearchQuery, setPlayerSearchQuery] = useState('')
  const [fixtures, setFixtures] = useState([])
  const [profiles, setProfiles] = useState([])
  const [availability, setAvailability] = useState([])
  const [umpiringAssignments, setUmpiringAssignments] = useState([])
  const [umpiringAvailability, setUmpiringAvailability] = useState([])

  useEffect(() => {
    let cancelled = false

    async function loadAnalytics() {
      setLoading(true)
      try {
        const [{ data: fixturesData = [] }, { data: profilesData = [] }] = await Promise.all([
          supabase
            .from('fixtures')
            .select('id, date, team, venue, venue_address, season')
            .eq('season', activeSeason.id)
            .order('date', { ascending: true }),
          supabase
            .from('profiles')
            .select('id, full_name, email, team')
            .order('full_name', { ascending: true }),
        ])

        const fixtureDates = new Set((fixturesData || []).map((fixture) => fixture.date))

        const [{ data: availabilityData = [] }, { data: umpiringAssignmentsData = [] }, { data: umpiringAvailabilityData = [] }] = await Promise.all([
          supabase
            .from('availability')
            .select('user_id, user_name, fixture_date, fixture_team, status')
            .order('fixture_date', { ascending: true }),
          supabase
            .from('umpiring_assignments')
            .select('id, date, venue, ncb_team, season')
            .eq('season', activeSeason.id)
            .order('date', { ascending: true }),
          supabase
            .from('umpiring_availability')
            .select('user_id, user_name, umpiring_assignment_id, status')
            .order('umpiring_assignment_id', { ascending: true }),
        ])

        if (cancelled) return

        const filteredAvailability = (availabilityData || []).filter((row) => fixtureDates.has(row.fixture_date))
        const assignmentIds = new Set((umpiringAssignmentsData || []).map((assignment) => assignment.id))
        const filteredUmpiringAvailability = (umpiringAvailabilityData || []).filter((row) => assignmentIds.has(row.umpiring_assignment_id))

        setFixtures(fixturesData || [])
        setProfiles(profilesData || [])
        setAvailability(filteredAvailability)
        setUmpiringAssignments(umpiringAssignmentsData || [])
        setUmpiringAvailability(filteredUmpiringAvailability)
      } catch (error) {
        console.error('Failed to load analytics', error)
        if (!cancelled) {
          setFixtures([])
          setProfiles([])
          setAvailability([])
          setUmpiringAssignments([])
          setUmpiringAvailability([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadAnalytics()
    return () => {
      cancelled = true
    }
  }, [activeSeason.id])

  const profileMap = useMemo(() => {
    const map = new Map()
    ;(profiles || []).forEach((profile) => {
      if (profile.id) map.set(profile.id, profile)
    })
    return map
  }, [profiles])

  const filteredFixtures = useMemo(() => {
    if (selectedTeam === 'all') return fixtures
    return fixtures.filter((fixture) => fixture.team === selectedTeam)
  }, [fixtures, selectedTeam])

  const filteredAvailability = useMemo(() => {
    if (selectedTeam === 'all') return availability
    return availability.filter((row) => row.fixture_team === selectedTeam)
  }, [availability, selectedTeam])

  const filteredUmpiringAssignments = useMemo(() => {
    if (selectedTeam === 'all') return umpiringAssignments
    return umpiringAssignments.filter((assignment) => assignment.ncb_team === selectedTeam)
  }, [umpiringAssignments, selectedTeam])

  const filteredUmpiringAvailability = useMemo(() => {
    if (selectedTeam === 'all') return umpiringAvailability
    const assignmentIds = new Set((filteredUmpiringAssignments || []).map((assignment) => assignment.id))
    return umpiringAvailability.filter((row) => assignmentIds.has(row.umpiring_assignment_id))
  }, [umpiringAvailability, filteredUmpiringAssignments, selectedTeam])

  const groundStats = useMemo(() => {
    const counts = new Map()
    ;(filteredFixtures || []).forEach((fixture) => {
      const key = getGroundLabel(fixture)
      const existing = counts.get(key) || { label: key, count: 0 }
      existing.count += 1
      counts.set(key, existing)
    })

    return Array.from(counts.values()).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return (a.label || '').localeCompare(b.label || '')
    })
  }, [filteredFixtures])

  const playerStats = useMemo(() => {
    const counts = new Map()
    const seenFixtureResponses = new Set()
    const fixtureKeySet = new Set((filteredFixtures || []).map((fixture) => `${fixture.date}::${fixture.team}`))

    ;(filteredAvailability || []).forEach((row) => {
      const fixtureKey = `${row.fixture_date}::${row.fixture_team}`
      if (!fixtureKeySet.has(fixtureKey)) return

      const playerKey = row.user_id || row.user_name || 'unknown'
      const responseKey = `${playerKey}::${fixtureKey}`
      if (seenFixtureResponses.has(responseKey)) return
      seenFixtureResponses.add(responseKey)

      const profile = row.user_id ? profileMap.get(row.user_id) : null
      const name = cleanText(profile?.full_name || row.user_name || profile?.email || 'Unknown player')
      const existing = counts.get(playerKey) || { key: playerKey, name, in: 0, out: 0, maybe: 0 }

      if (row.status === 'in') existing.in += 1
      else if (row.status === 'out') existing.out += 1
      else if (row.status === 'maybe') existing.maybe += 1

      existing.name = name
      counts.set(playerKey, existing)
    })

    return Array.from(counts.values()).sort((a, b) => {
      if (b.in !== a.in) return b.in - a.in
      return (a.name || '').localeCompare(b.name || '')
    })
  }, [filteredAvailability, filteredFixtures, profileMap])

  const umpireStats = useMemo(() => {
    const counts = new Map()

    ;(filteredUmpiringAvailability || []).forEach((row) => {
      if (row.status !== 'in') return
      const key = row.user_id || row.user_name || 'unknown'
      const profile = row.user_id ? profileMap.get(row.user_id) : null
      const name = cleanText(profile?.full_name || row.user_name || profile?.email || 'Unknown umpire')
      const existing = counts.get(key) || { key, name, count: 0 }
      existing.count += 1
      existing.name = name
      counts.set(key, existing)
    })

    return Array.from(counts.values()).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return (a.name || '').localeCompare(b.name || '')
    })
  }, [filteredUmpiringAvailability, profileMap])

  const filteredPlayerStats = useMemo(() => {
    const query = playerSearchQuery.trim().toLowerCase()
    if (!query) return playerStats
    return playerStats.filter((item) => item.name.toLowerCase().includes(query))
  }, [playerStats, playerSearchQuery])

  const totalFixtures = filteredFixtures.length
  const uniqueGrounds = groundStats.length
  const uniquePlayers = playerStats.length
  const uniqueUmpires = umpireStats.length

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        Loading analytics…
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-primary-dark via-primary to-primary-light p-4 text-white shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent/90 sm:text-[11px]">Season analytics</p>
            <h3 className="font-display text-lg font-bold sm:text-xl">{activeSeason?.label || 'Analytics'}</h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-200 sm:text-sm">Quick visibility into where matches are played and who is contributing on the field and as umpires.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="flex items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-gray-100 sm:justify-start">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent/90">Season</span>
              <select
                value={activeSeason?.id || ''}
                onChange={(event) => {
                  const season = SEASONS.find((item) => item.id === event.target.value)
                  if (season) setActiveSeason(season)
                }}
                className="rounded-lg border border-white/20 bg-primary-dark/70 px-2 py-1 text-sm text-white outline-none"
              >
                {SEASONS.map((season) => (
                  <option key={season.id} value={season.id} className="bg-primary-dark text-white">
                    {season.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-1 rounded-xl border border-white/15 bg-white/10 p-1">
              {['raising-bulls', 'royal-bulls', 'all'].map((team) => {
                const label = team === 'all' ? 'All' : team === 'raising-bulls' ? 'Raising' : 'Royal'
                return (
                  <button
                    key={team}
                    type="button"
                    onClick={() => setSelectedTeam(team)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition sm:px-3 sm:text-sm ${selectedTeam === team ? 'bg-accent text-primary-dark' : 'text-gray-100 hover:bg-white/10'}`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400 sm:text-[11px]">Fixtures</p>
          <div className="mt-1 text-xl font-bold text-primary-dark sm:mt-2 sm:text-2xl">{totalFixtures}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400 sm:text-[11px]">Grounds</p>
          <div className="mt-1 text-xl font-bold text-primary-dark sm:mt-2 sm:text-2xl">{uniqueGrounds}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400 sm:text-[11px]">Players</p>
          <div className="mt-1 text-xl font-bold text-primary-dark sm:mt-2 sm:text-2xl">{uniquePlayers}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-400 sm:text-[11px]">Umpires</p>
          <div className="mt-1 text-xl font-bold text-primary-dark sm:mt-2 sm:text-2xl">{uniqueUmpires}</div>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="mb-3 flex items-center justify-between sm:mb-4">
            <div>
              <h4 className="font-display text-base font-bold text-primary-dark sm:text-lg">Matches per ground</h4>
              <p className="text-xs text-gray-500 sm:text-sm">Fixture count by venue.</p>
            </div>
          </div>
          {groundStats.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">No fixture venue data yet for this season.</div>
          ) : (
            <ul className="space-y-2">
              {groundStats.map((item) => (
                <li key={item.label} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                  <span className="text-gray-700">{item.label}</span>
                  <span className="font-semibold text-primary-dark">{item.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="mb-3 sm:mb-4">
            <h4 className="font-display text-base font-bold text-primary-dark sm:text-lg">Player availability</h4>
            <p className="text-xs text-gray-500 sm:text-sm">In / Out / Maybe counts per player for this season.</p>
          </div>
          <label className="mb-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            <span className="text-gray-400">🔎</span>
            <input
              type="text"
              value={playerSearchQuery}
              onChange={(event) => setPlayerSearchQuery(event.target.value)}
              placeholder="Search player"
              className="w-full border-none bg-transparent outline-none"
            />
          </label>
          {filteredPlayerStats.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">No matching player availability data yet for this season.</div>
          ) : (
            <ul className="space-y-2">
              {filteredPlayerStats.map((item) => (
                <li key={item.key} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-700">{item.name}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">{item.in + item.out + item.maybe} total</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold">
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">In {item.in}</span>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">Out {item.out}</span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">Maybe {item.maybe}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="mb-3 sm:mb-4">
            <h4 className="font-display text-base font-bold text-primary-dark sm:text-lg">Matches umpired by a player</h4>
            <p className="text-xs text-gray-500 sm:text-sm">Counted from umpiring availability marked as in.</p>
          </div>
          {umpireStats.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">No umpiring data yet for this season.</div>
          ) : (
            <ul className="space-y-2">
              {umpireStats.map((item) => (
                <li key={item.key} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                  <span className="text-gray-700">{item.name}</span>
                  <span className="font-semibold text-primary-dark">{item.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
