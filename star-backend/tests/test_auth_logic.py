from database import SessionLocal
from models import User
from passlib.context import CryptContext

# Re-create the same context as main.py
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def test_login():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == "admin").first()
        if not user:
            print("USER NOT FOUND")
            return

        print(f"Found User: {user.username}")
        print(f"Stored Hash: {user.hashed_password}")
        
        # Test 1: Verify correctly
        is_valid = verify_password("password123", user.hashed_password)
        print(f"Verify 'password123': {is_valid}")

        if not is_valid:
            # Test 2: Generate new hash and compare
            new_hash = pwd_context.hash("password123")
            print(f"New Hash Gen: {new_hash}")
            print(f"Verify New: {pwd_context.verify('password123', new_hash)}")

    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_login()
