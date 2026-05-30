export function createAudio(scene: any) {
  scene.bgmEnabled = true
  scene.bgmGain = null
  scene.bgmTimer = null

  scene.playJumpSound = () => {
    if (!scene.audioCtx) return
    try {
      const oscillator = scene.audioCtx.createOscillator()
      const gainNode = scene.audioCtx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(scene.audioCtx.destination)
      oscillator.frequency.value = 400
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, scene.audioCtx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, scene.audioCtx.currentTime + 0.1)
      oscillator.start(scene.audioCtx.currentTime)
      oscillator.stop(scene.audioCtx.currentTime + 0.1)
    } catch (e) {}
  }

  scene.playCoinSound = () => {
    if (!scene.audioCtx) return
    try {
      const oscillator = scene.audioCtx.createOscillator()
      const gainNode = scene.audioCtx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(scene.audioCtx.destination)
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.2, scene.audioCtx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, scene.audioCtx.currentTime + 0.15)
      oscillator.start(scene.audioCtx.currentTime)
      oscillator.stop(scene.audioCtx.currentTime + 0.15)
    } catch (e) {}
  }

  scene.playHitSound = () => {
    if (!scene.audioCtx) return
    try {
      const oscillator = scene.audioCtx.createOscillator()
      const gainNode = scene.audioCtx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(scene.audioCtx.destination)
      oscillator.frequency.value = 150
      oscillator.type = 'sawtooth'
      gainNode.gain.setValueAtTime(0.4, scene.audioCtx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, scene.audioCtx.currentTime + 0.2)
      oscillator.start(scene.audioCtx.currentTime)
      oscillator.stop(scene.audioCtx.currentTime + 0.2)
    } catch (e) {}
  }

  // ── BACKGROUND MUSIC (chiptune synth, no external assets) ────────────────
  scene.startBGM = () => {
    if (!scene.audioCtx || scene.bgmTimer) return
    if (scene.audioCtx.state === 'suspended') {
      scene.audioCtx.resume().catch(() => {})
    }

    scene.bgmGain = scene.audioCtx.createGain()
    scene.bgmGain.gain.value = scene.bgmEnabled ? 0.06 : 0
    scene.bgmGain.connect(scene.audioCtx.destination)

    // Cyberpunk bass loop in A minor — semitone offsets from A2 (110Hz)
    const bassPattern = [0, 0, 7, 0, 5, 0, 7, 3, 0, 0, 7, 0, 8, 7, 5, 3]
    const leadPattern = [12, 15, 19, 22, 19, 15, 17, 12]
    const root = 110

    let noteIdx = 0
    let nextTime = scene.audioCtx.currentTime + 0.15
    const noteDur = 0.22

    const playNote = (freq: number, time: number, dur: number, type: OscillatorType, vol: number) => {
      try {
        const osc = scene.audioCtx.createOscillator()
        const g = scene.audioCtx.createGain()
        osc.type = type
        osc.frequency.value = freq
        g.gain.setValueAtTime(0, time)
        g.gain.linearRampToValueAtTime(vol, time + 0.01)
        g.gain.exponentialRampToValueAtTime(0.001, time + dur)
        osc.connect(g)
        g.connect(scene.bgmGain)
        osc.start(time)
        osc.stop(time + dur + 0.02)
      } catch (e) {}
    }

    // Mobile: drop the lead track (halves oscillator-node creation) and use a
    // wider scheduler lookahead so the timer fires less often → less main-thread work.
    const onMobile = scene.isMobile
    const lookahead = onMobile ? 0.5 : 0.3
    const tick = onMobile ? 140 : 90

    const scheduler = () => {
      if (!scene.audioCtx || !scene.bgmGain) return
      while (nextTime < scene.audioCtx.currentTime + lookahead) {
        const bSemi = bassPattern[noteIdx % bassPattern.length]
        playNote(root * Math.pow(2, bSemi / 12), nextTime, noteDur, 'square', 0.20)
        // Lead every other beat (desktop only)
        if (!onMobile && noteIdx % 2 === 0) {
          const lSemi = leadPattern[(noteIdx / 2) % leadPattern.length]
          playNote(root * Math.pow(2, lSemi / 12), nextTime + 0.04, noteDur * 0.7, 'triangle', 0.12)
        }
        noteIdx++
        nextTime += noteDur
      }
    }

    scheduler()
    scene.bgmTimer = setInterval(scheduler, tick)
  }

  scene.stopBGM = () => {
    if (scene.bgmTimer) {
      clearInterval(scene.bgmTimer)
      scene.bgmTimer = null
    }
    if (scene.bgmGain && scene.audioCtx) {
      try {
        const t = scene.audioCtx.currentTime
        scene.bgmGain.gain.cancelScheduledValues(t)
        scene.bgmGain.gain.setValueAtTime(scene.bgmGain.gain.value, t)
        scene.bgmGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
      } catch (e) {}
      const bg = scene.bgmGain
      setTimeout(() => { try { bg.disconnect() } catch (e) {} }, 500)
      scene.bgmGain = null
    }
  }

  scene.toggleBGM = () => {
    scene.bgmEnabled = !scene.bgmEnabled
    if (scene.bgmGain) scene.bgmGain.gain.value = scene.bgmEnabled ? 0.06 : 0
    return scene.bgmEnabled
  }
}
