/**
 * Utilities for Date and Time handling in the Temple App.
 * Enforces 'Asia/Kolkata' timezone for all critical calculations.
 */

// Format options for getting the full date/time string in IST
const IST_OPTIONS = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false // Use 24-hour format for easier parsing if needed, or consistent string comparison
};

/**
 * Returns a Javascript Date object that represents the current time in 'Asia/Kolkata'.
 * 
 * NOTE: Javascript Date objects are inherently based on the system's local timezone (or UTC).
 * To "force" a specific timezone representation in a Date object (so that .getHours() returns IST hours),
 * we shift the underlying timestamp.
 * 
 * Usage: Use this object's getters (.getDate(), .getHours()) directly for UI display logic that implies IST.
 * Do NOT send this Date object back to the server as ISO string without awareness that it is shifted.
 */
export const getTempleDate = () => {
    // robust parsing using Intl
    const now = new Date();

    // Get distinct parts for Asia/Kolkata
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
    });

    const parts = formatter.formatToParts(now);
    const getPart = (type) => parseInt(parts.find(p => p.type === type)?.value || 0, 10);

    const year = getPart('year');
    const month = getPart('month') - 1; // JS months are 0-11
    const day = getPart('day');
    const hour = getPart('hour');
    const minute = getPart('minute');
    const second = getPart('second');

    // Create a date object that *behaves* like it's in local time with these values
    return new Date(year, month, day, hour, minute, second);
};

/**
 * Safely formats a date string to avoid "Invalid Date" or "00-Jan-00" errors.
 * Input: "2023-10-05" or Date object
 * Output: "5 Oct 2023" (or "N/A" for broken data)
 */
export const formatDateReport = (dateString, fallback = 'N/A') => {
    if (!dateString || dateString === '0000-00-00') {
        return fallback;
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return 'N/A'; // Returning 'N/A' as per specific Issue 3 instruction
    }

    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};
