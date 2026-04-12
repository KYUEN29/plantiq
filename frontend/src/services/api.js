// Simple in-memory cache mapped to stringified payloads
const predictionCache = new Map();

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const predictPlantHealth = async (payload) => {
  const cacheKey = JSON.stringify(payload);

  if (predictionCache.has(cacheKey)) {
    console.log("Serving prediction from local session cache.");
    return predictionCache.get(cacheKey);
  }

  const response = await fetch(`${BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plants: payload })
  });

  if (!response.ok) {
    let errorMsg = "Server not reachable or returned an error.";
    try {
      const data = await response.json();
      if (data.detail) errorMsg = data.detail;
    } catch (e) { }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  predictionCache.set(cacheKey, data.results);
  return data.results;
};

export const getHistoryDashboard = async () => {
    const response = await fetch(`${BASE_URL}/history`);
    if (!response.ok) {
        throw new Error("Unable to parse historical datasets.");
    }
    return await response.json();
}

export const askChatAssistant = async (queryString, context = {}) => {
    const response = await fetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: queryString, context })
    });
    if (!response.ok) {
        throw new Error("Chatbot endpoint is currently offline.");
    }
    const data = await response.json();
    return data.reply;
}
