import apiClient from '../../api/apiClient';
import parseApiError from '../../utils/parseApiError';
import { Alert } from 'react-native';

export const createCheckoutSession = (planId, planType = 'PARTNER_PACKAGE') => async (dispatch) => {
  try {
    console.log('[SubscriptionAction] Creating web checkout session for:', planId, planType);
    
    const response = await apiClient.post('/subscriptions/create-checkout-session', {
      planId,
      planType
    });

    if (response.data && response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data?.message || 'Failed to initiate checkout');
    }
  } catch (error) {
    const errorMsg = parseApiError(error);
    console.error('[SubscriptionAction] Checkout error:', errorMsg);
    Alert.alert('Checkout Error', errorMsg);
    throw error;
  }
};
export const createPortalSession = () => async (dispatch) => {
  try {
    const response = await apiClient.post('/subscriptions/portal-session');
    if (response.data && response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data?.message || 'Failed to initiate portal session');
    }
  } catch (error) {
    const errorMsg = parseApiError(error);
    Alert.alert('Error', errorMsg);
    throw error;
  }
};
