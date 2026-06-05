import easyocr
import numpy as np
from PIL import Image

class OCRService:
    def __init__(self):
        # Initializes EasyOCR reader for English language.
        # It downloads models automatically on first launch.
        self.reader = easyocr.Reader(['en'])

    def extract_text(self, image_path: str) -> str:
        try:
            image = Image.open(image_path)
            W, H = image.size
            image_np = np.array(image)
            results = self.reader.readtext(image_np)
            
            if not results:
                return ""
                
            # Group into columns using center X coordinate of bounding box
            full_width_top = []
            full_width_bottom = []
            column_boxes = []
            
            for res in results:
                bbox = res[0]
                xs = [p[0] for p in bbox]
                ys = [p[1] for p in bbox]
                min_x, max_x = min(xs), max(xs)
                min_y, max_y = min(ys), max(ys)
                w = max_x - min_x
                cy = sum(ys) / 4
                
                # Check for full-width headers or footers
                if w > 0.65 * W:
                    if cy < 0.25 * H:
                        full_width_top.append(res)
                    elif cy > 0.75 * H:
                        full_width_bottom.append(res)
                    else:
                        column_boxes.append(res)
                else:
                    column_boxes.append(res)
            
            # Group column boxes into vertical bands/columns
            columns = []
            threshold = W * 0.12 # 12% of image width
            
            for res in column_boxes:
                cx = sum(p[0] for p in res[0]) / 4
                placed = False
                for col in columns:
                    col_avg_cx = sum(sum(p[0] for p in r[0]) / 4 for r in col) / len(col)
                    if abs(cx - col_avg_cx) < threshold:
                        col.append(res)
                        placed = True
                        break
                if not placed:
                    columns.append([res])
            
            # Sort columns from left to right based on their average center X
            columns.sort(key=lambda col: sum(sum(p[0] for p in r[0]) / 4 for r in col) / len(col))
            
            # Sort each column top-to-bottom
            for col in columns:
                col.sort(key=lambda r: sum(p[1] for p in r[0]) / 4)
            
            # Sort full-width items top-to-bottom
            full_width_top.sort(key=lambda r: sum(p[1] for p in r[0]) / 4)
            full_width_bottom.sort(key=lambda r: sum(p[1] for p in r[0]) / 4)
            
            # Flatten everything back into sorted_results
            sorted_results = []
            sorted_results.extend(full_width_top)
            for col in columns:
                sorted_results.extend(col)
            sorted_results.extend(full_width_bottom)
            
            print(f"OCR Column Sorting: Grouped into {len(columns)} columns (top={len(full_width_top)}, bottom={len(full_width_bottom)})")
            
            # Combine extracted text lines together
            extracted_lines = [res[1] for res in sorted_results]
            return "\n".join(extracted_lines)
        except Exception as e:
            print(f"Error during OCR execution: {e}")
            return ""

ocr_service = OCRService()
