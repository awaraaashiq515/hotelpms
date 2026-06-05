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
Convert the raw OCR text from a restaurant menu image into a clean, category-grouped hybrid JSON menu.

Raw OCR Text:
---
{raw_ocr_text}
---

Instructions:
1. Identify all items and group them by logical category names (e.g. Sandwiches, Grilled Toasts, Burgers, Maggie, Pizza, Fries, Patty, Wraps).
2. For each item under a category, format it strictly as a JSON array of 3 elements:
   [Clean Item Name, Price, Description/Alternate Prices]
3. Clean names:
   - Clean item names must not contain slashes, numbers, or "@" symbols. E.g. "Bombay Cold Sandwich @40/@75" -> "Bombay Cold Sandwich".
4. Extract Prices:
   - The price must be a float of the base/first price option (e.g. 40.0).
   - Description must contain alternate price details if multiple options exist (e.g. "Half: 40 / Full: 75"). If single price, leave description empty.

Return ONLY a JSON object matching this schema. Do not include explanations.
Format:
{{
  "categories": [
    {{
      "name": "Category Name",
      "items": [
        ["Item Name", 40.0, "Half: 40 / Full: 75"]
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
        "temperature": 0.0,
        "num_predict": 2048
    }
}

try:
    print("Calling Qwen with hybrid JSON...")
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    start = time.time()
    with urllib.request.urlopen(req, timeout=120) as response:
        body = response.read().decode('utf-8')
        elapsed = time.time() - start
        print(f"Success in {elapsed:.2f} seconds!")
        res_json = json.loads(body)
        content = res_json.get("message", {}).get("content", "").strip()
        parsed = json.loads(content)
        print(json.dumps(parsed, indent=2))
        total_items = sum(len(cat.get("items", [])) for cat in parsed.get("categories", []))
        print(f"Total items parsed: {total_items}")
except Exception as e:
    import traceback
    traceback.print_exc()
