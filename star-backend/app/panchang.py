"""
S.T.A.R. Panchangam Engine v4.0
================================
Professional-Grade Vedic Almanac Calculator.

Features:
 - Dynamic Location (from SystemSettings or override)
 - Configurable Ayanamsa (Lahiri / Raman / KP)
 - Gulika Kala & Durmuhurtham 
 - Sankranti (Solar Rashi Transition) Detection
 - Full Pancha-Anga: Tithi, Nakshatra, Yoga, Karana
 - Moonrise, Sunrise, Sunset, Rahu/Yama Kala
 - Sankalpa Mantra generation
"""

import ephem
import math
from datetime import datetime, timedelta

from app.festivals import detect_festivals, get_glossary_entry, VEDIC_GLOSSARY

# ═══════════════════════════════════════════════════════════════════════
# CONSTANTS — Vedic Calendar Reference Data
# ═══════════════════════════════════════════════════════════════════════

# Lunar Month Names (0 = Chaitra ... 11 = Phalguna)
MASAS = {
    "en": ["Chaitra", "Vaishakha", "Jyeshtha", "Ashadha",
           "Shravana", "Bhadrapada", "Ashwayuja", "Kartika",
           "Margashira", "Pushya", "Magha", "Phalguna"],
    "kn": ["ಚೈತ್ರ", "ವೈಶಾಖ", "ಜ್ಯೇಷ್ಠ", "ಆಷಾಢ",
           "ಶ್ರಾವಣ", "ಭಾದ್ರಪದ", "ಆಶ್ವಯುಜ", "ಕಾರ್ತೀಕ",
           "ಮಾರ್ಗಶಿರ", "ಪುಷ್ಯ", "ಮಾಘ", "ಫಾಲ್ಗುಣ"]
}

# 27 Nakshatras
NAKSHATRAS = {
    "en": [
        "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
        "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
        "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
        "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
        "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
    ],
    "kn": [
        "ಅಶ್ವಿನಿ", "ಭರಣಿ", "ಕೃತ್ತಿಕಾ", "ರೋಹಿಣಿ", "ಮೃಗಶಿರಾ", "ಆರ್ದ್ರಾ",
        "ಪುನರ್ವಸು", "ಪುಷ್ಯ", "ಆಶ್ಲೇಷಾ", "ಮಘಾ", "ಪೂರ್ವ ಫಲ್ಗುಣಿ", "ಉತ್ತರ ಫಲ್ಗುಣಿ",
        "ಹಸ್ತ", "ಚಿತ್ರಾ", "ಸ್ವಾತಿ", "ವಿಶಾಖ", "ಅನುರಾಧ", "ಜ್ಯೇಷ್ಠಾ",
        "ಮೂಲ", "ಪೂರ್ವಾಷಾಢ", "ಉತ್ತರಾಷಾಢ", "ಶ್ರವಣ", "ಧನಿಷ್ಠ",
        "ಶತಭಿಷ", "ಪೂರ್ವ ಭಾದ್ರಪದ", "ಉತ್ತರ ಭಾದ್ರಪದ", "ರೇವತಿ"
    ]
}

# 30 Tithis (0-14 Shukla, 15-29 Krishna)
TITHIS = {
    "en": [
        "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi",
        "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
        "Trayodashi", "Chaturdashi", "Purnima",
        "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi",
        "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
        "Trayodashi", "Chaturdashi", "Amavasya"
    ],
    "kn": [
        "ಪಾಡ್ಯ", "ಬಿದಿಗೆ", "ತದಿಗೆ", "ಚತುರ್ಥಿ", "ಪಂಚಮಿ", "ಷಷ್ಠಿ",
        "ಸಪ್ತಮಿ", "ಅಷ್ಟಮಿ", "ನವಮಿ", "ದಶಮಿ", "ಏಕಾದಶಿ", "ದ್ವಾದಶಿ",
        "ತ್ರಯೋದಶಿ", "ಚತುರ್ದಶಿ", "ಹುಣ್ಣಿಮೆ",
        "ಪಾಡ್ಯ", "ಬಿದಿಗೆ", "ತದಿಗೆ", "ಚತುರ್ಥಿ", "ಪಂಚಮಿ", "ಷಷ್ಠಿ",
        "ಸಪ್ತಮಿ", "ಅಷ್ಟಮಿ", "ನವಮಿ", "ದಶಮಿ", "ಏಕಾದಶಿ", "ದ್ವಾದಶಿ",
        "ತ್ರಯೋದಶಿ", "ಚತುರ್ದಶಿ", "ಅಮಾವಾಸ್ಯೆ"
    ]
}

# 27 Yogas
YOGAS = {
    "en": [
        "Vishkumbha", "Preeti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda",
        "Sukarma", "Dhriti", "Shula", "Ganda", "Vriddhi", "Dhruva",
        "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyan",
        "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla",
        "Brahma", "Indra", "Vaidhriti"
    ],
    "kn": [
        "ವಿಷ್ಕಂಭ", "ಪ್ರೀತಿ", "ಆಯುಷ್ಮಾನ್", "ಸೌಭಾಗ್ಯ", "ಶೋಭನ", "ಅತಿಗಂಡ",
        "ಸುಕರ್ಮ", "ಧೃತಿ", "ಶೂಲ", "ಗಂಡ", "ವೃದ್ಧಿ", "ಧ್ರುವ",
        "ವ್ಯಾಘಾತ", "ಹರ್ಷಣ", "ವಜ್ರ", "ಸಿದ್ಧಿ", "ವ್ಯತೀಪಾತ", "ವರೀಯಾನ್",
        "ಪರಿಘ", "ಶಿವ", "ಸಿದ್ಧ", "ಸಾಧ್ಯ", "ಶುಭ", "ಶುಕ್ಲ",
        "ಬ್ರಹ್ಮ", "ಐಂದ್ರ", "ವೈಧೃತಿ"
    ]
}

# 11 Karanas (7 movable + 4 fixed)
# 11 Karanas (7 movable + 4 fixed)
KARANAS = {
    "en": ["Bava", "Balava", "Kaulava", "Taitila", "Garija", "Vanija", "Vishti (Bhadra)",
           "Shakuni", "Chatushpada", "Naga", "Kimstughna"],
    "kn": ["ಬವ", "ಬಾಲವ", "ಕೌಲವ", "ತೈತಿಲ", "ಗರಜ", "ವಣಿಜ", "ವಿಷ್ಟಿ (ಭದ್ರಾ)",
           "ಶಕುನಿ", "ಚತುಷ್ಪಾದ", "ನಾಗ", "ಕಿಂಸ್ತುಘ್ನ"]
}

# 60-Year Jupiter Cycle (Samvatsaras)
# 60-Year Jupiter Cycle (Samvatsaras)
SAMVATSARAS = {
    "en": [
        "Prabhava", "Vibhava", "Shukla", "Pramoda", "Prajotpatti", "Angirasa", "Srimukha", "Bhava", "Yuva", "Dhatri",
        "Ishvara", "Bahudhanya", "Pramathi", "Vikrama", "Vrishaprajna", "Chitrabhanu", "Subhanu", "Tarana", "Parthiva", "Vyaya",
        "Sarvajit", "Sarvadhari", "Virodhi", "Vikriti", "Khara", "Nandana", "Vijaya", "Jaya", "Manmatha", "Durmukha",
        "Hevilambi", "Vilambi", "Vikari", "Sharvari", "Plava", "Shubhakrit", "Shobhakrit", "Krodhi", "Viswavasu", "Parabhava",
        "Plavanga", "Keelaka", "Saumya", "Sadharana", "Virodhikrit", "Paridhavi", "Pramadicha", "Ananda", "Rakshasa", "Nala",
        "Pingala", "Kalayukthi", "Siddharthi", "Raudra", "Durmathi", "Dundubhi", "Rudhirodgari", "Raktakshi", "Krodhana", "Akshaya"
    ],
    "kn": [
        "ಪ್ರಭವ", "ವಿಭವ", "ಶುಕ್ಲ", "ಪ್ರಮೋದ", "ಪ್ರಜೋತ್ಪತ್ತಿ", "ಅಂಗಿರಸ", "ಶ್ರೀಮುಖ", "ಬಾವ", "ಯುವ", "ಧಾತ್ರಿ",
        "ಈಶ್ವರ", "ಬಹುಧಾನ್ಯ", "ಪ್ರಮಾಥಿ", "ವಿಕ್ರಮ", "ವೃಷಪ್ರಜ", "ಚಿತ್ರಭಾನು", "ಸುಭಾನು", "ತಾರಣ", "ಪಾರ್ಥಿವ", "ವ್ಯಯ",
        "ಸರ್ವಜಿತ್", "ಸರ್ವಧಾರಿ", "ವಿರೋಧಿ", "ವಿಕೃತಿ", "ಖರ", "ನಂದನ", "ವಿಜಯ", "ಜಯ", "ಮನ್ಮಥ", "ದುರ್ಮುಖ",
        "ಹೇವಿಳಂಬಿ", "ವಿಳಂಬಿ", "ವಿಕಾರಿ", "ಶಾರ್ವರಿ", "ಪ್ಲವ", "ಶುಭಕೃತ್", "ಶೋಭಕೃತ್", "ಕ್ರೋಧಿ", "ವಿಶ್ವಾವಸು", "ಪರಾಭವ",
        "ಪ್ಲವಂಗ", "ಕೀಲಕ", "ಸೌಮ್ಯ", "ಸಾಧಾರಣ", "ವಿರೋಧಕೃತ್", "ಪರಿದಾವಿ", "ಪ್ರಮಾದೀಚ", "ಆನಂದ", "ರಾಕ್ಷಸ", "ನಳ",
        "ಪಿಂಗಳ", "ಕಾಳಯುಕ್ತಿ", "ಸಿದ್ಧಾರ್ಥಿ", "ರೌದ್ರ", "ದುರ್ಮತಿ", "ದುಂದುಭಿ", "ರುಧಿರೋದ್ಗಾರಿ", "ರಕ್ತಾಕ್ಷಿ", "ಕ್ರೋಧನ", "ಅಕ್ಷಯ"
    ]
}

# 6 Ritus (Seasons)
RITUS = {
    "en": ["Vasantha", "Greeshma", "Varsha", "Sharad", "Hemantha", "Shishira"],
    "kn": ["ವಸಂತ", "ಗ್ರೀಷ್ಮ", "ವರ್ಷ", "ಶರದ್", "ಹೇಮಂತ", "ಶಿಶಿರ"]
}

# Vasaras (Mon=0 ... Sun=6)
VASARAS = {
    "en": ["Indu (Monday)", "Bhouma (Tuesday)", "Soumya (Wednesday)", "Guru (Thursday)",
           "Bhrigu (Friday)", "Sthira (Saturday)", "Bhanu (Sunday)"],
    "kn": ["ಸೋಮ", "ಮಂಗಳ", "ಬುಧ", "ಗುರು", "ಶುಕ್ರ", "ಶನಿ", "ಭಾನು"]
}

# 12 Rashis (for Sankranti detection)
# 12 Rashis (Zodiac)
RASHIS = {
    "en": ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
           "Tula", "Vrischika", "Dhanu", "Makara", "Kumbha", "Meena"],
    "kn": ["ಮೇಷ", "ವೃಷಭ", "ಮಿಥುನ", "ಕರ್ಕಾಟಕ", "ಸಿಂಹ", "ಕನ್ಯಾ",
           "ತುಲಾ", "ವೃಶ್ಚಿಕ", "ಧನು", "ಮಕರ", "ಕುಂಭ", "ಮೀನ"]
}

# Ayanamsa Values (degrees, approximate for modern dates)
AYANAMSA_TABLE = {
    "lahiri": 24.14,       # Chitrapaksha — most widely used in India
    "raman": 22.46,        # B.V. Raman system
    "kp": 23.97,           # Krishnamurti Paddhati
}


# ═══════════════════════════════════════════════════════════════════════
# CORE ENGINE
# ═══════════════════════════════════════════════════════════════════════

class PanchangCalculator:
    """
    Vedic Panchangam Calculator v4.0.
    
    Accepts dynamic location and ayanamsa configuration.
    Default: Kukke Subramanya Temple (12.6745°N, 75.3370°E).
    """

    # Default Location — Kukke Subramanya
    DEFAULT_LAT = '12.6745'
    DEFAULT_LON = '75.3370'
    DEFAULT_ELEVATION = 120
    DEFAULT_AYANAMSA = 'lahiri'

    # Cache invalidation version — bump when you change calculation logic
    CALC_VERSION = 2

    def __init__(self, lat=None, lon=None, elevation=None, ayanamsa=None):
        """
        Initialize with optional overrides. Falls back to defaults.
        In production, pass values from SystemSettings.
        """
        self.lat = str(lat) if lat else self.DEFAULT_LAT
        self.lon = str(lon) if lon else self.DEFAULT_LON
        self.elevation = int(elevation) if elevation else self.DEFAULT_ELEVATION
        self.ayanamsa_mode = (ayanamsa or self.DEFAULT_AYANAMSA).lower()
        self.ayanamsa_value = AYANAMSA_TABLE.get(self.ayanamsa_mode, AYANAMSA_TABLE["lahiri"])

    # ── Utility Methods ──────────────────────────────────────────────

    @staticmethod
    def _utc_to_ist(ephem_date):
        """Converts ephem date (UTC) to IST datetime object."""
        dt_utc = ephem_date.datetime()
        return dt_utc + timedelta(hours=5, minutes=30)

    @staticmethod
    def _format_time(dt):
        """Returns time string like '06:14 AM'."""
        return dt.strftime("%I:%M %p")

    def get_sidereal_lon(self, obj_lon_rad):
        """Calculates Sidereal Longitude using configured Ayanamsa."""
        deg = math.degrees(obj_lon_rad)
        return (deg - self.ayanamsa_value) % 360

    def _make_observer(self, target_date, hour=0, minute=0, second=0):
        """Creates an ephem.Observer for the configured location at a specific time."""
        obs = ephem.Observer()
        obs.lat = self.lat
        obs.lon = self.lon
        obs.elevation = self.elevation
        obs.date = target_date.replace(hour=hour, minute=minute, second=second).strftime("%Y/%m/%d %H:%M:%S")
        return obs

    # ── Kaalas (Inauspicious Time Periods) ───────────────────────────

    @staticmethod
    def calculate_kaalas(sunrise_dt, sunset_dt, weekday_idx):
        """
        Calculates Rahukala, Yamaganda, and Gulika Kala.
        Divides day-duration into 8 octants and picks the correct one per weekday.
        """
        duration = sunset_dt - sunrise_dt
        octant = duration / 8

        # Indices for each weekday (Mon=0 ... Sun=6)
        RAHU_INDICES   = [1, 6, 4, 5, 3, 2, 7]
        YAMA_INDICES   = [4, 3, 2, 1, 0, 6, 5]
        GULIKA_INDICES = [6, 5, 4, 3, 2, 1, 0]

        def _get_range(indices):
            start = sunrise_dt + (octant * indices[weekday_idx])
            end = start + octant
            return f"{PanchangCalculator._format_time(start)} - {PanchangCalculator._format_time(end)}"

        return {
            "rahukala":  _get_range(RAHU_INDICES),
            "yamaganda": _get_range(YAMA_INDICES),
            "gulika":    _get_range(GULIKA_INDICES),
        }

    # ── Durmuhurtham ─────────────────────────────────────────────────

    @staticmethod
    def calculate_durmuhurtham(sunrise_dt, sunset_dt, weekday_idx):
        """
        Calculates Durmuhurtham — 48-minute inauspicious windows.
        Day is divided into 15 muhurtas (each ~48 min). Specific muhurtas
        are considered inauspicious based on the weekday.
        """
        day_duration = sunset_dt - sunrise_dt
        muhurta = day_duration / 15  # Each muhurta ≈ 48 minutes

        # Which muhurta indices are Durmuhurtham for each weekday
        # (Mon=0 ... Sun=6). Source: Standard Panchangam references.
        DURMUHURTHAM_MAP = {
            0: [2, 7],     # Monday
            1: [4, 11],    # Tuesday
            2: [6, 10],    # Wednesday
            3: [5, 9],     # Thursday
            4: [3, 8],     # Friday
            5: [1, 14],    # Saturday
            6: [12, 13],   # Sunday
        }

        periods = []
        for idx in DURMUHURTHAM_MAP.get(weekday_idx, []):
            start = sunrise_dt + (muhurta * idx)
            end = start + muhurta
            periods.append(f"{PanchangCalculator._format_time(start)} - {PanchangCalculator._format_time(end)}")

        return periods

    # ── Abhijit Muhurtha (Auspicious Midday Window) ────────────────────

    @staticmethod
    def calculate_abhijit_muhurtha(sunrise_dt, sunset_dt):
        """
        Abhijit Muhurtha — the 8th muhurta of the day (around solar noon).
        Considered universally auspicious (except on Wednesdays per some traditions).
        Duration: ~48 minutes centered around midday.
        """
        day_duration = sunset_dt - sunrise_dt
        muhurta = day_duration / 15
        # 8th muhurta (0-indexed = 7)
        start = sunrise_dt + (muhurta * 7)
        end = start + muhurta
        return f"{PanchangCalculator._format_time(start)} - {PanchangCalculator._format_time(end)}"

    # ── Amrit Kalam (Nectar Time) ─────────────────────────────────────

    @staticmethod
    def calculate_amrit_kalam(sunrise_dt, sunset_dt, weekday_idx):
        """
        Amrit Kalam — an auspicious period based on the weekday.
        Each weekday has a specific muhurta index that is the "nectar time".
        Source: Traditional Panchangam references.
        """
        day_duration = sunset_dt - sunrise_dt
        muhurta = day_duration / 15

        # Amrit Kalam muhurta indices per weekday (Mon=0..Sun=6)
        AMRIT_INDICES = {
            0: 2,   # Monday — 3rd muhurta
            1: 5,   # Tuesday — 6th muhurta
            2: 1,   # Wednesday — 2nd muhurta
            3: 10,  # Thursday — 11th muhurta
            4: 4,   # Friday — 5th muhurta
            5: 3,   # Saturday — 4th muhurta
            6: 6,   # Sunday — 7th muhurta
        }

        idx = AMRIT_INDICES.get(weekday_idx, 0)
        start = sunrise_dt + (muhurta * idx)
        end = start + muhurta
        return f"{PanchangCalculator._format_time(start)} - {PanchangCalculator._format_time(end)}"

    # ── Sankranti Detection ──────────────────────────────────────────

    def detect_sankranti(self, target_date, lang="en"):
        """
        Detects if the Sun transitions from one Rashi to another on this date.
        Returns the Sankranti name (e.g., 'Makara Sankranti') or None.
        """
        obs = self._make_observer(target_date, hour=0, minute=0, second=0)
        sun_today = ephem.Sun()
        sun_today.compute(obs)
        rashi_today = int(self.get_sidereal_lon(ephem.Ecliptic(sun_today).lon) / 30)

        # Check yesterday
        yesterday = target_date - timedelta(days=1)
        obs_y = self._make_observer(yesterday, hour=0, minute=0, second=0)
        sun_y = ephem.Sun()
        sun_y.compute(obs_y)
        rashi_yesterday = int(self.get_sidereal_lon(ephem.Ecliptic(sun_y).lon) / 30)

        if rashi_today != rashi_yesterday:
            s_suffix = "ಸಂಕ್ರಾಂತಿ" if lang == "kn" else "Sankranti"
            return f"{RASHIS[lang][rashi_today]} {s_suffix}"
        return None

    # ═══════════════════════════════════════════════════════════════════
    # MAIN CALCULATION
    # ═══════════════════════════════════════════════════════════════════

    def calculate(self, target_date, lang="en"):
        """
        Calculates the full Panchangam for a given date.

        Args:
            target_date: str (YYYY-MM-DD or DD-MM-YYYY) or datetime/date object.
            lang: "en" (English) or "kn" (Kannada). Defaults to "en".

        Returns:
            dict with all Panchangam data.
        """
        lang = lang.lower()  # Normalize: frontend sends 'EN'/'KN', dict keys are 'en'/'kn'
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

        # ─────────────────────────────────────────────────────────────
        # 1. Sunrise / Sunset / Moonrise / Kaalas
        # ─────────────────────────────────────────────────────────────
        obs = self._make_observer(dt_input, hour=0, minute=0, second=0)
        sun = ephem.Sun()
        moon = ephem.Moon()

        sunrise_str, sunset_str = "-", "-"
        moonrise_str = "-"
        kaalas = {"rahukala": "-", "yamaganda": "-", "gulika": "-"}
        durmuhurtham_list = []
        rise_ist, set_ist = None, None

        try:
            rise_utc = obs.next_rising(sun)
            set_utc = obs.next_setting(sun)
            rise_ist = self._utc_to_ist(rise_utc)
            set_ist = self._utc_to_ist(set_utc)
            sunrise_str = self._format_time(rise_ist)
            sunset_str = self._format_time(set_ist)

            weekday = dt_input.weekday()
            kaalas = self.calculate_kaalas(rise_ist, set_ist, weekday)
            durmuhurtham_list = self.calculate_durmuhurtham(rise_ist, set_ist, weekday)
        except (ephem.AlwaysUpError, ephem.AlwaysDownError):
            pass
        except Exception as e:
            print(f"Error calculating Sun info: {e}")

        # Moonrise & Moonset
        moonset_str = "-"
        try:
            m_rise_utc = obs.next_rising(moon)
            moonrise_str = self._format_time(self._utc_to_ist(m_rise_utc))
        except (ephem.AlwaysUpError, ephem.AlwaysDownError):
            pass
        except Exception:
            pass
        try:
            m_set_utc = obs.next_setting(moon)
            moonset_str = self._format_time(self._utc_to_ist(m_set_utc))
        except (ephem.AlwaysUpError, ephem.AlwaysDownError):
            pass
        except Exception:
            pass

        # ─────────────────────────────────────────────────────────────
        # 2. Panchang Calculation (at 6:00 AM IST = 00:30 UTC)
        # ─────────────────────────────────────────────────────────────
        obs_calc = self._make_observer(dt_input, hour=0, minute=30, second=0)
        sun.compute(obs_calc)
        moon.compute(obs_calc)

        s_lon_rad = ephem.Ecliptic(sun).lon
        m_lon_rad = ephem.Ecliptic(moon).lon

        s_sid_lon = self.get_sidereal_lon(s_lon_rad)
        m_sid_lon = self.get_sidereal_lon(m_lon_rad)

        # ── Tithi ──
        diff = (m_sid_lon - s_sid_lon) % 360
        tithi_float = diff / 12.0
        tithi_index = int(tithi_float) % 30
        paksha = "Shukla" if tithi_index < 15 else "Krishna"
        tithi_name = TITHIS[lang][tithi_index]
        paksha_kn = "ಶುಕ್ಲ" if tithi_index < 15 else "ಕೃಷ್ಣ"

        # ── Nakshatra ──
        n_float = m_sid_lon * (27.0 / 360.0)
        nakshatra_index = int(n_float) % 27
        nakshatra_name = NAKSHATRAS[lang][nakshatra_index]

        # ── Yoga ──
        yoga_sum = (s_sid_lon + m_sid_lon) % 360
        yoga_index = int(yoga_sum / (360.0 / 27.0)) % 27
        yoga_name = YOGAS[lang][yoga_index]

        # ── Karana ──
        k_index = int(tithi_float * 2)
        if k_index == 0:
            karana_name = KARANAS[lang][10] # Kimstughna
        elif k_index >= 58:
            if k_index == 58: karana_name = KARANAS[lang][7] # Shakuni
            elif k_index == 59: karana_name = KARANAS[lang][8] # Chatushpada
            elif k_index == 60: karana_name = KARANAS[lang][9] # Naga
            else: karana_name = KARANAS[lang][(k_index - 1) % 7]
        else:
            karana_name = KARANAS[lang][(k_index - 1) % 7]

        # ── Masa & Adhika ──
        obs_date_start = ephem.Date(obs_calc.date)
        prev_nm = ephem.previous_new_moon(obs_date_start)
        next_nm = ephem.next_new_moon(obs_date_start)

        sun_start = ephem.Sun(); sun_start.compute(prev_nm)
        sun_end = ephem.Sun(); sun_end.compute(next_nm)

        def get_rashi(obj_lon):
            return int(self.get_sidereal_lon(obj_lon) / 30)

        rashi_start = get_rashi(ephem.Ecliptic(sun_start).lon)
        rashi_end = get_rashi(ephem.Ecliptic(sun_end).lon)

        if rashi_start == rashi_end:
            is_adhika = True
            masa_index = rashi_start + 1
        else:
            is_adhika = False
            masa_index = rashi_end

        final_masa_index = masa_index % 12
        masa_name = MASAS[lang][final_masa_index]

        # ── Vedic Attributes ──

        # Samvatsara
        greg_year = dt_input.year
        saka_year = greg_year - 78
        if dt_input.month < 4 and final_masa_index >= 9:
            saka_year -= 1
        samvatsara_index = (saka_year + 11) % 60
        samvatsara_name = SAMVATSARAS[lang][samvatsara_index]

        # Ritu
        ritu_index = int(final_masa_index / 2) % 6
        ritu_name = RITUS[lang][ritu_index]

        # Ayana
        if 90 <= s_sid_lon < 270:
            ayana_name = "Dakshinayana" if lang == "en" else "ದಕ್ಷಿಣಾಯನ"
        else:
            ayana_name = "Uttarayana" if lang == "en" else "ಉತ್ತರಾಯಣ"

        # Vasara
        vasara_name = VASARAS[lang][dt_input.weekday()]

        # Sun Rashi (for frontend display)
        sun_rashi_index = int(s_sid_lon / 30)
        sun_rashi = RASHIS[lang][sun_rashi_index % 12]

        # Moon Rashi (for frontend display)
        moon_rashi_index = int(m_sid_lon / 30)
        moon_rashi = RASHIS[lang][moon_rashi_index % 12]

        # ── Sankranti ──
        sankranti = self.detect_sankranti(dt_input, lang)

        # ── Moon Cycle (Phase, Illumination, Next Purnima/Amavasya) ──
        obs_moon = self._make_observer(dt_input, hour=12, minute=0, second=0)  # Noon UTC
        moon_phase = ephem.Moon()
        moon_phase.compute(obs_moon)
        moon_illumination = round(moon_phase.phase, 1)  # 0-100%

        # Next Full Moon & New Moon
        ephem_date = ephem.Date(dt_input.strftime("%Y/%m/%d 12:00:00"))
        next_full = ephem.next_full_moon(ephem_date)
        next_new = ephem.next_new_moon(ephem_date)
        prev_full = ephem.previous_full_moon(ephem_date)
        prev_new = ephem.previous_new_moon(ephem_date)

        next_full_dt = ephem.Date(next_full).datetime()
        next_new_dt = ephem.Date(next_new).datetime()

        days_to_purnima = (next_full_dt.date() - dt_input.date()).days
        days_to_amavasya = (next_new_dt.date() - dt_input.date()).days

        # Determine Moon Phase Name
        if days_to_purnima == 0:
            moon_phase_name = "Hunnime (ಹುಣ್ಣಿಮೆ)"  # Full Moon
            moon_phase_en = "Full Moon"
        elif days_to_amavasya == 0:
            moon_phase_name = "Amavasye (ಅಮಾವಾಸ್ಯೆ)"  # New Moon
            moon_phase_en = "New Moon"
        elif paksha == "Shukla":
            if tithi_index <= 3:
                moon_phase_name = "Waxing Crescent"
                moon_phase_en = "Waxing Crescent"
            elif tithi_index <= 7:
                moon_phase_name = "First Quarter"
                moon_phase_en = "First Quarter"
            elif tithi_index <= 11:
                moon_phase_name = "Waxing Gibbous"
                moon_phase_en = "Waxing Gibbous"
            else:
                moon_phase_name = "Nearly Full"
                moon_phase_en = "Nearly Full"
        else:  # Krishna
            local_idx = tithi_index - 15
            if local_idx <= 3:
                moon_phase_name = "Waning Gibbous"
                moon_phase_en = "Waning Gibbous"
            elif local_idx <= 7:
                moon_phase_name = "Last Quarter"
                moon_phase_en = "Last Quarter"
            elif local_idx <= 11:
                moon_phase_name = "Waning Crescent"
                moon_phase_en = "Waning Crescent"
            else:
                moon_phase_name = "Nearly New"
                moon_phase_en = "Nearly New"

        moon_cycle = {
            "phase": moon_phase_name,
            "phase_en": moon_phase_en,
            "illumination": moon_illumination,
            "next_purnima": next_full_dt.strftime("%Y-%m-%d"),
            "next_amavasya": next_new_dt.strftime("%Y-%m-%d"),
            "days_to_purnima": days_to_purnima,
            "days_to_amavasya": days_to_amavasya,
        }

        # ── Festival Detection (v2.0 — Rule Engine) ──
        # Convert 30-tithi index to 15-tithi within paksha for festival matching
        tithi_in_paksha = tithi_index if tithi_index < 15 else tithi_index - 15
        festivals = detect_festivals(
            masa_index=final_masa_index,
            paksha=paksha,
            tithi_index=tithi_in_paksha,
            nakshatra_index=nakshatra_index,
            weekday=dt_input.weekday(),
            sankranti=sankranti,
        )

        # ── Auspicious Times (Green Zone) ──
        abhijit_muhurtha = None
        amrit_kalam = None
        if rise_ist and set_ist:
            abhijit_muhurtha = self.calculate_abhijit_muhurtha(rise_ist, set_ist)
            amrit_kalam = self.calculate_amrit_kalam(rise_ist, set_ist, dt_input.weekday())

        # ── Glossary Entries for Tooltips ──
        glossary = {}
        # Tithi
        tithi_en_name = TITHIS["en"][tithi_index]
        entry = get_glossary_entry(tithi_en_name)
        if entry:
            glossary["tithi"] = entry
        # Yoga
        yoga_en_name = YOGAS["en"][yoga_index]
        entry = get_glossary_entry(yoga_en_name)
        if entry:
            glossary["yoga"] = entry
        # Karana
        entry = get_glossary_entry(karana_name)
        if entry:
            glossary["karana"] = entry

        # ── Sankalpa Mantra ──
        tithi_en = TITHIS["en"][tithi_index]
        masa_en = MASAS["en"][final_masa_index]
        nakshatra_en = NAKSHATRAS["en"][nakshatra_index]
        paksha_en = paksha
        samvatsara_en = SAMVATSARAS["en"][samvatsara_index]
        
        description = (
            f"Shubhe Shobhane Muhurthe {samvatsara_en} Nama Samvatsare "
            f"{ayana_name if lang == 'en' else 'Uttarayana/Dakshinayana'} {RITUS['en'][ritu_index]} Ritau "
            f"{masa_en} Mase {paksha_en} Pakshe {tithi_en} Tithau"
        )

        # ═══════════════════════════════════════════════════════════════
        # RESPONSE
        # ═══════════════════════════════════════════════════════════════
        return {
            "date": dt_input.strftime("%Y-%m-%d"),
            "sun_cycle": {
                "sunrise": sunrise_str,
                "sunset": sunset_str,
                "moonrise": moonrise_str,
                "moonset": moonset_str
            },
            "moon_cycle": moon_cycle,
            "attributes": {
                "samvatsara": samvatsara_name,
                "ayana": ayana_name,
                "ritu": ritu_name,
                "maasa": masa_name,
                "paksha": paksha if lang == "en" else paksha_kn,
                "tithi": tithi_name,
                "nakshatra": nakshatra_name,
                "yoga": yoga_name,
                "karana": karana_name,
                "vasara_sanskrit": vasara_name,
                "is_adhika": is_adhika,
                "sun_rashi": sun_rashi,
                "moon_rashi": moon_rashi,
            },
            "inauspicious": {
                "rahu": kaalas["rahukala"],
                "yama": kaalas["yamaganda"],
                "gulika": kaalas["gulika"],
                "durmuhurtham": durmuhurtham_list,
            },
            "auspicious": {
                "abhijit_muhurtha": abhijit_muhurtha,
                "amrit_kalam": amrit_kalam,
            },
            "sankranti": sankranti,
            "festivals": festivals,
            "glossary": glossary,
            "description": description,
            "meta": {
                "ayanamsa_mode": self.ayanamsa_mode,
                "ayanamsa_value": self.ayanamsa_value,
                "location": {"lat": self.lat, "lon": self.lon, "elevation": self.elevation},
                "calc_version": self.CALC_VERSION,
            }
        }


# ═══════════════════════════════════════════════════════════════════════
# CLI TEST
# ═══════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    import json
    pc = PanchangCalculator()  # Uses default Kukke Subramanya location
    result = pc.calculate("2026-02-19")
    print(json.dumps(result, indent=2, ensure_ascii=False))
