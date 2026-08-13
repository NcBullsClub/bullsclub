export function normalizeFixtureType(value) {
  const v = String(value || '').trim().toLowerCase()
  if (!v || v === 'mega bash' || v === 'mega smash' || v === 'league') return 'League'
  if (v === 'playoff' || v === 'playoffs' || v === 'quarterfinal' || v === 'quarterfinals' || v === 'qualifier' || v === 'qualifiers') return 'Playoffs'
  if (v === 'semifinal' || v === 'semi final' || v === 'semi-final' || v === 'semifinals' || v === 'semis') return 'SemiFinal'
  if (v === 'championship' || v === 'final') return 'Championship'
  return 'League'
}

export function parseLeagueGameNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  if (!Number.isInteger(num) || num < 1) return null
  return num
}

/** e.g. "League #2" when number is set, otherwise "League", "Playoffs", etc. */
export function formatFixtureTypeDisplay(type, leagueGameNumber) {
  const normalized = normalizeFixtureType(type)
  const num = parseLeagueGameNumber(leagueGameNumber)
  if (normalized === 'League' && num !== null) {
    return `League #${num}`
  }
  return normalized
}
