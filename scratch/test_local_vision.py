import sys
import os
import asyncio

# Adjust python path
backend_dir = "/Users/ritchie/Desktop/live website /posendwebsite/menu-scanner/backend"
sys.path.insert(0, backend_dir)

from app.services.vision_service import vision_service

async def run_test():
    sample_image = "/Users/ritchie/.gemini/antigravity-ide/brain/a07a4320-b11f-41c1-a36c-80648584b50a/media__1780551048723.png"
    filename = "media__1780551048723.png"
    
    print(f"Testing local Multimodal Vision parsing on sample image: {filename}...")
    
    from app.services.ocr_service import ocr_service
    raw_ocr_text = ocr_service.extract_text(sample_image)
    
    print(f"Extracted Raw OCR Text length: {len(raw_ocr_text)}")
    print(f"Sample of OCR text:\n{raw_ocr_text[:300]}\n...")
    
    # We pass actual raw_ocr_text, and scan_mode = "semantic"
    result = await vision_service.extract_menu_structured(sample_image, raw_ocr_text=raw_ocr_text, scan_mode="semantic")
    
    import json
    print("\n=== Result ===")
    print(json.dumps(result, indent=2))
    print("==============\n")

if __name__ == "__main__":
    asyncio.run(run_test())
