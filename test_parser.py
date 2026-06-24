import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'menu-scanner/backend'))
from app.services.vision_service import vision_service

vision_text = """Category: #Grilled Sandwiches
- Simple veg sandwich : @45/@80
- Cheese corn mayo sandwich : @45/@80
- Cheese vegSandwich : @45/@80

Category: #Grilled Toasts
- Butter Toast : @40/@80
- Garlic Toast : @45/@90

Category: #Grilled Patties
- Alloo Patty : @35
- Cheese veg Patty : @60
"""

res = vision_service._parse_markdown_to_json(vision_text)
import json
print(json.dumps(res, indent=2))
