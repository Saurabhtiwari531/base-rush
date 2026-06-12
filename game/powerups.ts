export function getPowerUpName(type: string): string {
  if (type === 'powerShield') return '🛡️ SHIELD'
  if (type === 'powerMagnet') return '🧲 MAGNET'
  if (type === 'powerSlow') return '⏱️ SLOW-MO'
  if (type === 'power2x') return '💎 2x POINTS'
  if (type === 'powerRocket') return '🚀 ROCKET RUSH'
  return 'POWER-UP'
}

function makeTimerBar(scene: any, yPos: number, color: number, durationMs: number, barKey: string) {
  if (scene[barKey]) { scene[barKey].destroy(); scene[barKey] = null }
  const bar = scene.add.rectangle(0, yPos, 480, 5, color, 0.85).setOrigin(0, 0.5).setDepth(30)
  scene[barKey] = bar
  scene.tweens.add({
    targets: bar, scaleX: 0, duration: durationMs, ease: 'Linear',
    onComplete: () => { if (scene[barKey] === bar) { bar.destroy(); scene[barKey] = null } }
  })
}

export function createPowerUps(scene: any) {
  scene.activateShield = () => {
    if (scene.activeShield) return
    scene.activeShield = true
    scene.shieldOuter = scene.add.circle(scene.basey.x, scene.basey.y, 44, 0x00CCFF, 0.06).setDepth(3)
    scene.shieldOuter.setStrokeStyle(1, 0x00CCFF, 0.35)
    scene.shieldIcon = scene.add.circle(scene.basey.x, scene.basey.y, 34, 0x00FFFF, 0.22).setDepth(3)
    scene.shieldIcon.setStrokeStyle(2.5, 0x00FFFF, 1)
    scene.tweens.add({
      targets: scene.shieldIcon,
      scaleX: 1.12, scaleY: 1.12, alpha: 0.08,
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    })
    makeTimerBar(scene, 3, 0x00FFFF, 10000, 'shieldBar')
    scene.time.delayedCall(10000, () => {
      scene.activeShield = false
      ;[scene.shieldIcon, scene.shieldOuter].forEach((obj: any) => {
        if (obj) scene.tweens.add({
          targets: obj, scaleX: 2.2, scaleY: 2.2, alpha: 0, duration: 300,
          onComplete: () => obj.destroy()
        })
      })
      scene.shieldIcon = null
      scene.shieldOuter = null
    })
  }

  scene.activateMagnet = () => {
    if (scene.activeMagnet) return
    scene.activeMagnet = true
    scene.magnetOuter = scene.add.circle(scene.basey.x, scene.basey.y, 95, 0xFF6600, 0.05).setDepth(3)
    scene.magnetOuter.setStrokeStyle(1, 0xFF8800, 0.2)
    scene.magnetIcon = scene.add.circle(scene.basey.x, scene.basey.y, 65, 0xFF8800, 0.08).setDepth(3)
    scene.magnetIcon.setStrokeStyle(1.5, 0xFFAA00, 0.4)
    scene.tweens.add({
      targets: scene.magnetIcon,
      scaleX: 1.08, scaleY: 1.08, alpha: 0.18,
      duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    })
    makeTimerBar(scene, 9, 0xFF8800, 8000, 'magnetBar')
    scene.time.delayedCall(8000, () => {
      scene.activeMagnet = false
      ;[scene.magnetIcon, scene.magnetOuter].forEach((obj: any) => {
        if (obj) obj.destroy()
      })
      scene.magnetIcon = null
      scene.magnetOuter = null
    })
  }

  scene.activateSlowMo = () => {
    if (scene.activeSlowMo) return
    scene.activeSlowMo = true
    const speedAtActivation = scene.obstacleSpeed
    scene.obstacleSpeed = speedAtActivation * 0.58
    scene.obstacles.getChildren().forEach((o: any) => { o.setVelocityX(-scene.obstacleSpeed) })
    scene.coins.getChildren().forEach((c: any) => { c.setVelocityX(-scene.obstacleSpeed) })
    scene.powerups.getChildren().forEach((p: any) => { p.setVelocityX(-scene.obstacleSpeed) })
    scene.slowMoOverlay = scene.add.rectangle(240, 384, 480, 768, 0x6600FF, 0.08).setDepth(50)
    makeTimerBar(scene, 15, 0xFFFF00, 5000, 'slowBar')
    scene.time.delayedCall(5000, () => {
      scene.activeSlowMo = false
      scene.obstacleSpeed = Math.min(scene.maxSpeed, scene.obstacleSpeed / 0.58)
      if (scene.slowMoOverlay) {
        scene.slowMoOverlay.destroy()
        scene.slowMoOverlay = null
      }
    })
  }

  // ROCKET RUSH — the rare jackpot (scheduled at most once per run by the
  // scene). Basey blasts above the lane, untouchable, while a sine-wave coin
  // trail streams through the sky band. The payout is deliberately mostly
  // COINS (skin money): spectacle without distorting the weekly $ race.
  scene.activateRocket = () => {
    if (scene.activeRocket) return
    scene.activeRocket = true
    const FLY_MS = 5500
    const FLY_Y = 330

    scene.cameras.main.flash(200, 255, 170, 0)
    scene.cameras.main.shake(220, 0.006)

    // Collected mid-slide? Stand up first — flight owns the body from here
    // (the slide's own restore timer is guarded against rocket flight).
    scene.isSliding = false
    scene.basey.setScale(1, 1)
    scene.basey.body.setSize(34, 56, false)
    scene.basey.body.setOffset(7, 2)

    // Lift off: gravity off, glide up to the sky band, then a gentle hover bob
    scene.basey.body.allowGravity = false
    scene.basey.setVelocity(0, 0)
    scene.tweens.add({ targets: scene.basey, y: FLY_Y, duration: 650, ease: 'Sine.easeOut' })
    scene.rocketBob = scene.tweens.add({
      targets: scene.basey, y: FLY_Y + 16, duration: 800, delay: 700,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    })

    // Exhaust flame — recycled particles streaming back from the feet
    scene.rocketFlame = scene.time.addEvent({
      delay: 70, loop: true,
      callback: () => {
        const p = scene.particlePool[scene.particleIdx]
        scene.particleIdx = (scene.particleIdx + 1) % scene.particlePool.length
        scene.tweens.killTweensOf(p)
        p.setPosition(scene.basey.x - 6 + Math.random() * 12, scene.basey.y + 30)
          .setFillStyle(Math.random() < 0.5 ? 0xFF6600 : 0xFFD200, 0.9)
          .setScale(1).setAlpha(0.9).setVisible(true).setActive(true)
        scene.tweens.add({
          targets: p, x: p.x - 40 - Math.random() * 30, y: p.y + 18, alpha: 0,
          scaleX: 0.2, scaleY: 0.2, duration: 320,
          onComplete: () => { p.setVisible(false).setActive(false) },
        })
      },
    })

    // Sky coin trail — a slow sine wave at flight height, hoovered up by the bob
    let phase = 0
    scene.rocketCoins = scene.time.addEvent({
      delay: 210, loop: true,
      callback: () => {
        if (scene.isGameOver) return
        const y = FLY_Y + 12 + Math.sin(phase) * 46
        phase += 0.55
        const c = scene.coins.create(510, y, 'coin')
        if (!c) return
        c.setDisplaySize(28, 28)
        c.setDepth(4)
        c.body.allowGravity = false
        c.setVelocityX(-scene.obstacleSpeed)
        c.baseY = y
        c.bobAmp = 0
        c.phaseShift = 0
      },
    })

    makeTimerBar(scene, 27, 0xFF8800, FLY_MS, 'rocketBar')

    // Touch down: glide back, gravity on, then a short blinking grace window
    // so a low obstacle can't cheap-shot Basey right at the landing spot
    scene.time.delayedCall(FLY_MS, () => {
      scene.rocketFlame?.remove(); scene.rocketFlame = null
      scene.rocketCoins?.remove(); scene.rocketCoins = null
      scene.rocketBob?.stop(); scene.rocketBob = null
      scene.tweens.add({
        targets: scene.basey, y: 683, duration: 550, ease: 'Sine.easeIn',
        onComplete: () => {
          scene.basey.body.allowGravity = true
          scene.activeRocket = false
          scene.rocketGraceUntil = scene.time.now + 1000
          scene.tweens.add({
            targets: scene.basey, alpha: 0.55, duration: 125, yoyo: true, repeat: 3,
            onComplete: () => scene.basey.setAlpha(1),
          })
        },
      })
    })
  }

  scene.activateDouble = () => {
    if (scene.activeDouble) return
    scene.activeDouble = true
    scene.doubleIcon = scene.add.text(400, 100, '2x', {
      fontSize: '24px',
      color: '#FF00FF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setDepth(20)
    makeTimerBar(scene, 21, 0xFF00FF, 10000, 'doubleBar')
    scene.time.delayedCall(10000, () => {
      scene.activeDouble = false
      if (scene.doubleIcon) {
        scene.doubleIcon.destroy()
        scene.doubleIcon = null
      }
    })
  }
}
