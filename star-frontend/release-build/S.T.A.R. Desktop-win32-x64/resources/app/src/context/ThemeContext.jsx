import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // 1. Initialize State (Check localStorage or default to 'light')
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        // Default to 'light' if no preference
        return saved === 'dark' ? 'dark' : 'light';
    });

    // 2. Effect: Apply Theme to DOM
    useEffect(() => {
        const root = document.documentElement;

        // Remove both to ensure clean switch
        root.classList.remove('light', 'dark');

        if (theme === 'dark') {
            root.classList.add('dark');
            root.style.colorScheme = 'dark';
        } else {
            root.classList.add('light');
            root.style.colorScheme = 'light';
        }

        // Persist preference
        localStorage.setItem('theme', theme);

        console.log(`🎨 Theme Changed to: ${theme.toUpperCase()}`);
    }, [theme]);

    // 3. Toggle Function
    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
