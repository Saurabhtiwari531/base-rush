'use client'

type Props = {
  finalScore: number
  isConnected: boolean
  showWalletPrompt: boolean
  setShowWalletPrompt: (v: boolean) => void
  txPending: boolean
  isConfirming: boolean
  isPending: boolean
  txError: string
  canReplay: boolean
  hash: `0x${string}` | undefined
  connectCoinbase: () => void
  connectMetaMask: () => void
  connectInjected: () => void
  submitScoreToChain: (score: number) => void
  handleRetryTransaction: () => void
  onPlayAgain: () => void
  onSkipAndReplay: () => void
}

export function GameOver({
  finalScore, isConnected, showWalletPrompt, setShowWalletPrompt,
  txPending, isConfirming, isPending, txError, canReplay, hash,
  connectCoinbase, connectMetaMask, connectInjected,
  submitScoreToChain, handleRetryTransaction, onPlayAgain, onSkipAndReplay
}: Props) {
  return (
    <div style={{
      position: 'absolute', top: '44px', left: 0, right: 0, bottom: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.90)', zIndex: 200
    }}>
      <div style={{
        background: 'rgba(0,8,32,0.98)', border: '2px solid #4444FF',
        borderRadius: '16px', padding: '30px',
        maxWidth: '340px', textAlign: 'center'
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

        {showWalletPrompt ? (
          <>
            <h2 style={{ color: '#FFFFFF', fontSize: '22px', margin: '0 0 16px 0' }}>
              Connect Wallet
            </h2>
            <p style={{ color: '#AAAAFF', fontSize: '13px', margin: '0 0 20px 0' }}>
              Connect your wallet to save your score on-chain
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={connectCoinbase}
                style={{
                  background: '#0052FF', border: 'none', color: '#FFFFFF',
                  padding: '12px', borderRadius: '10px',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
                }}>
                🔵 Coinbase Wallet
              </button>
              <button
                onClick={connectMetaMask}
                style={{
                  background: '#FF6B00', border: 'none', color: '#FFFFFF',
                  padding: '12px', borderRadius: '10px',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
                }}>
                🦊 MetaMask
              </button>
              <button
                onClick={connectInjected}
                style={{
                  background: '#7B3FE4', border: 'none', color: '#FFFFFF',
                  padding: '12px', borderRadius: '10px',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
                }}>
                🐰 Browser Wallet
              </button>
            </div>
          </>
        ) : txPending || isConfirming ? (
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
        ) : (
          <>
            <p style={{ color: '#AAAAFF', fontSize: '13px', margin: '0 0 16px 0' }}>
              {isConnected ? 'Click below to save your score on-chain' : 'Connect wallet to save your score'}
            </p>
            <button
              onClick={() => {
                if (isConnected) submitScoreToChain(finalScore)
                else setShowWalletPrompt(true)
              }}
              style={{
                background: 'linear-gradient(135deg, #0052FF 0%, #00AAFF 100%)',
                border: 'none', color: '#FFFFFF',
                padding: '14px 32px', borderRadius: '10px',
                cursor: 'pointer', fontSize: '15px', fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(0,82,255,0.5)',
                marginBottom: '10px', width: '100%'
              }}>
              {isConnected ? '💾 Submit Score' : '🔗 Connect Wallet'}
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
        )}
      </div>
    </div>
  )
}
