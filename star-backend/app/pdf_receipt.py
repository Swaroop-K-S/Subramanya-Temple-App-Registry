"""
S.T.A.R. PDF Receipt Generator
================================
Generates professional bilingual (English + Kannada) PDF receipts
for seva bookings using ReportLab.

Supports:
  - A5 format for printing or download
  - QR code with receipt verification info
  - Bilingual temple header
  - Clean, modern design with saffron accents
"""

import os
import io
import tempfile
from datetime import datetime

from reportlab.lib.pagesizes import A5
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

try:
    import qrcode
    HAS_QR = True
except ImportError:
    HAS_QR = False

# ═══════════════════════════════════════════════════════════════════════
# Font Registration
# ═══════════════════════════════════════════════════════════════════════

KANNADA_FONT_PATH = "C:/Windows/Fonts/Nirmala.ttc"
ARIAL_FONT_PATH = "C:/Windows/Fonts/arial.ttf"

try:
    pdfmetrics.registerFont(TTFont("NirmalaUI", KANNADA_FONT_PATH, subfontIndex=0))
    pdfmetrics.registerFont(TTFont("NirmalaUI-Bold", KANNADA_FONT_PATH, subfontIndex=1))
    KANNADA_FONT = "NirmalaUI"
    KANNADA_BOLD = "NirmalaUI-Bold"
except Exception:
    KANNADA_FONT = "Helvetica"
    KANNADA_BOLD = "Helvetica-Bold"

# ═══════════════════════════════════════════════════════════════════════
# Colors
# ═══════════════════════════════════════════════════════════════════════

SAFFRON = HexColor("#F97316")       # Temple saffron
DARK_SAFFRON = HexColor("#C2410C")
GOLD = HexColor("#D97706")
DARK_TEXT = HexColor("#1E293B")
MUTED_TEXT = HexColor("#64748B")
LIGHT_BG = HexColor("#FFF7ED")       # Warm cream
BORDER_COLOR = HexColor("#FDBA74")   # Light orange border


def _create_qr_image(data_str, size=25*mm):
    """Generate a QR code as a ReportLab-compatible image."""
    if not HAS_QR:
        return None
    try:
        qr = qrcode.QRCode(version=1, box_size=4, border=1)
        qr.add_data(data_str)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return RLImage(buf, width=size, height=size)
    except Exception:
        return None


def generate_receipt_pdf(data: dict) -> bytes:
    """
    Generate a PDF receipt and return it as bytes.

    Args:
        data: dict with keys:
            - receipt_no: str
            - date: str (formatted date/time)
            - seva_name: str
            - seva_name_kn: str (optional, Kannada name)
            - devotee_name: str
            - gothra: str
            - nakshatra: str
            - rashi: str
            - amount: str or float
            - payment_mode: str (CASH / UPI)
            - upi_txn_id: str (optional)
            - staff_name: str (optional)

    Returns:
        bytes — PDF file content
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A5,
        topMargin=10*mm,
        bottomMargin=10*mm,
        leftMargin=12*mm,
        rightMargin=12*mm,
    )

    # ── Styles ──────────────────────────────────────────────────
    styles = getSampleStyleSheet()

    style_temple_kn = ParagraphStyle(
        "TempleKn", parent=styles["Normal"],
        fontName=KANNADA_BOLD, fontSize=14,
        alignment=TA_CENTER, textColor=DARK_SAFFRON,
        spaceAfter=2*mm,
    )
    style_temple_en = ParagraphStyle(
        "TempleEn", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=10,
        alignment=TA_CENTER, textColor=DARK_TEXT,
        spaceAfter=1*mm,
    )
    style_address = ParagraphStyle(
        "Address", parent=styles["Normal"],
        fontName=KANNADA_FONT, fontSize=8,
        alignment=TA_CENTER, textColor=MUTED_TEXT,
        spaceAfter=3*mm,
    )
    style_seva_title = ParagraphStyle(
        "SevaTitle", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=16,
        alignment=TA_CENTER, textColor=SAFFRON,
        spaceAfter=1*mm,
    )
    style_seva_kn = ParagraphStyle(
        "SevaKn", parent=styles["Normal"],
        fontName=KANNADA_BOLD, fontSize=12,
        alignment=TA_CENTER, textColor=GOLD,
        spaceAfter=3*mm,
    )
    style_label = ParagraphStyle(
        "Label", parent=styles["Normal"],
        fontName=KANNADA_FONT, fontSize=9,
        textColor=MUTED_TEXT,
    )
    style_value = ParagraphStyle(
        "Value", parent=styles["Normal"],
        fontName=KANNADA_BOLD, fontSize=10,
        textColor=DARK_TEXT,
    )
    style_amount = ParagraphStyle(
        "Amount", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=18,
        alignment=TA_CENTER, textColor=DARK_SAFFRON,
        spaceBefore=2*mm, spaceAfter=2*mm,
    )
    style_footer = ParagraphStyle(
        "Footer", parent=styles["Normal"],
        fontName=KANNADA_FONT, fontSize=7,
        alignment=TA_CENTER, textColor=MUTED_TEXT,
        spaceAfter=1*mm,
    )

    # ── Build Content ───────────────────────────────────────────
    elements = []

    # 1. Temple Header
    elements.append(Paragraph("ತರೀಕೆರೆ ಶ್ರೀ ಸುಬ್ರಹ್ಮಣ್ಯೇಶ್ವರ ಸ್ವಾಮಿ ದೇವಸ್ಥಾನ", style_temple_kn))
    elements.append(Paragraph(" Tarikere Sri Subramanyeshwara Swami Temple", style_temple_en))
    elements.append(Paragraph(
        "ಬ್ರಾಹ್ಮಣ ಸೇವಾ ಸಮಿತಿ (ರಿ.) • ದೇವರಪ್ಪ ಬೀದಿ, ತರೀಕೆರೆ - 577228",
        style_address
    ))

    # Horizontal rule
    line_table = Table([[""]],
        colWidths=[doc.width],
        rowHeights=[0.5*mm],
    )
    line_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), SAFFRON),
    ]))
    elements.append(line_table)
    elements.append(Spacer(1, 3*mm))

    # 2. Receipt No + Date row
    receipt_no = data.get("receipt_no", "N/A")
    date_str = data.get("date", datetime.now().strftime("%d-%m-%Y %I:%M %p"))

    info_data = [
        [
            Paragraph(f"<b>Receipt #:</b> {receipt_no}", style_label),
            Paragraph(f"<b>Date:</b> {date_str}", ParagraphStyle(
                "DateRight", parent=style_label, alignment=TA_RIGHT
            )),
        ]
    ]
    info_table = Table(info_data, colWidths=[doc.width * 0.5, doc.width * 0.5])
    info_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 3*mm))

    # 3. Seva Name (prominent)
    seva_name = data.get("seva_name", "Seva")
    seva_name_kn = data.get("seva_name_kn", "")
    elements.append(Paragraph(seva_name.upper(), style_seva_title))
    if seva_name_kn:
        elements.append(Paragraph(seva_name_kn, style_seva_kn))

    # Thin separator
    elements.append(Spacer(1, 2*mm))

    # 4. Devotee Details Table
    devotee_rows = [
        ["ಹೆಸರು / Name", data.get("devotee_name", "-")],
        ["ಗೋತ್ರ / Gothra", data.get("gothra", "-")],
        ["ನಕ್ಷತ್ರ / Nakshatra", data.get("nakshatra", "-")],
        ["ರಾಶಿ / Rashi", data.get("rashi", "-")],
    ]

    detail_table_data = []
    for label, value in devotee_rows:
        detail_table_data.append([
            Paragraph(label, style_label),
            Paragraph(str(value), style_value),
        ])

    detail_table = Table(detail_table_data, colWidths=[doc.width * 0.4, doc.width * 0.6])
    detail_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 2*mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2*mm),
        ("LINEBELOW", (0, 0), (-1, -2), 0.3, BORDER_COLOR),
    ]))
    elements.append(detail_table)
    elements.append(Spacer(1, 4*mm))

    # 5. Amount box
    amount = data.get("amount", "0")
    payment_mode = data.get("payment_mode", "CASH")

    amount_box_data = [[
        Paragraph(f"₹ {amount}", style_amount),
    ]]
    amount_table = Table(amount_box_data, colWidths=[doc.width])
    amount_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 1, BORDER_COLOR),
        ("TOPPADDING", (0, 0), (-1, -1), 3*mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3*mm),
    ]))
    elements.append(amount_table)
    elements.append(Spacer(1, 2*mm))

    # Payment mode
    pay_label = f"Payment: {payment_mode}"
    upi_txn = data.get("upi_txn_id")
    if upi_txn:
        pay_label += f" (UTR: {upi_txn})"
    elements.append(Paragraph(pay_label, ParagraphStyle(
        "PayMode", parent=style_label, alignment=TA_CENTER, fontSize=9,
    )))
    elements.append(Spacer(1, 4*mm))

    # 6. QR Code + Verification
    qr_data = f"STAR-{receipt_no}|{date_str}|{seva_name}|₹{amount}"
    qr_img = _create_qr_image(qr_data)

    if qr_img:
        qr_table = Table(
            [[qr_img, Paragraph(
                f"<font size=7 color='#64748B'>Scan to verify<br/>Receipt #{receipt_no}</font>",
                style_footer
            )]],
            colWidths=[30*mm, doc.width - 30*mm],
        )
        qr_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (0, 0), (0, 0), "CENTER"),
        ]))
        elements.append(qr_table)
        elements.append(Spacer(1, 3*mm))

    # 7. Separator + Footer
    elements.append(line_table)
    elements.append(Spacer(1, 2*mm))

    staff = data.get("staff_name", "")
    if staff:
        elements.append(Paragraph(f"Issued by: {staff}", style_footer))

    elements.append(Paragraph("ಸರ್ವೇ ಜನಾಃ ಸುಖಿನೋ ಭವಂತು • Sarve Janah Sukhino Bhavantu", style_footer))
    elements.append(Paragraph(
        "This is a computer-generated receipt. No signature required.",
        style_footer
    ))

    # ── Build PDF ───────────────────────────────────────────────
    doc.build(elements)
    return buf.getvalue()


def save_receipt_pdf(data: dict, output_dir: str = None) -> str:
    """
    Generate and save a PDF receipt to disk.

    Returns:
        str — absolute path to the saved PDF file
    """
    pdf_bytes = generate_receipt_pdf(data)

    if not output_dir:
        output_dir = tempfile.gettempdir()

    receipt_no = data.get("receipt_no", "temp")
    ts = int(datetime.now().timestamp())
    filename = f"receipt_{receipt_no}_{ts}.pdf"
    filepath = os.path.join(output_dir, filename)

    with open(filepath, "wb") as f:
        f.write(pdf_bytes)

    return filepath
