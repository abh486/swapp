import apiClient from '../api/apiClient';

/**
 * Checks the user's access status for AI Dietician
 */
export const getAccessStatus = async () => {
  const response = await apiClient.get('/subscriptions/ai-dietician/access');
  return response.data?.data || response.data || response;
};

/**
 * Activates the free 7-day trial for AI Dietician
 */
export const activateTrial = async () => {
  const response = await apiClient.post('/subscriptions/ai-dietician/trial');
  return response.data?.data || response.data || response;
};

/**
 * Fetches the active plans for AI Dietician
 */
export const getPlans = async () => {
  const response = await apiClient.get('/subscriptions/ai-dietician/plans');
  return response.data?.data || response.data || response;
};

/**
 * Creates a checkout session URL for Chargebee hosted page
 */
export const createCheckout = async (planId) => {
  const response = await apiClient.post('/subscriptions/ai-dietician/checkout', { planId });
  return response.data?.data || response.data || response;
};

/**
 * Gets active/latest subscription details for AI Dietician
 */
export const getSubscriptionDetails = async () => {
  const response = await apiClient.get('/subscriptions/ai-dietician/me');
  return response.data?.data || response.data || response;
};

/**
 * Cancels the active digital subscription at term end
 */
export const cancelSubscription = async (subscriptionId) => {
  const response = await apiClient.post('/subscriptions/ai-dietician/cancel', { subscriptionId });
  return response.data?.data || response.data || response;
};

/**
 * Gets all AI Dietician chat conversations for the user
 */
export const getConversations = async () => {
  const response = await apiClient.get('/diet/chat/conversations');
  return response.data?.data || response.data || response;
};

/**
 * Gets messages for a specific conversation
 */
export const getConversationMessages = async (conversationId) => {
  const response = await apiClient.get(`/diet/chat/conversations/${conversationId}/messages`);
  const data = response.data?.data || response.data || response;
  return Array.isArray(data) ? data : (data?.messages || []);
};

/**
 * Sends a message to the AI Dietician (and creates a conversation if ID is null)
 */
export const sendDieticianMessage = async (conversationId, message) => {
  const payload = { message };
  if (conversationId) payload.conversationId = conversationId;
  const response = await apiClient.post('/diet/chat/messages', payload);
  return response.data?.data || response.data || response;
};
