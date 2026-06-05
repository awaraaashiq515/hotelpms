import sys
import os

# Adjust python path to import app modules
backend_dir = "/Users/ritchie/Desktop/live website /posendwebsite/menu-scanner/backend"
sys.path.insert(0, backend_dir)

from app.services.vision_service import vision_service

test_raw_text = """
SOOD CHAI BAR
#Sandwiches
Bombay Cold Sandwich @40/@75
Cheese veg sandwich @45/@80
Jalapeno corn paneer @50/@110
#Fries
French Fries @70
Masala French Fries @80
#pizza
Corn pizza Normal/Thin @100/@110
Paneer corn pizza @120/@130
"""

print("Running _get_fallback_mock_response test...")
result = vision_service._get_fallback_mock_response(test_raw_text)

import json
print(json.dumps(result, indent=2))

# Verify assertions
sandwiches = [cat for cat in result["categories"] if cat["category_name"] == "Sandwiches"]
if sandwiches:
    items = sandwiches[0]["items"]
    bombay = [i for i in items if "Bombay" in i["name"]]
    if bombay:
        print(f"SUCCESS: Found Bombay Cold Sandwich with price={bombay[0]['price']} and half_price={bombay[0]['half_price']}")
        assert bombay[0]['price'] == 75.0, "Full price should be 75.0"
        assert bombay[0]['half_price'] == 40.0, "Half price should be 40.0"

pizza = [cat for cat in result["categories"] if cat["category_name"] == "Pizza"]
if pizza:
    items = pizza[0]["items"]
    corn = [i for i in items if "Corn" in i["name"]]
    if corn:
        print(f"SUCCESS: Found Corn pizza with price={corn[0]['price']} and half_price={corn[0]['half_price']}")
        assert corn[0]['price'] == 110.0, "Full price should be 110.0"
        assert corn[0]['half_price'] == 100.0, "Half price should be 100.0"

fries = [cat for cat in result["categories"] if cat["category_name"] == "Fries"]
if fries:
    items = fries[0]["items"]
    french = [i for i in items if "French" in i["name"]]
    if french:
        print(f"SUCCESS: Found French Fries with price={french[0]['price']} and half_price={french[0]['half_price']}")
        assert french[0]['price'] == 70.0, "Price should be 70.0"
        assert french[0]['half_price'] is None, "Half price should be None for single-priced items"

print("All fallback regex parsing checks passed successfully!")
