'use client'

import { useEffect, useRef } from 'react'

// Base Rush is a Base App exclusive: regular browsers see this screen instead
// of the game, steering players into the Base App (only in-app plays count
// toward Base's WTU leaderboard). A silent autopilot demo of the real game
// runs dimmed behind the QR/deeplink card as a teaser.

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
  const demoRef = useRef<HTMLDivElement>(null)

  // Attract-mode demo: the real game, silent + autopiloted, dimmed behind the
  // card — shows visitors what they'd get in the Base App.
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return
    let game: any
    let cancelled = false
    ;(async () => {
      const Phaser = (await import('phaser')).default
      const { createGameConfig } = await import('../game/scene')
      if (cancelled || !demoRef.current) return
      game = new Phaser.Game(createGameConfig(Phaser, demoRef.current, { demo: true }))
    })()
    return () => {
      cancelled = true
      game?.destroy(true)
    }
  }, [])

  return (
    <main
      style={{
        position: 'relative',
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
        overflow: 'hidden',
      }}
    >
      {/* Live demo canvas (Phaser mounts here) + readability vignette on top */}
      <div
        ref={demoRef}
        aria-hidden
        style={{ position: 'absolute', inset: 0, opacity: 0.55, pointerEvents: 'none' }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 45%, rgba(0,8,16,0.30) 0%, rgba(0,8,16,0.85) 80%)',
          pointerEvents: 'none',
        }}
      />
      {/* Card content — above the demo canvas + vignette */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
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

      {/* Hype strip — what's waiting inside (real numbers, matches in-game copy) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, maxWidth: 430 }}>
        {[
          {
            icon: '🏆',
            title: 'WEEKLY REWARDS',
            titleColor: '#ffd84d',
            desc: <>Top 3 win <b style={{ color: '#fff' }}>$5 / $3 / $1</b> — every single week</>,
          },
          {
            icon: '🐉',
            title: 'UNLOCKABLE SKINS',
            titleColor: '#ff7ad9',
            desc: <>🌟 💖 🌌 🐉 🏆 — earn coins in runs, claim legendary looks</>,
          },
        ].map((c) => (
          <div
            key={c.title}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '9px 14px',
              borderRadius: 12,
              background: 'rgba(0,82,255,0.12)',
              border: '1px solid rgba(0,110,255,0.38)',
              boxShadow: '0 4px 18px rgba(0,30,120,0.35)',
            }}
          >
            <span style={{ fontSize: 19 }}>{c.icon}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: c.titleColor }}>{c.title}</div>
              <div style={{ fontSize: 11.5, lineHeight: 1.4, color: 'rgba(255,255,255,0.68)' }}>{c.desc}</div>
            </div>
          </div>
        ))}
      </div>

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
      </div>
    </main>
  )
}
