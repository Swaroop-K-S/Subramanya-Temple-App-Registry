# Level 15: The Genesis Protocol (Omni-Data Oracle)

**To:** Board of Trustees, Subramanya Temple  
**From:** Antigravity (Chief Product Strategist)  
**Date:** 2026-02-03  

## 1. The Strategic Analysis (The Void)

I have analyzed the `star-backend` and `star-frontend`.
*   **Strengths**: You have conquered the transactional layer. You can book sevas, print receipts instantly (Level 11), and predict infrastructure load (Level 12).
*   **The Void**: The system is entirely **Administrative**. It serves the *Clerk*, not the *Devotee*.

Devotees donate when they feel **seen** and **connected**. Currently, they book a seva, get a paper receipt, and leave. If they are remote (USA/Bangalore), they send money and get... nothing. Maybe a generic SMS. This is a massive "Engagement Leak."

---

## 2. The Proposal: "Daiva-Setu" (The Divine Bridge)
**Status**: Brand New Feature  
**Core Concept**: **Hyper-Personalized AI Astrological Seva Recommendation & Digital Fulfillment Engine.**

We move from "Passive Booking" to "Proactive Spiritual Care."

### The Psychology ("Why they will love it")
1.  **The Barnum Effect (Personalization)**: When the app says "Choose a Seva," it's a chore. When the app says *"Ramesh, your Nakshatra is Ashwini. Tomorrow is a powerful day for Ashwini natives. We recommend the Kunkumarchana to strengthen your planetary alignment,"* it feels like divine intervention.
2.  **The "I Am There" Feeling**: For remote devotees, we introduce **Asynchronous Video Sankalpa**. Not a live stream of the whole temple, but a 15-second personalized clip where the priest reads *their* name from the list.

---

## 3. The Architecture

### A. Backend Architecture (Python / FastAPI)

We need three new micro-services in `star-backend`.

#### 1. `astro_engine.py` (The Recommender)
*   **Input**: Devotee's Nakshatra/Rashi (from `devotees` table) + Tomorrow's Panchang (from `panchang.py`).
*   **Logic**:
    *   *Rule Engine*: If `Moon` is in `Enemy House` for `Rashi` -> Recommend `Shanthi Seva`.
    *   *Festival Logic*: If `Skanda Shashti` -> Push `Abhisheka`.
*   **Output**: JSON list of `recommended_sevas` with `reasoning` text.

#### 2. `media_pipeline.py` (The Fulfillment)
*   **Trigger**: When `Seva` is marked "Completed" in `scheduler.py`.
*   **Process**:
    *   Temple camera records 'Sankalpa' time window (e.g., 8:00 AM - 8:30 AM).
    *   AI (OpenCV) segments the video based on the timestamp of the priest reading the list.
    *   FFmpeg overlays the Devotee's Name in Kannada on the video.
*   **Delivery**: Uploads to S3/Cloudflare R2 and generates a secure, expiring link.

#### 3. `whatsapp_bridge.py`
*   Sends the "Recommendation" on Sunday evenings.
*   Sends the "Video Prasada" link when done.

### B. Frontend Structure (React)

#### 1. `DivineDashboard.jsx` (New Devotee View)
A mobile-first view for the devotee (not the clerk).
*   **Hero Section**: "Namaste, [Name]. Today is [Panchang Date]."
*   **Cosmic Alignment Card**: visualizes their Rashi vs. Current Planets.
*   **"Suggested for You" Carousel**: Cards showing specific Sevas with the "Why?" text (e.g., "Remove obstacles this week").

#### 2. `VideoPrasada.jsx`
*   **Player**: sleek HLS player for the 15s clip.
*   **Share Button**: "Share my Blessing on WhatsApp" (Viral Loop).

---

## 4. Implementation Roadmap (Zero to Alpha)

1.  **Week 1**: Build `astro_engine.py`. Extend `devotees` table to ensure `nakshatra` is mandatory.
2.  **Week 2**: Deploy `DivineDashboard` UI (Read-Only). Show the reco.
3.  **Week 3**: Enable "One-Click Book Recommendation" (using your Payment Gateway).

This creates a recurring loop: **Planet Moves -> AI Detects Need -> Devotee Notified -> Donation Made -> Devotee feels Blessed.**

This is not just software. It is a modern digital ecosystem for ancient tradition.
