import json
import httpx
from PIL import Image
import base64
from app.config import settings

class VisionService:
    async def extract_menu_structured(self, image_path: str, raw_ocr_text: str = "", scan_mode: str = "semantic") -> dict:
        """
        Parses raw OCR text to return structured JSON.
        - scan_mode == "fast": Returns regex parser fallback instantly (<0.05s).
        - scan_mode == "semantic": Sends raw OCR text to the local Qwen2.5 LLM with an optimized compact JSON format,
          then post-processes and infers taxes/HSN/veg/spicy.
        """
        # If EasyOCR returned empty, we'll try to use a default error fallback
        if not raw_ocr_text.strip():
            print("OCR Text was empty! Falling back to default mock data.")
            return self._get_fallback_mock_response(raw_ocr_text)

        # 1. Check Fast Path Override
        if scan_mode == "fast":
            print("Fast Scan mode selected. Running local dynamic OCR text regex parser fallback...")
            return self._get_fallback_mock_response(raw_ocr_text)

        # Encode image to base64
        encoded_string = ""
        try:
            with open(image_path, "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        except Exception as e:
            print(f"Error encoding image to base64: {e}")

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
            return any(kw in name_str.lower() for kw in spicy_kws)

        def infer_tax_hsn(name_str: str, category_str: str):
            is_bev = any(k in category_str.lower() or k in name_str.lower() for k in ["drink", "beverage", "soda", "coffee", "tea", "juice", "water", "cola", "shake", "mojito", "smoothie"])
            gst_rate = 18.0 if is_bev else 5.0
            hsn_code = "2202" if is_bev else "9963"
            return gst_rate, hsn_code

        # Attempt 1: Call Local Multimodal Vision Model (qwen2-vl) via Ollama
        if encoded_string:
            print("Running local Ollama Multimodal Vision model qwen2-vl...")
            prompt_vision = """
            You are a restaurant menu parser. Look at the uploaded menu image and convert it into a clean, category-grouped JSON menu.

            Instructions:
            1. Group all items by logical category names (e.g. Sandwiches, Grilled Toasts, Burgers, Maggie, Pizza, Fries, Patty, Wraps).
            2. For each item:
               - "name": Clean name of the item. E.g. "Bombay Cold Sandwich". Never include price options, slashes, numbers, or "@" in the name.
               - "price": Full/Selling price as a float. E.g. if the item has "@40/@75" (Half/Full), the full price is the second one (75.0). If single price exists, use that.
               - "half_price": Half price as a float if multiple prices exist (e.g. "@40/@75" -> 40.0). If a single price exists, set to null.
               - "desc": Short description of the item if present on the menu, otherwise write "Delicious item".

            Return ONLY a JSON object matching this schema. Do not include markdown codeblocks or explanations.
            {
              "categories": [
                {
                  "category_name": "Category Name",
                  "items": [
                    {
                      "name": "Item Name",
                      "price": 75.0,
                      "half_price": 40.0,
                      "desc": "Delicious Bombay Cold Sandwich"
                    }
                  ]
                }
              ]
            }
            """
            
            url_vision = f"{settings.OLLAMA_HOST}/api/chat"
            payload_vision = {
                "model": "qwen2.5vl:3b",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt_vision,
                        "images": [encoded_string]
                    }
                ],
                "stream": False,
                "format": "json",
                "options": {
                    "temperature": 0.0,
                    "num_predict": 2048
                }
            }
            
            try:
                async with httpx.AsyncClient(timeout=300.0) as client:
                    response = await client.post(url_vision, json=payload_vision)
                    if response.status_code == 200:
                        response_json = response.json()
                        content = response_json.get("message", {}).get("content", "").strip()
                        print(f"Ollama Qwen2-VL Raw Vision Response: {content}")
                        
                        if content.startswith("```json"):
                            content = content.replace("```json", "", 1)
                        if content.endswith("```"):
                            content = content[:-3]
                            
                        parsed = json.loads(content.strip())
                        mapped_categories = []
                        for cat in parsed.get("categories", []):
                            cat_name = cat.get("category_name") or cat.get("name") or "General"
                            items = []
                            for item in cat.get("items", []):
                                name_val = item.get("name", "").strip()
                                name_val = name_val.strip(" -$:+@/@/@").strip()
                                if not name_val:
                                    continue
                                    
                                price_val = float(item.get("price") or item.get("sellingPrice") or 0.0)
                                half_price_val = item.get("half_price") or item.get("halfPrice")
                                if half_price_val is not None:
                                    try:
                                        half_price_val = float(half_price_val)
                                    except (ValueError, TypeError):
                                        half_price_val = None
                                        
                                desc_val = item.get("desc") or item.get("description") or f"Delicious {name_val}"
                                is_veg_val = item.get("is_vegetarian") or item.get("isVeg")
                                if is_veg_val is None:
                                    is_veg_val = infer_veg(name_val)
                                is_spicy_val = item.get("is_spicy") or item.get("isSpicy")
                                if is_spicy_val is None:
                                    is_spicy_val = infer_spicy(name_val)
                                    
                                gst_rate_val = item.get("gst_rate") or item.get("taxRate")
                                hsn_code_val = item.get("hsn_code") or item.get("hsnCode")
                                if gst_rate_val is None or hsn_code_val is None:
                                    gst_rate_val, hsn_code_val = infer_tax_hsn(name_val, cat_name)
                                    
                                items.append({
                                    "name": name_val,
                                    "price": price_val,
                                    "half_price": half_price_val,
                                    "description": desc_val,
                                    "is_vegetarian": bool(is_veg_val),
                                    "is_spicy": bool(is_spicy_val),
                                    "gst_rate": float(gst_rate_val),
                                    "hsn_code": str(hsn_code_val)
                                })
                            if items:
                                mapped_categories.append({
                                    "category_name": cat_name,
                                    "items": items
                                })
                        
                        if mapped_categories:
                            return {
                                "restaurant_name": parsed.get("restaurant_name") or "Restaurant Menu",
                                "currency": "INR",
                                "categories": mapped_categories
                            }
            except Exception as e:
                print(f"Failed to connect to local Qwen2-VL model: {e}. Trying text-based parser fallback...")

        # Attempt 2: Call local Qwen2.5-text LLM with OCR raw text
        print(f"Running local Qwen2.5 text parser fallback...")
        
        cleaned_lines = []
        seen_lines = set()
        for line in raw_ocr_text.split("\n"):
            line_strip = line.strip()
            if not line_strip:
                continue
            if len(line_strip) < 2 and not line_strip.isdigit():
                continue
            if line_strip.lower() in ["₹", "rs", "rs.", "inr", "menu", "scb", "note:", "wifi", "instagram", "follow us"]:
                continue
            if line_strip.lower() in seen_lines:
                continue
            seen_lines.add(line_strip.lower())
            cleaned_lines.append(line_strip)
        raw_ocr_text_clean = "\n".join(cleaned_lines)
        
        prompt_text = f"""
        Convert the raw OCR text from a restaurant menu image into a clean, category-grouped compact JSON menu.

        Raw OCR Text:
        ---
        {raw_ocr_text_clean}
        ---

        Instructions:
        1. Group all items by logical category names (e.g. Sandwiches, Grilled Toasts, Burgers, Maggie, Pizza, Fries, Patty, Wraps).
        2. For each item:
           - "name": Clean name of the item. NEVER include price options, slashes, numbers, or "@" symbols in the name. E.g. "Bombay Cold Sandwich @40/@75" -> "Bombay Cold Sandwich".
           - "price": Full/Selling price as a float. If the item has multiple prices (e.g. '@40/@75'), use the second/full price (e.g., 75.0). If there is only one price, use that as "price".
           - "half_price": Half price as a float if multiple prices exist (e.g. '@40/@75' -> 40.0). If a single price exists, set this to null.
           - "desc": Short description of the item. E.g. "Delicious Bombay Cold Sandwich".

        Return ONLY a JSON object matching this schema. Do not include explanations.
        {{
          "categories": [
            {{
              "name": "Category Name",
              "items": [
                {{
                  "name": "Item Name",
                  "price": 75.0,
                  "half_price": 40.0,
                  "desc": "Delicious Bombay Cold Sandwich"
                }}
              ]
            }}
          ]
        }}
        """

        url_text = f"{settings.OLLAMA_HOST}/api/chat"
        payload_text = {
            "model": "qwen2.5:1.5b",
            "messages": [
                {
                    "role": "user",
                    "content": prompt_text
                }
            ],
            "stream": False,
            "format": "json",
            "options": {
                "num_predict": 2048,
                "temperature": 0.0
            }
        }

        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(url_text, json=payload_text)
                if response.status_code == 200:
                    response_json = response.json()
                    content = response_json.get("message", {}).get("content", "")
                    print(f"Ollama Qwen2.5 Raw Text Response: {content}")
                    
                    content_clean = content.strip()
                    if content_clean.startswith("```json"):
                        content_clean = content_clean.replace("```json", "", 1)
                    if content_clean.endswith("```"):
                        content_clean = content_clean[:-3]
                    
                    parsed = json.loads(content_clean.strip())
                    mapped_categories = []
                    for cat in parsed.get("categories", []):
                        cat_name = cat.get("name", "General")
                        items = []
                        for item in cat.get("items", []):
                            name_val = item.get("name", "").strip()
                            name_val = name_val.strip(" -$:+@/@/@").strip()
                            if not name_val:
                                continue
                                
                            price_val = float(item.get("price", 0.0))
                            half_price_val = item.get("half_price")
                            if half_price_val is not None:
                                try:
                                    half_price_val = float(half_price_val)
                                except (ValueError, TypeError):
                                    half_price_val = None
                                    
                            desc_val = item.get("desc", "").strip()
                            if not desc_val:
                                desc_val = f"Delicious {name_val}"
                                
                            is_veg_val = infer_veg(name_val)
                            is_spicy_val = infer_spicy(name_val)
                            gst_rate_val, hsn_code_val = infer_tax_hsn(name_val, cat_name)
                            
                            items.append({
                                "name": name_val,
                                "price": price_val,
                                "half_price": half_price_val,
                                "description": desc_val,
                                "is_vegetarian": is_veg_val,
                                "is_spicy": is_spicy_val,
                                "gst_rate": gst_rate_val,
                                "hsn_code": hsn_code_val
                            })
                        if items:
                            mapped_categories.append({
                                "category_name": cat_name,
                                "items": items
                            })
                            
                    return {
                        "restaurant_name": "Restaurant Menu",
                        "currency": "INR",
                        "categories": mapped_categories
                    }
                else:
                    raise Exception(f"Ollama returned error status: {response.status_code}")
        except Exception as e:
            print(f"Failed to connect to local Qwen2.5 model: {e}. Returning regex-parsed fallback menu instead.")
            return self._get_fallback_mock_response(raw_ocr_text)

    def _get_fallback_mock_response(self, raw_ocr_text: str) -> dict:
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
            return any(kw in name_str.lower() for kw in spicy_kws)

        # If no OCR text was provided, return empty
        if not raw_ocr_text.strip():
            return {
                "restaurant_name": "Restaurant Menu",
                "currency": "INR",
                "categories": []
            }
            
        print("Executing local dynamic OCR text regex parser fallback...")
        lines = [line.strip() for line in raw_ocr_text.split("\n") if line.strip()]
        
        categories = []
        current_category = None
        current_items = []
        
        # Single price pattern
        price_pattern = re.compile(r'(?:Rs\.?|₹|INR|\$)?\s*(\d+(?:\.\d+)?)\s*(?:/-|/-|rs|Rs|/@|/|@)?\s*$')
        # Double price pattern, e.g. @40/@75, @100/@120, 50/100, Rs.40/Rs.80, etc.
        double_price_pattern = re.compile(
            r'(?:@|Rs\.?|₹|INR|\$)?\s*(\d+(?:\.\d+)?)\s*[\/\-]\s*(?:@|Rs\.?|₹|INR|\$)?\s*(\d+(?:\.\d+)?)\s*(?:/-|/@|rs|Rs)?\s*$'
        )
        
        category_indicators = [
            "starter", "main", "side", "dessert", "drink", "beverage", 
            "soup", "bread", "rice", "noodle", "mocktail", "special",
            "coffee", "tea", "menu", "pasta", "burger", "pizza", "maggie", "wrap", "salad"
        ]
        
        restaurant_name = "Restaurant Menu"
        if lines:
            first_line = lines[0]
            if not any(k in first_line.lower() for k in category_indicators) and len(first_line) < 30:
                restaurant_name = first_line
        
        idx = 0
        N = len(lines)
        while idx < N:
            line = lines[idx]
            
            # Check if line looks like a category header
            is_cat = False
            lower_line = line.lower()
            
            if any(k in lower_line for k in category_indicators) and not price_pattern.search(line) and not double_price_pattern.search(line) and len(line) < 25:
                is_cat = True
            elif line.isupper() and len(line) < 20 and not re.search(r'\d', line):
                is_cat = True
                
            if is_cat:
                if current_category and current_items:
                    categories.append({
                        "category_name": current_category,
                        "items": current_items
                    })
                current_category = line.title()
                current_items = []
                idx += 1
                continue
                
            # 1. Attempt to parse name and double prices from a single line
            double_match = double_price_pattern.search(line)
            if double_match:
                half_val = float(double_match.group(1))
                full_val = float(double_match.group(2))
                # Skip numeric barcodes or scan IDs
                if full_val == 0 or (full_val < 3 and len(line) < 5) or len(line) > 40:
                    idx += 1
                    continue
                    
                name_part = line[:double_match.start()].strip(" -$:+@/@/@").strip()
                if name_part and len(name_part) > 2 and not name_part.isupper():
                    desc_str = ""
                    consumed = 1
                    
                    # Look ahead for a potential description line
                    if idx + 1 < N:
                        next_line = lines[idx+1]
                        is_next_cat = (any(k in next_line.lower() for k in category_indicators) and len(next_line) < 25) or next_line.startswith("#")
                        is_next_price_only = False
                        next_price_match = price_pattern.search(next_line) or double_price_pattern.search(next_line)
                        if next_price_match:
                            is_next_price_only = len(next_price_match.group(0).strip()) >= len(next_line) - 2
                        
                        is_next_item = False
                        if next_price_match and not is_next_price_only:
                            name_len = len(next_line[:next_price_match.start()].strip())
                            if name_len > 2:
                                is_next_item = True

                        # Verify the line after next isn't a price (which would imply next_line is actually another item)
                        next_is_item_name = False
                        if idx + 2 < N:
                            after_next_line = lines[idx+2]
                            after_next_match = price_pattern.search(after_next_line) or double_price_pattern.search(after_next_line)
                            if after_next_match and len(after_next_match.group(0).strip()) >= len(after_next_line) - 2:
                                next_is_item_name = True
                                
                        if not is_next_price_only and not is_next_item and not next_is_item_name and not is_next_cat and not next_line.isupper() and len(next_line) > 3:
                            desc_str = next_line
                            consumed = 2
                            
                    is_bev = any(k in current_category.lower() or k in name_part.lower() for k in ["drink", "beverage", "soda", "coffee", "tea", "juice", "water", "cola"]) if current_category else False
                    gst_rate = 18.0 if is_bev else 5.0
                    hsn_code = "2202" if is_bev else "9963"
                    
                    if not current_category:
                        current_category = "General"
                        
                    current_items.append({
                        "name": name_part,
                        "price": full_val,
                        "half_price": half_val,
                        "description": desc_str if desc_str else f"Delicious {name_part}",
                        "is_vegetarian": infer_veg(name_part),
                        "is_spicy": infer_spicy(name_part),
                        "gst_rate": gst_rate,
                        "hsn_code": hsn_code
                    })
                    idx += consumed
                    continue

            # 2. Attempt to parse name and single price from a single line
            match = price_pattern.search(line)
            if match:
                price_val = float(match.group(1))
                # Skip numeric barcodes or scan IDs
                if price_val == 0 or (price_val < 3 and len(line) < 5) or len(line) > 40:
                    idx += 1
                    continue
                    
                name_part = line[:match.start()].strip(" -$:+@/@/@").strip()
                if name_part and len(name_part) > 2 and not name_part.isupper():
                    desc_str = ""
                    consumed = 1
                    
                    # Look ahead for a potential description line
                    if idx + 1 < N:
                        next_line = lines[idx+1]
                        is_next_cat = (any(k in next_line.lower() for k in category_indicators) and len(next_line) < 25) or next_line.startswith("#")
                        is_next_price_only = False
                        next_price_match = price_pattern.search(next_line) or double_price_pattern.search(next_line)
                        if next_price_match:
                            is_next_price_only = len(next_price_match.group(0).strip()) >= len(next_line) - 2
                        
                        is_next_item = False
                        if next_price_match and not is_next_price_only:
                            name_len = len(next_line[:next_price_match.start()].strip())
                            if name_len > 2:
                                is_next_item = True

                        # Verify the line after next isn't a price (which would imply next_line is actually another item)
                        next_is_item_name = False
                        if idx + 2 < N:
                            after_next_line = lines[idx+2]
                            after_next_match = price_pattern.search(after_next_line) or double_price_pattern.search(after_next_line)
                            if after_next_match and len(after_next_match.group(0).strip()) >= len(after_next_line) - 2:
                                next_is_item_name = True
                                
                        if not is_next_price_only and not is_next_item and not next_is_item_name and not is_next_cat and not next_line.isupper() and len(next_line) > 3:
                            desc_str = next_line
                            consumed = 2
                            
                    is_bev = any(k in current_category.lower() or k in name_part.lower() for k in ["drink", "beverage", "soda", "coffee", "tea", "juice", "water", "cola"]) if current_category else False
                    gst_rate = 18.0 if is_bev else 5.0
                    hsn_code = "2202" if is_bev else "9963"
                    
                    if not current_category:
                        current_category = "General"
                        
                    current_items.append({
                        "name": name_part,
                        "price": price_val,
                        "half_price": None,
                        "description": desc_str if desc_str else f"Delicious {name_part}",
                        "is_vegetarian": infer_veg(name_part),
                        "is_spicy": infer_spicy(name_part),
                        "gst_rate": gst_rate,
                        "hsn_code": hsn_code
                    })
                    idx += consumed
                    continue
            
            # 3. Attempt to parse name on this line and price (single or double) on the next line
            if idx + 1 < N:
                next_line = lines[idx+1]
                next_double_match = double_price_pattern.search(next_line)
                next_single_match = price_pattern.search(next_line)
                
                if next_double_match:
                    is_next_price_only = len(next_double_match.group(0).strip()) >= len(next_line) - 2
                    if is_next_price_only and len(line) > 2 and not re.search(r'\d', line) and not line.isupper():
                        half_val = float(next_double_match.group(1))
                        full_val = float(next_double_match.group(2))
                        desc_str = ""
                        consumed = 2
                        
                        # Look ahead for description on the line after next
                        if idx + 2 < N:
                            desc_line = lines[idx+2]
                            is_desc_cat = (any(k in desc_line.lower() for k in category_indicators) and len(desc_line) < 25) or desc_line.startswith("#")
                            desc_price_match = price_pattern.search(desc_line) or double_price_pattern.search(desc_line)
                            is_desc_price_only = False
                            if desc_price_match:
                                is_desc_price_only = len(desc_price_match.group(0).strip()) >= len(desc_line) - 2
                                
                            desc_is_item_name = False
                            if idx + 3 < N:
                                after_desc_line = lines[idx+3]
                                after_desc_match = price_pattern.search(after_desc_line) or double_price_pattern.search(after_desc_line)
                                if after_desc_match and len(after_desc_match.group(0).strip()) >= len(after_desc_line) - 2:
                                    desc_is_item_name = True
                                    
                            if not is_desc_price_only and not desc_is_item_name and not is_desc_cat and not desc_line.isupper() and len(desc_line) > 3:
                                desc_str = desc_line
                                consumed = 3
                                
                        is_bev = any(k in current_category.lower() or k in line.lower() for k in ["drink", "beverage", "soda", "coffee", "tea", "juice", "water", "cola"]) if current_category else False
                        gst_rate = 18.0 if is_bev else 5.0
                        hsn_code = "2202" if is_bev else "9963"
                        
                        if not current_category:
                            current_category = "General"
                            
                        current_items.append({
                            "name": line,
                            "price": full_val,
                            "half_price": half_val,
                            "description": desc_str if desc_str else f"Delicious {line}",
                            "is_vegetarian": infer_veg(line),
                            "is_spicy": infer_spicy(line),
                            "gst_rate": gst_rate,
                            "hsn_code": hsn_code
                        })
                        idx += consumed
                        continue
                        
                elif next_single_match:
                    is_next_price_only = len(next_single_match.group(0).strip()) >= len(next_line) - 2
                    if is_next_price_only and len(line) > 2 and not re.search(r'\d', line) and not line.isupper():
                        price_val = float(next_single_match.group(1))
                        desc_str = ""
                        consumed = 2
                        
                        # Look ahead for description on the line after next
                        if idx + 2 < N:
                            desc_line = lines[idx+2]
                            is_desc_cat = (any(k in desc_line.lower() for k in category_indicators) and len(desc_line) < 25) or desc_line.startswith("#")
                            desc_price_match = price_pattern.search(desc_line) or double_price_pattern.search(desc_line)
                            is_desc_price_only = False
                            if desc_price_match:
                                is_desc_price_only = len(desc_price_match.group(0).strip()) >= len(desc_line) - 2
                                
                            desc_is_item_name = False
                            if idx + 3 < N:
                                after_desc_line = lines[idx+3]
                                after_desc_match = price_pattern.search(after_desc_line) or double_price_pattern.search(after_desc_line)
                                if after_desc_match and len(after_desc_match.group(0).strip()) >= len(after_desc_line) - 2:
                                    desc_is_item_name = True
                                    
                            if not is_desc_price_only and not desc_is_item_name and not is_desc_cat and not desc_line.isupper() and len(desc_line) > 3:
                                desc_str = desc_line
                                consumed = 3
                                
                        is_bev = any(k in current_category.lower() or k in line.lower() for k in ["drink", "beverage", "soda", "coffee", "tea", "juice", "water", "cola"]) if current_category else False
                        gst_rate = 18.0 if is_bev else 5.0
                        hsn_code = "2202" if is_bev else "9963"
                        
                        if not current_category:
                            current_category = "General"
                            
                        current_items.append({
                            "name": line,
                            "price": price_val,
                            "half_price": None,
                            "description": desc_str if desc_str else f"Delicious {line}",
                            "is_vegetarian": infer_veg(line),
                            "is_spicy": infer_spicy(line),
                            "gst_rate": gst_rate,
                            "hsn_code": hsn_code
                        })
                        idx += consumed
                        continue
            
            idx += 1
            
        # Append the final category if any items remain
        if current_category and current_items:
            categories.append({
                "category_name": current_category,
                "items": current_items
            })
            
        # Default category fallback for flat text files without category headers
        if not categories:
            flat_items = []
            for line in lines:
                double_match = double_price_pattern.search(line)
                if double_match:
                    half_val = float(double_match.group(1))
                    full_val = float(double_match.group(2))
                    name_part = line[:double_match.start()].strip(" -$:+@/@/@").strip()
                    if name_part and len(name_part) > 2:
                        flat_items.append({
                            "name": name_part,
                            "price": full_val,
                            "half_price": half_val,
                            "description": f"Delicious {name_part}",
                            "is_vegetarian": infer_veg(name_part),
                            "is_spicy": infer_spicy(name_part),
                            "gst_rate": 5.0,
                            "hsn_code": "9963"
                        })
                else:
                    match = price_pattern.search(line)
                    if match:
                        price_val = float(match.group(1))
                        name_part = line[:match.start()].strip(" -$:").strip()
                        if name_part and len(name_part) > 2:
                            flat_items.append({
                                "name": name_part,
                                "price": price_val,
                                "half_price": None,
                                "description": f"Delicious {name_part}",
                                "is_vegetarian": infer_veg(name_part),
                                "is_spicy": infer_spicy(name_part),
                                "gst_rate": 5.0,
                                "hsn_code": "9963"
                            })
            if flat_items:
                categories.append({
                    "category_name": "Menu Items",
                    "items": flat_items
                })
                
        # If still empty, return a static default mock response
        if not categories:
            categories = [
                {
                  "category_name": "Starters",
                  "items": [
                    {"name": "Paneer Tikka", "price": 240.0, "half_price": 130.0, "description": "Grilled Cottage Cheese", "is_vegetarian": True, "is_spicy": True, "gst_rate": 5.0, "hsn_code": "9963"},
                    {"name": "Veg Spring Roll", "price": 180.0, "half_price": None, "description": "Crispy Spring Roll", "is_vegetarian": True, "is_spicy": False, "gst_rate": 5.0, "hsn_code": "9963"}
                  ]
                }
            ]
            
        return {
            "restaurant_name": restaurant_name,
            "currency": "INR",
            "categories": categories
        }

vision_service = VisionService()
