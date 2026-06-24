import re

with open("app/services/vision_service.py", "r") as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if "def _parse_markdown_to_json(self, raw_ocr_text: str) -> dict:" in line:
        start_idx = i
        break

if start_idx != -1:
    for i in range(start_idx + 1, len(lines)):
        if "vision_service = VisionService()" in lines[i]:
            end_idx = i
            break

if start_idx != -1 and end_idx != -1:
    new_func = """    def _parse_markdown_to_json(self, raw_ocr_text: str) -> dict:
        import re
        
        # Helper functions for dynamic inference
        def infer_veg(name_str: str) -> bool:
            non_veg_kws = ["chicken", "mutton", "fish", "egg", "beef", "pork", "prawn", "lamb", "meat", "bacon", "wings", "tikka masala", "non-veg", "non veg", "shrimp", "seafood"]
            nl = name_str.lower()
            if any(kw in nl for kw in non_veg_kws):
                if "veg" in nl and "non-veg" not in nl and "non veg" not in nl:
                    return True
                return False
            return True

        def infer_spicy(name_str: str) -> bool:
            spicy_kws = ["spicy", "chilli", "chili", "hot", "schezwan", "masala", "handi", "kadhai", "kolhapuri", "pepper", "jalapeno", "sriracha", "tadka"]
            return any(kw in str(name_str).lower() for kw in spicy_kws)

        # If no OCR text was provided, return empty
        if not raw_ocr_text.strip():
            return {
                "restaurant_name": "Restaurant Menu",
                "currency": "INR",
                "categories": []
            }
            
        print("Executing local dynamic OCR text regex parser fallback...")
        
        categories = []
        current_category = "General"
        current_items = []
        
        price_pattern = re.compile(r'(?:@|Rs\\.?|₹|INR|\\$)?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:/-|/-|rs|Rs|/@|/|@)?\\s*')
        double_price_pattern = re.compile(
            r'(?:@|Rs\\.?|₹|INR|\\$)?\\s*(\\d+(?:\\.\\d+)?)\\s*[\\/\\-]\\s*(?:@|Rs\\.?|₹|INR|\\$)?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:/-|/@|rs|Rs)?\\s*'
        )
        
        category_indicators = [
            "starter", "main", "side", "dessert", "drink", "beverage", 
            "soup", "bread", "rice", "noodle", "mocktail", "special",
            "coffee", "tea", "menu", "pasta", "burger", "pizza", "maggie", "wrap", "salad",
            "sandwich", "toast", "patty"
        ]

        def is_category_line(line: str) -> bool:
            lower_line = line.lower()
            if lower_line.startswith("category:"): return True
            if lower_line.startswith("#"): return True
            if any(k in lower_line for k in category_indicators) and len(line) < 40 and not any(char.isdigit() for char in line): return True
            return False

        for raw_line in raw_ocr_text.split('\\n'):
            raw_line = raw_line.strip()
            if not raw_line: continue
            
            # Check for category header
            if is_category_line(raw_line):
                clean_cat = raw_line.replace('Category:', '').replace('#', '').strip()
                if clean_cat and len(clean_cat) > 2:
                    if current_items:
                        categories.append({"category_name": current_category, "items": current_items})
                        current_items = []
                    current_category = clean_cat.title()
                continue
                
            # Split line by | since Tesseract often mashes columns
            for part in raw_line.split('|'):
                part = part.strip()
                if not part: continue
                
                # Check for double price first (@45/@80)
                double_matches = list(double_price_pattern.finditer(part))
                if double_matches:
                    last_end = 0
                    for match in double_matches:
                        name = part[last_end:match.start()].strip(' -$:+@/@/@(=~.\\\\"|#')
                        if len(name) > 2 and not name.isupper() and not name.isnumeric():
                            half_val = float(match.group(1))
                            full_val = float(match.group(2))
                            if full_val > 5: # basic sanity check
                                gst_rate_val, hsn_code_val = self._infer_tax_hsn(name, current_category)
                                current_items.append({
                                    "name": name,
                                    "price": full_val,
                                    "half_price": half_val,
                                    "description": f"Delicious {name}",
                                    "is_vegetarian": infer_veg(name),
                                    "is_spicy": infer_spicy(name),
                                    "gst_rate": gst_rate_val,
                                    "hsn_code": hsn_code_val
                                })
                        last_end = match.end()
                else:
                    # Check for single price
                    single_matches = list(price_pattern.finditer(part))
                    if single_matches:
                        last_end = 0
                        for match in single_matches:
                            name = part[last_end:match.start()].strip(' -$:+@/@/@(=~.\\\\"|#')
                            if len(name) > 2 and not name.isupper() and not name.isnumeric():
                                val = float(match.group(1))
                                if val > 5: # basic sanity check
                                    gst_rate_val, hsn_code_val = self._infer_tax_hsn(name, current_category)
                                    current_items.append({
                                        "name": name,
                                        "price": val,
                                        "half_price": None,
                                        "description": f"Delicious {name}",
                                        "is_vegetarian": infer_veg(name),
                                        "is_spicy": infer_spicy(name),
                                        "gst_rate": gst_rate_val,
                                        "hsn_code": hsn_code_val
                                    })
                            last_end = match.end()

        if current_items:
            categories.append({"category_name": current_category, "items": current_items})

        return {
            "restaurant_name": "Restaurant Menu",
            "currency": "INR",
            "categories": categories
        }

"""
    new_lines = lines[:start_idx] + [new_func] + lines[end_idx:]
    with open("app/services/vision_service.py", "w") as f:
        f.writelines(new_lines)
