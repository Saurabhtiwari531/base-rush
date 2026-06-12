import { createTextures } from './textures'
import { createAudio } from './audio'
import { createPowerUps, getPowerUpName } from './powerups'

// opts.demo → silent attract mode for the browser-gate screen: no audio, no
// countdown, no window callbacks; an autopilot plays and the scene restarts
// itself after a crash. Gameplay code is otherwise identical, so the demo
// always looks exactly like the real game.
export function createGameConfig(Phaser: any, parent: HTMLElement | null, opts: { demo?: boolean } = {}) {
  const demo = !!opts.demo
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
    // Steady 60fps via rAF; Phaser's smoothStep evens out frame-delta spikes
    fps: { target: 60, min: 30, forceSetTimeOut: false },
    render: {
      antialias: !isMobile,
      powerPreference: 'high-performance',
      // roundPixels OFF for smooth motion. Basey moves only a fraction of a pixel
      // per frame near the top of a jump; snapping render positions to whole
      // pixels made that arc look steppy/jittery once the 480×768 canvas scales
      // up to a phone screen. Sub-pixel positions interpolate smoothly instead.
      roundPixels: false,
      // Phaser keeps batching; disable per-frame canvas clear hints not needed
      clearBeforeRender: true,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 1500 },
        debug: false,
        // Sync physics to the real render rate instead of a fixed 60 Hz step.
        // On 90/120 Hz phones a fixed 60 Hz step moves the sprite only every
        // other frame → subtle judder on the smooth vertical jump arc. Stepping
        // every rendered frame makes the jump arc smooth at any refresh rate.
        fixedStep: false,
      }
    },
    scene: {
      preload: function (this: any) {
        // Skip on demo-mode scene.restart(): the keys already exist and
        // re-generating them would only spam "key in use" warnings.
        if (!this.textures.exists('coin')) createTextures(this)
      },

      create: function (this: any) {
        if (!demo) (window as any).gameReady?.()

        if (demo) {
          // Attract mode is always silent — never create an AudioContext.
          // Every play*Sound/BGM helper no-ops when audioCtx is null.
          this.audioCtx = null
        } else try {
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

        // ── ADAPTIVE QUALITY ────────────────────────────────────────────────
        // The Base App runs the game in an in-app WebView (like Telegram mini
        // games) which can be slower than Chrome. We sample FPS and auto-scale
        // decorative effects so weak phones / WebViews stay smooth. Gameplay
        // never changes — only cosmetic density. Start mobile at 'medium'.
        this.quality = isMobile ? 'medium' : 'high'
        this.fxParticles = isMobile ? 5 : 8   // coin-burst particle count
        this.fxStreaks = !isMobile            // speed streaks
        this.fxShake = true                   // high-speed camera shake
        this._fpsAccum = 0
        this._fpsFrames = 0
        this._qLockMs = 0                     // hysteresis: wait between changes

        // ── BACKGROUND ──────────────────────────────────────────────────────
        this.add.image(240, 384, 'bg').setDepth(0)

        // ── PARALLAX SKYLINE — far layer scrolls slowest (deepest), near a bit
        // faster, the floor grid fastest → layered 3D depth illusion.
        this.skyFar = this.add.tileSprite(240, 354, 480, 120, 'skyFar').setDepth(0.4).setAlpha(0.85)
        this.skyNear = this.add.tileSprite(240, 329, 480, 170, 'skyNear').setDepth(0.45)
        // Faint mist drifting just above the dark void (horizon), very slow
        if (!isMobile || this.quality !== 'low') {
          this.mist = this.add.tileSprite(240, 420, 480, 64, 'mist').setDepth(0.5).setAlpha(0.7)
        }
        // Distance-zone colour wash (fades in at milestones) — one fullscreen rect
        // ADD blend → the zone wash ADDS coloured light (brightens/tints) instead
        // of alpha-darkening the scene, so milestones feel energetic, not murky.
        this.zoneOverlay = this.add.rectangle(240, 384, 480, 768, 0xff6a00, 0).setDepth(0.72).setBlendMode(Phaser.BlendModes.ADD)
        this.lastZone = 0

        // Speed-based theme overlays (fade in at 1.2 / 1.5 / 2.0 / 3.0 / 3.5).
        // Start hidden — an alpha-0 fullscreen rect STILL draws on the GPU, so 5
        // of them = 5× wasted fullscreen overdraw every frame. We only flip the
        // active tier visible, keeping at most one fullscreen tint on screen.
        // ADD blend so each speed tier ADDS a coloured energy wash instead of
        // alpha-darkening the scene — higher tiers no longer go dark/murky.
        const ADD = Phaser.BlendModes.ADD
        this.themeOverlays = [
          this.add.rectangle(240, 384, 480, 768, 0x6a3a00, 0).setDepth(0.75).setVisible(false).setBlendMode(ADD), // sunset 1.2x
          this.add.rectangle(240, 384, 480, 768, 0x3a1a8a, 0).setDepth(0.75).setVisible(false).setBlendMode(ADD), // purple 1.5x
          this.add.rectangle(240, 384, 480, 768, 0x6a0a22, 0).setDepth(0.75).setVisible(false).setBlendMode(ADD), // crimson 2.0x
          this.add.rectangle(240, 384, 480, 768, 0x0a4a22, 0).setDepth(0.75).setVisible(false).setBlendMode(ADD), // toxic green 3.0x
          this.add.rectangle(240, 384, 480, 768, 0x4a1ab0, 0).setDepth(0.75).setVisible(false).setBlendMode(ADD), // cosmic 3.5x
        ]
        this.lastTheme = 0
        // Pulsing accent overlay for top-tier speeds — hidden until cosmic tier
        this.themePulse = this.add.rectangle(240, 384, 480, 768, 0x00CCFF, 0).setDepth(0.76).setVisible(false).setBlendMode(Phaser.BlendModes.ADD)

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
        // Random interval 2.5–6 s — desktop only (per-frame onUpdate tween +
        // object churn isn't worth it on mobile/WebView).
        const schedulePulse = () => {
          if (this.isGameOver) return
          this.time.delayedCall(Phaser.Math.Between(2500, 6000), () => {
            spawnElectricPulse()
            schedulePulse()
          })
        }
        if (!isMobile) schedulePulse()

        // ── SHOOTING STARS — occasional comet streak across the night sky ──────
        const spawnShootingStar = () => {
          if (this.isGameOver || this.quality === 'low') return
          const sy = Phaser.Math.Between(40, 230)
          const star = this.add.circle(500, sy, 2.5, 0xCFEFFF, 1).setDepth(0.62)
          const trail = this.add.rectangle(500, sy, 30, 1.5, 0x88CCFF, 0.5).setDepth(0.61)
          this.tweens.add({
            targets: [star, trail], x: -40, y: sy + 60, duration: 900, ease: 'Sine.easeIn',
            onComplete: () => { star.destroy(); trail.destroy() }
          })
        }
        const scheduleStar = () => {
          if (this.isGameOver) return
          this.time.delayedCall(Phaser.Math.Between(4000, 9000), () => { spawnShootingStar(); scheduleStar() })
        }
        scheduleStar()

        // ── HUD FRAME ───────────────────────────────────────────────────────
        // Subtle premium top bar so the HUD reads as a clean band (matches the
        // start screen's framed, glowing look). Cheap: 2 static shapes.
        this.add.rectangle(240, 28, 480, 56, 0x0c0626, 0.55).setDepth(9)
        this.add.rectangle(240, 56, 480, 1.5, 0x7a4dff, 0.55).setDepth(9)

        // HUD: distance counter (center top)
        this.distanceText = this.add.text(240, 22, '0 m', {
          fontSize: '15px', color: '#22D3FF', fontStyle: 'bold', letterSpacing: 3,
          stroke: '#0a0a2e', strokeThickness: 4,
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
        // Permanent score boost earned from rewards (1.0 = none, 1.1 = +10%)
        this.scoreBoost = (window as any).__brScoreBoost || 1
        this.scoreText = this.add.text(14, 40, 'SCORE  0', {
          fontSize: '13px', color: '#FFFFFF', fontStyle: 'bold',
          stroke: '#0a0a2e', strokeThickness: 3,
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
        const warm = this.add.text(-300, -300, '🛡️🧲⏱️💎🎯🔥🚀', { fontSize: '18px' }).setDepth(-1)
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

        // ── ROCKET SCHEDULING — the rare jackpot. Roughly 1 in 3 runs hides a
        // rocket somewhere past the early game; most runs never see one, which
        // is exactly what makes finding one feel like an event.
        this.activeRocket = false
        this.rocketGraceUntil = 0
        this.rocketScheduled = Math.random() < 0.35
        this.rocketTriggerDist = Phaser.Math.Between(1100, 2400)
        this.rocketPending = false
        this.rocketSpawned = false
        // Test hook: ?rocket=1 forces an early rocket (automated checks /
        // tuning). Worst case if a player finds it: a few extra cosmetic coins.
        if (new URLSearchParams(window.location.search).get('rocket') === '1') {
          this.rocketScheduled = true
          this.rocketTriggerDist = 80
        }

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

        // ── COLLECTIBLE LAYOUT — coordinated with each segment's obstacle ───────
        // Every obstacle lays its coins / power-up where the SAME action that
        // clears the obstacle also collects them — so there are no "jump for a
        // coin → crash into an obstacle" no-win spots:
        //   • ground obstacles (low/high) → collectibles at jump-APEX height, just
        //     behind the obstacle. One well-timed jump clears the obstacle AND
        //     sweeps the whole coin row (the player hovers at the apex, so every
        //     coin lands).
        //   • drones (you stay grounded / slide under) → collectibles at running
        //     height → grabbed on the ground without ever jumping into the drone.
        const APEX_Y = 565   // ~ single-jump apex centre (player hovers here)
        // Drone segments: the player ducks (slide), and the slide hitbox shrinks
        // to a thin strip at the feet (~y722-729). Coins must sit that low so a
        // SLIDE collects them — this height is still inside the standing/running
        // body too, so simply running under the drone grabs them as well.
        const DUCK_Y = 716
        this.spawnSegmentCollectibles = (segType: string) => {
          const grounded = segType === 'drone'
          const y = grounded ? DUCK_Y : APEX_Y
          const roll = Phaser.Math.FloatBetween(0, 1)

          // ~10% of segments: a single power-up on the same safe path
          if (roll < 0.10) {
            const types = ['powerShield', 'powerMagnet', 'powerSlow', 'power2x']
            const t = Phaser.Math.RND.pick(types)
            const p = this.powerups.create(560, y, t)
            if (!p) return
            p.setDisplaySize(35, 35)
            p.setDepth(4)
            p.body.allowGravity = false
            p.setVelocityX(-this.obstacleSpeed)
            p.powerType = t
            this.tweens.add({ targets: p, y: p.y - 12, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
            this.tweens.add({ targets: p, alpha: 0.6, duration: 400, yoyo: true, repeat: -1 })
            return
          }
          // ~10% of segments: empty, for breathing room
          if (roll < 0.20) return

          // Coin row — kept tight (≤ ~152px) so one well-timed jump sweeps it all.
          // Starts just behind the obstacle (x 545+) so the clearing jump grabs it.
          const count = Phaser.Math.Between(3, 5)
          for (let i = 0; i < count; i++) {
            const c = this.coins.create(545 + i * 38, y, 'coin')
            if (!c) continue
            c.setDisplaySize(28, 28)
            c.setDepth(4)
            c.body.allowGravity = false
            c.setVelocityX(-this.obstacleSpeed)
            c.baseY = y
            // Low duck-coins bob less so they stay inside the thin slide hitbox
            c.bobAmp = grounded ? 4 : 7
            c.phaseShift = i * 0.9
          }
        }

        // Spawn obstacles — each segment also lays down its matched collectibles
        this.lastObstacleY = 0
        this.lastObstacleSpawnTime = 0
        this.time.addEvent({
          delay: 1600,
          callback: () => {
            if (this.isGameOver || this.isCountingDown) return
            // A pending rocket takes over this whole segment — it gets clean
            // air, never sharing screen space with an obstacle.
            if (this.rocketPending) {
              this.rocketPending = false
              this.rocketSpawned = true
              const r = this.powerups.create(530, 700, 'powerRocket')
              if (r) {
                r.setDisplaySize(44, 44)
                r.setDepth(4)
                r.body.allowGravity = false
                r.setVelocityX(-this.obstacleSpeed)
                r.powerType = 'powerRocket'
                this.tweens.add({ targets: r, y: r.y - 14, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
                this.tweens.add({ targets: r, alpha: 0.65, duration: 350, yoyo: true, repeat: -1 })
              }
              return
            }
            const hasDrones = this.gameTime > 25000
            const roll = Phaser.Math.Between(0, hasDrones ? 4 : 3)
            let segType = 'low'
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
              segType = 'drone'
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
            // Lay this segment's coins / power-up on the same safe path
            this.spawnSegmentCollectibles(segType)
          },
          loop: true
        })

        // Obstacle hit
        this.physics.add.overlap(this.basey, this.obstacles, (_b: any, obs: any) => {
          if (this.isGameOver) return
          // Rocket flight + landing grace: untouchable — obstacles simply
          // pass underneath/through, they aren't consumed.
          if (this.activeRocket || this.time.now < this.rocketGraceUntil) return
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
          // Reset combo-reactive skyline glow
          if (this.skyNear) {
            this.skyNear.clearTint()
            if (this.comboPulse) { this.comboPulse.stop(); this.comboPulse = null; this.skyNear.setAlpha(1) }
          }
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
            if (demo) {
              // Attract mode: no React callbacks — just loop a fresh run
              // once the explosion has played out.
              this.time.delayedCall(1400, () => this.scene.restart())
              return
            }
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
        // Shared collector — used by the running overlap AND the slide-time
        // proximity sweep (in update), so sliding collects coins exactly like
        // running does regardless of the shrunken slide hitbox.
        this.collectCoin = (coin: any) => {
          if (!coin || !coin.active) return
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

          // Combo-reactive skyline: high combo warms the neon lights (red/orange)
          if (this.skyNear) {
            const warm = Math.max(0, Math.min(1, (this.combo - 5) / 9))  // 0 at <5 → 1 at 14+
            const g = Math.round(255 - warm * 90)
            const b = Math.round(255 - warm * 170)
            this.skyNear.setTint((255 << 16) | (g << 8) | b)
            if (this.combo === 10 && !this.comboPulse) {
              this.comboPulse = this.tweens.add({ targets: this.skyNear, alpha: 0.7, duration: 350, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
            }
          }

          this.playCoinSound()

          // Particle burst — recycle from pool (3 on mobile, 6 desktop)
          const pCount = this.fxParticles
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
        }
        // Running collection — uses the player's physics body
        this.physics.add.overlap(this.basey, this.coins, (_b: any, coin: any) => this.collectCoin(coin))

        // Power-up collect — shared collector (running overlap + slide sweep)
        this.collectPowerup = (powerup: any) => {
          if (!powerup || !powerup.active) return
          const type = powerup.powerType
          powerup.destroy()
          this.playCoinSound()

          if (type === 'powerShield') this.activateShield()
          else if (type === 'powerMagnet') this.activateMagnet()
          else if (type === 'powerSlow') this.activateSlowMo()
          else if (type === 'power2x') this.activateDouble()
          else if (type === 'powerRocket') this.activateRocket()

          // Reuse the pre-warmed notification text (no per-pickup emoji rasterize)
          const notif = this.powerNotif
          this.tweens.killTweensOf(notif)
          notif.setText(getPowerUpName(type)).setPosition(240, 100).setAlpha(1).setVisible(true)
          this.tweens.add({ targets: notif, y: 60, alpha: 0, duration: 2000, ease: 'Power2',
            onComplete: () => notif.setVisible(false) })
        }
        this.physics.add.overlap(this.basey, this.powerups, (_b: any, powerup: any) => this.collectPowerup(powerup))

        // Jump effect
        // Grab a recycled particle from the shared pool (no per-jump allocation)
        const grabParticle = () => {
          const p = this.particlePool[this.particleIdx]
          this.particleIdx = (this.particleIdx + 1) % this.particlePool.length
          this.tweens.killTweensOf(p)
          return p
        }

        const jumpEffect = () => {
          const n = this.isMobile ? 4 : 6
          for (let i = 0; i < n; i++) {
            const px = this.basey.x + Phaser.Math.Between(-16, 16)
            const py = this.basey.y + 28
            const p = grabParticle()
            p.setPosition(px, py).setFillStyle(0x00FFFF, 0.9)
              .setScale(1).setAlpha(0.9).setVisible(true).setActive(true)
            this.tweens.add({ targets: p, y: py + 22, alpha: 0, scaleX: 0.3, scaleY: 0.3,
              duration: 380, onComplete: () => p.setVisible(false).setActive(false) })
          }
        }

        const doJump = () => {
          // No air control during rocket flight (a double-jump with gravity
          // off would launch Basey off the top of the screen)
          if (this.isGameOver || this.isCountingDown || this.activeRocket) return
          if (this.basey.body.blocked.down) {
            this.basey.setVelocityY(-650)
            this.jumpCount = 1
            jumpEffect()
            this.playJumpSound()
          } else if (this.jumpCount === 1) {
            // Double jump — slightly weaker, pink ring burst (pooled)
            this.basey.setVelocityY(-520)
            this.jumpCount = 2
            const n = this.isMobile ? 6 : 8
            for (let i = 0; i < n; i++) {
              const a = (Math.PI * 2 * i) / n
              const p = grabParticle()
              p.setPosition(this.basey.x + Math.cos(a) * 10, this.basey.y + Math.sin(a) * 10)
                .setFillStyle(0xFF00FF, 0.9).setScale(1).setAlpha(0.9).setVisible(true).setActive(true)
              this.tweens.add({ targets: p,
                x: this.basey.x + Math.cos(a) * 34,
                y: this.basey.y + Math.sin(a) * 34,
                alpha: 0, duration: 320, onComplete: () => p.setVisible(false).setActive(false) })
            }
            this.playJumpSound()
          }
        }

        const doSlide = () => {
          if (this.isSliding || !this.basey.body.blocked.down || this.isGameOver || this.isCountingDown || this.activeRocket) return
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
            // Don't yank Basey back to ground level if a rocket collected
            // mid-slide has taken him airborne in the meantime
            if (!this.activeRocket && this.slideLockedY !== null) this.basey.setY(this.slideLockedY)
            this.slideLockedY = null
          })
        }

        if (demo) {
          // Autopilot drives these from update(); keep keyboard + window
          // hooks off so the gate screen never hijacks the user's keys.
          this.doJump = doJump
          this.doSlide = doSlide
        } else {
          this.input.keyboard?.on('keydown-SPACE', doJump)
          this.input.keyboard?.on('keydown-UP', doJump)
          this.input.keyboard?.on('keydown-DOWN', doSlide)

          // Touch + mouse input is driven by the React full-screen container
          // (page.tsx) as a SINGLE source — it fires on press (no wait-for-finger-
          // lift lag) and also covers the letterbox. One source avoids the old
          // double-fire (Phaser pointer + React touch) that turned a single tap
          // into an accidental double jump.
          ;(window as any).gameJumpInput = doJump
          ;(window as any).gameSlideInput = doSlide
        }

        // 3-2-1 GO! countdown — dim backdrop + big number + glow ring.
        // Demo skips straight into the run (a countdown loop looks broken
        // behind the QR screen).
        const countdownDim = demo ? null : this.add.rectangle(240, 384, 480, 768, 0x000022, 0.55).setDepth(100)
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
            // BGM only on desktop — on mobile/WebView the per-note Web Audio
            // scheduler causes micro-stutter, so we skip it for smoothness.
            if (!this.isMobile) this.startBGM?.()
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
        if (demo) this.isCountingDown = false
        else nextCount()

        this.runFrame = 0
        this.frameTimer = 0
        this.scoreSubmitted = false

        // Apply a quality tier — scales only decorative density, never gameplay.
        this.applyQuality = (tier: string) => {
          this.quality = tier
          const starShow = tier === 'low' ? 8 : tier === 'medium' ? 14 : (this.stars?.length || 0)
          this.stars?.forEach((s: any, i: number) => s.setVisible(i < starShow))
          const dfShow = tier === 'low' ? 0 : tier === 'medium' ? 2 : (this.dataFlow?.length || 0)
          this.dataFlow?.forEach((d: any, i: number) => d.setVisible(i < dfShow))
          this.fxParticles = tier === 'low' ? 3 : tier === 'medium' ? 5 : 8
          this.fxStreaks = tier === 'high'
          this.fxShake = tier !== 'low'
        }
        this.applyQuality(this.quality)
      },

      update: function (this: any, _t: number, delta: number) {
        if (this.isGameOver || this.isCountingDown) return

        // ── DEMO AUTOPILOT ──────────────────────────────────────────────────
        // Plays like a decent human: act on the nearest obstacle ahead by
        // time-to-arrival (so timing stays right as speed ramps) — jump clears
        // ground obstacles + sweeps the apex coin row, slide ducks drones.
        if (demo) {
          let nearest: any = null
          this.obstacles.getChildren().forEach((o: any) => {
            if (o.active && o.x > this.basey.x - 10 && (!nearest || o.x < nearest.x)) nearest = o
          })
          if (nearest && this.basey.body.blocked.down && !this.isSliding) {
            const tta = (nearest.x - this.basey.x) / this.obstacleSpeed
            if (nearest.obsType === 'drone') {
              if (tta < 0.40) this.doSlide()
            } else if (tta < 0.42) {
              this.doJump()
            }
          }
        }

        // Frame scale vs a 60fps baseline — keeps score gain & the speed ramp
        // (and therefore the jump-timing difficulty) IDENTICAL on 60 / 90 / 120 /
        // 144 Hz devices. Clamped so a single stalled frame can't lurch ahead.
        const fs = Math.min(2, delta / 16.667)

        // ── ADAPTIVE QUALITY SAMPLING ───────────────────────────────────────
        // Average FPS over ~1s, then step quality up/down with hysteresis so a
        // slow WebView/phone sheds effects and a fast one keeps them.
        this._fpsAccum += delta
        this._fpsFrames++
        this._qLockMs += delta
        if (this._fpsAccum >= 1000) {
          const fps = (this._fpsFrames * 1000) / this._fpsAccum
          this._fpsAccum = 0
          this._fpsFrames = 0
          if (this._qLockMs >= 2000 && this.applyQuality) {
            let tier = this.quality
            if (fps < 32) tier = this.quality === 'high' ? 'medium' : 'low'
            else if (fps > 52) tier = this.quality === 'low' ? 'medium' : 'high'
            if (tier !== this.quality) { this.applyQuality(tier); this._qLockMs = 0 }
          }
        }

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

        this.score += 0.08 * this.speedMultiplier * this.scoreBoost * fs
        this.gameTime += delta
        // Distance: pixels travelled / 30 = meters (feels right for the canvas scale)
        this.distance += (this.obstacleSpeed * delta) / (1000 * 30)
        const distInt = Math.floor(this.distance)
        if (distInt !== this.lastDistDisplay) {
          this.lastDistDisplay = distInt
          this.distanceText.setText(distInt + ' m')
          // Scheduled rocket reached its trigger distance → next obstacle
          // segment becomes the rocket pickup instead
          if (this.rocketScheduled && !this.rocketSpawned && distInt >= this.rocketTriggerDist) {
            this.rocketPending = true
          }
          // ── ZONE TRANSITIONS — colour washes fade in at distance milestones ──
          const zone = distInt >= 4000 ? 4 : distInt >= 3000 ? 3 : distInt >= 2000 ? 2 : distInt >= 1000 ? 1 : 0
          if (zone !== this.lastZone && this.zoneOverlay) {
            this.lastZone = zone
            // 0 none · 1 sunset · 2 matrix green · 3 crimson · 4 deep violet
            const zc = [0x000000, 0xff6a00, 0x00ff66, 0xff0033, 0x7a1fff][zone]
            const za = [0, 0.13, 0.12, 0.13, 0.15][zone]
            this.zoneOverlay.setFillStyle(zc)
            this.tweens.add({ targets: this.zoneOverlay, alpha: za, duration: 2500, ease: 'Sine.easeInOut' })
          }
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
          this.obstacleSpeed += this.speedIncrease * fs
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
          star.x -= star.speed * this.speedMultiplier * fs
          if (star.x < -10) star.x = 490
        })

        // ── ENVIRONMENT ANIMATIONS ─────────────────────────────────────────
        // Scroll neon grid floor in sync with obstacle speed. The × fs (delta
        // scale) is CRUCIAL: the obstacles move via physics (velocity × delta),
        // so the floor must scale by delta too. Otherwise an fps dip during a
        // jump makes the obstacles surge ahead of the fixed-step floor — which
        // reads as a phantom forward "speed boost". With × fs they move in
        // lockstep at any frame rate.
        if (this.groundGrid) this.groundGrid.tilePositionX += (this.obstacleSpeed / 60) * fs
        // Scroll far parallax circuit layer (8× slower = depth effect)
        if (this.bgCircuit) this.bgCircuit.tilePositionX += (this.obstacleSpeed / (60 * 8)) * fs

        // Parallax skyline — near faster than far → depth (both far slower than floor)
        if (this.skyNear) this.skyNear.tilePositionX += (this.obstacleSpeed / 150) * fs
        if (this.skyFar) this.skyFar.tilePositionX += (this.obstacleSpeed / 320) * fs
        if (this.mist) this.mist.tilePositionX += (this.obstacleSpeed / 240) * fs

        // Fog: drift left slowly, rise slightly, reset when out of view
        this.fogPool?.forEach((fog: any) => {
          fog.x -= fog.driftSpd * Math.min(this.speedMultiplier, 2) * fs
          fog.y -= 0.06 * fs
          if (fog.x < -120 || fog.y < 706) {
            fog.x = 490 + Phaser.Math.Between(0, 100)
            fog.y = 730 + Phaser.Math.Between(0, 16)
          }
        })

        // Data-flow dots: race at fixed speed (atmospheric, not gameplay-scaled)
        this.dataFlow?.forEach((dot: any) => {
          dot.x -= dot.spd * fs
          if (dot.x < -10) {
            dot.x = 490 + Phaser.Math.Between(0, 240)
            dot.y = 728 + (Math.random() < 0.5 ? -1 : 2)
          }
        })

        if (this.fxShake && this.speedMultiplier >= 2.5 && Math.random() < (this.isMobile ? 0.01 : 0.03) * fs) {
          this.cameras.main.shake(50, 0.002)
        }

        // Speed streaks — horizontal light trails at high speed (high quality only)
        if (this.fxStreaks && this.speedMultiplier >= 2.0 && Math.random() < 0.03 * (this.speedMultiplier - 1.5) * fs) {
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
              c.y = c.baseY + Math.sin(bobT + c.phaseShift) * (c.bobAmp ?? 7)
            }
          })
        }

        // ── SLIDE COLLECTION ────────────────────────────────────────────────
        // While sliding, the physics body shrinks to a thin foot strip, so the
        // body-based overlaps miss most coins/power-ups you slide through. Sweep
        // the player's full column by proximity so a slide collects everything it
        // passes — identical to running.
        if (this.isSliding) {
          const px = this.basey.x
          const py = this.basey.y
          this.coins.getChildren().forEach((c: any) => {
            if (c.active && Math.abs(c.x - px) < 28 && Math.abs(c.y - py) < 36) this.collectCoin(c)
          })
          this.powerups.getChildren().forEach((p: any) => {
            if (p.active && Math.abs(p.x - px) < 30 && Math.abs(p.y - py) < 40) this.collectPowerup(p)
          })
        }

        this.obstacles.getChildren().forEach((o: any) => { if (o.x < -100) o.destroy() })
        this.coins.getChildren().forEach((c: any) => { if (c.x < -100) c.destroy() })
        this.powerups.getChildren().forEach((p: any) => { if (p.x < -100) p.destroy() })
      }
    }
  }
}
