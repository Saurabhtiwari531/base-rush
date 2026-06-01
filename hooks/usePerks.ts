'use client'
import { useState, useEffect } from 'react'

// Account-level perks earned from rewards (mystery box, etc.).
// scoreBoost: multiplier applied to passive score (1.0 = none, 1.1 = +10%).
// badges: prestige badge ids the player owns.
type PerksState = {
  scoreBoost: number
  badges: string[]
}

const DEFAULT: PerksState = { scoreBoost: 1, badges: [] }
const KEY = 'baserush.perks.v1'

export function usePerks() {
  const [state, setState] = useState<PerksState>(DEFAULT)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY)
      if (s) setState({ ...DEFAULT, ...JSON.parse(s) })
    } catch (e) {}
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch (e) {}
  }, [state, loaded])

  // Add a permanent score boost (additive on the +X% amount), capped at +50%.
  const addScoreBoost = (amount: number) =>
    setState(p => ({ ...p, scoreBoost: Math.min(1.5, +(p.scoreBoost + amount).toFixed(2)) }))

  const addBadge = (id: string) =>
    setState(p => (p.badges.includes(id) ? p : { ...p, badges: [...p.badges, id] }))

  const hasBadge = (id: string) => state.badges.includes(id)

  return { scoreBoost: state.scoreBoost, badges: state.badges, addScoreBoost, addBadge, hasBadge }
}
