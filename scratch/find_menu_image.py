import easyocr
import os
from PIL import Image
import numpy as np

print("Initializing EasyOCR...")
reader = easyocr.Reader(['en'])

upload_dir = "/Users/ritchie/Desktop/live website /posendwebsite/public/uploads"
files = [f for f in os.listdir(upload_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]

print(f"Scanning {len(files)} files in {upload_dir}...")
for filename in files:
    filepath = os.path.join(upload_dir, filename)
    try:
        image = Image.open(filepath)
        # Skip very large files or non-RGB if needed, but standard images are fine
        image_np = np.array(image)
        results = reader.readtext(image_np)
        if len(results) > 10:
            print(f"FOUND MENU: {filename} with {len(results)} text boxes")
            # Print first few texts to see if it's the right one
            texts = [res[1] for res in results[:5]]
            print(f"  First few texts: {texts}")
    except Exception as e:
        print(f"Error scanning {filename}: {e}")
