import qrcode
import os
from PIL import Image, ImageDraw, ImageFont

def get_font(size, bold=False):
    paths = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf"
    ]
    for p in paths:
        if os.path.exists(p):
            try:
                index = 1 if bold and p.endswith('.ttc') else 0
                return ImageFont.truetype(p, size, index=index)
            except:
                pass
    return ImageFont.load_default()

def create_contact_card():
    # VERY ROBUST vCard data for Google Lens and iOS
    vcard_data = """BEGIN:VCARD
VERSION:3.0
N:;Kunal;;;
FN:Kunal (AVASA HOTELS)
ORG:AVASA HOTELS
TEL;TYPE=CELL:+918988903456
EMAIL;TYPE=WORK:Kunal@avasahotels.in
ADR;TYPE=WORK:;;SAJJANU VILLE\, Simsa\, MANALI;Manali;Himachal Pradesh;175131;India
URL:https://maps.google.com/?q=SAJJANU+VILLE,+Simsa,+MANALI,+Himachal+Pradesh+175131
END:VCARD"""

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )
    qr.add_data(vcard_data)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white").convert('RGB')
    
    # Resize QR code
    resample_filter = Image.Resampling.LANCZOS if hasattr(Image, 'Resampling') else Image.LANCZOS
    qr_img = qr_img.resize((280, 280), resample_filter)
    
    width, height = 600, 1020
    base_img = Image.new('RGB', (width, height), color=(243, 244, 246))
    draw = ImageDraw.Draw(base_img)
    
    font_huge = get_font(44, bold=True)
    font_small = get_font(22)
    font_title = get_font(20, bold=True)
    font_medium_bold = get_font(26, bold=True)
    font_medium = get_font(26)

    # Header
    draw.rectangle([(0, 0), (width, 160)], fill=(37, 99, 235))
    draw.text((width // 2, 60), "AVASA HOTELS", font=font_huge, fill="white", anchor="mm")
    draw.text((width // 2, 120), "Kunal", font=font_small, fill=(219, 234, 254), anchor="mm")
    
    # QR Code
    qr_w, qr_h = qr_img.size
    qr_x = (width - qr_w) // 2
    qr_y = 210
    
    draw.rounded_rectangle([(qr_x - 15, qr_y - 15), (qr_x + qr_w + 15, qr_y + qr_h + 15)], radius=20, fill="white", outline=(229, 231, 235), width=2)
    base_img.paste(qr_img, (qr_x, qr_y))
    
    scan_y = qr_y + qr_h + 40
    draw.text((width // 2, scan_y), "SCAN TO SAVE CONTACT", font=font_title, fill=(79, 70, 229), anchor="mm")
    
    details_y_start = scan_y + 40
    
    # Box 1: Phone
    draw.rounded_rectangle([(50, details_y_start), (width - 50, details_y_start + 80)], radius=15, fill="white", outline=(229, 231, 235), width=2)
    draw.text((70, details_y_start + 40), "Phone:", font=font_medium_bold, fill=(107, 114, 128), anchor="lm")
    draw.text((180, details_y_start + 40), "+91 89889 03456", font=font_medium, fill=(17, 24, 39), anchor="lm")
    
    # Box 2: Email
    draw.rounded_rectangle([(50, details_y_start + 100), (width - 50, details_y_start + 180)], radius=15, fill="white", outline=(229, 231, 235), width=2)
    draw.text((70, details_y_start + 140), "Email:", font=font_medium_bold, fill=(107, 114, 128), anchor="lm")
    draw.text((180, details_y_start + 140), "Kunal@avasahotels.in", font=font_medium, fill=(17, 24, 39), anchor="lm")
    
    # Box 3: Address
    draw.rounded_rectangle([(50, details_y_start + 200), (width - 50, details_y_start + 320)], radius=15, fill="white", outline=(229, 231, 235), width=2)
    draw.text((70, details_y_start + 240), "Address:", font=font_medium_bold, fill=(107, 114, 128), anchor="lm")
    draw.text((180, details_y_start + 235), "SAJJANU VILLE, Simsa, MANALI,", font=font_medium, fill=(17, 24, 39), anchor="lm")
    draw.text((180, details_y_start + 275), "Manali, Himachal Pradesh 175131", font=font_medium, fill=(17, 24, 39), anchor="lm")
    
    out_path = "/Users/ritchie/Desktop/posendwebsite/Contact_Card_Beautiful.png"
    base_img.save(out_path)
    print("Saved:", out_path)

if __name__ == "__main__":
    create_contact_card()
