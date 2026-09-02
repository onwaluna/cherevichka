import os
import time
import sys

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

src_dir = "лендинг дизайн"
files = []
for f in os.listdir(src_dir):
    if f.endswith(('.webp', '.jpg', '.jpeg', '.png')):
        path = os.path.join(src_dir, f)
        mtime = os.path.getmtime(path)
        size = os.path.getsize(path)
        files.append((mtime, f, size, path))

files.sort(reverse=True)

print(f"Total {len(files)} files in folder:")
for mtime, f, size, path in files:
    t_str = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(mtime))
    print(f"[{t_str}] {f} ({size/1024:.1f} KB)")
