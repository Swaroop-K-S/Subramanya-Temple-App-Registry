import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getTempleDate } from '../utils/dateUtils';

const TimeContext = createContext();

export const TimeProvider = ({ children }) => {
    const [currentDate, setCurrentDate] = useState(getTempleDate());
    const [currentTime, setCurrentTime] = useState(getTempleDate());
    const [isNewDay, setIsNewDay] = useState(false);

    const checkTime = useCallback(() => {
        const now = getTempleDate();
        setCurrentTime(now);

        // Check if day has changed (Midnight Trigger)
        // We compare date strings: 'Sun Feb 01 2026' vs 'Mon Feb 02 2026'
        // Since getTempleDate() returns a Date object shifted to IST, toDateString() gives the correct local date string for Kolkata
        if (now.toDateString() !== currentDate.toDateString()) {
            console.log("Date change detected:", currentDate.toDateString(), "->", now.toDateString());
            setCurrentDate(now);
            setIsNewDay(true);
            // Reset flag after 5 seconds to prevent infinite triggers
            setTimeout(() => setIsNewDay(false), 5000);
        }
    }, [currentDate]);

    // Timer Interval
    useEffect(() => {
        const timer = setInterval(checkTime, 1000);
        return () => clearInterval(timer);
    }, [checkTime]);

    // Wake-up Handler (Browser Sleep/Tab Switch)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                console.log("App woke up/visible: Forcing time check");
                checkTime();
            }
        };

        const handleFocus = () => {
            console.log("Window focused: Forcing time check");
            checkTime();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleFocus);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("focus", handleFocus);
        };
    }, [checkTime]);

    return (
        <TimeContext.Provider value={{ currentDate, currentTime, isNewDay }}>
            {children}
        </TimeContext.Provider>
    );
};

export const useTempleTime = () => useContext(TimeContext);
