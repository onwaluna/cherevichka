with open('data/spots.js', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.findall(r'id:\s*[\'"](.*?)[\'"]', text)
print(f"Total {len(matches)} spot IDs in data/spots.js:")
for m in matches[:10]:
    print(" -", m)
