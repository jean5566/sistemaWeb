/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enable dark mode with class strategy
    theme: {
        extend: {
            colors: {
                primary: '#2563eb', // Blue-600
                'primary-light': '#eff6ff', // Blue-50
                secondary: '#64748b', // Slate-500
                dark: '#0f172a',    // Slate-900 (Text)
                light: '#ffffff',   // Pure White
                danger: '#ef4444',
                warning: '#f59e0b',
                // Image-based UI Colors
                'sidebar-bg': '#ffffff',
                'sidebar-border': '#f1f5f9', // Slate-100
                'content-bg': '#f8fafc', // Very subtle light gray background
                'card-bg': '#ffffff',
                'border-subtle': '#f1f5f9', // Slate-100
            },
            borderRadius: {
                '2xl': '1rem',
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
