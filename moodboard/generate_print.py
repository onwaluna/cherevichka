import math
import random
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

def generate_signature_print():
    width = 2400
    height = 3600
    
    # Core Brand Palette
    c_mahogany = (73, 27, 18)       # #491B12
    c_olive = (133, 130, 72)        # #858248
    c_amethyst = (147, 124, 145)    # #937C91
    c_parchment = (215, 207, 190)   # #D7CFBE
    c_cream = (250, 247, 238)       # #FAF7EE
    c_gold = (197, 160, 89)         # #C5A059
    c_gold_light = (226, 188, 106)  # #E2BC6A
    c_charcoal = (21, 19, 18)       # #151312
    c_rust = (163, 72, 44)

    img = Image.new("RGB", (width, height), c_parchment)
    draw = ImageDraw.Draw(img)

    # 1. Asymmetric Abstract Background Collage
    # Upper left deep mahogany block
    draw.polygon([(0, 0), (1450, 0), (1150, 1500), (0, 1300)], fill=c_mahogany)
    
    # Upper right warm cream silk block
    draw.polygon([(1450, 0), (width, 0), (width, 1700), (1150, 1500)], fill=c_cream)

    # Bottom right dusty amethyst velvet block
    draw.polygon([(850, 1700), (width, 1450), (width, height), (650, height)], fill=c_amethyst)

    # Bottom left botanical olive brass block
    draw.polygon([(0, 2150), (1350, 1950), (1150, height), (0, height)], fill=c_olive)

    # 2. Celestial Gold Sunburst & Radiance (Slavic Solar Heritage)
    sun_cx, sun_cy = 1350, 1000
    sun_radius = 440

    # Shimmering Gold Radiant Beams
    for angle_deg in range(0, 360, 4):
        rad = math.radians(angle_deg)
        length = random.randint(520, 950)
        x2 = sun_cx + int(math.cos(rad) * length)
        y2 = sun_cy + int(math.sin(rad) * length)
        ray_color = c_gold if angle_deg % 2 == 0 else c_gold_light
        draw.line([(sun_cx, sun_cy), (x2, y2)], fill=ray_color, width=5)

    # Sun disk layered rings
    draw.ellipse([sun_cx - sun_radius, sun_cy - sun_radius, sun_cx + sun_radius, sun_cy + sun_radius], fill=c_mahogany, outline=c_gold, width=14)
    draw.ellipse([sun_cx - int(sun_radius * 0.72), sun_cy - int(sun_radius * 0.72), sun_cx + int(sun_radius * 0.72), sun_cy + int(sun_radius * 0.72)], fill=c_olive, outline=c_gold_light, width=10)
    draw.ellipse([sun_cx - int(sun_radius * 0.42), sun_cy - int(sun_radius * 0.42), sun_cx + int(sun_radius * 0.42), sun_cy + int(sun_radius * 0.42)], fill=c_gold, outline=c_cream, width=6)
    draw.ellipse([sun_cx - int(sun_radius * 0.18), sun_cy - int(sun_radius * 0.18), sun_cx + int(sun_radius * 0.18), sun_cy + int(sun_radius * 0.18)], fill=c_charcoal)

    # 3. High-Fashion Avant-Garde Zebra Pattern Insets
    # Left flowing zebra panel
    zebra_poly_box = [(80, 750), (950, 520), (850, 2250), (50, 2050)]
    draw.polygon(zebra_poly_box, fill=c_cream, outline=c_gold, width=8)

    y_pos = 580
    random.seed(42) # Deterministic beauty
    while y_pos < 2200:
        stripe_w = random.randint(28, 52)
        wave_pts = []
        for x in range(60, 930, 25):
            offset_y = int(math.sin(x * 0.012 + y_pos * 0.005) * 65 + math.cos(x * 0.02) * 30)
            wave_pts.append((x, y_pos + offset_y))
        if len(wave_pts) > 1:
            draw.line(wave_pts, fill=c_charcoal, width=stripe_w)
        y_pos += stripe_w + random.randint(22, 48)

    # Right flowing zebra panel
    r_poly_box = [(1400, 1650), (2320, 1420), (2320, 3150), (1300, 2950)]
    draw.polygon(r_poly_box, fill=c_cream, outline=c_gold, width=8)

    y_pos = 1480
    while y_pos < 3100:
        stripe_w = random.randint(26, 48)
        wave_pts = []
        for x in range(1320, 2300, 25):
            offset_y = int(math.sin(x * 0.01 + y_pos * 0.008) * 55 + math.sin(x * 0.028) * 25)
            wave_pts.append((x, y_pos + offset_y))
        if len(wave_pts) > 1:
            draw.line(wave_pts, fill=c_charcoal, width=stripe_w)
        y_pos += stripe_w + random.randint(20, 44)

    # 4. Slavic Heritage Botanical Arches Array (#858248 & Gold)
    for i in range(6):
        arch_x = 180 + i * 140
        arch_y = 2650
        arch_w = 110
        arch_h = 360
        draw.rounded_rectangle([arch_x, arch_y, arch_x + arch_w, arch_y + arch_h], radius=55, fill=c_olive, outline=c_gold, width=7)
        # Gold central vein
        draw.line([(arch_x + arch_w // 2, arch_y + 25), (arch_x + arch_w // 2, arch_y + arch_h - 25)], fill=c_gold_light, width=5)
        for leaf_y in range(arch_y + 70, arch_y + arch_h - 30, 45):
            draw.line([(arch_x + 18, leaf_y), (arch_x + arch_w // 2, leaf_y - 18)], fill=c_gold_light, width=4)
            draw.line([(arch_x + arch_w - 18, leaf_y), (arch_x + arch_w // 2, leaf_y - 18)], fill=c_gold_light, width=4)

    # 5. Velvet Amethyst & Mahogany Mosaic Grid (#937C91, #491B12, Gold)
    grid_x, grid_y = 1120, 2280
    tile_size = 85
    for row in range(5):
        for col in range(5):
            tx = grid_x + col * (tile_size + 10)
            ty = grid_y + row * (tile_size + 10)
            t_fill = c_amethyst if (row + col) % 2 == 0 else c_mahogany
            if (row == 2 and col == 2) or (row == 0 and col == 4) or (row == 4 and col == 0):
                t_fill = c_gold
            draw.rectangle([tx, ty, tx + tile_size, ty + tile_size], fill=t_fill, outline=c_parchment, width=3)
            # Gold center jewel dot
            draw.ellipse([tx + 30, ty + 30, tx + 55, ty + 55], fill=c_gold_light, outline=c_charcoal, width=2)

    # 6. Antique Gold Fibonacci Spirals
    def draw_golden_spiral(cx, cy, max_r, color, width_line):
        pts = []
        for theta in range(0, 1900, 8):
            r = (theta / 1900.0) * max_r
            rad = math.radians(theta)
            px = cx + int(math.cos(rad) * r)
            py = cy + int(math.sin(rad) * r)
            pts.append((px, py))
        if len(pts) > 1:
            draw.line(pts, fill=color, width=width_line)

    draw_golden_spiral(520, 3250, 240, c_gold, 7)
    draw_golden_spiral(2050, 650, 210, c_gold, 6)

    # 7. Fine Architectural Gold Framing & Grid Lines
    draw.rectangle([80, 80, width - 80, height - 80], outline=c_gold, width=4)
    draw.rectangle([110, 110, width - 110, height - 110], outline=c_gold_light, width=2)

    for y in [450, 1600, 2450, 3350]:
        draw.line([(110, y), (width - 110, y)], fill=c_gold, width=2)
    for x in [350, 1250, 2050]:
        draw.line([(x, 110), (x, height - 110)], fill=c_gold, width=2)

    # Save 4K Master Print Output
    output_png = "moodboard/cherevichka_signature_print.png"
    img.save(output_png, quality=98)
    print(f"Master Print Successfully Generated: {output_png} (2400x3600)")

if __name__ == "__main__":
    generate_signature_print()
