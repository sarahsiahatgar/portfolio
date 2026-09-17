export async function loadGames() {
  const gamesGrid = document.getElementById('gamesGrid');
  if (!gamesGrid) return;

  try {
    const response = await fetch('./json/list-of-games.json');
    if (!response.ok) throw new Error('Failed to load games data.');
    
    const games = await response.json();
    gamesGrid.innerHTML = '';

    games.forEach(game => {
      const gameCard = document.createElement('a');
      gameCard.href = game.url || '#';
      gameCard.className = 'game-card';

      gameCard.innerHTML = `
        <div class="game-image-box">
          <img src="${game.image}" alt="${game.name}" loading="lazy">
        </div>
        <span class="game-name">${game.name}</span>
      `;

      gamesGrid.appendChild(gameCard);
    });
  } catch (error) {
    console.error('Error loading games:', error);
    gamesGrid.innerHTML = '<p style="color: #2b331f; grid-column: 1/-1; text-align: center;">Sorry, unable to load games at the moment.</p>';
  }
}