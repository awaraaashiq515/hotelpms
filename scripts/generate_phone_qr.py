import os
import math
import qrcode
from PIL import Image, ImageDraw, ImageFont

def get_font(size, bold=False):
    candidates = [
        ("/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf"),
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNS.ttf",
        "/Library/Fonts/Arial.ttf"
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                index = 1 if bold and path.endswith('.ttc') else 0
                return ImageFont.truetype(path, size, index=index)
            except Exception:
                continue
    return ImageFont.load_default()

def draw_phone_badge(size=90, bg_color=(37, 99, 235), icon_color=(255, 255, 255)):
    """Draw a circular phone receiver icon badge for the center of QR or header"""
    scale = 4
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    
    # Outer white border
    border_w = 4 * scale
    d.ellipse([(0, 0), (s, s)], fill=(255, 255, 255, 255))
    d.ellipse([(border_w, border_w), (s - border_w, s - border_w)], fill=bg_color)
    
    # Draw handset receiver shape inside
    cx, cy = s // 2, s // 2
    r_outer = s * 0.28
    r_inner = s * 0.18
    ear_w = s * 0.14
    ear_h = s * 0.08

    # Phone receiver geometry
    d.arc([cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer], start=125, end=235, fill=icon_color, width=int(s * 0.11))
    # Top earpiece
    d.rounded_rectangle([cx - int(s * 0.22), cy - int(s * 0.27), cx - int(s * 0.08), cy - int(s * 0.13)], radius=int(s * 0.04), fill=icon_color)
    # Bottom mouthpiece
    d.rounded_rectangle([cx - int(s * 0.22), cy + int(s * 0.13), cx - int(s * 0.08), cy + int(s * 0.27)], radius=int(s * 0.04), fill=icon_color)
    
    # Rotate by -45 degrees so handset sits nicely angled
    img = img.rotate(-35, resample=Image.BICUBIC)
    
    resample = Image.Resampling.LANCZOS if hasattr(Image, 'Resampling') else Image.LANCZOS
    return img.resize((size, size), resample)

def make_qr_image(data, size=600, border=2, center_badge=None):
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=12,
        border=border,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGBA")
    
    resample = Image.Resampling.LANCZOS if hasattr(Image, 'Resampling') else Image.LANCZOS
    img = img.resize((size, size), resample)

    if center_badge:
        bw, bh = center_badge.size
        bx = (size - bw) // 2
        by = (size - bh) // 2
        img.paste(center_badge, (bx, by), center_badge)
        
    return img

def create_square_banner(
    output_path,
    qr_data,
    badge_label="CAMERA SCAN KARTE HI NUMBER DIAL HOGA",
    main_title="Scan To Call",
    phone_display="+91 83380 00001",
    subtitle="Scan with any smartphone camera to open dialer",
    primary_color=(37, 99, 235),
    badge_bg=(239, 246, 255),
    badge_text=(29, 78, 216),
    include_center_icon=False
):
    W, H = 1080, 1080
    base = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    draw = ImageDraw.Draw(base)

    # Subtle modern background gradient
    bg_gradient_start = (250, 252, 255)
    bg_gradient_end = (241, 245, 249)
    for y in range(H):
        ratio = y / H
        r = int(bg_gradient_start[0] * (1 - ratio) + bg_gradient_end[0] * ratio)
        g = int(bg_gradient_start[1] * (1 - ratio) + bg_gradient_end[1] * ratio)
        b = int(bg_gradient_start[2] * (1 - ratio) + bg_gradient_end[2] * ratio)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # Outer rounded card
    margin = 36
    draw.rounded_rectangle(
        [margin, margin, W - margin, H - margin],
        radius=40,
        fill=(255, 255, 255, 255),
        outline=(226, 232, 240),
        width=3
    )

    # Top accent line
    accent_w = 400
    draw.rounded_rectangle(
        [W // 2 - accent_w // 2, margin + 2, W // 2 + accent_w // 2, margin + 9],
        radius=4,
        fill=primary_color
    )

    font_badge = get_font(22, bold=True)
    font_title = get_font(52, bold=True)
    font_phone = get_font(52, bold=True)
    font_sub = get_font(26, bold=False)
    font_hint = get_font(22, bold=False)

    # Top pill tag
    tag_text = badge_label.upper()
    bbox = font_badge.getbbox(tag_text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tag_pad_x, tag_pad_y = 28, 12
    pill_box = [
        W // 2 - tw // 2 - tag_pad_x,
        margin + 40,
        W // 2 + tw // 2 + tag_pad_x,
        margin + 40 + th + tag_pad_y * 2
    ]
    draw.rounded_rectangle(pill_box, radius=20, fill=badge_bg)
    draw.text((W // 2, margin + 40 + tag_pad_y + th // 2 - 2), tag_text, font=font_badge, fill=badge_text, anchor="mm")

    # Main Title
    title_y = margin + 138
    draw.text((W // 2, title_y), main_title, font=font_title, fill=(15, 23, 42), anchor="mm")

    # QR Code Frame
    qr_size = 470
    qr_x = (W - qr_size) // 2
    qr_y = title_y + 44
    qr_frame_pad = 22

    # Draw QR code shadow/border container
    draw.rounded_rectangle(
        [qr_x - qr_frame_pad, qr_y - qr_frame_pad, qr_x + qr_size + qr_frame_pad, qr_y + qr_size + qr_frame_pad],
        radius=26,
        fill=(255, 255, 255),
        outline=(203, 213, 225),
        width=3
    )

    center_badge = draw_phone_badge(size=72, bg_color=primary_color) if include_center_icon else None
    qr_img = make_qr_image(qr_data, size=qr_size, border=2, center_badge=center_badge)
    base.paste(qr_img, (qr_x, qr_y), qr_img)

    # Phone Number Card at Bottom (High Contrast Pill)
    phone_card_w = 680
    phone_card_h = 96
    phone_card_x = (W - phone_card_w) // 2
    phone_card_y = qr_y + qr_size + qr_frame_pad + 38

    draw.rounded_rectangle(
        [phone_card_x, phone_card_y, phone_card_x + phone_card_w, phone_card_y + phone_card_h],
        radius=24,
        fill=(15, 23, 42)
    )

    # Phone text
    draw.text(
        (W // 2, phone_card_y + phone_card_h // 2),
        phone_display,
        font=font_phone,
        fill=(255, 255, 255),
        anchor="mm"
    )

    # Subtitle / Instructions
    sub_y = phone_card_y + phone_card_h + 38
    draw.text((W // 2, sub_y), subtitle, font=font_sub, fill=(71, 85, 105), anchor="mm")

    # Footer note without broken glyphs
    draw.text((W // 2, H - margin - 35), "Works instantly with iPhone and Android camera", font=font_hint, fill=(148, 163, 184), anchor="mm")

    # Save
    base.convert("RGB").save(output_path, "PNG", quality=98)
    print("Generated:", output_path)

def create_table_standee(output_path, tel_data, wa_data, phone_display="+91 83380 00001"):
    """Creates a vertical table standee (800x1200) with both Call and WhatsApp QRs side-by-side"""
    W, H = 840, 1180
    base = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    draw = ImageDraw.Draw(base)

    # Gradient background
    for y in range(H):
        ratio = y / H
        r = int(248 * (1 - ratio) + 241 * ratio)
        g = int(250 * (1 - ratio) + 245 * ratio)
        b = int(252 * (1 - ratio) + 249 * ratio)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # Outer border
    draw.rounded_rectangle([30, 30, W - 30, H - 30], radius=32, fill="white", outline=(226, 232, 240), width=3)

    # Header section
    draw.rounded_rectangle([30, 30, W - 30, 190], radius=32, fill=(15, 23, 42))
    # Fill bottom corners of header so they join nicely
    draw.rectangle([30, 150, W - 30, 190], fill=(15, 23, 42))

    font_huge = get_font(44, bold=True)
    font_sub_top = get_font(22, bold=False)
    draw.text((W // 2, 85), "QUICK CONNECT", font=font_huge, fill="white", anchor="mm")
    draw.text((W // 2, 140), "SCAN TO CALL OR CHAT DIRECTLY", font=font_sub_top, fill=(148, 163, 184), anchor="mm")

    # Phone Pill
    draw.rounded_rectangle([150, 225, W - 150, 310], radius=22, fill=(241, 245, 249), outline=(203, 213, 225), width=2)
    font_phone = get_font(42, bold=True)
    draw.text((W // 2, 267), phone_display, font=font_phone, fill=(15, 23, 42), anchor="mm")

    # Two QR Cards
    card_w = 340
    card_h = 470
    card_y = 350

    # Left Card: Call QR
    c1_x = 55
    draw.rounded_rectangle([c1_x, card_y, c1_x + card_w, card_y + card_h], radius=24, fill="white", outline=(191, 219, 254), width=2)
    draw.rounded_rectangle([c1_x, card_y, c1_x + card_w, card_y + 60], radius=24, fill=(37, 99, 235))
    draw.rectangle([c1_x, card_y + 35, c1_x + card_w, card_y + 60], fill=(37, 99, 235))
    font_card_head = get_font(22, bold=True)
    draw.text((c1_x + card_w // 2, card_y + 30), "CALL DIRECTLY", font=font_card_head, fill="white", anchor="mm")

    call_qr = make_qr_image(tel_data, size=280, border=1)
    base.paste(call_qr, (c1_x + (card_w - 280) // 2, card_y + 80), call_qr)

    font_card_desc = get_font(18, bold=False)
    draw.text((c1_x + card_w // 2, card_y + 390), "Scan to auto-dial", font=font_card_desc, fill=(71, 85, 105), anchor="mm")
    draw.text((c1_x + card_w // 2, card_y + 420), "Opens Phone App", font=get_font(16, bold=True), fill=(37, 99, 235), anchor="mm")

    # Right Card: WhatsApp QR
    c2_x = W - 55 - card_w
    draw.rounded_rectangle([c2_x, card_y, c2_x + card_w, card_y + card_h], radius=24, fill="white", outline=(167, 243, 208), width=2)
    draw.rounded_rectangle([c2_x, card_y, c2_x + card_w, card_y + 60], radius=24, fill=(16, 185, 129))
    draw.rectangle([c2_x, card_y + 35, c2_x + card_w, card_y + 60], fill=(16, 185, 129))
    draw.text((c2_x + card_w // 2, card_y + 30), "WHATSAPP CHAT", font=font_card_head, fill="white", anchor="mm")

    wa_qr = make_qr_image(wa_data, size=280, border=1)
    base.paste(wa_qr, (c2_x + (card_w - 280) // 2, card_y + 80), wa_qr)

    draw.text((c2_x + card_w // 2, card_y + 390), "Scan to message us", font=font_card_desc, fill=(71, 85, 105), anchor="mm")
    draw.text((c2_x + card_w // 2, card_y + 420), "Opens WhatsApp", font=get_font(16, bold=True), fill=(16, 185, 129), anchor="mm")

    # Instructions box at bottom
    info_y = card_y + card_h + 35
    draw.rounded_rectangle([55, info_y, W - 55, info_y + 160], radius=20, fill=(248, 250, 252), outline=(226, 232, 240), width=2)
    font_steps_title = get_font(20, bold=True)
    font_step = get_font(19, bold=False)
    draw.text((W // 2, info_y + 32), "HOW TO SCAN:", font=font_steps_title, fill=(15, 23, 42), anchor="mm")
    draw.text((W // 2, info_y + 75), "1. Open Camera or Google Lens on your smartphone", font=font_step, fill=(71, 85, 105), anchor="mm")
    draw.text((W // 2, info_y + 115), "2. Point camera at the QR code and tap the link that appears", font=font_step, fill=(71, 85, 105), anchor="mm")

    # Footer note
    draw.text((W // 2, H - 55), "Thank you for connecting with us!", font=get_font(20, bold=True), fill=(100, 116, 139), anchor="mm")

    base.convert("RGB").save(output_path, "PNG", quality=98)
    print("Generated Standee:", output_path)

def main():
    desktop_dir = "/Users/ritchie/Desktop/QR_8338000001"
    hotel_qr_dir = "/Users/ritchie/Documents/gustflow/hotel/qr_codes"
    os.makedirs(desktop_dir, exist_ok=True)
    os.makedirs(hotel_qr_dir, exist_ok=True)

    raw_phone = "+918338000001"
    formatted_phone = "+91 83380 00001"

    # 1. Direct Dial QR Data: tel:+918338000001
    tel_data = f"tel:{raw_phone}"

    # 2. vCard QR Data
    vcard_data = f"""BEGIN:VCARD
VERSION:3.0
FN:{formatted_phone}
TEL;TYPE=CELL:{raw_phone}
NOTE:Customer Support
END:VCARD"""

    # 3. WhatsApp Direct Chat
    wa_data = f"https://wa.me/918338000001"

    targets = [desktop_dir, hotel_qr_dir]

    for d in targets:
        # RAW High-Resolution Pure QR Codes (1024x1024)
        raw_call = make_qr_image(tel_data, size=1024, border=2)
        raw_call.convert("RGB").save(os.path.join(d, "01_Raw_Dial_Call_QR.png"))

        raw_vcard = make_qr_image(vcard_data, size=1024, border=2)
        raw_vcard.convert("RGB").save(os.path.join(d, "02_Raw_Save_Contact_QR.png"))

        raw_wa = make_qr_image(wa_data, size=1024, border=2)
        raw_wa.convert("RGB").save(os.path.join(d, "03_Raw_WhatsApp_QR.png"))

        # PREMIUM SQUARE BANNERS (1080x1080)
        # 1. Direct Call Banner
        create_square_banner(
            os.path.join(d, "Scan_To_Call_Square.png"),
            qr_data=tel_data,
            badge_label="SCAN WITH CAMERA TO CALL DIRECTLY",
            main_title="Scan To Call Directly",
            phone_display=formatted_phone,
            subtitle="Point phone camera to automatically dial this number",
            primary_color=(37, 99, 235),
            badge_bg=(239, 246, 255),
            badge_text=(29, 78, 216),
            include_center_icon=False
        )

        # 2. Save Contact Banner
        create_square_banner(
            os.path.join(d, "Scan_To_Save_Contact_Square.png"),
            qr_data=vcard_data,
            badge_label="SAVE CONTACT TO PHONE",
            main_title="Scan To Save Contact",
            phone_display=formatted_phone,
            subtitle="Customer can instantly save this number to contacts",
            primary_color=(124, 58, 237),
            badge_bg=(245, 243, 255),
            badge_text=(109, 40, 217),
            include_center_icon=False
        )

        # 3. WhatsApp Banner
        create_square_banner(
            os.path.join(d, "Scan_For_WhatsApp_Square.png"),
            qr_data=wa_data,
            badge_label="CHAT ON WHATSAPP",
            main_title="Chat On WhatsApp",
            phone_display=formatted_phone,
            subtitle="Scan to instantly open WhatsApp chat with us",
            primary_color=(16, 185, 129),
            badge_bg=(236, 253, 245),
            badge_text=(5, 150, 105),
            include_center_icon=False
        )

        # 4. Standee Banner (Ready to Print)
        create_table_standee(
            os.path.join(d, "Ready_To_Print_Standee.png"),
            tel_data=tel_data,
            wa_data=wa_data,
            phone_display=formatted_phone
        )

if __name__ == "__main__":
    main()
