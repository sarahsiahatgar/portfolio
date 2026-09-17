/**
 * vikingII-leaderboard.js
 */

const API_URL = "api/games/leaderboard";

export async function fetchLeaderboard(onScoreRetrieved) {
  const listEl = document.getElementById("leaderboardList");
  if (!listEl) return 0;

  try {
    const response = await fetch(`${API_URL}?action=get_leaderboard&game=viking2`);
    const items = await response.json();
    listEl.innerHTML = "";

    listEl.style.background = "#5C673C";
    listEl.style.borderRadius = "6px";
    listEl.style.padding = "6px";

    if (!items || items.length === 0) {
      listEl.innerHTML = "<li style='text-align: center; color: #1e2319;'>No high scores yet. Be the first!</li>";
      if (onScoreRetrieved) onScoreRetrieved(0);
      return 0;
    }

    const cloudHighScore = parseInt(items[0].score) || 0;
    if (onScoreRetrieved) onScoreRetrieved(cloudHighScore);

    items.forEach((item, idx) => {
      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.justifyContent = "space-between";
      li.style.padding = "4px 6px";

      if (idx === 0) {
        li.style.color = "#d4af37";
        li.style.fontWeight = "bold";
      } else if (idx === 1) {
        li.style.color = "#c0c0c0";
        li.style.fontWeight = "bold";
      } else if (idx === 2) {
        li.style.color = "#cd7f32";
        li.style.fontWeight = "bold";
      } else {
        li.style.color = "#1e2319";
      }

      const nameSpan = document.createElement("span");
      nameSpan.textContent = `${idx + 1}. ${item.playerName || item.name}`;

      const scoreSpan = document.createElement("span");
      scoreSpan.textContent = `${item.score} pts`;
      scoreSpan.style.fontWeight = "bold";

      li.appendChild(nameSpan);
      li.appendChild(scoreSpan);
      listEl.appendChild(li);
    });

    return cloudHighScore;
  } catch (err) {
    console.error("Error loading leaderboard:", err);
    listEl.innerHTML = "<li style='text-align: center; color: #1e2319;'>Could not load cloud leaderboard.</li>";
    return 0;
  }
}

export async function submitScore(score, onSuccessCallback) {
  const nameInput = document.getElementById("playerName").value.trim() || "Anonymous";
  const errorEl = document.getElementById("scoreErrorMsg");

  if (errorEl) {
    errorEl.style.display = "none";
    errorEl.textContent = "";
  }

  try {
    const response = await fetch(`${API_URL}?action=submit_score&game=viking2&name=${encodeURIComponent(nameInput)}&score=${score}`);
    await response.json();

    if (onSuccessCallback) {
      await onSuccessCallback();
    }
  } catch (err) {
    console.error("Error submitting score:", err);
    if (errorEl) {
      errorEl.textContent = "Could not save score. Please check your internet connection and try again.";
      errorEl.style.display = "block";
    }
  }
}