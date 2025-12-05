const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
  if (!audioContext) return;
  
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (e) {
    console.log('Audio not available');
  }
}

function playChime(frequencies: number[], duration: number = 0.15, gap: number = 0.1) {
  if (!audioContext) return;
  
  frequencies.forEach((freq, i) => {
    setTimeout(() => {
      playTone(freq, duration, 'sine', 0.2);
    }, i * gap * 1000);
  });
}

export function playMessageSound() {
  playChime([523, 659, 784], 0.1, 0.08);
}

export function playQuestionSound() {
  playChime([392, 523, 659], 0.12, 0.1);
}

export function playAnswerSound() {
  playChime([659, 784, 880], 0.1, 0.08);
}

export function playNotificationSound() {
  playChime([880, 1047], 0.15, 0.1);
}

export function playTurnSound() {
  playChime([523, 659, 784, 1047], 0.12, 0.1);
}

export function playTimerWarningSound() {
  playTone(440, 0.3, 'square', 0.2);
}

export function playVoteSound() {
  playChime([392, 523], 0.15, 0.1);
}

export function playResultSound(isWin: boolean) {
  if (isWin) {
    playChime([523, 659, 784, 1047, 1319], 0.2, 0.12);
  } else {
    playChime([392, 330, 262], 0.25, 0.15);
  }
}

export function resumeAudioContext() {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
}
