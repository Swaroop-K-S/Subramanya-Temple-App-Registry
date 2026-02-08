from database import SessionLocal
from models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def create_clerk():
    db = SessionLocal()
    try:
        if db.query(User).filter(User.username == "clerk").first():
            print("Clerk already exists")
            return
        
        clerk = User(
            username="clerk",
            hashed_password=pwd_context.hash("clerk123"),
            role="clerk"
        )
        db.add(clerk)
        db.commit()
        print("Clerk created")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_clerk()
