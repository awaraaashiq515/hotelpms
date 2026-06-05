import os
import sys

# Adjust python path
backend_dir = "/Users/ritchie/Desktop/live website /posendwebsite/menu-scanner/backend"
sys.path.insert(0, backend_dir)

from app.services.ocr_service import ocr_service

upload_dir = "/Users/ritchie/Desktop/live website /posendwebsite/public/uploads"
# Get files sorted by modification time (most recent first)
files = [os.path.join(upload_dir, f) for f in os.listdir(upload_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
files.sort(key=os.path.getmtime, reverse=True)

# Scan only the top 5 most recent files
print(f"Scanning the 5 most recent files in uploads...")
for path in files[:5]:
    filename = os.path.basename(path)
    print(f"Running OCR on recent file: {filename} ({os.path.getsize(path)} bytes)...")
    text = ocr_service.extract_text(path)
    print(f"--- Text extracted from {filename} ---")
    print(text)
    print("---------------------------------------")
    
    # Check if this looks like our menu
    if "sood" in text.lower() or "chai" in text.lower() or "bombay" in text.lower():
        print(f"\n=== FOUND TARGET MENU FILE: {filename} ===")
        
        # Let's see what the regex fallback outputs for this text!
        from app.services.vision_service import vision_service
        fallback = vision_service._get_fallback_mock_response(text)
        import json
        print("\n=== Fallback output ===")
        print(json.dumps(fallback, indent=2))
        print("=======================\n")
        break
