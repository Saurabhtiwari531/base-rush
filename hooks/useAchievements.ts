'use client'
import { useEffect, useRef, useState } from 'react'

export type RunStats = {
  distance: number
  coins: number
  topCombo: number
  duration: number
  topSpeed: number
}

export type CareerStats = {
  totalGames: number
  totalCoins: number
  totalDistance: number
  chainSubmissions: number
  bestScore: number
}

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export type Achievement = {
  id: string
  icon: string
  name: string
  desc: string
  rarity: Rarity
  check: (
    run: RunStats,
    career: CareerStats,
    ctx: { score: number; isNewBest: boolean; submittedOnChain: boolean }
  ) => boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  // ── Common ──────────────────────────────────────────
  { id: 'first_coin', icon: '🪙', name: 'First Coin', desc: 'Collect your first coin', rarity: 'common',
    check: (_, c) => c.totalCoins >= 1 },
  { id: 'first_run', icon: '🏁', name: 'Welcome Runner', desc: 'Finish your first run', rarity: 'common',
    check: (_, c) => c.totalGames >= 1 },
  { id: 'sprinter', icon: '🏃', name: 'Sprinter', desc: 'Run 500m in a single run', rarity: 'common',
    check: (r) => r.distance >= 500 },
  { id: 'score_1k', icon: '🎯', name: 'Score Hunter', desc: 'Reach 1,000 points', rarity: 'common',
    check: (_, __, ctx) => ctx.score >= 1000 },
  { id: 'coins_50', icon: '💰', name: 'Coin Magnet', desc: 'Collect 50 coins in one run', rarity: 'common',
    check: (r) => r.coins >= 50 },

  // ── Rare ────────────────────────────────────────────
  { id: 'marathoner', icon: '🏃‍♂️', name: 'Marathoner', desc: 'Run 1,000m in a single run', rarity: 'rare',
    check: (r) => r.distance >= 1000 },
  { id: 'score_5k', icon: '💯', name: 'High Roller', desc: 'Reach 5,000 points', rarity: 'rare',
    check: (_, __, ctx) => ctx.score >= 5000 },
  { id: 'combo_10', icon: '🔥', name: 'Combo Master', desc: 'Hit a x10 combo', rarity: 'rare',
    check: (r) => r.topCombo >= 10 },
  { id: 'speed_demon', icon: '🚀', name: 'Speed Demon', desc: 'Reach 3.0x speed', rarity: 'rare',
    check: (r) => r.topSpeed >= 3.0 },
  { id: 'survivor', icon: '🛡️', name: 'Untouchable', desc: 'Survive 60 seconds in a run', rarity: 'rare',
    check: (r) => r.duration >= 60 },

  // ── Epic ────────────────────────────────────────────
  { id: 'distance_5k', icon: '🛣️', name: 'Long Hauler', desc: 'Run 5,000m in a single run', rarity: 'epic',
    check: (r) => r.distance >= 5000 },
  { id: 'combo_20', icon: '⚡', name: 'Combo Legend', desc: 'Hit a x20 combo', rarity: 'epic',
    check: (r) => r.topCombo >= 20 },
  { id: 'coin_hoard', icon: '👑', name: 'Treasure Hunter', desc: 'Collect 500 coins (career)', rarity: 'epic',
    check: (_, c) => c.totalCoins >= 500 },
  { id: 'dedicated', icon: '🎮', name: 'Dedicated', desc: 'Play 25 games', rarity: 'epic',
    check: (_, c) => c.totalGames >= 25 },

  // ── Legendary ───────────────────────────────────────
  { id: 'score_10k', icon: '🏆', name: 'Legend', desc: 'Reach 10,000 points', rarity: 'legendary',
    check: (_, __, ctx) => ctx.score >= 10000 },
  { id: 'on_chain', icon: '⛓️', name: 'On-Chain Hero', desc: 'Submit a score on-chain', rarity: 'legendary',
    check: (_, __, ctx) => ctx.submittedOnChain },
]

const DEFAULT_CAREER: CareerStats = {
  totalGames: 0, totalCoins: 0, totalDistance: 0, chainSubmissions: 0, bestScore: 0,
}

const KEY_UNLOCKED = 'baserush.achievements.v1'
const KEY_CAREER = 'baserush.career.v1'

export function useAchievements() {
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set())
  const [career, setCareer] = useState<CareerStats>(DEFAULT_CAREER)
  const [toastQueue, setToastQueue] = useState<Achievement[]>([])
  const [loaded, setLoaded] = useState(false)
  const careerRef = useRef(career)
  careerRef.current = career
  const unlockedRef = useRef(unlocked)
  unlockedRef.current = unlocked

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const u = localStorage.getItem(KEY_UNLOCKED)
      if (u) setUnlocked(new Set(JSON.parse(u)))
      const c = localStorage.getItem(KEY_CAREER)
      if (c) setCareer({ ...DEFAULT_CAREER, ...JSON.parse(c) })
    } catch (e) {}
    setLoaded(true)
  }, [])

  // Persist
  useEffect(() => {
    if (!loaded) return
    try { localStorage.setItem(KEY_UNLOCKED, JSON.stringify([...unlocked])) } catch (e) {}
  }, [unlocked, loaded])
  useEffect(() => {
    if (!loaded) return
    try { localStorage.setItem(KEY_CAREER, JSON.stringify(career)) } catch (e) {}
  }, [career, loaded])

  // Called once when a run ends (updates career, checks all non-chain achievements)
  const finalizeRun = (run: RunStats, ctx: { score: number; isNewBest: boolean }) => {
    const newCareer: CareerStats = {
      totalGames: careerRef.current.totalGames + 1,
      totalCoins: careerRef.current.totalCoins + run.coins,
      totalDistance: careerRef.current.totalDistance + run.distance,
      chainSubmissions: careerRef.current.chainSubmissions,
      bestScore: Math.max(careerRef.current.bestScore, ctx.score),
    }
    setCareer(newCareer)

    const newlyUnlocked: Achievement[] = []
    ACHIEVEMENTS.forEach(a => {
      if (unlockedRef.current.has(a.id)) return
      if (a.check(run, newCareer, { ...ctx, submittedOnChain: false })) {
        newlyUnlocked.push(a)
      }
    })
    if (newlyUnlocked.length > 0) {
      setUnlocked(prev => {
        const next = new Set(prev)
        newlyUnlocked.forEach(a => next.add(a.id))
        return next
      })
      setToastQueue(prev => [...prev, ...newlyUnlocked])
    }
  }

  // Called when on-chain submit succeeds
  const unlockOnChain = () => {
    const ach = ACHIEVEMENTS.find(a => a.id === 'on_chain')
    if (!ach) return
    setCareer(prev => ({ ...prev, chainSubmissions: prev.chainSubmissions + 1 }))
    if (unlockedRef.current.has(ach.id)) return
    setUnlocked(prev => new Set(prev).add(ach.id))
    setToastQueue(prev => [...prev, ach])
  }

  const dismissToast = () => setToastQueue(prev => prev.slice(1))

  return {
    unlocked, career, loaded,
    currentToast: toastQueue[0] || null,
    finalizeRun, unlockOnChain, dismissToast,
  }
}
