import easyocr
import numpy as np
from PIL import Image
import os
import sys

image_path = "/Users/ritchie/Desktop/live website /posendwebsite/public/uploads/1773731643894-WhatsApp-Image-2026-03-10-at-2.40.52-PM-(2).jpeg"
if not os.path.exists(image_path):
    print("Image does not exist!")
    sys.exit(1)

print("Initializing EasyOCR reader...")
reader = easyocr.Reader(['en'])
print("Reading image...")
image = Image.open(image_path)
image_np = np.array(image)
print(f"Image shape: {image_np.shape}")
results = reader.readtext(image_np)
print(f"Number of results found: {len(results)}")
for bbox, text, conf in results[:20]:
    print(f"Text: {text} | Conf: {conf:.2f}")
