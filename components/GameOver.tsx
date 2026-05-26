'use client'

type Connector = {
  id: string
  name: string
}

type Props = {
  finalScore: number
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
  finalScore, isConnected,
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
        <div style={{
          background: 'rgba(68,68,255,0.2)', borderRadius: '8px',
          padding: '12px', margin: '0 0 20px 0'
        }}>
          <p style={{ color: '#AAAAFF', fontSize: '11px', margin: '0 0 4px 0', letterSpacing: '2px' }}>
            FINAL SCORE
          </p>
          <p style={{ color: '#FFFFFF', fontSize: '36px', fontWeight: 'bold', margin: 0 }}>
            {Math.floor(finalScore)}
          </p>
        </div>

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
