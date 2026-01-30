/**
 * S.T.A.R. Frontend - Hindu Calendar Constants
 * =============================================
 * Data constants for Hindu calendar selection components.
 */

// =============================================================================
// HINDU MONTHS (12 Maasas)
// =============================================================================
export const HINDU_MONTHS = [
    { value: "Chaitra", label: "Chaitra (ಚೈತ್ರ)", english: "Mar-Apr" },
    { value: "Vaishakha", label: "Vaishakha (ವೈಶಾಖ)", english: "Apr-May" },
    { value: "Jyeshtha", label: "Jyeshtha (ಜ್ಯೇಷ್ಠ)", english: "May-Jun" },
    { value: "Ashadha", label: "Ashadha (ಆಷಾಢ)", english: "Jun-Jul" },
    { value: "Shravana", label: "Shravana (ಶ್ರಾವಣ)", english: "Jul-Aug" },
    { value: "Bhadrapada", label: "Bhadrapada (ಭಾದ್ರಪದ)", english: "Aug-Sep" },
    { value: "Ashwina", label: "Ashwina (ಆಶ್ವಿನ)", english: "Sep-Oct" },
    { value: "Kartika", label: "Kartika (ಕಾರ್ತಿಕ)", english: "Oct-Nov" },
    { value: "Margashirsha", label: "Margashirsha (ಮಾರ್ಗಶಿರ)", english: "Nov-Dec" },
    { value: "Pausha", label: "Pausha (ಪುಷ್ಯ)", english: "Dec-Jan" },
    { value: "Magha", label: "Magha (ಮಾಘ)", english: "Jan-Feb" },
    { value: "Phalguna", label: "Phalguna (ಫಾಲ್ಗುಣ)", english: "Feb-Mar" },
];

// Simple string array for dropdowns
export const MAASA_LIST = [
    "Chaitra",
    "Vaishakha",
    "Jyeshtha",
    "Ashadha",
    "Shravana",
    "Bhadrapada",
    "Ashwina",
    "Kartika",
    "Margashirsha",
    "Pausha",
    "Magha",
    "Phalguna",
];

// =============================================================================
// PAKSHAS (Lunar Fortnights)
// =============================================================================
export const PAKSHAS = [
    { value: "Shukla", label: "Shukla Paksha (ಶುಕ್ಲ)", description: "Bright/Waxing Moon" },
    { value: "Krishna", label: "Krishna Paksha (ಕೃಷ್ಣ)", description: "Dark/Waning Moon" },
];

// Simple string array
export const PAKSHA_LIST = ["Shukla", "Krishna"];

// =============================================================================
// TITHIS (Lunar Days)
// =============================================================================
export const TITHIS = [
    { value: "Pratipada", label: "Pratipada (ಪ್ರತಿಪದ)", day: 1 },
    { value: "Dwitiya", label: "Dwitiya (ದ್ವಿತೀಯಾ)", day: 2 },
    { value: "Tritiya", label: "Tritiya (ತೃತೀಯಾ)", day: 3 },
    { value: "Chaturthi", label: "Chaturthi (ಚತುರ್ಥಿ)", day: 4 },
    { value: "Panchami", label: "Panchami (ಪಂಚಮಿ)", day: 5 },
    { value: "Shashthi", label: "Shashthi (ಷಷ್ಠಿ)", day: 6 },
    { value: "Saptami", label: "Saptami (ಸಪ್ತಮಿ)", day: 7 },
    { value: "Ashtami", label: "Ashtami (ಅಷ್ಟಮಿ)", day: 8 },
    { value: "Navami", label: "Navami (ನವಮಿ)", day: 9 },
    { value: "Dashami", label: "Dashami (ದಶಮಿ)", day: 10 },
    { value: "Ekadashi", label: "Ekadashi (ಏಕಾದಶಿ)", day: 11 },
    { value: "Dwadashi", label: "Dwadashi (ದ್ವಾದಶಿ)", day: 12 },
    { value: "Trayodashi", label: "Trayodashi (ತ್ರಯೋದಶಿ)", day: 13 },
    { value: "Chaturdashi", label: "Chaturdashi (ಚತುರ್ದಶಿ)", day: 14 },
    { value: "Purnima", label: "Purnima (ಪೂರ್ಣಿಮಾ)", day: 15, special: "Full Moon" },
    { value: "Amavasya", label: "Amavasya (ಅಮಾವಾಸ್ಯೆ)", day: 15, special: "New Moon" },
];

// Simple string array
export const TITHI_LIST = [
    "Pratipada",
    "Dwitiya",
    "Tritiya",
    "Chaturthi",
    "Panchami",
    "Shashthi",
    "Saptami",
    "Ashtami",
    "Navami",
    "Dashami",
    "Ekadashi",
    "Dwadashi",
    "Trayodashi",
    "Chaturdashi",
    "Purnima",
    "Amavasya",
];

// =============================================================================
// NAKSHATRAS (27 Birth Stars)
// =============================================================================
export const NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Moola", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

// =============================================================================
// RASHIS (12 Zodiac Signs)
// =============================================================================
export const RASHIS = [
    "Mesha",
    "Vrishabha",
    "Mithuna",
    "Karka",
    "Simha",
    "Kanya",
    "Tula",
    "Vrishchika",
    "Dhanu",
    "Makara",
    "Kumbha",
    "Meena"
];

// =============================================================================
// ENGLISH MONTHS (for Gregorian dates)
// =============================================================================
export const ENGLISH_MONTHS = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
];
