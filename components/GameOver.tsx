'use client'

type Connector = {
  id: string
  name: string
}

type RunStats = {
  distance: number
  coins: number
  topCombo: number
  duration: number
  topSpeed: number
}

type Props = {
  finalScore: number
  personalBest: number
  isNewBest: boolean
  isConnected: boolean
  txPending: boolean
  isConfirming: boolean
  isPending: boolean
  txError: string
  canReplay: boolean
  hash: `0x${string}` | undefined
  connectors: readonly Connector[]
  connectWallet: (connector?: Connector) => void
  submitScoreToChain: (score: number) => void
  handleRetryTransaction: () => void
  onPlayAgain: () => void
  onSkipAndReplay: () => void
  onGoHome: () => void
  runStats: RunStats | null
}

async function generateScoreCard(opts: {
  score: number
  isNewBest: boolean
  stats: RunStats
}): Promise<Blob> {
  const W = 1080, H = 1080
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Background gradient
  const grad = ctx.createRadialGradient(W / 2, H * 0.3, 0, W / 2, H * 0.5, W)
  grad.addColorStop(0, '#001a4d')
  grad.addColorStop(0.5, '#000620')
  grad.addColorStop(1, '#000000')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Stars
  for (let i = 0; i < 120; i++) {
    ctx.globalAlpha = 0.15 + Math.random() * 0.55
    ctx.fillStyle = i % 5 === 0 ? '#0088FF' : '#FFFFFF'
    ctx.beginPath()
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 2.5 + 0.5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // Top: BASE RUSH title
  ctx.font = 'bold 72px -apple-system, Helvetica, Arial, sans-serif'
  ctx.fillStyle = '#0088FF'
  ctx.textAlign = 'center'
  ctx.shadowColor = 'rgba(0,136,255,0.7)'
  ctx.shadowBlur = 30
  ctx.fillText('BASE RUSH', W / 2, 140)
  ctx.shadowBlur = 0

  ctx.font = '22px -apple-system, Helvetica, Arial, sans-serif'
  ctx.fillStyle = '#4488FF'
  ctx.fillText('ON-CHAIN ENDLESS RUNNER · BASE NETWORK', W / 2, 180)

  // NEW BEST badge
  let scoreY = 380
  if (opts.isNewBest) {
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 38px -apple-system, Helvetica, Arial, sans-serif'
    ctx.shadowColor = 'rgba(255,215,0,0.7)'
    ctx.shadowBlur = 25
    ctx.fillText('🏆 NEW HIGH SCORE!', W / 2, 270)
    ctx.shadowBlur = 0
    scoreY = 430
  }

  // Big score
  ctx.font = 'bold 220px -apple-system, Helvetica, Arial, sans-serif'
  ctx.fillStyle = opts.isNewBest ? '#FFD700' : '#FFFFFF'
  ctx.shadowColor = opts.isNewBest ? 'rgba(255,215,0,0.5)' : 'rgba(0,136,255,0.4)'
  ctx.shadowBlur = 40
  ctx.fillText(opts.score.toLocaleString(), W / 2, scoreY)
  ctx.shadowBlur = 0

  ctx.font = '26px -apple-system, Helvetica, Arial, sans-serif'
  ctx.fillStyle = '#99AACC'
  ctx.fillText('FINAL SCORE', W / 2, scoreY + 50)

  // Stats row
  const statsY = 690
  const drawStat = (x: number, label: string, value: string, color: string) => {
    ctx.font = 'bold 56px -apple-system, Helvetica, Arial, sans-serif'
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 20
    ctx.fillText(value, x, statsY)
    ctx.shadowBlur = 0
    ctx.font = '18px -apple-system, Helvetica, Arial, sans-serif'
    ctx.fillStyle = '#778899'
    ctx.fillText(label, x, statsY + 32)
  }
  drawStat(270, 'DISTANCE', `${opts.stats.distance}m`, '#00FFAA')
  drawStat(540, 'COINS', `${opts.stats.coins}`, '#FFD700')
  drawStat(810, 'TOP COMBO', `x${opts.stats.topCombo}`, '#FF00FF')

  // Divider
  ctx.strokeStyle = 'rgba(0,136,255,0.3)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(180, 830)
  ctx.lineTo(900, 830)
  ctx.stroke()

  // CTA
  ctx.font = 'bold 42px -apple-system, Helvetica, Arial, sans-serif'
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText('CAN YOU BEAT ME?', W / 2, 900)

  ctx.font = 'bold 36px -apple-system, Helvetica, Arial, sans-serif'
  ctx.fillStyle = '#0088FF'
  ctx.shadowColor = 'rgba(0,136,255,0.6)'
  ctx.shadowBlur = 20
  ctx.fillText('▶  BASERUSH.FUN', W / 2, 970)
  ctx.shadowBlur = 0

  ctx.font = '18px -apple-system, Helvetica, Arial, sans-serif'
  ctx.fillStyle = '#445577'
  ctx.fillText('PLAY FREE · EARN ON-CHAIN · 🔵 BUILT ON BASE', W / 2, 1020)

  return new Promise((resolve) => {
    canvas.toBlob(b => resolve(b!), 'image/png', 0.95)
  })
}

function walletIcon(id: string) {
  if (id === 'metaMask' || id === 'io.metamask') return '🦊'
  if (id === 'coinbaseWalletSDK' || id === 'coinbaseWallet' || id === 'base') return '🔵'
  return '💼'
}

function walletColor(id: string) {
  if (id === 'metaMask' || id === 'io.metamask') return '#FF6B00'
  if (id === 'coinbaseWalletSDK' || id === 'coinbaseWallet' || id === 'base') return '#0052FF'
  return '#334466'
}

export function GameOver({
  finalScore, personalBest, isNewBest, isConnected,
  txPending, isConfirming, isPending, txError, canReplay, hash,
  connectors, connectWallet,
  submitScoreToChain, handleRetryTransaction, onPlayAgain, onSkipAndReplay, onGoHome,
  runStats,
}: Props) {

  const shareScoreCard = async () => {
    if (!runStats) return
    try {
      const blob = await generateScoreCard({
        score: Math.floor(finalScore),
        isNewBest,
        stats: runStats,
      })
      const file = new File([blob], 'baserush-score.png', { type: 'image/png' })
      const tweetText = `🤖 I scored ${Math.floor(finalScore).toLocaleString()} in Base Rush!\n\n📏 ${runStats.distance}m · 🪙 ${runStats.coins} coins · 🔥 x${runStats.topCombo} combo\n\nBeat me → baserush.fun\n\n#BaseRush #Base`

      // Try native share with image (mobile)
      const nav: any = navigator
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: 'Base Rush', text: tweetText })
        return
      }
      // Fallback: download image + open Twitter intent
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'baserush-score.png'
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank')
    } catch (e) {
      // Last-resort fallback: text-only tweet
      const txt = encodeURIComponent(
        `🤖 I scored ${Math.floor(finalScore).toLocaleString()} in Base Rush!\n\nPlay → baserush.fun\n\n#BaseRush #Base`
      )
      window.open(`https://twitter.com/intent/tweet?text=${txt}`, '_blank')
    }
  }

  // De-duplicate: injected + metaMask often point to same wallet;
  // also collapse coinbaseWallet + coinbaseWalletSDK which both appear on Coinbase browser
  const cbIds = new Set(['coinbaseWalletSDK', 'coinbaseWallet', 'base'])
  let seenCb = false
  const uniqueConnectors = connectors.filter((c, _i, arr) => {
    if (c.id === 'injected') return !arr.some(x => x.id !== 'injected' && x.name === c.name)
    if (cbIds.has(c.id)) { if (seenCb) return false; seenCb = true }
    return true
  })

  return (
    <div style={{
      position: 'absolute', top: 'calc(44px + env(safe-area-inset-top))', left: 0, right: 0, bottom: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.90)', zIndex: 200, padding: '16px',
    }}>
      <div className="rh-modal-scroll" style={{
        background: 'rgba(0,8,32,0.98)', border: '2px solid #0052FF',
        borderRadius: '16px', padding: '30px',
        maxWidth: '340px', width: '90%', textAlign: 'center',
        boxShadow: '0 0 40px rgba(0,82,255,0.25)',
      }}>
        <h1 style={{
          color: '#FF4444', fontSize: '32px', fontWeight: 'bold',
          margin: '0 0 10px 0', textShadow: '0 0 20px rgba(255,68,68,0.5)'
        }}>
          GAME OVER
        </h1>

        {/* NEW HIGH SCORE banner */}
        {isNewBest && (
          <div style={{
            background: 'linear-gradient(135deg, #FFD700, #FF8C00, #FFD700)',
            backgroundSize: '200% auto',
            borderRadius: '10px', padding: '8px 16px',
            margin: '0 0 10px 0',
            animation: 'newBestPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both, shimmer 2s linear infinite',
            boxShadow: '0 0 20px rgba(255,215,0,0.6)',
          }}>
            <span style={{ color: '#000', fontWeight: 'bold', fontSize: '13px', letterSpacing: '2px' }}>
              🎉 NEW HIGH SCORE!
            </span>
          </div>
        )}

        {/* Score card */}
        <div style={{
          background: isNewBest
            ? 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,140,0,0.08))'
            : 'rgba(0,82,255,0.2)',
          border: isNewBest ? '1px solid rgba(255,215,0,0.4)' : 'none',
          borderRadius: '10px', padding: '12px', margin: '0 0 10px 0'
        }}>
          <p style={{ color: '#AAAAFF', fontSize: '11px', margin: '0 0 4px 0', letterSpacing: '2px' }}>
            FINAL SCORE
          </p>
          <p style={{
            color: isNewBest ? '#FFD700' : '#FFFFFF',
            fontSize: '40px', fontWeight: 'bold', margin: 0,
            textShadow: isNewBest ? '0 0 20px rgba(255,215,0,0.6)' : 'none',
          }}>
            {Math.floor(finalScore).toLocaleString()}
          </p>

          {/* Personal best comparison */}
          {personalBest > 0 && !isNewBest && (
            <p style={{ color: '#556677', fontSize: '11px', margin: '6px 0 0 0' }}>
              🏆 Best: <span style={{ color: '#AAAAFF' }}>{personalBest.toLocaleString()}</span>
              {'  '}
              <span style={{ color: '#FF6666' }}>
                ({Math.floor(finalScore) >= personalBest ? '+' : ''}{(Math.floor(finalScore) - personalBest).toLocaleString()})
              </span>
            </p>
          )}
        </div>

        {/* Run stats breakdown */}
        {runStats && (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: '6px', margin: '0 0 10px 0',
          }}>
            {[
              { lbl: 'DISTANCE', val: `${runStats.distance}m`, col: '#00FFAA' },
              { lbl: 'COINS', val: `${runStats.coins}`, col: '#FFD700' },
              { lbl: 'TOP COMBO', val: `x${runStats.topCombo}`, col: '#FF00FF' },
              { lbl: 'TIME', val: `${runStats.duration}s`, col: '#00AAFF' },
              { lbl: 'TOP SPEED', val: `${runStats.topSpeed}x`, col: '#FF6600' },
              { lbl: 'POINTS/SEC', val: runStats.duration > 0 ? `${Math.floor(finalScore / runStats.duration)}` : '0', col: '#AAAAFF' },
            ].map(s => (
              <div key={s.lbl} style={{
                background: 'rgba(0,82,255,0.10)',
                border: '1px solid rgba(0,82,255,0.25)',
                borderRadius: '8px',
                padding: '6px 4px',
              }}>
                <div style={{ color: s.col, fontSize: '14px', fontWeight: 'bold', lineHeight: 1 }}>
                  {s.val}
                </div>
                <div style={{ color: '#667788', fontSize: '8px', letterSpacing: '1px', marginTop: '3px' }}>
                  {s.lbl}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Shareable score card button */}
        {finalScore > 0 && (
          <button
            onClick={shareScoreCard}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', width: '100%', marginBottom: '12px',
              background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 100%)',
              border: '1px solid #4488FF',
              color: '#FFFFFF', padding: '12px', borderRadius: '10px',
              fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px',
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(0,82,255,0.25)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.629 5.905-5.629zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            📸 Share Score Card
          </button>
        )}

        {/* Why-submit banner — shown while the player still needs to submit */}
        {finalScore > 0 && !canReplay && !txPending && !isConfirming && !txError && (
          <div style={{
            display: 'flex', gap: '8px', alignItems: 'flex-start',
            background: 'linear-gradient(135deg, rgba(0,82,255,0.18), rgba(255,215,0,0.06))',
            border: '1px solid rgba(0,136,255,0.45)',
            borderRadius: '10px', padding: '10px 12px', margin: '0 0 12px 0',
            textAlign: 'left',
          }}>
            <span style={{ fontSize: '18px', lineHeight: 1 }}>⛓️</span>
            <div>
              <div style={{ color: '#FFD700', fontSize: '12px', fontWeight: 'bold', marginBottom: '2px' }}>
                Save your score for Weekly Rewards
              </div>
              <div style={{ color: '#AEC6E8', fontSize: '10.5px', lineHeight: 1.4 }}>
                Submit on-chain (one quick transaction on Base) to lock in your score.
                Only saved scores qualify for the weekly 🏆 $5 / $3 / $1 leaderboard.
              </div>
            </div>
          </div>
        )}

        {txPending || isConfirming ? (
          <>
            <div style={{
              width: '50px', height: '50px',
              border: '4px solid #0044FF', borderTopColor: '#FFFFFF',
              borderRadius: '50%', margin: '0 auto 20px',
              animation: 'spin 1s linear infinite'
            }} />
            <h2 style={{ color: '#FFFFFF', fontSize: '20px', margin: '0 0 12px 0' }}>
              {isPending ? 'Confirm in wallet...' : 'Confirming transaction...'}
            </h2>
            <p style={{ color: '#AAAAFF', fontSize: '12px', margin: 0 }}>
              Please wait for on-chain confirmation
            </p>
          </>
        ) : txError ? (
          <>
            <div style={{ fontSize: '48px', margin: '0 0 16px 0' }}>❌</div>
            <h2 style={{ color: '#FF4444', fontSize: '20px', margin: '0 0 12px 0' }}>
              Transaction Failed
            </h2>
            <p style={{ color: '#FFAAAA', fontSize: '12px', margin: '0 0 20px 0' }}>
              {txError}
            </p>
            <button
              onClick={handleRetryTransaction}
              style={{
                background: '#2255FF', border: 'none', color: '#FFFFFF',
                padding: '12px 24px', borderRadius: '10px',
                cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
              }}>
              Retry Transaction
            </button>
          </>
        ) : canReplay ? (
          <>
            <div style={{ fontSize: '48px', margin: '0 0 16px 0' }}>✅</div>
            <h2 style={{ color: '#00FF88', fontSize: '20px', margin: '0 0 12px 0' }}>
              Score Saved!
            </h2>
            <p style={{ color: '#AAAAFF', fontSize: '12px', margin: '0 0 8px 0' }}>
              Your score has been submitted on-chain
            </p>
            {hash && (
              <a
                href={`https://basescan.org/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#4488FF', fontSize: '10px', textDecoration: 'none',
                  display: 'block', margin: '0 0 20px 0', wordBreak: 'break-all'
                }}
              >
                View on BaseScan ↗
              </a>
            )}
            <button
              onClick={onPlayAgain}
              className="rh-press"
              style={{
                background: '#2255FF', border: 'none', color: '#FFFFFF',
                padding: '14px 32px', borderRadius: '10px',
                cursor: 'pointer', fontSize: '15px', fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(34,85,255,0.5)'
              }}>
              PLAY AGAIN
            </button>
          </>
        ) : isConnected ? (
          <>
            <p style={{ color: '#AAAAFF', fontSize: '13px', margin: '0 0 16px 0' }}>
              Click below to save your score on-chain
            </p>
            <button
              onClick={() => submitScoreToChain(finalScore)}
              className="rh-press"
              style={{
                background: 'linear-gradient(135deg, #0052FF 0%, #0088FF 100%)',
                border: 'none', color: '#FFFFFF',
                padding: '14px 32px', borderRadius: '10px',
                cursor: 'pointer', fontSize: '15px', fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(0,82,255,0.5)',
                marginBottom: '10px', width: '100%'
              }}>
              💾 Submit Score
            </button>
            <button
              onClick={onSkipAndReplay}
              style={{
                background: 'transparent', border: '1px solid #666',
                color: '#AAAAFF', padding: '10px 24px', borderRadius: '10px',
                cursor: 'pointer', fontSize: '13px', width: '100%'
              }}>
              Skip &amp; Play Again
            </button>
          </>
        ) : (
          <>
            <p style={{ color: '#AAAAFF', fontSize: '12px', margin: '0 0 12px 0' }}>
              Connect wallet to save your score on-chain
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
              {uniqueConnectors.map(c => (
                <button
                  key={c.id}
                  onClick={() => connectWallet(c)}
                  style={{
                    background: walletColor(c.id),
                    border: 'none', color: '#FFFFFF',
                    padding: '12px', borderRadius: '10px',
                    cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
                    width: '100%'
                  }}>
                  {walletIcon(c.id)} {c.name}
                </button>
              ))}
            </div>
            <button
              onClick={onSkipAndReplay}
              style={{
                background: 'transparent', border: '1px solid #555',
                color: '#888', padding: '10px 24px', borderRadius: '10px',
                cursor: 'pointer', fontSize: '12px', width: '100%'
              }}>
              Skip &amp; Play Again
            </button>
          </>
        )}

        {/* Home button — always visible so player can always exit */}
        <button
          onClick={onGoHome}
          style={{
            marginTop: '10px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#666', padding: '8px',
            borderRadius: '10px', fontSize: '12px',
            cursor: 'pointer', width: '100%',
            letterSpacing: '1px',
          }}
        >
          🏠 Home
        </button>
      </div>
    </div>
  )
}
