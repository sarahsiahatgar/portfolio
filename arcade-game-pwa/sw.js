const CACHE_NAME = 'arcade-cache-v9';

const assetsToCache = [
  //GAMES
  '/arcade-game-pwa/games/breakout/game-breakout.html',
  '/arcade-game-pwa/games/breakout/breakout.css',
  '/arcade-game-pwa/games/breakout/breakout.WebP',
  '/arcade-game-pwa/games/breakout/game-icon-breakout.WebP',
  '/arcade-game-pwa/games/breakout/breakout-card.js',
  '/arcade-game-pwa/games/breakout/breakout.js',
  '/arcade-game-pwa/games/breakout/breakout-config.js',
  '/arcade-game-pwa/games/breakout/breakout-engine.js',
  '/arcade-game-pwa/games/breakout/breakout-layouts.js',
  '/arcade-game-pwa/games/breakout/manifest.json',
  
  '/arcade-game-pwa/games/connect-four/game-connect-four.html',
  '/arcade-game-pwa/games/connect-four/connect-four.css',
  '/arcade-game-pwa/games/connect-four/connect-four.WebP',
  '/arcade-game-pwa/games/connect-four/game-icon-connect-four.WebP',
  '/arcade-game-pwa/games/connect-four/connect-four-card.js',
  '/arcade-game-pwa/games/connect-four/connect-four.js',
  '/arcade-game-pwa/games/connect-four/connect-four-offline.js',
  '/arcade-game-pwa/games/connect-four/manifest.json',

  '/arcade-game-pwa/games/dot-eater/game-dot-eater.html',
  '/arcade-game-pwa/games/dot-eater/dot-eater.css',
  '/arcade-game-pwa/games/dot-eater/dot-eater.WebP',
  '/arcade-game-pwa/games/dot-eater/game-icon-dot-eater.WebP',
  '/arcade-game-pwa/games/dot-eater/dot-eater-card.js',
  '/arcade-game-pwa/games/dot-eater/dot-eater.js',
  '/arcade-game-pwa/games/dot-eater/manifest.json',

  '/arcade-game-pwa/games/gorilla/game-gorilla.html',
  '/arcade-game-pwa/games/gorilla/gorilla.css',
  '/arcade-game-pwa/games/gorilla/gorillasound.m4a',
  '/arcade-game-pwa/games/gorilla/gorilla.WebP',
  '/arcade-game-pwa/games/gorilla/game-icon-gorilla.WebP',
  '/arcade-game-pwa/games/gorilla/gorilla-card.js',
  '/arcade-game-pwa/games/gorilla/gorilla.js',
  '/arcade-game-pwa/games/gorilla/gorilla-iosWheel.js',
  '/arcade-game-pwa/games/gorilla/manifest.json',

  '/arcade-game-pwa/games/guessword/game-guessword.html',
  '/arcade-game-pwa/games/guessword/guessword.css',
  '/arcade-game-pwa/games/guessword/guessword.WebP',
  '/arcade-game-pwa/games/guessword/game-icon-guessword.WebP',
  '/arcade-game-pwa/games/guessword/guessword-card.js',
  '/arcade-game-pwa/games/guessword/guessword.js',
  '/arcade-game-pwa/games/guessword/guessword-config.js',
  '/arcade-game-pwa/games/guessword/guessword-engine.js',
  '/arcade-game-pwa/games/guessword/guessword-dict-english.js',
  '/arcade-game-pwa/games/guessword/guessword-dict-german.js',
  '/arcade-game-pwa/games/guessword/guessword-dict-persian.js',
  '/arcade-game-pwa/games/guessword/manifest.json',
  '/arcade-game-pwa/games/guessword/fonts/Nahid.woff',
  '/arcade-game-pwa/games/guessword/fonts/Nahid.woff2',

  '/arcade-game-pwa/games/mastermind/game-mastermind.html',
  '/arcade-game-pwa/games/mastermind/mastermind.css',
  '/arcade-game-pwa/games/mastermind/mastermind.WebP',
  '/arcade-game-pwa/games/mastermind/game-icon-mastermind.WebP',
  '/arcade-game-pwa/games/mastermind/mastermind-card.js',
  '/arcade-game-pwa/games/mastermind/mastermind.js',
  '/arcade-game-pwa/games/mastermind/manifest.json',

  '/arcade-game-pwa/games/memory-match/game-memory-match.html',
  '/arcade-game-pwa/games/memory-match/memory-match.css',
  '/arcade-game-pwa/games/memory-match/memory-match.WebP',
  '/arcade-game-pwa/games/memory-match/game-icon-memory-match.WebP',
  '/arcade-game-pwa/games/memory-match/memory-match-card.js',
  '/arcade-game-pwa/games/memory-match/memory-match.js',
  '/arcade-game-pwa/games/memory-match/manifest.json',

  '/arcade-game-pwa/games/minesweeper/game-minesweeper.html',
  '/arcade-game-pwa/games/minesweeper/minesweeper.css',
  '/arcade-game-pwa/games/minesweeper/minesweeper.WebP',
  '/arcade-game-pwa/games/minesweeper/game-icon-minesweeper.WebP',
  '/arcade-game-pwa/games/minesweeper/minesweeper-card.js',
  '/arcade-game-pwa/games/minesweeper/minesweeper.js',
  '/arcade-game-pwa/games/minesweeper/manifest.json',

  '/arcade-game-pwa/games/nibble/game-nibble.html',
  '/arcade-game-pwa/games/nibble/nibble.css',
  '/arcade-game-pwa/games/nibble/nibble.WebP',
  '/arcade-game-pwa/games/nibble/game-icon-nibble.WebP',
  '/arcade-game-pwa/games/nibble/nibble-card.js',
  '/arcade-game-pwa/games/nibble/nibble.js',
  '/arcade-game-pwa/games/nibble/nibble-levels.js',
  '/arcade-game-pwa/games/nibble/manifest.json',

  '/arcade-game-pwa/games/pond-hopper/game-pond-hopper.html',
  '/arcade-game-pwa/games/pond-hopper/pond-hopper.css',
  '/arcade-game-pwa/games/pond-hopper/pond-hopper.WebP',
  '/arcade-game-pwa/games/pond-hopper/game-icon-pond-hopper.WebP',
  '/arcade-game-pwa/games/pond-hopper/pond-hopper-card.js',
  '/arcade-game-pwa/games/pond-hopper/pond-hopper.js',
  '/arcade-game-pwa/games/pond-hopper/pond-hopper-renderer.js',
  '/arcade-game-pwa/games/pond-hopper/manifest.json',

  '/arcade-game-pwa/games/raindrop/game-raindrop.html',
  '/arcade-game-pwa/games/raindrop/raindrop.css',
  '/arcade-game-pwa/games/raindrop/raindrop.WebP',
  '/arcade-game-pwa/games/raindrop/game-icon-raindrop.WebP',
  '/arcade-game-pwa/games/raindrop/raindrop-card.js',
  '/arcade-game-pwa/games/raindrop/raindrop.js',
  '/arcade-game-pwa/games/raindrop/manifest.json',

  '/arcade-game-pwa/games/set/game-set.html',
  '/arcade-game-pwa/games/set/set.css',
  '/arcade-game-pwa/games/set/set.WebP',
  '/arcade-game-pwa/games/set/game-icon-set.WebP',
  '/arcade-game-pwa/games/set/set-card.js',
  '/arcade-game-pwa/games/set/set.js',
  '/arcade-game-pwa/games/set/manifest.json',

  '/arcade-game-pwa/games/tictactoe/game-tictactoe.html',
  '/arcade-game-pwa/games/tictactoe/tictactoe.css',
  '/arcade-game-pwa/games/tictactoe/tictactoe.WebP',
  '/arcade-game-pwa/games/tictactoe/game-icon-tictactoe.WebP',
  '/arcade-game-pwa/games/tictactoe/tictactoe-card.js',
  '/arcade-game-pwa/games/tictactoe/tictactoe.js',
  '/arcade-game-pwa/games/tictactoe/tictactoe-offline.js',
  '/arcade-game-pwa/games/tictactoe/manifest.json',

  '/arcade-game-pwa/games/vikingII/game-vikingII.html',
  '/arcade-game-pwa/games/vikingII/vikingII.css',
  '/arcade-game-pwa/games/vikingII/vikingII.WebP',
  '/arcade-game-pwa/games/vikingII/game-icon-vikingII.WebP',
  '/arcade-game-pwa/games/vikingII/vikingII-card.js',
  '/arcade-game-pwa/games/vikingII/vikingII.js',
  '/arcade-game-pwa/games/vikingII/vikingII-leaderboard.js',
  '/arcade-game-pwa/games/vikingII/vikingII-renderer.js',
  '/arcade-game-pwa/games/vikingII/manifest.json',

  // HTML files
  '/arcade-game-pwa/pwa-home.html',
  '/arcade-game-pwa/pwa-footer.html',
  '/arcade-game-pwa/pwa-header.html',
  '/arcade-game-pwa/pwa-contact-me.html',

  // JSON files
  '/arcade-game-pwa/manifest.json',
  '/arcade-game-pwa/json/list-of-games.json',

  // media files
  '/arcade-game-pwa/img/pwa-logo.WebP',
  '/arcade-game-pwa/img/pwa-contact-pic.WebP',
  '/arcade-game-pwa/img/pwa-contact-video.mp4',
  '/arcade-game-pwa/img/pwa-oneko.gif',

  // SVG
  '/arcade-game-pwa/svg/icons.svg',

  // Stylesheets
  '/arcade-game-pwa/css/pwa-oneko.css',
  '/arcade-game-pwa/css/pwa-global.css',
  '/arcade-game-pwa/css/pwa-home.css',
  '/arcade-game-pwa/css/pwa-guide-button.css',
  '/arcade-game-pwa/css/pwa-contact-me.css',
  '/arcade-game-pwa/games/pwa-0-global-game.css',

  // JS Modules
  '/arcade-game-pwa/games/pwa-game-help.js',
  '/arcade-game-pwa/games/pwa-ai-connection.js',
  '/arcade-game-pwa/games/pwa-arcade-loader.js',
  '/arcade-game-pwa/js/crt-screen-animation.js',
  '/arcade-game-pwa/js/insert-coin.js',
  '/arcade-game-pwa/js/pwa-oneko.js',
  '/arcade-game-pwa/js/pwa-contact-me.js',
  '/arcade-game-pwa/js/pwa-global-hamburger.js',
  '/arcade-game-pwa/js/pwa-global-navigation-and-footer.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of assetsToCache) {
        try {
          const response = await fetch(asset, { redirect: 'follow' });

          if (response.ok && !response.redirected) {
            await cache.put(asset, response);
          } else if (response.redirected) {
            console.warn(`Skipped caching redirected asset (would break SW navigation): ${asset} -> ${response.url}`);
          } else {
            console.warn(`Skipped asset (status ${response.status}): ${asset}`);
          }
        } catch (err) {
          console.warn(`Skipped missing or unreachable asset: ${asset}`);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (!response.ok) {
            return new Response(JSON.stringify({ status: "offline_or_local", scores: [] }), {
              headers: { 'Content-Type': 'application/json' }
            });
          }
          return response;
        })
        .catch(() => {
          return new Response(JSON.stringify({ status: "offline", scores: [] }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse && cachedResponse.redirected) {
            return fetch(event.request);
          }
          return cachedResponse || caches.match('/arcade-game-pwa/pwa-home.html');
        })
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});