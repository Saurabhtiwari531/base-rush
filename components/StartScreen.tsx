'use client'
import { BaseyCanvas } from './BaseyCanvas'

type Props = {
  onStart: () => void
  isConnected: boolean
  address: string | undefined
  onConnect: () => void
  personalBest: number
}

export function StartScreen({ onStart, isConnected, address, onConnect, personalBest }: Props) {
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
              { key: '← → / Swipe L/R', action: 'Switch Lane' },
              { key: 'DOWN / Swipe ↓', action: 'Slide' },
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
            gap: '8px', marginBottom: '14px',
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
              onClick={onConnect}
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
