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

def draw_instagram_icon(size=120):
    """Draw a clean Instagram camera glyph icon with Instagram gradient background"""
    scale = 4
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Rounded rectangle background with Instagram colors
    # Smooth diagonal gradient: (254, 218, 117) -> (214, 41, 118) -> (79, 91, 213)
    rad = int(s * 0.28)
    
    # Draw gradient by masking
    grad = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(grad)
    for y in range(s):
        for x in range(s):
            # diagonal factor
            t = (x + y) / (2.0 * s)
            if t < 0.5:
                sub_t = t / 0.5
                # Yellow to Pink
                r = int(254 * (1 - sub_t) + 214 * sub_t)
                g = int(218 * (1 - sub_t) + 41 * sub_t)
                b = int(117 * (1 - sub_t) + 118 * sub_t)
            else:
                sub_t = (t - 0.5) / 0.5
                # Pink to Purple-Blue
                r = int(214 * (1 - sub_t) + 79 * sub_t)
                g = int(41 * (1 - sub_t) + 91 * sub_t)
                b = int(118 * (1 - sub_t) + 213 * sub_t)
            grad.putpixel((x, y), (r, g, b, 255))

    mask = Image.new("L", (s, s), 0)
    m_draw = ImageDraw.Draw(mask)
    m_draw.rounded_rectangle([0, 0, s, s], radius=rad, fill=255)
    
    img.paste(grad, (0, 0), mask)
    d = ImageDraw.Draw(img)

    # White camera icon
    line_w = max(4, int(s * 0.075))
    cam_margin = int(s * 0.22)
    cam_rad = int(s * 0.18)
    d.rounded_rectangle(
        [cam_margin, cam_margin, s - cam_margin, s - cam_margin],
        radius=cam_rad,
        outline=(255, 255, 255, 255),
        width=line_w
    )

    # Lens circle
    cx, cy = s // 2, s // 2
    lens_r = int(s * 0.19)
    d.ellipse(
        [cx - lens_r, cy - lens_r, cx + lens_r, cy + lens_r],
        outline=(255, 255, 255, 255),
        width=line_w
    )

    # Flash dot
    dot_r = int(s * 0.045)
    dot_cx = s - cam_margin - int(s * 0.13)
    dot_cy = cam_margin + int(s * 0.13)
    d.ellipse(
        [dot_cx - dot_r, dot_cy - dot_r, dot_cx + dot_r, dot_cy + dot_r],
        fill=(255, 255, 255, 255)
    )

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
        # White circle background for badge
        pad = 8
        d = ImageDraw.Draw(img)
        d.ellipse([bx - pad, by - pad, bx + bw + pad, by + bh + pad], fill="white")
        img.paste(center_badge, (bx, by), center_badge)
        
    return img

def create_instagram_square(output_path, qr_data, username="@sumit_garments_2025", brand_name="SUMIT GARMENTS"):
    W, H = 1080, 1080
    base = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    draw = ImageDraw.Draw(base)

    # Subtle modern background
    bg_gradient_start = (255, 250, 252)
    bg_gradient_end = (248, 244, 255)
    for y in range(H):
        ratio = y / H
        r = int(bg_gradient_start[0] * (1 - ratio) + bg_gradient_end[0] * ratio)
        g = int(bg_gradient_start[1] * (1 - ratio) + bg_gradient_end[1] * ratio)
        b = int(bg_gradient_start[2] * (1 - ratio) + bg_gradient_end[2] * ratio)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    margin = 36
    draw.rounded_rectangle(
        [margin, margin, W - margin, H - margin],
        radius=40,
        fill=(255, 255, 255, 255),
        outline=(238, 226, 245),
        width=3
    )

    # Top accent bar in Instagram Pink/Purple
    accent_w = 420
    draw.rounded_rectangle(
        [W // 2 - accent_w // 2, margin + 2, W // 2 + accent_w // 2, margin + 9],
        radius=4,
        fill=(225, 48, 108)
    )

    font_badge = get_font(21, bold=True)
    font_brand = get_font(26, bold=True)
    font_title = get_font(52, bold=True)
    font_handle = get_font(44, bold=True)
    font_sub = get_font(24, bold=False)
    font_hint = get_font(20, bold=False)

    # Top pill tag: FOLLOW US ON INSTAGRAM
    tag_text = "FOLLOW US ON INSTAGRAM"
    bbox = font_badge.getbbox(tag_text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tag_pad_x, tag_pad_y = 26, 11
    pill_box = [
        W // 2 - tw // 2 - tag_pad_x,
        margin + 36,
        W // 2 + tw // 2 + tag_pad_x,
        margin + 36 + th + tag_pad_y * 2
    ]
    draw.rounded_rectangle(pill_box, radius=20, fill=(253, 242, 248))
    draw.text((W // 2, margin + 36 + tag_pad_y + th // 2 - 2), tag_text, font=font_badge, fill=(219, 39, 119), anchor="mm")

    # Main Brand & Title
    title_y = margin + 128
    draw.text((W // 2, title_y), brand_name, font=font_brand, fill=(156, 39, 176), anchor="mm")
    draw.text((W // 2, title_y + 44), "Scan To Follow Profile", font=font_title, fill=(15, 23, 42), anchor="mm")

    # QR Code Frame
    qr_size = 450
    qr_x = (W - qr_size) // 2
    qr_y = title_y + 85
    qr_frame_pad = 20

    # Draw QR frame container
    draw.rounded_rectangle(
        [qr_x - qr_frame_pad, qr_y - qr_frame_pad, qr_x + qr_size + qr_frame_pad, qr_y + qr_size + qr_frame_pad],
        radius=26,
        fill=(255, 255, 255),
        outline=(244, 204, 226),
        width=3
    )

    # Instagram badge for center
    insta_badge = draw_instagram_icon(size=80)
    qr_img = make_qr_image(qr_data, size=qr_size, border=2, center_badge=insta_badge)
    base.paste(qr_img, (qr_x, qr_y), qr_img)

    # Bottom Handle Card (Instagram Gradient pill style)
    handle_card_w = 660
    handle_card_h = 92
    handle_card_x = (W - handle_card_w) // 2
    handle_card_y = qr_y + qr_size + qr_frame_pad + 34

    draw.rounded_rectangle(
        [handle_card_x, handle_card_y, handle_card_x + handle_card_w, handle_card_y + handle_card_h],
        radius=24,
        fill=(17, 24, 39)
    )

    # Mini Instagram icon inside pill
    mini_icon = draw_instagram_icon(size=46)
    base.paste(mini_icon, (handle_card_x + 28, handle_card_y + (handle_card_h - 46) // 2), mini_icon)

    draw.text(
        (handle_card_x + 90 + (handle_card_w - 90) // 2, handle_card_y + handle_card_h // 2),
        username,
        font=font_handle,
        fill=(255, 255, 255),
        anchor="mm"
    )

    # Subtitle instructions
    sub_y = handle_card_y + handle_card_h + 34
    draw.text((W // 2, sub_y), "Open Camera or Instagram to instantly open profile", font=font_sub, fill=(100, 116, 139), anchor="mm")

    # Footer note
    draw.text((W // 2, H - margin - 32), "Stay updated with our latest collection & offers", font=font_hint, fill=(156, 163, 175), anchor="mm")

    base.convert("RGB").save(output_path, "PNG", quality=98)
    print("Generated Instagram Square:", output_path)

def create_instagram_standee(output_path, qr_data, username="@sumit_garments_2025", brand_name="SUMIT GARMENTS"):
    """Vertical Print Standee (840x1180) for counter display"""
    W, H = 840, 1180
    base = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    draw = ImageDraw.Draw(base)

    # Subtle vertical gradient background
    for y in range(H):
        ratio = y / H
        r = int(255 * (1 - ratio) + 248 * ratio)
        g = int(252 * (1 - ratio) + 245 * ratio)
        b = int(254 * (1 - ratio) + 252 * ratio)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # Outer border
    draw.rounded_rectangle([28, 28, W - 28, H - 28], radius=32, fill="white", outline=(238, 226, 245), width=3)

    # Header section with dark slate gradient
    header_h = 190
    draw.rounded_rectangle([28, 28, W - 28, header_h], radius=32, fill=(15, 23, 42))
    draw.rectangle([28, 140, W - 28, header_h], fill=(15, 23, 42))

    # Top Instagram icon in header
    h_icon = draw_instagram_icon(size=56)
    base.paste(h_icon, (50, 48), h_icon)

    font_head_brand = get_font(34, bold=True)
    font_head_sub = get_font(20, bold=False)
    draw.text((125, 62), brand_name, font=font_head_brand, fill="white")
    draw.text((125, 102), "OFFICIAL INSTAGRAM PAGE", font=font_head_sub, fill=(244, 114, 182))

    # Pill for handle
    pill_y = 225
    draw.rounded_rectangle([110, pill_y, W - 110, pill_y + 85], radius=22, fill=(253, 242, 248), outline=(244, 204, 226), width=2)
    font_handle_big = get_font(38, bold=True)
    draw.text((W // 2, pill_y + 42), username, font=font_handle_big, fill=(190, 24, 93), anchor="mm")

    # Center QR Card
    card_w = 560
    card_h = 560
    card_x = (W - card_w) // 2
    card_y = 345

    draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + card_h], radius=28, fill="white", outline=(226, 232, 240), width=3)
    
    # Title above QR
    draw.text((W // 2, card_y + 40), "SCAN WITH YOUR PHONE", font=get_font(22, bold=True), fill=(71, 85, 105), anchor="mm")

    qr_size = 400
    insta_badge = draw_instagram_icon(size=72)
    qr_img = make_qr_image(qr_data, size=qr_size, border=2, center_badge=insta_badge)
    base.paste(qr_img, (card_x + (card_w - qr_size) // 2, card_y + 75), qr_img)

    draw.text((W // 2, card_y + card_h - 40), "Point camera & tap link to open", font=get_font(20, bold=True), fill=(219, 39, 119), anchor="mm")

    # Instructions box at bottom
    info_y = card_y + card_h + 35
    draw.rounded_rectangle([55, info_y, W - 55, info_y + 130], radius=20, fill=(248, 250, 252), outline=(226, 232, 240), width=2)
    font_step_title = get_font(19, bold=True)
    font_step = get_font(18, bold=False)
    draw.text((W // 2, info_y + 30), "HOW TO SCAN:", font=font_step_title, fill=(15, 23, 42), anchor="mm")
    draw.text((W // 2, info_y + 65), "1. Open Camera, Instagram, or Google Lens on smartphone", font=font_step, fill=(71, 85, 105), anchor="mm")
    draw.text((W // 2, info_y + 95), "2. Scan the code to view profile, new arrivals & collections", font=font_step, fill=(71, 85, 105), anchor="mm")

    # Footer note
    draw.text((W // 2, H - 45), "Thank you for visiting Sumit Garments!", font=get_font(20, bold=True), fill=(100, 116, 139), anchor="mm")

    base.convert("RGB").save(output_path, "PNG", quality=98)
    print("Generated Instagram Standee:", output_path)

def main():
    target_url = "https://www.instagram.com/sumit_garments_2025?stkn=MWlvMTFqNWsyZzhj&utm_source=qr"
    username = "@sumit_garments_2025"
    brand_name = "SUMIT GARMENTS"

    desktop_dir = "/Users/ritchie/Desktop/Instagram_QR_Sumit_Garments"
    hotel_dir = "/Users/ritchie/Documents/gustflow/hotel/qr_codes/instagram"
    os.makedirs(desktop_dir, exist_ok=True)
    os.makedirs(hotel_dir, exist_ok=True)

    targets = [desktop_dir, hotel_dir]

    for d in targets:
        # 1. Pure High-Resolution QR (1024x1024)
        raw_qr = make_qr_image(target_url, size=1024, border=2, center_badge=draw_instagram_icon(size=140))
        raw_qr.convert("RGB").save(os.path.join(d, "01_Raw_Instagram_QR.png"))

        # 2. Instagram Banner Square (1080x1080)
        create_instagram_square(
            os.path.join(d, "Instagram_Profile_Square.png"),
            qr_data=target_url,
            username=username,
            brand_name=brand_name
        )

        # 3. Print Standee Poster (840x1180)
        create_instagram_standee(
            os.path.join(d, "Instagram_Standee_Poster.png"),
            qr_data=target_url,
            username=username,
            brand_name=brand_name
        )

    print("All Instagram QR codes successfully generated!")

if __name__ == "__main__":
    main()
