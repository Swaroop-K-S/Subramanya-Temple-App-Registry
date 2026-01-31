
import ephem
import math

MASAS = [
    "Chaitra", "Vaishakha", "Jyeshtha", "Ashadha",
    "Shravana", "Bhadrapada", "Ashwina", "Kartika",
    "Margashirsha", "Pausha", "Magha", "Phalguna"
]

def debug_panchang(date_str):
    print(f"--- Debugging for {date_str} ---")
    
    # Observer date
    edate = ephem.Date(date_str)
    print(f"Ephem Date: {edate}")
    
    # Sidereal Correction
    AYANAMSA = 24.14
    
    # helper
    def get_sid(obj):
        ecl = ephem.Ecliptic(obj)
        trop = math.degrees(ecl.lon)
        return (trop - AYANAMSA) % 360

    # 1. Sun Position Today
    s = ephem.Sun()
    s.compute(edate)
    s_lon = get_sid(s)
    print(f"Sun Sidereal Longitude Today: {s_lon:.2f}° (Rashi: {int(s_lon/30)})")
    
    # 2. Moon Position Today
    m = ephem.Moon()
    m.compute(edate)
    m_lon = get_sid(m)
    print(f"Moon Sidereal Longitude Today: {m_lon:.2f}°")
    
    # 3. Previous New Moon
    prev_nm = ephem.previous_new_moon(edate)
    print(f"Previous NM: {prev_nm}")
    
    # 4. Sun at Previous NM
    s_start = ephem.Sun()
    s_start.compute(prev_nm)
    s_start_lon = get_sid(s_start)
    rashi_start = int(s_start_lon / 30)
    print(f"Sun at Prev NM: {s_start_lon:.2f}° (Rashi: {rashi_start})")
    
    # 5. Next New Moon
    next_nm = ephem.next_new_moon(edate)
    print(f"Next NM: {next_nm}")
    
    # 6. Sun at Next NM
    s_end = ephem.Sun()
    s_end.compute(next_nm)
    s_end_lon = get_sid(s_end)
    rashi_end = int(s_end_lon / 30)
    print(f"Sun at Next NM: {s_end_lon:.2f}° (Rashi: {rashi_end})")
    
    # 7. Masa Logic
    if rashi_start == rashi_end:
        print("Adhika Masa Detected!")
        idx = (rashi_start + 1) % 12
        print(f"Calculated Masa: Adhika {MASAS[idx]}")
    else:
        print("Nija Masa Detected")
        idx = (rashi_end + 1) % 12
        print(f"Calculated Masa: {MASAS[idx]}")

debug_panchang("2026/01/31 00:30:00")
