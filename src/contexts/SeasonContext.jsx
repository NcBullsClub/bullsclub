import { createContext, useContext, useState, useEffect } from 'react'
import { SEASONS, resolveDefaultSeason } from '../config/seasons'

const STORAGE_KEY = 'ncb_active_season'

const SeasonContext = createContext(null)

export function SeasonProvider({ children }) {
  const [activeSeason, setActiveSeasonState] = useState(() => {
    // Restore persisted selection, falling back to the current/next season
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const found = SEASONS.find((s) => s.id === stored)
      if (found) return found
    }
    return resolveDefaultSeason()
  })

  // Persist selection whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activeSeason.id)
  }, [activeSeason])

  function setActiveSeason(seasonOrId) {
    const season =
      typeof seasonOrId === 'string'
        ? SEASONS.find((s) => s.id === seasonOrId)
        : seasonOrId
    if (season) setActiveSeasonState(season)
  }

  return (
    <SeasonContext.Provider value={{ activeSeason, setActiveSeason, seasons: SEASONS }}>
      {children}
    </SeasonContext.Provider>
  )
}

/** Hook for consuming the active season anywhere in the tree. */
export function useSeason() {
  const ctx = useContext(SeasonContext)
  if (!ctx) throw new Error('useSeason must be used inside <SeasonProvider>')
  return ctx
}
