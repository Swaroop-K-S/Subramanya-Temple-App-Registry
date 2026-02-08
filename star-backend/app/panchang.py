
import ephem
import math
from datetime import datetime, timedelta

# --- CONSTANTS ---
# Standard Lunar Month Names (0 = Chaitra, 1 = Vaishakha...)
MASAS = [
    "Chaitra", "Vaishakha", "Jyeshtha", "Ashadha",
    "Shravana", "Bhadrapada", "Ashwayuja", "Kartika",
    "Margashira", "Pushya", "Magha", "Phalguna"
]

# Nakshatras (0 = Ashwini...)
NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
    "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]

# Tithis (1-15 for Shukla, 16-30 for Krishna)
TITHIS = [
    "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shasthi",
    "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
    "Trayodashi", "Chaturdashi", "Purnima",  # 0-14 (Shukla)
    "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shasthi",
    "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
    "Trayodashi", "Chaturdashi", "Amavasya"  # 15-29 (Krishna)
]

# Yogas
YOGAS = [
    "Vishkumbha", "Preeti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", 
    "Sukarma", "Dhriti", "Shula", "Ganda", "Vriddhi", "Dhruva", 
    "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyan", 
    "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", 
    "Brahma", "Indra", "Vaidhriti"
]

# Karanas
KARANAS = [
    "Bava", "Balava", "Kaulava", "Taitila", "Garija", "Vanija", "Vishti (Bhadra)", 
    "Shakuni", "Chatushpada", "Naga", "Kimstughna"
]

# Samvatsaras (60-year Jupiter Cycle)
SAMVATSARAS = [
    "Prabhava", "Vibhava", "Shukla", "Pramoda", "Prajotpatti", "Angirasa", "Srimukha", "Bhava", "Yuva", "Dhatri",
    "Ishvara", "Bahudhanya", "Pramathi", "Vikrama", "Vrishaprajna", "Chitrabhanu", "Subhanu", "Tarana", "Parthiva", "Vyaya",
    "Sarvajit", "Sarvadhari", "Virodhi", "Vikriti", "Khara", "Nandana", "Vijaya", "Jaya", "Manmatha", "Durmukha",
    "Hevilambi", "Vilambi", "Vikari", "Sharvari", "Plava", "Shubhakrit", "Shobhakrit", "Krodhi", "Viswavasu", "Parabhava",
    "Plavanga", "Keelaka", "Saumya", "Sadharana", "Virodhikrit", "Paridhavi", "Pramadicha", "Ananda", "Rakshasa", "Nala",
    "Pingala", "Kalayukthi", "Siddharthi", "Raudra", "Durmathi", "Dundubhi", "Rudhirodgari", "Raktakshi", "Krodhana", "Akshaya"
]

# Ritus (6 Seasons)
RITUS = ["Vasantha", "Greeshma", "Varsha", "Sharad", "Hemantha", "Shishira"]

# Vasaras (Weekdays: Mon=0 ... Sun=6)
VASARAS = ["Indu", "Bhouma", "Soumya", "Guru", "Bhrigu", "Sthira", "Bhanu"]

class PanchangCalculator:
    # Location: Bangalore (Lat: 12.97, Lon: 77.59)
    LAT = '12.9716'
    LON = '77.5946'
    AYANAMSA = 24.14

    @staticmethod
    def _utc_to_ist(ephem_date):
        """Converts ephem date (UTC) to IST datetime object."""
        dt_utc = ephem_date.datetime()
        dt_ist = dt_utc + timedelta(hours=5, minutes=30)
        return dt_ist

    @staticmethod
    def _format_time(dt):
        """Returns time string like '06:14 AM'"""
        return dt.strftime("%I:%M %p")

    @staticmethod
    def calculate_kaalas(sunrise_dt, sunset_dt, weekday_idx):
        """Calculates Rahukala and Yamaganda."""
        duration = sunset_dt - sunrise_dt
        octant = duration / 8
        
        # 0=Mon, ... 6=Sun
        # Rahu: [1, 6, 4, 5, 3, 2, 7] (0-based indices)
        RAHU_INDICES = [1, 6, 4, 5, 3, 2, 7]
        # Yama: [4, 3, 2, 1, 0, 6, 5]
        YAMA_INDICES = [4, 3, 2, 1, 0, 6, 5]
        
        rahu_start = sunrise_dt + (octant * RAHU_INDICES[weekday_idx])
        rahu_end = rahu_start + octant
        
        yama_start = sunrise_dt + (octant * YAMA_INDICES[weekday_idx])
        yama_end = yama_start + octant
        
        return {
            "rahukala": f"{PanchangCalculator._format_time(rahu_start)} - {PanchangCalculator._format_time(rahu_end)}",
            "yamaganda": f"{PanchangCalculator._format_time(yama_start)} - {PanchangCalculator._format_time(yama_end)}"
        }
    
    @staticmethod
    def get_sidereal_lon(obj_lon_rad):
        """Calculates Sidereal Longitude using fixed Ayanamsa"""
        deg = math.degrees(obj_lon_rad)
        sidereal_deg = (deg - PanchangCalculator.AYANAMSA) % 360
        return sidereal_deg

    @staticmethod
    def calculate(target_date):
        """
        Calculates the Panchangam v3.0 (Tithi, Nakshatra, Yoga, Karana, Kaalas, Moonrise).
        """
        # Setup Observer
        obs = ephem.Observer()
        obs.lat = PanchangCalculator.LAT
        obs.lon = PanchangCalculator.LON
        obs.elevation = 920 
        
        # Input Parsing
        if isinstance(target_date, str):
            try:
                dt_input = datetime.strptime(target_date, "%Y-%m-%d")
            except ValueError:
                dt_input = datetime.strptime(target_date, "%d-%m-%Y")
        else:
            dt_input = target_date
            if not isinstance(dt_input, datetime): 
                dt_input = datetime.combine(dt_input, datetime.min.time())
            
        # ---------------------------------------------------------
        # 1. Sunrise / Sunset / Kaalas / Moonrise
        # ---------------------------------------------------------
        # Set to Midnight UTC to catch rising times
        obs.date = dt_input.strftime("%Y/%m/%d 00:00:00")
        
        sun = ephem.Sun()
        moon = ephem.Moon()
        
        # Sun Times
        sunrise_str = "-"
        sunset_str = "-"
        kaalas = {"rahukala": "-", "yamaganda": "-"}
        
        try:
            rise_utc = obs.next_rising(sun)
            set_utc = obs.next_setting(sun)
            rise_ist = PanchangCalculator._utc_to_ist(rise_utc)
            set_ist = PanchangCalculator._utc_to_ist(set_utc)
            sunrise_str = PanchangCalculator._format_time(rise_ist)
            sunset_str = PanchangCalculator._format_time(set_ist)
            
            weekday = dt_input.weekday()
            kaalas = PanchangCalculator.calculate_kaalas(rise_ist, set_ist, weekday)
        except (ephem.AlwaysUpError, ephem.AlwaysDownError):
            # Already initialized to "-"
            pass
        except Exception as e:
            print(f"Error calculating Sun info: {e}")
            # Keep defaults
            
        # Moonrise
        moonrise_str = "-"
        try:
            m_rise_utc = obs.next_rising(moon)
            m_rise_ist = PanchangCalculator._utc_to_ist(m_rise_utc)
            # Check if it rises today or tomorrow
            # If request is for Day X, moon might rise at 2 AM on Day X+1 (technically same night)
            moonrise_str = PanchangCalculator._format_time(m_rise_ist)
        except (ephem.AlwaysUpError, ephem.AlwaysDownError):
            pass
        except Exception:
            pass

        # ---------------------------------------------------------
        # 2. Main Panchang Calculation (at 6:00 AM IST)
        # ---------------------------------------------------------
        obs.date = dt_input.replace(hour=0, minute=30, second=0).strftime("%Y/%m/%d %H:%M:%S")

        sun.compute(obs)
        moon.compute(obs)

        # Solar & Lunar Longitudes
        # Use Sidereal for specific calcs if needed, but Tithi uses difference which is same
        # BUT Yoga depends on SUM, so Sidereal is CRITICAL for Yoga.
        # Nakshatra needs Sidereal.
        
        s_lon_rad = ephem.Ecliptic(sun).lon
        m_lon_rad = ephem.Ecliptic(moon).lon
        
        s_sid_lon = PanchangCalculator.get_sidereal_lon(s_lon_rad)
        m_sid_lon = PanchangCalculator.get_sidereal_lon(m_lon_rad)
        
        # --- Tithi ---
        diff = m_sid_lon - s_sid_lon
        diff = diff % 360 # Auto handles negative
        tithi_float = diff / 12.0
        tithi_index = int(tithi_float) % 30
        
        paksha = "Shukla" if tithi_index < 15 else "Krishna"
        tithi_name = TITHIS[tithi_index]

        # --- Nakshatra ---
        n_float = m_sid_lon * (27.0 / 360.0)
        nakshatra_index = int(n_float) % 27
        nakshatra_name = NAKSHATRAS[nakshatra_index]
        
        # --- Yoga ---
        # Formula: (Sun + Moon) / 13.333
        yoga_sum = (s_sid_lon + m_sid_lon) % 360
        yoga_index = int(yoga_sum / (360.0 / 27.0))
        yoga_name = YOGAS[yoga_index % 27]
        
        # --- Karana ---
        # Each Tithi has 2 Karanas.
        # k_index = int(tithi_float * 2) -> 0 to 60
        k_index = int(tithi_float * 2)
        
        karana_name = ""
        if k_index == 0:
            karana_name = "Kimstughna"
        elif k_index >= 58: # 58, 59 starts Krishna Chaturdashi
             # Wait, Tithi 29 * 2 = 58.
             if k_index == 57: karana_name = "Vishti (Bhadra)" # Last moving
             elif k_index == 58: karana_name = "Shakuni"
             elif k_index == 59: karana_name = "Chatushpada"
             elif k_index == 60: karana_name = "Naga" # Actually ends at 60
             else: karana_name = KARANAS[(k_index - 1) % 7] # Fallback for edge
        else:
             # Movable Karanas: Bava...Vishti (7)
             # Index 1 to 57
             # (1-1)%7 = 0 (Bava). Correct.
             karana_name = KARANAS[(k_index - 1) % 7]
             
        # Correction for Fixed Karanas Logic (Simplified):
        # 1st half of Shukla Pratipada: Kimstughna (Index 0)
        # ... Movable (1-57) ...
        # 2nd half of Krishna Chaturdashi: Shakuni (Index 58)
        # 1st half of Amavasya: Chatushpada (Index 59)
        # 2nd half of Amavasya: Naga (Index 60)
        # Logic above handles 0, and >= 58. Movable in between.

        # --- Masa & Adhika ---
        # Using observation date logic from previous robust version
        obs_date_start = ephem.Date(obs.date)
        prev_nm = ephem.previous_new_moon(obs_date_start)
        next_nm = ephem.next_new_moon(obs_date_start)

        sun_start = ephem.Sun(); sun_start.compute(prev_nm)
        sun_end = ephem.Sun(); sun_end.compute(next_nm)
        
        def get_rashi(obj_lon):
            return int(PanchangCalculator.get_sidereal_lon(obj_lon) / 30)

        rashi_start = get_rashi(ephem.Ecliptic(sun_start).lon)
        rashi_end = get_rashi(ephem.Ecliptic(sun_end).lon)

        if rashi_start == rashi_end:
            # ADHIKA
            is_adhika = True
            masa_index = rashi_start + 1 # Correction
        else:
            # NIJA
            is_adhika = False
            masa_index = rashi_end
            
        final_masa_index = masa_index % 12
        masa_name = MASAS[final_masa_index]

        # --- Vedic Attributes Calculation ---
        
        # 1. Samvatsara (Chandramana - South Indian System)
        # Saka Era = Gregorian Year - 78
        # Logic: If Jan/Feb/Mar AND we are in the ending lunar months (Pushya-Phalguna),
        # then we are still in the PREVIOUS Saka year.
        greg_year = dt_input.year
        saka_year = greg_year - 78
        if dt_input.month < 4 and final_masa_index >= 9:
            saka_year -= 1
            
        samvatsara_index = (saka_year + 11) % 60
        samvatsara_name = SAMVATSARAS[samvatsara_index]

        # 2. Ritu (Season)
        # 0,1=Vasantha, 2,3=Greeshma, ...
        ritu_index = int(final_masa_index / 2)
        ritu_name = RITUS[ritu_index % 6]

        # 3. Ayana (Solstice)
        # Based on Nirayana Sun Longitude (Sidereal)
        # Uttarayana: Makara (270) to Karka (90)
        # Dakshinayana: Karka (90) to Makara (270)
        # Note: s_sid_lon is in degrees (0-360)
        if 90 <= s_sid_lon < 270:
            ayana_name = "Dakshinayana"
        else:
            ayana_name = "Uttarayana"

        # 4. Vasara (Weekday)
        # dt_input.weekday(): 0=Mon, 6=Sun
        vasara_name = VASARAS[dt_input.weekday()]

        # Basic Festival Logic
        is_festival = False
        festival_name = None
        if "Purnima" in tithi_name:
            is_festival = True
            festival_name = "Purnima"
        elif "Amavasya" in tithi_name:
             is_festival = True
             festival_name = "Amavasya"
        elif "Ekadashi" in tithi_name:
             is_festival = True
             festival_name = "Ekadashi"
        
        return {
            "date": dt_input.strftime("%Y-%m-%d"),
            "sun_cycle": {
                "sunrise": sunrise_str,
                "sunset": sunset_str,
                "moonrise": moonrise_str
            },
            "attributes": {
                "samvatsara": samvatsara_name,
                "ayana": ayana_name,
                "ritu": ritu_name,
                "maasa": masa_name,
                "paksha": paksha,
                "tithi": tithi_name,
                "nakshatra": nakshatra_name,
                "yoga": yoga_name,
                "karana": karana_name,
                "vasara_sanskrit": vasara_name,
                "is_adhika": is_adhika
            },
            "inauspicious": {
                "rahu": kaalas["rahukala"],
                "yama": kaalas["yamaganda"]
            },
            "is_festival": festival_name if is_festival else None,
            "description": f"Shubhe Shobhane Muhurthe {samvatsara_name} Nama Samvatsare {ayana_name} {ritu_name} Ritau {masa_name} Mase {paksha} Pakshe {tithi_name} Tithau"
        }

if __name__ == "__main__":
    # Test
    print(PanchangCalculator.calculate("2026-01-31"))
