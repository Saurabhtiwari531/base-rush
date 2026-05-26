export function getPowerUpName(type: string): string {
  if (type === 'powerShield') return '🛡️ SHIELD'
  if (type === 'powerMagnet') return '🧲 MAGNET'
  if (type === 'powerSlow') return '⏱️ SLOW-MO'
  if (type === 'power2x') return '💎 2x POINTS'
  return 'POWER-UP'
}

export function createPowerUps(scene: any) {
  scene.activateShield = () => {
    if (scene.activeShield) return
    scene.activeShield = true
    // Outer ambient ring
    scene.shieldOuter = scene.add.circle(scene.basey.x, scene.basey.y, 44, 0x00CCFF, 0.06).setDepth(3)
    scene.shieldOuter.setStrokeStyle(1, 0x00CCFF, 0.35)
    // Inner glowing shield ring
    scene.shieldIcon = scene.add.circle(scene.basey.x, scene.basey.y, 34, 0x00FFFF, 0.22).setDepth(3)
    scene.shieldIcon.setStrokeStyle(2.5, 0x00FFFF, 1)
    // Pulse tween on inner ring
    scene.tweens.add({
      targets: scene.shieldIcon,
      scaleX: 1.12, scaleY: 1.12, alpha: 0.08,
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    })
    scene.time.delayedCall(10000, () => {
      scene.activeShield = false
      ;[scene.shieldIcon, scene.shieldOuter].forEach(obj => {
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
    // Outer field ring (large)
    scene.magnetOuter = scene.add.circle(scene.basey.x, scene.basey.y, 95, 0xFF6600, 0.05).setDepth(3)
    scene.magnetOuter.setStrokeStyle(1, 0xFF8800, 0.2)
    // Inner field ring
    scene.magnetIcon = scene.add.circle(scene.basey.x, scene.basey.y, 65, 0xFF8800, 0.08).setDepth(3)
    scene.magnetIcon.setStrokeStyle(1.5, 0xFFAA00, 0.4)
    // Pulse animation on inner ring
    scene.tweens.add({
      targets: scene.magnetIcon,
      scaleX: 1.08, scaleY: 1.08, alpha: 0.18,
      duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    })
    scene.time.delayedCall(8000, () => {
      scene.activeMagnet = false
      ;[scene.magnetIcon, scene.magnetOuter].forEach(obj => {
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
    scene.slowMoOverlay = scene.add.rectangle(240, 320, 480, 640, 0x6600FF, 0.08).setDepth(50)
    // After 5s, restore to current speed (which has been naturally increasing during slow-mo)
    // rather than the frozen pre-slowmo value to avoid jarring speed jump
    scene.time.delayedCall(5000, () => {
      scene.activeSlowMo = false
      // Speed has been drifting up during slow-mo; normalise back to the ratio it should be
      scene.obstacleSpeed = Math.min(scene.maxSpeed, scene.obstacleSpeed / 0.58)
      if (scene.slowMoOverlay) {
        scene.slowMoOverlay.destroy()
        scene.slowMoOverlay = null
      }
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
    scene.time.delayedCall(10000, () => {
      scene.activeDouble = false
      if (scene.doubleIcon) {
        scene.doubleIcon.destroy()
        scene.doubleIcon = null
      }
    })
  }
}
