// ==========================================================================
// Kitchen Byte
// ==========================================================================

export function renderMealPlanOutput(containerElement, data, storeInfo) {
    const formattedStoreInfo = storeInfo
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    const daysArray = Array.isArray(data.days) ? data.days : Object.values(data.days);
    const sampleMeals = daysArray[0]?.meals || [];
    const mealSlots = sampleMeals.map(m => m.mealSlot);
    const hasDessert = daysArray.some(d => d.dessert !== null && d.dessert !== undefined);

    let tableHeadersHtml = `<th class="kb-slot-header">Meal Slot</th>`;
    daysArray.forEach((day) => {
        tableHeadersHtml += `<th>${day.dayName}</th>`;
    });

    function renderMealCard(item, dIdx, mealType, slotOrName) {
        return `
            <div class="draggable-meal-cell" draggable="true" data-day-index="${dIdx}" data-meal-type="${mealType}" data-slot-or-name="${slotOrName}">
                ${item.photoUrl ? `<img class="kb-meal-photo" src="${item.photoUrl}" alt="${item.mealName}" />` : ''}
                <div class="kb-meal-name">${item.mealName}</div>
                <div class="kb-meal-macros">${item.calories} kcal | ${item.protein}g P</div>
                <button type="button" class="recipe-trigger-btn" data-meal-json='${encodeURIComponent(JSON.stringify(item))}'>
                    Recipe
                </button>
            </div>
        `;
    }

    let tableRowsHtml = '';

    // Render standard meal rows
    mealSlots.forEach((slot) => {
        tableRowsHtml += `<tr>`;
        tableRowsHtml += `<td class="kb-slot-cell">${slot}</td>`;

        daysArray.forEach((day, dIdx) => {
            const meal = day.meals.find(m => m.mealSlot === slot);
            if (meal) {
                tableRowsHtml += `<td class="kb-meal-cell">${renderMealCard(meal, dIdx, 'meal', slot)}</td>`;
            } else {
                tableRowsHtml += `<td class="kb-empty-cell">-</td>`;
            }
        });
        tableRowsHtml += `</tr>`;
    });

    // Render dessert row if available
    if (hasDessert) {
        tableRowsHtml += `<tr>`;
        tableRowsHtml += `<td class="kb-slot-cell">Dessert</td>`;
        daysArray.forEach((day, dIdx) => {
            const dessert = day.dessert;
            if (dessert) {
                tableRowsHtml += `<td class="kb-meal-cell">${renderMealCard(dessert, dIdx, 'dessert', 'dessert')}</td>`;
            } else {
                tableRowsHtml += `<td class="kb-empty-cell">-</td>`;
            }
        });
        tableRowsHtml += `</tr>`;
    }

    let shoppingListHtml = '';
    if (data.shoppingList && data.shoppingList.length > 0) {
        data.shoppingList.forEach(group => {
            shoppingListHtml += `
                <div class="kb-shopping-card">
                    <h5>🛒 ${group.aisle}</h5>
                    <ul>
                        ${group.items.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `;
        });
    }

    const uniqueRecipesMap = new Map();
    daysArray.forEach(day => {
        day.meals.forEach(m => {
            if (!uniqueRecipesMap.has(m.mealName)) uniqueRecipesMap.set(m.mealName, m);
        });
        if (day.dessert && !uniqueRecipesMap.has(day.dessert.mealName)) {
            uniqueRecipesMap.set(day.dessert.mealName, day.dessert);
        }
    });

    let printRecipesHtml = '';
    uniqueRecipesMap.forEach((meal) => {
        printRecipesHtml += `
            <div class="print-recipe-card">
                <h4>📖 ${meal.mealName}</h4>
                <div class="kb-recipe-meta">⏱️ Duration: ${meal.duration} &nbsp;|&nbsp; 📊 ${meal.calories} kcal | ${meal.protein}g Protein</div>
                <p class="kb-recipe-desc">"${meal.visualDescription}"</p>

                <strong>Ingredients:</strong>
                <ul>
                    ${meal.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                </ul>

                <strong>Cooking Method:</strong>
                <p>${meal.cookingMethod}</p>
            </div>
        `;
    });

    containerElement.innerHTML = `
        <div class="kb-output-wrapper">

            <div class="kb-store-box">
                <h4>🛒 Verified Supermarket & Operating Hours</h4>
                <div class="kb-store-box-content">${formattedStoreInfo}</div>
            </div>

            <div class="kb-summary-bar">
                <div>📋 ${data.planSummary} &nbsp;<span class="kb-summary-hint">(💡 Drag & drop — or tap a meal, then tap another — to swap places. Desserts only swap with desserts!)</span></div>
                ${data.estimatedCost ? `<div class="kb-cost-badge">💰 Est. Cost: <strong>${data.estimatedCost}</strong></div>` : ''}
            </div>

            <div class="kb-table-section">
                <p class="kb-swipe-hint print-hide">↔️ Swipe horizontally to view all days</p>
                <div class="kb-table-scroll">
                    <table class="kb-table">
                        <thead>
                            <tr>${tableHeadersHtml}</tr>
                        </thead>
                        <tbody>
                            ${tableRowsHtml}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="kb-shopping-section">
                <h3 class="kb-shopping-title">🛍️ Aisle-Grouped Shopping List</h3>
                <div class="kb-shopping-grid">
                    ${shoppingListHtml}
                </div>
            </div>

            <div class="kb-recipe-section">
                <button type="button" id="recipeGuideToggle" class="kb-recipe-toggle print-hide">
                    <h3 class="kb-recipe-toggle-title">📋 Complete Recipe Guide (Ready for Print / PDF)</h3>
                    <span class="kb-chevron">▼</span>
                </button>
                <h3 class="kb-recipe-print-title">📋 Complete Recipe Guide</h3>
                <div id="recipeGuideBody" class="kb-recipe-body">
                    <div class="kb-recipe-scroll">
                        <div class="kb-recipe-grid">
                            ${printRecipesHtml}
                        </div>
                    </div>
                </div>
            </div>

            <div class="kb-print-footer print-hide">
                <button type="button" id="printPlanBtn">
                    🖨️ Print / Save as PDF (Includes Full Recipes & Shopping List)
                </button>
            </div>
        </div>

        <div id="recipeModal">
            <div class="kb-modal-content">
                <button type="button" id="closeModalBtn">✕</button>
                <div id="modalContentBody"></div>
            </div>
        </div>
    `;

    containerElement.querySelector('#printPlanBtn').addEventListener('click', () => window.print());

    const recipeGuideToggle = containerElement.querySelector('#recipeGuideToggle');
    const recipeGuideBody = containerElement.querySelector('#recipeGuideBody');
    recipeGuideToggle.addEventListener('click', () => {
        const isExpanded = recipeGuideBody.classList.toggle('expanded');
        recipeGuideToggle.classList.toggle('expanded', isExpanded);
    });

    const modal = containerElement.querySelector('#recipeModal');
    const modalBody = containerElement.querySelector('#modalContentBody');
    const closeModalBtn = containerElement.querySelector('#closeModalBtn');

    closeModalBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    containerElement.querySelectorAll('.recipe-trigger-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // don't let this bubble up into the card's tap-to-select handler
            const meal = JSON.parse(decodeURIComponent(e.currentTarget.getAttribute('data-meal-json')));

            modalBody.innerHTML = `
                ${meal.photoUrl ? `<img class="kb-modal-photo" src="${meal.photoUrl}" alt="${meal.mealName}" />` : ''}
                <h3 class="kb-modal-title">${meal.mealName}</h3>
                <div class="kb-modal-meta">⏱️ Duration: ${meal.duration} &nbsp;|&nbsp; 📊 ${meal.calories} kcal | ${meal.protein}g Protein</div>
                <p class="kb-modal-desc">"${meal.visualDescription}"</p>

                <h4 class="kb-modal-section-title">Ingredients</h4>
                <ul class="kb-modal-list">
                    ${meal.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                </ul>

                <h4 class="kb-modal-section-title">Cooking Method</h4>
                <p class="kb-modal-text">${meal.cookingMethod}</p>
            `;
            modal.style.display = 'flex';
        });
    });

    // --- ENFORCED TYPE-SAFE SWAPPING LOGIC (drag-and-drop + tap-to-select) ---
    let draggedSource = null;   // active during a mouse/pointer drag
    let selectedCell = null;    // active during a tap-to-select sequence (touch fallback)

    function readCellData(cell) {
        return {
            dayIdx: cell.getAttribute('data-day-index'),
            mealType: cell.getAttribute('data-meal-type'),
            slotName: cell.getAttribute('data-slot-or-name')
        };
    }

    function performSwap(sourceData, targetCell) {
        const targetDayIdx = parseInt(targetCell.getAttribute('data-day-index'), 10);
        const targetMealType = targetCell.getAttribute('data-meal-type');
        const targetSlotName = targetCell.getAttribute('data-slot-or-name');

        const sourceDayIdx = parseInt(sourceData.dayIdx, 10);
        const sourceMealType = sourceData.mealType;
        const sourceSlotName = sourceData.slotName;

        // RULE CHECK: Desserts can only swap with desserts, meals only with meals
        if (sourceMealType !== targetMealType) {
            return false; // Blocks cross-swapping (e.g., meal into dessert slot)
        }
        // No-op: dropping/tapping the same cell twice
        if (sourceDayIdx === targetDayIdx && sourceSlotName === targetSlotName) {
            return false;
        }

        let sourceObj, targetObj;

        if (sourceMealType === 'dessert') {
            sourceObj = daysArray[sourceDayIdx].dessert;
            targetObj = daysArray[targetDayIdx].dessert;

            daysArray[sourceDayIdx].dessert = targetObj;
            daysArray[targetDayIdx].dessert = sourceObj;
        } else {
            const sIdx = daysArray[sourceDayIdx].meals.findIndex(m => m.mealSlot === sourceSlotName);
            const tIdx = daysArray[targetDayIdx].meals.findIndex(m => m.mealSlot === targetSlotName);

            if (sIdx !== -1 && tIdx !== -1) {
                sourceObj = daysArray[sourceDayIdx].meals[sIdx];
                targetObj = daysArray[targetDayIdx].meals[tIdx];

                // Update each object's mealSlot to match the row it's moving
                // INTO — otherwise it keeps its old slot label (e.g.
                // "Breakfast") even after landing in the "Lunch" row, and
                // the row lookup (which matches on mealSlot) can't find it
                // there. This is what allows moving a breakfast dish into
                // the lunch row on purpose.
                sourceObj.mealSlot = targetSlotName;
                targetObj.mealSlot = sourceSlotName;

                daysArray[sourceDayIdx].meals[sIdx] = targetObj;
                daysArray[targetDayIdx].meals[tIdx] = sourceObj;
            }
        }

        return true;
    }

    containerElement.querySelectorAll('.draggable-meal-cell').forEach(cell => {
        // --- Mouse / pointer drag-and-drop (desktop) ---
        cell.addEventListener('dragstart', (e) => {
            draggedSource = cell;
            e.dataTransfer.setData('text/plain', JSON.stringify(readCellData(cell)));
            setTimeout(() => cell.style.opacity = '0.4', 0);
        });

        cell.addEventListener('dragend', () => {
            if (draggedSource) draggedSource.style.opacity = '1';
            containerElement.querySelectorAll('.draggable-meal-cell').forEach(c => c.classList.remove('drag-over'));
        });

        cell.addEventListener('dragover', (e) => {
            e.preventDefault();
            cell.classList.add('drag-over');
        });

        cell.addEventListener('dragleave', () => {
            cell.classList.remove('drag-over');
        });

        cell.addEventListener('drop', (e) => {
            e.preventDefault();
            cell.classList.remove('drag-over');
            if (!draggedSource || draggedSource === cell) return;

            const sourceData = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (performSwap(sourceData, cell)) {
                renderMealPlanOutput(containerElement, data, storeInfo);
            }
        });

        // --- Tap-to-select fallback (touch devices, where native HTML5
        // drag-and-drop is unreliable — notably mobile Safari). Tap a card
        // to select it, tap a second card to swap; tapping the same card
        // again, or tapping the Recipe button, cancels the selection. ---
        cell.addEventListener('click', () => {
            if (!selectedCell) {
                selectedCell = cell;
                cell.classList.add('selected');
                return;
            }

            if (selectedCell === cell) {
                // tapped the same card again — cancel selection
                selectedCell.classList.remove('selected');
                selectedCell = null;
                return;
            }

            const sourceData = readCellData(selectedCell);
            selectedCell.classList.remove('selected');
            const swapped = performSwap(sourceData, cell);
            selectedCell = null;

            if (swapped) {
                renderMealPlanOutput(containerElement, data, storeInfo);
            }
        });
    });
}