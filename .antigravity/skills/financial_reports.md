# Financials & PDF Engine v2.0

Crash Guard (Receipt.jsx): The print component MUST have an early exit if (!transaction) return null; and use optional chaining for all fields (e.g., transaction?.amount || 0) to prevent white-screen crashes if database fields are null.

Safe Dates (ReportsDashboard.jsx): In report tables, never render raw database dates. Always wrap them in the formatDateReport utility to catch 0000-00-00 and display "N/A".

PDF Export Logic: The jsPDF-autotable plugin is required. Columns must strictly follow: [Seva Name, Count, Revenue], mapped from reportData.seva_stats.
