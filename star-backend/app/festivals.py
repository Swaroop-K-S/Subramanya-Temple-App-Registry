"""
S.T.A.R. Festival Detection Engine
====================================
Rule-based festival detection using Vedic calendar attributes.

Each rule maps a combination of (masa, paksha, tithi, nakshatra, weekday)
to a festival. Rules are checked in order; multiple can match.

Usage:
    from app.festivals import detect_festivals
    festivals = detect_festivals(masa_idx, paksha, tithi_idx, nakshatra_idx, weekday, sankranti)
"""

# ═══════════════════════════════════════════════════════════════════════
# FESTIVAL RULES
# ═══════════════════════════════════════════════════════════════════════
# Each rule is a dict with:
#   - "name_en": English name
#   - "name_kn": Kannada name
#   - "significance": Short description (for tooltips)
#   - "type": "tithi" | "nakshatra" | "solar" | "special"
#   - Match conditions (all specified conditions must match):
#       - "masa": masa index (0=Chaitra..11=Phalguna), or None for any
#       - "paksha": "Shukla" | "Krishna" | None for any
#       - "tithi": tithi index within paksha (0=Pratipada..14=Purnima/Amavasya), or None
#       - "tithi_name": tithi name string match (alternative to index)
#       - "nakshatra": nakshatra index (0..26), or None
#       - "weekday": weekday index (0=Mon..6=Sun), or None

FESTIVAL_RULES = [
    # ─── RECURRING (Every Month) ───────────────────────────────────────

    # Ekadashi (11th Tithi in both Pakshas) — Fasting day for Vishnu devotees
    {
        "name_en": "Ekadashi",
        "name_kn": "ಏಕಾದಶಿ",
        "significance": "Sacred fasting day for Lord Vishnu. Observed on the 11th Tithi of each Paksha.",
        "type": "tithi",
        "paksha": None,   # Both Shukla & Krishna
        "tithi": 10,      # 0-indexed: Ekadashi = index 10
    },

    # Pradosha (13th Tithi) — Shiva worship
    {
        "name_en": "Pradosha",
        "name_kn": "ಪ್ರದೋಷ",
        "significance": "Auspicious evening for Lord Shiva worship. Observed on Trayodashi.",
        "type": "tithi",
        "paksha": None,
        "tithi": 12,      # Trayodashi = index 12
    },

    # Purnima (Full Moon)
    {
        "name_en": "Purnima",
        "name_kn": "ಹುಣ್ಣಿಮೆ",
        "significance": "Full Moon day. Auspicious for all rituals and donations.",
        "type": "tithi",
        "paksha": "Shukla",
        "tithi": 14,      # Purnima = index 14
    },

    # Amavasya (New Moon)
    {
        "name_en": "Amavasya",
        "name_kn": "ಅಮಾವಾಸ್ಯೆ",
        "significance": "New Moon day. Sacred for Pitru Tarpana (ancestral rites).",
        "type": "tithi",
        "paksha": "Krishna",
        "tithi": 14,      # Amavasya = index 14 in Krishna
    },

    # Sankashti Chaturthi (Krishna Chaturthi) — Ganesha worship
    {
        "name_en": "Sankashti Chaturthi",
        "name_kn": "ಸಂಕಷ್ಟ ಚತುರ್ಥಿ",
        "significance": "Moonrise fasting day for Lord Ganesha. Observed on Krishna Chaturthi.",
        "type": "tithi",
        "paksha": "Krishna",
        "tithi": 3,       # Chaturthi = index 3
    },

    # Vinayaka Chaturthi (Shukla Chaturthi) — Ganesha worship
    {
        "name_en": "Vinayaka Chaturthi",
        "name_kn": "ವಿನಾಯಕ ಚತುರ್ಥಿ",
        "significance": "Monthly Ganesha worship day. Observed on Shukla Chaturthi.",
        "type": "tithi",
        "paksha": "Shukla",
        "tithi": 3,
    },

    # Shashti (Subramanya's day) — Special for Kukke Subramanya
    {
        "name_en": "Subramanya Shashti",
        "name_kn": "ಸುಬ್ರಹ್ಮಣ್ಯ ಷಷ್ಠಿ",
        "significance": "Sacred day of Lord Subramanya. Observed on Shukla Shashti.",
        "type": "tithi",
        "paksha": "Shukla",
        "tithi": 5,       # Shashthi = index 5
    },

    # ─── ANNUAL FESTIVALS ──────────────────────────────────────────────

    # Ugadi (Chaitra Shukla Pratipada) — Hindu New Year
    {
        "name_en": "Ugadi",
        "name_kn": "ಯುಗಾದಿ",
        "significance": "Hindu New Year. Start of Chaitra month, new Samvatsara begins.",
        "type": "special",
        "masa": 0,        # Chaitra
        "paksha": "Shukla",
        "tithi": 0,       # Pratipada
    },

    # Rama Navami (Chaitra Shukla Navami)
    {
        "name_en": "Rama Navami",
        "name_kn": "ರಾಮ ನವಮಿ",
        "significance": "Birthday of Lord Rama. Grand celebrations and Rama Katha recitals.",
        "type": "special",
        "masa": 0,        # Chaitra
        "paksha": "Shukla",
        "tithi": 8,       # Navami = index 8
    },

    # Hanuman Jayanti (Chaitra Purnima)
    {
        "name_en": "Hanuman Jayanti",
        "name_kn": "ಹನುಮ ಜಯಂತಿ",
        "significance": "Birthday of Lord Hanuman. Fasting and Hanuman Chalisa recital.",
        "type": "special",
        "masa": 0,        # Chaitra
        "paksha": "Shukla",
        "tithi": 14,
    },

    # Akshaya Tritiya (Vaishakha Shukla Tritiya)
    {
        "name_en": "Akshaya Tritiya",
        "name_kn": "ಅಕ್ಷಯ ತೃತೀಯ",
        "significance": "Highly auspicious day. Any good deed done today gives infinite merit.",
        "type": "special",
        "masa": 1,        # Vaishakha
        "paksha": "Shukla",
        "tithi": 2,       # Tritiya
    },

    # Guru Purnima (Ashadha Purnima)
    {
        "name_en": "Guru Purnima",
        "name_kn": "ಗುರು ಪೂರ್ಣಿಮೆ",
        "significance": "Day to honor spiritual teachers. Also Vyasa Purnima.",
        "type": "special",
        "masa": 3,        # Ashadha
        "paksha": "Shukla",
        "tithi": 14,
    },

    # Naga Panchami (Shravana Shukla Panchami)
    {
        "name_en": "Naga Panchami",
        "name_kn": "ನಾಗ ಪಂಚಮಿ",
        "significance": "Worship of Naga Devatas. Special at Subramanya temple.",
        "type": "special",
        "masa": 4,        # Shravana
        "paksha": "Shukla",
        "tithi": 4,       # Panchami
    },

    # Varalakshmi Vratam (Shravana Shukla — Friday before Purnima)
    # Note: This is approximate — usually the Friday before Purnima in Shravana
    # We'll match Shravana Shukla Ashtami-Dwadashi range + Friday
    {
        "name_en": "Varalakshmi Vratam",
        "name_kn": "ವರಲಕ್ಷ್ಮಿ ವ್ರತ",
        "significance": "Worship of Goddess Lakshmi for prosperity and well-being.",
        "type": "special",
        "masa": 4,        # Shravana
        "paksha": "Shukla",
        "tithi": None,
        "weekday": 4,     # Friday
    },

    # Krishna Janmashtami (Shravana Krishna Ashtami)
    {
        "name_en": "Krishna Janmashtami",
        "name_kn": "ಕೃಷ್ಣ ಜನ್ಮಾಷ್ಟಮಿ",
        "significance": "Birthday of Lord Krishna. Midnight worship & Dahi Handi.",
        "type": "special",
        "masa": 4,        # Shravana
        "paksha": "Krishna",
        "tithi": 7,       # Ashtami
    },

    # Ganesh Chaturthi (Bhadrapada Shukla Chaturthi)
    {
        "name_en": "Ganesh Chaturthi",
        "name_kn": "ಗಣೇಶ ಚತುರ್ಥಿ",
        "significance": "Birthday of Lord Ganesha. 10-day festival begins.",
        "type": "special",
        "masa": 5,        # Bhadrapada
        "paksha": "Shukla",
        "tithi": 3,
    },

    # Ananta Chaturdashi (Bhadrapada Shukla Chaturdashi)
    {
        "name_en": "Ananta Chaturdashi",
        "name_kn": "ಅನಂತ ಚತುರ್ದಶಿ",
        "significance": "Ganesh Visarjana day. Also Ananta Padmanabha Vrata.",
        "type": "special",
        "masa": 5,
        "paksha": "Shukla",
        "tithi": 13,
    },

    # Navaratri starts (Ashwayuja Shukla Pratipada)
    {
        "name_en": "Navaratri Begins",
        "name_kn": "ನವರಾತ್ರಿ ಆರಂಭ",
        "significance": "Nine nights of Goddess Durga worship. Dasara festivities start.",
        "type": "special",
        "masa": 6,        # Ashwayuja
        "paksha": "Shukla",
        "tithi": 0,
    },

    # Vijayadashami / Dasara (Ashwayuja Shukla Dashami)
    {
        "name_en": "Vijayadashami (Dasara)",
        "name_kn": "ವಿಜಯದಶಮಿ (ದಸರಾ)",
        "significance": "Victory of good over evil. Saraswati Puja & Shami Puja.",
        "type": "special",
        "masa": 6,
        "paksha": "Shukla",
        "tithi": 9,       # Dashami
    },

    # Deepavali / Naraka Chaturdashi (Ashwayuja Krishna Chaturdashi)
    {
        "name_en": "Deepavali (Naraka Chaturdashi)",
        "name_kn": "ದೀಪಾವಳಿ",
        "significance": "Festival of Lights. Victory of light over darkness.",
        "type": "special",
        "masa": 6,        # Ashwayuja
        "paksha": "Krishna",
        "tithi": 13,      # Chaturdashi
    },

    # Lakshmi Puja (Kartika Amavasya — day after Deepavali)
    {
        "name_en": "Deepavali Lakshmi Puja",
        "name_kn": "ದೀಪಾವಳಿ ಲಕ್ಷ್ಮಿ ಪೂಜೆ",
        "significance": "Worship of Goddess Lakshmi on Deepavali night.",
        "type": "special",
        "masa": 6,
        "paksha": "Krishna",
        "tithi": 14,
    },

    # Kartika Deepotsava (Kartika Purnima)
    {
        "name_en": "Kartika Purnima",
        "name_kn": "ಕಾರ್ತಿಕ ಪೂರ್ಣಿಮೆ",
        "significance": "Dev Deepavali. Sacred for lighting lamps near rivers.",
        "type": "special",
        "masa": 7,
        "paksha": "Shukla",
        "tithi": 14,
    },

    # Subramanya Shashti / Champa Shashti (Margashira Shukla Shashti)
    {
        "name_en": "Champa Shashti (Subramanya Shashti)",
        "name_kn": "ಚಂಪಾ ಷಷ್ಠಿ (ಸುಬ್ರಹ್ಮಣ್ಯ ಷಷ್ಠಿ)",
        "significance": "Most important festival at Kukke Subramanya. Grand Ashlesha Bali Pooja.",
        "type": "special",
        "masa": 8,        # Margashira
        "paksha": "Shukla",
        "tithi": 5,       # Shashti
    },

    # Vaikuntha Ekadashi (Margashira/Pushya Shukla Ekadashi)
    {
        "name_en": "Vaikuntha Ekadashi",
        "name_kn": "ವೈಕುಂಠ ಏಕಾದಶಿ",
        "significance": "Gate to Vaikuntha opens. Most sacred Ekadashi of the year.",
        "type": "special",
        "masa": 8,        # Margashira
        "paksha": "Shukla",
        "tithi": 10,
    },

    # Maha Shivaratri (Magha Krishna Chaturdashi)
    {
        "name_en": "Maha Shivaratri",
        "name_kn": "ಮಹಾ ಶಿವರಾತ್ರಿ",
        "significance": "Great Night of Lord Shiva. Night-long worship and fasting.",
        "type": "special",
        "masa": 10,       # Magha
        "paksha": "Krishna",
        "tithi": 13,      # Chaturdashi
    },

    # Holi (Phalguna Purnima)
    {
        "name_en": "Holi",
        "name_kn": "ಹೋಳಿ",
        "significance": "Festival of Colors. Celebrates the triumph of good over evil.",
        "type": "special",
        "masa": 11,       # Phalguna
        "paksha": "Shukla",
        "tithi": 14,
    },
]


# ═══════════════════════════════════════════════════════════════════════
# VEDIC GLOSSARY (for Educational Tooltips)
# ═══════════════════════════════════════════════════════════════════════

VEDIC_GLOSSARY = {
    # Tithis
    "Pratipada": {"meaning": "First lunar day", "nature": "Neutral"},
    "Dwitiya": {"meaning": "Second lunar day", "nature": "Auspicious"},
    "Tritiya": {"meaning": "Third lunar day", "nature": "Auspicious"},
    "Chaturthi": {"meaning": "Fourth lunar day (Ganesha's day)", "nature": "Mixed"},
    "Panchami": {"meaning": "Fifth lunar day", "nature": "Auspicious"},
    "Shashthi": {"meaning": "Sixth lunar day (Subramanya's day)", "nature": "Auspicious"},
    "Saptami": {"meaning": "Seventh lunar day", "nature": "Auspicious"},
    "Ashtami": {"meaning": "Eighth lunar day", "nature": "Inauspicious"},
    "Navami": {"meaning": "Ninth lunar day", "nature": "Inauspicious"},
    "Dashami": {"meaning": "Tenth lunar day", "nature": "Auspicious"},
    "Ekadashi": {"meaning": "Eleventh lunar day (Fasting day)", "nature": "Very Auspicious"},
    "Dwadashi": {"meaning": "Twelfth lunar day", "nature": "Auspicious"},
    "Trayodashi": {"meaning": "Thirteenth lunar day", "nature": "Auspicious"},
    "Chaturdashi": {"meaning": "Fourteenth lunar day", "nature": "Inauspicious"},
    "Purnima": {"meaning": "Full Moon day", "nature": "Very Auspicious"},
    "Amavasya": {"meaning": "New Moon day", "nature": "Inauspicious (Good for Pitru Karma)"},

    # Yogas
    "Vishkumbha": {"meaning": "Obstruction", "nature": "Inauspicious"},
    "Preeti": {"meaning": "Love", "nature": "Auspicious"},
    "Ayushman": {"meaning": "Long Life", "nature": "Auspicious"},
    "Saubhagya": {"meaning": "Good Fortune", "nature": "Auspicious"},
    "Shobhana": {"meaning": "Splendor", "nature": "Auspicious"},
    "Atiganda": {"meaning": "Great Danger", "nature": "Inauspicious"},
    "Sukarma": {"meaning": "Good Deeds", "nature": "Auspicious"},
    "Dhriti": {"meaning": "Steadfastness", "nature": "Auspicious"},
    "Shula": {"meaning": "Spear/Pain", "nature": "Inauspicious"},
    "Ganda": {"meaning": "Danger", "nature": "Inauspicious"},
    "Vriddhi": {"meaning": "Growth", "nature": "Auspicious"},
    "Dhruva": {"meaning": "Stable/Fixed", "nature": "Auspicious"},
    "Vyaghata": {"meaning": "Destruction", "nature": "Inauspicious"},
    "Harshana": {"meaning": "Joy", "nature": "Auspicious"},
    "Vajra": {"meaning": "Thunderbolt", "nature": "Inauspicious"},
    "Siddhi": {"meaning": "Accomplishment", "nature": "Auspicious"},
    "Vyatipata": {"meaning": "Calamity", "nature": "Very Inauspicious"},
    "Variyan": {"meaning": "Comfort", "nature": "Auspicious"},
    "Parigha": {"meaning": "Obstacles", "nature": "Inauspicious"},
    "Shiva": {"meaning": "Auspicious", "nature": "Very Auspicious"},
    "Siddha": {"meaning": "Accomplished", "nature": "Very Auspicious"},
    "Sadhya": {"meaning": "Achievable", "nature": "Auspicious"},
    "Shubha": {"meaning": "Good", "nature": "Auspicious"},
    "Shukla": {"meaning": "Bright/Pure", "nature": "Auspicious"},
    "Brahma": {"meaning": "Creator", "nature": "Auspicious"},
    "Indra": {"meaning": "King of Gods", "nature": "Auspicious"},
    "Vaidhriti": {"meaning": "Discord", "nature": "Very Inauspicious"},

    # Karanas
    "Bava": {"meaning": "Lion — Virility", "nature": "Auspicious"},
    "Balava": {"meaning": "Leopard — Ambition", "nature": "Auspicious"},
    "Kaulava": {"meaning": "Pig — Friendship", "nature": "Auspicious"},
    "Taitila": {"meaning": "Donkey — Luxury", "nature": "Auspicious"},
    "Garija": {"meaning": "Elephant — Trade", "nature": "Auspicious"},
    "Vanija": {"meaning": "Merchant — Commerce", "nature": "Auspicious"},
    "Vishti (Bhadra)": {"meaning": "Inauspicious half-day", "nature": "Inauspicious"},
    "Shakuni": {"meaning": "Bird — Fixed task", "nature": "Mixed"},
    "Chatushpada": {"meaning": "Four-legged — Stability", "nature": "Mixed"},
    "Naga": {"meaning": "Serpent — Destruction", "nature": "Inauspicious"},
    "Kimstughna": {"meaning": "Uncertain", "nature": "Mixed"},

    # Pakshas
    "Shukla Paksha": {"meaning": "Bright fortnight (Waxing Moon)", "nature": "Auspicious"},
    "Krishna Paksha": {"meaning": "Dark fortnight (Waning Moon)", "nature": "Neutral"},
}


# ═══════════════════════════════════════════════════════════════════════
# DETECTION FUNCTION
# ═══════════════════════════════════════════════════════════════════════

def detect_festivals(masa_index, paksha, tithi_index, nakshatra_index, weekday, sankranti=None):
    """
    Detect festivals based on Vedic calendar attributes.

    Args:
        masa_index: 0-11 (Chaitra..Phalguna)
        paksha: "Shukla" or "Krishna"
        tithi_index: 0-14 within the paksha (Pratipada=0 .. Purnima/Amavasya=14)
        nakshatra_index: 0-26
        weekday: 0-6 (Mon=0 .. Sun=6)
        sankranti: str or None (e.g., "Makara Sankranti")

    Returns:
        list of dicts: [{"name_en", "name_kn", "significance", "type"}, ...]
    """
    matched = []

    for rule in FESTIVAL_RULES:
        # Check all specified conditions
        if rule.get("masa") is not None and rule["masa"] != masa_index:
            continue
        if rule.get("paksha") is not None and rule["paksha"] != paksha:
            continue
        if rule.get("tithi") is not None and rule["tithi"] != tithi_index:
            continue
        if rule.get("nakshatra") is not None and rule["nakshatra"] != nakshatra_index:
            continue
        if rule.get("weekday") is not None and rule["weekday"] != weekday:
            continue

        # All conditions matched
        matched.append({
            "name_en": rule["name_en"],
            "name_kn": rule["name_kn"],
            "significance": rule["significance"],
            "type": rule["type"],
        })

    # Sankranti is always a festival
    if sankranti:
        matched.append({
            "name_en": sankranti,
            "name_kn": sankranti,  # Could be localized later
            "significance": "Sun enters a new zodiac sign. Auspicious day for charity and rituals.",
            "type": "solar",
        })

    return matched


def get_glossary_entry(term):
    """
    Look up a Vedic term in the glossary.

    Args:
        term: str — the term to look up (e.g., "Vyatipata", "Bava")

    Returns:
        dict or None: {"meaning": str, "nature": str}
    """
    return VEDIC_GLOSSARY.get(term)
