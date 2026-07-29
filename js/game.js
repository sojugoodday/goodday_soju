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
  easy: 0.25,
  normal: 0.45,
  hard: 0.95,
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

const MAX_LIQUID_HEIGHT_PCT = 42;
const BASE_BOTTOM_PCT = 30;

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
    '말복이라 삼계탕 집에 온 당신!<br>삼계탕에는 자고로 <b>좋은데이</b> 한 잔 딱 <br>채워줘야 몸보신 완성인 거 알제?<br><br>잔 잘보고 적정선 맞춰서 콸콸콸 따라봐라!<br>뚝배기 싹 비울 때까지 가보자고~ 🔥';
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

  // 1. 남아있는 삼계탕 부위들 잠시 숨기기
  const samgyetangParts = document.querySelectorAll(
    '.samgyetang-stage .part:not(.bg-table):not(#part-bottle)'
  );
  samgyetangParts.forEach((part) => {
    part.style.opacity = '0';
  });

  // 2. 🐔 닭 울음소리 재생 (온라인 MP3)
  const chickenAudio = new Audio(
    'https://assets.mixkit.co/active_storage/sfx/2281/2281-preview.mp3'
  );
  chickenAudio.volume = 0.7; // 소리 크기 조절 (0.0 ~ 1.0)
  chickenAudio.play().catch((e) => console.log('오디오 재생 실패:', e));

  // 3. 닭1(놀란 모습) 등장
  chickenImg.src = './image/닭1.png';
  chickenImg.classList.remove('run-away-left');
  escapeBox.style.display = 'flex';

  // 4. 0.6초 후 닭2(달리기)로 바뀌며 도망
  setTimeout(() => {
    chickenImg.src = './image/닭2.png';
    chickenImg.classList.add('run-away-left');
  }, 600);

  // 5. 탈출 애니메이션 완료 후 모달 팝업
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

  // 😭 기회 8번을 모두 소진했을 때만 닭 도망 연출
  if (livesLeft <= 0) {
    animateChickenEscape(() => {
      modalTitle.textContent = '💸 앗... 닭이 도망쳤다!';
      modalBody.innerHTML =
        '소주 다 엎지르고 뭐하노! 닭이 살아 돌아갔다!<br>정신 딱 차리고 손끝에 힘주고 다시 도전해봐라! 🐔💨';
      modalBtn.textContent = '다시 도전하기 🔄';
      modalBtn.onclick = () => location.reload();
      modalOverlay.classList.add('show');
    });
  } else {
    // 기회가 남아있다면 잔만 리셋
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

    const targetId = partOrder[eatenCount];
    const targetEl = document.getElementById(targetId);
    if (targetEl) targetEl.classList.add('eaten');

    const legIcon = document.getElementById(`leg-${eatenCount}`);
    if (legIcon) legIcon.classList.add('eaten');

    eatenCount++;
    resetGlass(600);

    // 완뚝 성공
    if (eatenCount === partOrder.length) {
      setTimeout(() => {
        if (typeof triggerCelebrationFireworks === 'function') {
          triggerCelebrationFireworks();
        }

        modalTitle.textContent = '🏆 완뚝 성공! 원기회복 완료!';
        modalBody.innerHTML =
          '닭 한 마리 비우고 좋은데이로 완벽하게 적셨다!<br>이 정도 솜씨면 올여름 말복 더위는 끝났다 마!😎<br><br>짠~ 하고 기분 좋게 한 잔 더?';
        modalBtn.textContent = '한 판 더 뛰기 🍻';
        modalBtn.onclick = () => location.reload();
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

// ⚙️ 환경설정(난이도 재선택) 버튼
function openSettings() {
  // 게임 화면을 일시정지하거나 초기화 후 시작 화면 표시
  const startScreen = document.getElementById('start-screen');
  if (startScreen) {
    startScreen.style.display = 'flex';
  }
}

// 🔗 공유하기 버튼
function shareGame() {
  const shareData = {
    title: '좋은데이 X 말복 이벤트',
    text: '1인칭 소주따르기 타이밍 게임! 함께 즐겨보세요 🍺',
    url: window.location.href, // 현재 깃허브 웹사이트 주소
  };

  // 모바일 공유하기 지원 시
  if (navigator.share) {
    navigator.share(shareData).catch((err) => console.log('공유 취소:', err));
  } else {
    // PC 등 미지원 브라우저는 클립보드 복사
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('게임 링크가 클립보드에 복사되었습니다!');
    });
  }
}

/* 마우스/터치 이벤트 등록 */
bottle.addEventListener('mousedown', startPouring);
window.addEventListener('mouseup', stopPouring);
bottle.addEventListener('touchstart', startPouring, { passive: false });
window.addEventListener('touchend', stopPouring);