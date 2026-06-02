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
  onOpenLeaderboard: () => void
}

const STREAK_TARGET = 25
const HEX = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'

// Pointy-top neon hexagon button (icon + caption). The coloured hex sits under a
// slightly-smaller dark hex to make a glowing ring; drop-shadow follows the clip.
function HexButton({
  icon, label, color, onClick, badge,
}: {
  icon: React.ReactNode; label: string; color: string; onClick: () => void; badge?: string | number
}) {
  return (
    <button
      onClick={onClick}
      className="rh-press"
      style={{
        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '60px',
      }}
    >
      <div style={{ position: 'relative', width: '50px', height: '56px', filter: `drop-shadow(0 0 6px ${color}aa)` }}>
        <div style={{ position: 'absolute', inset: 0, clipPath: HEX, background: color }} />
        <div style={{ position: 'absolute', inset: '2.5px', clipPath: HEX, background: 'linear-gradient(160deg,#15114e,#0a0726)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '21px' }}>
          {icon}
        </div>
        {badge != null && (
          <div style={{
            position: 'absolute', top: '-3px', right: '0px', minWidth: '17px', height: '17px', padding: '0 4px',
            borderRadius: '9px', background: '#FF2D55', color: '#fff', fontSize: '10px', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px rgba(255,45,85,0.9)',
          }}>{badge}</div>
        )}
      </div>
      <span style={{ color: '#cfe0ff', fontSize: '8.5px', fontWeight: 'bold', letterSpacing: '1px', textShadow: `0 0 6px ${color}55` }}>
        {label}
      </span>
    </button>
  )
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div style={{
      flex: 1, background: 'rgba(10,10,40,0.55)', border: `1px solid ${color}55`,
      borderRadius: '14px', padding: '9px 4px', textAlign: 'center',
      boxShadow: `0 0 14px ${color}22, inset 0 0 14px ${color}10`,
    }}>
      <div style={{ fontSize: '17px', lineHeight: 1, marginBottom: '3px' }}>{icon}</div>
      <div style={{ color: '#8aa0c8', fontSize: '7.5px', fontWeight: 'bold', letterSpacing: '1.5px' }}>{label}</div>
      <div style={{ color, fontSize: '16px', fontWeight: 800, textShadow: `0 0 10px ${color}88`, marginTop: '1px' }}>{value}</div>
    </div>
  )
}

function NavItem({ icon, label, color, active, onClick }: {
  icon: string; label: string; color: string; active?: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', flex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '2px 0',
      }}
    >
      <span style={{ fontSize: '17px', opacity: active ? 1 : 0.65, filter: active ? `drop-shadow(0 0 6px ${color})` : 'none' }}>{icon}</span>
      <span style={{ color: active ? color : '#6a7da0', fontSize: '8.5px', fontWeight: 'bold', letterSpacing: '0.5px' }}>{label}</span>
    </button>
  )
}

export function StartScreen({
  onStart, isConnected, address, onConnect, personalBest,
  achievementsUnlocked, onShowAchievements,
  streak, hasCheckedInToday, coinBalance, equippedSkin,
  onOpenDaily, onOpenSkins, onOpenHowItWorks, onOpenLeaderboard,
}: Props) {
  const skylineHeights = [40, 72, 54, 96, 62, 116, 78, 50, 88, 60, 46]

  return (
    <div style={{
      position: 'relative', display: 'flex', flexDirection: 'column',
      minHeight: '100dvh', width: '100%', overflowX: 'hidden', overflowY: 'auto',
      fontFamily: 'var(--ui-font)',
      paddingTop: 'calc(10px + env(safe-area-inset-top))',
      paddingBottom: 'calc(6px + env(safe-area-inset-bottom))',
      paddingLeft: '12px', paddingRight: '12px',
      background: 'radial-gradient(ellipse 90% 55% at 50% 40%, #2a1c6e 0%, #120c44 42%, #06031c 100%)',
    }}>
      <style>{`
        @keyframes brLogoGlow {
          0%,100% { filter: drop-shadow(0 0 14px rgba(40,140,255,0.5)); }
          50%     { filter: drop-shadow(0 0 26px rgba(255,45,155,0.55)); }
        }
        @keyframes brPlayPulse {
          0%,100% { box-shadow: 0 6px 26px rgba(255,80,140,0.45), 0 0 0 1px rgba(255,200,120,0.4); }
          50%     { box-shadow: 0 8px 40px rgba(255,120,60,0.85), 0 0 0 1px rgba(255,220,150,0.6); }
        }
        @keyframes brChestGlow {
          0%,100% { box-shadow: 0 0 16px rgba(255,180,40,0.35); }
          50%     { box-shadow: 0 0 28px rgba(255,180,40,0.65); }
        }
      `}</style>

      {/* ── BACKGROUND LAYERS ───────────────────────────────────────────── */}
      {/* stars */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        {[...Array(26)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: i % 4 === 0 ? '2.5px' : '1.5px', height: i % 4 === 0 ? '2.5px' : '1.5px',
            background: i % 5 === 0 ? '#7fd0ff' : '#ffffff', borderRadius: '50%',
            top: `${(i * 31 + 5) % 60}%`, left: `${(i * 57 + 7) % 100}%`,
            opacity: 0.25 + (i % 4) * 0.12,
          }} />
        ))}
      </div>
      {/* city skyline */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: '40%', height: '130px', zIndex: 0,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '3px',
        opacity: 0.5, pointerEvents: 'none',
      }}>
        {skylineHeights.map((h, i) => (
          <div key={i} style={{
            width: '8%', height: `${h}px`,
            background: 'linear-gradient(180deg, rgba(70,45,150,0.55), rgba(18,10,48,0.15))',
            borderTop: '2px solid rgba(150,95,255,0.6)',
            boxShadow: '0 0 10px rgba(120,70,255,0.3)',
          }} />
        ))}
      </div>
      {/* synthwave perspective grid floor */}
      <div style={{
        position: 'absolute', left: '-50%', right: '-50%', bottom: '20%', height: '46%', zIndex: 0,
        backgroundImage:
          'linear-gradient(rgba(90,150,255,0.35) 1.5px, transparent 1.5px),' +
          'linear-gradient(90deg, rgba(190,90,255,0.28) 1.5px, transparent 1.5px)',
        backgroundSize: '46px 46px',
        transform: 'perspective(330px) rotateX(66deg)', transformOrigin: 'center bottom',
        maskImage: 'linear-gradient(to top, #000 8%, transparent 78%)',
        WebkitMaskImage: 'linear-gradient(to top, #000 8%, transparent 78%)',
        opacity: 0.75, pointerEvents: 'none',
      }} />

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
      }}>
        <button onClick={onOpenHowItWorks} className="rh-press" aria-label="How to play" style={{
          width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
          background: 'rgba(10,12,46,0.7)', border: '1.5px solid rgba(90,150,255,0.7)',
          color: '#cfe0ff', fontSize: '18px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 12px rgba(60,120,255,0.4)',
        }}>⚙️</button>

        <div onClick={onOpenSkins} style={{
          display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
          background: 'rgba(10,12,46,0.7)', border: '1.5px solid rgba(255,200,60,0.65)',
          borderRadius: '20px', padding: '4px 6px 4px 10px',
          boxShadow: '0 0 12px rgba(255,200,60,0.3)',
        }}>
          <span style={{ fontSize: '14px' }}>🪙</span>
          <span style={{ color: '#FFD24A', fontSize: '13px', fontWeight: 800, fontFamily: 'var(--ui-mono)' }}>
            {coinBalance.toLocaleString()}
          </span>
          <span style={{
            width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255,200,60,0.2)',
            border: '1px solid rgba(255,200,60,0.7)', color: '#FFD24A', fontSize: '13px', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
          }}>+</span>
        </div>

        <button onClick={() => { if (!isConnected) onConnect() }} className="rh-press" style={{
          display: 'flex', alignItems: 'center', gap: '5px', cursor: isConnected ? 'default' : 'pointer',
          background: 'rgba(10,12,46,0.7)',
          border: `1.5px solid ${isConnected ? 'rgba(0,230,140,0.7)' : 'rgba(90,150,255,0.7)'}`,
          borderRadius: '20px', padding: '5px 11px',
          color: isConnected ? '#00E68C' : '#9cc2ff', fontSize: '11px', fontWeight: 'bold',
          fontFamily: 'var(--ui-mono)', whiteSpace: 'nowrap',
          boxShadow: `0 0 12px ${isConnected ? 'rgba(0,230,140,0.3)' : 'rgba(60,120,255,0.3)'}`,
        }}>
          {isConnected ? `✅ ${address?.slice(0, 4)}…${address?.slice(-3)}` : '🔵 Connect'}
        </button>

        <button onClick={onOpenDaily} className="rh-press" aria-label="Daily reward" style={{
          position: 'relative', width: '38px', height: '38px', borderRadius: '12px', flexShrink: 0,
          background: 'rgba(10,12,46,0.7)', border: '1.5px solid rgba(255,90,200,0.7)',
          fontSize: '18px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 12px rgba(255,90,200,0.4)',
        }}>
          🎁
          {!hasCheckedInToday && (
            <span style={{
              position: 'absolute', top: '-4px', right: '-4px', width: '12px', height: '12px',
              borderRadius: '50%', background: '#FF2D55', boxShadow: '0 0 8px rgba(255,45,85,0.9)',
            }} />
          )}
        </button>
      </div>

      {/* ── LOGO ────────────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', lineHeight: 0.84, marginTop: '14px', zIndex: 2, animation: 'brLogoGlow 3.2s ease-in-out infinite' }}>
        <div style={{
          fontSize: 'clamp(46px, 15vw, 62px)', fontWeight: 900, fontStyle: 'italic', letterSpacing: '2px',
          background: 'linear-gradient(180deg,#9fe4ff 0%,#1f86ff 100%)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          textShadow: '0 0 22px rgba(40,150,255,0.45)',
        }}>BASE</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '-4px' }}>
          <span style={{
            fontSize: 'clamp(46px, 15vw, 62px)', fontWeight: 900, fontStyle: 'italic', letterSpacing: '2px',
            background: 'linear-gradient(180deg,#ff9ee0 0%,#ff2d9b 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            textShadow: '0 0 22px rgba(255,45,155,0.45)',
          }}>RUSH</span>
          <span style={{ fontSize: 'clamp(34px, 11vw, 46px)', filter: 'drop-shadow(0 0 10px rgba(255,200,40,0.8))' }}>⚡</span>
        </div>
      </div>

      {/* tagline */}
      <div style={{ textAlign: 'center', marginTop: '8px', zIndex: 2, fontSize: '12px', fontWeight: 800, letterSpacing: '1px' }}>
        <span style={{ color: '#22d3ff' }}>RUN. </span>
        <span style={{ color: '#ff4fb0' }}>JUMP. </span>
        <span style={{ color: '#ffcf3a' }}>RUSH. </span>
        <span style={{ color: '#eaf2ff' }}>REPEAT.</span>
      </div>

      {/* ── HERO: side hex menus + robot on the road ────────────────────── */}
      <div style={{ position: 'relative', zIndex: 2, flex: '0 0 auto', minHeight: '236px', marginTop: '6px' }}>
        {/* left menu */}
        <div style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          <HexButton icon={equippedSkin?.icon || '🤖'} label="SKINS" color="#2f7bff" onClick={onOpenSkins} />
          <HexButton icon="⚡" label="POWER-UPS" color="#ffb330" onClick={onOpenHowItWorks} />
          <HexButton icon="🏆" label="LEADERBOARD" color="#ffd24a" onClick={onOpenLeaderboard} />
        </div>

        {/* right menu */}
        <div style={{
          position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
          display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          <HexButton icon="🎯" label="BADGES" color="#ff5ac8" onClick={onShowAchievements}
            badge={achievementsUnlocked > 0 ? achievementsUnlocked : undefined} />
          <HexButton icon="📅" label="DAILY" color="#9b5cff" onClick={onOpenDaily}
            badge={hasCheckedInToday ? undefined : '!'} />
          <HexButton icon="📖" label="HOW TO PLAY" color="#22c3ff" onClick={onOpenHowItWorks} />
        </div>

        {/* robot mascot on a glowing pad */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%) scale(1.55)',
          transformOrigin: 'center',
        }}>
          <BaseyCanvas />
        </div>
        {/* floor glow under robot */}
        <div style={{
          position: 'absolute', left: '50%', bottom: '14px', transform: 'translateX(-50%)',
          width: '150px', height: '24px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(60,150,255,0.5), transparent 70%)', filter: 'blur(3px)',
        }} />
      </div>

      {/* ── PLAY ────────────────────────────────────────────────────────── */}
      <button
        onClick={onStart}
        className="rh-press"
        style={{
          position: 'relative', zIndex: 2, alignSelf: 'center', width: '100%', maxWidth: '380px',
          marginTop: '10px',
          background: 'linear-gradient(95deg, #ff7a2f 0%, #ff3d8b 60%, #ff2d9b 100%)',
          border: '1px solid rgba(255,210,150,0.5)', color: '#fff',
          padding: '16px 28px', borderRadius: '16px',
          fontSize: '24px', fontWeight: 900, letterSpacing: '4px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          animation: 'brPlayPulse 2.4s ease-in-out infinite',
        }}
      >
        PLAY <span style={{ fontSize: '20px' }}>▶</span>
      </button>

      {/* ── STAT CARDS ──────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '8px', marginTop: '12px', maxWidth: '420px', width: '100%', alignSelf: 'center' }}>
        <StatCard icon="🪙" label="COINS" value={coinBalance.toLocaleString()} color="#FFD24A" />
        <StatCard icon="🏆" label="BEST SCORE" value={personalBest > 0 ? personalBest.toLocaleString() : '—'} color="#22c3ff" />
        <StatCard icon="🔥" label="DAILY STREAK" value={`${streak}`} color="#ff8a3d" />
      </div>

      {/* ── REWARD CHEST BANNER ─────────────────────────────────────────── */}
      <button
        onClick={onOpenDaily}
        style={{
          position: 'relative', zIndex: 2, marginTop: '12px', width: '100%', maxWidth: '420px', alignSelf: 'center',
          display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', textAlign: 'left',
          background: hasCheckedInToday
            ? 'linear-gradient(95deg, rgba(40,30,90,0.7), rgba(20,16,52,0.7))'
            : 'linear-gradient(95deg, rgba(80,40,10,0.85), rgba(60,20,70,0.85))',
          border: `1.5px solid ${hasCheckedInToday ? 'rgba(120,100,200,0.5)' : 'rgba(255,180,40,0.8)'}`,
          borderRadius: '14px', padding: '10px 12px',
          animation: hasCheckedInToday ? 'none' : 'brChestGlow 2s ease-in-out infinite',
        }}
      >
        <span style={{ fontSize: '30px', flexShrink: 0, filter: 'drop-shadow(0 0 8px rgba(255,190,60,0.7))' }}>
          {hasCheckedInToday ? '✅' : '🎁'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: hasCheckedInToday ? '#b7c4e6' : '#ffd24a', fontSize: '13px', fontWeight: 900, letterSpacing: '0.5px',
          }}>
            {hasCheckedInToday ? 'CLAIMED TODAY ✓' : 'CLAIM YOUR REWARD!'}
          </div>
          <div style={{ color: hasCheckedInToday ? '#7e8cb5' : '#ffe7a8', fontSize: '11px', fontWeight: 700 }}>
            {hasCheckedInToday
              ? `🔥 ${streak}-day streak · ${Math.min(streak, STREAK_TARGET)}/${STREAK_TARGET} to box`
              : 'FREE daily chest + coins'}
          </div>
        </div>
        {!hasCheckedInToday && (
          <span style={{
            flexShrink: 0, background: 'linear-gradient(180deg,#ffd24a,#ff9e1b)', color: '#3a1d00',
            fontSize: '13px', fontWeight: 900, letterSpacing: '1px', padding: '8px 16px', borderRadius: '10px',
            boxShadow: '0 0 14px rgba(255,180,40,0.5)',
          }}>CLAIM</span>
        )}
      </button>

      {/* ── BOTTOM NAV ──────────────────────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 2, marginTop: 'auto', paddingTop: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        borderTop: '1px solid rgba(90,120,220,0.25)',
      }}>
        <NavItem icon="🤖" label="HOME" color="#2f9bff" active onClick={() => {}} />
        <NavItem icon="🏃" label="PLAY" color="#ff4fb0" onClick={onStart} />
        <NavItem icon="🎁" label="REWARDS" color="#ffd24a" onClick={onOpenDaily} />
        <NavItem icon="🏆" label="RANKS" color="#22c3ff" onClick={onOpenLeaderboard} />
      </div>
    </div>
  )
}
