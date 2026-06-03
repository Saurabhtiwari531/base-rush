'use client'

import { useEffect, useRef, useState } from 'react'
import { useScoreSubmission, useLeaderboard } from '../hooks/useScoreSubmission'
import { usePersonalBest } from '../hooks/usePersonalBest'
import { TopBar } from '../components/TopBar'
import { StartScreen } from '../components/StartScreen'
import { GameOver } from '../components/GameOver'
import { AchievementToast } from '../components/AchievementToast'
import { AchievementsModal } from '../components/AchievementsModal'
import { RewardsModal } from '../components/RewardsModal'
import { useAchievements } from '../hooks/useAchievements'
import { useDailyStreak } from '../hooks/useDailyStreak'
import { useCoinWallet } from '../hooks/useCoinWallet'
import { useSkins, type Skin } from '../hooks/useSkins'
import { usePerks } from '../hooks/usePerks'
import { rollReward, getRewardById, type BoxReward } from '../lib/mysteryBox'
import { createGameConfig } from '../game/scene'

// Coins granted for each successful daily check-in (the daily streak carrot)
const DAILY_CHECKIN_COINS = 100

export default function Home() {
  const gameRef = useRef<HTMLDivElement>(null)
  const gameInstanceRef = useRef<any>(null)
  const [mounted, setMounted] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameLoading, setGameLoading] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [showRewards, setShowRewards] = useState(false)
  const [rewardsInitialTab, setRewardsInitialTab] = useState<'daily' | 'skins' | 'how'>('daily')
  const streak = useDailyStreak()
  const wallet = useCoinWallet()
  const skins = useSkins()
  const perks = usePerks()
  const [boxReveal, setBoxReveal] = useState<BoxReward | null>(null)
  const [runStats, setRunStats] = useState<{
    distance: number; coins: number; topCombo: number; duration: number; topSpeed: number
  } | null>(null)

  // Open the Day-25 Mystery Box: verify streak on-chain, then roll + apply an
  // in-game reward. No real money involved.
  const openMysteryBox = async () => {
    const ok = await streak.verifyStreak()
    if (!ok) return
    const reward = rollReward()
    if (reward.type === 'coins' && reward.amount) wallet.addCoins(reward.amount)
    else if (reward.type === 'skin') { skins.claim('champion'); skins.equip('champion') }
    else if (reward.type === 'boost') perks.addScoreBoost(0.1)
    else if (reward.type === 'badge') perks.addBadge('legend25')
    streak.markBoxOpened(reward.id)
    setBoxReveal(reward)
  }
  const runFinalizedRef = useRef(false)
  const chainAchUnlockedRef = useRef(false)
  const {
    unlocked: achUnlocked,
    currentToast,
    finalizeRun: finalizeAchievementsRun,
    unlockOnChain: unlockOnChainAch,
    dismissToast: dismissAchToast,
  } = useAchievements()

  const {
    address, isConnected, disconnect,
    hash, isPending, isConfirming,
    canReplay, txPending, txError,
    finalScore, setFinalScore, connectors,
    submitScoreToChain, handlePlayAgain,
    handleRetryTransaction,
    connectWallet,
  } = useScoreSubmission()

  const { best, isNewBest, checkAndUpdate, resetNewBest } = usePersonalBest()

  const { leaderboard, refetch, isLoading: leaderboardLoading } = useLeaderboard()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (canReplay) refetch()
  }, [canReplay, refetch])

  // Check personal best whenever finalScore is set
  useEffect(() => {
    if (finalScore > 0 && isGameOver) {
      checkAndUpdate(finalScore)
    }
  }, [finalScore, isGameOver])

  // Reset isNewBest + stats when starting a new game
  useEffect(() => {
    if (gameStarted) {
      resetNewBest()
      setRunStats(null)
      runFinalizedRef.current = false
      chainAchUnlockedRef.current = false
    }
  }, [gameStarted])

  // Finalize achievements once when a run ends (career stats update + achievement check)
  useEffect(() => {
    if (isGameOver && runStats && !runFinalizedRef.current) {
      runFinalizedRef.current = true
      finalizeAchievementsRun(runStats, {
        score: Math.floor(finalScore),
        isNewBest,
      })
    }
  }, [isGameOver, runStats, finalScore, isNewBest, finalizeAchievementsRun])

  // Unlock on-chain achievement when submit succeeds
  useEffect(() => {
    if (canReplay && !chainAchUnlockedRef.current) {
      chainAchUnlockedRef.current = true
      unlockOnChainAch()
    }
  }, [canReplay, unlockOnChainAch])

  // Reward coins for each successful daily check-in (drives the streak habit)
  const prevCheckInNonce = useRef(0)
  useEffect(() => {
    if (streak.checkInNonce > prevCheckInNonce.current) {
      prevCheckInNonce.current = streak.checkInNonce
      wallet.addCoins(DAILY_CHECKIN_COINS)
    }
  }, [streak.checkInNonce, wallet])

  // Phaser game init
  useEffect(() => {
    if (!gameStarted) return
    setGameLoading(true)
    let game: any

    // Expose earned score boost to the game (read once at scene create)
    ;(window as any).__brScoreBoost = perks.scoreBoost

    const initGame = async () => {
      const Phaser = (await import('phaser')).default
      const config = createGameConfig(Phaser, gameRef.current)
      game = new Phaser.Game(config)
      gameInstanceRef.current = game
    }

    initGame()

    return () => {
      if (game) {
        try {
          const scene = game.scene.scenes[0]
          scene?.stopBGM?.()
          if (scene?.audioCtx && scene.audioCtx.state !== 'closed') scene.audioCtx.close().catch(() => {})
        } catch (e) {}
        game.destroy(true)
        gameInstanceRef.current = null
      }
      delete (window as any).gameJumpInput
      delete (window as any).gameSlideInput
    }
  }, [gameStarted])

  // React ↔ Phaser bridge
  useEffect(() => {
    ;(window as any).handleGameOver = (score: number, stats?: any) => {
      setIsGameOver(true)
      if (stats) setRunStats(stats)
      // Don't auto-prompt the wallet. Just note the score; the Game Over screen
      // shows the weekly-rewards banner + a Submit button so the player chooses.
      setFinalScore(score)
    }
    ;(window as any).gameReady = () => { setGameLoading(false) }
    ;(window as any).onCoinsEarned = (n: number) => { if (n > 0) wallet.addCoins(n) }
    return () => {
      delete (window as any).handleGameOver
      delete (window as any).gameReady
      delete (window as any).onCoinsEarned
    }
  }, [setFinalScore, wallet])

  // Push equipped skin tint to window before each game starts (Phaser reads it in create())
  useEffect(() => {
    ;(window as any).equippedSkinTint = skins.equippedTint
  }, [skins.equippedTint])

  // ── INPUT — one source for touch + mouse, tuned for snappy, Dino-like
  // response across phones and refresh rates. The jump fires the moment the
  // gesture is known: instantly once an up/sideways move rules out a swipe, on
  // release for a quick tap, or after a tiny safety window for a held press —
  // so there's no "wait for finger lift" lag. A deliberate downward swipe still
  // slides WITHOUT a stray hop (a hop would clip a drone), because we never jump
  // pre-emptively before the gesture direction is known.
  const gestureRef = useRef<{ x: number; y: number; decided: boolean; down: boolean } | null>(null)
  const gestureTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fireJump = () => (window as any).gameJumpInput?.()
  const fireSlide = () => (window as any).gameSlideInput?.()
  const clearGestureTimer = () => {
    if (gestureTimer.current) { clearTimeout(gestureTimer.current); gestureTimer.current = null }
  }
  const onContainerPointerDown = (e: React.PointerEvent) => {
    if (isGameOver || isPaused) return
    gestureRef.current = { x: e.clientX, y: e.clientY, decided: false, down: true }
    clearGestureTimer()
    // Held press with no move / no quick release → treat as a tap (jump) fast.
    gestureTimer.current = setTimeout(() => {
      const g = gestureRef.current
      if (g && g.down && !g.decided) { g.decided = true; fireJump() }
    }, 55)
  }
  const onContainerPointerMove = (e: React.PointerEvent) => {
    const g = gestureRef.current
    if (!g || !g.down || g.decided) return
    const dx = e.clientX - g.x
    const dy = e.clientY - g.y
    if (dy > 16 && dy > Math.abs(dx)) {            // deliberate downward swipe → slide
      g.decided = true; clearGestureTimer(); fireSlide()
    } else if (-dy > 12 || Math.abs(dx) > 16) {    // clearly not a down-swipe → jump now
      g.decided = true; clearGestureTimer(); fireJump()
    }
  }
  const onContainerPointerUp = () => {
    const g = gestureRef.current
    clearGestureTimer()
    if (g && g.down && !g.decided) { g.decided = true; fireJump() } // quick tap → jump
    if (g) g.down = false
  }

  const onPlayAgain = () => {
    handlePlayAgain(gameInstanceRef, setGameStarted, setIsGameOver, setShowLeaderboard)
  }

  const onSkipAndReplay = () => {
    setIsGameOver(false)
    setGameStarted(false)
    setTimeout(() => setGameStarted(true), 100)
  }

  const onGoHome = () => {
    if (gameInstanceRef.current) {
      try {
        const scene = gameInstanceRef.current.scene?.scenes?.[0]
        scene?.stopBGM?.()
        if (scene?.audioCtx && scene.audioCtx.state !== 'closed') scene.audioCtx.close().catch(() => {})
      } catch (_) {}
      gameInstanceRef.current.destroy(true)
      gameInstanceRef.current = null
    }
    setIsGameOver(false)
    setIsPaused(false)
    setGameStarted(false)
  }

  const togglePause = () => {
    if (!gameInstanceRef.current) return
    try {
      const scene = gameInstanceRef.current.scene?.scenes?.[0]
      if (!scene) return
      if (!isPaused) {
        scene.scene.pause()
        // pause audio too if exists
        if (scene.audioCtx?.state === 'running') scene.audioCtx.suspend()
      } else {
        scene.scene.resume()
        if (scene.audioCtx?.state === 'suspended') scene.audioCtx.resume()
      }
      setIsPaused(p => !p)
    } catch (_) {}
  }

  if (!mounted) return null

  return (
    <main style={{ background: '#000810', minHeight: '100dvh', overflow: 'hidden' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes newBestPop {
          0%   { transform: scale(0.5); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        * { box-sizing: border-box; }
        canvas { display: block; }
      `}</style>

      <AchievementToast achievement={currentToast} onDismiss={dismissAchToast} />
      {showAchievements && (
        <AchievementsModal unlocked={achUnlocked} onClose={() => setShowAchievements(false)} />
      )}
      {showRewards && (
        <RewardsModal
          initialTab={rewardsInitialTab}
          onClose={() => setShowRewards(false)}
          daily={{
            streak: streak.streak,
            totalCheckIns: streak.totalCheckIns,
            hasCheckedInToday: streak.hasCheckedInToday,
            isStreakBroken: streak.isStreakBroken,
            isPending: streak.isPending,
            txError: streak.txError,
            txHash: streak.txHash,
            lastHash: streak.lastHash,
            needsWallet: streak.needsWallet,
            dailyCoins: DAILY_CHECKIN_COINS,
            boxOpened: streak.boxOpened,
            boxReward: boxReveal ?? getRewardById(streak.boxRewardId),
            verifying: streak.verifying,
            verifyError: streak.verifyError,
            onCheckIn: streak.checkIn,
            onOpenBox: openMysteryBox,
            onConnectWallet: () => connectWallet(),
            onResetTx: streak.resetTx,
          }}
          skinsProps={{
            balance: wallet.balance,
            owned: skins.owned,
            equipped: skins.equipped,
            streak: streak.streak,
            onClaim: (skin: Skin) => {
              if (skins.isOwned(skin.id)) return
              if (skin.unlock === 'streak25') {
                if (streak.streak >= 25) { skins.claim(skin.id); skins.equip(skin.id) }
                return
              }
              if (wallet.spendCoins(skin.price)) {
                skins.claim(skin.id); skins.equip(skin.id)
              }
            },
            onEquip: skins.equip,
          }}
        />
      )}

      <TopBar
        isConnected={isConnected}
        address={address}
        disconnect={disconnect}
        showLeaderboard={showLeaderboard}
        setShowLeaderboard={setShowLeaderboard}
        refetch={refetch}
        leaderboard={leaderboard}
        leaderboardLoading={leaderboardLoading}
        onTogglePause={gameStarted && !isGameOver && !gameLoading ? togglePause : undefined}
        isPaused={isPaused}
        hideBar={!gameStarted}
      />

      {!gameStarted ? (
        <StartScreen
          onStart={() => setGameStarted(true)}
          isConnected={isConnected}
          address={address}
          onConnect={connectWallet}
          personalBest={best}
          achievementsUnlocked={achUnlocked.size}
          onShowAchievements={() => setShowAchievements(true)}
          streak={streak.streak}
          hasCheckedInToday={streak.hasCheckedInToday}
          coinBalance={wallet.balance}
          equippedSkin={skins.equippedSkin}
          dailyCoins={DAILY_CHECKIN_COINS}
          onOpenDaily={() => { setRewardsInitialTab('daily'); setShowRewards(true) }}
          onOpenSkins={() => { setRewardsInitialTab('skins'); setShowRewards(true) }}
          onOpenHowItWorks={() => { setRewardsInitialTab('how'); setShowRewards(true) }}
          onOpenLeaderboard={() => { setShowLeaderboard(true); refetch() }}
        />
      ) : (
        <div
          className="game-surface"
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(ellipse at 50% 30%, #020E2C 0%, #000810 70%, #000408 100%)',
            overflow: 'hidden'
          }}
          onPointerDown={onContainerPointerDown}
          onPointerMove={onContainerPointerMove}
          onPointerUp={onContainerPointerUp}
          onPointerCancel={onContainerPointerUp}
        >
          {/* Ambient stars — visible in letterbox areas around the game canvas */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
            {[...Array(28)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: i % 3 === 0 ? '2.5px' : '1.5px',
                height: i % 3 === 0 ? '2.5px' : '1.5px',
                background: i % 5 === 0 ? '#0044DD' : '#FFFFFF',
                borderRadius: '50%',
                top: `${(i * 37 + 8) % 100}%`,
                left: `${(i * 61 + 4) % 100}%`,
                opacity: 0.1 + (i % 5) * 0.04,
              }} />
            ))}
            {/* Bottom branding strip */}
            <div style={{
              position: 'absolute', bottom: 'calc(10px + env(safe-area-inset-bottom))', left: 0, right: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              <div style={{ width: '30px', height: '1px', background: 'rgba(0,68,255,0.25)' }} />
              <span style={{ color: '#0a2040', fontSize: '9px', letterSpacing: '3px', fontWeight: 'bold' }}>
                ⚡ BASERUSH.FUN
              </span>
              <div style={{ width: '30px', height: '1px', background: 'rgba(0,68,255,0.25)' }} />
            </div>
          </div>

          {/* Desktop side-area glow — visible in letterbox beside the canvas on wide screens */}
          <div style={{
            position: 'absolute', top: 'calc(44px + env(safe-area-inset-top))', left: 0, bottom: 0, width: '22%',
            background: 'radial-gradient(ellipse at right center, rgba(0,60,200,0.12) 0%, transparent 70%)',
            pointerEvents: 'none', zIndex: 2,
          }} />
          <div style={{
            position: 'absolute', top: 'calc(44px + env(safe-area-inset-top))', right: 0, bottom: 0, width: '22%',
            background: 'radial-gradient(ellipse at left center, rgba(0,60,200,0.12) 0%, transparent 70%)',
            pointerEvents: 'none', zIndex: 2,
          }} />

          {/* Phaser mounts here — full area below TopBar, sits above background layer.
              touchAction:none stops the browser hijacking gameplay taps/swipes
              (scroll, pull-to-refresh, double-tap zoom) so input stays instant. */}
          <div
            ref={gameRef}
            style={{
              position: 'absolute', top: 'calc(44px + env(safe-area-inset-top))', left: 0, right: 0, bottom: 0, zIndex: 1,
              touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none',
            }}
          />

          {gameLoading && (
            <div style={{
              position: 'absolute', top: 'calc(44px + env(safe-area-inset-top))', left: 0, right: 0, bottom: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'radial-gradient(ellipse at top, #020E2C, #000408)', zIndex: 300
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '50px', height: '50px',
                  border: '4px solid #0044FF', borderTopColor: '#FFFFFF',
                  borderRadius: '50%', margin: '0 auto 20px',
                  animation: 'spin 1s linear infinite'
                }} />
                <p style={{ color: '#FFFFFF', fontSize: '14px', letterSpacing: '2px' }}>
                  LOADING GAME...
                </p>
              </div>
            </div>
          )}

          {/* Pause overlay */}
          {isPaused && !isGameOver && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,20,0.82)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              zIndex: 400, gap: '16px',
              backdropFilter: 'blur(4px)',
            }}>
              <div style={{ fontSize: '48px' }}>⏸</div>
              <h2 style={{
                color: '#FFFFFF', fontSize: '28px', fontWeight: 'bold',
                letterSpacing: '6px', margin: 0,
                textShadow: '0 0 20px rgba(0,100,255,0.8)',
              }}>
                PAUSED
              </h2>
              <button
                onClick={togglePause}
                className="rh-press"
                style={{
                  background: 'linear-gradient(135deg, #0052FF, #0088FF)',
                  border: 'none', color: '#FFF',
                  padding: '14px 40px', borderRadius: '12px',
                  fontSize: '16px', fontWeight: 'bold',
                  cursor: 'pointer', letterSpacing: '2px',
                  boxShadow: '0 4px 20px rgba(0,82,255,0.5)',
                  marginTop: '8px',
                }}
              >
                ▶ RESUME
              </button>
              <button
                onClick={onGoHome}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#AAAAAA', padding: '10px 32px',
                  borderRadius: '10px', fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                🏠 Home
              </button>
            </div>
          )}

          {isGameOver && (
            <GameOver
              finalScore={finalScore}
              personalBest={best}
              isNewBest={isNewBest}
              isConnected={isConnected}
              txPending={txPending}
              isConfirming={isConfirming}
              isPending={isPending}
              txError={txError}
              canReplay={canReplay}
              hash={hash}
              connectors={connectors}
              connectWallet={connectWallet}
              submitScoreToChain={submitScoreToChain}
              handleRetryTransaction={handleRetryTransaction}
              onPlayAgain={onPlayAgain}
              onSkipAndReplay={onSkipAndReplay}
              onGoHome={onGoHome}
              runStats={runStats}
            />
          )}
        </div>
      )}
    </main>
  )
}
