'use client'

type Props = {
  onStart: () => void
}

export function StartScreen({ onStart }: Props) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '20px', padding: '40px',
      background: 'rgba(0,0,30,0.95)',
      border: '2px solid #0044FF', borderRadius: '16px',
      maxWidth: '400px', width: '90%', textAlign: 'center'
    }}>
      <div style={{ fontSize: '48px' }}>⚡</div>
      <div>
        <h1 style={{
          color: '#FFFFFF', fontSize: '28px', fontWeight: 'bold',
          margin: '0 0 8px 0', letterSpacing: '4px'
        }}>
          BASE RUSH
        </h1>
        <p style={{ color: '#6688AA', fontSize: '13px', margin: 0 }}>
          Dodge obstacles, collect coins, use power-ups!
        </p>
      </div>

      <div style={{
        background: 'rgba(0,68,255,0.1)', border: '1px solid #0044FF',
        borderRadius: '10px', padding: '14px 18px',
        textAlign: 'left', width: '100%'
      }}>
        <p style={{ color: '#00CCFF', fontSize: '12px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
          HOW TO PLAY
        </p>
        <p style={{ color: '#AACCFF', fontSize: '11px', margin: '4px 0' }}>🎮 Jump = SPACE / UP / Tap</p>
        <p style={{ color: '#AACCFF', fontSize: '11px', margin: '4px 0' }}>🦆 Slide = DOWN / Swipe down</p>
        <p style={{ color: '#AACCFF', fontSize: '11px', margin: '4px 0' }}>🔥 Combo = Collect coins without missing</p>
        <p style={{ color: '#AACCFF', fontSize: '11px', margin: '4px 0' }}>🎁 Power-ups = Shield, Magnet, Slow-mo, 2x</p>
      </div>

      <button
        onClick={onStart}
        style={{
          background: 'linear-gradient(135deg, #0052FF 0%, #0088FF 100%)',
          border: 'none', color: '#FFFFFF',
          padding: '18px 40px', borderRadius: '12px',
          cursor: 'pointer', fontSize: '18px', fontWeight: 'bold',
          width: '100%', boxShadow: '0 4px 20px rgba(0,82,255,0.4)'
        }}>
        ▶️ PLAY NOW
      </button>

      <p style={{ color: '#445566', fontSize: '10px', margin: 0 }}>
        No wallet needed • Connect later to save scores
      </p>
    </div>
  )
}
