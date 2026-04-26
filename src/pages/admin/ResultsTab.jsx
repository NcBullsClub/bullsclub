import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const TEAMS = [
  { id: 'raising-bulls', label: 'Raising Bulls' },
  { id: 'royal-bulls',   label: 'Royal Bulls' },
]

function teamLabel(t) {
  return t === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'
}

function CoinIcon({ className = 'w-4 h-4 flex-shrink-0' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="9" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="6.5" stroke="#D97706" strokeWidth="0.75" fill="none" />
      <circle cx="10" cy="10" r="2" fill="#D97706" />
    </svg>
  )
}

function parseMatchDateTime(dateStr, timeStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!timeStr) return new Date(y, m - 1, d)
  const mt = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!mt) return new Date(y, m - 1, d)
  let h = parseInt(mt[1])
  const min = parseInt(mt[2])
  const ap = mt[3].toUpperCase()
  if (ap === 'PM' && h !== 12) h += 12
  if (ap === 'AM' && h === 12) h = 0
  return new Date(y, m - 1, d, h, min)
}

function getMatchStatus(fixture) {
  const now = new Date()
  const start = parseMatchDateTime(fixture.date, fixture.time)
  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000)
  if (now >= end) return 'completed'
  if (now >= start) return 'live'
  return 'upcoming'
}

const EMPTY_FORM = {
  result: '', toss_winner: '', toss_choice: '', ncb_score: '', opp_score: '', mom: '', mom_stat: '', scorecard_url: '',
}

function parseToss(tossStr) {
  if (!tossStr) return { toss_winner: '', toss_choice: '' }
  const m = tossStr.match(/^(.+?)\s+won the toss(?:\s+and elected to\s+(bat|bowl))?/i)
  if (m) return { toss_winner: m[1].trim(), toss_choice: (m[2] || '').toLowerCase() }
  return { toss_winner: '', toss_choice: '' }
}

export default function ResultsTab() {
  const { isSuperAdmin, adminTeam } = useAuth()

  const [teamFilter, setTeamFilter] = useState('raising-bulls')

  // Fixtures from Supabase
  const [fixturesData, setFixturesData] = useState([])
  useEffect(() => {
    supabase.from('fixtures').select('*').order('date', { ascending: true })
      .then(({ data }) => setFixturesData(data || []))
  }, [])

  const [dbResults, setDbResults] = useState([])
  const [loading, setLoading]     = useState(true)

  // Form state
  const [editingKey, setEditingKey] = useState(null)
  const [form, setForm]             = useState({ ...EMPTY_FORM })
  const [saving, setSaving]             = useState(false)
  const [saveError, setSaveError]         = useState('')
  const [confirmDeleteKey, setConfirmDeleteKey] = useState(null)
  const [showPastMatches, setShowPastMatches] = useState(false)

  const visibleFixtures = fixturesData
    .filter((f) => f.team === teamFilter)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const activeFixtures = visibleFixtures.filter((f) => getMatchStatus(f) !== 'completed')
  const pastFixtures = visibleFixtures
    .filter((f) => getMatchStatus(f) === 'completed')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  const enteredResultsCount = visibleFixtures.filter((f) => !!getResult(f)).length

  async function loadResults() {
    setLoading(true)
    const { data } = await supabase.from('match_results').select('*')
    setDbResults(data || [])
    setLoading(false)
  }

  useEffect(() => { loadResults() }, [])

  function getResult(fixture) {
    return dbResults.find(
      (r) => r.fixture_date === fixture.date && r.team === fixture.team,
    ) || null
  }

  function startEdit(fixture) {
    const existing = getResult(fixture)
    setEditingKey(`${fixture.date}::${fixture.team}`)
    setForm(
      existing
        ? {
            result:        existing.result        || '',
            ...parseToss(existing.toss),
            ncb_score:     existing.ncb_score      || '',
            opp_score:     existing.opp_score      || '',
            mom:           existing.mom            || '',
            mom_stat:      existing.mom_stat       || '',
            scorecard_url: existing.scorecard_url  || '',
          }
        : { ...EMPTY_FORM },
    )
    setSaveError('')
  }

  async function handleSave(fixture) {
    setSaving(true)
    setSaveError('')
    const payload = {
      fixture_date:  fixture.date,
      opponent:      fixture.opponent,
      team:          fixture.team,
      venue:         fixture.venue,
      format:        fixture.format,
      result:        form.result.trim()        || null,
      toss:          form.toss_winner && form.toss_choice
                       ? `${form.toss_winner} won the toss and elected to ${form.toss_choice}`
                       : form.toss_winner
                       ? `${form.toss_winner} won the toss`
                       : null,
      ncb_score:     form.ncb_score.trim()     || null,
      opp_score:     form.opp_score.trim()     || null,
      mom:           form.mom.trim()           || null,
      mom_stat:      form.mom_stat.trim()      || null,
      scorecard_url: form.scorecard_url.trim() || null,
    }

    const { error } = await supabase
      .from('match_results')
      .upsert(payload, { onConflict: 'fixture_date,team' })

    if (error) { setSaveError(error.message); setSaving(false); return }
    setEditingKey(null)
    setSaving(false)
    loadResults()
  }

  async function handleDeleteResult(fixture) {
    await supabase
      .from('match_results')
      .delete()
      .eq('fixture_date', fixture.date)
      .eq('team', fixture.team)
    setConfirmDeleteKey(null)
    loadResults()
  }

  const formatDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    })
  }

  function renderFixtureCard(fixture) {
    const result      = getResult(fixture)
    const key         = `${fixture.date}::${fixture.team}`
    const isEditing   = editingKey === key
    const matchStatus = getMatchStatus(fixture)
    const isPast      = matchStatus === 'completed'
    const hasResult   = !!result
    const isRaising   = fixture.team === 'raising-bulls'

    return (
      <div
        key={key}
        className={`border rounded-xl sm:rounded-2xl overflow-hidden ${
          hasResult
            ? 'border-green-200 bg-green-50/30'
            : isPast
            ? 'border-amber-200 bg-amber-50/30'
            : 'border-gray-200 bg-white'
        }`}
      >
        {/* Fixture header */}
        <div className="px-3 sm:px-5 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {isSuperAdmin && (
                <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full ${
                  isRaising ? 'bg-primary-dark text-accent' : 'bg-primary text-white'
                }`}>
                  {isRaising ? 'Raising Bulls' : 'Royal Bulls'}
                </span>
              )}
              <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full ${
                matchStatus === 'live'
                  ? 'bg-red-100 text-red-700'
                  : matchStatus === 'upcoming'
                  ? 'bg-blue-100 text-blue-700'
                  : hasResult
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {matchStatus === 'live' ? 'Live' : matchStatus === 'upcoming' ? 'Upcoming' : hasResult ? 'Result Entered' : 'Awaiting Result'}
              </span>
              {fixture.format && (
                <span className="text-[10px] sm:text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{fixture.format}</span>
              )}
            </div>
            <p className="font-display font-bold text-primary text-base sm:text-lg leading-tight">vs {fixture.opponent}</p>
            <p className="text-xs sm:text-sm text-gray-500">
              {formatDate(fixture.date)}{fixture.time && ` · ${fixture.time}`}
              {fixture.venue && ` · ${fixture.venue}`}
            </p>
            {hasResult && !isEditing && (
              <div className="mt-1.5 sm:mt-2 flex flex-wrap gap-x-2.5 gap-y-1 text-xs sm:text-sm">
                {result.toss && (
                  <span className="inline-flex items-center gap-1 text-gray-500"><CoinIcon className="w-3.5 h-3.5" /> Toss: <strong>{result.toss}</strong></span>
                )}
                {result.result && (
                  <span className="font-semibold text-gray-700">{result.result}</span>
                )}
                {result.ncb_score && (
                  <span className="text-gray-500">{teamLabel(fixture.team)}: <strong>{result.ncb_score}</strong></span>
                )}
                {result.opp_score && (
                  <span className="text-gray-500">{fixture.opponent}: <strong>{result.opp_score}</strong></span>
                )}
                {result.mom && (
                  <span className="text-gray-500">MoM: <strong>{result.mom}</strong>{result.mom_stat ? ` (${result.mom_stat})` : ''}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 shrink-0">
            {!isEditing ? (
              <>
                <button
                  onClick={() => startEdit(fixture)}
                  className="text-xs sm:text-sm font-medium text-blue-500 hover:text-blue-700 px-2.5 sm:px-3 py-1.5 rounded-lg border border-blue-200 hover:border-blue-400 transition-all"
                >
                  {hasResult ? 'Edit' : matchStatus === 'live' ? 'Live Update' : 'Enter Result'}
                </button>
                {hasResult && (
                  confirmDeleteKey === key ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] sm:text-xs text-gray-500 font-medium">Clear?</span>
                      <button
                        onClick={() => handleDeleteResult(fixture)}
                        className="text-[11px] sm:text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDeleteKey(null)}
                        className="text-[11px] sm:text-xs font-medium text-gray-500 hover:text-gray-700 px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteKey(key)}
                      className="text-xs sm:text-sm font-medium text-red-400 hover:text-red-600 px-2.5 sm:px-3 py-1.5 rounded-lg border border-red-200 hover:border-red-400 transition-all"
                    >
                      Clear
                    </button>
                  )
                )}
              </>
            ) : null}
          </div>
        </div>

        {/* Edit form */}
        {isEditing && (
          <div className="border-t border-gray-200 px-3 sm:px-5 py-3 sm:py-4 bg-white">
            <div className="sm:col-span-2 border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-gray-50 mb-3">
              <p className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mb-2.5 sm:mb-3 flex items-center gap-1.5">
                <CoinIcon className="w-4 h-4" /> Toss
              </p>

              <p className="text-[11px] sm:text-xs font-medium text-gray-500 mb-1.5">Who won the toss?</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {[teamLabel(fixture.team), fixture.opponent].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm((f) => ({
                      ...f,
                      toss_winner: f.toss_winner === opt ? '' : opt,
                      toss_choice: f.toss_winner === opt ? '' : f.toss_choice,
                    }))}
                    className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition-all ${
                      form.toss_winner === opt
                        ? 'bg-primary-dark text-accent border-primary-dark shadow-sm'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-primary-dark hover:text-primary-dark'
                    }`}
                  >
                    {form.toss_winner === opt && <span className="mr-1">✓</span>}{opt}
                  </button>
                ))}
              </div>

              {form.toss_winner && (
                <>
                  <p className="text-[11px] sm:text-xs font-medium text-gray-500 mb-1.5">
                    <span className="font-bold text-primary-dark">{form.toss_winner}</span> elected to…
                  </p>
                  <div className="flex gap-2">
                    {[
                      { value: 'bat',  icon: '🏏', label: 'Bat',  active: 'bg-amber-500 text-white border-amber-500' },
                      { value: 'bowl', icon: '⚡', label: 'Bowl', active: 'bg-blue-600 text-white border-blue-600' },
                    ].map(({ value, icon, label, active }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm((f) => ({
                          ...f,
                          toss_choice: f.toss_choice === value ? '' : value,
                        }))}
                        className={`flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                          form.toss_choice === value
                            ? active + ' shadow-sm'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {icon} {label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {form.toss_winner && (
                <div className="mt-3 text-[11px] sm:text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2 leading-relaxed">
                  <span className="text-gray-400">Preview: </span>
                  <em className="text-gray-700">
                    {form.toss_winner} won the toss
                    {form.toss_choice ? ` and elected to ${form.toss_choice}` : ''}
                  </em>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-3">
              <input
                placeholder={`Result (e.g. "${teamLabel(fixture.team)} won by 47 runs")`}
                value={form.result}
                onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))}
                className="sm:col-span-2 border border-gray-300 rounded-xl px-3.5 sm:px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                placeholder={`${teamLabel(fixture.team)} score (e.g. 106/10)`}
                value={form.ncb_score}
                onChange={(e) => setForm((f) => ({ ...f, ncb_score: e.target.value }))}
                className="border border-gray-300 rounded-xl px-3.5 sm:px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                placeholder={`${fixture.opponent} score (e.g. 59/10)`}
                value={form.opp_score}
                onChange={(e) => setForm((f) => ({ ...f, opp_score: e.target.value }))}
                className="border border-gray-300 rounded-xl px-3.5 sm:px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                placeholder="Man of the Match name"
                value={form.mom}
                onChange={(e) => setForm((f) => ({ ...f, mom: e.target.value }))}
                className="border border-gray-300 rounded-xl px-3.5 sm:px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                placeholder='MoM stat (e.g. "54 off 32 balls")'
                value={form.mom_stat}
                onChange={(e) => setForm((f) => ({ ...f, mom_stat: e.target.value }))}
                className="border border-gray-300 rounded-xl px-3.5 sm:px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                placeholder="Scorecard URL (optional)"
                value={form.scorecard_url}
                onChange={(e) => setForm((f) => ({ ...f, scorecard_url: e.target.value }))}
                className="sm:col-span-2 border border-gray-300 rounded-xl px-3.5 sm:px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="mb-3">
              <label className="block text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                📋 Paste CricHeroes share text to auto-fill URL
              </label>
              <textarea
                rows={3}
                placeholder={"Paste the full share text from CricHeroes here…\ne.g. \"Check it out https://cricheroes.in/scorecard/…\""}
                className="w-full border border-gray-200 rounded-xl px-3.5 sm:px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none bg-gray-50"
                onChange={(e) => {
                  const match = e.target.value.match(/https:\/\/cricheroes\.in\/scorecard\/[^\s]+/)
                  if (match) setForm((f) => ({ ...f, scorecard_url: match[0] }))
                }}
              />
            </div>
            {saveError && <p className="text-red-600 text-sm mb-2">{saveError}</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSave(fixture)}
                disabled={saving}
                className="btn-primary text-sm px-5 sm:px-6 py-2.5 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save Result'}
              </button>
              <button
                onClick={() => setEditingKey(null)}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 px-3.5 sm:px-4 py-2.5 rounded-lg border border-gray-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-3 flex-wrap gap-2.5">

        <div>
          <h2 className="font-display font-bold text-primary text-xl sm:text-2xl mb-0.5">Match Results</h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Update live and upcoming matches fast. Expand past matches for edits.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white border border-gray-200 rounded-xl px-2.5 py-2">
          <div className="text-lg font-display font-bold text-primary-dark">{activeFixtures.length}</div>
          <div className="text-[10px] text-gray-500">Active/Upcoming</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-2.5 py-2">
          <div className="text-lg font-display font-bold text-primary-dark">{pastFixtures.length}</div>
          <div className="text-[10px] text-gray-500">Past Matches</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-2.5 py-2">
          <div className="text-lg font-display font-bold text-primary-dark">{enteredResultsCount}</div>
          <div className="text-[10px] text-gray-500">Results Entered</div>
        </div>
      </div>

      {/* Team filter */}
      <div className="flex gap-2 mb-4 sm:mb-6">
        {TEAMS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTeamFilter(t.id)}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
              teamFilter === t.id
                ? t.id === 'raising-bulls' ? 'bg-primary-dark text-accent' : 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <div className="pt-1">
            <button
              onClick={() => setShowPastMatches((s) => !s)}
              className="w-full flex items-center justify-between px-3.5 sm:px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🗂️</span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-700">Past Matches</p>
                  <p className="text-[11px] text-gray-500">{pastFixtures.length} match{pastFixtures.length !== 1 ? 'es' : ''} • Expand to edit old results</p>
                </div>
              </div>
              <span className="text-gray-500 text-sm font-semibold">{showPastMatches ? 'Hide' : 'Show'}</span>
            </button>

            {showPastMatches && (
              <div className="mt-3 space-y-3">
                {pastFixtures.length === 0 ? (
                  <div className="text-center text-sm text-gray-400 py-8 bg-white border border-gray-200 rounded-xl">
                    No past matches found.
                  </div>
                ) : (
                  pastFixtures.map(renderFixtureCard)
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Active & Upcoming</h3>
            <div className="space-y-3">
              {activeFixtures.length === 0 ? (
                <div className="text-center text-sm text-gray-400 py-8 bg-white border border-gray-200 rounded-xl">
                  No active or upcoming matches for this team.
                </div>
              ) : (
                activeFixtures.map(renderFixtureCard)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

