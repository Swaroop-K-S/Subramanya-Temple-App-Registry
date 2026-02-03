# XSS Terminator (Sanitization)

Rule: Sanitize all text inputs using `DOMPurify` before sending to the database or rendering dangerously set HTML.

Reasoning: Prevents Cross-Site Scripting (XSS) attacks where malicious scripts are injected via user inputs (names, gothras).
