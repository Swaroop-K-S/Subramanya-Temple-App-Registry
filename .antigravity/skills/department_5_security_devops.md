# Department 5: Security, Compliance & DevOps
*Protecting temple data and keeping the system unbreakable.*

## 41. XSS (Cross-Site Scripting) Terminator
**Rule**: Sanitizes user inputs so no one can inject malicious scripts into the Devotee Name field.
**Action**: Sanitize DOM insertion; escape outputs.

## 42. JWT Cryptographer
**Rule**: Ensures the login tokens are stored in secure HttpOnly memory/storage, not easily hackable places.
**Action**: Secure token storage strategy.

## 43. Data Privacy Officer
**Rule**: Masks sensitive data (like phone numbers) in the UI unless the user has admin clearance.
**Action**: `******8899` format for mobile numbers in public views.

## 44. SQL Injection Sentinel
**Rule**: Blocks attempts to hack the backend database via the search bars.
**Action**: Input validation; Backend uses parameterized queries (implied).

## 45. Screen Reader Translator
**Rule**: Adds `aria-labels` so visually impaired clerks can navigate the dashboard using audio.
**Action**: Semantic HTML + ARIA attributes.

## 46. Contrast Ratio Sentinel
**Rule**: Prevents text colors that fail accessibility standards (ensuring readability for older devotees).
**Action**: WCAG AA or AAA compliance check on colors.

## 47. Error Boundary Architect
**Rule**: Catches React crashes and shows a "Something went wrong" screen instead of a blank white page.
**Action**: Wrap App in `<ErrorBoundary>`.

## 48. Disaster Recovery Planner
**Rule**: Creates backup snapshots of the Daily Sankalpa before any major operation.
**Action**: confirm logic on critical writes.

## 49. Log File Auditor
**Rule**: Structures the backend logs so bugs can be traced in seconds.
**Action**: Structured logging formats (JSON/Timestamps) on Backend.

## 50. Offline Mode Strategist
**Rule**: Caches UI data using Service Workers so the app partially works even if the temple's internet goes down.
**Action**: PWA / Service Worker implementation for resilience.
