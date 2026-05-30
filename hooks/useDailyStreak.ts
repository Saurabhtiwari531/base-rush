'use client'
import { useState, useEffect, useRef } from 'react'
import { useConnection, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'

export const STREAK_TARGET_DAYS = 25
export const PRIZE_USD = 5

type StreakState = {
  streak: number
  lastCheckIn: string
  totalCheckIns: number
  startDate: string
  prizeClaimedDay25: boolean
  lastHash: string | null
}

const DEFAULT_STATE: StreakState = {
  streak: 0,
  lastCheckIn: '',
  totalCheckIns: 0,
  startDate: '',
  prizeClaimedDay25: false,
  lastHash: null,
}

const KEY = 'baserush.streak.v1'

function dateStr(d: Date) {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}
function getToday() { return dateStr(new Date()) }
function getYesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return dateStr(d)
}

export function useDailyStreak() {
  const [state, setState] = useState<StreakState>(DEFAULT_STATE)
  const [loaded, setLoaded] = useState(false)
  const { address } = useConnection()
  const { sendTransaction, data: hash, isPending: isSending, error: txError, reset } = useSendTransaction()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const processedRef = useRef<string | null>(null)

  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY)
      if (s) setState({ ...DEFAULT_STATE, ...JSON.parse(s) })
    } catch (e) {}
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch (e) {}
  }, [state, loaded])

  // When tx succeeds, update streak (once per hash)
  useEffect(() => {
    if (isSuccess && hash && processedRef.current !== hash) {
      processedRef.current = hash
      setState(prev => {
        const today = getToday()
        if (prev.lastCheckIn === today) return prev
        const yesterday = getYesterday()
        const newStreak = prev.lastCheckIn === yesterday ? prev.streak + 1 : 1
        return {
          ...prev,
          lastCheckIn: today,
          streak: newStreak,
          totalCheckIns: prev.totalCheckIns + 1,
          startDate: newStreak === 1 ? today : prev.startDate,
          lastHash: hash,
        }
      })
    }
  }, [isSuccess, hash])

  const today = getToday()
  const hasCheckedInToday = state.lastCheckIn === today

  // Detect missed days — if last check-in is older than yesterday, streak should reset on next check-in
  const isStreakBroken = state.streak > 0 && state.lastCheckIn !== today && state.lastCheckIn !== getYesterday()

  const checkIn = () => {
    if (!address || hasCheckedInToday || isSending || isConfirming) return
    // Plain 0-value self-transfer — valid on every wallet (incl. smart wallets)
    // and counts as on-chain activity on Base. Custom calldata tripped the
    // "invalid parameters" RPC error on Base Account, so we keep it dataless.
    sendTransaction({
      to: address,
      value: BigInt(0),
    })
  }

  const resetTx = () => { reset(); processedRef.current = null }

  const claimDay25Prize = () => {
    if (state.streak < STREAK_TARGET_DAYS || state.prizeClaimedDay25) return
    setState(prev => ({ ...prev, prizeClaimedDay25: true }))
  }

  return {
    streak: state.streak,
    totalCheckIns: state.totalCheckIns,
    startDate: state.startDate,
    hasCheckedInToday,
    isStreakBroken,
    prizeClaimedDay25: state.prizeClaimedDay25,
    isPending: isSending || isConfirming,
    isConfirming,
    isSending,
    txError: txError?.message || null,
    txHash: hash,
    lastHash: state.lastHash,
    needsWallet: !address,
    address,
    checkIn,
    resetTx,
    claimDay25Prize,
  }
}
