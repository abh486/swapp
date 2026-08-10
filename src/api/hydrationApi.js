import apiClient from './apiClient';

/**
 * Dedicated API service for Hydration / Water Intake tracking.
 * Provides seamless fallback to existing backend server endpoints when dedicated routes are pending deployment.
 */

/**
 * Fetch hydration logs and daily total for a given date.
 * @param {string} dateKey - Date in YYYY-MM-DD format
 */
export const fetchHydrationLogs = async (dateKey) => {
  try {
    const response = await apiClient.get('/hydration/logs', {
      params: { date: dateKey },
    });
    return response.data?.data || response.data || [];
  } catch (error) {
    // Fallback to active backend endpoint (/diet/logs/date/:date)
    try {
      const fallbackResponse = await apiClient.get(`/diet/logs/date/${dateKey}`);
      const logsData = fallbackResponse.data?.data || fallbackResponse.data || [];
      if (Array.isArray(logsData)) {
        return logsData.filter(
          (item) => item.mealType === 'water' || item.mealName === 'Water'
        );
      }
      return [];
    } catch (fallbackError) {
      return [];
    }
  }
};

/**
 * Log a new water intake entry to the database.
 * @param {Object} payload - { amountMl, date, timestamp, notes }
 */
export const logWaterIntake = async ({ amountMl, date, timestamp, notes }) => {
  const payload = {
    amountMl: parseInt(amountMl, 10) || 0,
    date: date || new Date().toISOString().split('T')[0],
    timestamp: timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    notes: notes || 'Water intake',
  };

  try {
    const response = await apiClient.post('/hydration/logs', payload);
    return response.data?.data || response.data;
  } catch (error) {
    // Fallback to active backend endpoint (/diet/logs)
    try {
      const dietFallback = await apiClient.post('/diet/logs', {
        mealName: 'Water',
        mealType: 'water',
        calories: 0,
        waterVolumeMl: parseInt(amountMl, 10) || 0,
        date: payload.date,
        notes: payload.notes,
      });
      return dietFallback.data?.data || dietFallback.data;
    } catch (fallbackError) {
      console.warn('[HydrationAPI] Permanent save failed, active offline mode:', fallbackError.message);
      return null;
    }
  }
};

/**
 * Permanently delete a water log entry from the database.
 * @param {string} logId - ID of the water log entry
 */
export const deleteWaterLog = async (logId) => {
  if (!logId) return;

  try {
    const response = await apiClient.delete(`/hydration/logs/${logId}`);
    return response.data;
  } catch (error) {
    try {
      const dietFallback = await apiClient.delete(`/diet/logs/${logId}`);
      return dietFallback.data;
    } catch (fallbackError) {
      return null;
    }
  }
};

/**
 * Fetch user's custom daily hydration target.
 */
export const fetchHydrationTarget = async () => {
  try {
    const response = await apiClient.get('/hydration/target');
    return response.data?.data?.targetMl || response.data?.targetMl || 2500;
  } catch (error) {
    return 2500;
  }
};

/**
 * Save user's custom daily hydration target.
 * @param {number} targetMl - Target in mL (e.g. 2500)
 */
export const saveHydrationTarget = async (targetMl) => {
  try {
    const response = await apiClient.post('/hydration/target', { targetMl });
    return response.data;
  } catch (error) {
    return null;
  }
};
