import { initNavigation } from './pwa-global-navigation-and-footer.js';
import { initHamburger } from './pwa-global-hamburger.js';
import { loadGames } from '../games/pwa-arcade-loader.js';
import { playRandomAnimation, stopAnimation, SHOWTIME_MS } from './crt-screen-animations.js';

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

const PIXEL_COIN_SVG = `<svg class="coin-svg" viewBox="0 0 8 8" shape-rendering="crispEdges"><use href="./svg/icons.svg#icon-coin"></use></svg>`;

function buildCoinOnlyCard() {
  const card = document.createElement('div');
  card.className = 'coin-only-card';
  card.setAttribute('aria-hidden', 'true');
  card.innerHTML = `
    <div class="coin-only-frame">
      <div class="crt-off-screen" data-screen>
        <div class="crt-picture" data-picture>
          <canvas class="crt-noise" data-noise></canvas>
          <canvas class="crt-anim" data-anim></canvas>
        </div>
        <div class="crt-flash-line" data-flash></div>
      </div>
      <div class="coin-slot-box">
        <div class="rivet rivet-top"></div>
        <div class="stamp"></div>
        <div class="slot-label"><span class="slot-label-line">insert</span><span class="slot-label-line">coin</span></div>
        <div class="slot-groove" data-slot-target></div>
        <div class="change-tray" data-tray><div class="tray-slot"></div></div>
        <div class="rivet rivet-bottom"></div>
        
        <!-- Custom Sticker Decals -->
        <div class="arcade-sticker sticker-smiley">
          <svg><use href="./svg/icons.svg#icon-smiley"></use></svg>
        </div>
        <div class="arcade-sticker sticker-mushroom">
          <svg><use href="./svg/icons.svg#icon-mushroom"></use></svg>
        </div>
        <div class="arcade-sticker sticker-beer">
          <svg><use href="./svg/icons.svg#icon-beer"></use></svg>
        </div>
		<div class="arcade-sticker sticker-badge">
          <svg><use href="./svg/icons.svg#icon-badge"></use></svg>
        </div>
      </div>
      <div class="pixel-coin-wrap" data-coin ondragstart="return false">${PIXEL_COIN_SVG}</div>
    </div>
  `;
  return card;
}

function startTvStatic(canvas) {
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = 40);
  const h = (canvas.height = 52);
  const frame = ctx.createImageData(w, h);
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function draw() {
    const buf = frame.data;
    for (let i = 0; i < buf.length; i += 4) {
      const shade = (Math.random() * 255) | 0;
      buf[i] = shade;
      buf[i + 1] = shade;
      buf[i + 2] = shade;
      buf[i + 3] = 255;
    }
    ctx.putImageData(frame, 0, 0);
  }

  draw();
  if (reduceMotion) return { stop() {} };

  const id = setInterval(draw, 80);
  return { stop() { clearInterval(id); } };
}

function setupCoinDrag(frame) {
  const coin = frame.querySelector('[data-coin]');
  const groove = frame.querySelector('[data-slot-target]');
  const tray = frame.querySelector('[data-tray]');
  const screen = frame.querySelector('[data-screen]');
  const picture = frame.querySelector('[data-picture]');
  const flash = frame.querySelector('[data-flash]');
  const animCanvas = frame.querySelector('[data-anim]');
  if (!coin || !groove || !tray) return;

  if (animCanvas) {
    animCanvas.width = 124;
    animCanvas.height = 124;
  }

  let dragging = false;
  let startX = 0, startY = 0, curX = 0, curY = 0;
  let landed = false;
  let cycleBusy = false;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function powerOff(callback) {
    if (!picture) return callback();
    if (reduceMotion) {
      picture.classList.add('is-hidden');
      if (screen) screen.classList.add('is-off');
      callback();
      return;
    }
    picture.classList.add('crt-power-off');
    if (flash) flash.classList.add('flash-off');
    picture.addEventListener('animationend', function onDone(ev) {
      if (ev.animationName !== 'crtPictureOff') return;
      picture.removeEventListener('animationend', onDone);
      picture.classList.remove('crt-power-off');
      picture.classList.add('is-hidden');
      if (flash) flash.classList.remove('flash-off');
      if (screen) screen.classList.add('is-off');
      callback();
    });
  }

  function powerOn(callback) {
    if (!picture) return callback();
    if (reduceMotion) {
      picture.classList.remove('is-hidden');
      if (screen) screen.classList.remove('is-off');
      callback();
      return;
    }
    if (screen) screen.classList.remove('is-off');
    picture.classList.remove('is-hidden');
    picture.classList.add('crt-power-on');
    if (flash) flash.classList.add('flash-on');
    picture.addEventListener('animationend', function onDone(ev) {
      if (ev.animationName !== 'crtPictureOn') return;
      picture.removeEventListener('animationend', onDone);
      picture.classList.remove('crt-power-on');
      if (flash) flash.classList.remove('flash-on');
      callback();
    });
  }

  function getStaticRect(el) {
    const prevTransform = el.style.transform;
    el.style.transform = 'none';
    const rect = el.getBoundingClientRect();
    el.style.transform = prevTransform;
    return rect;
  }

  function returnCoinToFrame() {
    const liveRect = coin.getBoundingClientRect();
    coin.style.transition = 'none';
    coin.style.top = '';
    coin.style.left = '';
    frame.appendChild(coin);
    const staticRect = getStaticRect(coin);
    curX = liveRect.left - staticRect.left;
    curY = liveRect.top - staticRect.top;
    coin.style.transform = `translate(${curX}px,${curY}px)`;
    landed = false;
  }

  function resetForGrab() {
    if (coin.getAnimations) coin.getAnimations().forEach((a) => a.cancel());
    coin.style.transition = 'none';
    coin.style.opacity = '1';
    coin.style.transform = `translate(${curX}px,${curY}px) scaleX(1) scaleY(1) rotate(0deg)`;
  }

  coin.addEventListener('pointerdown', (e) => {
    if (cycleBusy) return;
    if (landed) returnCoinToFrame();
    resetForGrab();
    dragging = true;
    coin.setPointerCapture(e.pointerId);
    startX = e.clientX;
    startY = e.clientY;
  });

  coin.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    coin.style.transform = `translate(${curX + dx}px,${curY + dy}px)`;
  });

  coin.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    curX += dx;
    curY += dy;

    const coinRect = coin.getBoundingClientRect();
    const slotRect = groove.getBoundingClientRect();
    const cx = coinRect.left + coinRect.width / 2;
    const cy = coinRect.top + coinRect.height / 2;
    const hit = cx > slotRect.left - 16 && cx < slotRect.right + 16 && cy > slotRect.top - 70 && cy < slotRect.bottom + 20;

    if (!hit) {
      coin.style.transition = 'transform 0.25s ease';
      coin.style.transform = `translate(${curX}px,${curY}px)`;
      return;
    }

    const shiftX = (slotRect.left + slotRect.width / 2) - cx;
    const phase1X = curX + shiftX;
    const phase1Y = curY;
    coin.style.transition = 'transform 0.22s ease-in';
    coin.style.transform = `translate(${phase1X}px,${phase1Y}px) scaleX(0.12) rotate(6deg)`;

    coin.addEventListener('transitionend', function onP1(ev) {
      if (ev.propertyName !== 'transform') return;
      coin.removeEventListener('transitionend', onP1);

      const entryY = phase1Y + (slotRect.top - cy) + 12;
      coin.style.transition = 'transform 0.2s ease-in, opacity 0.14s ease 0.04s';
      coin.style.transform = `translate(${phase1X}px,${entryY}px) scaleX(0.12) rotate(8deg)`;
      coin.style.opacity = '0';

      coin.addEventListener('transitionend', function onP2(ev2) {
        if (ev2.propertyName !== 'transform') return;
        coin.removeEventListener('transitionend', onP2);
        coin.style.transition = 'none';
        cycleBusy = true;

        function dropCoinInTray() {
          coin.style.transform = 'none';
          coin.style.top = '50%';
          coin.style.left = '50%';
          tray.appendChild(coin);
          landed = true;

          const anim = coin.animate([
            { transform: 'translate(-50%,-50%) translateY(-18px) scaleX(0.12) scaleY(1) rotate(0deg)', opacity: 0, offset: 0 },
            { transform: 'translate(-50%,-50%) translateY(-18px) scaleX(0.12) scaleY(1) rotate(0deg)', opacity: 1, offset: 0.08 },
            { transform: 'translate(-50%,-50%) translateY(-6px) scaleX(0.55) scaleY(0.7) rotate(35deg)', opacity: 1, offset: 0.4 },
            { transform: 'translate(-50%,-50%) translateY(-2px) scaleX(1) scaleY(0.34) rotate(4deg)', opacity: 1, offset: 0.58 },
            { transform: 'translate(-50%,-50%) translateY(-1px) scaleX(1) scaleY(0.018) rotate(-3deg)', opacity: 1, offset: 0.75 },
            { transform: 'translate(-50%,-50%) translateY(-2px) scaleX(1) scaleY(0.28) rotate(1.5deg)', opacity: 1, offset: 0.9 },
            { transform: 'translate(-50%,-50%) translateY(-2px) scaleX(1) scaleY(0.23) rotate(0deg)', opacity: 1, offset: 1 },
          ], { duration: 650, easing: 'cubic-bezier(0.4,0,0.6,1)', fill: 'forwards' });

          anim.onfinish = () => {
            coin.style.transform = 'translate(-50%,-50%) scaleX(1) scaleY(0.13) rotate(0deg)';
            coin.style.opacity = '1';
          };
        }

        function endShowtime() {
		  stopAnimation();
          dropCoinInTray();
          powerOff(() => {
            if (picture) picture.classList.remove('showtime');
            powerOn(() => { cycleBusy = false; });
          });
        }

        powerOff(() => {
          if (!animCanvas || reduceMotion) {
            setTimeout(endShowtime, reduceMotion ? SHOWTIME_MS : 0);
            return;
          }
          if (picture) picture.classList.add('showtime');
          powerOn(() => {
            playRandomAnimation(animCanvas, endShowtime);
          });
        });
      });
    });
  });
}

function appendCoinOnlySlot() {
  const grid = document.getElementById('gamesGrid');
  if (!grid) return;

  const card = buildCoinOnlyCard();
  grid.appendChild(card);

  const frame = card.querySelector('.coin-only-frame');
  setupCoinDrag(frame);

  const noiseCanvas = card.querySelector('[data-noise]');
  if (noiseCanvas) startTvStatic(noiseCanvas);
}

document.addEventListener('DOMContentLoaded', async () => {
  await initNavigation();
  initHamburger();
  await loadGames();
  appendCoinOnlySlot();

  const modal = document.getElementById('installGuideModal');
  const btn = document.getElementById('openGuideBtn');
  const span = document.getElementById('closeGuideModal');

  if (btn && modal && span) {
    btn.addEventListener('click', () => { modal.style.display = 'block'; });
    span.addEventListener('click', () => { modal.style.display = 'none'; });
    window.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('Arcade Service Worker Registered!', reg.scope))
      .catch((err) => console.log('Service Worker registration failed:', err));
  });
}