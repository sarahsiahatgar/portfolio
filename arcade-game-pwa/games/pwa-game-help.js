// ==========================================
// Game Help Overlay Handler
// ==========================================
export function initGameHelp(cardElement) {

  const helpBtns = cardElement.querySelectorAll('.help-toggle-btn');
  const helpOverlay = cardElement.querySelector('.game-help-overlay');
  const closeBtn = cardElement.querySelector('.help-close-btn');

  if (!helpOverlay || helpBtns.length === 0) return;

  const toggleHelp = () => {
    const isActive = helpOverlay.classList.contains('active');
    if (isActive) {
      helpOverlay.classList.remove('active');
      helpBtns.forEach(btn => btn.textContent = '?');
    } else {
      helpOverlay.classList.add('active');
      helpBtns.forEach(btn => btn.textContent = '✕');
    }
  };

  helpBtns.forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      toggleHelp();
    };
  });

  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      toggleHelp();
    };
  }
}