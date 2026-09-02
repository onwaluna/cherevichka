with open('data/spots.js', encoding='utf-8') as f:
    code = f.read()

import re
print("Length of data/spots.js:", len(code))

sections = re.findall(r'export\s+const\s+(\w+)\s*=', code)
print("Sections exported:", sections)

# Find SPOTS_DATA
idx = code.find('export const SPOTS_DATA')
if idx != -1:
    print("SPOTS_DATA snippet:", code[idx:idx+300])
