'use client'

type Connector = {
  id: string
  name: string
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
}

function walletIcon(id: string) {
  if (id === 'metaMask' || id === 'io.metamask') return '🦊'
  if (id === 'coinbaseWalletSDK') return '🔵'
  return '💼'
}

function walletColor(id: string) {
  if (id === 'metaMask' || id === 'io.metamask') return '#FF6B00'
  if (id === 'coinbaseWalletSDK') return '#0052FF'
  return '#444466'
}

export function GameOver({
  finalScore, personalBest, isNewBest, isConnected,
  txPending, isConfirming, isPending, txError, canReplay, hash,
  connectors, connectWallet,
  submitScoreToChain, handleRetryTransaction, onPlayAgain, onSkipAndReplay
}: Props) {

  // De-duplicate: injected + metaMask often point to same wallet
  const uniqueConnectors = connectors.filter((c, _i, arr) =>
    c.id === 'injected'
      ? !arr.some(x => x.id !== 'injected' && x.name === c.name)
      : true
  )

  return (
    <div style={{
      position: 'absolute', top: '44px', left: 0, right: 0, bottom: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.90)', zIndex: 200
    }}>
      <div style={{
        background: 'rgba(0,8,32,0.98)', border: '2px solid #4444FF',
        borderRadius: '16px', padding: '30px',
        maxWidth: '340px', width: '90%', textAlign: 'center'
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
            : 'rgba(68,68,255,0.2)',
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

        {/* Twitter / X Share button — always visible */}
        {finalScore > 0 && (() => {
          const txt = encodeURIComponent(
            `🤖 I scored ${Math.floor(finalScore).toLocaleString()} in Base Rush!\n\n⚡ Web3 endless runner on Base Network\n🏆 Can you beat me?\n\nPlay free → baserush.fun\n\n#BaseRush #Base #Web3Gaming`
          )
          return (
            <a
              href={`https://twitter.com/intent/tweet?text=${txt}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '8px', width: '100%', marginBottom: '12px',
                background: '#000000', border: '1px solid #333',
                color: '#FFFFFF', padding: '11px', borderRadius: '10px',
                textDecoration: 'none', fontSize: '13px', fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#333')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.629 5.905-5.629zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Share on X
            </a>
          )
        })()}

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
                href={`https://sepolia.basescan.org/tx/${hash}`}
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
      </div>
    </div>
  )
}
