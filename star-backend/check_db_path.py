from app.database import DATABASE_PATH
import os
print(f"DATABASE_PATH: {os.path.abspath(DATABASE_PATH)}")
if os.path.exists(DATABASE_PATH):
    print("File Exists!")
else:
    print("File Missing!")
