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

// =============================================================================
// GOTRAS (49 Major Hindu Brahmin Lineages)
// =============================================================================
export const GOTRAS = [
    // Sapta Rishis (7 Primary Sages)
    { en: "Vishwamitra", kn: "ವಿಶ್ವಾಮಿತ್ರ" },
    { en: "Jamadagni", kn: "ಜಮದಗ್ನಿ" },
    { en: "Bharadwaja", kn: "ಭರದ್ವಾಜ" },
    { en: "Gautama", kn: "ಗೌತಮ" },
    { en: "Atri", kn: "ಅತ್ರಿ" },
    { en: "Vasishta", kn: "ವಸಿಷ್ಠ" },
    { en: "Kashyapa", kn: "ಕಶ್ಯಪ" },
    { en: "Agastya", kn: "ಅಗಸ್ತ್ಯ" },
    // Extended Gotras (Alphabetical)
    { en: "Aangirasa", kn: "ಆಂಗಿರಸ" },
    { en: "Atreya", kn: "ಆತ್ರೇಯ" },
    { en: "Bhadarayana", kn: "ಬಾದರಾಯಣ" },
    { en: "Bhargava", kn: "ಭಾರ್ಗವ" },
    { en: "Chikitasa", kn: "ಚಿಕಿತಸ" },
    { en: "Dhananjaya", kn: "ಧನಂಜಯ" },
    { en: "Dhanvantari", kn: "ಧನ್ವಂತರಿ" },
    { en: "Garga", kn: "ಗಾರ್ಗ" },
    { en: "Harita", kn: "ಹರಿತ" },
    { en: "Jabali", kn: "ಜಾಬಾಲಿ" },
    { en: "Kaashyapa", kn: "ಕಾಶ್ಯಪ" },
    { en: "Kalabodhana", kn: "ಕಾಲಬೋಧನ" },
    { en: "Kanva", kn: "ಕಣ್ವ" },
    { en: "Kapi", kn: "ಕಪಿ" },
    { en: "Katyayana", kn: "ಕಾತ್ಯಾಯನ" },
    { en: "Kaundinya", kn: "ಕೌಂಡಿನ್ಯ" },
    { en: "Kausika", kn: "ಕೌಶಿಕ" },
    { en: "Krishnatreya", kn: "ಕೃಷ್ಣಾತ್ರೇಯ" },
    { en: "Kutsa", kn: "ಕುತ್ಸ" },
    { en: "Lohita", kn: "ಲೋಹಿತ" },
    { en: "Maitreya", kn: "ಮೈತ್ರೇಯ" },
    { en: "Mandavya", kn: "ಮಾಂಡವ್ಯ" },
    { en: "Maudgalya", kn: "ಮೌದ್ಗಲ್ಯ" },
    { en: "Naidhruva", kn: "ನೈಧೃವ" },
    { en: "Parasara", kn: "ಪರಾಶರ" },
    { en: "Pulastya", kn: "ಪುಲಸ್ತ್ಯ" },
    { en: "Sandilya", kn: "ಶಾಂಡಿಲ್ಯ" },
    { en: "Sankriti", kn: "ಸಾಂಕೃತಿ" },
    { en: "Shandilya", kn: "ಶಾಂಡಿಲ್ಯ" },
    { en: "Shatamarshana", kn: "ಶತಮರ್ಷಣ" },
    { en: "Shaunaka", kn: "ಶೌನಕ" },
    { en: "Shrivatsa", kn: "ಶ್ರೀವತ್ಸ" },
    { en: "Suryadhwaja", kn: "ಸೂರ್ಯಧ್ವಜ" },
    { en: "Upamanyu", kn: "ಉಪಮನ್ಯು" },
    { en: "Vadhoola", kn: "ವಾಧೂಲ" },
    { en: "Vashishta", kn: "ವಶಿಷ್ಠ" },
    { en: "Vatsa", kn: "ವತ್ಸ" },
    { en: "Vishnuvriddha", kn: "ವಿಷ್ಣುವೃದ್ಧ" },
    { en: "Vyaghrapada", kn: "ವ್ಯಾಘ್ರಪಾದ" },
    { en: "Yaska", kn: "ಯಾಸ್ಕ" },
    // Special Entry for Unknown/Other
    { en: "Other", kn: "ಇತರ" },
];

// =============================================================================
// OCCASIONS (For Shashwata Seva Booking - Why they are performing pooja)
// =============================================================================
export const OCCASIONS = [
    { en: "Birthday", kn: "ಜನ್ಮದಿನ", icon: "🎂", description: "Annual birthday blessing" },
    { en: "Wedding Anniversary", kn: "ಮದುವೆ ವಾರ್ಷಿಕೋತ್ಸವ", icon: "💍", description: "Marriage celebration" },
    { en: "Shradha (Death Anniversary)", kn: "ಶ್ರಾದ್ಧ", icon: "🕯️", description: "Remembrance of ancestors" },
    { en: "Baby Naming (Namakarana)", kn: "ನಾಮಕರಣ", icon: "👶", description: "Naming ceremony" },
    { en: "Thread Ceremony (Upanayana)", kn: "ಉಪನಯನ", icon: "🪔", description: "Sacred thread ceremony" },
    { en: "House Warming (Griha Pravesh)", kn: "ಗೃಹ ಪ್ರವೇಶ", icon: "🏠", description: "New home blessing" },
    { en: "New Business", kn: "ಹೊಸ ವ್ಯಾಪಾರ", icon: "💼", description: "Business inauguration" },
    { en: "Health & Wellbeing", kn: "ಆರೋಗ್ಯ ಮತ್ತು ಕ್ಷೇಮ", icon: "🙏", description: "Prayers for health" },
    { en: "Education & Success", kn: "ಶಿಕ್ಷಣ ಮತ್ತು ಯಶಸ್ಸು", icon: "📚", description: "Academic blessings" },
    { en: "General Blessing", kn: "ಸಾಮಾನ್ಯ ಆಶೀರ್ವಾದ", icon: "✨", description: "General prayer request" },
    { en: "Other", kn: "ಇತರೆ", icon: "📿", description: "Other occasion" },
];
