import { UI_TEXT, KEYBOARDS } from './guessword-config.js';
import { englishDict } from './guessword-dict-english.js';
import { germanDict } from './guessword-dict-german.js';
import { persianDict } from './guessword-dict-persian.js';

const dictionariesData = {
  en: englishDict,
  de: germanDict,
  fa: persianDict
};

const DEFAULT_START_DATE = "2026-08-01";

export function getDateForOffset(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
}

export function formatDateString(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

export function getDaysSinceStart(startDateStr, targetDateObj) {
  const [y, m, d] = startDateStr.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const target = new Date(targetDateObj.getFullYear(), targetDateObj.getMonth(), targetDateObj.getDate());
  const diffTime = target - start;
  
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

const SHUFFLE_SEED = 123456789;

export function getShuffledWord(wordList, dayIndex) {
  const arr = [...wordList];
  let seed = SHUFFLE_SEED;
  for (let i = arr.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const rnd = seed / 233280;
    const j = Math.floor(rnd * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  
  let currentIndex = dayIndex % arr.length;
  let attempts = 0;
  
  while (arr[currentIndex] === 'XXXXX' && attempts < arr.length) {
    currentIndex = (currentIndex + 1) % arr.length;
    attempts++;
  }
  
  return arr[currentIndex];
}

export async function fetchDictionary(lang) {
  const dict = dictionariesData[lang] || dictionariesData.en;
  
  return { ...dict, startDate: dict.startDate || DEFAULT_START_DATE };
}

export function getStateKey(lang, dateStr) {
  return `gw_state_${lang}_${dateStr}`;
}

export function loadGameState(lang, dateStr) {
  let saved;
  try {
    saved = localStorage.getItem(getStateKey(lang, dateStr));
  } catch (e) {
    return null;
  }
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch (e) {
    return null;
  }
}

export function saveGameState(lang, dateStr, stateData) {
  try {
    localStorage.setItem(getStateKey(lang, dateStr), JSON.stringify(stateData));
  } catch (e) {
    console.error('Failed to save game state:', e);
  }
}

export function hasFinishedToday(lang) {
  const todayStr = formatDateString(getDateForOffset(0));
  const state = loadGameState(lang, todayStr);
  return !!(state && state.gameOver);
}

function dateStrToDate(dateStr) {
  const [y, m, d] = dateStr.split('.').map(Number);
  return new Date(y, m - 1, d);
}

function addDaysToDateStr(dateStr, days) {
  const d = dateStrToDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateString(d);
}

function getWinsKey(lang) {
  return `gw_wins_${lang}`;
}

export function loadWinDates(lang) {
  try {
    const raw = localStorage.getItem(getWinsKey(lang));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function recordWin(lang, dateStr) {
  try {
    const dates = new Set(loadWinDates(lang));
    dates.add(dateStr);
    localStorage.setItem(getWinsKey(lang), JSON.stringify([...dates]));
  } catch (e) {
    console.error('Failed to record win date:', e);
  }
}

export function computeStreak(lang, todayDateStr) {
  const winSet = new Set(loadWinDates(lang));
  if (winSet.size === 0) return { current: 0, longest: 0 };

  const sorted = [...winSet].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (addDaysToDateStr(sorted[i - 1], 1) === sorted[i]) {
      run++;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
  }

  const mostRecentWin = sorted[sorted.length - 1];
  const yesterdayStr = addDaysToDateStr(todayDateStr, -1);
  if (mostRecentWin !== todayDateStr && mostRecentWin !== yesterdayStr) {
    return { current: 0, longest };
  }

  let current = 1;
  let cursor = mostRecentWin;
  while (winSet.has(addDaysToDateStr(cursor, -1))) {
    cursor = addDaysToDateStr(cursor, -1);
    current++;
  }

  return { current, longest };
}

export function evaluateGuess(guess, secretWord) {
  const secretChars = secretWord.split('');
  const guessChars = guess.split('');
  const statuses = Array(5).fill('absent');

  for (let i = 0; i < 5; i++) {
    if (guessChars[i] === secretChars[i]) {
      statuses[i] = 'correct';
      secretChars[i] = null;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (statuses[i] !== 'correct') {
      const secretIdx = secretChars.indexOf(guessChars[i]);
      if (secretIdx !== -1) {
        statuses[i] = 'present';
        secretChars[secretIdx] = null;
      }
    }
  }
  return statuses;
}