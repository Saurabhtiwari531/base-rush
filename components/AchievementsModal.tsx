'use client'
import { ACHIEVEMENTS, type Rarity } from '../hooks/useAchievements'

const RARITY_COLOR: Record<Rarity, string> = {
  common: '#88AACC',
  rare: '#00C8FF',
  epic: '#FF00AA',
  legendary: '#FFD700',
}

type Props = {
  unlocked: Set<string>
  onClose: () => void
}

export function AchievementsModal({ unlocked, onClose }: Props) {
  const total = ACHIEVEMENTS.length
  const done = ACHIEVEMENTS.filter(a => unlocked.has(a.id)).length
  const pct = Math.round((done / total) * 100)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, rgba(0,8,32,0.98) 0%, rgba(0,4,16,0.99) 100%)',
          border: '2px solid #0052FF',
          borderRadius: '18px',
          padding: '20px',
          maxWidth: '400px', width: '100%',
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 0 50px rgba(0,82,255,0.4)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <div style={{
            color: '#FFD700', fontSize: '12px', fontWeight: 700,
            letterSpacing: '3px', marginBottom: '4px',
          }}>
            🏆 ACHIEVEMENTS
          </div>
          <div style={{
            color: '#fff', fontSize: '26px', fontWeight: 900,
          }}>
            {done} <span style={{ color: '#556677', fontSize: '20px' }}>/ {total}</span>
          </div>
          {/* Progress bar */}
          <div style={{
            width: '100%', height: '6px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '3px', marginTop: '10px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: 'linear-gradient(90deg, #0088FF, #FFD700)',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '8px', marginTop: '12px',
        }}>
          {ACHIEVEMENTS.map(a => {
            const isUnlocked = unlocked.has(a.id)
            const color = RARITY_COLOR[a.rarity]
            return (
              <div key={a.id} style={{
                background: isUnlocked
                  ? `linear-gradient(135deg, ${color}15, ${color}05)`
                  : 'rgba(255,255,255,0.025)',
                border: `1px solid ${isUnlocked ? color + '60' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '10px',
                padding: '10px 8px',
                textAlign: 'center',
                opacity: isUnlocked ? 1 : 0.45,
                filter: isUnlocked ? 'none' : 'grayscale(80%)',
              }}>
                <div style={{
                  fontSize: '28px', lineHeight: 1, marginBottom: '6px',
                  filter: isUnlocked ? `drop-shadow(0 0 8px ${color})` : 'none',
                }}>
                  {isUnlocked ? a.icon : '🔒'}
                </div>
                <div style={{
                  color: isUnlocked ? '#fff' : '#667788',
                  fontSize: '11px', fontWeight: 700, lineHeight: 1.2,
                }}>
                  {a.name}
                </div>
                <div style={{
                  color: '#667788', fontSize: '9px', marginTop: '3px', lineHeight: 1.25,
                  minHeight: '24px',
                }}>
                  {a.desc}
                </div>
                <div style={{
                  color, fontSize: '7px', fontWeight: 800,
                  letterSpacing: '1.5px', marginTop: '4px',
                }}>
                  {a.rarity.toUpperCase()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: '16px',
            background: 'rgba(0,82,255,0.15)',
            border: '1px solid rgba(0,82,255,0.4)',
            color: '#88BBFF', padding: '10px',
            borderRadius: '10px', fontSize: '12px',
            fontWeight: 700, letterSpacing: '2px',
            cursor: 'pointer',
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  )
}
