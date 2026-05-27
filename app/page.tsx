'use client'

import { useEffect, useRef, useState } from 'react'
import { useScoreSubmission, useLeaderboard } from '../hooks/useScoreSubmission'
import { usePersonalBest } from '../hooks/usePersonalBest'
import { TopBar } from '../components/TopBar'
import { StartScreen } from '../components/StartScreen'
import { GameOver } from '../components/GameOver'
import { createGameConfig } from '../game/scene'


export default function Home() {
  const gameRef = useRef<HTMLDivElement>(null)
  const gameInstanceRef = useRef<any>(null)
  const [mounted, setMounted] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameLoading, setGameLoading] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  const {
    address, isConnected, disconnect,
    hash, isPending, isConfirming,
    canReplay, txPending, txError,
    finalScore, connectors,
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

  // Reset isNewBest when starting a new game
  useEffect(() => {
    if (gameStarted) resetNewBest()
  }, [gameStarted])

  // Phaser game init
  useEffect(() => {
    if (!gameStarted) return
    setGameLoading(true)
    let game: any

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
          if (scene?.audioCtx) scene.audioCtx.close()
        } catch (e) {}
        game.destroy(true)
        gameInstanceRef.current = null
      }
    }
  }, [gameStarted])

  // React ↔ Phaser bridge
  useEffect(() => {
    ;(window as any).handleGameOver = (score: number) => {
      setIsGameOver(true)
      setTimeout(() => { submitScoreToChain(score) }, 100)
    }
    ;(window as any).gameReady = () => { setGameLoading(false) }
    return () => {
      delete (window as any).handleGameOver
      delete (window as any).gameReady
    }
  }, [isConnected, submitScoreToChain])

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
        if (scene?.audioCtx) scene.audioCtx.close()
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
    <main style={{ background: '#000', minHeight: '100dvh', overflow: 'hidden' }}>
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

      <TopBar
        isConnected={isConnected}
        address={address}
        disconnect={disconnect}
        showLeaderboard={showLeaderboard}
        setShowLeaderboard={setShowLeaderboard}
        refetch={refetch}
        leaderboard={leaderboard}
        leaderboardLoading={leaderboardLoading}
        onGoHome={gameStarted ? onGoHome : undefined}
        onTogglePause={gameStarted && !isGameOver && !gameLoading ? togglePause : undefined}
        isPaused={isPaused}
      />

      {!gameStarted ? (
        <StartScreen
          onStart={() => setGameStarted(true)}
          isConnected={isConnected}
          address={address}
          onConnect={connectWallet}
          personalBest={best}
        />
      ) : (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: '#000', overflow: 'hidden'
        }}>
          {/* Phaser mounts here — full area below TopBar */}
          <div
            ref={gameRef}
            style={{ position: 'absolute', top: '44px', left: 0, right: 0, bottom: 0 }}
          />

          {gameLoading && (
            <div style={{
              position: 'absolute', top: '44px', left: 0, right: 0, bottom: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#000000', zIndex: 300
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
            />
          )}
        </div>
      )}
    </main>
  )
}
