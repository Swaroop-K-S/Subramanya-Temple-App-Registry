/**
 * S.T.A.R. Frontend - API Service
 * ================================
 * Axios configuration and API functions for communicating with the FastAPI backend.
 */

import axios from 'axios';

import { API_BASE_URL } from '../config';

// Create Axios instance with base URL pointing to FastAPI backend
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true // Extremely important: sends HttpOnly cookie with every request
});

// We no longer need the interceptor as the browser handles the cookie automatically
// But we still need an interceptor for handling 401 Unauthorized responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Tell the app to log out (since token is invalid or expired)
            window.dispatchEvent(new Event('unauthorized'));
        }
        return Promise.reject(error);
    }
);

/**
 * Get current logged-in user details
 * @returns {Promise<Object>} User object with role
 */
export const getCurrentUser = async () => {
    const response = await api.get('/users/me');
    return response.data;
};

/**
 * Fetch all sevas from the seva_catalog table
 * @returns {Promise<Array>} Array of seva objects
 */
export const getAllSevas = async (activeOnly = true) => {
    const response = await api.get('/sevas', {
        params: { active_only: activeOnly }
    });
    return response.data;
};

/**
 * Create a new Seva
 * @param {Object} sevaData - Seva details
 * @returns {Promise<Object>} Created Seva object
 */
export const createSeva = async (sevaData) => {
    const response = await api.post('/sevas', sevaData);
    return response.data;
};

/**
 * Fetch a specific seva by ID
 * @param {number} sevaId - The seva ID
 * @returns {Promise<Object>} Seva object
 */
export const getSevaById = async (sevaId) => {
    const response = await api.get(`/sevas/${sevaId}`);
    return response.data;
};

/**
 * Book a seva for a devotee
 * @param {Object} bookingData - Booking details
 * @param {string} bookingData.devotee_name - Full name of devotee
 * @param {string} bookingData.phone_number - Phone number
 * @param {string} bookingData.gothra - Optional gothra
 * @param {string} bookingData.nakshatra - Optional nakshatra
 * @param {number} bookingData.seva_id - ID of the seva
 * @param {number} bookingData.amount - Amount to pay
 * @param {string} bookingData.payment_mode - 'CASH' or 'UPI'
 * @returns {Promise<Object>} Transaction response with receipt number
 */
export const bookSeva = async (bookingData, idempotencyKey = null) => {
    const config = idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : {};
    const response = await api.post('/book-seva', bookingData, config);
    return response.data;
};

/**
 * Get today's transactions
 * @returns {Promise<Array>} Array of today's transactions
 */
export const getTodayTransactions = async () => {
    const response = await api.get('/transactions');
    return response.data;
};

// =============================================================================
// SHASWATA (PERPETUAL PUJA) API FUNCTIONS
// =============================================================================

/**
 * Create a new Shaswata (perpetual puja) subscription
 * @param {Object} data - Subscription details
 * @param {string} data.devotee_name - Full name of devotee
 * @param {string} data.phone_number - Phone number
 * @param {string} data.gothra - Optional gothra
 * @param {string} data.address - Optional address
 * @param {string} data.seva_type - 'GENERAL' or 'BRAHMACHARI'
 * @param {string} data.subscription_type - 'GREGORIAN', 'LUNAR', or 'RATHOTSAVA'
 * @param {number} data.event_day - Day (1-31) for Gregorian
 * @param {number} data.event_month - Month (1-12) for Gregorian
 * @param {string} data.maasa - Hindu month for Lunar
 * @param {string} data.paksha - Shukla/Krishna for Lunar
 * @param {string} data.tithi - Tithi for Lunar
 * @returns {Promise<Object>} Subscription response with ID
 */
export const createShaswataSubscription = async (data) => {
    const response = await api.post('/shaswata/subscribe', data);
    return response.data;
};

/**
 * Get all Shaswata subscriptions
 * @param {boolean} activeOnly - If true, only return active subscriptions
 * @returns {Promise<Array>} Array of subscription objects
 */
export const getShaswataSubscriptions = async (activeOnly = true) => {
    const response = await api.get('/shaswata/list', {
        params: { active_only: activeOnly }
    });
    return response.data;
};

export default api;
