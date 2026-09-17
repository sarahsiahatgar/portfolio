// ==========================================
// Game Help Overlay Handler
// ==========================================

const RTL_LANGS = ['fa', 'ar', 'he', 'ur'];

export function initGameHelp(cardElement) {

  const helpBtns = cardElement.querySelectorAll('.help-toggle-btn');
  const helpOverlay = cardElement.querySelector('.game-help-overlay');
  const closeBtn = cardElement.querySelector('.help-close-btn');
  const helpContentInner = cardElement.querySelector('.help-content-inner');

  if (!helpOverlay || helpBtns.length === 0) return;

  const langSelect = cardElement.querySelector('.game-lang-select');

  function syncHelpDirection() {
    if (!helpContentInner || !langSelect) return;
    const lang = langSelect.value;
    const isRtl = RTL_LANGS.includes(lang);
    helpContentInner.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    helpContentInner.lang = lang;
  }

  if (langSelect) {
    syncHelpDirection();
    langSelect.addEventListener('change', syncHelpDirection);
  }

  const toggleHelp = () => {
    const isActive = helpOverlay.classList.contains('active');
    if (isActive) {
      helpOverlay.classList.remove('active');
      helpBtns.forEach(btn => btn.textContent = '?');
    } else {
      syncHelpDirection();
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