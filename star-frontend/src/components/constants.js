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
    { en: "Ashwini", kn: "ಅಶ್ವಿನಿ" },
    { en: "Bharani", kn: "ಭರಣಿ" },
    { en: "Krittika", kn: "ಕೃತಿಕ" },
    { en: "Rohini", kn: "ರೋಹಿಣಿ" },
    { en: "Mrigashira", kn: "ಮೃಗಶಿರ" },
    { en: "Ardra", kn: "ಆರ್ದ್ರ" },
    { en: "Punarvasu", kn: "ಪುನರ್ವಸು" },
    { en: "Pushya", kn: "ಪುಷ್ಯ" },
    { en: "Ashlesha", kn: "ಆಶ್ಲೇಷ" },
    { en: "Magha", kn: "ಮಘ" },
    { en: "Purva Phalguni", kn: "ಪುಬ್ಬ (ಪೂರ್ವ ಫಲ್ಗುಣಿ)" },
    { en: "Uttara Phalguni", kn: "ಉತ್ತರೆ (ಉತ್ತರ ಫಲ್ಗುಣಿ)" },
    { en: "Hasta", kn: "ಹಸ್ತ" },
    { en: "Chitra", kn: "ಚಿತ್ರಾ" },
    { en: "Swati", kn: "ಸ್ವಾತಿ" },
    { en: "Vishakha", kn: "ವಿಶಾಖ" },
    { en: "Anuradha", kn: "ಅನುರಾಧ" },
    { en: "Jyeshtha", kn: "ಜ್ಯೇಷ್ಠ" },
    { en: "Moola", kn: "ಮೂಲ" },
    { en: "Purva Ashadha", kn: "ಪೂರ್ವಾಷಾಢ" },
    { en: "Uttara Ashadha", kn: "ಉತ್ತರಾಷಾಢ" },
    { en: "Shravana", kn: "ಶ್ರವಣ" },
    { en: "Dhanishta", kn: "ಧನಿಷ್ಠ" },
    { en: "Shatabhisha", kn: "ಶತಭಿಷ" },
    { en: "Purva Bhadrapada", kn: "ಪೂರ್ವಾ ಭಾದ್ರಪದ" },
    { en: "Uttara Bhadrapada", kn: "ಉತ್ತರಾ ಭಾದ್ರಪದ" },
    { en: "Revati", kn: "ರೇವತಿ" }
];

// =============================================================================
// RASHIS (12 Zodiac Signs)
// =============================================================================
export const RASHIS = [
    { en: "Mesha", kn: "ಮೇಷ (Aries)" },
    { en: "Vrishabha", kn: "ವೃಷಭ (Taurus)" },
    { en: "Mithuna", kn: "ಮಿಥುನ (Gemini)" },
    { en: "Karka", kn: "ಕರ್ಕಾಟಕ (Cancer)" },
    { en: "Simha", kn: "ಸಿಂಹ (Leo)" },
    { en: "Kanya", kn: "ಕನ್ಯಾ (Virgo)" },
    { en: "Tula", kn: "ತುಲಾ (Libra)" },
    { en: "Vrishchika", kn: "ವೃಶ್ಚಿಕ (Scorpio)" },
    { en: "Dhanu", kn: "ಧನು (Sagittarius)" },
    { en: "Makara", kn: "ಮಕರ (Capricorn)" },
    { en: "Kumbha", kn: "ಕುಂಭ (Aquarius)" },
    { en: "Meena", kn: "ಮೀನ (Pisces)" }
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

// =============================================================================
// BILINGUAL ARRAYS FOR SHASWATA DROPDOWNS
// =============================================================================

// Masas (Bilingual - for language-aware dropdowns)
export const MASAS = [
    { en: "Chaithra", kn: "ಚೈತ್ರ" },
    { en: "Vaishakha", kn: "ವೈಶಾಖ" },
    { en: "Jyeshtha", kn: "ಜ್ಯೇಷ್ಠ" },
    { en: "Ashadha", kn: "ಆಷಾಢ" },
    { en: "Shravana", kn: "ಶ್ರಾವಣ" },
    { en: "Bhadrapada", kn: "ಭಾದ್ರಪದ" },
    { en: "Ashwina", kn: "ಆಶ್ವಿನ" },
    { en: "Kartika", kn: "ಕಾರ್ತಿಕ" },
    { en: "Margashirsha", kn: "ಮಾರ್ಗಶಿರ" },
    { en: "Pausha", kn: "ಪುಷ್ಯ" },
    { en: "Magha", kn: "ಮಾಘ" },
    { en: "Phalguna", kn: "ಫಾಲ್ಗುಣ" },
];

// Pakshas (Bilingual)
export const PAKSHAS_BILINGUAL = [
    { en: "Shukla", kn: "ಶುಕ್ಲ" },
    { en: "Krishna", kn: "ಕೃಷ್ಣ" },
];

// Tithis (Bilingual)
export const TITHIS_BILINGUAL = [
    { en: "Pratipada", kn: "ಪ್ರತಿಪದ" },
    { en: "Dwitiya", kn: "ದ್ವಿತೀಯಾ" },
    { en: "Tritiya", kn: "ತೃತೀಯಾ" },
    { en: "Chaturthi", kn: "ಚತುರ್ಥಿ" },
    { en: "Panchami", kn: "ಪಂಚಮಿ" },
    { en: "Shashthi", kn: "ಷಷ್ಠಿ" },
    { en: "Saptami", kn: "ಸಪ್ತಮಿ" },
    { en: "Ashtami", kn: "ಅಷ್ಟಮಿ" },
    { en: "Navami", kn: "ನವಮಿ" },
    { en: "Dashami", kn: "ದಶಮಿ" },
    { en: "Ekadashi", kn: "ಏಕಾದಶಿ" },
    { en: "Dwadashi", kn: "ದ್ವಾದಶಿ" },
    { en: "Trayodashi", kn: "ತ್ರಯೋದಶಿ" },
    { en: "Chaturdashi", kn: "ಚತುರ್ದಶಿ" },
    { en: "Purnima", kn: "ಹುಣ್ಣಿಮೆ" },
    { en: "Amavasya", kn: "ಅಮಾವಾಸ್ಯೆ" },
];
