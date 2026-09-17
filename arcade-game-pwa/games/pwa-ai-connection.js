// ai-connection.js
// Shared helper used by every AI game (Tic-Tac-Toe, Connect Four, Gorilla)

const REQUEST_TIMEOUT_MS = 6000;

export class AiUnavailableError extends Error {
  constructor(reason) {
    super(`AI backend unavailable: ${reason}`);
    this.name = 'AiUnavailableError';
  }
}

export async function callAiGames(payload) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new AiUnavailableError('browser reports no network connection');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch('/api/ai-games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new AiUnavailableError(`server responded with ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new AiUnavailableError('request timed out');
    }
    if (err instanceof AiUnavailableError) throw err;
    throw new AiUnavailableError(err.message || 'network error');
  } finally {
    clearTimeout(timeoutId);
  }
}