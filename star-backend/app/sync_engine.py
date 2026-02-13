import threading
import time
import requests
import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Transaction, Devotee, ShaswataSubscription
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SyncEngine")

# Configuration
SYNC_SERVER_URL = "https://api.star-temple.com/v1/sync" # Placeholder URL
SYNC_INTERVAL_SECONDS = 60

class SyncEngine:
    """
    Background service that synchronizes local data with the cloud server.
    Operates on an interval and handles network connectivity checks.
    """
    def __init__(self):
        self.running = False
        self.thread = None
        
    def start(self):
        """Start the sync engine in a background thread."""
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._run_loop, daemon=True)
            self.thread.start()
            logger.info("Sync Engine Started")
            
    def stop(self):
        """Stop the sync engine gracefully."""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
            logger.info("Sync Engine Stopped")
            
    def _run_loop(self):
        """Main loop that triggers sync periodically."""
        while self.running:
            try:
                self.sync_data()
            except Exception as e:
                logger.error(f"Sync Loop Error: {e}")
            
            # specific operational wait to allow clean shutdown
            for _ in range(SYNC_INTERVAL_SECONDS):
                if not self.running: 
                    return
                time.sleep(1)
                
    def sync_data(self):
        """
        Core logic to push local changes to server.
        Currently simulates sync by marking records as synced.
        """
        # TODO: Add real network check here
        
        db = SessionLocal()
        try:
            # 1. Sync Transactions
            unsynced_txs = db.query(Transaction).filter(Transaction.synced == False).limit(50).all()
            if unsynced_txs:
                logger.info(f"Found {len(unsynced_txs)} unsynced transactions. Uploading...")
                
                # Payload preparation (Simulation)
                payload = [] 
                for tx in unsynced_txs:
                    payload.append({
                        "id": tx.id,
                        "receipt_no": tx.receipt_no,
                        "amount": float(tx.amount_paid),
                        "date": tx.transaction_date.isoformat() if tx.transaction_date else None
                    })
                
                # Network Request (Simulated)
                # response = requests.post(SYNC_SERVER_URL + "/transactions", json=payload)
                # if response.status_code == 200: ...
                
                # Simulate Success
                time.sleep(1) # Simulate network latency
                for tx in unsynced_txs:
                    tx.synced = True
                db.commit()
                logger.info(f"Successfully synced {len(unsynced_txs)} transactions.")
                
            # 2. Sync Devotees (Future Implementation)
            # ...
            
        except Exception as e:
            logger.error(f"Data Sync Failed: {e}")
            db.rollback()
        finally:
            db.close()

# Global Instance
sync_engine = SyncEngine()
