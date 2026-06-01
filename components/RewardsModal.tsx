'use client'
import { useState } from 'react'
import { STREAK_TARGET_DAYS } from '../hooks/useDailyStreak'
import { SKINS, type Skin, type SkinRarity } from '../hooks/useSkins'
import { type BoxReward, RARITY_COLOR as BOX_RARITY_COLOR } from '../lib/mysteryBox'

type Tab = 'daily' | 'skins' | 'how'

const RARITY_COLOR: Record<SkinRarity, string> = {
  common: '#88AACC',
  rare: '#00C8FF',
  epic: '#FF44AA',
  legendary: '#FFD700',
}

type DailyProps = {
  streak: number
  totalCheckIns: number
  hasCheckedInToday: boolean
  isStreakBroken: boolean
  isPending: boolean
  txError: string | null
  txHash: `0x${string}` | undefined
  lastHash: string | null
  needsWallet: boolean
  dailyCoins: number
  boxOpened: boolean
  boxReward: BoxReward | null
  verifying: boolean
  verifyError: string | null
  onCheckIn: () => void
  onOpenBox: () => void
  onConnectWallet: () => void
  onResetTx: () => void
}

type SkinsProps = {
  balance: number
  owned: string[]
  equipped: string
  streak: number
  onClaim: (skin: Skin) => void
  onEquip: (id: string) => void
}

type Props = {
  initialTab?: Tab
  daily: DailyProps
  skinsProps: SkinsProps
  onClose: () => void
}

export function RewardsModal({ initialTab = 'daily', daily, skinsProps, onClose }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9500,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '12px',
        fontFamily: 'var(--ui-font)',
      }}
    >
      <style>{`
        @keyframes rewardModalIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes flameFlicker {
          0%, 100% { transform: scale(1) rotate(-2deg); filter: drop-shadow(0 0 20px #FF6600); }
          50%      { transform: scale(1.08) rotate(2deg); filter: drop-shadow(0 0 30px #FFAA00); }
        }
        @keyframes checkInPulse {
          0%, 100% { box-shadow: 0 0 25px rgba(0,200,80,0.6), 0 4px 24px rgba(0,0,0,0.4); transform: scale(1); }
          50%      { box-shadow: 0 0 40px rgba(0,200,80,1),   0 4px 24px rgba(0,0,0,0.4); transform: scale(1.02); }
        }
        @keyframes shimmerBg { 0% { background-position: -100% 0; } 100% { background-position: 200% 0; } }
        @keyframes todayGlow {
          0%, 100% { box-shadow: 0 0 14px #FF6600; }
          50%      { box-shadow: 0 0 24px #FFAA00; }
        }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, #001233 0%, #000510 100%)',
          border: '2px solid #0052FF',
          borderRadius: '20px',
          maxWidth: '420px', width: '100%',
          maxHeight: '94vh', overflowY: 'auto',
          boxShadow: '0 0 60px rgba(0,82,255,0.5)',
          animation: 'rewardModalIn 0.25s ease-out',
        }}
      >
        {/* HEADER + TABS */}
        <div style={{
          padding: '16px 18px 0', borderBottom: '1px solid rgba(0,82,255,0.25)',
          position: 'sticky', top: 0, zIndex: 5,
          background: 'linear-gradient(180deg, #001233 0%, rgba(0,8,32,0.96) 100%)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ color: '#FFD700', fontSize: '10px', letterSpacing: '3px', fontWeight: 'bold' }}>
              🎁 REWARDS HUB
            </div>
            <button onClick={onClose} style={{
              background: 'transparent', border: 'none', color: '#556677',
              fontSize: '20px', cursor: 'pointer', padding: '4px 8px',
            }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { id: 'daily', label: '🔥 Daily', t: 'daily' as Tab },
              { id: 'skins', label: '🎭 Skins', t: 'skins' as Tab },
              { id: 'how', label: '📖 How', t: 'how' as Tab },
            ].map(b => (
              <button
                key={b.id}
                onClick={() => setTab(b.t)}
                style={{
                  flex: 1, padding: '10px 8px',
                  background: tab === b.t
                    ? 'linear-gradient(180deg, rgba(0,82,255,0.3) 0%, rgba(0,82,255,0.1) 100%)'
                    : 'transparent',
                  border: 'none', borderBottom: `2px solid ${tab === b.t ? '#0088FF' : 'transparent'}`,
                  color: tab === b.t ? '#fff' : '#667788',
                  fontWeight: 'bold', fontSize: '12px', letterSpacing: '1.5px',
                  cursor: 'pointer',
                }}
              >{b.label}</button>
            ))}
          </div>
        </div>

        {/* TAB CONTENT */}
        <div style={{ padding: '18px' }}>
          {tab === 'daily' && <DailyTab {...daily} />}
          {tab === 'skins' && <SkinsTab {...skinsProps} />}
          {tab === 'how' && <HowTab />}
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// DAILY TAB
// ────────────────────────────────────────────────────────────────────────
function DailyTab(p: DailyProps) {
  const reachedTarget = p.streak >= STREAK_TARGET_DAYS

  return (
    <>
      {/* Big streak counter */}
      <div style={{
        background: 'radial-gradient(ellipse at center, rgba(255,140,0,0.18) 0%, transparent 70%)',
        textAlign: 'center', padding: '14px 0 18px',
        marginBottom: '14px',
        border: '1px solid rgba(255,140,0,0.3)',
        borderRadius: '14px',
      }}>
        <div style={{ fontSize: '50px', animation: 'flameFlicker 1.4s ease-in-out infinite', lineHeight: 1 }}>
          🔥
        </div>
        <div style={{
          fontSize: '60px', fontWeight: 900, color: '#fff',
          textShadow: '0 0 30px rgba(255,140,0,0.6)', lineHeight: 1, margin: '4px 0',
        }}>
          {p.streak}
        </div>
        <div style={{ fontSize: '11px', color: '#FFAA66', letterSpacing: '3px', fontWeight: 'bold' }}>
          {p.streak === 1 ? 'DAY STREAK' : 'DAY STREAK'}
        </div>
      </div>

      {/* CHECK-IN ACTION BLOCK */}
      {p.needsWallet ? (
        <button onClick={p.onConnectWallet} style={btnStyle('#0052FF', '#0088FF')}>
          🔵 Connect Wallet to Start Streak
        </button>
      ) : p.hasCheckedInToday ? (
        <div style={{
          background: 'rgba(0,200,80,0.12)', border: '1px solid rgba(0,200,80,0.4)',
          borderRadius: '12px', padding: '14px', textAlign: 'center',
        }}>
          <div style={{ color: '#00C853', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
            ✅ Checked in today
          </div>
          <div style={{ color: '#88BB99', fontSize: '10px', letterSpacing: '1px' }}>
            Come back tomorrow to keep your streak!
          </div>
          {(p.txHash || p.lastHash) && (
            <a
              href={`https://basescan.org/tx/${p.txHash || p.lastHash}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-block', marginTop: '8px',
                color: '#4488FF', fontSize: '10px', textDecoration: 'underline',
              }}
            >View tx on BaseScan ↗</a>
          )}
        </div>
      ) : p.isPending ? (
        <div style={{
          background: 'rgba(0,82,255,0.12)', border: '1px solid rgba(0,82,255,0.4)',
          borderRadius: '12px', padding: '14px', textAlign: 'center',
        }}>
          <div style={{
            width: '32px', height: '32px',
            border: '3px solid #0044FF', borderTopColor: '#fff',
            borderRadius: '50%', margin: '0 auto 10px',
            animation: 'spin 0.9s linear infinite',
          }} />
          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>
            Confirming on Base...
          </div>
        </div>
      ) : p.txError ? (
        <div style={{
          background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.4)',
          borderRadius: '12px', padding: '12px', textAlign: 'center',
        }}>
          <div style={{ color: '#FF6666', fontSize: '12px', marginBottom: '8px' }}>
            ❌ {p.txError.slice(0, 80)}
          </div>
          <button onClick={p.onResetTx} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', padding: '6px 14px', borderRadius: '8px',
            fontSize: '11px', cursor: 'pointer',
          }}>Try Again</button>
        </div>
      ) : (
        <button
          onClick={p.onCheckIn}
          style={{
            ...btnStyle('#00C853', '#00E676'),
            animation: 'checkInPulse 1.6s ease-in-out infinite',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
          }}
        >
          <span style={{ fontSize: '15px', letterSpacing: '3px' }}>
            ⚡ CHECK IN · EARN +{p.dailyCoins} 🪙
          </span>
          <span style={{ fontSize: '9px', letterSpacing: '2px', opacity: 0.8 }}>
            ~$0.0001 GAS · KEEPS YOUR STREAK
          </span>
        </button>
      )}

      {p.isStreakBroken && !p.hasCheckedInToday && (
        <div style={{
          marginTop: '10px', padding: '8px 12px',
          background: 'rgba(255,80,0,0.1)', border: '1px solid rgba(255,80,0,0.3)',
          borderRadius: '8px', color: '#FFAA66', fontSize: '10px', textAlign: 'center',
        }}>
          ⚠️ Streak broken — check in to restart from Day 1
        </div>
      )}

      {/* 25-day calendar */}
      <div style={{ marginTop: '20px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '8px',
        }}>
          <div style={{ color: '#88BBFF', fontSize: '11px', letterSpacing: '2px', fontWeight: 'bold' }}>
            📅 25-DAY CALENDAR
          </div>
          <div style={{ color: '#556677', fontSize: '10px' }}>
            {p.streak} / {STREAK_TARGET_DAYS}
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px',
          marginBottom: '14px',
        }}>
          {[...Array(STREAK_TARGET_DAYS)].map((_, i) => {
            const day = i + 1
            const isDone = day <= p.streak
            const isToday = day === p.streak + 1 && !p.hasCheckedInToday
            const isFinal = day === STREAK_TARGET_DAYS

            const bg = isDone
              ? (isFinal ? 'linear-gradient(135deg, #FFD700 0%, #FF6B00 100%)' : 'linear-gradient(135deg, #00C853 0%, #00E676 100%)')
              : isToday ? 'linear-gradient(135deg, #FF6600 0%, #FFAA00 100%)'
              : isFinal ? 'rgba(255,215,0,0.06)'
              : 'rgba(255,255,255,0.04)'
            const border = isDone ? 'transparent'
              : isToday ? '#FF8800'
              : isFinal ? 'rgba(255,215,0,0.35)'
              : 'rgba(255,255,255,0.07)'
            const color = isDone || isToday ? '#fff' : isFinal ? '#FFD700' : '#445566'

            return (
              <div
                key={day}
                style={{
                  aspectRatio: '1',
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: '8px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  color, fontSize: '11px', fontWeight: 'bold',
                  animation: isToday ? 'todayGlow 1.4s ease-in-out infinite' : undefined,
                  position: 'relative',
                }}
              >
                {isFinal && (
                  <div style={{ fontSize: '14px', marginBottom: '-2px' }}>🏆</div>
                )}
                <div style={{ fontSize: isFinal ? '11px' : '13px', fontWeight: 800 }}>{day}</div>
                {isDone && !isFinal && (
                  <div style={{ fontSize: '8px', marginTop: '-1px' }}>✓</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Day 25 Mystery Box */}
      <div style={{
        background: reachedTarget
          ? 'linear-gradient(135deg, #3a1d6e 0%, #6b1fa8 50%, #3a1d6e 100%)'
          : 'linear-gradient(135deg, #15102e 0%, #0c0820 100%)',
        backgroundSize: '200% auto',
        border: `2px solid ${reachedTarget ? '#B043FF' : 'rgba(176,67,255,0.3)'}`,
        borderRadius: '14px',
        padding: '16px 14px',
        textAlign: 'center',
        animation: reachedTarget ? 'shimmerBg 3s linear infinite' : undefined,
        boxShadow: reachedTarget ? '0 0 30px rgba(176,67,255,0.5)' : 'none',
      }}>
        {p.boxOpened && p.boxReward ? (
          // ── REVEALED REWARD ──
          <div style={{ animation: 'rewardModalIn 0.4s ease-out' }}>
            <div style={{
              fontSize: '10px', letterSpacing: '2px', fontWeight: 700,
              color: BOX_RARITY_COLOR[p.boxReward.rarity], marginBottom: '6px',
            }}>
              🎉 YOU WON · {p.boxReward.rarity.toUpperCase()}
            </div>
            <div style={{
              fontSize: '54px', lineHeight: 1, margin: '4px 0',
              filter: `drop-shadow(0 0 16px ${BOX_RARITY_COLOR[p.boxReward.rarity]})`,
              animation: 'flameFlicker 1.6s ease-in-out infinite',
            }}>{p.boxReward.icon}</div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: '18px' }}>
              {p.boxReward.label}
            </div>
            <div style={{ color: '#C2D2E6', fontSize: '11px', marginTop: '3px' }}>
              {p.boxReward.desc}
            </div>
            <div style={{
              marginTop: '10px', padding: '6px',
              background: 'rgba(0,200,80,0.15)', border: '1px solid rgba(0,200,80,0.4)',
              borderRadius: '8px', color: '#00FF88', fontSize: '10px', fontWeight: 700,
            }}>
              ✅ Added to your account
            </div>
          </div>
        ) : (
          // ── UNOPENED BOX ──
          <>
            <div style={{
              fontSize: '40px', marginBottom: '4px',
              animation: reachedTarget ? 'achIconBounce 1.4s ease-in-out infinite' : undefined,
              filter: reachedTarget ? 'drop-shadow(0 0 14px #B043FF)' : 'grayscale(0.4)',
            }}>🎁</div>
            <div style={{ color: '#E6D4FF', fontWeight: 900, fontSize: '15px', letterSpacing: '2px' }}>
              DAY {STREAK_TARGET_DAYS} MYSTERY BOX
            </div>
            <div style={{ color: '#B98CFF', fontSize: '11px', marginTop: '4px', lineHeight: 1.4 }}>
              Reach a {STREAK_TARGET_DAYS}-day streak to open it.<br/>
              Win coins, an exclusive skin, a score boost or a legend badge!
            </div>
            {reachedTarget && (
              <>
                <button
                  onClick={p.onOpenBox}
                  disabled={p.verifying}
                  style={{
                    marginTop: '12px', width: '100%',
                    background: 'linear-gradient(135deg, #B043FF, #6b1fa8)',
                    color: '#fff', border: '2px solid #D9A9FF', borderRadius: '10px',
                    padding: '11px', fontWeight: 'bold', fontSize: '13px',
                    letterSpacing: '2px', cursor: p.verifying ? 'default' : 'pointer',
                    opacity: p.verifying ? 0.7 : 1,
                    boxShadow: '0 0 18px rgba(176,67,255,0.5)',
                  }}
                >{p.verifying ? '⏳ VERIFYING ON-CHAIN…' : '🎁 OPEN MYSTERY BOX'}</button>
                <div style={{ color: '#B98CFF', fontSize: '9px', marginTop: '6px', opacity: 0.85 }}>
                  Verified against your on-chain check-ins (anti-cheat)
                </div>
                {p.verifyError && (
                  <div style={{
                    marginTop: '8px', padding: '7px 9px',
                    background: 'rgba(180,0,0,0.85)', borderRadius: '8px',
                    color: '#fff', fontSize: '10px', fontWeight: 600, lineHeight: 1.35,
                  }}>
                    ⚠️ {p.verifyError}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <div style={{
        marginTop: '12px', color: '#556677', fontSize: '9px',
        textAlign: 'center', letterSpacing: '1px',
      }}>
        Total check-ins: {p.totalCheckIns} · On-chain tx on Base
      </div>
    </>
  )
}

// ────────────────────────────────────────────────────────────────────────
// SKINS TAB
// ────────────────────────────────────────────────────────────────────────
function SkinsTab(p: SkinsProps) {
  return (
    <>
      {/* Coin balance */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,140,0,0.05))',
        border: '1px solid rgba(255,215,0,0.4)',
        borderRadius: '12px',
        padding: '12px 16px', marginBottom: '14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ color: '#FFD700', fontSize: '11px', letterSpacing: '2px', fontWeight: 'bold' }}>
          🪙 YOUR COINS
        </div>
        <div style={{ color: '#fff', fontSize: '22px', fontWeight: 900 }}>
          {p.balance.toLocaleString()}
        </div>
      </div>

      <div style={{
        color: '#88AACC', fontSize: '10px', textAlign: 'center', marginBottom: '14px',
      }}>
        Earn coins by collecting them during runs · 1 in-game coin = 1 wallet coin
      </div>

      {/* Skin grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
      }}>
        {SKINS.map(s => {
          const owned = p.owned.includes(s.id)
          const isEquipped = p.equipped === s.id
          const isBoxOnly = s.unlock === 'box'
          const isLocked = (s.unlock === 'streak25' || isBoxOnly) && !owned
          const canAfford = p.balance >= s.price
          const meetsStreak = s.unlock !== 'streak25' || p.streak >= STREAK_TARGET_DAYS
          const color = RARITY_COLOR[s.rarity]

          let actionLabel = ''
          let actionStyle: React.CSSProperties = {}
          let actionDisabled = false
          let onClick: (() => void) | undefined

          if (isEquipped) {
            actionLabel = '✓ EQUIPPED'
            actionStyle = { background: 'rgba(0,200,80,0.2)', color: '#00FF88', border: '1px solid #00C853' }
            actionDisabled = true
          } else if (owned) {
            actionLabel = 'EQUIP'
            actionStyle = { background: '#0052FF', color: '#fff' }
            onClick = () => p.onEquip(s.id)
          } else if (isBoxOnly) {
            actionLabel = '🎁 Box only'
            actionStyle = { background: 'rgba(176,67,255,0.12)', color: '#B98CFF', border: '1px solid rgba(176,67,255,0.35)' }
            actionDisabled = true
          } else if (s.unlock === 'streak25') {
            if (meetsStreak) {
              actionLabel = '🐉 CLAIM'
              actionStyle = { background: '#FF3300', color: '#fff' }
              onClick = () => p.onClaim(s)
            } else {
              actionLabel = `🔒 Day ${STREAK_TARGET_DAYS}`
              actionStyle = { background: 'rgba(255,255,255,0.05)', color: '#556677', border: '1px solid rgba(255,255,255,0.1)' }
              actionDisabled = true
            }
          } else if (canAfford) {
            actionLabel = `🪙 ${s.price}`
            actionStyle = { background: 'linear-gradient(135deg, #FFAA00, #FFD700)', color: '#000' }
            onClick = () => p.onClaim(s)
          } else {
            actionLabel = `🪙 ${s.price}`
            actionStyle = { background: 'rgba(255,255,255,0.05)', color: '#667788', border: '1px solid rgba(255,255,255,0.1)' }
            actionDisabled = true
          }

          return (
            <div key={s.id} style={{
              background: isLocked && !meetsStreak ? 'rgba(255,255,255,0.02)' : `linear-gradient(135deg, ${color}15, ${color}05)`,
              border: `2px solid ${isEquipped ? '#00C853' : owned ? color + '80' : color + '40'}`,
              borderRadius: '12px',
              padding: '12px 10px',
              textAlign: 'center',
              opacity: isLocked || (!owned && !canAfford && !isBoxOnly && s.unlock !== 'streak25') ? 0.65 : 1,
              position: 'relative',
            }}>
              {isEquipped && (
                <div style={{
                  position: 'absolute', top: '-8px', right: '-6px',
                  background: '#00C853', color: '#000',
                  fontSize: '8px', fontWeight: 'bold', letterSpacing: '1px',
                  padding: '2px 7px', borderRadius: '8px',
                }}>EQUIPPED</div>
              )}
              <div style={{
                fontSize: '40px', lineHeight: 1, marginBottom: '6px',
                filter: !owned && isLocked ? 'grayscale(80%) brightness(0.5)' : `drop-shadow(0 0 12px ${color})`,
              }}>
                {!owned && isLocked && !meetsStreak ? '🔒' : s.icon}
              </div>
              <div style={{
                color: '#fff', fontSize: '12px', fontWeight: 'bold', lineHeight: 1.1,
                marginBottom: '2px',
              }}>{s.name}</div>
              <div style={{
                color: '#778899', fontSize: '9px', lineHeight: 1.2,
                marginBottom: '4px', minHeight: '22px',
              }}>{s.desc}</div>
              <div style={{
                color, fontSize: '8px', fontWeight: 800, letterSpacing: '1.5px',
                marginBottom: '8px',
              }}>{s.rarity.toUpperCase()}</div>
              <button
                onClick={onClick}
                disabled={actionDisabled}
                style={{
                  width: '100%', padding: '8px 4px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 'bold', fontSize: '11px',
                  cursor: actionDisabled ? 'default' : 'pointer',
                  letterSpacing: '1px',
                  ...actionStyle,
                }}
              >{actionLabel}</button>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ────────────────────────────────────────────────────────────────────────
// HOW IT WORKS TAB
// ────────────────────────────────────────────────────────────────────────
function HowTab() {
  const steps = [
    {
      n: 1, icon: '🔥', accent: '#FF8A00', title: 'Check in daily',
      body: <>One tap on <b style={{ color: '#FF8A00' }}>Check In</b> each day keeps your streak alive. Miss a day and it resets to&nbsp;1.</>,
    },
    {
      n: 2, icon: '🎁', accent: '#B043FF', title: `Reach Day ${STREAK_TARGET_DAYS}`,
      body: <>A full <b style={{ color: '#B98CFF' }}>{STREAK_TARGET_DAYS}-day streak</b> unlocks the <b style={{ color: '#B98CFF' }}>Mystery Box</b> — open it for coins, an exclusive skin, a score boost or a legend badge!</>,
    },
    {
      n: 3, icon: '🪙', accent: '#00D8A0', title: 'Earn coins in runs',
      body: <>Every coin you grab while playing lands in your <b style={{ color: '#00D8A0' }}>wallet balance</b>. Bigger combos pay more.</>,
    },
    {
      n: 4, icon: '🎭', accent: '#FF44AA', title: 'Spend on skins',
      body: <>Trade coins for new looks in <b style={{ color: '#FF44AA' }}>Skins</b>. The <b style={{ color: '#FF3300' }}>🐉 Dragon</b> skin is free at Day {STREAK_TARGET_DAYS}.</>,
    },
  ]

  return (
    <div>
      {/* Numbered steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {steps.map((s) => (
          <div key={s.n} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '11px 12px',
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px',
          }}>
            {/* Number badge */}
            <div style={{
              width: '30px', height: '30px', flexShrink: 0,
              borderRadius: '9px',
              background: `${s.accent}1a`,
              border: `1px solid ${s.accent}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: s.accent, fontWeight: 700, fontSize: '14px',
            }}>{s.n}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: '#fff', fontSize: '13.5px', fontWeight: 700,
                marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <span>{s.icon}</span>{s.title}
              </div>
              <div style={{ color: '#C2D2E6', fontSize: '11.5px', lineHeight: 1.45 }}>
                {s.body}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── HERO: WHY BASE? ─────────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        borderRadius: '16px',
        padding: '2px',
        background: 'linear-gradient(135deg, #0052FF, #00D8FF, #0052FF)',
        backgroundSize: '200% 200%',
        animation: 'shimmerBg 4s linear infinite',
        boxShadow: '0 0 30px rgba(0,82,255,0.35)',
      }}>
        <div style={{
          background: 'linear-gradient(180deg, #001a4d 0%, #000a1f 100%)',
          borderRadius: '14px',
          padding: '18px 16px',
          overflow: 'hidden', position: 'relative',
        }}>
          {/* Base logo mark */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px',
          }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: '#0052FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 18px rgba(0,82,255,0.8)', flexShrink: 0,
            }}>
              <div style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#fff' }} />
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: '15px', fontWeight: 700, lineHeight: 1 }}>
                Every check-in is real
              </div>
              <div style={{ color: '#5C9DFF', fontSize: '10px', letterSpacing: '2px', fontWeight: 600, marginTop: '3px' }}>
                ON-CHAIN · BUILT ON BASE
              </div>
            </div>
          </div>

          <p style={{
            color: '#D5E3F7', fontSize: '12px', lineHeight: 1.55, margin: '0 0 14px',
          }}>
            Your daily check-in isn&apos;t a fake counter — it&apos;s a genuine transaction
            recorded forever on Base. That makes your streak <b style={{ color: '#fff' }}>provable</b>,
            and it powers something bigger 👇
          </p>

          {/* WTU highlight */}
          <div style={{
            display: 'flex', gap: '10px', alignItems: 'center',
            background: 'rgba(0,82,255,0.18)',
            border: '1px solid rgba(0,136,255,0.4)',
            borderRadius: '11px', padding: '11px 12px', marginBottom: '10px',
          }}>
            <div style={{ fontSize: '26px', lineHeight: 1 }}>📈</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#5CC8FF', fontSize: '15px', fontWeight: 700, lineHeight: 1.1 }}>
                You boost our WTU rank
              </div>
              <div style={{ color: '#A8C5E8', fontSize: '10.5px', lineHeight: 1.4, marginTop: '3px' }}>
                Base ranks apps by <b style={{ color: '#fff' }}>Weekly Transacting Users</b>.
                Every player who checks in pushes Base Rush up the charts.
              </div>
            </div>
          </div>

          {/* Trust row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={trustChip}>
              <span style={{ fontSize: '14px' }}>💸</span>
              <span>~$0.0001 gas<br /><span style={{ color: '#7A93B0' }}>basically free</span></span>
            </div>
            <div style={trustChip}>
              <span style={{ fontSize: '14px' }}>🔍</span>
              <span>Verifiable<br /><span style={{ color: '#7A93B0' }}>on BaseScan</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const trustChip: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px', padding: '9px 10px',
  color: '#D5E3F7', fontSize: '10.5px', fontWeight: 600, lineHeight: 1.3,
}

function btnStyle(c1: string, c2: string): React.CSSProperties {
  return {
    width: '100%', padding: '14px',
    background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
    border: 'none', borderRadius: '12px',
    color: '#fff', fontWeight: 'bold',
    fontSize: '13px', letterSpacing: '2px',
    cursor: 'pointer',
    boxShadow: `0 4px 18px ${c1}66`,
  }
}
