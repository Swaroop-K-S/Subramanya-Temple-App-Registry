import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

try:
    print("Step 1: Importing app.database...")
    from app.database import get_db, init_database
    print("SUCCESS: Imported app.database")

    print("Step 2: Importing app.models...")
    from app.models import SevaCatalog
    print("SUCCESS: Imported app.models")

    print("Step 3: Importing app.schemas...")
    from app.schemas import SevaCreate
    print("SUCCESS: Imported SevaCreate from app.schemas")
    
    print("Step 4: Importing app.crud...")
    from app import crud
    print("SUCCESS: Imported app.crud")
    
    print("Step 4: Importing app.crud...")
    from app import crud
    print("SUCCESS: Imported app.crud")
    
    print("Individual Function Imports:")
    
    print("Importing create_user...")
    from app.crud import create_user
    print("SUCCESS")

    print("Importing get_user_by_username...")
    from app.crud import get_user_by_username
    print("SUCCESS")

    print("Importing get_all_sevas...")
    from app.crud import get_all_sevas
    print("SUCCESS")

    print("Importing create_seva_fn...")
    from app.crud import create_seva_fn
    print("SUCCESS")

    print("Importing update_seva...")
    from app.crud import update_seva
    print("SUCCESS")

    print("Importing book_seva_transaction...")
    from app.crud import book_seva_transaction
    print("SUCCESS")

    print("Importing get_today_transactions...")
    from app.crud import get_today_transactions
    print("SUCCESS")

    print("Importing create_shaswata_subscription...")
    from app.crud import create_shaswata_subscription
    print("SUCCESS")

    print("Importing get_shaswata_subscriptions...")
    from app.crud import get_shaswata_subscriptions
    print("SUCCESS")

    print("Importing get_daily_summary...")
    from app.crud import get_daily_summary
    print("SUCCESS")

    print("Importing get_transaction_trends...")
    from app.crud import get_transaction_trends
    print("SUCCESS")

    print("Importing get_financial_report...")
    from app.crud import get_financial_report
    print("SUCCESS")

    print("Importing log_dispatch...")
    from app.crud import log_dispatch
    print("SUCCESS")

    print("Importing log_feedback_sent...")
    from app.crud import log_feedback_sent
    print("SUCCESS")

    print("Importing get_pending_feedback_subscriptions...")
    from app.crud import get_pending_feedback_subscriptions
    print("SUCCESS")
except ImportError as e:
    
    print("Step 5: Importing app.panchang...")
    from app.panchang import PanchangCalculator
    print("SUCCESS: Imported app.panchang")
    
    print("Step 6: Importing app.daiva_setu...")
    from app import daiva_setu
    print("SUCCESS: Imported app.daiva_setu")

    print("Step 7: Importing app.sync_engine...")
    from app.sync_engine import sync_engine
    print("SUCCESS: Imported app.sync_engine")
except ImportError as e:
    print(f"FAILURE: ImportError - {e}")
    import traceback
    traceback.print_exc()
except Exception as e:
    print(f"FAILURE: Exception - {e}")
    import traceback
    traceback.print_exc()
