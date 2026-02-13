from app.database import SessionLocal
from app.models import SevaCatalog

def seed_db():
    session = SessionLocal()
    try:
        count = session.query(SevaCatalog).count()
        print(f"Current Seva Count: {count}")
        
        if count == 0:
            print("Seeding default sevas...")
            default_sevas = [
                SevaCatalog(name_eng="Archana", name_kan="ಅರ್ಚನೆ", price=20.0),
                SevaCatalog(name_eng="Panchamrutha Abhisheka", name_kan="ಪಂಚಾಮೃತ ಅಭಿಷೇಕ", price=150.0),
                SevaCatalog(name_eng="Ksheera Abhisheka", name_kan="ಕ್ಷೀರಾಭಿಷೇಕ", price=50.0),
                SevaCatalog(name_eng="Rudra Abhisheka", name_kan="ರುದ್ರಾಭಿಷೇಕ", price=350.0),
                SevaCatalog(name_eng="Karthika Pooje", name_kan="ಕಾರ್ತಿಕ ಪೂಜೆ", price=100.0),
                SevaCatalog(name_eng="Sarpa Samskara", name_kan="ಸರ್ಪ ಸಂಸ್ಕಾರ", price=3500.0, is_slot_based=True),
                SevaCatalog(name_eng="Ashlesha Bali", name_kan="ಆಶ್ಲೇಷ ಬಲಿ", price=500.0),
                SevaCatalog(name_eng="Prasada Oota", name_kan="ಪ್ರಸಾದ ಊಟ", price=0.0),
            ]
            session.add_all(default_sevas)
            session.commit()
            print("Seeding Complete!")
        else:
            print("Database already populated.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    seed_db()
