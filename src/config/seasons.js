/**
 * Season definitions for NC Bulls Cricket Club.
 *
 * Each year has three seasons:
 *   • Mega Bash   – spring/early summer
 *   • Mega Smash  – mid summer
 *   • Winter      – autumn/winter
 *
 * `id`         – slug stored in the `season` column of the fixtures table
 * `label`      – human-readable display name
 * `shortLabel` – compact label used in tight spaces
 * `year`       – calendar year
 * `startDate`  – ISO date string (inclusive)
 * `endDate`    – ISO date string (inclusive)
 * `color`      – Tailwind color key used to theme the season badge
 * `icon`       – emoji shorthand
 */

export const SEASONS = [
  // ── 2026 ──────────────────────────────────────────────────────────────────
  {
    id:         'mega-bash-26',
    label:      "Mega Bash '26",
    shortLabel: 'Mega Bash',
    year:       2026,
    startDate:  '2026-03-01',
    endDate:    '2026-06-15',
    color:      'amber',
    icon:       '🔥',
  },
  {
    id:         'mega-smash-26',
    label:      "Mega Smash '26",
    shortLabel: 'Mega Smash',
    year:       2026,
    startDate:  '2026-06-16',
    endDate:    '2026-09-15',
    color:      'blue',
    icon:       '⚡',
  },
  {
    id:         'winter-26',
    label:      "Winter '26",
    shortLabel: 'Winter',
    year:       2026,
    startDate:  '2026-09-16',
    endDate:    '2026-12-31',
    color:      'indigo',
    icon:       '❄️',
  },
]

/**
 * Tailwind classes per season color.
 * Kept explicit so Tailwind's JIT scanner can detect them.
 */
export const SEASON_THEME = {
  amber: {
    pill:          'bg-amber-100 text-amber-800 border-amber-300',
    pillActive:    'bg-amber-500 text-white border-amber-500 shadow-amber-200',
    pillHover:     'hover:bg-amber-50 hover:border-amber-400',
    badge:         'bg-amber-500',
    dot:           'bg-amber-500',
    glow:          'shadow-amber-200',
    ring:          'ring-amber-400',
    text:          'text-amber-600',
    banner:        'from-amber-50 to-orange-50 border-amber-200',
    bannerStripe:  'bg-amber-400',
  },
  blue: {
    pill:          'bg-blue-100 text-blue-800 border-blue-300',
    pillActive:    'bg-blue-600 text-white border-blue-600 shadow-blue-200',
    pillHover:     'hover:bg-blue-50 hover:border-blue-400',
    badge:         'bg-blue-600',
    dot:           'bg-blue-600',
    glow:          'shadow-blue-200',
    ring:          'ring-blue-400',
    text:          'text-blue-600',
    banner:        'from-blue-50 to-cyan-50 border-blue-200',
    bannerStripe:  'bg-blue-500',
  },
  indigo: {
    pill:          'bg-indigo-100 text-indigo-800 border-indigo-300',
    pillActive:    'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200',
    pillHover:     'hover:bg-indigo-50 hover:border-indigo-400',
    badge:         'bg-indigo-600',
    dot:           'bg-indigo-600',
    glow:          'shadow-indigo-200',
    ring:          'ring-indigo-400',
    text:          'text-indigo-600',
    banner:        'from-indigo-50 to-violet-50 border-indigo-200',
    bannerStripe:  'bg-indigo-500',
  },
}

/**
 * Derive the status of a season relative to today.
 * @returns {'active' | 'upcoming' | 'past'}
 */
export function getSeasonStatus(season) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [sy, sm, sd] = season.startDate.split('-').map(Number)
  const [ey, em, ed] = season.endDate.split('-').map(Number)
  const start = new Date(sy, sm - 1, sd)
  const end   = new Date(ey, em - 1, ed)
  if (today > end)   return 'past'
  if (today < start) return 'upcoming'
  return 'active'
}

/**
 * Returns the season that is currently 'active', or the next upcoming one,
 * or the most recent past one as a fallback.
 */
export function resolveDefaultSeason() {
  const active   = SEASONS.find((s) => getSeasonStatus(s) === 'active')
  if (active) return active
  const upcoming = SEASONS.filter((s) => getSeasonStatus(s) === 'upcoming')
  if (upcoming.length) return upcoming[0]
  const past = [...SEASONS].reverse().find((s) => getSeasonStatus(s) === 'past')
  return past ?? SEASONS[SEASONS.length - 1]
}
