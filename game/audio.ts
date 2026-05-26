export function createAudio(scene: any) {
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
}
