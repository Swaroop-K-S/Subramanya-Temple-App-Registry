/**
 * S.T.A.R. Frontend - Transliteration Service
 * ============================================
 * Converts English text to Kannada using Google Input Tools API.
 */

/**
 * Transliterate English text to target language (default: Kannada)
 * 
 * @param {string} text - The English text to transliterate
 * @param {string} targetLang - Target language code (default: 'kn' for Kannada)
 * @returns {Promise<string>} - Transliterated text or original text on error
 * 
 * @example
 * const kannadaName = await transliterateText("Ramesh Kumar");
 * // Returns: "ರಮೇಶ್ ಕುಮಾರ್"
 */
export async function transliterateText(text, targetLang = 'kn') {
    // Return empty if no text provided
    if (!text || text.trim() === '') {
        return text;
    }

    // Skip if text already contains Kannada characters
    const kannadaPattern = /[\u0C80-\u0CFF]/;
    if (kannadaPattern.test(text)) {
        return text; // Already in Kannada
    }

    try {
        const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=${targetLang}-t-i0-und&num=1`;

        const response = await fetch(url);

        if (!response.ok) {
            console.warn('Transliteration API failed:', response.status);
            return text;
        }

        const data = await response.json();

        // Response format: ["SUCCESS", [["source", ["result1", "result2"]]]]
        if (data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1]) {
            return data[1][0][1][0] || text;
        }

        return text;
    } catch (error) {
        console.warn('Transliteration error:', error.message);
        return text; // Return original text on error
    }
}

/**
 * Batch transliterate multiple texts
 * 
 * @param {string[]} texts - Array of texts to transliterate
 * @param {string} targetLang - Target language code
 * @returns {Promise<string[]>} - Array of transliterated texts
 */
export async function transliterateMultiple(texts, targetLang = 'kn') {
    const results = await Promise.all(
        texts.map(text => transliterateText(text, targetLang))
    );
    return results;
}

export default transliterateText;
