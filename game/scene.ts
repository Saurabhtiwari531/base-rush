import { createTextures } from './textures'
import { createAudio } from './audio'
import { createPowerUps, getPowerUpName } from './powerups'

export function createGameConfig(Phaser: any, parent: HTMLElement | null) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600
  return {
    type: Phaser.AUTO,
    width: 480,
    height: 768,
    parent,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_HORIZONTALLY, // canvas sticks to top — no top gap
    },
    // Steady 60fps via rAF; roundPixels avoids sub-pixel blitting cost on mobile
    fps: { target: 60, min: 30, forceSetTimeOut: false },
    render: {
      antialias: !isMobile,
      powerPreference: 'high-performance',
      roundPixels: true,
      // Phaser keeps batching; disable per-frame canvas clear hints not needed
      clearBeforeRender: true,
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 1500 }, debug: false }
    },
    scene: {
      preload: function (this: any) {
        createTextures(this)
      },

      create: function (this: any) {
        ;(window as any).gameReady?.()

        try {
          this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
          // iOS Safari starts AudioContext in suspended state — resume on first tap
          if (this.audioCtx.state === 'suspended') {
            this.input.once('pointerdown', () => {
              this.audioCtx?.resume().catch(() => {})
            })
          }
        } catch (e) {
          this.audioCtx = null
        }

        // Mobile detection — reduce heavy effects on small screens
        const isMobile = window.innerWidth < 600
        this.isMobile = isMobile

        // ── BACKGROUND ──────────────────────────────────────────────────────
        this.add.image(240, 384, 'bg').setDepth(0)
        // Speed-based theme overlays (fade in at 1.2 / 1.5 / 2.0 / 3.0 / 3.5).
        // Start hidden — an alpha-0 fullscreen rect STILL draws on the GPU, so 5
        // of them = 5× wasted fullscreen overdraw every frame. We only flip the
        // active tier visible, keeping at most one fullscreen tint on screen.
        this.themeOverlays = [
          this.add.rectangle(240, 384, 480, 768, 0x553300, 0).setDepth(0.75).setVisible(false), // sunset 1.2x
          this.add.rectangle(240, 384, 480, 768, 0x330066, 0).setDepth(0.75).setVisible(false), // purple 1.5x
          this.add.rectangle(240, 384, 480, 768, 0x550011, 0).setDepth(0.75).setVisible(false), // crimson 2.0x
          this.add.rectangle(240, 384, 480, 768, 0x003311, 0).setDepth(0.75).setVisible(false), // toxic green 3.0x
          this.add.rectangle(240, 384, 480, 768, 0x440099, 0).setDepth(0.75).setVisible(false), // cosmic 3.5x
        ]
        this.lastTheme = 0
        // Pulsing accent overlay for top-tier speeds — hidden until cosmic tier
        this.themePulse = this.add.rectangle(240, 384, 480, 768, 0x00CCFF, 0).setDepth(0.76).setVisible(false)

        // Parallax circuit layer — desktop only. On mobile it's a fullscreen
        // textured layer at alpha 0.07 (near-invisible) for real fillrate cost.
        if (!isMobile) {
          this.bgCircuit = this.add.tileSprite(240, 428, 480, 688, 'bgCircuit')
            .setDepth(0.5).setAlpha(0.07)
        }

        // ── STARS ────────────────────────────────────────────────────────────
        const starCount = isMobile ? 16 : 50
        this.stars = []
        for (let i = 0; i < starCount; i++) {
          const star = this.add.circle(
            Phaser.Math.Between(0, 480),
            Phaser.Math.Between(0, 688),
            Phaser.Math.Between(1, 2),
            i % 5 === 0 ? 0x4499FF : 0xFFFFFF,
            Phaser.Math.FloatBetween(0.12, 0.55)
          ).setDepth(0.6)
          star.speed = Phaser.Math.FloatBetween(0.08, 0.25)
          this.stars.push(star)
        }

        // ── PHYSICS GROUND ───────────────────────────────────────────────────
        this.ground = this.physics.add.staticImage(240, 748, 'ground')
        this.ground.setDisplaySize(480, 40)
        this.ground.refreshBody()
        this.ground.setDepth(2)

        // ── FLOOR UPLIGHT (subtle blue wash rising from ground into sky) ─────
        this.add.rectangle(240, 710, 480, 32, 0x001844, 0.14).setDepth(0.9)

        // ── MOVING NEON GRID FLOOR ──────────────────────────────────────────
        // Sits visually on top of the physics ground; scrolls with game speed
        this.groundGrid = this.add.tileSprite(240, 748, 480, 40, 'groundGrid').setDepth(2.5)

        // ── FLOOR GLOW — 3 stacked layers = soft bloom effect ───────────────
        // Sharp bright line at floor top
        this.floorGlowSharp = this.add.rectangle(240, 728, 480, 2, 0x0077FF, 1.0).setDepth(3.2)
        // Soft mid-glow
        this.floorGlowSoft  = this.add.rectangle(240, 730, 480, 8, 0x0033AA, 0.35).setDepth(3.1)
        // Wide diffuse underglow
        this.add.rectangle(240, 736, 480, 16, 0x001444, 0.18).setDepth(3.0)

        // ── FOG / GROUND HAZE ────────────────────────────────────────────────
        // Cut on mobile — at alpha 0.025–0.065 it's invisible but each ellipse is
        // its own draw call + a per-frame JS update. Pure cost, no benefit.
        const fogCount = isMobile ? 0 : 5
        this.fogPool = []
        for (let i = 0; i < fogCount; i++) {
          const fog = this.add.ellipse(
            Phaser.Math.Between(0, 480),
            728 + Phaser.Math.Between(-6, 18),
            Phaser.Math.Between(80, 150),
            Phaser.Math.Between(10, 22),
            i % 2 === 0 ? 0x0044BB : 0x002266,
            Phaser.Math.FloatBetween(0.025, 0.065)
          ).setDepth(2.8)
          fog.driftSpd = Phaser.Math.FloatBetween(0.3, 0.8)
          this.fogPool.push(fog)
        }

        // ── DATA-FLOW PARTICLES ──────────────────────────────────────────────
        const dataCount = isMobile ? 4 : 8
        this.dataFlow = []
        for (let i = 0; i < dataCount; i++) {
          const bright = i % 3 === 0
          const dot = this.add.circle(
            Phaser.Math.Between(-120, 480),
            728 + (i % 2 === 0 ? -1 : 2),
            bright ? 2.5 : 1.5,
            bright ? 0x00CCFF : 0x0055CC,
            Phaser.Math.FloatBetween(0.5, 0.95)
          ).setDepth(3.4)
          dot.spd = Phaser.Math.FloatBetween(3.5, 7.0)
          this.dataFlow.push(dot)
        }

        // ── FLOOR GLOW TWEENS ────────────────────────────────────────────────
        this.tweens.add({
          targets: this.floorGlowSharp,
          alpha: 0.55, duration: 1500,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        })
        this.tweens.add({
          targets: this.floorGlowSoft,
          alpha: 0.12, duration: 2100,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        })

        // ── ELECTRIC PULSE — periodic bright cyan surge along the floor line ──
        const spawnElectricPulse = () => {
          if (this.isGameOver) return
          // Bright leading dot
          const pulse = this.add.circle(0, 728, 4, 0x00FFFF, 1.0).setDepth(3.5)
          // Trailing glow strip
          const trail = this.add.rectangle(0, 728, 1, 3, 0x00CCFF, 0.6).setDepth(3.45)
          this.tweens.add({
            targets: pulse,
            x: 490, duration: 320,
            ease: 'Linear',
            onUpdate: () => {
              trail.x = pulse.x - 20
              trail.width = 40
            },
            onComplete: () => { pulse.destroy(); trail.destroy() }
          })
        }
        // Random interval 2.5–6 s
        const schedulePulse = () => {
          if (this.isGameOver) return
          this.time.delayedCall(Phaser.Math.Between(2500, 6000), () => {
            spawnElectricPulse()
            schedulePulse()
          })
        }
        schedulePulse()

        // HUD: distance counter (center top) — replaces decorative title for live info
        this.distanceText = this.add.text(240, 22, '0 m', {
          fontSize: '15px', color: '#00FFAA', fontStyle: 'bold', letterSpacing: 3,
          stroke: '#001133', strokeThickness: 4,
        }).setOrigin(0.5, 0).setDepth(10)
        this.lastDistDisplay = 0

        this.basey = this.physics.add.image(80, 683, 'b0').setDepth(4)
        this.basey.setDisplaySize(48, 60)
        this.basey.body.setSize(34, 56)
        this.basey.setBounce(0)
        this.basey.setCollideWorldBounds(true)
        this.physics.add.collider(this.basey, this.ground)

        // Apply equipped skin tint (set by React via window.equippedSkinTint)
        const skinTint = (window as any).equippedSkinTint
        if (typeof skinTint === 'number' && skinTint !== 0xFFFFFF) {
          this.basey.setTint(skinTint)
          this.skinTint = skinTint
        }

        this.baseyGlow = this.add.circle(80, 718, 26, 0xFFFFFF, 0.08).setDepth(1)

        this.score = 0
        this.lastScoreDisplay = 0
        this.scoreText = this.add.text(14, 40, 'SCORE  0', {
          fontSize: '13px', color: '#FFFFFF', fontStyle: 'bold'
        }).setDepth(10)

        this.speedMultiplier = 1.0
        this.lastSpeedDisplay = '1.0'
        this.speedText = this.add.text(466, 40, 'SPEED 1.0x', {
          fontSize: '13px', color: '#00FFFF', fontStyle: 'bold',
          stroke: '#000033', strokeThickness: 3
        }).setOrigin(1, 0).setDepth(10)

        this.combo = 0
        this.comboText = this.add.text(14, 60, '', {
          fontSize: '13px', color: '#FFD700', fontStyle: 'bold'
        }).setDepth(10)
        this.comboText.setVisible(false)

        // ── OBJECT POOLS (avoid per-coin allocation → no GC stutter on mobile) ──
        // Floating "+points" text pool. Phaser Text uploads a GPU texture on every
        // create, so spawning one per coin in a 5-coin row caused visible hitches.
        // Pre-make a ring of reusable texts and recycle them instead.
        this.floatTextPool = []
        for (let i = 0; i < 8; i++) {
          const ft = this.add.text(0, 0, '', {
            fontSize: '15px', color: '#FFD700', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3
          }).setOrigin(0.5).setDepth(12).setVisible(false)
          this.floatTextPool.push(ft)
        }
        this.floatTextIdx = 0

        // Particle circle pool — recycled for coin-collect bursts
        this.particlePool = []
        for (let i = 0; i < 24; i++) {
          const pc = this.add.circle(0, 0, 3, 0xFFCC00, 0.9).setDepth(5).setVisible(false).setActive(false)
          this.particlePool.push(pc)
        }
        this.particleIdx = 0

        // Pre-warm emoji glyph rasterization. The FIRST time an emoji is drawn to
        // a Canvas it must load+rasterize the colour-emoji font — a multi-ms hitch.
        // Render every gameplay emoji once off-screen so the real use is instant.
        const warm = this.add.text(-300, -300, '🛡️🧲⏱️💎🎯🔥', { fontSize: '18px' }).setDepth(-1)
        this.time.delayedCall(60, () => warm.destroy())

        // Reusable power-up notification text (avoids per-pickup emoji text creation)
        this.powerNotif = this.add.text(240, 100, '', {
          fontSize: '18px', color: '#00FFFF', fontStyle: 'bold',
          stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(20).setVisible(false)

        this.activeShield = false
        this.activeMagnet = false
        this.activeSlowMo = false
        this.activeDouble = false
        this.shieldIcon = null
        this.shieldOuter = null
        this.magnetIcon = null
        this.magnetOuter = null
        this.doubleIcon = null

        this.maxLives = 3
        this.lives = 3
        this.renderLives = () => '❤️'.repeat(Math.max(0, this.lives)) + '🖤'.repeat(Math.max(0, this.maxLives - this.lives))
        this.livesText = this.add.text(470, 22, this.renderLives(), { fontSize: '16px' }).setOrigin(1, 0.5).setDepth(10)

        this.obstacles = this.physics.add.group({ maxSize: 15 })
        this.coins = this.physics.add.group({ maxSize: 60 })
        this.powerups = this.physics.add.group({ maxSize: 10 })

        this.obstacleSpeed = 400
        this.maxSpeed = 800
        this.speedIncrease = 0.04

        this.isGameOver = false
        this.isSliding = false
        this.isCountingDown = true
        this.gameTime = 0
        this.jumpCount = 0
        this.lastMilestone = 0
        // Run stats (passed to GameOver)
        this.distance = 0
        this.coinsCollected = 0
        this.topCombo = 0

        createAudio(this)
        createPowerUps(this)

        // Spawn obstacles — track last spawn for coin conflict check
        this.lastObstacleY = 0
        this.lastObstacleSpawnTime = 0
        this.time.addEvent({
          delay: 1600,
          callback: () => {
            if (this.isGameOver || this.isCountingDown) return
            const hasDrones = this.gameTime > 25000
            const roll = Phaser.Math.Between(0, hasDrones ? 4 : 3)
            if (hasDrones && roll >= 4) {
              // Flying drone — player must SLIDE under it
              const o = this.obstacles.create(510, 660, 'obsDrone')
              o.setDisplaySize(50, 28)
              o.body.setSize(28, 13)
              o.body.allowGravity = false
              o.setVelocityX(-this.obstacleSpeed)
              o.obsType = 'drone'
              o.setDepth(4)
              this.lastObstacleY = 660
              this.tweens.add({ targets: o, y: o.y - 10, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
            } else if (roll <= 1) {
              const o = this.obstacles.create(510, 703, 'obsH')
              o.setDisplaySize(38, 50)
              o.body.setSize(28, 42)
              o.body.allowGravity = false
              o.setVelocityX(-this.obstacleSpeed)
              o.obsType = 'high'
              o.setDepth(4)
              this.lastObstacleY = 703
            } else {
              const o = this.obstacles.create(510, 676, 'obsL')
              o.setDisplaySize(90, 22)
              o.body.setSize(74, 14)
              o.body.allowGravity = false
              o.setVelocityX(-this.obstacleSpeed)
              o.obsType = 'low'
              o.setDepth(4)
              this.lastObstacleY = 676
            }
            this.lastObstacleSpawnTime = this.time.now
          },
          loop: true
        })

        // Spawn coins in rows of 3–5 — bobbing driven by update loop (no repeat tweens)
        this.time.addEvent({
          delay: 1800,
          callback: () => {
            if (this.isGameOver || this.isCountingDown) return

            const nearbyObs = (this.obstacles.getChildren() as any[])
              .filter((o: any) => o.x > 260 && o.x < 530)
            const coinY = nearbyObs.length > 0
              ? Phaser.Math.Between(573, 603)
              : Phaser.Math.Between(590, 635)

            const count = Phaser.Math.Between(3, 5)
            for (let i = 0; i < count; i++) {
              const c = this.coins.create(510 + i * 42, coinY, 'coin')
              if (!c) continue
              c.setDisplaySize(28, 28)
              c.setDepth(4)
              c.body.allowGravity = false
              c.setVelocityX(-this.obstacleSpeed)
              c.baseY = coinY
              c.phaseShift = i * 0.9
            }
          },
          loop: true
        })

        // Spawn power-ups
        this.time.addEvent({
          delay: 12000,
          callback: () => {
            if (this.isGameOver || this.isCountingDown) return
            const types = ['powerShield', 'powerMagnet', 'powerSlow', 'power2x']
            const randomType = Phaser.Math.RND.pick(types)
            const p = this.powerups.create(510, Phaser.Math.Between(578, 648), randomType)
            p.setDisplaySize(35, 35)
            p.setDepth(4)
            p.body.allowGravity = false
            p.setVelocityX(-this.obstacleSpeed)
            p.powerType = randomType
            this.tweens.add({ targets: p, y: p.y - 15, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
            this.tweens.add({ targets: p, alpha: 0.6, duration: 400, yoyo: true, repeat: -1 })
          },
          loop: true
        })

        // Obstacle hit
        this.physics.add.overlap(this.basey, this.obstacles, (_b: any, obs: any) => {
          if (this.isGameOver) return
          obs.destroy()

          if (this.activeShield) {
            this.activeShield = false
            ;[this.shieldIcon, this.shieldOuter].forEach((obj: any) => {
              if (obj) this.tweens.add({
                targets: obj, scaleX: 2.2, scaleY: 2.2, alpha: 0, duration: 300,
                onComplete: () => obj.destroy()
              })
            })
            this.shieldIcon = null
            this.shieldOuter = null
            if (this.shieldBar) { this.shieldBar.destroy(); this.shieldBar = null }
            const msg = this.add.text(240, 200, 'SHIELD BROKEN!', {
              fontSize: '16px', color: '#00FFFF', fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(20)
            this.tweens.add({ targets: msg, alpha: 0, duration: 1000, onComplete: () => msg.destroy() })
            return
          }

          this.lives -= 1
          this.combo = 0
          this.comboText.setVisible(false)
          this.cameras.main.shake(200, 0.015)
          this.basey.setTint(0xFF3333)
          this.playHitSound()
          this.time.delayedCall(280, () => {
            if (this.isGameOver) return
            this.basey.clearTint()
            if (this.skinTint) this.basey.setTint(this.skinTint)
          })

          this.livesText.setText(this.renderLives())
          if (this.lives <= 0) {
            this.isGameOver = true
            this.physics.pause()
            // Explosion burst
            const dc = [0xFF4444, 0xFF8800, 0xFFFF00, 0xFF0088, 0x00CCFF, 0xFFFFFF]
            for (let i = 0; i < 24; i++) {
              const a = (Math.PI * 2 * i) / 24
              const dist = Phaser.Math.Between(55, 170)
              const ep = this.add.circle(
                this.basey.x, this.basey.y,
                Phaser.Math.Between(3, 9), dc[i % dc.length], 1.0
              ).setDepth(15)
              this.tweens.add({ targets: ep,
                x: this.basey.x + Math.cos(a) * dist,
                y: this.basey.y + Math.sin(a) * dist,
                alpha: 0, scaleX: 0.1, scaleY: 0.1,
                duration: Phaser.Math.Between(400, 850),
                onComplete: () => ep.destroy() })
            }
            this.cameras.main.flash(350, 255, 60, 60)
            this.tweens.add({ targets: this.basey, angle: 360, scaleX: 0, scaleY: 0, alpha: 0, duration: 650 })
            this.stopBGM?.()
            ;(window as any).onCoinsEarned?.(this.coinsCollected)
            if (!this.scoreSubmitted) {
              this.scoreSubmitted = true
              ;(window as any).handleGameOver?.(this.score, {
                distance: Math.floor(this.distance),
                coins: this.coinsCollected,
                topCombo: this.topCombo,
                duration: Math.floor(this.gameTime / 1000),
                topSpeed: parseFloat(this.speedMultiplier.toFixed(1)),
              })
            }
          }
        })

        // Coin collect — pooled effects, zero per-coin allocation
        const burstColors = [0xFFCC00, 0x0052FF, 0xFFFFFF, 0xFFDD44, 0x1A6EFF]
        this.physics.add.overlap(this.basey, this.coins, (_b: any, coin: any) => {
          const coinX = coin.x
          const coinY = coin.y
          coin.destroy()

          this.combo += 1
          this.coinsCollected += 1
          if (this.combo > this.topCombo) this.topCombo = this.combo
          let points = 10
          let multiplier = 1
          if (this.combo >= 10) { multiplier = 3; points = 30 }
          else if (this.combo >= 5) { multiplier = 2; points = 20 }
          if (this.activeDouble) points = points * 2

          this.score += points

          if (this.combo >= 3) {
            this.comboText.setText(`🔥 COMBO x${this.combo}`)
            this.comboText.setVisible(true)
            if (this.combo >= 5) this.comboText.setColor('#FF00FF')
          }

          this.playCoinSound()

          // Particle burst — recycle from pool (3 on mobile, 6 desktop)
          const pCount = this.isMobile ? 3 : 6
          for (let i = 0; i < pCount; i++) {
            const angle = (Math.PI * 2 * i) / pCount
            const dist = Phaser.Math.Between(36, 70)
            const p = this.particlePool[this.particleIdx]
            this.particleIdx = (this.particleIdx + 1) % this.particlePool.length
            this.tweens.killTweensOf(p)
            p.setPosition(coinX, coinY).setFillStyle(burstColors[i % burstColors.length], 0.9)
              .setScale(1).setAlpha(0.9).setVisible(true).setActive(true)
            this.tweens.add({
              targets: p,
              x: coinX + Math.cos(angle) * dist,
              y: coinY + Math.sin(angle) * dist,
              alpha: 0, scaleX: 0.1, scaleY: 0.1,
              duration: 300,
              onComplete: () => { p.setVisible(false).setActive(false) }
            })
          }

          // Floating "+points" text — recycle from pool (no GPU texture churn)
          const t = this.floatTextPool[this.floatTextIdx]
          this.floatTextIdx = (this.floatTextIdx + 1) % this.floatTextPool.length
          this.tweens.killTweensOf(t)
          t.setText(multiplier > 1 ? `+${points} (x${multiplier})` : `+${points}`)
            .setColor(multiplier > 1 ? '#FF00FF' : '#FFD700')
            .setPosition(this.basey.x, this.basey.y - 30)
            .setAlpha(1).setVisible(true)
          this.tweens.add({
            targets: t, y: this.basey.y - 70, alpha: 0, duration: 600,
            onComplete: () => t.setVisible(false)
          })
        })

        // Power-up collect
        this.physics.add.overlap(this.basey, this.powerups, (_b: any, powerup: any) => {
          const type = powerup.powerType
          powerup.destroy()
          this.playCoinSound()

          if (type === 'powerShield') this.activateShield()
          else if (type === 'powerMagnet') this.activateMagnet()
          else if (type === 'powerSlow') this.activateSlowMo()
          else if (type === 'power2x') this.activateDouble()

          // Reuse the pre-warmed notification text (no per-pickup emoji rasterize)
          const notif = this.powerNotif
          this.tweens.killTweensOf(notif)
          notif.setText(getPowerUpName(type)).setPosition(240, 100).setAlpha(1).setVisible(true)
          this.tweens.add({ targets: notif, y: 60, alpha: 0, duration: 2000, ease: 'Power2',
            onComplete: () => notif.setVisible(false) })
        })

        // Jump effect
        const jumpEffect = () => {
          for (let i = 0; i < 8; i++) {
            const p = this.add.circle(
              this.basey.x + Phaser.Math.Between(-16, 16),
              this.basey.y + 28,
              Phaser.Math.Between(2, 5), 0x00FFFF, 0.9
            )
            this.tweens.add({ targets: p, y: p.y + 22, alpha: 0, scaleX: 0.3, scaleY: 0.3, duration: 380, onComplete: () => p.destroy() })
          }
        }

        const doJump = () => {
          if (this.isGameOver || this.isCountingDown) return
          if (this.basey.body.blocked.down) {
            this.basey.setVelocityY(-650)
            this.jumpCount = 1
            jumpEffect()
            this.playJumpSound()
          } else if (this.jumpCount === 1) {
            // Double jump — slightly weaker, pink ring burst
            this.basey.setVelocityY(-520)
            this.jumpCount = 2
            for (let i = 0; i < 10; i++) {
              const a = (Math.PI * 2 * i) / 10
              const p = this.add.circle(
                this.basey.x + Math.cos(a) * 10,
                this.basey.y + Math.sin(a) * 10,
                3, 0xFF00FF, 0.9
              ).setDepth(5)
              this.tweens.add({ targets: p,
                x: this.basey.x + Math.cos(a) * 34,
                y: this.basey.y + Math.sin(a) * 34,
                alpha: 0, duration: 320, onComplete: () => p.destroy() })
            }
            this.playJumpSound()
          }
        }

        const doSlide = () => {
          if (this.isSliding || !this.basey.body.blocked.down || this.isGameOver || this.isCountingDown) return
          this.isSliding = true
          this.slideLockedY = this.basey.y
          this.basey.setScale(1.4, 0.4)
          this.basey.setY(this.slideLockedY + 18)
          // FIX: shrink physics hitbox to bottom strip so low obstacles don't hit during slide
          // Sprite is 48×60; body (34×18) offset to bottom 18px keeps feet colliding with ground
          this.basey.body.setSize(34, 18, false)
          this.basey.body.setOffset(7, 40)
          // Slow-mo mein obstacle zyada der lagta hai pass hone mein — slide extend karo
          const slideDuration = this.activeSlowMo ? 950 : 600
          this.time.delayedCall(slideDuration, () => {
            this.isSliding = false
            this.basey.setScale(1, 1)
            // Restore full hitbox (centred on 48×60 sprite)
            this.basey.body.setSize(34, 56, false)
            this.basey.body.setOffset(7, 2)
            this.basey.setY(this.slideLockedY)
            this.slideLockedY = null
          })
        }

        this.input.keyboard?.on('keydown-SPACE', doJump)
        this.input.keyboard?.on('keydown-UP', doJump)
        this.input.keyboard?.on('keydown-DOWN', doSlide)

        // Expose to React so the full-screen container can forward touches
        ;(window as any).gameJumpInput = doJump
        ;(window as any).gameSlideInput = doSlide

        let sx = 0, sy = 0
        this.input.on('pointerdown', (p: any) => { sx = p.x; sy = p.y })
        this.input.on('pointerup', (p: any) => {
          if (this.isGameOver) return
          const dx = p.x - sx
          const dy = p.y - sy
          const adx = Math.abs(dx)
          const ady = Math.abs(dy)
          if (adx < 15 && ady < 15) doJump()
          else if (ady > adx) { if (dy < 0) doJump(); else doSlide() }
        })

        // 3-2-1 GO! countdown — dim backdrop + big number + glow ring
        const countdownDim = this.add.rectangle(240, 384, 480, 768, 0x000022, 0.55).setDepth(100)
        const countItems = [
          { text: '3', color: '#FF4444' },
          { text: '2', color: '#FFAA00' },
          { text: '1', color: '#FFFF00' },
          { text: 'GO!', color: '#00FF66' },
        ]
        let ci = 0
        const nextCount = () => {
          if (ci >= countItems.length) {
            this.isCountingDown = false
            this.startBGM?.()
            this.tweens.add({ targets: countdownDim, alpha: 0, duration: 250,
              onComplete: () => countdownDim.destroy() })
            return
          }
          const { text, color } = countItems[ci]
          const isGo = ci === 3
          // Glow ring behind number
          const ring = this.add.circle(240, 384, 90, Phaser.Display.Color.HexStringToColor(color).color, 0.18)
            .setDepth(101).setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(color).color, 0.9)
          const ct = this.add.text(240, 384, text, {
            fontSize: isGo ? '90px' : '120px',
            color, fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 10,
          }).setOrigin(0.5).setDepth(102).setScale(0.3).setAlpha(0)
          ring.setScale(0.3).setAlpha(0)
          this.tweens.add({
            targets: [ct, ring], alpha: 1, scaleX: 1, scaleY: 1,
            duration: 180, ease: 'Back.easeOut',
            onComplete: () => {
              this.tweens.add({
                targets: [ct, ring], alpha: 0, scaleX: 1.8, scaleY: 1.8,
                delay: 600, duration: 250,
                onComplete: () => { ct.destroy(); ring.destroy(); ci++; nextCount() }
              })
            }
          })
        }
        nextCount()

        this.runFrame = 0
        this.frameTimer = 0
        this.scoreSubmitted = false
      },

      update: function (this: any, _t: number, delta: number) {
        if (this.isGameOver || this.isCountingDown) return

        if (this.activeMagnet) {
          this.coins.getChildren().forEach((coin: any) => {
            const distance = Phaser.Math.Distance.Between(this.basey.x, this.basey.y, coin.x, coin.y)
            if (distance < 120) this.physics.moveToObject(coin, this.basey, 300)
          })
          if (this.magnetIcon) this.magnetIcon.setPosition(this.basey.x, this.basey.y)
          if (this.magnetOuter) this.magnetOuter.setPosition(this.basey.x, this.basey.y)
        }

        if (this.shieldIcon) this.shieldIcon.setPosition(this.basey.x, this.basey.y)
        if (this.shieldOuter) this.shieldOuter.setPosition(this.basey.x, this.basey.y)

        if (this.isSliding && this.slideLockedY !== null) {
          this.basey.y = this.slideLockedY + 18
          this.basey.body.velocity.y = 0
        }

        // Reset double jump when landing
        if (this.basey.body.blocked.down) this.jumpCount = 0

        this.score += 0.08 * this.speedMultiplier
        this.gameTime += delta
        // Distance: pixels travelled / 30 = meters (feels right for the canvas scale)
        this.distance += (this.obstacleSpeed * delta) / (1000 * 30)
        const distInt = Math.floor(this.distance)
        if (distInt !== this.lastDistDisplay) {
          this.lastDistDisplay = distInt
          this.distanceText.setText(distInt + ' m')
        }
        // Only call setText when the integer value actually changes (saves CPU every frame)
        const scoreInt = Math.floor(this.score)
        if (scoreInt !== this.lastScoreDisplay) {
          this.lastScoreDisplay = scoreInt
          this.scoreText.setText('SCORE  ' + scoreInt)
          // Milestone celebration
          const milestones = [500, 1000, 2000, 5000, 10000]
          const hit = milestones.find(m => m > this.lastMilestone && scoreInt >= m)
          if (hit) {
            this.lastMilestone = hit
            const msg = this.add.text(240, 360, `🎯 ${hit.toLocaleString()}!`, {
              fontSize: '28px', color: '#FFD700', fontStyle: 'bold',
              stroke: '#000000', strokeThickness: 5
            }).setOrigin(0.5).setDepth(20)
            this.cameras.main.flash(220, 255, 215, 0)
            this.tweens.add({ targets: msg, y: 260, scaleX: 1.2, scaleY: 1.2, alpha: 0,
              duration: 1400, ease: 'Power2', onComplete: () => msg.destroy() })
          }
        }

        if (this.obstacleSpeed < this.maxSpeed) {
          this.obstacleSpeed += this.speedIncrease
          this.speedMultiplier = Math.min(4.0, this.obstacleSpeed / 400)
          const speedStr = this.speedMultiplier.toFixed(1)
          // Only call setText when displayed value actually changes (saves CPU every frame)
          if (speedStr !== this.lastSpeedDisplay) {
            this.lastSpeedDisplay = speedStr
            this.speedText.setText(`SPEED ${speedStr}x`)
            if (this.speedMultiplier >= 3.0) this.speedText.setColor('#FF0000')
            else if (this.speedMultiplier >= 2.0) this.speedText.setColor('#FF00FF')
            else if (this.speedMultiplier >= 1.5) this.speedText.setColor('#FFFF00')
            else this.speedText.setColor('#00FFFF')
          }

          // Re-apply velocities only when speed drifted ≥3px/s (was every frame on
          // every object — pure waste since speed climbs just 0.04px/frame).
          if (Math.abs(this.obstacleSpeed - (this.lastVelApplied || 0)) >= 3) {
            this.lastVelApplied = this.obstacleSpeed
            this.obstacles.getChildren().forEach((o: any) => { o.setVelocityX(-this.obstacleSpeed) })
            this.coins.getChildren().forEach((c: any) => { c.setVelocityX(-this.obstacleSpeed) })
            this.powerups.getChildren().forEach((p: any) => { p.setVelocityX(-this.obstacleSpeed) })
          }

          // Background theme shift — 5 tiers (1.2 / 1.5 / 2.0 / 3.0 / 3.5)
          const newTheme = this.speedMultiplier >= 3.5 ? 5
            : this.speedMultiplier >= 3.0 ? 4
            : this.speedMultiplier >= 2.0 ? 3
            : this.speedMultiplier >= 1.5 ? 2
            : this.speedMultiplier >= 1.2 ? 1 : 0
          if (newTheme !== this.lastTheme) {
            this.lastTheme = newTheme
            this.themeOverlays.forEach((ov: any, i: number) => {
              const active = newTheme === i + 1
              if (active) ov.setVisible(true)   // show before fading in
              this.tweens.add({
                targets: ov, alpha: active ? 0.25 : 0, duration: 2000,
                // hide once faded out so it stops costing fullscreen overdraw
                onComplete: () => { if (!active) ov.setVisible(false) }
              })
            })
            // Cosmic tier: start pulsing cyan strobe
            if (newTheme === 5 && this.themePulse && !this.themePulseActive) {
              this.themePulseActive = true
              this.themePulse.setVisible(true)
              this.tweens.add({
                targets: this.themePulse, alpha: 0.12,
                duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
              })
            } else if (newTheme < 5 && this.themePulseActive) {
              this.themePulseActive = false
              this.tweens.killTweensOf(this.themePulse)
              this.tweens.add({
                targets: this.themePulse, alpha: 0, duration: 800,
                onComplete: () => this.themePulse.setVisible(false)
              })
            }
          }
        }

        this.stars?.forEach((star: any) => {
          star.x -= star.speed * this.speedMultiplier
          if (star.x < -10) star.x = 490
        })

        // ── ENVIRONMENT ANIMATIONS ─────────────────────────────────────────
        // Scroll neon grid floor in sync with obstacle speed
        if (this.groundGrid) this.groundGrid.tilePositionX += this.obstacleSpeed / 60
        // Scroll far parallax circuit layer (8× slower = depth effect)
        if (this.bgCircuit) this.bgCircuit.tilePositionX += this.obstacleSpeed / (60 * 8)

        // Fog: drift left slowly, rise slightly, reset when out of view
        this.fogPool?.forEach((fog: any) => {
          fog.x -= fog.driftSpd * Math.min(this.speedMultiplier, 2)
          fog.y -= 0.06
          if (fog.x < -120 || fog.y < 706) {
            fog.x = 490 + Phaser.Math.Between(0, 100)
            fog.y = 730 + Phaser.Math.Between(0, 16)
          }
        })

        // Data-flow dots: race at fixed speed (atmospheric, not gameplay-scaled)
        this.dataFlow?.forEach((dot: any) => {
          dot.x -= dot.spd
          if (dot.x < -10) {
            dot.x = 490 + Phaser.Math.Between(0, 240)
            dot.y = 728 + (Math.random() < 0.5 ? -1 : 2)
          }
        })

        if (this.speedMultiplier >= 2.5 && Math.random() < (this.isMobile ? 0.01 : 0.03)) {
          this.cameras.main.shake(50, 0.002)
        }

        // Speed streaks — horizontal light trails at high speed (desktop only, less frequent)
        if (!this.isMobile && this.speedMultiplier >= 2.0 && Math.random() < 0.03 * (this.speedMultiplier - 1.5)) {
          const sy = Phaser.Math.Between(80, 710)
          const sw = Phaser.Math.Between(25, 70)
          const alpha = Phaser.Math.FloatBetween(0.15, 0.35)
          const col = Math.random() < 0.5 ? 0x00FFFF : 0x0088FF
          const streak = this.add.rectangle(490 + sw / 2, sy, sw, 1, col, alpha).setDepth(1)
          this.tweens.add({
            targets: streak, x: -60, alpha: 0,
            duration: Math.round(180 / this.speedMultiplier),
            onComplete: () => streak.destroy()
          })
        }

        this.baseyGlow.setPosition(this.basey.x, this.basey.y + 22)

        const animSpeed = Math.max(50, 140 - (this.speedMultiplier - 1) * 40)
        if (this.isSliding) {
          this.basey.setTexture('b0')
          this.frameTimer = 0
        } else if (this.basey.body.blocked.down) {
          this.frameTimer += delta
          if (this.frameTimer > animSpeed) {
            this.frameTimer = 0
            this.runFrame = this.runFrame === 0 ? 1 : 0
            this.basey.setTexture('b' + this.runFrame)
          }
        } else {
          this.basey.setTexture('bj')
        }

        // Coin bobbing — update-loop driven, no repeat tweens (better mobile perf)
        if (!this.activeMagnet) {
          const bobT = this.time.now * 0.003
          this.coins.getChildren().forEach((c: any) => {
            if (c.active && c.baseY !== undefined) {
              c.y = c.baseY + Math.sin(bobT + c.phaseShift) * 7
            }
          })
        }

        this.obstacles.getChildren().forEach((o: any) => { if (o.x < -100) o.destroy() })
        this.coins.getChildren().forEach((c: any) => { if (c.x < -100) c.destroy() })
        this.powerups.getChildren().forEach((p: any) => { if (p.x < -100) p.destroy() })
      }
    }
  }
}
