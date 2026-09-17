export function initPWAInstall() {
  let deferredPrompt;
  const installBanner = document.getElementById('pwa-install-banner');
  const installBtn = document.getElementById('installAppBtn');
  const modal = document.getElementById('pwaModal');
  const modalText = document.getElementById('pwaInstructionsText');
  const closeModal = document.getElementById('closePwaModal');

  if (window.matchMedia('(display-mode: standalone)').matches) {
    return;
  }

  const isiOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

  if (isiOS) {
    installBanner.style.display = 'block';
    installBtn.addEventListener('click', () => {
      modalText.innerHTML = `
        <p>To install this arcade on your iOS device:</p>
        <ol style="text-align: left; margin: 10px 0 10px 20px;">
          <li>Tap the <strong>Share</strong> button <span style="font-size: 1.2rem;">⎋</span> at the bottom of Safari.</li>
          <li>Scroll down and tap <strong>"Add to Home Screen"</strong> <span style="font-size: 1.2rem;">➕</span>.</li>
          <li>Tap <strong>Add</strong> in the top right corner!</li>
        </ol>
      `;
      modal.style.display = 'block';
    });
  } else {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      installBanner.style.display = 'block';

      installBtn.addEventListener('click', async () => {
        installBanner.style.display = 'none';
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        deferredPrompt = null;
      });
    });
  }

  if (closeModal) {
    closeModal.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }
}