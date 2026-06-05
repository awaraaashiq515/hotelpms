import sys
import os
import asyncio
import httpx
import json

sys.path.append(os.path.abspath('menu-scanner/backend'))
from app.services.ocr_service import ocr_service

async def test():
    image_path = "/Users/ritchie/Desktop/live website /posendwebsite/public/uploads/1773731643894-WhatsApp-Image-2026-03-10-at-2.40.52-PM-(2).jpeg"
    if not os.path.exists(image_path):
        print(f"Image not found at {image_path}")
        return
        
    print(f"Running OCR on image: {image_path}...")
    raw_ocr_text = ocr_service.extract_text(image_path)
    
    print("\n--- Raw OCR Text ---")
    print(raw_ocr_text)
    print("-------------------\n")
    
    prompt = f"""
    You are an expert restaurant menu parser. Convert the following raw OCR text into a clean JSON menu.
    
    Raw OCR Text:
    ---
    {raw_ocr_text}
    ---
    
    Instructions:
    1. Identify all food/beverage items and group them by logical category names (e.g. Sandwiches, Grilled Sandwiches, Grilled Toasts, Maggie, Pizza, Fries, Burgers, Patty, Wraps).
    2. For each item:
       - Extract "name": Clean name of the item. Never use price options, slashes, or numbers as item names.
       - Extract "price": Look at the price options next to the item. If there are multiple options (like '40/75' or '40@75'), extract the base price (the first/lowest option, e.g. 40.0) as "price", and put the other option details in the "description" (e.g. "Full: 75").
       - Extract "description": Clean description. Include any pricing variations (e.g. "Half: 40 / Full: 75" or "Double Tikki").
       - Extract "is_vegetarian": true/false/null.
       - Extract "is_spicy": true/false/null.
       - Assign "gst_rate": 18.0 for beverages/drinks, 5.0 for cooked foods.
       - Assign "hsn_code": "2202" for beverages, "9963" for cooked foods.
       
    Format:
    {{
      "restaurant_name": "Sood Chai Bar",
      "currency": "INR",
      "categories": [
        {{
          "category_name": "Category Name",
          "items": [
            {{
              "name": "Item Name",
              "price": 40.0,
              "description": "Half: 40 / Full: 75",
              "is_vegetarian": true,
              "is_spicy": false,
              "gst_rate": 5.0,
              "hsn_code": "9963"
            }}
          ]
        }}
      ]
    }}
    """
    
    print("Sending prompt to local Qwen2.5:1.5b via Ollama...")
    import time
    start_time = time.time()
    
    url = "http://127.0.0.1:11434/api/chat"
    payload = {
        "model": "qwen2.5:1.5b",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.1,
            "num_predict": 4096
        }
    }
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(url, json=payload)
            elapsed = time.time() - start_time
            print(f"Ollama response received in {elapsed:.2s} seconds.")
            
            if res.status_code == 200:
                content = res.json().get("message", {}).get("content", "")
                parsed = json.loads(content.strip())
                print("\n--- Qwen2.5 Parsed Output ---")
                print(json.dumps(parsed, indent=2))
                print("-----------------------------\n")
            else:
                print(f"Failed with status: {res.status_code}")
    except Exception as e:
        print(f"Error calling Qwen: {e}")

if __name__ == '__main__':
    asyncio.run(test())
