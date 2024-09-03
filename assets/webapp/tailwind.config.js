/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',  // Ensures that dark mode is controlled via a class
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px',
            },
        },

        extend: {
            colors: {
                primary: 'var(--primary)',
                secondary: 'var(--secondary)',
                danger: 'var(--danger)',
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                dark: 'var(--dark)',
                light: 'var(--light)',
            },
            keyframes: {
                'accordion-down': {
                    from: {height: '0'},
                    to: {height: 'var(--radix-accordion-content-height)'},
                },
                'accordion-up': {
                    from: {height: 'var(--radix-accordion-content-height)'},
                    to: {height: '0'},
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};
