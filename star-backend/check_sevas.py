from app.database import SessionLocal
from app.models import SevaCatalog

db = SessionLocal()
sevas = db.query(SevaCatalog).order_by(SevaCatalog.id).all()

with open("sevas_dump.txt", "w", encoding="utf-8") as f:
    for s in sevas:
        f.write(f"{s.id}: {s.name_eng} -> {s.name_kan}\n")

print("Dumped to sevas_dump.txt")
