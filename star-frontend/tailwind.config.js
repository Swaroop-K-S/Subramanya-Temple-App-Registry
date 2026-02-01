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
                    // DIVINE Color System - High Contrast & Sacred
                    saffron: '#FF8C00',          // Dark Orange (High Visibility)
                    'saffron-glow': '#FFA500',   // Lighter Orange (Glow effects)
                    gold: '#FFD700',             // Metallic Gold (Icons)
                    ink: '#111827',              // Near-Black (Deep Gradients)
                    surface: '#FFFBF2',          // Warm, very light cream (Background)

                    // Legacy support (mapping to new system where appropriate)
                    red: '#C0392B',
                    stone: '#111827',            // Mapping stone to ink for consistency
                    brown: '#5D4037',            // Keeping brown for specific accents
                    sand: '#FFFBF2',             // Mapping sand to surface
                    'saffron-dark': '#CC7000',   // Darker shade of new saffron for hover states
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                heading: ['Playfair Display', 'serif'],
            },
            boxShadow: {
                // Custom Sacred Shadows
                'glow': '0 0 15px rgba(255, 140, 0, 0.6)',       // Active buttons
                'card': '0 10px 30px -10px rgba(0, 0, 0, 0.3)',  // Deep card shadow

                // Legacy shadows
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
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
