const CALLED_OFF_PATTERN = /called?\s*off|call\s*off|abandon(?:ed|ment)?|no\s*result|(?:match\s*)?cancel(?:led|ed)?|rain(?:ed)?\s*off|wash(?:ed)?\s*out|postponed|unplayable/i

export function isCalledOff(r) {
  const text = String(r?.result || '').trim()
  if (!text) return false
  return CALLED_OFF_PATTERN.test(text)
}

export function isComplete(r) {
  if (isCalledOff(r)) return true
  return !!(r?.result && r?.ncb_score && r?.opp_score)
}

/** @returns {'won' | 'lost' | 'called_off' | 'pending'} */
export function getMatchOutcome(r) {
  if (isCalledOff(r)) return 'called_off'
  if (!isComplete(r)) return 'pending'
  const label = r.team === 'raising-bulls' ? 'Raising Bulls won' : 'Royal Bulls won'
  if (String(r.result).toLowerCase().includes(label.toLowerCase())) return 'won'
  return 'lost'
}

export function isWon(r) {
  return getMatchOutcome(r) === 'won'
}

export function isLost(r) {
  return getMatchOutcome(r) === 'lost'
}

export function getOutcomeStyles(outcome) {
  switch (outcome) {
    case 'won':
      return {
        border: 'border-l-green-500',
        badgeBg: 'bg-green-100 text-green-700',
        badgeLabel: 'W',
        resultPill: 'bg-green-50 text-green-700 border border-green-200',
        resultText: 'text-green-600',
      }
    case 'lost':
      return {
        border: 'border-l-red-400',
        badgeBg: 'bg-red-100 text-red-600',
        badgeLabel: 'L',
        resultPill: 'bg-red-50 text-red-600 border border-red-200',
        resultText: 'text-red-500',
      }
    case 'called_off':
      return {
        border: 'border-l-slate-400',
        badgeBg: 'bg-slate-100 text-slate-600',
        badgeLabel: 'NR',
        resultPill: 'bg-slate-100 text-slate-600 border border-slate-200',
        resultText: 'text-slate-500',
      }
    default:
      return {
        border: 'border-l-amber-400',
        badgeBg: 'bg-amber-100 text-amber-700',
        badgeLabel: '~',
        resultPill: 'bg-amber-50 text-amber-700 border border-amber-200',
        resultText: 'text-gray-500',
      }
  }
}
