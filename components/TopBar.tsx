'use client'

import { LeaderboardEntry } from '../lib/contract'

type Props = {
  isConnected: boolean
  address: string | undefined
  disconnect: () => void
  showLeaderboard: boolean
  setShowLeaderboard: (v: boolean) => void
  refetch: () => void
  leaderboard: LeaderboardEntry[]
  leaderboardLoading: boolean
  onTogglePause?: () => void
  isPaused?: boolean
}

export function TopBar({
  isConnected, address, disconnect,
  showLeaderboard, setShowLeaderboard, refetch,
  leaderboard, leaderboardLoading,
  onTogglePause, isPaused,
}: Props) {
  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(0,0,30,0.95)',
        borderBottom: '1px solid #0044FF',
        padding: '8px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onTogglePause ? (
            /* In-game: show pause/resume button only */
            <button
              onClick={onTogglePause}
              title={isPaused ? 'Resume' : 'Pause'}
              style={{
                background: isPaused ? 'rgba(0,200,100,0.2)' : 'rgba(0,82,255,0.2)',
                border: isPaused ? '1px solid #00C864' : '1px solid #0052FF',
                color: isPaused ? '#00C864' : '#FFFFFF',
                borderRadius: '10px', padding: '6px 18px',
                cursor: 'pointer', fontSize: '15px',
                fontWeight: 'bold', letterSpacing: '1px',
                minWidth: '96px',
              }}
            >
              {isPaused ? '▶ RESUME' : '⏸ PAUSE'}
            </button>
          ) : (
            /* Start / Game-over screen: show brand */
            <span style={{
              color: '#4499FF', fontWeight: 'bold', fontSize: '15px',
              letterSpacing: '3px',
              textShadow: '0 0 12px rgba(0,120,255,0.8)',
            }}>
              ⚡ BASE RUSH
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => {
              setShowLeaderboard(!showLeaderboard)
              if (!showLeaderboard) refetch()
            }}
            style={{
              background: 'rgba(255,215,0,0.15)', border: '1px solid #FFD700',
              color: '#FFD700', padding: '4px 12px', borderRadius: '20px',
              cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
            }}
          >
            🏆 Top 3
          </button>

          {isConnected && (
            <>
              <span style={{
                color: '#00FF88', fontSize: '12px',
                background: 'rgba(0,255,100,0.1)',
                padding: '4px 10px', borderRadius: '20px',
                border: '1px solid #00FF88'
              }}>
                ✅ {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <button onClick={() => disconnect()} style={{
                background: 'transparent', border: '1px solid #FF4444',
                color: '#FF4444', padding: '4px 10px',
                borderRadius: '20px', cursor: 'pointer', fontSize: '12px'
              }}>
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>

      {showLeaderboard && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.95)', zIndex: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,8,40,0.98) 0%, rgba(0,4,20,0.98) 100%)',
            border: '2px solid #FFD700', borderRadius: '20px', padding: '32px',
            maxWidth: '480px', width: '100%',
            boxShadow: '0 0 40px rgba(255,215,0,0.3)', position: 'relative'
          }}>
            <button
              onClick={() => setShowLeaderboard(false)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'rgba(255,68,68,0.2)', border: '1px solid #FF4444',
                color: '#FF4444', width: '32px', height: '32px',
                borderRadius: '50%', cursor: 'pointer', fontSize: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              ×
            </button>

            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏆</div>
              <h2 style={{
                color: '#FFD700', fontSize: '28px', fontWeight: 'bold',
                margin: '0 0 8px 0', textShadow: '0 0 20px rgba(255,215,0,0.5)'
              }}>
                TOP 3 LEADERBOARD
              </h2>
              <p style={{ color: '#AAAAFF', fontSize: '12px', margin: 0 }}>
                Weekly rewards • Resets every Sunday
              </p>
            </div>

            {leaderboardLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{
                  width: '40px', height: '40px',
                  border: '4px solid #FFD700', borderTopColor: 'transparent',
                  borderRadius: '50%', margin: '0 auto',
                  animation: 'spin 1s linear infinite'
                }} />
                <p style={{ color: '#AAAAFF', fontSize: '13px', marginTop: '16px' }}>
                  Loading rankings...
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {leaderboard.map((entry: LeaderboardEntry) => {
                  const isEmpty = entry.address === ''
                  const isYou = !isEmpty && entry.address === address
                  const medalColors = [
                    { bg: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', border: '2px solid #FFD700', glow: '0 0 20px rgba(255,215,0,0.5)', row: 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,165,0,0.05) 100%)' },
                    { bg: 'linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%)', border: '2px solid #C0C0C0', glow: 'none', row: 'linear-gradient(135deg, rgba(192,192,192,0.12) 0%, rgba(128,128,128,0.05) 100%)' },
                    { bg: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)', border: '2px solid #CD7F32', glow: 'none', row: 'linear-gradient(135deg, rgba(205,127,50,0.12) 0%, rgba(139,69,19,0.05) 100%)' },
                  ]
                  const m = medalColors[entry.rank - 1]
                  const medals = ['🥇', '🥈', '🥉']
                  return (
                    <div
                      key={entry.rank}
                      style={{
                        background: isEmpty ? 'rgba(255,255,255,0.03)' : m.row,
                        border: isEmpty ? '2px dashed rgba(255,255,255,0.15)' : m.border,
                        borderRadius: '12px', padding: '16px',
                        display: 'flex', alignItems: 'center', gap: '16px',
                        position: 'relative', overflow: 'hidden', opacity: isEmpty ? 0.6 : 1
                      }}
                    >
                      <div style={{
                        width: '50px', height: '50px', borderRadius: '50%',
                        background: isEmpty ? 'rgba(255,255,255,0.08)' : m.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '24px', fontWeight: 'bold', color: '#000000',
                        flexShrink: 0, boxShadow: isEmpty ? 'none' : m.glow
                      }}>
                        {isEmpty ? <span style={{ fontSize: '18px', color: '#666' }}>#{entry.rank}</span> : medals[entry.rank - 1]}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          color: isEmpty ? '#555' : '#FFFFFF', fontSize: '13px', fontFamily: 'monospace',
                          marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}>
                          {isEmpty ? (
                            <span style={{ color: '#555', fontStyle: 'italic' }}>No player yet</span>
                          ) : isYou ? (
                            <span style={{ color: '#00FF88', fontWeight: 'bold' }}>
                              YOU • {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                            </span>
                          ) : (
                            <span>{entry.address.slice(0, 6)}...{entry.address.slice(-4)}</span>
                          )}
                        </div>
                        <div style={{
                          color: isEmpty ? '#444' : (entry.rank === 1 ? '#FFD700' : '#AAAAFF'),
                          fontSize: '20px', fontWeight: 'bold'
                        }}>
                          {isEmpty ? '---' : `${entry.score.toLocaleString()} pts`}
                        </div>
                      </div>

                      <div style={{
                        background: isEmpty ? 'rgba(255,255,255,0.05)' : 'rgba(0,255,100,0.15)',
                        border: isEmpty ? '1px solid rgba(255,255,255,0.1)' : '1px solid #00FF88',
                        borderRadius: '8px', padding: '8px 12px', textAlign: 'center'
                      }}>
                        <div style={{ color: isEmpty ? '#555' : '#00FF88', fontSize: '16px', fontWeight: 'bold' }}>
                          {entry.reward}
                        </div>
                        <div style={{ color: '#AACCFF', fontSize: '9px' }}>REWARD</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{
              marginTop: '24px', padding: '16px',
              background: 'rgba(68,68,255,0.1)', borderRadius: '10px',
              border: '1px solid rgba(68,68,255,0.3)'
            }}>
              <p style={{ color: '#AACCFF', fontSize: '11px', margin: '0 0 8px 0', textAlign: 'center' }}>
                💡 <strong>How to win:</strong>
              </p>
              <p style={{ color: '#8899AA', fontSize: '10px', margin: 0, textAlign: 'center' }}>
                Submit your high score on-chain • Top 3 players at week-end get rewards
                <br />
                🎁 New: Collect power-ups for shields, magnets, slow-mo &amp; 2x points!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
