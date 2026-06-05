import urllib.request
import urllib.error
import json
import time
import re
import asyncio
import httpx

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

async def parse_category_chunk(category_name: str, lines: list) -> list:
    lines_text = "\n".join(lines)
    prompt = f"""
    Clean item names and extract prices for the restaurant menu items under the category "{category_name}".

    Items to parse:
    {lines_text}

    Instructions:
    1. For each item, output a JSON object with:
       - "name": Clean name of the item. Remove any price options, slashes, numbers, or "@" symbols from the name. E.g. "Bombay Cold Sandwich @40/@75" -> "Bombay Cold Sandwich".
       - "price": Price as a float of the base/first option (e.g. 40.0).
       - "desc": If multiple prices exist (e.g. '@40/@75'), write details (e.g. "Half: 40 / Full: 75"). If single price, write "Delicious item".
    2. Return ONLY a JSON list of objects. Do not include category structure or explanations.

    Format:
    [
      {{
        "name": "Item Name",
        "price": 40.0,
        "desc": "Half: 40 / Full: 75"
      }}
    ]
    """
    
    url = "http://localhost:11434/api/chat"
    payload = {
        "model": "qwen2.5:1.5b",
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.0,
            "num_predict": 1024
        }
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            res = await client.post(url, json=payload)
            if res.status_code == 200:
                content = res.json().get("message", {}).get("content", "").strip()
                parsed = json.loads(content)
                # Ensure it is a list
                if isinstance(parsed, list):
                    return parsed
                elif isinstance(parsed, dict) and "items" in parsed:
                    return parsed["items"]
                elif isinstance(parsed, dict):
                    # Maybe it returned key-value or single item
                    return [parsed]
            return []
        except Exception as e:
            print(f"Error parsing chunk {category_name}: {e}")
            return []

async def main():
    # 1. Group lines by category
    lines = [line.strip() for line in raw_ocr_text.split("\n") if line.strip()]
    
    category_indicators = [
        "starter", "main", "side", "dessert", "drink", "beverage", 
        "soup", "bread", "rice", "noodle", "mocktail", "special",
        "coffee", "tea", "menu", "pasta", "burger", "pizza", "maggie", "wrap", "salad", "sandwich"
    ]
    price_pattern = re.compile(r'(?:Rs\.?|₹|INR|\$)?\s*(\d+(?:\.\d+)?)\s*(?:/-|/-|rs|Rs|/@|/|@)?\s*$')
    
    chunks = {}
    current_category = "General"
    
    for line in lines:
        is_cat = False
        lower_line = line.lower()
        if line.startswith("#"):
            is_cat = True
            cat_name = line.strip("#").strip()
        elif any(k in lower_line for k in category_indicators) and not price_pattern.search(line) and len(line) < 25:
            is_cat = True
            cat_name = line
        elif line.isupper() and len(line) < 20 and not re.search(r'\d', line):
            is_cat = True
            cat_name = line
            
        if is_cat:
            current_category = cat_name.title()
            if current_category not in chunks:
                chunks[current_category] = []
        else:
            # Clean lines of metadata
            if len(line) > 2 and not any(k in lower_line for k in ["wi-fi", "instagram", "follow us", "note:"]):
                if current_category not in chunks:
                    chunks[current_category] = []
                chunks[current_category].append(line)
                
    # Remove empty chunks
    chunks = {k: v for k, v in chunks.items() if v}
    
    print("Detected Chunks:")
    for cat, item_lines in chunks.items():
        print(f" - {cat}: {len(item_lines)} lines")
        
    start_time = time.time()
    
    # 2. Run parser in parallel or sequentially (sequential is safer for CPU/Ollama memory, but let's see how fast sequential is)
    all_results = {}
    for cat, item_lines in chunks.items():
        print(f"\nProcessing category: {cat}...")
        parsed_items = await parse_category_chunk(cat, item_lines)
        print(f"Extracted {len(parsed_items)} items for {cat}")
        all_results[cat] = parsed_items
        
    total_time = time.time() - start_time
    print(f"\nCompleted in {total_time:.2f} seconds!")
    print(json.dumps(all_results, indent=2))

if __name__ == "__main__":
    asyncio.run(main())
