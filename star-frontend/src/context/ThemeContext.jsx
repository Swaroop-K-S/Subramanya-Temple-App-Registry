import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTempleTime } from './TimeContext';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const { currentTime } = useTempleTime();

    // Default to 'light' initially to avoid flash, will correct immediately in effect
    const [theme, setTheme] = useState('light');
    const [isManualOverride, setIsManualOverride] = useState(false);

    // Auto-Switch Logic
    useEffect(() => {
        if (isManualOverride) return;

        // Calculate minutes from midnight
        const minutes = currentTime.getHours() * 60 + currentTime.getMinutes();

        // Daytime: 6:00 AM (360) to 6:00 PM (1080)
        const isDaytime = minutes >= 360 && minutes < 1080;
        const newTheme = isDaytime ? 'light' : 'dark';

        setTheme(newTheme);
    }, [currentTime, isManualOverride]);

    // Apply Theme to DOM
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    // Manual Toggle
    const toggleTheme = () => {
        setIsManualOverride(true); // Lock user preference until reload
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isManualOverride }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
