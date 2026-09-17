// ==========================================================================
// Kitchen Byte - AI Agent Integration
// ==========================================================================

import { CONFIG } from '../google-api-key.js';
import { renderMealPlanOutput } from './kitchen-byte-renderer.js';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY });

// Global AbortController reference to handle stopping ongoing AI requests
let currentAbortController = null;

// Cache photo lookups within a single generation run so repeated
// photoQuery values (e.g. two "grilled chicken salad" meals) don't
// trigger duplicate Unsplash requests and burn through the rate limit.
const photoCache = new Map();

/**
 * CURRENTLY UNUSED — photo fetching is disabled (see generateMealPlan)
 * because Unsplash search results weren't accurate enough for AI-generated
 * dish names. Left in place in case a better image source (e.g. an
 * image-generation model, or a curated food-photo dataset) replaces it later.
 *
 * Fetches a real food photo from Unsplash.
 * IMPORTANT: pass a short, GENERIC descriptor (e.g. "grilled chicken bowl"),
 * not the creative dish name the LLM invents (e.g. "Za'atar Charred Lemon
 * Chicken"). Stock photo search matches generic terms far more reliably —
 * creative dish names almost never have a matching captioned photo, which
 * is why results looked random before.
 */
async function fetchMealPhoto(photoQuery) {
    const cacheKey = photoQuery.toLowerCase().trim();
    if (photoCache.has(cacheKey)) {
        return photoCache.get(cacheKey);
    }

    let result;
    try {
        const unsplashKey = CONFIG.UNSPLASH_API_KEY;
        if (!unsplashKey || unsplashKey === 'DEMO_KEY' || unsplashKey.trim() === '') {
            throw new Error('No Unsplash API key provided');
        }

        // Keep the query short and generic — do NOT append extra words like
        // "gourmet" here, they dilute an already-generic query further.
        const encodedQuery = encodeURIComponent(photoQuery + ' food');
        const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodedQuery}&per_page=1&orientation=squarish`, {
            headers: {
                Authorization: `Client-ID ${unsplashKey}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                result = data.results[0].urls.regular;
            }
        }
    } catch (error) {
        console.warn('Unsplash fetch warning:', error);
    }

    if (!result) {
        // Fallback: deterministic pick from curated culinary Unsplash image IDs
        const fallbackIds = [
            "1540420773420-3366772f4999",
            "1546069901-ba9599a7e63c",
            "1555396273-367ea4eb4db5",
            "1565299624946-b28f40a0ae38",
            "1567620905732-2d1ec7ab7445",
            "1498837167922-ddd27525d352",
            "1482049016688-2d3e1b311543",
            "1504674900247-0877df9cc836"
        ];

        let hash = 0;
        for (let i = 0; i < photoQuery.length; i++) {
            hash = photoQuery.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % fallbackIds.length;
        result = `https://images.unsplash.com/photo-${fallbackIds[index]}?auto=format&fit=crop&w=600&q=80`;
    }

    photoCache.set(cacheKey, result);
    return result;
}

export async function generateMealPlan() {
    const generateBtn = document.getElementById('generateBtn') || document.querySelector('button[onclick*="generateMealPlan"]');
    const stopBtn = document.getElementById('stopBtn');
    const resultOutput = document.getElementById('resultOutput');

    const householdSize = document.getElementById('householdSize').value;
    const postalCode = document.getElementById('postalCode').value.trim();
    const planningDays = document.getElementById('planningDays').value;
    const mealsPerDay = document.getElementById('mealsPerDay').value;
    
    const breakfastToggle = document.getElementById('breakfastToggle').checked;
    const dessertToggle = document.getElementById('dessertToggle').checked;
    
    const calorieGoal = document.getElementById('calorieGoal').value.trim();
    const dietarySelect = document.getElementById('dietarySelect').value;
    const customDietaryNotes = document.getElementById('customDietaryNotes').value.trim();
    const preferredShop = document.getElementById('preferredShop').value;
    const prepGoal = document.getElementById('prepGoal').value;

    function showNotification(message, isError = false) {
        resultOutput.innerHTML = `
            <div style="background-color: ${isError ? 'rgba(189, 54, 45, 0.2)' : '#2c3325'}; 
                        border: 1.5px solid ${isError ? '#ffb4ab' : '#b5be8a'}; 
                        padding: 20px; border-radius: 10px; text-align: center; color: #ffffff;">
                <p style="margin: 0; font-weight: 600; color: ${isError ? '#ffb4ab' : '#b5be8a'};">
                    ${isError ? '⚠️ Notice' : '✨ Status'}
                </p>
                <p style="margin: 8px 0 0 0; font-size: 0.95rem;">${message}</p>
            </div>
        `;
    }

    if (postalCode && (postalCode.length !== 5 || isNaN(postalCode))) {
        showNotification('Please enter a valid 5-digit German postal code (or leave it blank).', true);
        document.getElementById('postalCode').focus();
        return;
    }

    if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.textContent = "Building Matrix Grid & Photos...";
    }
    if (stopBtn) {
        stopBtn.style.display = "block";
    }

    resultOutput.innerHTML = `
        <p style="text-align: center; color: #b5be8a; margin: 0; font-weight: 600;">
            🍳 Kitchen Byte Agent is compiling your structured meal matrix and fetching fresh food visuals...
        </p>
    `;

    currentAbortController = new AbortController();

    const displayShopName = preferredShop === 'no-preference' ? 'Local Supermarket' : preferredShop;
    let foundStoreInfo = postalCode 
        ? `- **${displayShopName}**\n  Address: Central branch near region ${postalCode}\n  Hours: Standard local store operating hours`
        : `- **${displayShopName}**\n  Address: Universal Global Grocery Match\n  Details: Standard market availability worldwide`;


    //   GOOGLE MAPS API CALL
    try {
        const shopKeyword = preferredShop === 'no-preference' ? 'supermarket' : preferredShop;
        const searchQuery = `${shopKeyword} in ${postalCode} Germany`;
        
        const mapsUrl = `https://places.googleapis.com/v1/places:searchText`;
        
        const mapResponse = await fetch(mapsUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': CONFIG.MAPS_API_KEY,
                'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.currentOpeningHours'
            },
            body: JSON.stringify({
                textQuery: searchQuery,
                maxResultCount: 3,
                languageCode: 'en'
            })
        });

        if (mapResponse.ok) {
            const mapData = await mapResponse.json();
            if (mapData && mapData.places && mapData.places.length > 0) {
                foundStoreInfo = mapData.places.map(place => {
                    let hoursText = "Opening hours available on-site";
                    if (place.currentOpeningHours && place.currentOpeningHours.weekdayDescriptions) {
                        hoursText = place.currentOpeningHours.weekdayDescriptions.join(' | ');
                    }
                    return `- **${place.displayName.text}**\n  Address: ${place.formattedAddress}\n  Hours: ${hoursText}`;
                }).join('\n\n');
            }
        }
    } catch (mapError) {
        console.warn("Google Maps fetch warning:", mapError);
    }

    const goalDescription = prepGoal === 'money' 
        ? "Save money & Zero Waste (Budget optimization, ingredient rotation)" 
        : "Save time & High Efficiency (Fast preparation, batch cooking)";

    const combinedDietaryInfo = `Preference: ${dietarySelect}. Notes: ${customDietaryNotes || "None"}`;

    // Pass instruction regarding estimated cost calculation based on postal code/currency
    const costInstruction = postalCode 
        ? `Estimate the total grocery cost for the shopping list based on average market prices in region ${postalCode} (Germany), using local currency (e.g. € / EUR). Populate the "estimatedCost" field with a string (e.g. "approx. 45.00 €").`
        : `Since no postal code was provided, set "estimatedCost" to null.`;

    const systemPrompt = `
You are Kitchen Byte, a strict fitness and meal-prep structuring agent. 
You must output ONLY valid JSON matching the requested schema. No markdown formatting blocks around the json if possible, or clean standard JSON.

CRITICAL RULES:
1. High Variety: NEVER repeat the exact same meal name on consecutive days or more than twice in the entire plan. Every single day must feature unique, creative, and appetizing dishes.
2. Meal Count Rule: "Main Meals/Day" (${mealsPerDay}) refers ONLY to main meals such as lunch/dinner — labeled "Meal 1", "Meal 2", etc. in sequential order. Breakfast is SEPARATE and ADDITIVE: if Include Breakfast is true, add exactly ONE additional slot labeled "Breakfast" on top of the ${mealsPerDay} main meals — do not reduce the main meal count to make room for it. So each day must contain exactly ${mealsPerDay} main meal(s) plus 1 breakfast slot if enabled (${breakfastToggle ? `total ${parseInt(mealsPerDay) + 1} meal entries per day, before dessert` : `total ${mealsPerDay} meal entries per day, before dessert`}).
3. Calorie Goal per Person: ${calorieGoal ? calorieGoal + " kcal" : "AI calculated optimal fitness range"}.
4. Cost Calculation: ${costInstruction}

Parameters:
- Household Size: ${householdSize} person(s)
- Postal Code / Region: ${postalCode || "None"}
- Planning Days: ${planningDays} (Label days sequentially as "Day 1", "Day 2", etc.)
- Meals Per Day Count: ${mealsPerDay}
- Include Breakfast: ${breakfastToggle ? "true" : "false"}
- Include Dessert Row: ${dessertToggle ? "true" : "false"}
- Dietary: ${combinedDietaryInfo}
- Goal: ${goalDescription}

Return a JSON object with this exact structure:
{
  "planSummary": "Meal prep for X people for Y days including [breakfast/no breakfast], [dessert/no dessert], dietary preference: Z.",
  "estimatedCost": "approx. 45.00 €" (or null if no postal code),
  "days": [
    {
      "dayName": "Day 1",
      "meals": [
        {
          "mealSlot": "Breakfast" (or "Meal 1", "Meal 2", etc.),
          "mealName": "Name of dish",
          "calories": 450,
          "protein": 35,
          "visualDescription": "Brief description of plating",
          "ingredients": ["100g oats", "1 scoop protein"],
          "cookingMethod": "Step-by-step instructions text",
          "duration": "15 mins"
        }
      ],
      "dessert": {
        "mealName": "Dessert Name",
        "calories": 200,
        "protein": 15,
        "visualDescription": "Plating look",
        "ingredients": ["..."],
        "cookingMethod": "...",
        "duration": "5 mins"
      } (null if dessertToggle is false)
    }
  ],
  "shoppingList": [
    {
      "aisle": "Produce",
      "items": ["Spinach 320g", "Broccoli 960g"]
    }
  ]
}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: systemPrompt,
            config: {
                responseMimeType: "application/json",
                // Wires the Stop button into the actual network request so it
                // cancels the in-flight call instead of just discarding the
                // result after the fact.
                abortSignal: currentAbortController.signal
            }
        });

        if (currentAbortController && currentAbortController.signal.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

        let rawText = response.text.trim();
        if (rawText.startsWith('```json')) {
            rawText = rawText.replace(/^```json/, '').replace(/```$/, '').trim();
        }
        const mealData = JSON.parse(rawText);

        // --- PHOTO FETCHING DISABLED ---
        // Unsplash search results weren't accurate enough (see fetchMealPhoto
        // above for context on why). Turned off for now rather than deleted —
        // uncomment this block to re-enable once there's a better image
        // source. The renderer already handles meal.photoUrl being undefined
        // (no broken image icons), so this is safe to leave off indefinitely.
        //
        // const photoTasks = [];
        // for (const day of mealData.days) {
        //     for (const meal of day.meals) {
        //         photoTasks.push(
        //             fetchMealPhoto(meal.photoQuery || meal.mealName).then(url => { meal.photoUrl = url; })
        //         );
        //     }
        //     if (day.dessert) {
        //         photoTasks.push(
        //             fetchMealPhoto(day.dessert.photoQuery || day.dessert.mealName).then(url => { day.dessert.photoUrl = url; })
        //         );
        //     }
        // }
        // await Promise.all(photoTasks);

        renderMealPlanOutput(resultOutput, mealData, foundStoreInfo);

    } catch (error) {
        if (error.name === 'AbortError' || error.message.includes('aborted')) {
            showNotification('Generation cancelled by user.', true);
        } else {
            console.error("Kitchen Byte Error:", error);
            showNotification('Failed to generate structured layout. Please try again.', true);
        }
    } finally {
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.textContent = "Generate Custom Meal Plan & Shopping List";
        }
        if (stopBtn) {
            stopBtn.style.display = "none";
        }
        currentAbortController = null;
    }
}

export function stopMealPlanGeneration() {
    if (currentAbortController) {
        currentAbortController.abort();
    }
}
window.stopMealPlanGeneration = stopMealPlanGeneration;