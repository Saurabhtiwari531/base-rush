'use client'

// Base Rush is a Base App exclusive: regular browsers see this screen instead
// of the game, steering players into the Base App (only in-app plays count
// toward Base's WTU leaderboard).

// Deeplink that opens Base Rush inside the Base App (format confirmed from
// Base's own dashboard QR: base.app/app/ + encoded app URL)
const DEEPLINK = 'https://base.app/app/' + encodeURIComponent('https://www.baserush.fun')

// True when running inside the Base App (or any mini-app host webview).
// Mirrors the official @farcaster/miniapp-sdk isInMiniApp() check.
// IMPORTANT: fails OPEN (returns true) so a detection hiccup can never lock
// real Base App players out of the game.
export function isInsideBaseApp(): boolean {
  if (typeof window === 'undefined') return true
  try {
    // Escape hatches: local dev + ?dev=1 for testing the game in a browser
    if (new URLSearchParams(window.location.search).get('dev') === '1') return true
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') return true
    // Base App mobile runs the site in a React Native webview
    if ((window as any).ReactNativeWebView) return true
    // Base web / Base Build preview / Farcaster embed the site in an iframe
    if (window.self !== window.top) return true
    return false
  } catch {
    return true
  }
}

export function PlayInBaseApp() {
  const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent)

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: 'radial-gradient(circle at 50% 20%, #0d1b4d 0%, #000810 65%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        padding: '32px 20px',
        color: '#fff',
        fontFamily: 'var(--font-display), system-ui, sans-serif',
        textAlign: 'center',
      }}
    >
      <img
        src="/icon.png"
        alt="Base Rush"
        width={92}
        height={92}
        style={{ borderRadius: 24, boxShadow: '0 0 42px rgba(0,82,255,0.55)' }}
      />

      <h1 style={{ margin: 0, fontSize: 34, fontWeight: 700, letterSpacing: 0.5 }}>
        BASE <span style={{ color: '#0052FF' }}>RUSH</span> <span style={{ color: '#ffd84d' }}>⚡</span>
      </h1>

      <p style={{ margin: 0, maxWidth: 380, fontSize: 15, lineHeight: 1.55, color: 'rgba(255,255,255,0.72)' }}>
        Base Rush runs inside the <b style={{ color: '#fff' }}>Base App</b> — play there to
        save scores on-chain, climb the leaderboard and win weekly rewards.
      </p>

      {isMobile ? (
        <>
          <a
            href={DEEPLINK}
            style={{
              marginTop: 6,
              padding: '15px 38px',
              fontSize: 17,
              fontWeight: 700,
              color: '#fff',
              background: '#0052FF',
              borderRadius: 999,
              textDecoration: 'none',
              boxShadow: '0 8px 28px rgba(0,82,255,0.45)',
            }}
          >
            Open in Base App
          </a>
          <a
            href="https://base.app"
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'underline' }}
          >
            Don&apos;t have the Base App? Get it here
          </a>
        </>
      ) : (
        <>
          <img
            src="/qr-baseapp.png"
            alt="Scan to open Base Rush in the Base App"
            width={264}
            height={264}
            style={{ borderRadius: 20, marginTop: 6, boxShadow: '0 18px 50px rgba(0,0,0,0.55)' }}
          />
          <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(255,255,255,0.55)' }}>
            Scan the QR code with your phone to open <b>Base Rush</b> in the Base App.
          </p>
        </>
      )}
    </main>
  )
}
