// ==========================================
// SCRUM SANDBOX STATE & LOGIC
// ==========================================

let currentRole = 'product-owner';

const API_ENDPOINT = "/api/scrum";

let backlogData = [];

let sprintConfig = {
  sprintName: "",
  durationDays: 14,
  startDate: new Date().toISOString().split('T')[0],
  deadlineDate: ""
};

let visibleMonth = new Date();

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function parseJsonResponse(response) {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Unexpected response from the server (status ${response.status}). Please try again in a moment.`);
  }
}

function setStatusMsg(el, text, isError) {
  if (!el) return;
  el.style.display = 'block';
  el.classList.toggle('status-ok', !isError);
  el.classList.toggle('status-error', !!isError);
  el.innerHTML = text;
}

function setResultBox(el, headingText, bodyHtml, isError) {
  if (!el) return;
  el.style.display = 'block';
  el.classList.toggle('is-error', !!isError);
  el.innerHTML = `
    <h4 class="ai-result-heading${isError ? ' is-error-text' : ''}">${escapeHtml(headingText)}</h4>
    <p class="ai-result-text${isError ? ' is-error-text' : ''}">${bodyHtml}</p>
  `;
}

function getHoneypotValue() {
  const field = document.getElementById('companyField');
  return field ? field.value : '';
}

export function initScrumBoard() {
  renderRoleView(currentRole);
  setupCalendarGlobalListeners();
}

export function switchRole(role) {
  currentRole = role;

  const buttons = document.querySelectorAll('.role-btn');
  buttons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.role === role);
  });

  renderRoleView(role);
}

// ==========================================
// SPRINT HEALTH CALCULATION
// ==========================================
function calculateSprintHealth() {
  if (!sprintConfig.deadlineDate) {
    return {
      status: '<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-status-unknown"></use></svg>Unknown',
      color: 'rgba(43, 51, 31, 0.55)',
      text: 'Target deadline is not set.'
    };
  }

  const totalPoints = backlogData.reduce((sum, item) => sum + item.points, 0);
  const completedPoints = backlogData.filter(i => i.status === 'Done').reduce((sum, item) => sum + item.points, 0);

  const start = new Date(sprintConfig.startDate);
  const deadline = new Date(sprintConfig.deadlineDate);
  const now = new Date();

  const totalDuration = deadline - start;
  const elapsed = now - start;
  const timeProgressRatio = totalDuration > 0 ? Math.min(Math.max(elapsed / totalDuration, 0), 1) : 0;
  const workProgressRatio = totalPoints > 0 ? completedPoints / totalPoints : 0;

  if (now > deadline && workProgressRatio < 1) {
    return { 
      status: '<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-status-bad"></use></svg>Overdue / Delayed', 
      color: 'var(--ink-live, #8a3b2b)', 
      text: 'Sprint deadline has passed with unfinished tasks.' 
    };
  } else if (workProgressRatio >= timeProgressRatio || workProgressRatio === 1) {
    return { 
      status: '<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-status-good"></use></svg>On Track', 
      color: 'var(--ink-dev, #5c5f3f)', 
      text: 'Team velocity is meeting or exceeding the schedule timeline.' 
    };
  } else if (timeProgressRatio - workProgressRatio > 0.3) {
    return { 
      status: '<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-status-bad"></use></svg>Delayed (High Risk)', 
      color: 'var(--ink-live, #8a3b2b)', 
      text: 'Significant gap between elapsed time and completed points.' 
    };
  } else {
    return { 
      status: '<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-status-warning"></use></svg>At Risk', 
      color: 'var(--ink-beta, #8a6a2b)', 
      text: 'Slightly behind schedule. Consider reducing scope.' 
    };
  }
}

// ==========================================
// CUSTOM CALENDAR LOGIC (calendar.html)
// ==========================================
function pad(num) {
  return String(num).padStart(2, "0");
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isSameDate(first, second) {
  if (!first || !second) return false;
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export function renderCalendar() {
  const monthTitle = document.getElementById("sandboxMonthTitle");
  const daysContainer = document.getElementById("sandboxDays");
  if (!monthTitle || !daysContainer) return;

  const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  monthTitle.textContent = monthFormatter.format(visibleMonth);
  daysContainer.innerHTML = "";

  let firstDay = new Date(year, month, 1).getDay();
  firstDay = (firstDay === 0) ? 6 : firstDay - 1;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const selectedDate = sprintConfig.deadlineDate ? new Date(sprintConfig.deadlineDate + 'T00:00:00') : null;

  for (let i = 0; i < firstDay; i++) {
    const emptyDay = document.createElement("span");
    emptyDay.className = "sandbox-day empty";
    emptyDay.setAttribute("aria-hidden", "true");
    daysContainer.appendChild(emptyDay);
  }

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
    const date = new Date(year, month, dayNumber);
    const dayButtonEl = document.createElement("button");

    dayButtonEl.type = "button";
    dayButtonEl.className = "sandbox-day";
    dayButtonEl.textContent = dayNumber;
    dayButtonEl.setAttribute("aria-label", date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }));

    if (isSameDate(date, today)) {
      dayButtonEl.classList.add("today");
    }

    if (isSameDate(date, selectedDate)) {
      dayButtonEl.classList.add("selected");
      dayButtonEl.setAttribute("aria-current", "date");
    }

    dayButtonEl.addEventListener("click", (event) => {
	  event.stopPropagation(); // Prevent document click from triggering close
	  const formatted = formatDate(date);
	  
	  // Update deadline without resetting or closing calendar
	  sprintConfig.deadlineDate = formatted;
	  const dateText = document.getElementById("sandboxDateText");
	  if (dateText) dateText.textContent = formatted;

	  // Re-render calendar grid to update the selected day highlight
	  renderCalendar();
	});

    daysContainer.appendChild(dayButtonEl);
  }
}

export function toggleCalendar(event) {
  if (event) event.stopPropagation();
  const calendar = document.getElementById("sandboxCalendar");
  const dateBtn = document.getElementById("sandboxDateButton");
  if (!calendar || !dateBtn) return;

  const isOpen = calendar.classList.contains("is-open");
  if (isOpen) {
    closeCalendar();
  } else {
    openCalendar();
  }
}

export function openCalendar() {
  const calendar = document.getElementById("sandboxCalendar");
  const dateBtn = document.getElementById("sandboxDateButton");
  const datePicker = dateBtn?.closest(".sandbox-date-picker");
  if (!calendar || !dateBtn) return;

  calendar.classList.add("is-open");
  if (datePicker) datePicker.style.zIndex = "1000";
  calendar.setAttribute("aria-hidden", "false");
  dateBtn.setAttribute("aria-expanded", "true");
  renderCalendar();
}

export function closeCalendar() {
  const calendar = document.getElementById("sandboxCalendar");
  const dateBtn = document.getElementById("sandboxDateButton");
  const datePicker = dateBtn?.closest(".sandbox-date-picker");
  if (!calendar || !dateBtn) return;

  calendar.classList.remove("is-open");
  if (datePicker) datePicker.style.zIndex = "10";
  calendar.setAttribute("aria-hidden", "true");
  dateBtn.setAttribute("aria-expanded", "false");
}

export function setCalendarToday() {
  const today = new Date();
  visibleMonth = new Date(today);
  updateSprintTimeline(formatDate(today));
}

export function moveCalendarMonth(delta) {
  visibleMonth.setMonth(visibleMonth.getMonth() + delta);
  renderCalendar();
}

function setupCalendarGlobalListeners() {
  document.addEventListener("click", (event) => {
    const calendar = document.getElementById("sandboxCalendar");
    if (calendar && calendar.classList.contains("is-open")) {
      closeCalendar();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCalendar();
    }
  });
}

function renderRoleView(role) {
  const container = document.getElementById('roleViewContainer');
  const health = calculateSprintHealth();

  if (role === 'product-owner') {
    const displayDate = sprintConfig.deadlineDate || "yyyy-mm-dd";
    if (sprintConfig.deadlineDate) {
      visibleMonth = new Date(sprintConfig.deadlineDate + 'T00:00:00');
    }

    container.innerHTML = `
      <h3>Product Owner View: Backlog & Story Authoring</h3>
      <p>Create user stories following Agile standards and audit them instantly with Amazon Nova Micro.</p>

      <div class="sprint-status-bar">
        <div>
          <span class="status-label">
            <svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-hourglass"></use></svg>
            SPRINT DEADLINE & SCHEDULE
          </span>
          <div class="sandbox-date-picker">
            <button
              id="sandboxDateButton"
              class="sandbox-date-input"
              type="button"
              aria-haspopup="dialog"
              aria-expanded="false"
              aria-controls="sandboxCalendar"
              onclick="window.toggleCalendar(event)"
            >
              <span id="sandboxDateText">${escapeHtml(displayDate)}</span>
              <span class="calendar-icon-btn" aria-hidden="true"></span>
            </button>

            <section
              id="sandboxCalendar"
              class="sandbox-calendar"
              role="dialog"
              aria-label="Choose a date"
              aria-hidden="true"
              onclick="event.stopPropagation()"
            >
              <div class="sandbox-calendar-actions">
                <button class="sandbox-btn-action" type="button" onclick="window.setCalendarToday()">Today</button>
                <button class="sandbox-btn-action sandbox-btn-done" type="button" onclick="window.closeCalendar()">Done</button>
              </div>

              <div class="sandbox-calendar-header">
                <button class="sandbox-month-button" type="button" aria-label="Previous month" onclick="window.moveCalendarMonth(-1)">‹</button>
                <div id="sandboxMonthTitle" class="sandbox-month-title"></div>
                <button class="sandbox-month-button" type="button" aria-label="Next month" onclick="window.moveCalendarMonth(1)">›</button>
              </div>

              <div class="sandbox-weekdays" aria-hidden="true">
                <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
              </div>

              <div id="sandboxDays" class="sandbox-days"></div>
            </section>
          </div>
        </div>
        <div>
          <span class="status-label">SCHEDULE HEALTH</span>
          <span class="health-badge" style="--status-color: ${health.color};">${health.status}</span>
        </div>
      </div>

      <div class="story-form-card">
        <h4 class="form-title">Draft New User Story</h4>
        <div class="form-row-2col">
          <div>
            <label class="form-label">As a (User Role): <span class="label-hint">(max 50 chars)</span></label>
            <input type="text" id="storyRole" class="form-input" placeholder="e.g., project manager" maxlength="50" />
          </div>
          <div>
            <label class="form-label">Story Points (Complexity):</label>
            <select id="storyPoints" class="form-select">
              <option value="1">1 Point</option>
              <option value="3" selected>3 Points</option>
              <option value="5">5 Points</option>
              <option value="8">8 Points</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">I want (Action/Feature): <span class="label-hint">(max 150 chars)</span></label>
          <input type="text" id="storyAction" class="form-input" placeholder="e.g., export sprint metrics to CSV" maxlength="150" />
        </div>

        <div class="form-group-lg">
          <label class="form-label">So that (Benefit/Value): <span class="label-hint">(max 150 chars)</span></label>
          <input type="text" id="storyBenefit" class="form-input" placeholder="e.g., I can share progress reports with stakeholders" maxlength="150" />
        </div>

        <button type="button" class="btn-primary" onclick="window.addCustomUserStory()">Add Story & Audit with Nova Micro</button>
      </div>

      <div id="aiAuditResult" class="ai-audit-box" aria-live="polite"></div>

      <h4 class="backlog-title">Current Product Backlog (${backlogData.length} Items)</h4>
      <div class="backlog-list">
        ${backlogData.map(item => `
          <div class="kanban-card backlog-card">
            <div class="backlog-card-header">
              <h5 class="backlog-card-title">[${escapeHtml(item.id)}] ${escapeHtml(item.title)}</h5>
              <div class="backlog-card-actions">
                <span class="points-badge">Points: ${item.points}</span>
                <button type="button" class="btn-delete" onclick="window.deleteUserStory('${escapeHtml(item.id)}')" title="Remove unneeded story">
                  <svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-trash"></use></svg>
                  Remove
                </button>
              </div>
            </div>
            <p class="backlog-card-desc">${escapeHtml(item.desc)}</p>
            <div class="backlog-card-status">Status: <strong>${escapeHtml(item.status)}</strong></div>
          </div>
        `).join('')}
      </div>`;
  } else if (role === 'scrum-master') {
    const totalPoints = backlogData.reduce((sum, item) => sum + item.points, 0);
    const completedPoints = backlogData.filter(i => i.status === 'Done').reduce((sum, item) => sum + item.points, 0);

    container.innerHTML = `
      <h3>Scrum Master View: Sprint Health & Risk Analytics</h3>
      <p>Monitor team velocity, check sprint impediments, and leverage AI to evaluate delivery risks.</p>

      <div class="sm-actions">
        <button type="button" onclick="window.analyzeSprintRisk()" class="btn-primary-lg">
            <svg class="icon" aria-hidden="true" width="16" height="16" style="margin-right: 6px;"><use href="svg/scrum-sandbox-icons.svg#icon-ai"></use></svg>
            Generate AI Sprint Risk Assessment
        </button>
      </div>

      <div id="aiRiskResult" class="ai-risk-box" aria-live="polite"></div>

      <div class="metrics-card">
        <h4 class="metrics-title">Sprint Metrics & Schedule Overview</h4>
        <p class="metric-item"><strong>Target Deadline:</strong> ${escapeHtml(sprintConfig.deadlineDate || 'Not set')}</p>
        <p class="metric-item"><strong>Schedule Health:</strong> <span class="health-status" style="--status-color: ${health.color};">${health.status}</span> (${health.text})</p>
        <p class="metric-item"><strong>Total Backlog Items:</strong> ${backlogData.length} (${totalPoints} total points)</p>
        <p class="metric-item"><strong>Completed Story Points:</strong> ${completedPoints} / ${totalPoints} points</p>
        <p class="metric-item"><strong>Completed Tasks:</strong> ${backlogData.filter(i => i.status === 'Done').length} items</p>
        <p class="metric-item metric-item-last"><strong>In-Progress Tasks:</strong> ${backlogData.filter(i => i.status === 'In Progress').length} items</p>
      </div>
    `;
  } else if (role === 'developer') {
    container.innerHTML = `
      <h3>Developer View: Active Sprint Kanban Board</h3>
      <p>Manage task workflows. You can advance or move cards backward if status changes.</p>

      <div class="dev-status-bar">
        <span class="dev-deadline">
          <svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-calendar"></use></svg>
          Sprint Deadline: <strong>${escapeHtml(sprintConfig.deadlineDate || 'Not set')}</strong>
        </span>
        <span class="dev-health" style="--status-color: ${health.color};">Status: ${health.status}</span>
      </div>

      <div class="kanban-board">
        <div class="kanban-column">
          <h4>To Do</h4>
          ${backlogData.filter(i => i.status === 'To Do').map(item => `
            <div class="kanban-card">
              <h5>[${escapeHtml(item.id)}] ${escapeHtml(item.title)}</h5>
              <p class="kanban-card-desc">${escapeHtml(item.desc)}</p>
              <button type="button" onclick="window.updateTaskStatus('${escapeHtml(item.id)}', 'In Progress')" class="btn-kanban">Advance &rarr;</button>
            </div>
          `).join('')}
        </div>
        <div class="kanban-column">
          <h4>In Progress</h4>
          ${backlogData.filter(i => i.status === 'In Progress').map(item => `
            <div class="kanban-card">
              <h5>[${escapeHtml(item.id)}] ${escapeHtml(item.title)}</h5>
              <p class="kanban-card-desc">${escapeHtml(item.desc)}</p>
              <div class="kanban-btn-group">
                <button type="button" onclick="window.updateTaskStatus('${escapeHtml(item.id)}', 'To Do')" class="btn-kanban">&larr; Back</button>
                <button type="button" onclick="window.updateTaskStatus('${escapeHtml(item.id)}', 'Done')" class="btn-kanban">Advance &rarr;</button>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="kanban-column">
          <h4>Done</h4>
          ${backlogData.filter(i => i.status === 'Done').map(item => `
            <div class="kanban-card">
              <h5>[${escapeHtml(item.id)}] ${escapeHtml(item.title)}</h5>
              <p class="kanban-card-desc">${escapeHtml(item.desc)}</p>
              <button type="button" onclick="window.updateTaskStatus('${escapeHtml(item.id)}', 'In Progress')" class="btn-kanban">&larr; Reopen</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

export function updateSprintTimeline(newDate) {
  if (!newDate) return;
  const wasOpen = document.getElementById("sandboxCalendar")?.classList.contains("is-open");
  
  sprintConfig.deadlineDate = newDate;
  renderRoleView(currentRole);

  if (wasOpen) {
    openCalendar();
  }

  setStatusMsg(
    document.getElementById('cloudStatusMsg'), 
    `<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-calendar"></use></svg>Sprint deadline updated to ${newDate}.`, 
    false
  );
}
window.updateSprintTimeline = updateSprintTimeline;

// ==========================================
// EXEMPLARY PROJECT TEMPLATES
// ==========================================
const exemplaryTemplates = {
  ecommerce: {
    name: "ecommerce-checkout-v1",
    deadline: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    backlog: [
      { id: 'EC-101', title: 'Guest Checkout Flow', points: 5, status: 'Done', desc: 'As a shopper, I want to check out without an account so the purchase is fast.' },
      { id: 'EC-102', title: 'Stripe Payment Gateway Integration', points: 8, status: 'In Progress', desc: 'As a customer, I want to securely pay via credit card or Apple Pay.' },
      { id: 'EC-103', title: 'Order Confirmation Email Hook', points: 3, status: 'To Do', desc: 'As a buyer, I want an email receipt confirming my order details.' }
    ]
  },
  cloudmig: {
    name: "cloud-migration-alpha",
    deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    backlog: [
      { id: 'CM-201', title: 'AWS Lambda Auth Function', points: 5, status: 'Done', desc: 'As a dev, I want serverless authentication tokens handled securely.' },
      { id: 'CM-202', title: 'DynamoDB TTL Configuration', points: 3, status: 'In Progress', desc: 'As a cloud admin, I want inactive records cleaned up automatically.' },
      { id: 'CM-203', title: 'API Gateway REST Routing', points: 8, status: 'To Do', desc: 'As a frontend engineer, I want clean endpoints to fetch board payloads.' }
    ]
  },
  mobileapp: {
    name: "mobile-redesign-2026",
    deadline: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
    backlog: [
      { id: 'MA-301', title: 'Dark Mode Toggle Styling', points: 3, status: 'Done', desc: 'As a mobile user, I want a sleek dark theme option to save battery.' },
      { id: 'MA-302', title: 'Interactive Swipe Gestures', points: 8, status: 'In Progress', desc: 'As a user, I want to swipe cards left or right to change task states.' },
      { id: 'MA-303', title: 'Push Notification Alerts', points: 5, status: 'To Do', desc: 'As a user, I want reminders when my sprint deadline is approaching.' }
    ]
  },
  scrumapp: {
    name: "scrum-software-phase1",
    deadline: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    backlog: [
      { id: 'SC-101', title: 'User Authentication Flow', points: 5, status: 'Done', desc: 'As a user, I want to securely log in so my project data remains private.' },
      { id: 'SC-102', title: 'Interactive Kanban Board', points: 8, status: 'In Progress', desc: 'As a developer, I want dynamic columns to update task statuses seamlessly.' },
      { id: 'SC-103', title: 'Sprint Burndown Chart', points: 3, status: 'To Do', desc: 'As a scrum master, I want to visualize remaining sprint effort over time.' },
      { id: 'SC-104', title: 'AI Backlog Refiner', points: 5, status: 'To Do', desc: 'As a product owner, I want AI assistance to audit user story acceptance criteria.' }
    ]
  },
  musicstream: {
    name: "music-streaming-v1",
    deadline: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0],
    backlog: [
      { id: 'MS-401', title: 'Custom Playlist Creation', points: 3, status: 'Done', desc: 'As a music lover, I want to create custom playlists so I can organize my favorite tracks.' },
      { id: 'MS-402', title: 'Real-Time Audio Equalizer', points: 5, status: 'In Progress', desc: 'As an audiophile, I want to adjust frequencies for an enhanced listening experience.' },
      { id: 'MS-403', title: 'Offline Download Mode', points: 8, status: 'To Do', desc: 'As a commuter, I want to download songs locally so I can listen without internet.' }
    ]
  },
  cookingapp: {
    name: "smart-recipe-app",
    deadline: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    backlog: [
      { id: 'CK-501', title: 'Pantry Ingredient Scanner', points: 8, status: 'Done', desc: 'As a home cook, I want to snap a photo of my fridge contents to get matching recipes.' },
      { id: 'CK-502', title: 'Step-by-Step Voice Assistant', points: 5, status: 'In Progress', desc: 'As a busy cook, I want voice controls so I don’t touch my phone with messy hands.' },
      { id: 'CK-503', title: 'Nutritional Macro Breakdown', points: 3, status: 'To Do', desc: 'As a health-conscious user, I want to see calories and protein metrics per serving.' }
    ]
  }
};

export function loadExemplaryProject(templateKey) {
  const template = exemplaryTemplates[templateKey];
  if (!template) return;

  document.getElementById('workspaceNameInput').value = template.name;
  backlogData = JSON.parse(JSON.stringify(template.backlog));
  sprintConfig.deadlineDate = template.deadline;
  renderRoleView(currentRole);

  setStatusMsg(
    document.getElementById('cloudStatusMsg'),
    `Loaded exemplary template: "${template.name}". You can now customize stories or save it to the cloud!`,
    false
  );
}
window.loadExemplaryProject = loadExemplaryProject;

export function startFreshProject() {
  document.getElementById('workspaceNameInput').value = '';
  sprintConfig.deadlineDate = '';
  backlogData = [];
  renderRoleView(currentRole);

  setStatusMsg(
    document.getElementById('cloudStatusMsg'),
    `<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-broom"></use></svg>Board cleared! You have started a fresh project workspace with an empty backlog and unset deadline.`,
    false
  );
}
window.startFreshProject = startFreshProject;

export function deleteUserStory(id) {
  const index = backlogData.findIndex(i => i.id === id);
  if (index !== -1) {
    const removed = backlogData.splice(index, 1)[0];
    renderRoleView(currentRole);

    setStatusMsg(
      document.getElementById('cloudStatusMsg'),
      `<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-trash"></use></svg>Removed user story [${removed.id}] from the backlog.`,
      true
    );
  }
}
window.deleteUserStory = deleteUserStory;

// ==========================================
// AWS CLOUD DYNAMODB PERSISTENCE HANDLERS
// ==========================================
const protectedTemplates = [
  'ecommerce-checkout-v1',
  'cloud-migration-alpha',
  'mobile-redesign-2026',
  'scrum-software-phase1',
  'music-streaming-v1',
  'smart-recipe-app'
];

export async function saveProjectToCloud() {
  const projectName = document.getElementById('workspaceNameInput').value.trim();
  const statusMsg = document.getElementById('cloudStatusMsg');

  if (!projectName) {
    setStatusMsg(statusMsg, '<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-warning"></use></svg>Please enter a unique project workspace name before saving.', true);
    return;
  }

  if (projectName.length > 30) {
    setStatusMsg(statusMsg, '<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-warning"></use></svg>Project workspace name cannot exceed 30 characters.', true);
    return;
  }

  if (protectedTemplates.includes(projectName.toLowerCase())) {
    setStatusMsg(statusMsg, '<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-warning"></use></svg>You cannot overwrite exemplary projects! Please choose a new unique workspace name.', true);
    return;
  }

  try {
    setStatusMsg(statusMsg, '<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-hourglass"></use></svg>Connecting to AWS Lambda / DynamoDB...', false);

    const response = await fetch(`${API_ENDPOINT}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectName: projectName, backlogData: backlogData, sprintConfig: sprintConfig, company: getHoneypotValue() })
    });

    const result = await parseJsonResponse(response);
    if (response.ok) {
      setStatusMsg(statusMsg, `<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-success"></use></svg>Success! Project "${projectName}" saved to AWS DynamoDB.`, false);
    } else {
      throw new Error(result.error || 'Failed to save project.');
    }
  } catch (error) {
    setStatusMsg(statusMsg, `<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-cloud-error"></use></svg>Error saving to cloud: ${error.message}`, true);
  }
}
window.saveProjectToCloud = saveProjectToCloud;

export async function loadProjectFromCloud() {
  const projectName = document.getElementById('workspaceNameInput').value.trim();
  const statusMsg = document.getElementById('cloudStatusMsg');

  if (!projectName) {
    setStatusMsg(statusMsg, '<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-warning"></use></svg> Please enter the project workspace name you wish to load.', true);
    return;
  }

  try {
    setStatusMsg(statusMsg, '<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-hourglass"></use></svg>Fetching project from AWS DynamoDB...', false);

    const response = await fetch(`${API_ENDPOINT}/load?projectName=${encodeURIComponent(projectName)}`, {
      method: 'GET'
    });

    const result = await parseJsonResponse(response);
    if (response.ok && result.BacklogData) {
      backlogData = result.BacklogData;
      if (result.SprintConfig) sprintConfig = result.SprintConfig;
      setStatusMsg(statusMsg, `<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-success"></use></svg>Project "${projectName}" successfully reloaded from AWS DynamoDB!`, false);
      renderRoleView(currentRole);
    } else {
      throw new Error(result.error || 'Project not found or expired.');
    }
  } catch (error) {
    setStatusMsg(statusMsg, `<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-cloud-error"></use></svg>Could not load project: ${error.message}`, true);
  }
}
window.loadProjectFromCloud = loadProjectFromCloud;

// ==========================================
// OTHER HANDLERS
// ==========================================
export async function addCustomUserStory() {
  const roleVal = document.getElementById('storyRole').value.trim();
  const actionVal = document.getElementById('storyAction').value.trim();
  const benefitVal = document.getElementById('storyBenefit').value.trim();
  const pointsVal = parseInt(document.getElementById('storyPoints').value);
  const auditDiv = document.getElementById('aiAuditResult');

  if (!roleVal || !actionVal || !benefitVal) {
    setResultBox(auditDiv, 'Validation Notice:', '<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-warning"></use></svg> Please fill out all fields to author a valid user story.', true);
    return;
  }

  if (roleVal.length > 50 || actionVal.length > 150 || benefitVal.length > 150) {
    setResultBox(auditDiv, 'Validation Notice:', '<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-warning"></use></svg> Input limit exceeded! Role must be under 50 characters, and Action/Benefit must be under 150 characters.', true);
    return;
  }

  const formattedTitle = actionVal.charAt(0).toUpperCase() + actionVal.slice(1);
  const formattedDesc = `As a ${roleVal}, I want ${actionVal} so that ${benefitVal}.`;
  const newId = `US-10${backlogData.length + 1}`;

  backlogData.push({ id: newId, title: formattedTitle, points: pointsVal, status: 'To Do', desc: formattedDesc });

  renderRoleView('product-owner');

  const updatedAuditDiv = document.getElementById('aiAuditResult');
  const roleAtSubmitTime = currentRole;
  setResultBox(updatedAuditDiv, 'Amazon Nova Micro AI Cloud Audit:', '<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-hourglass"></use></svg>Connecting to AWS Lambda / Amazon Bedrock (Nova Micro)... analyzing user story syntax.', false);

  try {
    const response = await fetch(`${API_ENDPOINT}/audit-story`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: roleVal, action: actionVal, benefit: benefitVal, company: getHoneypotValue() })
    });

    const result = await parseJsonResponse(response);

    if (currentRole !== roleAtSubmitTime || !document.body.contains(updatedAuditDiv)) {
      return;
    }

    if (response.ok && result.auditResult) {
      const escapedResult = escapeHtml(result.auditResult).replace(/\n/g, '<br>');
      setResultBox(updatedAuditDiv, 'Amazon Nova Micro AI Cloud Audit:', `<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-check"></use></svg><strong>Story added!</strong><br>${escapedResult}`, false);
    } else {
      throw new Error(result.error || 'Failed to generate audit.');
    }
  } catch (error) {
    if (currentRole !== roleAtSubmitTime || !document.body.contains(updatedAuditDiv)) {
      return;
    }
    setResultBox(updatedAuditDiv, 'Amazon Nova Micro Audit Error:', `<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-cross"></use></svg>Could not reach AI endpoint: ${escapeHtml(error.message)}`, true);
  }
}
window.addCustomUserStory = addCustomUserStory;

export function updateTaskStatus(id, targetStatus) {
  const item = backlogData.find(i => i.id === id);
  if (item) {
    item.status = targetStatus;
    renderRoleView('developer');
  }
}
window.updateTaskStatus = updateTaskStatus;

export async function analyzeSprintRisk() {
  const riskDiv = document.getElementById('aiRiskResult');
  const roleAtSubmitTime = currentRole;

  if (!backlogData || backlogData.length === 0) {
    setResultBox(riskDiv, 'Assessment Notice:', '<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-warning"></use></svg> Please add at least one user story to your product backlog before generating a sprint risk assessment.', true);
    return;
  }

  setResultBox(riskDiv, 'Amazon Nova Micro Scrum Master Insights:', '<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-hourglass"></use></svg>Invoking AWS Lambda &amp; Amazon Bedrock (Nova Micro) for risk evaluation...', false);

  const health = calculateSprintHealth();

  try {
    const response = await fetch(`${API_ENDPOINT}/analyze-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backlogData: backlogData, healthStatus: health })
    });

    const result = await parseJsonResponse(response);

    if (currentRole !== roleAtSubmitTime || !document.body.contains(riskDiv)) {
      return;
    }

    if (response.ok && result.riskAnalysis) {
      const escapedResult = escapeHtml(result.riskAnalysis).replace(/\n/g, '<br>');
      setResultBox(riskDiv, 'Amazon Nova Micro Scrum Master Insights:', escapedResult, false);
    } else {
      throw new Error(result.error || 'Failed to generate risk analysis.');
    }
  } catch (error) {
    if (currentRole !== roleAtSubmitTime || !document.body.contains(riskDiv)) {
      return;
    }
    setResultBox(riskDiv, 'Amazon Nova Micro Risk Error:', `<svg class="icon" aria-hidden="true" width="14" height="14"><use href="svg/scrum-sandbox-icons.svg#icon-cross"></use></svg>Could not reach AI endpoint: ${escapeHtml(error.message)}`, true);
  }
}
window.analyzeSprintRisk = analyzeSprintRisk;