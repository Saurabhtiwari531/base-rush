'use client'
import { useEffect, useState } from 'react'

const KEY = 'baserush_best'

export function usePersonalBest() {
  const [best, setBest] = useState(0)
  const [isNewBest, setIsNewBest] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = Number(localStorage.getItem(KEY) || 0)
    setBest(stored)
  }, [])

  // Returns true if this score is a new record
  const checkAndUpdate = (score: number): boolean => {
    const floor = Math.floor(score)
    const prev = Number(localStorage.getItem(KEY) || 0)
    if (floor > prev) {
      localStorage.setItem(KEY, String(floor))
      setBest(floor)
      setIsNewBest(true)
      return true
    }
    setIsNewBest(false)
    return false
  }

  const resetNewBest = () => setIsNewBest(false)

  return { best, isNewBest, checkAndUpdate, resetNewBest }
}
