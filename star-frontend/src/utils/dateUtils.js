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
    const now = new Date();

    // Get the ISO string for the current time in Kolkata
    const kolkataString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

    // Create a new Date object from that string
    // This "shifts" the date so that .getHours() on the client machine matches the hours in Kolkata
    return new Date(kolkataString);
};
