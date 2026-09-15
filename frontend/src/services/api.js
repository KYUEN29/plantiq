// Simple in-memory cache mapped to stringified payloads
const predictionCache = new Map();

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const request = (path, options = {}) => fetch(`${BASE_URL}${path}`, {
  credentials: 'include',
  ...options,
});

export const predictPlantHealth = async (payload) => {
  const cacheKey = JSON.stringify(payload);

  if (predictionCache.has(cacheKey)) {
    console.log("Serving prediction from local session cache.");
    return predictionCache.get(cacheKey);
  }

  const response = await request('/predict', {
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
    const response = await request('/history');
    if (!response.ok) {
        throw new Error("Unable to parse historical datasets.");
    }
    return await response.json();
}

export const askChatAssistant = async (queryString, context = {}) => {
    const response = await request('/chat', {
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

const authRequest = async (path, payload) => {
  const response = await request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || 'Authentication request failed.');
  return data;
};

export const register = (payload) => authRequest('/auth/register', payload);
export const login = (payload) => authRequest('/auth/login', payload);

export const getCurrentUser = async () => {
  const response = await request('/auth/me');
  if (response.status === 401) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || 'Unable to check your session.');
  return data;
};

export const logout = async () => {
  const response = await request('/auth/logout', { method: 'POST' });
  if (!response.ok) throw new Error('Unable to end your session.');
};

const gardenRequest = async (path, options = {}) => {
  const response = await request(path, options);
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || 'Unable to update your garden.');
  return data;
};

export const getPlantCatalogue = () => gardenRequest('/plants');
export const getGarden = () => gardenRequest('/garden');
export const getGardenPlant = (id) => gardenRequest(`/garden/${id}`);
export const addGardenPlant = (payload) => gardenRequest('/garden', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
});
export const updateGardenPlant = (id, payload) => gardenRequest(`/garden/${id}`, {
  method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
});
export const deleteGardenPlant = (id) => gardenRequest(`/garden/${id}`, { method: 'DELETE' });

const assessmentRequest = async (path, options = {}) => {
  const response = await request(path, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || 'Unable to save your assessment.');
  return data;
};

export const getQuestionnaire = () => assessmentRequest('/questionnaires/current');
export const getQuestionnaireQuestions = () => assessmentRequest('/questionnaires/current/questions');
export const submitAssessment = (payload) => assessmentRequest('/assessments', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
});
export const getAssessment = (id) => assessmentRequest(`/assessments/${id}`);
export const getAssessments = (limit = 20, offset = 0) =>
  assessmentRequest(`/assessments?limit=${limit}&offset=${offset}`);
export const getPlantAssessments = (plantId, limit = 20, offset = 0) =>
  assessmentRequest(`/assessments/garden/${plantId}/assessments?limit=${limit}&offset=${offset}`);
export const getPlantAnalytics = (plantId) =>
  assessmentRequest(`/assessments/garden/${plantId}/analytics`);
export const getPersonalization = (plantId) =>
  assessmentRequest(`/assessments/garden/${plantId}/personalization`);
export const submitFeedback = (assessmentId, payload) => assessmentRequest(`/assessments/${assessmentId}/feedback`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
});
export const getFeedback = (assessmentId) => assessmentRequest(`/assessments/${assessmentId}/feedback`);
export const requestExplanation = (assessmentId) => assessmentRequest(`/assessments/${assessmentId}/explanation`, {
  method: 'POST',
});
export const updatePreferences = (payload) => assessmentRequest('/auth/me', {
  method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
});
