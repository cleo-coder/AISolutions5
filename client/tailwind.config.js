export default {
    darkMode: 'class',
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                serif: ['"DM Serif Display"', 'serif'],
            },
            colors: {
                primary: '#4F46E5',
                secondary: '#9333EA',
                accent: '#06B6D4',
                light: '#F3F4F6',
                dark: '#1F2937',
            },
            animation: {
                'spin-slow': 'spin 20s linear infinite',
                'pulse-orb': 'pulse 3s ease-in-out infinite',
            },
            keyframes: {
                pulse: {
                    '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
                    '50%': { opacity: '0.7', transform: 'scale(1.05)' },
                },
            },
        },
    },
    plugins: [],
};
