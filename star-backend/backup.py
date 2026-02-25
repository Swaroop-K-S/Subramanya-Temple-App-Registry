"""
S.T.A.R. Automated Backup Script
=================================
Creates a daily backup of the embedded PostgreSQL database.
Saves timestamped .sql dump files to star-backend/backups/

Usage:
    python backup.py

Can be registered as a Windows Task Scheduler job for daily automated backups.
"""

import os
import sys
import subprocess
from datetime import datetime

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def get_backup_dir():
    """Get/create the backups directory."""
    backup_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backups")
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
    return backup_dir


def cleanup_old_backups(backup_dir, keep_days=30):
    """Remove backups older than keep_days."""
    import glob
    cutoff = datetime.now().timestamp() - (keep_days * 86400)
    
    for f in glob.glob(os.path.join(backup_dir, "star_temple_*.sql")):
        if os.path.getmtime(f) < cutoff:
            os.remove(f)
            print(f"[CLEANUP] Removed old backup: {os.path.basename(f)}")


def backup():
    """Create a PostgreSQL database backup using pg_dump from pgserver."""
    print("=" * 50)
    print("  S.T.A.R. Database Backup")
    print("=" * 50)
    
    try:
        import pgserver
    except ImportError:
        print("[ERROR] pgserver not installed. Cannot create backup.")
        sys.exit(1)
    
    # Start the embedded PostgreSQL
    from app.database import _pg_server, is_postgres, get_pg_data_dir
    
    if not is_postgres() or _pg_server is None:
        print("[ERROR] PostgreSQL is not running. Cannot backup.")
        sys.exit(1)
    
    # Get pg_dump path from pgserver's bundled binaries
    try:
        pg_bin_dir = os.path.dirname(pgserver.pg_ctl)
        pg_dump_path = os.path.join(pg_bin_dir, "pg_dump")
        if sys.platform == "win32":
            pg_dump_path += ".exe"
    except Exception:
        print("[ERROR] Could not locate pg_dump binary.")
        sys.exit(1)
    
    if not os.path.exists(pg_dump_path):
        print(f"[ERROR] pg_dump not found at: {pg_dump_path}")
        sys.exit(1)
    
    # Create backup filename with timestamp
    backup_dir = get_backup_dir()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = os.path.join(backup_dir, f"star_temple_{timestamp}.sql")
    
    # Get connection info from the running server
    from app.database import DATABASE_URL
    
    print(f"[BACKUP] Using pg_dump: {pg_dump_path}")
    print(f"[BACKUP] Output: {backup_file}")
    
    try:
        # Use pg_dump with the connection URI
        result = subprocess.run(
            [pg_dump_path, "--dbname", DATABASE_URL, "--file", backup_file, "--clean", "--if-exists"],
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode == 0:
            size_kb = os.path.getsize(backup_file) / 1024
            print(f"[BACKUP] ✅ Backup created: {os.path.basename(backup_file)} ({size_kb:.1f} KB)")
        else:
            print(f"[BACKUP] ⚠️ pg_dump stderr: {result.stderr}")
            
    except subprocess.TimeoutExpired:
        print("[BACKUP] ⚠️ Backup timed out after 120 seconds.")
    except Exception as e:
        print(f"[BACKUP] ❌ Error: {e}")
    
    # Cleanup old backups
    cleanup_old_backups(backup_dir, keep_days=30)
    
    print("[BACKUP] Done.")


if __name__ == '__main__':
    backup()
