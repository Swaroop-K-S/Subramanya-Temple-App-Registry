# Vedic Time Engine v2.0

No Raw Dates: Never use new Date() in components. You MUST use the currentTime from TimeContext.jsx.

Safari NaN Guard: The timezone offset in src/utils/dateUtils.js must be calculated mathematically (utc + 19800000 ms) to prevent Safari string parsing crashes.

Midnight & Theme Resets: Ensure the ThemeContext.jsx explicitly sets isManualOverride(false) at exactly 6:00 AM and 6:00 PM to prevent the dark mode from getting permanently stuck.

Dependency Arrays: Do not include currentTime (which ticks every second) in useEffect dependency arrays unless strictly necessary, to prevent re-render loops.
