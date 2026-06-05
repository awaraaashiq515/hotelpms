import urllib.request
import urllib.error
import json
import time

raw_ocr_text = """
SOOD CHAI BAR
#Sandwiches
Bombay Cold Sandwich @40/@75
Cold salad sandwich @40/@80
Cheese sandwich @45/@80
Cheese veg sandwich @45/@80
Veg com sandwich @50/@100
Mushroom com sandwich @50/@100
Veg Loaded Sandwich @50/@110
Veg Loaded sandwich @50/@100
Jalapeno corn paneer @50/@110
Zingi parcel sandwich @55/@100
Salad paneer sandwich @60/@120
Paneer Makhani sandwich @75/@140
Paneer Makhani pizza @130/@140
Zingi pizza @140/@150
#Fries
French Fries @70
Masala French Fries @80
Perry Perry Fries @80
Mint fries @80
Saucy Fries @90
#Grilled Burgers
Veg Burger @60
Cheese veg burger @70
Veg paneer Burger @80
Paneer salad burger @80
Cheese Veg paneer @90
Makhani paneer burger @90
Double tikki burger @90
Double tikkicheese @100
Double tikki cheese @110
#Grilled Toasts
Butter Toast @40/@80
Garlic Toast @45/@90
Cheese Garlic Toast @50/@90
Stuffed Garlic Toast @75/@140
Panner Garlic Toast @75/@140
Butter Jam Toast @50/@90
#pizza
Corn pizza Normal/Thin @100/@110
Paneer corn pizza @120/@130
Paneer makhani pizza @130/@140
#Grilled Patty
Aloo Patty @35
Cheese veg Patty @60
Corn veg Patty @65
Loaded Patty @70
#Wraps
Aloo patty wrap @100
Veggies paneer wrap @110
Paneer patty wrap @120
Note: Wi-Fi: soodchaibar
Follow us on Instagram
"""

prompt = f"""
You are an expert restaurant menu parser. Convert the raw OCR text from a menu image into a clean category-grouped JSON menu.

Raw OCR Text:
---
{raw_ocr_text}
---

Instructions:
1. Group items under logical categories (e.g., Sandwiches, Grilled Toasts, Burgers, Maggie, Pizza, Fries, Patty, Wraps).
2. Clean item names:
   - Extract only the name (e.g., "Bombay Cold Sandwich").
   - NEVER include price options, slashes, numbers, or "@" symbols in the item name.
3. Extract Prices:
   - If an item has multiple price options (like '@40/@75' or '100/110' representing Half/Full or Normal/Thin):
     - Set "price" to the first/base option as a float (e.g. 40.0 or 100.0).
     - Document the full pricing info in the "description" field (e.g., "Half: 40 / Full: 75").
   - Otherwise, set "price" to the price number (e.g. 70.0) and "description" to a clean description like "Delicious French Fries".

Format:
Return ONLY a JSON object matching this schema. Do not include explanations or markdown formatting.
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
          "description": "Half: 40 / Full: 75"
        }}
      ]
    }}
  ]
}}
"""

url = "http://localhost:11434/api/chat"
payload = {
    "model": "qwen2.5:1.5b",
    "messages": [{"role": "user", "content": prompt}],
    "stream": False,
    "format": "json",
    "options": {
        "temperature": 0.1,
        "num_predict": 2048
    }
}

try:
    print("Calling local Qwen2.5 with optimized prompt...")
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    start = time.time()
    with urllib.request.urlopen(req, timeout=300) as response:
        body = response.read().decode('utf-8')
        elapsed = time.time() - start
        print(f"Success in {elapsed:.2f} seconds!")
        res_json = json.loads(body)
        content = res_json.get("message", {}).get("content", "")
        parsed = json.loads(content.strip())
        print(json.dumps(parsed, indent=2))
except Exception as e:
    print(f"Error: {e}")
