'use client'

import { useEffect, useMemo, useState } from 'react'
import type { RefObject } from 'react'
import { useConnection, useConnect, useConnectors, useDisconnect, useSwitchChain } from 'wagmi'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { base } from 'wagmi/chains'
import { Attribution } from 'ox/erc8021'
import { CONTRACT_ADDRESS, CONTRACT_ABI, LeaderboardEntry } from '../lib/contract'

// ── BUILDER CODE ATTRIBUTION (ERC-8021) ─────────────────────────────────────
// Get your code: base.dev → Settings → Builder Code
// Set NEXT_PUBLIC_BUILDER_CODE=bc_xxxxxxxx in your .env.local / Vercel env vars
const BUILDER_CODE = process.env.NEXT_PUBLIC_BUILDER_CODE
const DATA_SUFFIX = BUILDER_CODE
  ? Attribution.toDataSuffix({ codes: [BUILDER_CODE] })
  : undefined

export function useLeaderboard() {
  const { data, refetch, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getTop3',
    query: { refetchInterval: 60000 },
  })

  const leaderboard = useMemo<LeaderboardEntry[]>(() => {
    const rewards = ['$5', '$3', '$1']
    const empty = (rank: number): LeaderboardEntry =>
      ({ rank, address: '', score: 0, reward: rewards[rank - 1] })

    if (!data) return [empty(1), empty(2), empty(3)]

    const [first, score1, second, score2, third, score3] = data as [
      `0x${string}`, bigint,
      `0x${string}`, bigint,
      `0x${string}`, bigint
    ]
    const zero = '0x0000000000000000000000000000000000000000'
    const raw = [
      { rank: 1, address: first, score: Number(score1) },
      { rank: 2, address: second, score: Number(score2) },
      { rank: 3, address: third, score: Number(score3) },
    ]

    const seen = new Set<string>()
    return raw.map(e => {
      const addr = e.address.toLowerCase()
      const isEmpty = addr === zero || e.score === 0
      if (isEmpty || seen.has(addr)) return empty(e.rank)
      seen.add(addr)
      return { ...e, reward: rewards[e.rank - 1] }
    })
  }, [data])

  return { leaderboard, refetch, isLoading }
}

export function useScoreSubmission() {
  const { address, isConnected, chainId } = useConnection()
  const { mutate: connectWagmi } = useConnect()
  const connectors = useConnectors()
  const { mutate: disconnectWallet } = useDisconnect()
  const { mutateAsync: switchChainAsync } = useSwitchChain()
  const { data: hash, mutate: writeContract, isPending, isError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  const [canReplay, setCanReplay] = useState(false)
  const [txPending, setTxPending] = useState(false)
  const [txError, setTxError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [finalScore, setFinalScore] = useState(0)

  useEffect(() => {
    if (isConfirmed && !canReplay) {
      setCanReplay(true)
      setTxPending(false)
      setTxError('')
      setIsSubmitting(false)
    }
  }, [isConfirmed, canReplay])

  useEffect(() => {
    if (isError) {
      setTxPending(false)
      setCanReplay(false)
      setIsSubmitting(false)
      setTxError('Transaction cancelled or failed. Please try again.')
    }
  }, [isError])

  useEffect(() => {
    if (!isConnected && txPending) {
      setTxPending(false)
      setCanReplay(false)
      setIsSubmitting(false)
      setTxError('Wallet disconnected. Please reconnect to continue.')
    }
  }, [isConnected, txPending])

  const submitScoreToChain = async (score: number) => {
    if (isSubmitting) return

    if (!isConnected) {
      setFinalScore(score)
      return
    }

    if (score <= 0) {
      setTxError('Score too low to submit')
      return
    }

    if (chainId !== base.id) {
      try {
        await switchChainAsync({ chainId: base.id })
      } catch {
        setTxError('Please switch to Base Mainnet to submit score.')
        return
      }
    }

    setIsSubmitting(true)
    setTxPending(true)
    setTxError('')
    setCanReplay(false)
    setFinalScore(score)

    try {
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'submitScore',
        args: [BigInt(Math.floor(score))],
        ...(DATA_SUFFIX && { dataSuffix: DATA_SUFFIX }),
      })
    } catch {
      setTxPending(false)
      setIsSubmitting(false)
      setTxError('Failed to submit transaction')
    }
  }

  const handlePlayAgain = (
    gameInstanceRef: RefObject<any>,
    setGameStarted: (v: boolean) => void,
    setIsGameOver: (v: boolean) => void,
    setShowLeaderboard: (v: boolean) => void
  ) => {
    if (!canReplay) return

    setCanReplay(false)
    setTxPending(false)
    setTxError('')
    setIsSubmitting(false)
    setFinalScore(0)
    setIsGameOver(false)
    setShowLeaderboard(false)

    if (gameInstanceRef.current) {
      gameInstanceRef.current.destroy(true)
      gameInstanceRef.current = null
    }

    setGameStarted(false)
    setTimeout(() => setGameStarted(true), 100)
  }

  const handleRetryTransaction = () => {
    setTxError('')
    submitScoreToChain(finalScore)
  }

  const connectWallet = (connector?: any) => {
    const c = connector ?? connectors[0]
    if (c) connectWagmi({ connector: c })
  }

  const disconnect = () => disconnectWallet({})

  return {
    address,
    isConnected,
    disconnect,
    hash,
    isPending,
    isConfirming,
    canReplay,
    txPending,
    txError,
    finalScore,
    connectors,
    submitScoreToChain,
    handlePlayAgain,
    handleRetryTransaction,
    connectWallet,
  }
}
