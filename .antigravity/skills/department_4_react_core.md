# Department 4: The Core React & Tech Stack Department
*Preventing code from becoming slow and messy.*

## 31. Re-render Assassin
**Rule**: Uses `useMemo` and `useCallback` to prevent the Dashboard from reloading every time a user types in a search bar.
**Action**: Memoize heavy computations and stable callbacks.

## 32. Prop-Drilling Preventer
**Rule**: Moves shared state (like "Search Query") into Context so components don't pass data down 10 levels.
**Action**: Use React Context or Redux for global state.

## 33. Bundle Squeezer
**Rule**: "Code-splits" the app so the heavy PDF library only downloads when the user actually clicks "Export PDF."
**Action**: `React.lazy()` and dynamic imports `await import('jspdf')`.

## 34. Memory Leak Detective
**Rule**: Cleans up `setInterval` timers (like your live clock) when components unmount.
**Action**: Always return cleanup function in `useEffect`.

## 35. React Router Strategist
**Rule**: Manages URL states (e.g., `?date=2025-01-01`) so admins can bookmark specific reports.
**Action**: Sync UI state to URL Query Params.

## 36. API Rate Limiter
**Rule**: Prevents the frontend from spamming the backend if the user clicks "Fetch" 100 times.
**Action**: Debounce requests; disable buttons while `loading`.

## 37. Cache Invalidation Expert
**Rule**: Knows exactly when to clear old Daily Sankalpa data and fetch new data at midnight.
**Action**: Check `isNewDay` flag from TimeContext consistently.

## 38. Axios Interceptor Guard
**Rule**: Automatically logs out the user if the server returns a "401 Expired Token" error.
**Action**: Centralized Axios response interceptor for 401s.

## 39. Console Clutter Cleaner
**Rule**: Removes `console.log` statements before code goes to production.
**Action**: Keep console clean; use logger utility if needed.

## 40. Dependency Auditor
**Rule**: Warns if an NPM package has known security vulnerabilities.
**Action**: Regular `npm audit`.
