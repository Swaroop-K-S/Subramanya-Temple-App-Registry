/**
 * Mathematically safe Timezone shift (Fixes Safari/iOS NaN bugs)
 */
export const getTempleDate = () => {
    const now = new Date();
    // Get pure UTC in milliseconds
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    // IST is UTC + 5:30 (19800000 milliseconds)
    return new Date(utc + 19800000);
};

/**
 * Safe Date Formatter for Reports (Fixes Issue 3: "00-Jan-00")
 */
export const formatDateReport = (dateString) => {
    if (!dateString || dateString === '0000-00-00') return 'N/A';
    const date = new Date(dateString);
    // Check if date is actually valid before formatting
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-GB');
};
