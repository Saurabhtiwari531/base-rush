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
  prizeClaimedDay25: boolean   // = mystery box opened
  boxRewardId: string | null   // which reward the box gave
  lastHash: string | null
}

const DEFAULT_STATE: StreakState = {
  streak: 0,
  lastCheckIn: '',
  totalCheckIns: 0,
  startDate: '',
  prizeClaimedDay25: false,
  boxRewardId: null,
  lastHash: null,
}

// v2: keyed per wallet address (v1 was device-wide — switching wallets wrongly
// shared one streak). Stored as a map of { addressLower: StreakState }.
const KEY = 'baserush.streak.v2'

type StreakMap = Record<string, StreakState>

// Count the wallet's real daily check-ins on Base (self-transfers, 0 value) by
// distinct UTC day. Runs ONLY when claiming the prize — never during gameplay.
// Uses the Etherscan V2 API (Base chainid 8453). Key optional but recommended.
async function countOnChainCheckIns(address: string): Promise<{ ok: boolean; count: number }> {
  const key = process.env.NEXT_PUBLIC_BASESCAN_API_KEY || ''
  const url = `https://api.etherscan.io/v2/api?chainid=8453&module=account&action=txlist`
    + `&address=${address}&startblock=0&endblock=99999999&sort=desc`
    + (key ? `&apikey=${key}` : '')
  const res = await fetch(url)
  const json = await res.json()
  // status '0' with "No transactions found" is a valid (verified) empty result;
  // a missing/invalid key or rate-limit means we couldn't verify → ok:false.
  if (!Array.isArray(json.result)) {
    const empty = typeof json.message === 'string' && /no transactions/i.test(json.message)
    return { ok: empty, count: 0 }
  }
  const addr = address.toLowerCase()
  const days = new Set<string>()
  for (const tx of json.result) {
    if (
      tx.from?.toLowerCase() === addr &&
      tx.to?.toLowerCase() === addr &&
      tx.value === '0' &&
      tx.isError === '0'
    ) {
      days.add(new Date(Number(tx.timeStamp) * 1000).toISOString().slice(0, 10))
    }
  }
  return { ok: true, count: days.size }
}

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
  const [map, setMap] = useState<StreakMap>({})
  const [loaded, setLoaded] = useState(false)
  const { address } = useConnection()
  const { sendTransaction, data: hash, isPending: isSending, error: txError, reset } = useSendTransaction()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const processedRef = useRef<string | null>(null)

  // Day-25 prize on-chain verification state (claim-time only)
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [verifiedCount, setVerifiedCount] = useState<number | null>(null)

  const addrKey = address ? address.toLowerCase() : ''
  // Active streak = the connected wallet's record (each wallet tracks its own).
  const state: StreakState = (addrKey && map[addrKey]) ? map[addrKey] : DEFAULT_STATE

  // Update only the connected wallet's streak record
  const updateState = (updater: (prev: StreakState) => StreakState) => {
    if (!addrKey) return
    setMap(prev => ({ ...prev, [addrKey]: updater(prev[addrKey] || DEFAULT_STATE) }))
  }

  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY)
      if (s) setMap(JSON.parse(s))
    } catch (e) {}
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try { localStorage.setItem(KEY, JSON.stringify(map)) } catch (e) {}
  }, [map, loaded])

  // When tx succeeds, update the connected wallet's streak (once per hash)
  useEffect(() => {
    if (isSuccess && hash && processedRef.current !== hash) {
      processedRef.current = hash
      updateState(prev => {
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

  // Verify the streak ON-CHAIN before letting the player open the box, so a
  // faked localStorage streak can't grab a reward. Returns true if allowed.
  // Runs only on the open-box click — never in the game loop.
  const verifyStreak = async (): Promise<boolean> => {
    if (verifying) return false
    if (!address) { setVerifyError('Connect your wallet first.'); return false }
    if (state.streak < STREAK_TARGET_DAYS) {
      setVerifyError(`Reach a ${STREAK_TARGET_DAYS}-day streak first.`); return false
    }
    setVerifying(true)
    setVerifyError(null)
    try {
      const { ok, count } = await countOnChainCheckIns(address)
      setVerifiedCount(ok ? count : null)
      // ok=false → explorer unreachable/no key: don't block a legit player.
      if (!ok || count >= STREAK_TARGET_DAYS) return true
      setVerifyError(`Only ${count} on-chain check-ins found — ${STREAK_TARGET_DAYS} required. Keep checking in daily!`)
      return false
    } catch {
      setVerifyError('Could not verify on-chain right now. Please try again in a moment.')
      return false
    } finally {
      setVerifying(false)
    }
  }

  // Record that the box was opened + which reward dropped (per wallet).
  const markBoxOpened = (rewardId: string) =>
    updateState(prev => ({ ...prev, prizeClaimedDay25: true, boxRewardId: rewardId }))

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
    verifyStreak,
    markBoxOpened,
    boxOpened: state.prizeClaimedDay25,
    boxRewardId: state.boxRewardId,
    verifying,
    verifyError,
    verifiedCount,
  }
}
