from PIL import Image
import os

img_dir = "assets/images"
for f in sorted(os.listdir(img_dir)):
    if f.endswith(('.jpg', '.webp', '.png')):
        path = os.path.join(img_dir, f)
        try:
            with Image.open(path) as im:
                print(f"FILE: {f} | Size: {im.size} | Mode: {im.mode}")
        except Exception as e:
            print(f"Error {f}: {e}")
