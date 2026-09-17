// breakoutLayouts.js

export const BREAKOUT_LEVELS = [
  // Level 1: Classic Rows
  [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [2, 2, 2, 2, 2, 2, 2, 2],
    [3, 3, 3, 3, 3, 3, 3, 3]
  ],
  // Level 2: Checkerboard
  [
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 2, 0, 2, 0, 2, 0, 2],
    [3, 0, 3, 0, 3, 0, 3, 0],
    [0, 4, 0, 4, 0, 4, 0, 4]
  ],
  // Level 3: Pyramid
  [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 2, 2, 2, 2, 0, 0],
    [0, 3, 3, 3, 3, 3, 3, 0],
    [4, 4, 4, 4, 4, 4, 4, 4]
  ],
  // Level 4: The Pillars
  [
    [1, 1, 0, 2, 2, 0, 3, 3],
    [1, 1, 0, 2, 2, 0, 3, 3],
    [1, 1, 0, 2, 2, 0, 3, 3],
    [1, 1, 0, 2, 2, 0, 3, 3]
  ],
  // Level 5: Diamond
  [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 2, 2, 2, 2, 0, 0],
    [0, 3, 3, 0, 0, 3, 3, 0],
    [4, 4, 0, 0, 0, 0, 4, 4]
  ],
  // Level 6: Zigzag
  [
    [1, 0, 0, 0, 0, 0, 0, 2],
    [0, 3, 0, 0, 0, 0, 4, 0],
    [0, 0, 1, 0, 0, 2, 0, 0],
    [0, 0, 0, 3, 4, 0, 0, 0]
  ],
  // Level 7: Castle Walls
  [
    [1, 0, 1, 0, 0, 1, 0, 1],
    [2, 2, 2, 2, 2, 2, 2, 2],
    [3, 0, 3, 3, 3, 3, 0, 3],
    [4, 4, 4, 0, 0, 4, 4, 4]
  ],
  // Level 8: Tunnel
  [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [2, 0, 0, 0, 0, 0, 0, 2],
    [3, 0, 0, 0, 0, 0, 0, 3],
    [4, 4, 4, 4, 4, 4, 4, 4]
  ],
  // Level 9: Scatter Grid
  [
    [1, 0, 2, 0, 3, 0, 4, 0],
    [0, 2, 0, 3, 0, 4, 0, 1],
    [3, 0, 4, 0, 1, 0, 2, 0],
    [0, 4, 0, 1, 0, 2, 0, 3]
  ],
  // Level 10: The Gauntlet
  [
    [4, 4, 4, 4, 4, 4, 4, 4],
    [3, 3, 3, 3, 3, 3, 3, 3],
    [2, 2, 2, 2, 2, 2, 2, 2],
    [1, 1, 1, 1, 1, 1, 1, 1]
  ],
  // Level 11: Alien Invader
  [
    [0, 1, 0, 0, 0, 0, 1, 0],
    [0, 0, 2, 0, 0, 2, 0, 0],
    [3, 3, 3, 3, 3, 3, 3, 3],
    [4, 0, 4, 4, 4, 4, 0, 4]
  ],
  // Level 12: Plus Sign
  [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [2, 2, 2, 2, 2, 2, 2, 2],
    [0, 0, 0, 3, 3, 0, 0, 0],
    [0, 0, 0, 4, 4, 0, 0, 0]
  ],
  // Level 13: Vertical Stripes
  [
    [1, 0, 2, 0, 3, 0, 4, 0],
    [1, 0, 2, 0, 3, 0, 4, 0],
    [1, 0, 2, 0, 3, 0, 4, 0],
    [1, 0, 2, 0, 3, 0, 4, 0]
  ],
  // Level 14: Twin Peaks
  [
    [0, 1, 0, 0, 0, 0, 1, 0],
    [2, 2, 2, 0, 0, 2, 2, 2],
    [3, 3, 3, 3, 3, 3, 3, 3],
    [0, 4, 0, 0, 0, 0, 4, 0]
  ],
  // Level 15: Dense Checkerboard
  [
    [4, 0, 3, 0, 2, 0, 1, 0],
    [0, 4, 0, 3, 0, 2, 0, 1],
    [1, 0, 2, 0, 3, 0, 4, 0],
    [0, 1, 0, 2, 0, 3, 0, 4]
  ],
  // Level 16: Upward Arrow
  [
    [0, 0, 0, 4, 4, 0, 0, 0],
    [0, 0, 3, 3, 3, 3, 0, 0],
    [0, 2, 2, 2, 2, 2, 2, 0],
    [1, 1, 0, 0, 0, 0, 1, 1]
  ],
  // Level 17: Outer Frame
  [
    [4, 4, 4, 4, 4, 4, 4, 4],
    [4, 0, 0, 0, 0, 0, 0, 4],
    [3, 0, 2, 2, 2, 2, 0, 3],
    [3, 0, 1, 1, 1, 1, 0, 3]
  ],
  // Level 18: Hourglass
  [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 2, 2, 0, 0, 2, 2, 0],
    [0, 0, 3, 3, 3, 3, 0, 0],
    [4, 4, 4, 4, 4, 4, 4, 4]
  ],
  // Level 19: Stepped Terraces
  [
    [1, 1, 0, 0, 0, 0, 0, 0],
    [0, 2, 2, 0, 0, 0, 0, 0],
    [0, 0, 3, 3, 0, 0, 0, 0],
    [0, 0, 0, 4, 4, 4, 4, 4]
  ],
  // Level 20: Wave Pattern
  [
    [1, 2, 3, 4, 4, 3, 2, 1],
    [2, 3, 4, 0, 0, 4, 3, 2],
    [3, 4, 0, 0, 0, 0, 4, 3],
    [4, 0, 0, 1, 1, 0, 0, 4]
  ]
];

export const BREAKOUT_LEVEL_NAMES = [
  "Classic Rows",
  "Checkerboard",
  "Pyramid",
  "The Pillars",
  "Diamond",
  "Zigzag",
  "Castle Walls",
  "Tunnel",
  "Scatter Grid",
  "The Gauntlet",
  "Alien Invader",
  "Plus Sign",
  "Vertical Stripes",
  "Twin Peaks",
  "Dense Checkerboard",
  "Upward Arrow",
  "Outer Frame",
  "Hourglass",
  "Stepped Terraces",
  "Wave Pattern"
];

export const BLOCK_COLORS = {
  1: '#3498db', // Blue
  2: '#2ecc71', // Green
  3: '#f39c12', // Orange
  4: '#e74c3c'  // Red
};

export function populateLevelDropdowns(selectEl, optionsContainerEl) {
  if (!selectEl || !optionsContainerEl) return;

  selectEl.innerHTML = '';
  optionsContainerEl.innerHTML = '';

  BREAKOUT_LEVELS.forEach((_, index) => {
    const levelNum = index + 1;
    const levelName = BREAKOUT_LEVEL_NAMES[index] || '';
    const label = levelName ? `Level ${levelNum}: ${levelName}` : `Level ${levelNum}`;

    const option = document.createElement('option');
    option.value = index;
    option.textContent = label;
    selectEl.appendChild(option);
  });

  for (let i = BREAKOUT_LEVELS.length - 1; i >= 0; i--) {
    const levelNum = i + 1;
    const levelName = BREAKOUT_LEVEL_NAMES[i] || '';
    const label = levelName ? `Level ${levelNum}: ${levelName}` : `Level ${levelNum}`;

    const customDiv = document.createElement('div');
    customDiv.className = 'custom-option';
    customDiv.dataset.value = i;
    customDiv.textContent = label;
    optionsContainerEl.appendChild(customDiv);
  }
}