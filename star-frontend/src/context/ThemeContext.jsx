import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTempleTime } from './TimeContext';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const { currentTime } = useTempleTime();

    // START WITH LIGHT MODE DEFAULT (Since most temple traffic is daytime)
    const [theme, setTheme] = useState('light');
    const [isManualOverride, setIsManualOverride] = useState(false);

    // BULLETPROOF AUTO-SWITCH LOGIC
    useEffect(() => {
        // 1. Get exact current hour and minute
        const hours = currentTime.getHours();
        const minutes = currentTime.getMinutes();
        const totalMinutes = hours * 60 + minutes;

        // 2. Define Day: 6:00 AM (360) to 6:00 PM (1080)
        const isDaytime = totalMinutes >= 360 && totalMinutes < 1080;
        const correctTheme = isDaytime ? 'light' : 'dark';

        // 3. FORCE RESET at exact boundaries (6 AM and 6 PM)
        if (totalMinutes === 360 || totalMinutes === 1080) {
            setIsManualOverride(false);
        }

        // 4. APPLY correct theme if user hasn't locked it
        if (!isManualOverride && theme !== correctTheme) {
            console.log(`☀️ Time is ${hours}:${minutes}. Switching to ${correctTheme} mode.`);
            setTheme(correctTheme);
        }
    }, [currentTime, isManualOverride, theme]);

    // THEME INJECTOR (Updates the actual HTML class)
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            root.style.colorScheme = 'dark';
        } else {
            root.classList.remove('dark');
            root.style.colorScheme = 'light';
        }
    }, [theme]);

    // MANUAL TOGGLE (User overrides the clock)
    const toggleTheme = () => {
        setIsManualOverride(true);
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isManualOverride }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
