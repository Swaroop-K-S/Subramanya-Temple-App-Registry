"""
Daiva-Setu: The Divine Bridge (Genesis Protocol v1.0)
=====================================================
Neural Interface for S.T.A.R. (Subramanya Temple App & Registry)
Acts as the bridge between User Natural Language and the Vedic Database.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime
import re
import random
import traceback

from .database import get_db
from .models import SevaCatalog

router = APIRouter(
    prefix="/genesis",
    tags=["Genesis Protocol (AI Engine)"]
)

# --- 1. DATA MODELS ---

class GenesisRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = {}

class GenesisResponse(BaseModel):
    answer: str
    suggested_actions: List[Dict[str, Any]] = []
    intent: str
    confidence: float

# --- 2. THE CORTEX (LOGIC ENGINE) ---

class DaivaSetuEngine:
    def __init__(self, db: Session):
        self.db = db

    def _detect_intent(self, query: str) -> str:
        query = query.lower()
        if any(w in query for w in ["price", "cost", "charge", "rupees", "rate"]):
            return "PRICING"
        if any(w in query for w in ["when", "time", "duration", "hours", "booking"]):
            return "TIMING"
        if any(w in query for w in ["what is", "explain", "meaning", "significance", "benefit"]):
            return "EDUCATION"
        if any(w in query for w in ["panchang", "tithi", "nakshatra", "today", "tomorrow", "day"]):
            return "PANCHANG"
        return "GENERAL"

    def _rag_lookup_sevas(self, keywords: List[str]) -> List[SevaCatalog]:
        """Retrieval Augmented Generation: Find relevant sevas safely."""
        if not keywords:
            return []

        safe_keywords = []
        for kw in keywords[:5]:
            clean_kw = re.sub(r"[^a-z0-9]", "", kw.lower())
            if len(clean_kw) >= 3:
                safe_keywords.append(clean_kw)

        if not safe_keywords:
            return []

        query = self.db.query(SevaCatalog)
        filters = [SevaCatalog.name_eng.ilike(f"%{kw}%") for kw in safe_keywords]
        return query.filter(SevaCatalog.is_active == True).filter(or_(*filters)).limit(10).all()

    def process(self, request: GenesisRequest) -> GenesisResponse:
        intent = self._detect_intent(request.query)
        query_lower = request.query.lower()
        
        # Extraction
        keywords = [w for w in query_lower.split() if w not in ["what", "is", "the", "price", "of", "for", "a", "an", "available", "cost"]]
        cleaned_keywords = [re.sub(r'[^a-z]', '', k) for k in keywords if len(k) > 3]

        answer = ""
        actions = []

        if intent == "PRICING":
            # Lookup Sevas
            sevas = self._rag_lookup_sevas(cleaned_keywords)
            if sevas:
                found_names = [f"**{s.name_eng}** (₹{s.price})" for s in sevas[:3]]
                answer = f"I found the following sevas matching your request: {', '.join(found_names)}."
                actions = [{"label": f"Book {sevas[0].name_eng}", "action": "open_booking_modal", "seva_id": sevas[0].id}]
            else:
                answer = "I couldn't find a specific seva with that name. Could you verify the spelling? We have Archana, Abhisheka, and various Homas."

        elif intent == "TIMING":
            answer = "The Temple is open from **6:00 AM to 1:30 PM** and **3:30 PM to 8:30 PM**. Abhisheka timings are at 8:30 AM."
            actions = [{"label": "Book a Specfic Slot", "action": "open_booking_modal", "seva_id": 1}]

        elif intent == "PANCHANG":
            # Mock Panchang Response (Ideally connect to PanchangCalculator)
            # In a real LLM scenario, this would be generated.
            answer = "Today is a spiritually significant day. The current Tithi is **Shukla Paksha Shashthi**, favored by Lord Subramanya. It is an excellent time for *Naga Pratishta*."
            actions = [{"label": "View Full Panchangam", "action": "navigate", "page": "panchangam"}]

        elif intent == "EDUCATION":
             sevas = self._rag_lookup_sevas(cleaned_keywords)
             if sevas:
                 s = sevas[0]
                 desc = "A sacred ritual performed for well-being."
                 answer = f"**{s.name_eng}**: {desc}. Devotees often perform this for specific sankalpas."
                 actions = [{"label": f"Book {s.name_eng}", "action": "open_booking_modal", "seva_id": s.id}]
             else:
                 answer = "The temple traditions are vast. Could you specify which ritual you wish to understand? (e.g., 'What is Sarpa Samskara?')"

        else:
            answer = "Namaste. I am Daiva-Setu, the temple's neural assistant. I can help you find Seva prices, understand rituals, or check the Panchangam. How may I assist you?"

        return GenesisResponse(
            answer=answer,
            intent=intent,
            suggested_actions=actions,
            confidence=0.85
        )

# --- 3. THE ENDPOINT ---

@router.post("/invoke", response_model=GenesisResponse)
async def genesis_invoke(request: GenesisRequest, db: Session = Depends(get_db)):
    try:
        engine = DaivaSetuEngine(db)
        response = engine.process(request)
        return response
    except Exception as e:
        print(f"Genesis Error: {e}")
        traceback.print_exc()
        # Debug Mode: Exposure
        return GenesisResponse(
            answer=f"MEDITATION BROKEN: {str(e)}",
            intent="ERROR",
            confidence=0.0
        )
