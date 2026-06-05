export function createTextures(scene: any) {
  // ── BACKGROUND ────────────────────────────────────────────────
  // Navy→purple vertical gradient with an upper-centre violet glow — matches
  // the start screen's vibrant cyberpunk palette (deep purple-navy, not flat blue).
  const bg = scene.make.graphics({ x: 0, y: 0, add: false })
  // Everything below is baked once into a single 'bg' texture → 1 draw call at
  // runtime, so this rich skyline costs LESS than the old procedural stars/glow.
  const rnd = (a: number, b: number) => a + Math.random() * (b - a)
  const irnd = (a: number, b: number) => Math.floor(rnd(a, b + 0.999))

  // Smooth vertical gradient: purple-navy top → deep navy bottom (NOT pure black,
  // so the lower play area reads as a dim-lit stage instead of a black void)
  bg.fillGradientStyle(0x201852, 0x201852, 0x0c0a26, 0x0c0a26, 1)
  bg.fillRect(0, 0, 480, 768)

  // Soft violet glow high in the sky (smooth multi-layer falloff)
  for (let i = 9; i >= 1; i--) { bg.fillStyle(0x4226b0, 0.022); bg.fillCircle(240, 170, 60 + i * 32) }
  // Nebula wisps (soft violet blobs, upper area)
  for (let i = 0; i < 7; i++) { bg.fillStyle(0x7a3aff, 0.035); bg.fillCircle(rnd(110, 320), rnd(50, 180), rnd(28, 68)) }
  // Starfield baked into the sky band
  for (let i = 0; i < 70; i++) {
    bg.fillStyle(Math.random() < 0.22 ? 0x9a7bff : 0xffffff, rnd(0.12, 0.5))
    bg.fillCircle(rnd(0, 480), rnd(4, 350), rnd(0.4, 1.3))
  }

  // Horizon haze where the (scrolling) skyline meets the dark play area
  const horizon = 414
  bg.fillStyle(0x6a3acc, 0.12); bg.fillRect(0, horizon - 6, 480, 12)
  bg.fillStyle(0x2a1a6a, 0.18); bg.fillRect(0, horizon, 480, 44)

  // Play-area ambient — a soft blue stage glow so the action zone (where the
  // robot, coins & obstacles live) reads as lit, not a black void. Subtle enough
  // that white/gold/neon gameplay sprites still pop against it.
  for (let i = 12; i >= 1; i--) { bg.fillStyle(0x16245f, 0.011); bg.fillCircle(240, 600, 120 + i * 30) }
  // Gentle floor-rising wash so the bottom band isn't dead black
  bg.fillStyle(0x0e1a4a, 0.18); bg.fillRect(0, 690, 480, 78)

  // ── BASE LOGO emblem — small, cute, glowing, like a second moon (top-right) ─
  const lx = 412, ly = 92
  for (let i = 6; i >= 1; i--) { bg.fillStyle(0x2e7bff, 0.045); bg.fillCircle(lx, ly, 22 + i * 5) }
  bg.fillStyle(0x0a52ff, 1); bg.fillCircle(lx, ly, 23)                       // Base-blue disc
  bg.fillStyle(0xffffff, 1); bg.fillRoundedRect(lx - 11, ly - 4.5, 22, 9, 3) // white bar

  bg.generateTexture('bg', 480, 768)
  bg.destroy()

  // ── PARALLAX SKYLINE LAYERS (tileable, scroll horizontally) ─────────────────
  const neon = [0x3a7bff, 0xff3d9a, 0x22d3ff, 0xb44dff]
  // NEAR skyline — taller, brighter (scrolls a bit faster)
  const sn = scene.make.graphics({ x: 0, y: 0, add: false })
  // Full screen-width (480) so it shows once with no centre tiling gap/seam;
  // buildings run nearly edge-to-edge so the scroll wrap is just a street gap.
  for (let x = 8; x < 472; ) {
    const w = irnd(16, 34), h = rnd(60, 165), ty = 170 - h
    sn.fillStyle(0x12143a, 1); sn.fillRect(x, ty, w, h)
    sn.fillStyle(neon[irnd(0, 3)], 0.9); sn.fillRect(x, ty, w, 2)
    const wc = neon[irnd(0, 3)]
    for (let wy = ty + 6; wy < 168; wy += 8)
      for (let wx = x + 3; wx < x + w - 3; wx += 6)
        if (Math.random() < 0.5) { sn.fillStyle(wc, rnd(0.4, 0.85)); sn.fillRect(wx, wy, 2, 3) }
    x += w + irnd(6, 16)
  }
  sn.generateTexture('skyNear', 480, 170); sn.destroy()
  // FAR skyline — smaller, fainter (scrolls slowest = deepest)
  const sf = scene.make.graphics({ x: 0, y: 0, add: false })
  for (let x = 6; x < 474; ) {
    const w = irnd(12, 26), h = rnd(35, 110), ty = 120 - h
    sf.fillStyle(0x12122e, 0.9); sf.fillRect(x, ty, w, h)
    sf.fillStyle(neon[irnd(0, 3)], 0.4); sf.fillRect(x, ty, w, 1.5)
    const wc = neon[irnd(0, 3)]
    for (let wy = ty + 5; wy < 118; wy += 9)
      for (let wx = x + 2; wx < x + w - 2; wx += 6)
        if (Math.random() < 0.3) { sf.fillStyle(wc, rnd(0.18, 0.4)); sf.fillRect(wx, wy, 1.5, 2) }
    x += w + irnd(5, 14)
  }
  sf.generateTexture('skyFar', 480, 120); sf.destroy()
  // MIST — faint puffs, sits just above the dark void at the horizon (full width)
  const ms = scene.make.graphics({ x: 0, y: 0, add: false })
  for (let i = 0; i < 14; i++) { ms.fillStyle(0x5a4a9a, 0.05); ms.fillCircle(rnd(10, 470), rnd(26, 42), rnd(26, 46)) }
  ms.generateTexture('mist', 480, 64); ms.destroy()

  // ── PHYSICS GROUND (minimal — visual floor is handled by groundGrid tileSprite) ──
  const gfx = scene.make.graphics({ x: 0, y: 0, add: false })
  gfx.fillStyle(0x000008, 1)
  gfx.fillRect(0, 0, 480, 40)
  gfx.generateTexture('ground', 480, 40)
  gfx.destroy()

  // ── GROUND GRID TILE (100×40 px, seamless horizontal scroll) ──────────────────
  // One tile = one "cell" of the neon road grid.  tilePositionX drives the scroll.
  const gg = scene.make.graphics({ x: 0, y: 0, add: false })
  // Base: very dark navy
  gg.fillStyle(0x000612, 1)
  gg.fillRect(0, 0, 100, 40)
  // Top-edge bloom: 3 stacked strips simulating a glow falloff
  gg.fillStyle(0x0066CC, 0.22)
  gg.fillRect(0, 0, 100, 2)
  gg.fillStyle(0x003399, 0.13)
  gg.fillRect(0, 2, 100, 2)
  gg.fillStyle(0x001d55, 0.07)
  gg.fillRect(0, 4, 100, 4)
  // Main vertical grid line — RIGHT edge (creates seamless repeat when tiled)
  gg.lineStyle(1.5, 0x0055CC, 0.80)
  gg.lineBetween(99, 0, 99, 39)
  // Subdivision line at 50 px (half-brightness)
  gg.lineStyle(0.8, 0x002a66, 0.40)
  gg.lineBetween(49, 2, 49, 39)
  // Horizontal mid scan-line (very subtle perspective cue)
  gg.lineStyle(0.5, 0x001a3a, 0.25)
  gg.lineBetween(0, 20, 99, 20)
  // Bottom dark strip (floor depth / shadow)
  gg.fillStyle(0x000005, 0.50)
  gg.fillRect(0, 36, 100, 4)
  // Node dots at intersections (tiny neon circuit nodes)
  gg.fillStyle(0x0077EE, 0.70)
  gg.fillCircle(0, 0, 2.0)    // left-top corner
  gg.fillCircle(99, 0, 2.0)   // right-top corner
  gg.fillStyle(0x004499, 0.45)
  gg.fillCircle(49, 0, 1.5)   // mid-top
  gg.fillCircle(0, 20, 1.0)   // left-mid
  gg.fillCircle(99, 20, 1.0)  // right-mid
  gg.generateTexture('groundGrid', 100, 40)
  gg.destroy()

  // ── BACKGROUND CIRCUIT TILE (240×160 px, parallax layer) ─────────────────────
  // Very faint circuit-board pattern scrolling behind the action.
  const bc = scene.make.graphics({ x: 0, y: 0, add: false })
  bc.fillStyle(0x000210, 1)
  bc.fillRect(0, 0, 240, 160)
  // Grid skeleton
  bc.lineStyle(0.8, 0x001433, 0.55)
  for (let x = 0; x <= 240; x += 48) bc.lineBetween(x, 0, x, 160)
  for (let y = 0; y <= 160; y += 40) bc.lineBetween(0, y, 240, y)
  // Circuit traces
  bc.lineStyle(1.0, 0x002255, 0.65)
  bc.lineBetween(0, 40, 144, 40)
  bc.lineBetween(144, 40, 144, 80)
  bc.lineBetween(144, 80, 240, 80)
  bc.lineBetween(48, 0, 48, 40)
  bc.lineBetween(0, 120, 96, 120)
  bc.lineBetween(96, 80, 96, 120)
  bc.lineBetween(192, 0, 192, 40)
  bc.lineBetween(192, 80, 192, 160)
  // Junction nodes
  bc.fillStyle(0x0044AA, 0.75)
  bc.fillCircle(144, 40, 2.5)
  bc.fillCircle(144, 80, 2.5)
  bc.fillCircle(96, 80, 2.0)
  bc.fillCircle(96, 120, 2.5)
  bc.fillCircle(192, 40, 2.0)
  bc.fillCircle(192, 80, 2.0)
  bc.fillCircle(48, 40, 2.0)
  // Brighter edge anchors
  bc.fillStyle(0x005ACC, 0.60)
  bc.fillCircle(0, 0, 2.5)
  bc.fillCircle(48, 0, 2.0)
  bc.fillCircle(0, 40, 2.0)
  bc.fillCircle(240, 80, 2.5)
  bc.fillCircle(0, 120, 2.0)
  // Tiny "data packet" squares mid-trace
  bc.fillStyle(0x0088FF, 0.50)
  bc.fillRect(64, 38, 3, 4)
  bc.fillRect(100, 78, 3, 4)
  bc.fillRect(168, 38, 3, 4)
  bc.generateTexture('bgCircuit', 240, 160)
  bc.destroy()

  // Basey character frames
  const makeBasey = (key: string, leg: number) => {
    const b = scene.make.graphics({ x: 0, y: 0, add: false })
    b.fillStyle(0xFFFFFF, 0.10)
    b.fillCircle(24, 24, 24)
    b.fillStyle(0xFFFFFF)
    b.fillRoundedRect(4, 0, 40, 36, 8)
    b.fillStyle(0x0022DD)
    b.fillRoundedRect(8, 4, 32, 28, 6)
    b.fillStyle(0xFFFFFF)
    b.fillCircle(16, 16, 5)
    b.fillCircle(32, 16, 5)
    b.fillStyle(0x000099)
    b.fillCircle(17, 17, 2.5)
    b.fillCircle(33, 17, 2.5)
    b.fillStyle(0xFFFFFF)
    b.fillCircle(18, 15, 1.2)
    b.fillCircle(34, 15, 1.2)
    b.lineStyle(2, 0xFFFFFF, 1)
    b.beginPath()
    b.arc(24, 25, 5, 0.3, Math.PI - 0.3)
    b.strokePath()
    b.fillStyle(0xFFFFFF)
    b.fillRect(20, 36, 8, 4)
    b.fillStyle(0xFFFFFF)
    if (leg === 0) {
      b.fillRoundedRect(13, 40, 9, 16, 3)
      b.fillRoundedRect(26, 40, 9, 11, 3)
      b.fillStyle(0x000044)
      b.fillRoundedRect(11, 53, 13, 5, 2)
      b.fillRoundedRect(24, 48, 13, 5, 2)
    } else if (leg === 1) {
      b.fillRoundedRect(13, 40, 9, 11, 3)
      b.fillRoundedRect(26, 40, 9, 16, 3)
      b.fillStyle(0x000044)
      b.fillRoundedRect(11, 48, 13, 5, 2)
      b.fillRoundedRect(24, 53, 13, 5, 2)
    } else {
      b.fillRoundedRect(13, 38, 9, 12, 3)
      b.fillRoundedRect(26, 38, 9, 12, 3)
      b.fillStyle(0x000044)
      b.fillRoundedRect(11, 47, 13, 5, 2)
      b.fillRoundedRect(24, 47, 13, 5, 2)
    }
    b.generateTexture(key, 48, 60)
    b.destroy()
  }
  makeBasey('b0', 0)
  makeBasey('b1', 1)
  makeBasey('bj', 2)

  // Premium Base Coin (gold rim + Base blue + white "b" logo)
  const coin = scene.make.graphics({ x: 0, y: 0, add: false })
  // Outer Base-blue glow
  coin.fillStyle(0x0052FF, 0.08)
  coin.fillCircle(15, 15, 20)
  coin.fillStyle(0x1A6EFF, 0.18)
  coin.fillCircle(15, 15, 17)
  // Gold outer rim
  coin.fillStyle(0xFFCC00)
  coin.fillCircle(15, 15, 14)
  // Depth shadow ring on gold
  coin.fillStyle(0xAA7700)
  coin.fillCircle(15, 15, 12)
  // Bright gold face
  coin.fillStyle(0xFFDD44)
  coin.fillCircle(15, 15, 11)
  // Base blue core
  coin.fillStyle(0x0052FF)
  coin.fillCircle(15, 15, 9)
  // White Base "b" logo — vertical stem + round bump
  coin.fillStyle(0xFFFFFF)
  coin.fillRect(10, 8, 3, 13)   // left vertical stem
  coin.fillCircle(15, 17, 4)    // circular bump (overlaps stem = lowercase b)
  // Top-left sheen highlight
  coin.fillStyle(0xFFFFFF, 0.45)
  coin.fillEllipse(11, 9, 7, 4)
  coin.generateTexture('coin', 30, 30)
  coin.destroy()

  // Shield power-up — classic pointed shield with cross rune
  const shield = scene.make.graphics({ x: 0, y: 0, add: false })
  // Outer cyan glow
  shield.fillStyle(0x00CCFF, 0.10)
  shield.fillCircle(20, 20, 26)
  shield.fillStyle(0x00EEFF, 0.20)
  shield.fillCircle(20, 20, 22)
  // White shield border (rounded top + pointed bottom)
  shield.fillStyle(0xFFFFFF)
  shield.fillPoints([
    { x: 20, y: 2 }, { x: 37, y: 2 }, { x: 37, y: 22 },
    { x: 20, y: 39 }, { x: 3, y: 22 }, { x: 3, y: 2 }
  ], true)
  // Dark blue inner fill
  shield.fillStyle(0x001ECC)
  shield.fillPoints([
    { x: 20, y: 6 }, { x: 33, y: 6 }, { x: 33, y: 22 },
    { x: 20, y: 35 }, { x: 7, y: 22 }, { x: 7, y: 6 }
  ], true)
  // Subtle inner blue glow
  shield.fillStyle(0x0055FF, 0.30)
  shield.fillCircle(20, 18, 11)
  // Cyan cross symbol
  shield.fillStyle(0x00FFFF)
  shield.fillRect(18, 9, 4, 18)
  shield.fillRect(11, 17, 18, 4)
  // Bright center gem
  shield.fillStyle(0xFFFFFF, 0.90)
  shield.fillCircle(20, 17, 2.5)
  shield.generateTexture('powerShield', 40, 40)
  shield.destroy()

  // Magnet power-up — horseshoe U-magnet with N/S poles
  const magnet = scene.make.graphics({ x: 0, y: 0, add: false })
  // Orange magnetic field glow
  magnet.fillStyle(0xFF5500, 0.10)
  magnet.fillCircle(20, 20, 26)
  magnet.fillStyle(0xFF8800, 0.16)
  magnet.fillCircle(20, 20, 22)
  // Step 1: draw arc circle (will be covered on bottom by arms)
  magnet.fillStyle(0xFFFFFF)
  magnet.fillCircle(20, 14, 14)        // white arc outer
  magnet.fillStyle(0xFFAA00)
  magnet.fillCircle(20, 14, 12)        // gold arc fill
  magnet.fillStyle(0x0D0020)
  magnet.fillCircle(20, 14, 8)         // dark inner hole
  // Step 2: draw arms over the bottom half of the arc
  magnet.fillStyle(0xFFFFFF)
  magnet.fillRoundedRect(4, 14, 13, 24, 4)   // left arm white border
  magnet.fillStyle(0xFF2200)
  magnet.fillRoundedRect(6, 14, 9, 22, 3)    // left arm red (N pole)
  magnet.fillStyle(0xFFFFFF)
  magnet.fillRoundedRect(23, 14, 13, 24, 4)  // right arm white border
  magnet.fillStyle(0x2255FF)
  magnet.fillRoundedRect(25, 14, 9, 22, 3)   // right arm blue (S pole)
  // Step 3: dark center gap between arms
  magnet.fillStyle(0x0D0020)
  magnet.fillRect(17, 14, 6, 24)
  // Restore arm colors in top-arc overlap zone (y=14 to y=22)
  magnet.fillStyle(0xFF2200)
  magnet.fillRect(6, 14, 9, 8)
  magnet.fillStyle(0x2255FF)
  magnet.fillRect(25, 14, 9, 8)
  // Pole-tip glow at the bottom openings
  magnet.fillStyle(0xFF6600, 0.55)
  magnet.fillEllipse(10, 38, 10, 5)
  magnet.fillStyle(0x4499FF, 0.55)
  magnet.fillEllipse(30, 38, 10, 5)
  magnet.generateTexture('powerMagnet', 40, 40)
  magnet.destroy()

  // Slow-mo power-up
  const slowmo = scene.make.graphics({ x: 0, y: 0, add: false })
  slowmo.fillStyle(0xFFFF00)
  slowmo.fillCircle(20, 20, 18)
  slowmo.fillStyle(0x000000)
  slowmo.fillCircle(20, 20, 15)
  slowmo.fillStyle(0xFFFF00)
  slowmo.fillCircle(20, 20, 3)
  slowmo.fillRect(18, 8, 4, 12)
  slowmo.fillRect(18, 20, 8, 4)
  slowmo.generateTexture('powerSlow', 40, 40)
  slowmo.destroy()

  // 2x Points power-up
  const doublePoints = scene.make.graphics({ x: 0, y: 0, add: false })
  doublePoints.fillStyle(0xFF00FF)
  doublePoints.fillCircle(20, 20, 18)
  doublePoints.fillStyle(0xFFFFFF)
  doublePoints.fillCircle(20, 20, 15)
  doublePoints.fillStyle(0xFF00FF)
  doublePoints.fillRect(10, 12, 6, 2)
  doublePoints.fillRect(14, 12, 2, 4)
  doublePoints.fillRect(10, 16, 6, 2)
  doublePoints.fillRect(10, 18, 2, 4)
  doublePoints.fillRect(10, 22, 6, 2)
  doublePoints.fillRect(19, 12, 2, 4)
  doublePoints.fillRect(27, 12, 2, 4)
  doublePoints.fillRect(21, 16, 2, 4)
  doublePoints.fillRect(25, 16, 2, 4)
  doublePoints.fillRect(19, 20, 2, 4)
  doublePoints.fillRect(27, 20, 2, 4)
  doublePoints.generateTexture('power2x', 40, 40)
  doublePoints.destroy()

  // High obstacle
  const oh = scene.make.graphics({ x: 0, y: 0, add: false })
  oh.fillStyle(0xFFFFFF)
  oh.fillRoundedRect(0, 0, 38, 50, 5)
  oh.fillStyle(0x0000BB)
  oh.fillRoundedRect(3, 3, 32, 44, 4)
  oh.lineStyle(2.5, 0xFFFFFF, 1)
  oh.lineBetween(8, 8, 30, 42)
  oh.lineBetween(30, 8, 8, 42)
  oh.fillStyle(0xFFFFFF)
  oh.fillCircle(6, 6, 2.5)
  oh.fillCircle(32, 6, 2.5)
  oh.fillCircle(6, 44, 2.5)
  oh.fillCircle(32, 44, 2.5)
  oh.generateTexture('obsH', 38, 50)
  oh.destroy()

  // Low obstacle
  const ol = scene.make.graphics({ x: 0, y: 0, add: false })
  ol.fillStyle(0xFFFFFF)
  ol.fillRoundedRect(0, 0, 90, 22, 6)
  ol.fillStyle(0x0011AA)
  ol.fillRoundedRect(3, 3, 84, 16, 4)
  ol.lineStyle(1, 0x4466FF, 0.8)
  ol.lineBetween(3, 11, 87, 11)
  ol.fillStyle(0xFF3300, 0.7)
  ol.fillRect(10, 4, 12, 14)
  ol.fillRect(34, 4, 12, 14)
  ol.fillRect(58, 4, 12, 14)
  ol.fillStyle(0xFFFFFF, 0.15)
  ol.fillRect(10, 4, 12, 14)
  ol.fillRect(34, 4, 12, 14)
  ol.fillRect(58, 4, 12, 14)
  ol.fillStyle(0xFFFFFF)
  ol.fillCircle(5, 5, 3)
  ol.fillCircle(85, 5, 3)
  ol.fillCircle(5, 17, 3)
  ol.fillCircle(85, 17, 3)
  ol.generateTexture('obsL', 90, 22)
  ol.destroy()

  // Flying enemy drone — forces player to SLIDE under it
  const dg = scene.make.graphics({ x: 0, y: 0, add: false })
  // Rotor glow halo
  dg.fillStyle(0x0088FF, 0.18)
  dg.fillCircle(9, 6, 11)
  dg.fillCircle(41, 6, 11)
  // Rotor discs
  dg.fillStyle(0x002244, 1)
  dg.fillEllipse(9, 6, 16, 8)
  dg.fillEllipse(41, 6, 16, 8)
  dg.lineStyle(1.5, 0x00CCFF, 1)
  dg.strokeEllipse(9, 6, 16, 8)
  dg.strokeEllipse(41, 6, 16, 8)
  // Rotor cross blades
  dg.lineStyle(1, 0x00FFFF, 0.7)
  dg.lineBetween(2, 6, 16, 6)
  dg.lineBetween(9, 2, 9, 11)
  dg.lineBetween(34, 6, 48, 6)
  dg.lineBetween(41, 2, 41, 11)
  // Main body
  dg.fillStyle(0x000E22, 1)
  dg.fillRoundedRect(13, 9, 24, 13, 4)
  dg.lineStyle(2, 0x00FFFF, 1)
  dg.strokeRoundedRect(13, 9, 24, 13, 4)
  // Body centre stripe
  dg.lineStyle(1, 0x0055AA, 0.6)
  dg.lineBetween(16, 15, 36, 15)
  // Threatening red scanner eye
  dg.fillStyle(0xFF0000, 1)
  dg.fillCircle(25, 15, 4)
  dg.fillStyle(0xFF8888, 0.8)
  dg.fillCircle(24, 14, 1.5)
  // Thruster glow underneath
  dg.fillStyle(0x00FFFF, 0.45)
  dg.fillEllipse(18, 25, 7, 4)
  dg.fillEllipse(25, 27, 7, 4)
  dg.fillEllipse(32, 25, 7, 4)
  dg.generateTexture('obsDrone', 50, 28)
  dg.destroy()
}
