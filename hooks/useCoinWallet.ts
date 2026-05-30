'use client'
import { useState, useEffect } from 'react'

const KEY = 'baserush.wallet.v1'

export function useCoinWallet() {
  const [balance, setBalance] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY)
      if (s) setBalance(parseInt(s, 10) || 0)
    } catch (e) {}
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try { localStorage.setItem(KEY, balance.toString()) } catch (e) {}
  }, [balance, loaded])

  const addCoins = (n: number) => setBalance(b => b + Math.max(0, Math.floor(n)))
  const spendCoins = (n: number): boolean => {
    if (balance < n) return false
    setBalance(b => b - n)
    return true
  }

  return { balance, addCoins, spendCoins }
}
