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
You are an expert restaurant menu parser. Convert raw OCR text from a menu image into a clean, category-grouped list.

Raw OCR Text:
---
{raw_ocr_text}
---

Instructions:
1. Output categories starting with "#" (e.g., "# Sandwiches").
2. Under each category, list the items, one per line, strictly in the format:
   Item Name | Price | Description
3. Clean item names:
   - NEVER include price options, slashes, numbers, or "@" symbols in the name part.
   - Example: "Bombay Cold Sandwich @40/@75" -> "Bombay Cold Sandwich"
4. Extract Prices:
   - If there are multiple price options (like '@40/@75' or '100/110' representing Half/Full):
     - The "Price" field must be the first/base price option (e.g. "40").
     - The "Description" field must document the full pricing details (e.g. "Half: 40 / Full: 75").
   - If there is a single price (like '@70'), the "Price" field must be that price, and the "Description" field should be "Delicious item".
5. Do NOT output any preamble, instructions, JSON, or markdown codeblocks. Start directly with the first category.
"""

url = "http://localhost:11434/api/chat"
payload = {
    "model": "qwen2.5:1.5b",
    "messages": [{"role": "user", "content": prompt}],
    "stream": False,
    "options": {
        "temperature": 0.1,
        "num_predict": 1024
    }
}

try:
    print("Calling local Qwen2.5 with ultra-fast prompt...")
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    start = time.time()
    with urllib.request.urlopen(req, timeout=45) as response:
        body = response.read().decode('utf-8')
        elapsed = time.time() - start
        print(f"Success in {elapsed:.2f} seconds!")
        res_json = json.loads(body)
        content = res_json.get("message", {}).get("content", "")
        print("\n--- Raw LLM Text Output ---")
        print(content)
        print("---------------------------\n")
        
        # Parse the custom format
        parsed_menu = {"categories": []}
        current_cat = None
        for line in content.strip().split("\n"):
            line = line.strip()
            if not line:
                continue
            if line.startswith("#"):
                current_cat = {
                    "category_name": line.lstrip("# ").strip(),
                    "items": []
                }
                parsed_menu["categories"].append(current_cat)
            elif "|" in line:
                parts = [p.strip() for p in line.split("|")]
                if len(parts) >= 2:
                    name = parts[0]
                    price = 0.0
                    try:
                        price = float(parts[1])
                    except:
                        pass
                    desc = parts[2] if len(parts) > 2 else f"Delicious {name}"
                    item = {
                        "name": name,
                        "price": price,
                        "description": desc
                    }
                    if current_cat is None:
                        current_cat = {"category_name": "General", "items": []}
                        parsed_menu["categories"].append(current_cat)
                    current_cat["items"].append(item)
                    
        print("\n--- Parsed Python JSON Object ---")
        print(json.dumps(parsed_menu, indent=2))
        print("---------------------------------\n")
except Exception as e:
    print(f"Error: {e}")
