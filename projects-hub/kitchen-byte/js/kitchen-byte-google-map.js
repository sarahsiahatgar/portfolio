/* =========================================================================
       GOOGLE MAPS API CALL (COMMENTED OUT TO SAVE FREE-TIER QUOTA)
   ========================================================================= */
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