from app.database import SessionLocal
from app.models import User
from app.schemas import UserCreate
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def create_test_admin():
    db = SessionLocal()
    try:
        username = "admin_test"
        password = "admin123"
        
        # Check if exists
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            print(f"User {username} already exists. Updating password.")
            existing.hashed_password = pwd_context.hash(password)
            db.commit()
            print("Password updated.")
            return

        # hashed_password = pwd_context.hash(password) 
        hashed_password = pwd_context.hash(password.encode('utf-8'))
        
        db_user = User(
            username=username,
            hashed_password=hashed_password,
            role="admin"
        )
        db.add(db_user)
        db.commit()
        print(f"Created user {username} with password {password}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_test_admin()
