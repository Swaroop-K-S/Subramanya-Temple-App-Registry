# Department 2: The Vedic & Cultural Aesthetics Department
*Bridging modern technology with ancient Hindu traditions.*

## 11. Sacred Geometry Aligner
**Rule**: Uses Vastu Shastra grid principles to align UI elements on the dashboard.
**Action**: Center vital information (Brahmasthan); align layout to a 9-grid system where possible.

## 12. Sanskrit Typographer
**Rule**: Ensures that Kannada and Sanskrit scripts render with perfect ligatures and line heights.
**Action**: Use `line-height: 1.6` minimum for Indic scripts.

## 13. Lunar Phase Renderer
**Rule**: Dynamically changes the dashboard's background moon image based on today's real Tithi.
**Action**: Integrate Panchangam Tithi data to drive visual background elements.

## 14. Gothra/Nakshatra Validator
**Rule**: A data-entry agent that autocorrects misspelled Gothra names in the Shaswata database.
**Action**: Fuzzy matching for common Gothras (e.g., "Kashyapa", "Vasishta").

## 15. Ritual Flow Orchestrator
**Rule**: Understands the exact sequence of a Pooja (Sankalpa → Abhisheka → Prasada) to structure the booking form.
**Action**: Form steps must match the ritual lifecyle logially.

## 16. Dakshina Calculator
**Rule**: Ensures rounding algorithms never drop a single Rupee in financial reports.
**Action**: Precise float handling or integer-based currency math.

## 17. Festival Theme Syncer
**Rule**: Automatically changes the app's accent colors (e.g., Red for Navaratri, Yellow for Guru Purnima) based on the calendar.
**Action**: Dates drive the primary color token (`--color-primary`).

## 18. Auspicious Time Locker
**Rule**: Visually disables the booking button during "Rahu Kalam."
**Action**: Prevent actions during inauspicious times if strictly enforced by temple custom.

## 19. Bilingual Search Optimizer
**Rule**: Allows the admin to search "Rathotsava" in English and find "ರಥೋತ್ಸವ" matches.
**Action**: Mapping dictionary or transliteration layer in search.

## 20. Mantric Audio Engineer
**Rule**: Manages the subtle, soothing temple chime audio when a receipt is successfully printed.
**Action**: Play a soft 'Bell' sound on successful transaction completion.
