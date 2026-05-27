'use client'
import { useEffect, useRef } from 'react'

// 2× internal resolution for crisp rendering
const SCALE = 2

function hex(color: number, alpha = 1): string {
  const r = (color >> 16) & 0xff
  const g = (color >> 8) & 0xff
  const b = color & 0xff
  return `rgba(${r},${g},${b},${alpha})`
}

function fillCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

function fillRR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  if ((ctx as any).roundRect) {
    ;(ctx as any).roundRect(x, y, w, h, r)
  } else {
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }
  ctx.fill()
}

// Mirrors makeBasey() from game/textures.ts exactly
function drawBasey(ctx: CanvasRenderingContext2D, leg: number) {
  ctx.save()
  ctx.scale(SCALE, SCALE)

  // Glow halo
  ctx.fillStyle = hex(0xFFFFFF, 0.10)
  fillCircle(ctx, 24, 24, 24)

  // White body frame
  ctx.fillStyle = hex(0xFFFFFF)
  fillRR(ctx, 4, 0, 40, 36, 8)

  // Blue face
  ctx.fillStyle = hex(0x0022DD)
  fillRR(ctx, 8, 4, 32, 28, 6)

  // Eye whites
  ctx.fillStyle = hex(0xFFFFFF)
  fillCircle(ctx, 16, 16, 5)
  fillCircle(ctx, 32, 16, 5)

  // Pupils
  ctx.fillStyle = hex(0x000099)
  fillCircle(ctx, 17, 17, 2.5)
  fillCircle(ctx, 33, 17, 2.5)

  // Eye shine
  ctx.fillStyle = hex(0xFFFFFF)
  fillCircle(ctx, 18, 15, 1.2)
  fillCircle(ctx, 34, 15, 1.2)

  // Smile arc
  ctx.strokeStyle = hex(0xFFFFFF)
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(24, 25, 5, 0.3, Math.PI - 0.3)
  ctx.stroke()

  // Neck
  ctx.fillStyle = hex(0xFFFFFF)
  ctx.fillRect(20, 36, 8, 4)

  // Legs — same 3 frames as Phaser
  ctx.fillStyle = hex(0xFFFFFF)
  if (leg === 0) {
    fillRR(ctx, 13, 40, 9, 16, 3)
    fillRR(ctx, 26, 40, 9, 11, 3)
    ctx.fillStyle = hex(0x000044)
    fillRR(ctx, 11, 53, 13, 5, 2)
    fillRR(ctx, 24, 48, 13, 5, 2)
  } else if (leg === 1) {
    fillRR(ctx, 13, 40, 9, 11, 3)
    fillRR(ctx, 26, 40, 9, 16, 3)
    ctx.fillStyle = hex(0x000044)
    fillRR(ctx, 11, 48, 13, 5, 2)
    fillRR(ctx, 24, 53, 13, 5, 2)
  } else {
    fillRR(ctx, 13, 38, 9, 12, 3)
    fillRR(ctx, 26, 38, 9, 12, 3)
    ctx.fillStyle = hex(0x000044)
    fillRR(ctx, 11, 47, 13, 5, 2)
    fillRR(ctx, 24, 47, 13, 5, 2)
  }

  ctx.restore()
}

export function BaseyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>(0)
  const legRef    = useRef(0)
  const lastLeg   = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const start = performance.now()

    const animate = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Smooth bounce: ±6px (in 2× scaled space = ±3 logical px)
      const bounceY = Math.sin((now - start) / 420) * 12

      // Leg swap every 350 ms
      if (now - lastLeg.current > 350) {
        legRef.current = legRef.current === 0 ? 1 : 0
        lastLeg.current = now
      }

      ctx.save()
      ctx.translate(0, bounceY)
      drawBasey(ctx, legRef.current)
      ctx.restore()

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  // Canvas: 48×68 logical → ×2 = 96×136 physical (extra height for bounce room)
  return (
    <canvas
      ref={canvasRef}
      width={96}
      height={136}
      style={{
        width: '72px',
        height: '102px',
        imageRendering: 'pixelated',
        filter: 'drop-shadow(0 0 14px rgba(0,120,255,0.9)) drop-shadow(0 0 4px rgba(0,200,255,0.6))',
      }}
    />
  )
}
