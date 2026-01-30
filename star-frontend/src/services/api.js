/**
 * S.T.A.R. Frontend - API Service
 * ================================
 * Axios configuration and API functions for communicating with the FastAPI backend.
 */

import axios from 'axios';

// Create Axios instance with base URL pointing to FastAPI backend
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Fetch all sevas from the seva_catalog table
 * @returns {Promise<Array>} Array of seva objects
 */
export const getAllSevas = async () => {
    const response = await api.get('/sevas');
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
export const bookSeva = async (bookingData) => {
    const response = await api.post('/book-seva', bookingData);
    return response.data;
};

/**
 * Get today's transactions
 * @returns {Promise<Array>} Array of today's transactions
 */
export const getTodayTransactions = async () => {
    const response = await api.get('/transactions/today');
    return response.data;
};

export default api;
