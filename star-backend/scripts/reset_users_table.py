from app.database import engine, Base
from app.models import User
from sqlalchemy import text
from passlib.context import CryptContext

# Auth setup
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
def get_password_hash(password):
    return pwd_context.hash(password)

def reset_users():
    with engine.connect() as connection:
        # Drop table if exists
        print("Dropping 'users' table...")
        connection.execute(text("DROP TABLE IF EXISTS users CASCADE"))
        connection.commit()
    
    # Re-create tables
    print("Re-creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

    # Create Admin
    from sqlalchemy.orm import Session
    session = Session(bind=engine)
    try:
        print("Creating admin user...")
        hashed_pwd = get_password_hash("password123")
        new_user = User(username="admin", hashed_password=hashed_pwd, role="admin")
        session.add(new_user)
        session.commit()
        print("Admin user created successfully!")
    except Exception as e:
        print(f"Error creating admin: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    reset_users()
