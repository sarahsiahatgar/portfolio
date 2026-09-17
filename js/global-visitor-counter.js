// js/global-visitor-counter.js

const API_URL = '/api/visitor';
const STORAGE_KEY_NUMBER = 'myVisitorNumber';
const STORAGE_KEY_DATE = 'myVisitorNumberDate';

export function initVisitorCounter() {
  const countEl = document.getElementById('visitorCount');

  function displayCount(count) {
    if (countEl) countEl.textContent = count;
  }

  function todayString() {
    const today = new Date();
    const yy = String(today.getFullYear()).slice(-2);
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
  }

  async function fetchAndIncrement() {
    try {
      const response = await fetch(`${API_URL}?increment=true`);
      const data = await response.json();
      const count = data.visitor_count || '1';
      displayCount(count);

      try {
        localStorage.setItem(STORAGE_KEY_NUMBER, count);
        localStorage.setItem(STORAGE_KEY_DATE, todayString());
      } catch (err) {
        console.error('localStorage unavailable for visit tracking:', err);
      }
    } catch (err) {
      console.error('Failed to fetch visitor count:', err);
      displayCount('—');
    }
  }

  async function fetchWithoutIncrement() {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      displayCount(data.visitor_count || '1');
    } catch (err) {
      console.error('Failed to fetch visitor count:', err);
      displayCount('—');
    }
  }

  try {
    const savedNumber = localStorage.getItem(STORAGE_KEY_NUMBER);
    const savedDate = localStorage.getItem(STORAGE_KEY_DATE);

    if (savedNumber && savedDate === todayString()) {
      displayCount(savedNumber);
    } else {
      fetchAndIncrement();
    }
  } catch (err) {
    console.error('localStorage unavailable for visit tracking:', err);
    fetchWithoutIncrement();
  }
}