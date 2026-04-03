import { useState } from 'react'
import { motion } from 'framer-motion'
import baseFixtures from '../data/fixtures.json'

const ADMIN_PIN = 'bulls2026'
const LS_KEY = 'ncb_fixture_overrides'

function loadOverrides() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}

function saveOverrides(obj) {
  localStorage.setItem(LS_KEY, JSON.stringify(obj))
}

export default function Admin() {
  const [pin, setPin] = useState('')
  const [authed, setAuthed] = useState(false)
  const [error, setError] = useState('')
  const [overrides, setOverrides] = useState(loadOverrides)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [saved, setSaved] = useState(null)

  const login = () => {
    if (pin === ADMIN_PIN) { setAuthed(true); setError('') }
    else setError('Incorrect PIN. Try again.')
  }

  const fixtures = baseFixtures.map(f => ({ ...f, ...(overrides[f.id] || {}) }))

  const startEdit = (f) => {
    setEditing(f.id)
    setForm({
      status: f.status || 'upcoming',
      result: f.result || '',
      homeScore: f.homeScore || '',
      awayScore: f.awayScore || '',
    })
  }

  const saveEdit = (id) => {
    const next = { ...overrides, [id]: { ...form } }
    setOverrides(next)
    saveOverrides(next)
    setEditing(null)
    setSaved(id)
    setTimeout(() => setSaved(null), 2000)
  }

  const clearOverride = (id) => {
    const next = { ...overrides }
    delete next[id]
    setOverrides(next)
    saveOverrides(next)
  }

  const resetAll = () => {
    if (confirm('Reset all edits and restore original fixture data?')) {
      setOverrides({})
      localStorage.removeItem(LS_KEY)
      setEditing(null)
    }
  }

  const exportJSON = () => {
    const merged = baseFixtures.map(f => ({ ...f, ...(overrides[f.id] || {}) }))
    const blob = new Blob([JSON.stringify(merged, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'fixtures.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  // ── PIN screen ──────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-primary-dark flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 w-full max-w-xs shadow-2xl text-center"
        >
          <div className="font-display text-4xl font-bold text-primary mb-0.5">ADMIN</div>
          <div className="text-xs text-gray-400 tracking-widest mb-6">NC BULLS CRICKET CLUB</div>
          <input
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center text-xl tracking-[0.4em] mb-3 focus:outline-none focus:ring-2 focus:ring-accent"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button
            onClick={login}
            className="w-full bg-accent text-primary-dark font-bold rounded-xl py-3 hover:bg-yellow-400 transition-colors text-sm"
          >
            Login
          </button>
        </motion.div>
      </div>
    )
  }

  // ── Admin panel ─────────────────────────────────────────────────────────────
  const editedCount = Object.keys(overrides).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-primary-dark text-white px-4 sm:px-6 py-4 flex items-center justify-between gap-3 sticky top-0 z-40 shadow-lg">
        <div>
          <div className="font-display text-xl font-bold">Admin Panel</div>
          <div className="text-xs text-gray-400">Fixture Manager · NC Bulls</div>
        </div>
        <div className="flex gap-2">
          {editedCount > 0 && (
            <button
              onClick={resetAll}
              className="text-xs text-red-400 border border-red-400/40 px-3 py-2 rounded-lg hover:bg-red-900/20 transition-colors"
            >
              Reset All
            </button>
          )}
          <button
            onClick={exportJSON}
            className="text-xs bg-accent text-primary-dark font-bold px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
          >
            ↓ Export JSON
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 sm:px-6 py-2.5 text-xs text-blue-700 leading-relaxed">
        <strong>How it works:</strong> Edits save instantly and show on <em>this browser</em>.
        To publish for all visitors → click <strong>Export JSON</strong> → replace{' '}
        <code className="bg-blue-100 px-1 rounded">src/data/fixtures.json</code> → run{' '}
        <code className="bg-blue-100 px-1 rounded">npm run deploy</code>.
        {editedCount > 0 && (
          <span className="ml-2 font-semibold text-blue-900">{editedCount} fixture{editedCount > 1 ? 's' : ''} edited.</span>
        )}
      </div>

      {/* Fixture cards */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        {['raising-bulls', 'royal-bulls'].map(team => (
          <div key={team}>
            <h2 className="font-display text-lg font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: team === 'raising-bulls' ? '#f5c518' : '#1a3a5c' }} />
              {team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'}
            </h2>

            <div className="space-y-3">
              {fixtures.filter(f => f.team === team).map(f => {
                const isEditing = editing === f.id
                const hasOverride = !!overrides[f.id]
                const isSaved = saved === f.id

                return (
                  <div
                    key={f.id}
                    className={`bg-white rounded-2xl border transition-all ${
                      hasOverride ? 'border-accent shadow-sm' : 'border-gray-200'
                    } overflow-hidden`}
                  >
                    {/* Fixture row */}
                    <div className="flex items-start gap-3 p-4">
                      {/* Date badge */}
                      <div className="bg-primary-dark text-white rounded-xl px-3 py-2 text-center min-w-[52px] flex-shrink-0">
                        {(() => {
                          const [y, m, d] = f.date.split('-').map(Number)
                          const dt = new Date(y, m - 1, d)
                          return (
                            <>
                              <div className="font-display font-bold text-accent text-lg leading-none">{dt.getDate()}</div>
                              <div className="text-xs text-gray-300">{dt.toLocaleDateString('en-US', { month: 'short' })}</div>
                            </>
                          )
                        })()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-primary leading-snug">
                          vs {f.opponent}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{f.time} · {f.venue} · {f.format}</div>

                        {/* Status / result */}
                        <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            f.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-50 text-yellow-700'
                          }`}>
                            {f.status === 'completed' ? '✓ Completed' : '● Upcoming'}
                          </span>
                          {f.result && (
                            <span className="text-xs text-gray-500 truncate max-w-[220px]">{f.result}</span>
                          )}
                          {f.homeScore && f.awayScore && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono">
                              {f.homeScore} / {f.awayScore}
                            </span>
                          )}
                          {hasOverride && (
                            <span className="text-xs bg-accent/20 text-yellow-900 px-2 py-0.5 rounded-full">edited</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1.5 flex-shrink-0">
                        {isSaved && (
                          <span className="text-xs text-green-600 font-semibold self-center pr-1">Saved ✓</span>
                        )}
                        {hasOverride && !isEditing && (
                          <button
                            onClick={() => clearOverride(f.id)}
                            className="text-xs text-red-500 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Reset
                          </button>
                        )}
                        <button
                          onClick={() => isEditing ? setEditing(null) : startEdit(f)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                            isEditing
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-primary-dark text-white hover:bg-primary'
                          }`}
                        >
                          {isEditing ? 'Cancel' : 'Edit'}
                        </button>
                      </div>
                    </div>

                    {/* Edit form */}
                    {isEditing && (
                      <div className="border-t border-gray-100 bg-gray-50 p-4 grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Status</label>
                          <select
                            value={form.status}
                            onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                            className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                          >
                            <option value="upcoming">Upcoming</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">Result summary</label>
                          <input
                            value={form.result}
                            onChange={e => setForm(p => ({ ...p, result: e.target.value }))}
                            placeholder="e.g. Raising Bulls won by 15 runs"
                            className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">
                            {team === 'raising-bulls' ? 'Raising Bulls' : 'Royal Bulls'} Score
                          </label>
                          <input
                            value={form.homeScore}
                            onChange={e => setForm(p => ({ ...p, homeScore: e.target.value }))}
                            placeholder="e.g. 145/6 (20)"
                            className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-500 block mb-1">{f.opponent} Score</label>
                          <input
                            value={form.awayScore}
                            onChange={e => setForm(p => ({ ...p, awayScore: e.target.value }))}
                            placeholder="e.g. 130/8 (20)"
                            className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <button
                            onClick={() => saveEdit(f.id)}
                            className="w-full bg-accent text-primary-dark font-bold py-2.5 rounded-xl hover:bg-yellow-400 transition-colors"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
