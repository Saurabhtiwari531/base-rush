import { createTextures } from './textures'
import { createAudio } from './audio'
import { createPowerUps, getPowerUpName } from './powerups'

export function createGameConfig(Phaser: any, parent: HTMLElement | null) {
  return {
    type: Phaser.AUTO,
    width: 480,
    height: 768,
    parent,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_HORIZONTALLY, // canvas sticks to top — no top gap
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

        // Parallax circuit layer (depth 0.5, very faint — scrolls 8× slower)
        this.bgCircuit = this.add.tileSprite(240, 428, 480, 688, 'bgCircuit')
          .setDepth(0.5).setAlpha(0.07)

        // ── STARS ────────────────────────────────────────────────────────────
        const starCount = isMobile ? 28 : 50
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
        const fogCount = isMobile ? 3 : 5
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
        const dataCount = isMobile ? 5 : 8
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

        // HUD title — no box, neon blue text
        this.add.text(240, 22, 'BASE RUSH', {
          fontSize: '16px', color: '#4488FF', fontStyle: 'bold', letterSpacing: 6,
          stroke: '#000022', strokeThickness: 4,
        }).setOrigin(0.5).setDepth(10)

        this.basey = this.physics.add.image(80, 683, 'b0').setDepth(4)
        this.basey.setDisplaySize(48, 60)
        this.basey.body.setSize(34, 56)
        this.basey.setBounce(0)
        this.basey.setCollideWorldBounds(true)
        this.physics.add.collider(this.basey, this.ground)

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

        this.activeShield = false
        this.activeMagnet = false
        this.activeSlowMo = false
        this.activeDouble = false
        this.shieldIcon = null
        this.shieldOuter = null
        this.magnetIcon = null
        this.magnetOuter = null
        this.slowIcon = null
        this.doubleIcon = null

        this.lives = 3
        this.livesText = this.add.text(468, 22, '❤️ ❤️ ❤️', { fontSize: '16px' }).setOrigin(1, 0.5).setDepth(10)

        this.obstacles = this.physics.add.group()
        this.coins = this.physics.add.group()
        this.powerups = this.physics.add.group()

        this.obstacleSpeed = 400
        this.maxSpeed = 800
        this.speedIncrease = 0.04

        this.isGameOver = false
        this.isSliding = false
        this.gameTime = 0

        createAudio(this)
        createPowerUps(this)

        // Spawn obstacles — track last spawn for coin conflict check
        this.lastObstacleY = 0
        this.lastObstacleSpawnTime = 0
        this.time.addEvent({
          delay: 1600,
          callback: () => {
            if (this.isGameOver) return
            if (Phaser.Math.Between(0, 1) === 0) {
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

        // Spawn coins — obstacles live at y=548–575, so coins must stay above y=520
        this.time.addEvent({
          delay: 1800,
          callback: () => {
            if (this.isGameOver) return

            // Wider detection zone: 260–530 catches obstacles at spawn point too
            const nearbyObs = (this.obstacles.getChildren() as any[])
              .filter((o: any) => o.x > 260 && o.x < 530)

            // Always keep coins above the obstacle danger zone
            const coinY = nearbyObs.length > 0
              ? Phaser.Math.Between(573, 603)   // obstacle nearby → force jump-height coin
              : Phaser.Math.Between(588, 638)   // no obstacle → comfortable mid-air coin

            const c = this.coins.create(510, coinY, 'coin')
            c.setDisplaySize(28, 28)
            c.setDepth(4)
            c.body.allowGravity = false
            c.setVelocityX(-this.obstacleSpeed)
            // Single bounce tween only — rotate/scale tweens skipped for mobile performance
            this.tweens.add({ targets: c, y: c.y - 10, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
          },
          loop: true
        })

        // Spawn power-ups
        this.time.addEvent({
          delay: 12000,
          callback: () => {
            if (this.isGameOver) return
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
          this.time.delayedCall(280, () => { if (!this.isGameOver) this.basey.clearTint() })

          if (this.lives === 2) this.livesText.setText('❤️ ❤️ 🖤')
          if (this.lives === 1) this.livesText.setText('❤️ 🖤 🖤')
          if (this.lives <= 0) {
            this.livesText.setText('🖤 🖤 🖤')
            this.isGameOver = true
            this.physics.pause()
            this.basey.setTint(0xFF0000)
            if (!this.scoreSubmitted) {
              this.scoreSubmitted = true
              ;(window as any).handleGameOver?.(this.score)
            }
          }
        })

        // Coin collect
        this.physics.add.overlap(this.basey, this.coins, (_b: any, coin: any) => {
          const coinX = coin.x
          const coinY = coin.y
          coin.destroy()

          // Flash burst at collection point
          const flash = this.add.circle(coinX, coinY, 16, 0xFFDD44, 0.75).setDepth(6)
          this.tweens.add({ targets: flash, scaleX: 2.5, scaleY: 2.5, alpha: 0, duration: 220, onComplete: () => flash.destroy() })

          // Lightweight particle burst — no physics bodies, tween-only (mobile-friendly)
          const burstColors = [0xFFCC00, 0x0052FF, 0xFFFFFF, 0xFFDD44, 0x1A6EFF]
          const pCount = this.isMobile ? 5 : 8
          for (let i = 0; i < pCount; i++) {
            const angle = (Math.PI * 2 * i) / pCount
            const dist = Phaser.Math.Between(40, 80)
            const color = burstColors[i % burstColors.length]
            const particle = this.add.circle(coinX, coinY, Phaser.Math.Between(2, 4), color, 0.9).setDepth(5)
            this.tweens.add({
              targets: particle,
              x: coinX + Math.cos(angle) * dist,
              y: coinY + Math.sin(angle) * dist,
              alpha: 0, scaleX: 0.1, scaleY: 0.1,
              duration: 300, onComplete: () => particle.destroy()
            })
          }

          this.combo += 1
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

          const t = this.add.text(
            this.basey.x, this.basey.y - 30,
            multiplier > 1 ? `+${points} (x${multiplier})` : `+${points}`,
            {
              fontSize: multiplier > 1 ? '18px' : '15px',
              color: multiplier > 1 ? '#FF00FF' : '#FFD700',
              fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
            }
          )
          this.tweens.add({ targets: t, y: t.y - 40, alpha: 0, duration: 600, onComplete: () => t.destroy() })
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

          const notif = this.add.text(240, 100, getPowerUpName(type), {
            fontSize: '18px', color: '#00FFFF', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
          }).setOrigin(0.5).setDepth(20)
          this.tweens.add({ targets: notif, y: 60, alpha: 0, duration: 2000, ease: 'Power2', onComplete: () => notif.destroy() })
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
          if (this.basey.body.blocked.down && !this.isGameOver) {
            this.basey.setVelocityY(-650)
            jumpEffect()
            this.playJumpSound()
          }
        }

        const doSlide = () => {
          if (this.isSliding || !this.basey.body.blocked.down || this.isGameOver) return
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

        this.runFrame = 0
        this.frameTimer = 0
        this.scoreSubmitted = false
      },

      update: function (this: any, _t: number, delta: number) {
        if (this.isGameOver) return

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

        this.score += 0.08 * this.speedMultiplier
        this.gameTime += delta
        // Only call setText when the integer value actually changes (saves CPU every frame)
        const scoreInt = Math.floor(this.score)
        if (scoreInt !== this.lastScoreDisplay) {
          this.lastScoreDisplay = scoreInt
          this.scoreText.setText('SCORE  ' + scoreInt)
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

          this.obstacles.getChildren().forEach((o: any) => { o.setVelocityX(-this.obstacleSpeed) })
          this.coins.getChildren().forEach((c: any) => { c.setVelocityX(-this.obstacleSpeed) })
          this.powerups.getChildren().forEach((p: any) => { p.setVelocityX(-this.obstacleSpeed) })
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

        this.obstacles.getChildren().forEach((o: any) => { if (o.x < -100) o.destroy() })
        this.coins.getChildren().forEach((c: any) => { if (c.x < -100) c.destroy() })
        this.powerups.getChildren().forEach((p: any) => { if (p.x < -100) p.destroy() })
      }
    }
  }
}
