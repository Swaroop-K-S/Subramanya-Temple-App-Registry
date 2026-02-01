import { useState, useEffect } from 'react';

const useLiveClock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        // Cleanup interval on unmount
        return () => clearInterval(timer);
    }, []);

    // Helper: Returns time in 'hh:mm:ss A' format
    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    // Helper: Returns date in 'Day, DD Month YYYY' format
    const formatDate = (date) => {
        return date.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Helper: Returns total minutes passed today (0 - 1440)
    const getMinutesFromMidnight = (date) => {
        return date.getHours() * 60 + date.getMinutes();
    };

    return {
        time,
        formatTime,
        formatDate,
        getMinutesFromMidnight
    };
};

export default useLiveClock;
