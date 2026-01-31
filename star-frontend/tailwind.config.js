/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                temple: {
                    saffron: '#FF9933',
                    'saffron-dark': '#D97706',
                    gold: '#F59E0B',
                    sand: '#FFF5E1',
                    red: '#C53030',
                    stone: '#1F2937',
                    brown: '#5D4037',
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                heading: ['Playfair Display', 'serif'],
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translate3d(0, 20px, 0)' },
                    '100%': { opacity: '1', transform: 'translate3d(0, 0, 0)' },
                },
            },
        },
    },
    plugins: [],
}
