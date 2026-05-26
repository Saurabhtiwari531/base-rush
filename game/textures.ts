export function createTextures(scene: any) {
  // Background
  const bg = scene.make.graphics({ x: 0, y: 0, add: false })
  const colors = [
    { y: 0, height: 160, color: 0x000428, alpha: 1.0 },
    { y: 160, height: 160, color: 0x001233, alpha: 1.0 },
    { y: 320, height: 160, color: 0x001d3d, alpha: 1.0 },
    { y: 480, height: 160, color: 0x003566, alpha: 1.0 }
  ]
  colors.forEach(layer => {
    bg.fillStyle(layer.color, layer.alpha)
    bg.fillRect(0, layer.y, 480, layer.height)
  })
  bg.lineStyle(1, 0x0055AA, 0.08)
  for (let y = 0; y < 640; y += 40) {
    bg.lineBetween(0, y, 480, y)
  }
  bg.generateTexture('bg', 480, 640)
  bg.destroy()

  // Ground
  const gfx = scene.make.graphics({ x: 0, y: 0, add: false })
  gfx.fillStyle(0x000011)
  gfx.fillRect(0, 0, 480, 40)
  gfx.fillStyle(0x000000, 0.6)
  gfx.fillRect(0, 32, 480, 8)
  const lanePositions = [160, 320]
  gfx.lineStyle(2, 0x00FFFF, 0.4)
  lanePositions.forEach(x => {
    for (let y = 0; y < 40; y += 8) {
      gfx.lineBetween(x, y, x, y + 4)
    }
  })
  gfx.fillStyle(0x0088FF, 0.3)
  gfx.fillRect(0, 0, 480, 4)
  gfx.lineStyle(2, 0x00FFFF, 1.0)
  gfx.lineBetween(0, 0, 480, 0)
  gfx.lineStyle(1, 0xFFFFFF, 0.8)
  gfx.lineBetween(0, 1, 480, 1)
  gfx.fillStyle(0x001133, 0.15)
  for (let x = 0; x < 480; x += 20) {
    gfx.fillRect(x, 0, 1, 40)
  }
  gfx.generateTexture('ground', 480, 40)
  gfx.destroy()

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
}
