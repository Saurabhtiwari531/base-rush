'use client'

import { useState } from 'react'
import { LeaderboardEntry } from '../lib/contract'

// ── helpers ─────────────────────────────────────────────────────────────────
const bodyText: React.CSSProperties = {
  color: '#C7D6EA', fontSize: '12px', lineHeight: '1.6', margin: 0,
}

function Section({
  icon, title, color, children,
}: {
  icon: string
  title: string
  color: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px',
      }}>
        <span style={{ fontSize: '14px' }}>{icon}</span>
        <span style={{
          color, fontSize: '10px', fontWeight: 'bold', letterSpacing: '2px',
        }}>{title}</span>
        <div style={{ flex: 1, height: '1px', background: `${color}33` }} />
      </div>
      {children}
    </div>
  )
}

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
  const [showHowItWorks, setShowHowItWorks] = useState(false)

  return (
    <>
      <div className="tb-header" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(0,0,30,0.95)',
        borderBottom: '1px solid #0044FF',
        padding: '8px 16px',
        // Push the bar below the device notch on full-screen / Base-App webviews
        paddingTop: 'calc(8px + env(safe-area-inset-top))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        {/* ── LEFT SIDE ── */}
        <div className="tb-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
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
            /* Start / Game-over screen: brand + menu items */
            <>
              <span className="tb-brand" style={{
                color: '#4499FF', fontWeight: 'bold', fontSize: '15px',
                letterSpacing: '3px', whiteSpace: 'nowrap',
                textShadow: '0 0 12px rgba(0,120,255,0.8)',
              }}>
                ⚡ BASE RUSH
              </span>

              {/* Divider */}
              <div className="tb-brand-divider" style={{ width: '1px', height: '18px', background: 'rgba(0,68,255,0.35)', flexShrink: 0 }} />

              {/* How It Works */}
              <button
                onClick={() => setShowHowItWorks(true)}
                className="tb-pill"
                style={{
                  background: 'rgba(0,82,255,0.15)',
                  border: '1px solid rgba(0,82,255,0.4)',
                  color: '#88BBFF', padding: '4px 10px', borderRadius: '20px',
                  cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
                  letterSpacing: '0.5px', whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                📖 How It Works
              </button>

              {/* Leaderboard */}
              <button
                onClick={() => { setShowLeaderboard(!showLeaderboard); if (!showLeaderboard) refetch() }}
                className="tb-pill"
                style={{
                  background: 'rgba(255,215,0,0.15)', border: '1px solid #FFD700',
                  color: '#FFD700', padding: '4px 10px', borderRadius: '20px',
                  cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                🏆 Leaderboard
              </button>
            </>
          )}
        </div>

        {/* ── RIGHT SIDE — wallet only ── */}
        <div className="tb-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {isConnected && (
            <>
              <span className="tb-wallet" style={{
                color: '#00FF88', fontSize: '12px', fontFamily: 'var(--ui-mono)',
                background: 'rgba(0,255,100,0.1)',
                padding: '4px 10px', borderRadius: '20px',
                border: '1px solid #00FF88', whiteSpace: 'nowrap',
              }}>
                ✅ {address?.slice(0, 4)}…{address?.slice(-4)}
              </span>
              <button onClick={() => disconnect()} className="tb-disconnect" style={{
                background: 'transparent', border: '1px solid #FF4444',
                color: '#FF4444', padding: '4px 10px',
                borderRadius: '20px', cursor: 'pointer', fontSize: '12px',
                whiteSpace: 'nowrap',
              }}>
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── HOW IT WORKS MODAL ── */}
      {showHowItWorks && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.95)', zIndex: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '12px',
        }}>
          <div className="hiw-modal rh-modal-scroll" style={{
            background: 'linear-gradient(135deg, rgba(0,8,40,0.98) 0%, rgba(0,4,20,0.98) 100%)',
            border: '2px solid #0052FF', borderRadius: '20px', padding: '24px 20px',
            maxWidth: '460px', width: '100%', position: 'relative',
            boxShadow: '0 0 40px rgba(0,82,255,0.3)',
          }}>
            {/* Close */}
            <button
              onClick={() => setShowHowItWorks(false)}
              style={{
                position: 'absolute', top: '14px', right: '14px',
                background: 'rgba(255,68,68,0.2)', border: '1px solid #FF4444',
                color: '#FF4444', width: '30px', height: '30px',
                borderRadius: '50%', cursor: 'pointer', fontSize: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >×</button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>📖</div>
              <h2 style={{
                color: '#4499FF', fontSize: '22px', fontWeight: 'bold',
                margin: '0 0 4px', letterSpacing: '4px',
                textShadow: '0 0 16px rgba(0,100,255,0.6)',
              }}>HOW IT WORKS</h2>
              <p style={{ color: '#6C86A8', fontSize: '11px', margin: 0, letterSpacing: '2px', fontWeight: 600 }}>
                CYBERPUNK RUNNER · BASE NETWORK
              </p>
            </div>

            <div className="hiw-section-gap" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* The Game */}
              <Section icon="🎮" title="THE GAME" color="#4499FF">
                <p style={bodyText}>
                  BASE RUSH is an infinite cyberpunk runner. Your character — <strong style={{ color: '#88CCFF' }}>Basey</strong> —
                  sprints through a neon grid world that gets faster every second.
                  Dodge obstacles, collect coins, and survive as long as you can.
                </p>
              </Section>

              {/* Controls */}
              <Section icon="⌨️" title="CONTROLS" color="#00CCFF">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[
                    { key: 'SPACE / ↑ / Tap', action: '🦘 Jump', color: '#00CCFF' },
                    { key: 'DOWN ↓ / Swipe down', action: '🧎 Slide', color: '#00CCFF' },
                    { key: 'High obstacle', action: '→ Duck/Slide', color: '#FF8844' },
                    { key: 'Low obstacle', action: '→ Jump over', color: '#FF8844' },
                  ].map(c => (
                    <div key={c.action} style={{
                      background: 'rgba(0,82,255,0.08)',
                      border: '1px solid rgba(0,82,255,0.2)',
                      borderRadius: '8px', padding: '8px',
                    }}>
                      <div style={{ color: '#9FC2EE', fontSize: '10px', marginBottom: '3px', fontWeight: 500 }}>{c.key}</div>
                      <div style={{ color: c.color, fontSize: '12px', fontWeight: 700 }}>{c.action}</div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Scoring */}
              <Section icon="🪙" title="SCORING" color="#FFD700">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {[
                    { label: 'Each coin', val: '+10 pts', note: 'base value' },
                    { label: '5-coin combo', val: '+20 pts', note: '2× multiplier 🔥' },
                    { label: '10-coin combo', val: '+30 pts', note: '3× multiplier 🔥🔥' },
                    { label: 'Survive longer', val: '+pts/sec', note: 'speed multiplier scales score' },
                  ].map(s => (
                    <div key={s.label} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 10px',
                      background: 'rgba(255,215,0,0.06)',
                      border: '1px solid rgba(255,215,0,0.15)',
                      borderRadius: '8px',
                    }}>
                      <span style={{ color: '#CBD8EA', fontSize: '12px', fontWeight: 500 }}>{s.label}</span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: '#FFD700', fontSize: '14px', fontWeight: 700 }}>{s.val}</span>
                        <span style={{ color: '#8090A8', fontSize: '9.5px', marginLeft: '6px' }}>{s.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Power-ups */}
              <Section icon="⚡" title="POWER-UPS" color="#FF00FF">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { icon: '🛡️', name: 'Shield', desc: 'Block the next obstacle hit — one free life', color: '#00FFFF' },
                    { icon: '🧲', name: 'Magnet', desc: 'Pulls nearby coins towards you automatically', color: '#FF44FF' },
                    { icon: '⏱️', name: 'Slow-Mo', desc: 'Everything slows down — easier dodging & sliding', color: '#FFAA00' },
                    { icon: '×2', name: '2× Points', desc: 'Every coin scores double for a limited time', color: '#00FF88' },
                  ].map(p => (
                    <div key={p.name} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 10px',
                      background: 'rgba(255,0,255,0.06)',
                      border: '1px solid rgba(255,0,255,0.2)',
                      borderRadius: '8px',
                    }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '8px',
                        background: 'rgba(0,0,0,0.4)',
                        border: `1px solid ${p.color}44`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px', flexShrink: 0,
                      }}>{p.icon}</div>
                      <div>
                        <div style={{ color: p.color, fontSize: '13px', fontWeight: 700 }}>{p.name}</div>
                        <div style={{ color: '#B0C3DB', fontSize: '10.5px', marginTop: '2px', lineHeight: 1.4 }}>{p.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* On-chain */}
              <Section icon="⛓️" title="ON-CHAIN SCORING" color="#00FF88">
                <div style={{
                  padding: '12px',
                  background: 'rgba(0,255,100,0.06)',
                  border: '1px solid rgba(0,255,100,0.2)',
                  borderRadius: '10px',
                }}>
                  <p style={{ ...bodyText, margin: '0 0 8px' }}>
                    When your game ends, your score is submitted to the <strong style={{ color: '#00FF88' }}>Base Network</strong> blockchain.
                    No servers — your high score lives permanently on-chain.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    {[
                      { rank: '🥇', prize: '$5', label: '1st Place' },
                      { rank: '🥈', prize: '$3', label: '2nd Place' },
                      { rank: '🥉', prize: '$1', label: '3rd Place' },
                    ].map(r => (
                      <div key={r.rank} style={{
                        flex: 1, textAlign: 'center',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,215,0,0.25)',
                        borderRadius: '8px', padding: '8px 4px',
                      }}>
                        <div style={{ fontSize: '20px' }}>{r.rank}</div>
                        <div style={{ color: '#FFD700', fontSize: '15px', fontWeight: 700 }}>{r.prize}</div>
                        <div style={{ color: '#8AA0BC', fontSize: '9.5px', fontWeight: 500 }}>{r.label}</div>
                      </div>
                    ))}
                  </div>
                  <p style={{ color: '#7C93B2', fontSize: '9.5px', margin: '10px 0 0', textAlign: 'center', letterSpacing: '0.5px' }}>
                    🗓 Weekly prizes · Resets every Sunday
                  </p>
                </div>
              </Section>
            </div>

            <button
              onClick={() => setShowHowItWorks(false)}
              style={{
                marginTop: '20px', width: '100%',
                background: 'linear-gradient(135deg, #0052FF, #0088FF)',
                border: 'none', color: '#FFF',
                padding: '13px', borderRadius: '12px',
                fontSize: '14px', fontWeight: 'bold',
                cursor: 'pointer', letterSpacing: '2px',
                boxShadow: '0 4px 20px rgba(0,82,255,0.4)',
              }}
            >
              GOT IT — LET'S PLAY ▶
            </button>
          </div>
        </div>
      )}

      {showLeaderboard && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.95)', zIndex: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '12px'
        }}>
          <div className="hiw-modal rh-modal-scroll" style={{
            background: 'linear-gradient(135deg, rgba(0,8,40,0.98) 0%, rgba(0,4,20,0.98) 100%)',
            border: '2px solid #FFD700', borderRadius: '20px', padding: '28px 22px',
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
                          color: isEmpty ? '#667' : '#FFFFFF', fontSize: '13px', fontFamily: 'var(--ui-mono)',
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
