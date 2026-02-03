
import logging
from datetime import date, timedelta
from panchang import PanchangCalculator

# Configure "DevOps" Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [ORACLE] - %(message)s')
logger = logging.getLogger("OracleOps")

def check_forecast_and_scale():
    """
    Scans the Panchangam for the next 7 days.
    Adjusts infrastructure capacity based on predicted devotee footfall.
    """
    today = date.today()
    logger.info("Initiating Temporal Scan (Panchangam Analysis)...")
    
    high_traffic_detected = False
    reasons = []

    for i in range(7):
        target_date = today + timedelta(days=i)
        p = PanchangCalculator.calculate(target_date)
        
        # Heuristics for High Traffic
        attributes = p.get("attributes", {})
        festival = p.get("is_festival")
        
        # 1. Festival Check
        if festival:
            high_traffic_detected = True
            reasons.append(f"{target_date} is {festival}")
            
        # 2. Auspicious Maasa Check (Kartika, Magha, Shravana)
        maasa = attributes.get("maasa")
        tithi = attributes.get("tithi")
        if maasa in ["Kartika", "Shravana", "Magha"] and ("Purnima" in tithi or "Ekadashi" in tithi):
             high_traffic_detected = True
             reasons.append(f"{target_date} is {maasa} {tithi} (Peak Season)")

        # 3. Weekend + Auspicious Yoga
        weekday = target_date.strftime("%A")
        yoga = attributes.get("yoga")
        if weekday in ["Saturday", "Sunday"] and yoga in ["Siddha", "Sadhya", "Shubha"]:
             # Moderate boost, maybe not full scale, but worth noting
             # reasons.append(f"{target_date} is Weekend with {yoga} yoga")
             pass

    if high_traffic_detected:
        logger.warning(f"TRAFFIC SPIKE PREDICTED: {', '.join(reasons)}")
        logger.info("ACTION: Triggering Vertical Scaling Policy.")
        logger.info(">> Provisioning 2x Read Replicas...")
        logger.info(">> Upgrading Cache Size to 64GB...")
        logger.info(">> Notifying Priest Dashboard.")
        return "SCALED_UP"
    else:
        logger.info("Forecast is calm. No major festivals detected.")
        logger.info("ACTION: Applying Cost Optimization.")
        logger.info(">> Scaling down to t3.medium instances.")
        logger.info(">> Hibernating unused report servers.")
        return "OPTIMIZED"

if __name__ == "__main__":
    check_forecast_and_scale()
