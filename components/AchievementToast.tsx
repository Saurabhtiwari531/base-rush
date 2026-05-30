'use client'
import { useEffect } from 'react'
import type { Achievement } from '../hooks/useAchievements'

const RARITY = {
  common:    { color: '#88AACC', label: 'COMMON',    glow: 'rgba(136,170,204,0.5)' },
  rare:      { color: '#00C8FF', label: 'RARE',      glow: 'rgba(0,200,255,0.6)'  },
  epic:      { color: '#FF00AA', label: 'EPIC',      glow: 'rgba(255,0,170,0.6)'  },
  legendary: { color: '#FFD700', label: 'LEGENDARY', glow: 'rgba(255,215,0,0.7)'  },
}

type Props = {
  achievement: Achievement | null
  onDismiss: () => void
}

export function AchievementToast({ achievement, onDismiss }: Props) {
  useEffect(() => {
    if (!achievement) return
    const t = setTimeout(onDismiss, 3500)
    return () => clearTimeout(t)
  }, [achievement, onDismiss])

  if (!achievement) return null
  const r = RARITY[achievement.rarity]

  return (
    <>
      <style>{`
        @keyframes achSlide {
          0%   { transform: translate(-50%, -120%); opacity: 0; }
          12%  { transform: translate(-50%, 0); opacity: 1; }
          88%  { transform: translate(-50%, 0); opacity: 1; }
          100% { transform: translate(-50%, -120%); opacity: 0; }
        }
        @keyframes achPulse {
          0%, 100% { box-shadow: 0 0 22px ${r.glow}, 0 8px 32px rgba(0,0,0,0.6); }
          50%      { box-shadow: 0 0 36px ${r.color}, 0 8px 32px rgba(0,0,0,0.6); }
        }
        @keyframes achIconBounce {
          0%, 100% { transform: scale(1) rotate(0); }
          25%      { transform: scale(1.15) rotate(-8deg); }
          50%      { transform: scale(1.05) rotate(0); }
          75%      { transform: scale(1.15) rotate(8deg); }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        top: '60px',
        left: '50%',
        zIndex: 9999,
        animation: 'achSlide 3.5s ease-in-out both, achPulse 1.6s ease-in-out infinite',
        background: 'linear-gradient(135deg, rgba(0,8,32,0.98) 0%, rgba(0,4,18,0.99) 100%)',
        border: `2px solid ${r.color}`,
        borderRadius: '14px',
        padding: '12px 18px',
        minWidth: '280px', maxWidth: '340px',
        display: 'flex', alignItems: 'center', gap: '14px',
        pointerEvents: 'none',
      }}>
        <div style={{
          fontSize: '38px',
          flexShrink: 0,
          filter: `drop-shadow(0 0 10px ${r.color})`,
          animation: 'achIconBounce 1.6s ease-in-out infinite',
        }}>
          {achievement.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: r.color, fontSize: '9px', fontWeight: 800, letterSpacing: '2px',
            marginBottom: '2px',
          }}>
            🎉 ACHIEVEMENT · {r.label}
          </div>
          <div style={{ color: '#fff', fontSize: '16px', fontWeight: 800, lineHeight: 1.15 }}>
            {achievement.name}
          </div>
          <div style={{ color: '#99AACC', fontSize: '11px', marginTop: '3px', lineHeight: 1.25 }}>
            {achievement.desc}
          </div>
        </div>
      </div>
    </>
  )
}
