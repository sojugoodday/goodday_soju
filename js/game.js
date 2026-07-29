/* ==========================================
   🎮 게임 기본 설정 및 스케일러
   ========================================== */
function fitGameToScreen() {
  const scaler = document.getElementById('game-scaler');
  const scaleX = (window.innerWidth - 10) / 450;
  const scaleY = (window.innerHeight - 10) / 800;
  scaler.style.transform = `scale(${Math.min(scaleX, scaleY, 1)})`;
}
window.addEventListener('resize', fitGameToScreen);
window.addEventListener('load', fitGameToScreen);
fitGameToScreen();

/* 게임 상태 데이터 */
const partOrder = ['part-1', 'part-2', 'part-3', 'part-4', 'part-body'];
let eatenCount = 0;
let livesLeft = 8;
let isPouring = false;
let currentDifficulty = 'easy';

const fillSpeeds = {
  easy: 0.2,
  normal: 0.4,
  hard: 0.8,
};

/* DOM 요소 연결 */
const startScreen = document.getElementById('start-screen');
const glassWrapper = document.getElementById('glass-wrapper');
const gameTitle = document.getElementById('game-title');
const bottle = document.getElementById('part-bottle');
const liquid = document.getElementById('soju-liquid');
const popup = document.getElementById('action-popup');
const targetLine = document.getElementById('target-line');

const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalBtn = document.getElementById('modal-btn');

let pourAnimationFrame = null;
let fillPercent = 0;
let targetPercent = 50;

// 소주잔 크기 축소에 맞춰 액체 비율 조정
const MAX_LIQUID_HEIGHT_PCT = 62;
const BASE_BOTTOM_PCT = 20;

/* ==========================================
     🚀 게임 시작 및 모달 관련
     ========================================== */
function startGame(diff) {
  if (typeof initAudio === 'function') initAudio();
  currentDifficulty = diff;
  startScreen.style.display = 'none';
  glassWrapper.className = 'glass-wrapper diff-' + diff;

  const diffText = diff === 'easy' ? '하' : diff === 'normal' ? '중' : '상';
  gameTitle.textContent = `타이밍 잔! [난이도: ${diffText}]`;

  // 시작 안내 팝업 띄우기
  showInstructionModal();
}

function showInstructionModal() {
  modalTitle.textContent = '🐔 말복 특선! 몸보신하러 왔나?';
  modalBody.innerHTML =
    '말복이라 삼계탕 집에 온 당신!<br>삼계탕에는 자고로 <b>좋은데이</b> 한 잔 딱 <br>채워줘야 몸보신 완성인 거 알제?<br><br>닭 식기 전에 얼른 함 따라봐라!<br>뚝배기 싹 비울 때까지 가보자고~ 🔥';
  modalBtn.textContent = '시작하기';

  modalBtn.onclick = () => {
    modalOverlay.classList.remove('show');
    randomizeTarget();
  };

  modalOverlay.classList.add('show');
}

/* ==========================================
     🍶 소주 따르기 동작 및 타이밍 검사
     ========================================== */
function randomizeTarget() {
  targetPercent = Math.floor(Math.random() * 36) + 40;
  const targetBottomPct =
    BASE_BOTTOM_PCT + MAX_LIQUID_HEIGHT_PCT * (targetPercent / 100);
  targetLine.style.bottom = `${targetBottomPct}%`;
}

function startPouring(e) {
  if (e) e.preventDefault();
  if (eatenCount >= partOrder.length || livesLeft <= 0 || isPouring) return;

  isPouring = true;
  bottle.classList.add('pouring');
  if (typeof startPourSound === 'function') startPourSound();

  let lastTime = performance.now();
  const fillSpeed = fillSpeeds[currentDifficulty] || fillSpeeds.easy;

  function animate(now) {
    if (!isPouring) return;

    const delta = now - lastTime;
    lastTime = now;

    fillPercent += delta * fillSpeed;

    if (fillPercent >= 100) {
      fillPercent = 100;
      liquid.style.height = `${MAX_LIQUID_HEIGHT_PCT}%`;
      stopPouring();
      return;
    }

    liquid.style.height = `${MAX_LIQUID_HEIGHT_PCT * (fillPercent / 100)}%`;
    pourAnimationFrame = requestAnimationFrame(animate);
  }

  pourAnimationFrame = requestAnimationFrame(animate);
}

function stopPouring() {
  if (!isPouring) return;
  isPouring = false;
  bottle.classList.remove('pouring');
  if (typeof stopPourSound === 'function') stopPourSound();

  if (pourAnimationFrame) {
    cancelAnimationFrame(pourAnimationFrame);
    pourAnimationFrame = null;
  }

  checkTiming();
}

function checkTiming() {
  const margin = 4.5;
  const minSuccess = targetPercent - margin;
  const maxSuccess = targetPercent + margin;

  if (fillPercent >= 100) {
    if (typeof playSFX === 'function') playSFX('fail');
    showPopup('넘쳤다! 앗 차가!', '#ff5577');
    handleFailure();
  } else if (fillPercent >= minSuccess && fillPercent <= maxSuccess) {
    triggerSuccess();
  } else if (fillPercent > maxSuccess) {
    if (typeof playSFX === 'function') playSFX('fail');
    showPopup('소주 처음 묵나?', '#ffea00');
    handleFailure();
  } else {
    if (fillPercent > 5) {
      if (typeof playSFX === 'function') playSFX('fail');
      showPopup('더 채워야제!', '#ffea00');
      handleFailure();
    } else {
      resetGlass(0);
    }
  }
}

/* ==========================================
     🐔 최종 실패 닭 탈출 연출 & 실패 처리
     ========================================== */
function animateChickenEscape(onComplete) {
  const escapeBox = document.getElementById('chicken-escape-box');
  const chickenImg = document.getElementById('escaping-chicken');

  const samgyetangParts = document.querySelectorAll(
    '.samgyetang-stage .part:not(.bg-table):not(#part-bottle)'
  );
  samgyetangParts.forEach((part) => {
    part.style.opacity = '0';
  });

  const chickenAudio = new Audio(
    'https://assets.mixkit.co/active_storage/sfx/2281/2281-preview.mp3'
  );
  chickenAudio.volume = 0.7;
  chickenAudio.play().catch((e) => console.log('오디오 재생 실패:', e));

  chickenImg.src = 'image/chicken1.png';
  chickenImg.classList.remove('run-away-left');
  escapeBox.style.display = 'flex';

  setTimeout(() => {
    chickenImg.src = 'image/chicken2.png';
    chickenImg.classList.add('run-away-left');
  }, 600);

  setTimeout(() => {
    escapeBox.style.display = 'none';

    samgyetangParts.forEach((part) => {
      if (!part.classList.contains('eaten')) {
        part.style.opacity = '1';
      }
    });

    if (onComplete) onComplete();
  }, 2500);
}

function handleFailure() {
  livesLeft--;
  const heartEl = document.getElementById(`heart-${livesLeft}`);
  if (heartEl) {
    heartEl.classList.add('lost');
  }

  if (livesLeft <= 0) {
    animateChickenEscape(() => {
      modalTitle.textContent = '💸 앗... 삼계탕이 도망쳤다!';
      modalBody.innerHTML =
        '이 무슨..기다리다 지친 닭이 부활했다!<br>정신 딱 차리고 손끝에 힘주고 다시 도전해봐라! 🐔💨';
      modalBtn.textContent = '다시 도전하기 🔄';
      modalBtn.onclick = () => restartGame();
      modalOverlay.classList.add('show');
    });
  } else {
    resetGlass(800);
  }
}

/* ==========================================
     🍗 성공 연출 및 UI 업데이트
     ========================================== */
function triggerSuccess() {
  showPopup('성공! 캬~ ', '#00ff9d');
  if (typeof playSFX === 'function') playSFX('whistle');

  setTimeout(() => {
    showPopup('쩝쩝... 🍗', '#ffea00');
    if (typeof playSFX === 'function') playSFX('eat');

    // game.js 중 triggerSuccess 일부
    const targetId = partOrder[eatenCount];
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.style.opacity = ''; // inline 스타일 제거하여 CSS 규칙이 100% 적용되도록 보장
      targetEl.classList.add('eaten');
    }

    const legIcon = document.getElementById(`leg-${eatenCount}`);
    if (legIcon) legIcon.classList.add('eaten');

    eatenCount++;
    resetGlass(600);

    if (eatenCount === partOrder.length) {
      setTimeout(() => {
        if (typeof triggerCelebrationFireworks === 'function') {
          triggerCelebrationFireworks();
        }

        modalTitle.textContent = '🏆 완뚝 성공! 원기회복 완료!';
        modalBody.innerHTML =
          '닭 한 마리 비우고 좋은데이로 완벽하게 적셨다!<br>이 정도 솜씨면 올여름 말복 더위는 끝났다 마!<br><br>짠~ 하고 기분 좋게 한 잔 더?😎';
        modalBtn.textContent = '한 판 더 뛰기 🍻';
        modalBtn.onclick = () => restartGame();
        modalOverlay.classList.add('show');
      }, 700);
    }
  }, 1100);
}

function showPopup(text, color = '#00ff9d') {
  popup.textContent = text;
  popup.style.color = color;
  popup.classList.add('show');
  if (popup.timer) clearTimeout(popup.timer);
  popup.timer = setTimeout(() => {
    popup.classList.remove('show');
  }, 900);
}

function resetGlass(delay) {
  isPouring = false;
  setTimeout(() => {
    fillPercent = 0;
    liquid.style.height = '0%';
    randomizeTarget();
  }, delay);
}

function restartGame() {
  location.reload();
}

/* ==========================================
   ⚙️ 설정 팝업 및 난이도 실시간 변경
   ========================================== */

// 1. 우측 상단 ⚙️ 버튼 클릭 시 팝업 열기
function openSettings() {
  const settingsOverlay = document.getElementById('settings-overlay');
  if (settingsOverlay) {
    settingsOverlay.classList.add('show');
  }
}

// 2. '계속하기' 버튼 클릭 시 팝업만 닫기 (하던 게임 계속 진행)
function closeSettings() {
  const settingsOverlay = document.getElementById('settings-overlay');
  if (settingsOverlay) {
    settingsOverlay.classList.remove('show');
  }
}

// 3. 팝업 안에서 난이도를 클릭했을 때 적용 처리
function changeDifficulty(diff) {
  currentDifficulty = diff;
  glassWrapper.className = 'glass-wrapper diff-' + diff;

  const diffText = diff === 'easy' ? '하' : diff === 'normal' ? '중' : '상';
  gameTitle.textContent = `타이밍 잔! [난이도: ${diffText}]`;

  // 선택 완료 후 설정 팝업 닫기
  closeSettings();
}

function shareGame() {
  const shareData = {
    title: '좋은데이 X 말복 이벤트',
    text: '1인칭 소주따르기 타이밍 게임! 함께 즐겨보세요 🍺',
    url: window.location.href,
  };

  if (navigator.share) {
    navigator.share(shareData).catch((err) => console.log('공유 취소:', err));
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('게임 링크가 클립보드에 복사되었습니다!');
    });
  }
}

/* ==========================================
   🔄 게임 재시작 및 상태 초기화
   ========================================== */
function restartGame() {
  // 1. 진행 중인 애니메이션 및 타이머 정지
  if (pourAnimationFrame) {
    cancelAnimationFrame(pourAnimationFrame);
    pourAnimationFrame = null;
  }
  isPouring = false;

  // 2. 게임 변수 초기화
  eatenCount = 0;
  livesLeft = 8;
  fillPercent = 0;

  // 3. 소주병 & 액체 상태 리셋
  bottle.classList.remove('pouring');
  liquid.style.height = '0%';
  if (typeof stopPourSound === 'function') stopPourSound();

  // 4. 모달 및 팝업 닫기
  modalOverlay.classList.remove('show');
  popup.classList.remove('show');

  // 5. 삼계탕 부위 오파시티 & 위치 복구
  const samgyetangParts = document.querySelectorAll('.samgyetang-stage .part');
  samgyetangParts.forEach((part) => {
    part.classList.remove('eaten');
    part.style.opacity = '1';
  });

  // 6. 닭 탈출 연출 박스 숨기기
  const escapeBox = document.getElementById('chicken-escape-box');
  if (escapeBox) escapeBox.style.display = 'none';

  // 7. 하단 UI (목숨 & 먹은 부위) 아이콘 초기화
  for (let i = 0; i < 8; i++) {
    const heartEl = document.getElementById(`heart-${i}`);
    if (heartEl) heartEl.classList.remove('lost');
  }

  for (let i = 0; i < partOrder.length; i++) {
    const legIcon = document.getElementById(`leg-${i}`);
    if (legIcon) legIcon.classList.remove('eaten');
  }

  // 8. 시작 화면은 숨기고 목표선 랜덤재설정으로 바로 시작
  startScreen.style.display = 'none';
  randomizeTarget();
}

/* 마우스/터치 이벤트 등록 */
bottle.addEventListener('mousedown', startPouring);
window.addEventListener('mouseup', stopPouring);
bottle.addEventListener('touchstart', startPouring, { passive: false });
window.addEventListener('touchend', stopPouring);
