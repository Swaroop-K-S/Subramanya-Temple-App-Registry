# Computer Vision & Screenshot Analysis Rules

UI Confirmation: When given a screenshot, analyze the component against the 'Deep Glass' and 'Color Psychology' rules. Confirm if fonts, spacing, and colors were applied correctly.

Error Hunting: If a browser console error or Red Screen of Death is detected, read the stack trace from the image using OCR. Identify the exact file path and line number of the crash.

No Hallucinations: Do not guess the error. Quote the exact text from the screenshot (e.g., "Failed to resolve import...").
