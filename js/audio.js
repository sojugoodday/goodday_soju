/* -----------------------------------------------------------
         🔊 오디오 가상 정밀 합성기 (Web Audio API)
      ----------------------------------------------------------- */
let audioCtx = null;
let pourOsc = null;
let pourGain = null;
let pourInterval = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

/* 1. 소주 따르는 소리 (조로록~ 물방울/액체 음조 변화) */
function startPourSound() {
  initAudio();
  if (pourOsc) stopPourSound();

  pourOsc = audioCtx.createOscillator();
  pourGain = audioCtx.createGain();

  pourOsc.type = 'sine';
  pourOsc.frequency.setValueAtTime(600, audioCtx.currentTime);
  pourGain.gain.setValueAtTime(0.15, audioCtx.currentTime);

  pourOsc.connect(pourGain);
  pourGain.connect(audioCtx.destination);
  pourOsc.start();

  // 졸졸졸 거리는 파동 효과
  pourInterval = setInterval(() => {
    if (pourOsc && audioCtx) {
      const randomFreq = 550 + Math.random() * 300;
      pourOsc.frequency.setValueAtTime(randomFreq, audioCtx.currentTime);
    }
  }, 70);
}

function stopPourSound() {
  if (pourInterval) {
    clearInterval(pourInterval);
    pourInterval = null;
  }
  if (pourGain && audioCtx) {
    pourGain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    setTimeout(() => {
      if (pourOsc) {
        pourOsc.stop();
        pourOsc.disconnect();
        pourOsc = null;
      }
    }, 60);
  }
}

/* 2. 다양한 효과음 시스템 */
function playSFX(type) {
  initAudio();
  const now = audioCtx.currentTime;

  if (type === 'whistle') {
    // 🎉 성공 시 신나는 휘파람 / 호우! 상승음
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';

    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.15);
    osc.frequency.setValueAtTime(1400, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(2200, now + 0.4);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  } else if (type === 'fail') {
    // ❌ 실패 시 삑사리/경고음 (삐-익)
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';

    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(120, now + 0.35);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  } else if (type === 'eat') {
    // 🍗 먹는 소리
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';

    osc.frequency.setValueAtTime(180, now);
    osc.frequency.setValueAtTime(260, now + 0.08);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === 'fanfare') {
    // 🎇 완뚝 성공 팡파레 효과음
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.3, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.4);
    });
  }
}
