from PIL import Image
import os

img_dir = "assets/images"
for f in os.listdir(img_dir):
    if f.endswith(('.jpg', '.webp', '.png')):
        path = os.path.join(img_dir, f)
        try:
            with Image.open(path) as im:
                print(f"{f}: {im.size[0]}x{im.size[1]} ({im.format})")
        except Exception as e:
            print(f"{f}: Error {e}")
