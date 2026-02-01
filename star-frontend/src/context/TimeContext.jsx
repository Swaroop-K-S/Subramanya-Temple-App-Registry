import { createContext, useContext, useState, useEffect } from 'react';

const TimeContext = createContext();

export const TimeProvider = ({ children }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isNewDay, setIsNewDay] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now);

            // Check if day has changed (Midnight Trigger)
            // We compare date strings: 'Sun Feb 01 2026' vs 'Mon Feb 02 2026'
            if (now.toDateString() !== currentDate.toDateString()) {
                setCurrentDate(now);
                setIsNewDay(true);
                // Reset flag after 5 seconds to prevent infinite triggers
                setTimeout(() => setIsNewDay(false), 5000);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [currentDate]);

    return (
        <TimeContext.Provider value={{ currentDate, currentTime, isNewDay }}>
            {children}
        </TimeContext.Provider>
    );
};

export const useTempleTime = () => useContext(TimeContext);
