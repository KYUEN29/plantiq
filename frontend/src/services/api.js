// Simple in-memory cache mapped to stringified payloads
const predictionCache = new Map();

export const predictPlantHealth = async (payload) => {
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const cacheKey = JSON.stringify(payload);

  if (predictionCache.has(cacheKey)) {
    console.log("Serving prediction from local session cache.");
    return predictionCache.get(cacheKey);
  }

  const response = await fetch(`${BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plants: payload }) // Wrapping in the expected batch object
  });

  if (!response.ok) {
    let errorMsg = "Server not reachable or returned an error.";
    try {
      const data = await response.json();
      if (data.detail) errorMsg = data.detail;
    } catch (e) {
      // JSON parse failed, stick to generic message
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  predictionCache.set(cacheKey, data.results);
  
  return data.results;
};
