/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    // v4 handles theme in CSS. Keeping this minimal to avoid conflicts.
    theme: {
        extend: {},
    },
    plugins: [],
}
