import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import User
from passlib.context import CryptContext

# Setup Auth Context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_admin():
    db = SessionLocal()
    try:
        print("Checking for existing admin user...")
        user = db.query(User).filter(User.username == "admin").first()
        if user:
            print(f"Admin user already exists! (ID: {user.id})")
            # Verify password
            if verify_password("password123", user.hashed_password):
                 print("Password verification: SUCCESS")
            else:
                 print("Password verification: FAILED (Resetting password...)")
                 user.hashed_password = get_password_hash("password123")
                 db.commit()
                 print("Password reset to 'password123'.")
        else:
            print("Creating new admin user...")
            hashed_pwd = get_password_hash("password123")
            new_user = User(username="admin", hashed_password=hashed_pwd, role="admin")
            db.add(new_user)
            db.commit()
            print("Admin user created successfully!")
            
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
