import easyocr
import os
import sys
from PIL import Image
import numpy as np

print("Starting OCR scan on recent candidates...", flush=True)
reader = easyocr.Reader(['en'])

upload_dir = "/Users/ritchie/Desktop/live website /posendwebsite/public/uploads"
candidates = []
for f in os.listdir(upload_dir):
    path = os.path.join(upload_dir, f)
    if os.path.isfile(path) and f.lower().endswith(('.png', '.jpg', '.jpeg')):
        size = os.path.getsize(path)
        mtime = os.path.getmtime(path)
        if 20000 < size < 3000000: # between 20KB and 3MB
            candidates.append((f, size, mtime))

# Sort candidates by mtime descending (newest first)
candidates.sort(key=lambda x: x[2], reverse=True)
print(f"Found {len(candidates)} recent candidates. Scanning top 15 newest...", flush=True)

for filename, size, mtime in candidates[:15]:
    filepath = os.path.join(upload_dir, filename)
    print(f"Scanning {filename} (size: {size} bytes)...", flush=True)
    try:
        image = Image.open(filepath)
        image_np = np.array(image)
        results = reader.readtext(image_np)
        print(f"  -> Found {len(results)} text boxes", flush=True)
        if len(results) > 15:
            texts = [res[1] for res in results[:8]]
            print(f"  -> Sample text: {texts}", flush=True)
            # Break if we find one that looks like a menu
            if any("maggie" in t.lower() or "sandwich" in t.lower() or "burger" in t.lower() or "chai" in t.lower() for t in texts):
                print(f"*** FOUND LIKELY MENU: {filename} ***", flush=True)
                break
    except Exception as e:
        print(f"  -> Error: {e}", flush=True)
