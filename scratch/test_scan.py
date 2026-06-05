import sys
import os
import asyncio

# Add backend dir to python path
sys.path.append(os.path.abspath('menu-scanner/backend'))

from app.services.ocr_service import ocr_service
from app.services.vision_service import vision_service

async def test():
    image_path = "/Users/ritchie/.gemini/antigravity-ide/brain/2a3d202e-46e9-4367-8bc7-127b33af189b/.tempmediaStorage/media_2a3d202e-46e9-4367-8bc7-127b33af189b_1780482239969.jpg"
    print(f"Running OCR on image: {image_path}...")
    
    # Run OCR
    raw_ocr_text = ocr_service.extract_text(image_path)
    print("\n--- Extracted OCR Text ---")
    print(raw_ocr_text)
    print("--------------------------\n")
    
    # Run Parser
    parsed_menu = await vision_service.extract_menu_structured(image_path, raw_ocr_text)
    
    print("\n--- Parsed Menu Schema ---")
    import json
    print(json.dumps(parsed_menu, indent=2))
    print("--------------------------\n")

if __name__ == '__main__':
    asyncio.run(test())
