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
You are an expert restaurant menu parser. Your task is to convert raw OCR text from a restaurant menu image into a clean, structured JSON format.

Raw OCR Text:
---
{raw_ocr_text}
---

Instructions:
1. Identify all food/beverage items and group them by logical category names (e.g., Sandwiches, Grilled Sandwiches, Grilled Toasts, Maggie, Pizza, Fries, Burgers, Patty, Wraps).
2. Clean up item names:
   - Extract only the name of the item.
   - NEVER include price options, slashes, numbers, "@" symbols, or price characters in the "name" field (e.g. "Bombay Cold Sandwich @40/@75" should have name "Bombay Cold Sandwich").
   - Remove stray OCR characters.
3. Extract Prices:
   - If an item has multiple price options (like '@40/@75' or '@100/@110' representing Half/Full or Normal/Thin):
     - Put the first/base price as a float in the "price" field (e.g. 40.0 or 100.0).
     - Document the full price options clearly in the "description" field (e.g., "Half: 40 / Full: 75" or "Normal: 100 / Thin: 110").
   - If it has a single price (like '@70' or '@60'), set "price" to that number (e.g. 70.0) and "description" to a clean description like "Delicious French Fries".
4. Infer Vegetarian & Spicy:
   - "is_vegetarian": true/false/null. Infer based on name.
   - "is_spicy": true/false/null.
5. Infer GST and HSN:
   - Assign "gst_rate": 18.0 for beverages/drinks, 5.0 for cooked foods.
   - Assign "hsn_code": "2202" for beverages, "9963" for cooked foods.

Format:
Return ONLY a JSON object matching this schema. Do not include markdown codeblocks or explanations.
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

url = "http://localhost:11434/api/chat"
payload = {
    "model": "qwen2.5:1.5b",
    "messages": [{"role": "user", "content": prompt}],
    "stream": False,
    "format": "json",
    "options": {
        "temperature": 0.1,
        "num_predict": 4096
    }
}

try:
    print("Calling local Qwen2.5 with sample menu...")
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    start = time.time()
    with urllib.request.urlopen(req, timeout=90) as response:
        body = response.read().decode('utf-8')
        elapsed = time.time() - start
        print(f"Success in {elapsed:.2f} seconds!")
        res_json = json.loads(body)
        content = res_json.get("message", {}).get("content", "")
        parsed = json.loads(content.strip())
        print(json.dumps(parsed, indent=2))
except Exception as e:
    print(f"Error: {e}")
