# Subramanya Temple App & Registry (S.T.A.R.)

## Overview
A modern, offline-first application for managing temple sevas, devotees, and accounts. Built with **FastAPI** (Backend) and **React** (Frontend), packaged as a portable `.exe` for Windows.

## Project Structure (Refactored)
The codebase is organized into a modular `app` package for better maintainability.

```
star-backend/
├── app/                  # Core Application Logic
│   ├── models.py         # Database Schema (SQLAlchemy)
│   ├── schemas.py        # Data Validation (Pydantic)
│   ├── crud.py           # Database Operations
│   ├── database.py       # SQL Connection (Portable SQLite)
│   ├── panchang.py       # Vedic Astrology Engine (Ephem)
│   ├── printer_service.py # Receipt Generation (Thermal Printer)
│   ├── legacy_migrator.py # Data Import Tools (PDF/CSV)
│   └── daiva_setu.py     # AI Interface (Genesis Protocol)
├── scripts/              # Developer Utilities
├── main.py               # Application Entry Point
├── build_exe.spec        # PyInstaller Build Configuration
└── requirements.txt      # Python Dependencies
```

## Setup & Installation

### prerequisites
- Python 3.10+
- Git


### Security Configuration (Recommended)
Set these environment variables before running in production-like environments:

```bash
set STAR_SECRET_KEY=replace_with_a_long_random_secret
set ADMIN_BOOTSTRAP_PASSWORD=replace_with_a_strong_password
set ENABLE_CREATE_ADMIN=false
set ALLOWED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
```

Notes:
- `STAR_SECRET_KEY` should be stable per deployment, otherwise JWT tokens will be invalidated on restart.
- `ENABLE_CREATE_ADMIN` is disabled by default for safety.
- If no users exist and `ADMIN_BOOTSTRAP_PASSWORD` is not set, a one-time random bootstrap password is generated and printed in backend logs.

### Running Locally (Development)
1. **Create Virtual Environment**:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Run Application**:
   ```bash
   python main.py
   ```
   Server will start at `http://127.0.0.1:8000`.

## Building Executable (Production)
To create a standalone `.exe` file:

```bash
pyinstaller build_exe.spec --clean
```

Output will be in `dist/subramanya_temple_app/`.

## Features
- **Seva Booking**: Quick booking flow with receipt generation.
- **Panchangam**: Real-time Tithi/Nakshatra calculation.
- **Shaswata Seva**: Perpetual puja management (Lunar/Gregorian).
- **Reports**: Financial summaries and daily transaction logs.
- **Printing**: Thermal receipt printing support (POS-80).
- **Legacy Import**: Migration tools for old data.
