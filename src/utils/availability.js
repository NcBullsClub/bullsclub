import { SHEET_JSON_URL, SHEET_ID, FORM_ENTRIES } from '../config/googleForms'

/**
 * Returns true when the Google Sheet config has been filled in.
 */
export function isSheetConfigured() {
  return !SHEET_ID.includes('YOUR_')
}

/**
 * Returns true when all Google Form entry IDs have been filled in.
 */
export function isFormConfigured() {
  return Object.values(FORM_ENTRIES).every((v) => !v.includes('YOUR_'))
}

/**
 * Converts Google Sheets gviz date format "Date(Y,M,D)" (0-indexed month)
 * to "YYYY-MM-DD" so it can be matched against fixtures.json dates.
 */
function parseGoogleDate(val) {
  if (!val) return ''
  const str = String(val)
  const match = str.match(/Date\((\d{4}),(\d{1,2}),(\d{1,2})\)/)
  if (match) {
    const [, y, m, d] = match.map(Number)
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  // Already a plain string (e.g. "2026-04-05") — return as-is
  return str.trim()
}

/**
 * Finds a column index by matching partial label keywords (case-insensitive).
 */
function findCol(cols, ...keywords) {
  return cols.findIndex((c) => {
    const label = c.label?.trim().toLowerCase() ?? ''
    return keywords.some((k) => label.includes(k))
  })
}

/**
 * Fetches all availability responses from the published Google Sheet.
 *
 * Google's gviz/tq endpoint returns JSONP-style text like:
 *   google.visualization.Query.setResponse({...})
 * We strip the wrapper and parse the inner JSON.
 *
 * @returns {Promise<Array<{fixtureDate, playerName, team, availability, notes}>>}
 */
export async function fetchAvailability() {
  if (!isSheetConfigured()) return []

  const res = await fetch(SHEET_JSON_URL)
  const text = await res.text()

  const jsonStart = text.indexOf('{')
  const jsonEnd = text.lastIndexOf('}')
  if (jsonStart === -1 || jsonEnd === -1) return []

  const payload = JSON.parse(text.slice(jsonStart, jsonEnd + 1))
  const rows = payload?.table?.rows ?? []
  const cols = payload?.table?.cols ?? []

  // Find columns by keyword — robust against different question labels
  const nameCol  = findCol(cols, 'name', 'player')
  const dateCol  = findCol(cols, 'date', 'fixture', 'match')
  const teamCol  = findCol(cols, 'team')
  const availCol = findCol(cols, 'availability', 'available', 'avail')
  const notesCol = findCol(cols, 'notes', 'note', 'comment')

  return rows
    .map((row) => {
      const cell = (idx) => (idx >= 0 ? row.c?.[idx]?.v ?? '' : '')
      return {
        fixtureDate:  parseGoogleDate(cell(dateCol)),
        playerName:   String(cell(nameCol)).trim(),
        team:         String(cell(teamCol)).trim(),
        availability: String(cell(availCol)).trim(),
        notes:        String(cell(notesCol)).trim(),
      }
    })
    .filter((r) => r.fixtureDate && r.playerName)
}

/**
 * Groups availability records by fixtureDate and returns a summary map.
 * Availability values from the form are "In", "Out", "Maybe".
 *
 * @param {Array} records — result of fetchAvailability()
 * @returns {Object} key: "YYYY-MM-DD" → { inCount, outCount, maybeCount, names[] }
 */
export function groupByFixture(records) {
  return records.reduce((acc, r) => {
    const key = r.fixtureDate
    if (!acc[key]) acc[key] = { inCount: 0, outCount: 0, maybeCount: 0, names: [], inNames: [], maybeNames: [], outNames: [] }
    const s = r.availability.toLowerCase()
    if (s === 'in')    { acc[key].inCount    += 1; if (r.playerName) acc[key].inNames.push(r.playerName) }
    if (s === 'out')   { acc[key].outCount   += 1; if (r.playerName) acc[key].outNames.push(r.playerName) }
    if (s === 'maybe') { acc[key].maybeCount += 1; if (r.playerName) acc[key].maybeNames.push(r.playerName) }
    if (r.playerName)  acc[key].names.push(r.playerName)
    return acc
  }, {})
}

/**
 * Returns the availability summary for a single fixture.
 *
 * @param {Array}  records     — result of fetchAvailability()
 * @param {string} fixtureDate — "YYYY-MM-DD" from buildFixtureId()
 * @returns {{ inCount: number, outCount: number, maybeCount: number, names: string[] }}
 */
export function getFixtureAvailability(records, fixtureDate) {
  const grouped = groupByFixture(records)
  return grouped[fixtureDate] ?? { inCount: 0, outCount: 0, maybeCount: 0, names: [], inNames: [], maybeNames: [], outNames: [] }
}

/**
 * Returns the canonical key used to match fixture records from the Sheet.
 * Simply returns the fixture's date string ("YYYY-MM-DD") since the form
 * uses a date-picker field to identify the match.
 *
 * @param {Object} fixture — fixture object from fixtures.json
 * @returns {string} e.g. "2026-04-05"
 */
export function buildFixtureId(fixture) {
  return fixture.date
}

