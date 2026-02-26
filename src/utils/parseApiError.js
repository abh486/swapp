// src/utils/parseApiError.js
const parseApiError = (error) => {
  try {
    // Handle null/undefined error
    if (!error) {
      return 'An unexpected error occurred. Please try again.';
    }

    // Handle string errors
    if (typeof error === 'string') {
      return error;
    }

    // Handle Error objects
    if (error instanceof Error) {
      return error.message || 'An unexpected error occurred. Please try again.';
    }

    // Handle axios response errors
    if (error.response && error.response.data) {
      if (typeof error.response.data.message === 'string') {
        return error.response.data.message;
      }
      if (typeof error.response.data.error === 'string') {
        return error.response.data.error;
      }
      if (typeof error.response.data === 'string') {
        return error.response.data;
      }
    }

    // Handle axios request errors (network errors)
    if (error.request) {
      return 'Network error. Please check your internet connection.';
    }

    // Handle axios timeout errors
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.';
    }

    // Handle other error objects with message property
    if (error.message && typeof error.message === 'string') {
      return error.message;
    }

    // Fallback
    return 'An unexpected error occurred. Please try again.';
  } catch (parseError) {
    console.error('Error parsing API error:', parseError);
    return 'An unexpected error occurred. Please try again.';
  }
};

export default parseApiError;