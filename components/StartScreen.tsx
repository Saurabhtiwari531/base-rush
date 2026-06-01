'use client'
import { BaseyCanvas } from './BaseyCanvas'
import type { Skin } from '../hooks/useSkins'

type Props = {
  onStart: () => void
  isConnected: boolean
  address: string | undefined
  onConnect: () => void
  personalBest: number
  achievementsUnlocked: number
  onShowAchievements: () => void
  streak: number
  hasCheckedInToday: boolean
  coinBalance: number
  equippedSkin: Skin
  dailyCoins: number
  onOpenDaily: () => void
  onOpenSkins: () => void
  onOpenHowItWorks: () => void
}

const TOTAL_ACHIEVEMENTS = 16
const STREAK_TARGET = 25

const trayBtn: React.CSSProperties = {
  background: 'rgba(0,82,255,0.08)',
  border: '1px solid rgba(0,82,255,0.25)',
  borderRadius: '10px',
  padding: '8px 4px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
  cursor: 'pointer', color: 'inherit',
}
const trayLabel: React.CSSProperties = {
  color: '#88AACC', fontSize: '8px', letterSpacing: '1.5px', fontWeight: 'bold',
  marginTop: '2px',
}
const trayValue: React.CSSProperties = {
  fontSize: '10px', fontWeight: 'bold', display: 'flex', gap: '2px',
}

export function StartScreen({
  onStart, isConnected, address, onConnect, personalBest,
  achievementsUnlocked, onShowAchievements,
  streak, hasCheckedInToday, coinBalance, equippedSkin, dailyCoins,
  onOpenDaily, onOpenSkins, onOpenHowItWorks,
}: Props) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '100dvh', width: '100%',
      background: 'radial-gradient(ellipse at top, #0a0a2e 0%, #000000 60%)',
      padding: '20px',
      fontFamily: '"Courier New", monospace',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Animated stars background */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'
      }}>
        {[...Array(30)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: i % 3 === 0 ? '3px' : '2px',
            height: i % 3 === 0 ? '3px' : '2px',
            background: i % 4 === 0 ? '#0052FF' : '#ffffff',
            borderRadius: '50%',
            top: `${(i * 37 + 5) % 100}%`,
            left: `${(i * 53 + 7) % 100}%`,
            opacity: 0.4 + (i % 5) * 0.1,
          }} />
        ))}
      </div>

      {/* PRIZE BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #1a0a00 0%, #2a1000 100%)',
        border: '2px solid #FFD700',
        borderRadius: '12px',
        padding: '10px 24px',
        marginBottom: '20px',
        display: 'flex', alignItems: 'center', gap: '10px',
        boxShadow: '0 0 20px rgba(255,215,0,0.3)',
      }}>
        <span style={{ fontSize: '22px' }}>🏆</span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '12px', letterSpacing: '2px' }}>
            WEEKLY PRIZE POOL
          </div>
          <div style={{ color: '#FFA500', fontSize: '11px' }}>
            🥇 $5 &nbsp;•&nbsp; 🥈 $3 &nbsp;•&nbsp; 🥉 $1
          </div>
        </div>
        <span style={{ fontSize: '22px' }}>🏆</span>
      </div>

      {/* GAME LOGO CARD */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(0,10,40,0.95) 0%, rgba(0,5,20,0.98) 100%)',
        border: '2px solid #0052FF',
        borderRadius: '20px',
        padding: '28px 24px',
        maxWidth: '360px', width: '100%',
        textAlign: 'center',
        boxShadow: '0 0 40px rgba(0,82,255,0.25), inset 0 1px 0 rgba(0,82,255,0.2)',
        position: 'relative',
      }}>
        {/* PLAY TO EARN badge */}
        <div style={{
          position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #00C853 0%, #00E676 100%)',
          color: '#000000', fontWeight: 'bold', fontSize: '10px',
          padding: '4px 16px', borderRadius: '20px', letterSpacing: '2px',
          whiteSpace: 'nowrap',
        }}>
          ⚡ PLAY TO EARN
        </div>

        {/* Game character — actual BASEY robot from game */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 4px' }}>
          <BaseyCanvas />
        </div>

        {/* Title */}
        <h1 style={{
          color: '#FFFFFF', fontSize: '36px', fontWeight: 'bold',
          margin: '8px 0 4px', letterSpacing: '6px',
          textShadow: '0 0 20px rgba(0,82,255,0.8), 0 0 40px rgba(0,82,255,0.4)',
        }}>
          BASE RUSH
        </h1>
        <p style={{
          color: '#0088FF', fontSize: '11px', letterSpacing: '3px',
          margin: '0 0 20px',
        }}>
          ON-CHAIN RUNNER · BASE NETWORK
        </p>

        {/* Stats row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px', marginBottom: '20px',
        }}>
          {[
            { icon: '🪙', label: 'Coins', val: 'Collect' },
            { icon: '🛡️', label: 'Power-ups', val: '4 Types' },
            { icon: '⛓️', label: 'On-chain', val: 'Scores' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(0,82,255,0.1)',
              border: '1px solid rgba(0,82,255,0.3)',
              borderRadius: '10px', padding: '10px 6px',
            }}>
              <div style={{ fontSize: '20px' }}>{s.icon}</div>
              <div style={{ color: '#00AAFF', fontSize: '10px', fontWeight: 'bold', marginTop: '4px' }}>
                {s.val}
              </div>
              <div style={{ color: '#556677', fontSize: '9px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(0,82,255,0.2)',
          borderRadius: '10px', padding: '12px',
          marginBottom: '20px', textAlign: 'left',
        }}>
          <div style={{ color: '#0088FF', fontSize: '10px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '8px' }}>
            HOW TO PLAY
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            {[
              { key: 'SPACE / ↑ / Tap', action: 'Jump' },
              { key: 'DOWN / Swipe ↓', action: 'Slide' },
              { key: '🔥 Combo', action: 'Chain coins' },
              { key: '🎁 Drops', action: 'Power-ups' },
            ].map(c => (
              <div key={c.action} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  background: 'rgba(0,82,255,0.2)', color: '#AACCFF',
                  fontSize: '9px', padding: '2px 5px', borderRadius: '4px',
                  border: '1px solid rgba(0,82,255,0.3)', whiteSpace: 'nowrap',
                }}>
                  {c.key}
                </span>
                <span style={{ color: '#667788', fontSize: '9px' }}>{c.action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Best */}
        {personalBest > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '8px', marginBottom: '10px',
            background: 'rgba(255,215,0,0.08)',
            border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: '10px', padding: '8px 16px',
          }}>
            <span style={{ fontSize: '16px' }}>🏆</span>
            <span style={{ color: '#AAAAAA', fontSize: '11px', letterSpacing: '1px' }}>YOUR BEST</span>
            <span style={{ color: '#FFD700', fontSize: '18px', fontWeight: 'bold' }}>
              {personalBest.toLocaleString()}
            </span>
            <span style={{ color: '#AAAAAA', fontSize: '10px' }}>pts</span>
          </div>
        )}

        {/* DAILY STREAK CTA — hero spot */}
        <button
          onClick={onOpenDaily}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            width: '100%', marginBottom: '10px',
            background: hasCheckedInToday
              ? 'linear-gradient(135deg, rgba(0,200,80,0.18), rgba(0,200,80,0.04))'
              : streak > 0
                ? 'linear-gradient(135deg, rgba(255,140,0,0.22), rgba(255,80,0,0.05))'
                : 'linear-gradient(135deg, rgba(255,140,0,0.15), rgba(255,80,0,0.03))',
            border: hasCheckedInToday
              ? '1px solid rgba(0,200,80,0.5)'
              : '1px solid rgba(255,140,0,0.5)',
            borderRadius: '12px', padding: '10px 14px',
            cursor: 'pointer', color: 'inherit', textAlign: 'left',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{ fontSize: '24px', flexShrink: 0 }}>
            {hasCheckedInToday ? '✅' : '🔥'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '9px', letterSpacing: '2px', fontWeight: 'bold',
              color: hasCheckedInToday ? '#00C853' : '#FFAA00',
              marginBottom: '2px',
            }}>
              {hasCheckedInToday
                ? 'STREAK ACTIVE TODAY'
                : streak > 0
                  ? "DON'T LOSE YOUR STREAK!"
                  : 'START DAILY STREAK'}
            </div>
            <div style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold', lineHeight: 1.1 }}>
              {streak > 0
                ? `🔥 ${streak}-day streak · ${Math.min(streak, STREAK_TARGET)}/${STREAK_TARGET}`
                : '🎁 Reach Day 25 → Mystery Box'}
            </div>

            {/* Progress bar toward the Day-25 Mystery Box */}
            {streak > 0 && (
              <div style={{
                width: '100%', height: '4px', marginTop: '5px',
                background: 'rgba(255,255,255,0.12)', borderRadius: '2px', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${Math.min(100, (streak / STREAK_TARGET) * 100)}%`, height: '100%',
                  background: 'linear-gradient(90deg, #FF8A00, #FFD700)',
                }} />
              </div>
            )}

            <div style={{
              color: hasCheckedInToday ? '#88BB99' : '#FFC980',
              fontSize: '9px', marginTop: streak > 0 ? '4px' : '3px',
            }}>
              {hasCheckedInToday
                ? '✓ Come back tomorrow to keep it alive'
                : streak > 0
                  ? `Check in today → +${dailyCoins} 🪙`
                  : `+${dailyCoins} 🪙 every day · 🎁 box at Day 25`}
            </div>
          </div>
          <span style={{ color: '#fff', fontSize: '16px', alignSelf: 'center' }}>›</span>
        </button>

        {/* 3-column tray: Achievements · Skins · Best */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: '6px', marginBottom: '12px',
        }}>
          <button onClick={onShowAchievements} style={trayBtn}>
            <div style={{ fontSize: '18px', lineHeight: 1 }}>🏅</div>
            <div style={trayLabel}>BADGES</div>
            <div style={trayValue}>
              <span style={{ color: '#FFD700' }}>{achievementsUnlocked}</span>
              <span style={{ color: '#556677' }}>/{TOTAL_ACHIEVEMENTS}</span>
            </div>
          </button>
          <button onClick={onOpenSkins} style={trayBtn}>
            <div style={{ fontSize: '18px', lineHeight: 1 }}>{equippedSkin.icon}</div>
            <div style={trayLabel}>SKINS</div>
            <div style={trayValue}>
              <span style={{ color: '#FFD700' }}>🪙{coinBalance.toLocaleString()}</span>
            </div>
          </button>
          {personalBest > 0 ? (
            <div style={{ ...trayBtn, cursor: 'default' } as React.CSSProperties}>
              <div style={{ fontSize: '18px', lineHeight: 1 }}>🏆</div>
              <div style={trayLabel}>BEST</div>
              <div style={trayValue}>
                <span style={{ color: '#FFD700' }}>{personalBest.toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <button onClick={onOpenHowItWorks} style={trayBtn}>
              <div style={{ fontSize: '18px', lineHeight: 1 }}>📖</div>
              <div style={trayLabel}>HOW</div>
              <div style={trayValue}>
                <span style={{ color: '#88BBFF' }}>Learn</span>
              </div>
            </button>
          )}
        </div>

        {/* PLAY button */}
        <button
          onClick={onStart}
          style={{
            background: 'linear-gradient(135deg, #0052FF 0%, #0088FF 100%)',
            border: 'none', color: '#FFFFFF',
            padding: '18px 40px', borderRadius: '14px',
            cursor: 'pointer', fontSize: '20px', fontWeight: 'bold',
            width: '100%',
            boxShadow: '0 4px 24px rgba(0,82,255,0.5), 0 0 0 1px rgba(0,136,255,0.3)',
            letterSpacing: '3px',
            transition: 'transform 0.1s',
          }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          ▶ PLAY NOW
        </button>

        {/* Wallet status */}
        <div style={{ marginTop: '14px' }}>
          {isConnected ? (
            <div style={{
              background: 'rgba(0,200,80,0.1)', border: '1px solid rgba(0,200,80,0.3)',
              borderRadius: '8px', padding: '8px 12px',
              color: '#00C853', fontSize: '11px', fontWeight: 'bold',
            }}>
              ✅ {address?.slice(0, 6)}...{address?.slice(-4)} · Ready to earn!
            </div>
          ) : (
            <button
              onClick={() => onConnect()}
              style={{
                background: 'transparent',
                border: '1px solid rgba(0,82,255,0.5)',
                color: '#4488FF', fontSize: '11px',
                padding: '8px 16px', borderRadius: '8px',
                cursor: 'pointer', width: '100%',
              }}
            >
              🔵 Connect Wallet to Save Score
            </button>
          )}
        </div>
      </div>

      {/* Animated scrolling ticker */}
      <div style={{
        marginTop: '18px', width: '100%', maxWidth: '360px',
        overflow: 'hidden', position: 'relative',
      }}>
        <style>{`
          @keyframes ticker {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
        <div style={{
          display: 'flex', whiteSpace: 'nowrap',
          animation: 'ticker 14s linear infinite',
          gap: '0px',
        }}>
          {/* Duplicate for seamless loop */}
          {[0, 1].map(i => (
            <span key={i} style={{ display: 'inline-flex', gap: '0' }}>
              {[
                '⚡ BASE RUSH',
                '🏆 WEEKLY PRIZES',
                '⛓️ ON-CHAIN SCORES',
                '🛡️ POWER-UPS',
                '🪙 COLLECT COINS',
                '🚀 PLAY TO EARN',
              ].map(item => (
                <span key={item} style={{
                  color: '#1a3366', fontSize: '10px', letterSpacing: '2px',
                  padding: '0 20px', fontWeight: 'bold',
                }}>
                  {item}  ·
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* Base branding */}
      <div style={{
        marginTop: '10px', color: '#1a2a3a', fontSize: '9px', letterSpacing: '1px',
      }}>
        Powered by Base Network · Scores stored on-chain
      </div>
    </div>
  )
}
