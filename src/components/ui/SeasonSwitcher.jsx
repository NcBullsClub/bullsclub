import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSeason } from '../../contexts/SeasonContext'
import { SEASON_THEME, getSeasonStatus } from '../../config/seasons'

const STATUS_META = {
  active:   { text: 'Active',   dot: 'bg-green-500',  cls: 'bg-green-100 text-green-700 border-green-200' },
  upcoming: { text: 'Upcoming', dot: 'bg-blue-500',   cls: 'bg-blue-100  text-blue-700  border-blue-200'  },
  past:     { text: 'Past',     dot: 'bg-gray-300',   cls: 'bg-gray-100  text-gray-500  border-gray-200'  },
}

/* ─── shared dropdown panel (used by both variants) ──────── */
function SeasonDropdownPanel({ seasons, activeSeason, setActiveSeason, onClose }) {
  // Group by year for visual separation
  const byYear = seasons.reduce((acc, s) => {
    ;(acc[s.year] = acc[s.year] || []).push(s)
    return acc
  }, {})

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{    opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      className="absolute right-0 top-full mt-1.5 z-50 w-52 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
      role="listbox"
      aria-label="Select season"
    >
      {Object.entries(byYear).map(([year, ys], gi) => (
        <div key={year}>
          {/* Year group header */}
          <div className={`px-3 py-1.5 ${gi > 0 ? 'border-t border-gray-100' : ''}`}>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{year}</span>
          </div>
          {ys.map((season) => {
            const isActive = season.id === activeSeason.id
            const status   = getSeasonStatus(season)
            const sm       = STATUS_META[status]
            const t        = SEASON_THEME[season.color]
            return (
              <button
                key={season.id}
                role="option"
                aria-selected={isActive}
                onClick={() => { setActiveSeason(season); onClose() }}
                className={[
                  'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                  isActive ? 'bg-gray-50' : 'hover:bg-gray-50 active:bg-gray-100',
                ].join(' ')}
              >
                {/* Colored left accent */}
                <span className={`w-1 self-stretch rounded-full flex-shrink-0 ${t.badge}`} />

                {/* Icon + label */}
                <span className="text-xs leading-none flex-shrink-0">{season.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className={`block text-[11px] font-semibold leading-tight ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                    {season.label}
                  </span>
                  <span className="flex items-center gap-1 mt-0.5">
                    <span className={`w-1 h-1 rounded-full flex-shrink-0 ${sm.dot}`} />
                    <span className={`text-[9px] font-semibold ${status === 'active' ? 'text-green-600' : status === 'upcoming' ? 'text-blue-600' : 'text-gray-400'}`}>
                      {sm.text}
                    </span>
                  </span>
                </span>

                {/* Check mark for active */}
                {isActive && (
                  <svg className={`w-3 h-3 flex-shrink-0 ${t.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      ))}
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/**
 * SeasonSwitcher  (full-width banner variant)
 *
 * Renders a themed banner with a single dropdown trigger.
 * Drop at the top of season-scoped pages: Fixtures, Results, Availability.
 */
export default function SeasonSwitcher({ className = '' }) {
  const { seasons, activeSeason, setActiveSeason } = useSeason()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const theme  = SEASON_THEME[activeSeason.color]
  const status = getSeasonStatus(activeSeason)
  const sm     = STATUS_META[status]

  return (
    <div className={`w-full ${className}`}>
      <div className={`bg-gradient-to-r ${theme.banner} border-b transition-colors duration-300`}>
        {/* Top accent stripe */}
        <div className={`h-0.5 w-full ${theme.bannerStripe} transition-colors duration-300`} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            {/* Calendar icon + label */}
            <div className="flex items-center gap-2 text-gray-500 flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-wider select-none hidden sm:inline">Season</span>
            </div>

            {/* Dropdown trigger */}
            <div className="relative" ref={ref}>
              <button
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className={[
                  'flex items-center gap-2.5 pl-3.5 pr-3 py-2 rounded-xl border transition-all duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                  open
                    ? `bg-white border-gray-300 shadow-sm ${theme.ring}`
                    : `bg-white/80 border-gray-200 hover:bg-white hover:border-gray-300 hover:shadow-sm`,
                ].join(' ')}
              >
                {/* Left color bar */}
                <span className={`w-1 h-5 rounded-full flex-shrink-0 ${theme.badge}`} />

                {/* Icon + name */}
                <span className="text-base leading-none">{activeSeason.icon}</span>
                <span className="text-sm font-bold text-gray-800 leading-tight">{activeSeason.label}</span>

                {/* Status badge */}
                <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-bold border px-1.5 py-0.5 rounded-full ${sm.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                  {sm.text}
                </span>

                {/* Chevron */}
                <motion.svg
                  animate={{ rotate: open ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-4 h-4 text-gray-400 flex-shrink-0"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>

              <AnimatePresence>
                {open && (
                  <SeasonDropdownPanel
                    seasons={seasons}
                    activeSeason={activeSeason}
                    setActiveSeason={setActiveSeason}
                    onClose={() => setOpen(false)}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Fixture count hint — filled in by parent page via context, shown as subtle text */}
            <span className="ml-auto text-[11px] text-gray-400 hidden sm:block select-none">
              Showing fixtures for <span className="font-semibold text-gray-600">{activeSeason.label}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────── */
/**
 * SeasonSwitcherInline  (compact dropdown for tight spaces, e.g. admin panel)
 */
export function SeasonSwitcherInline({ className = '' }) {
  const { seasons, activeSeason, setActiveSeason } = useSeason()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const theme  = SEASON_THEME[activeSeason.color]
  const status = getSeasonStatus(activeSeason)
  const sm     = STATUS_META[status]

  return (
    <div className={`relative flex-shrink-0 ${className}`} ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          'flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-lg border text-[11px] font-semibold whitespace-nowrap',
          'transition-all duration-150 focus:outline-none focus-visible:ring-2',
          open
            ? 'bg-white border-gray-300 shadow-sm'
            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm',
        ].join(' ')}
      >
        <span className={`w-1 h-3.5 rounded-full flex-shrink-0 ${theme.badge}`} />
        <span className="text-xs leading-none">{activeSeason.icon}</span>
        <span className="text-gray-800">{activeSeason.label}</span>
        <span className={`hidden sm:inline-flex items-center gap-1 text-[9px] font-bold border px-1 py-0.5 rounded-full ${sm.cls}`}>
          <span className={`w-1 h-1 rounded-full ${sm.dot}`} />
          {sm.text}
        </span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-3.5 h-3.5 text-gray-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {open && (
          <SeasonDropdownPanel
            seasons={seasons}
            activeSeason={activeSeason}
            setActiveSeason={setActiveSeason}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
