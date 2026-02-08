import os
import json
import win32print
import win32ui
from PIL import Image, ImageDraw, ImageFont, ImageWin
from datetime import datetime

# Configuration
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "printer_config.json")
# 80mm paper = ~576 dots printable width (72mm) at 203 DPI.
# We use 550px for safe margins.
PAPER_WIDTH = 576
MARGIN_X = 20
FONT_PATH_EN = "arial.ttf" 
FONT_PATH_KN = "C:/Windows/Fonts/Nirmala.ttc" # Windows standard for Kannada (Nirmala UI)

try:
    # Try to load Nirmala UI
    ImageFont.truetype(FONT_PATH_KN, 20)
    KANNADA_FONT = FONT_PATH_KN
except Exception as e:
    print(f"Font Error: {e}")
    KANNADA_FONT = "arial.ttf" # Fallback

class ReceiptGenerator:
    def __init__(self):
        self.cursor_y = 0
        # Create a tall canvas, will crop later
        self.img = Image.new('RGB', (PAPER_WIDTH, 2000), color='white')
        self.draw = ImageDraw.Draw(self.img)
        
        # Load Fonts
        try:
            self.font_header = ImageFont.truetype(KANNADA_FONT, 34)
            self.font_sub = ImageFont.truetype(KANNADA_FONT, 22)
            self.font_title = ImageFont.truetype(KANNADA_FONT, 40) # Bold for Seva Name
            self.font_body = ImageFont.truetype(KANNADA_FONT, 24)
            self.font_small = ImageFont.truetype(KANNADA_FONT, 20)
        except Exception as e:
            print(f"Font loading failed: {e}")
            # Fallback to default
            self.font_header = ImageFont.load_default()
            self.font_sub = ImageFont.load_default()
            self.font_title = ImageFont.load_default()
            self.font_body = ImageFont.load_default()
            self.font_small = ImageFont.load_default()
            
    def add_text_centered(self, text, font):
        text = str(text) if text else ""
        if not text: return
        bbox = self.draw.textbbox((0, 0), text, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        x = (PAPER_WIDTH - text_w) // 2
        self.draw.text((x, self.cursor_y), text, font=font, fill='black')
        self.cursor_y += text_h + 15 # Dynamic Height + Padding

    def add_text_left(self, text, font):
        text = str(text) if text else ""
        if not text: return
        self.draw.text((MARGIN_X, self.cursor_y), text, font=font, fill='black')
        bbox = self.draw.textbbox((0, 0), text, font=font)
        text_h = bbox[3] - bbox[1]
        self.cursor_y += text_h + 12

    def add_key_value(self, key, value, font):
        # "Key: Value" with wrapping
        full_text = f"{key} : {value}"
        
        # Simple wrapping
        words = full_text.split(' ')
        line = ""
        line_height = 0
        
        # Calculate approximate line height for this font once
        dummy_bbox = self.draw.textbbox((0, 0), "Aj", font=font)
        default_h = dummy_bbox[3] - dummy_bbox[1]
        
        for word in words:
            test_line = line + word + " "
            bbox = self.draw.textbbox((0, 0), test_line, font=font)
            if bbox[2] > (PAPER_WIDTH - MARGIN_X):
                # Draw current line
                self.draw.text((MARGIN_X, self.cursor_y), line, font=font, fill='black')
                self.cursor_y += (bbox[3] - bbox[1]) + 8 if line else default_h + 8
                line = word + " "
            else:
                line = test_line
        
        # Draw last line
        self.draw.text((MARGIN_X, self.cursor_y), line, font=font, fill='black')
        bbox = self.draw.textbbox((0, 0), line, font=font)
        current_h = bbox[3] - bbox[1]
        self.cursor_y += current_h + 15 # Dynamic spacing
        
    def add_separator(self):
        self.cursor_y += 10
        self.draw.line((MARGIN_X, self.cursor_y, PAPER_WIDTH - MARGIN_X, self.cursor_y), fill='black', width=2)
        self.cursor_y += 15

    def add_spacer(self, pixels):
        self.cursor_y += pixels

    def save(self, filename="receipt.jpg"):
        # Crop to content
        final_img = self.img.crop((0, 0, PAPER_WIDTH, self.cursor_y + 20))
        final_img.save(filename)
        return filename

def generate_receipt_image(data):
    """
    Data payload:
    {
        "receipt_no": "1234",
        "date": "07-02-2026 10:30 AM",
        "seva_name": "KUMKUMARCHANE",
        "devotee_name": "Swaroop",
        "gothra": "Sandilya",
        "nakshatra": "Ashwini",
        "rashi": "Mesha",
        "amount": "20.00",
        "payment_mode": "UPI"
    }
    """
    g = ReceiptGenerator()
    
    # 1. Header (Static for now, can be bilingual)
    g.add_text_centered("ಬ್ರಾಹ್ಮಣ ಸೇವಾ ಸಮಿತಿ (ರಿ.)", g.font_header) # Brahmana Seva Samithi (R)
    g.add_spacer(10)
    g.add_text_centered("ದೇವರಪ್ಪ ಬೀದಿ, ತರೀಕೆರೆ - 577228", g.font_sub) # Devarappa Street, Tarikere
    g.add_spacer(10)
    g.add_text_centered("ಶ್ರೀ ಸುಬ್ರಹ್ಮಣ್ಯೇಶ್ವರ ಸ್ವಾಮಿ ದೇವಸ್ಥಾನ", g.font_sub) # Sri Subramanya Swami Temple
    g.add_separator()
    
    # 2. Receipt Details
    g.add_text_left(f"ರಶೀದಿ ಸಂಖ್ಯೆ (No): {data.get('receipt_no')}", g.font_body)
    g.add_text_left(f"ದಿನಾಂಕ (Date): {data.get('date')}", g.font_body)
    g.add_separator()
    
    # 3. Seva Name (Big)
    g.add_text_centered(data.get('seva_name', ''), g.font_title)
    g.add_separator()
    
    # 4. Devotee Details
    g.add_key_value("ಹೆಸರು (Name)", data.get('devotee_name', '-'), g.font_body)
    g.add_key_value("ಗೋತ್ರ (Gothra)", data.get('gothra', '-'), g.font_body)
    g.add_key_value("ನಕ್ಷತ್ರ (Nakshatra)", data.get('nakshatra', '-'), g.font_body)
    g.add_key_value("ರಾಶಿ (Rashi)", data.get('rashi', '-'), g.font_body)
    g.add_separator()
    
    # 5. Payment
    g.add_key_value("ಸಂದಾಯ (Amount)", f"₹ {data.get('amount')}", g.font_title)
    g.add_key_value("ಪಾವತಿ ವಿಧಾನ (Mode)", data.get('payment_mode', 'Cash'), g.font_body)
    g.add_separator()
    
    # 6. Footer
    g.add_text_centered("Sarve Janah Sukhino Bhavantu", g.font_small)
    g.add_text_centered("Thank You", g.font_small)
    
    # 7. Copy Label (Optional)
    if data.get('copy_label'):
        g.add_separator()
        g.add_text_centered(data.get('copy_label'), g.font_small)
    
    # Generate unique filename
    filename = f"receipt_{data.get('receipt_no', 'temp')}_{int(datetime.now().timestamp())}.jpg"
    return g.save(filename)

def print_receipt_image(image_path):
    try:
        # Load Config
        with open(CONFIG_PATH, 'r') as f:
            config = json.load(f)
        printer_name = config.get("printer_name")
        
        if not printer_name:
            print("Printer name not found in config")
            return False

        # Use win32ui to print the image
        # Standard logic for printing image to DC
        
        hDC = win32ui.CreateDC()
        hDC.CreatePrinterDC(printer_name)
        
        bmp = Image.open(image_path)
        if bmp.mode != "RGB":
            bmp = bmp.convert("RGB")
            
        # Scale to printer width
        # Get printer DPI
        HORZRES = 8
        VERTRES = 10
        LOGPIXELSX = 88
        LOGPIXELSY = 90
        
        printable_width = hDC.GetDeviceCaps(HORZRES)
        printable_height = hDC.GetDeviceCaps(VERTRES)
        
        # Simple scaling: fit width
        w, h = bmp.size
        # Protect against divide by zero
        if w == 0: return False
            
        ratio = printable_width / w
        scaled_h = int(h * ratio)
        
        hDC.StartDoc("Temple Receipt")
        hDC.StartPage()
        
        dib = ImageWin.Dib(bmp)
        dib.draw(hDC.GetHandleOutput(), (0, 0, printable_width, scaled_h))
        
        hDC.EndPage()
        hDC.EndDoc()
        hDC.DeleteDC()
        return True
        
    except Exception as e:
        print(f"Printing failed: {e}")
        return False
