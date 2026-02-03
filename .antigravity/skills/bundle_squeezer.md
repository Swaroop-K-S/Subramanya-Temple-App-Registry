# Bundle Squeezer (Lazy Loading)

Rule: Lazy load heavy libraries (like `jspdf`, `html2canvas`, `recharts`) so the initial app load is under 1 second.

Reasoning: Keeps the main bundle size small (`index.js`), speeding up the "Time to Interactive" (TTI) metric.
