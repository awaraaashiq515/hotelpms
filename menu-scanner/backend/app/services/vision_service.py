import json
import httpx
from PIL import Image
import base64
from app.config import settings

class VisionService:
    
    def _infer_veg(self, name_str: str) -> bool:
        non_veg_kws = ["chicken", "mutton", "fish", "egg", "beef", "pork", "prawn", "lamb", "meat", "bacon", "wings", "tikka masala", "non-veg", "non veg", "shrimp", "seafood"]
        nl = name_str.lower()
        if any(kw in nl for kw in non_veg_kws):
            if "veg" in nl and "non-veg" not in nl and "non veg" not in nl:
                return True
            return False
        return True

    def _infer_spicy(self, name_str: str) -> bool:
        spicy_kws = ["spicy", "chilli", "chili", "hot", "schezwan", "masala", "handi", "kadhai", "kolhapuri", "pepper", "jalapeno", "sriracha", "tadka"]
        return any(kw in name_str.lower() for kw in spicy_kws)

    def _infer_tax_hsn(self, name_str: str, category_str: str):
        is_bev = any(k in category_str.lower() or k in name_str.lower() for k in ["drink", "beverage", "soda", "coffee", "tea", "juice", "water", "cola", "shake", "mojito", "smoothie"])
        gst_rate = 18.0 if is_bev else 5.0
        hsn_code = "2202" if is_bev else "9963"
        return gst_rate, hsn_code

    def _safe_parse_price(self, val) -> float:
        if val is None:
            return 0.0
        if isinstance(val, (int, float)):
            return float(val)
        val_str = str(val).strip().replace(',', '')
        import re
        match = re.search(r'\d+(?:\.\d+)?', val_str)
        if match:
            return float(match.group(0))
        return 0.0

    async def _run_text_llm_parser(self, raw_ocr_text: str) -> dict:
        """Sends OCR text to local qwen2.5:1.5b model for structured menu parsing."""
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
        You are a restaurant menu data extractor. Your job is to extract EVERY SINGLE menu item from the OCR text below.

        Raw OCR Text from menu image:
        ---
        {raw_ocr_text_clean}
        ---

        CRITICAL RULES:
        1. Extract EVERY item that has a price next to it. Do NOT skip any item.
        2. If you see patterns like "Item Name @40/@75" or "Item Name 40/75", it means half price is 40, full price is 75.
        3. If single price like "Item Name 120" or "Item Name @120", price is 120, half_price is null.
        4. Group items under category headers. If no category headers, put all items under "Menu Items".
        5. Clean item names - remove prices, @, /, slashes from the name field.
        6. Do NOT hallucinate items. Only extract items that actually appear in the OCR text.
        7. Return ALL items - if there are 26 items in the menu, return all 26.

        Return ONLY this JSON structure with no explanation:
        {{
          "categories": [
            {{
              "name": "Category Name",
              "items": [
                {{
                  "name": "Item Name",
                  "price": 75.0,
                  "half_price": 40.0,
                  "desc": "Delicious item"
                }}
              ]
            }}
          ]
        }}
        """

        url_text = f"{settings.OLLAMA_HOST}/api/chat"
        payload_text = {
            "model": "qwen2.5:1.5b",
            "messages": [{"role": "user", "content": prompt_text}],
            "stream": False,
            "format": "json",
            "options": {"num_predict": 8192, "temperature": 0.0}
        }

        try:
            async with httpx.AsyncClient(timeout=600.0) as client:
                response = await client.post(url_text, json=payload_text)
                if response.status_code == 200:
                    content = response.json().get("message", {}).get("content", "")
                    print(f"Ollama Qwen2.5 Raw Text Response: {content}")
                    content_clean = content.strip()
                    if content_clean.startswith("```json"):
                        content_clean = content_clean[7:]
                    if content_clean.startswith("```"):
                        content_clean = content_clean[3:]
                    if content_clean.endswith("```"):
                        content_clean = content_clean[:-3]
                    content_clean = content_clean.strip()

                    try:
                        parsed = json.loads(content_clean)
                        mapped_categories = []
                        for cat in parsed.get("categories", []):
                            cat_name = cat.get("name", "General")
                            items = []
                            for item in cat.get("items", []):
                                name_val = item.get("name", "").strip().strip(" -$:+@/@/@").strip()
                                if not name_val:
                                    continue
                                price_val = self._safe_parse_price(item.get("price"))
                                half_price_val = item.get("half_price")
                                if half_price_val is not None:
                                    half_price_val = self._safe_parse_price(half_price_val)
                                    if half_price_val == 0.0 and str(item.get("half_price")).strip() not in ['0', '0.0']:
                                        half_price_val = None
                                desc_val = item.get("desc", "").strip() or f"Delicious {name_val}"
                                gst_rate_val, hsn_code_val = self._infer_tax_hsn(name_val, cat_name)
                                items.append({
                                    "name": name_val,
                                    "price": price_val,
                                    "half_price": half_price_val,
                                    "description": desc_val,
                                    "is_vegetarian": self._infer_veg(name_val),
                                    "is_spicy": self._infer_spicy(name_val),
                                    "gst_rate": gst_rate_val,
                                    "hsn_code": hsn_code_val
                                })
                            if items:
                                mapped_categories.append({"category_name": cat_name, "items": items})
                        return {
                            "restaurant_name": "Restaurant Menu",
                            "currency": "INR",
                            "categories": mapped_categories
                        }
                    except Exception as json_err:
                        print(f"JSON Parsing Error from LLM output: {json_err}. Falling back to Regex parser...")
                        return self._parse_markdown_to_json(raw_ocr_text)
                else:
                    err_msg = f"Ollama text API error: {response.status_code} {response.text}"
                    print(err_msg)
                    return self._parse_markdown_to_json(raw_ocr_text)

        except Exception as e:
            err_msg = f"Text LLM parser failed: {e}"
            print(err_msg)
            try:
                with open("/Users/ritchie/Desktop/live website /posendwebsite/scratch/text_error.log", "w") as f:
                    f.write(err_msg)
            except:
                pass
            print("Falling back to Regex parser due to total failure...")
            return self._parse_markdown_to_json(raw_ocr_text)

    async def _run_vision_llm_text_extraction(self, image_path: str, raw_ocr_text: str = "") -> str:
        """Sends the image to local qwen2.5vl:3b vision model to get a plain text transcript."""
        import base64
        import io
        from PIL import Image
        
        try:
            with Image.open(image_path) as img:
                # Resize image aggressively to 800x800 to ensure fast processing (under 15-20 seconds)
                max_size = 800
                if img.width > max_size or img.height > max_size:
                    # LANCZOS is high quality downsampling
                    img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                
                buffered = io.BytesIO()
                # Save as JPEG to reduce base64 payload size and memory footprint
                img.convert('RGB').save(buffered, format="JPEG", quality=85)
                base64_image = base64.b64encode(buffered.getvalue()).decode("utf-8")
        except Exception as e:
            print(f"Failed to read/resize image for vision model: {e}")
            return raw_ocr_text

        prompt_text = """
        You are an expert restaurant menu data extractor. Look at the image and transcribe ALL text from the menu.
        List EVERY SINGLE category and its items with prices in plain text.
        Do NOT skip any items. Be thorough and read the whole page.
        
        Format example:
        Category: STARTERS
        - Item Name 1 : $10.00
        - Item Name 2 : $15.50 / $25.00
        
        Just output the plain text transcription. Do not output JSON.
        """

        url_text = f"{settings.OLLAMA_HOST}/api/chat"
        payload_text = {
            "model": "qwen2.5vl:3b",
            "messages": [
                {
                    "role": "user", 
                    "content": prompt_text,
                    "images": [base64_image]
                }
            ],
            "stream": False,
            "options": {"num_predict": 4096, "temperature": 0.0}
        }

        try:
            print("Sending request to qwen2.5vl:3b vision model for text extraction...")
            async with httpx.AsyncClient(timeout=1200.0) as client:
                response = await client.post(url_text, json=payload_text)
                if response.status_code == 200:
                    content = response.json().get("message", {}).get("content", "")
                    print(f"Ollama Vision Text Response:\n{content}")
                    return content
                else:
                    err_msg = f"Ollama returned error status: {response.status_code}. Response: {response.text}"
                    print(err_msg)
                    try:
                        with open("/Users/ritchie/Desktop/live website /posendwebsite/scratch/vision_error.log", "w") as f:
                            f.write(err_msg)
                    except:
                        pass
                    raise Exception(err_msg)
        except Exception as e:
            err_msg = f"Vision LLM text extraction failed: {e}"
            print(err_msg)
            try:
                with open("/Users/ritchie/Desktop/live website /posendwebsite/scratch/vision_error.log", "w") as f:
                    f.write(err_msg)
            except:
                pass
            raise Exception(err_msg)

    async def extract_menu_structured(self, image_path: str, raw_ocr_text: str = "", scan_mode: str = "semantic") -> dict:
        """
        Parses menu to return structured JSON.
        - scan_mode == "fast": Regex parser. Instantaneous.
        - scan_mode == "semantic": Text LLM (qwen2.5:1.5b) on browser OCR text. Clean accurate AI parsing.
        """
        if scan_mode == "fast":
            print("Fast Scan mode: Running instantaneous Regex parser...")
            return self._parse_markdown_to_json(raw_ocr_text)

        print(f"High Accuracy mode: Using Text LLM to clean Tesseract data...")
        return await self._run_text_llm_parser(raw_ocr_text)

    def _parse_markdown_to_json(self, raw_ocr_text: str) -> dict:
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
        
        price_pattern = re.compile(r'(?:@|Rs\.?|₹|INR|\$)?\s*(\d+(?:\.\d+)?)\s*(?:/-|/-|rs|Rs|/@|/|@)?\s*')
        double_price_pattern = re.compile(
            r'(?:@|Rs\.?|₹|INR|\$)?\s*(\d+(?:\.\d+)?)\s*[\/\-]\s*(?:@|Rs\.?|₹|INR|\$)?\s*(\d+(?:\.\d+)?)\s*(?:/-|/@|rs|Rs)?\s*'
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

        for raw_line in raw_ocr_text.split('\n'):
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
                        name = part[last_end:match.start()].strip(' -$:+@/@/@(=~.\\"|#')
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
                            name = part[last_end:match.start()].strip(' -$:+@/@/@(=~.\\"|#')
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

vision_service = VisionService()
