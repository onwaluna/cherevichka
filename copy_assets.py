import os
import shutil

src_dir = "лендинг дизайн"
dst_dir = "assets/images"

os.makedirs(dst_dir, exist_ok=True)

if os.path.exists(src_dir):
    for fname in os.listdir(src_dir):
        if fname.endswith(('.webp', '.jpg', '.jpeg', '.png')):
            # Clean ascii filename if needed
            safe_fname = fname
            if "Без названия" in fname:
                safe_fname = "moodboard-collage-1.png" if "(1)" in fname else "moodboard-collage.png"
            src_path = os.path.join(src_dir, fname)
            dst_path = os.path.join(dst_dir, safe_fname)
            shutil.copy2(src_path, dst_path)
            print(f"Copied: {safe_fname}")

print("Assets successfully organized in assets/images/")
