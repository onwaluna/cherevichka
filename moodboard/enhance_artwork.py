import os
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageOps

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    return np.array([int(hex_str[i:i+2], 16) for i in (0, 2, 4)], dtype=np.float32)

def enhance_and_recolor_artwork():
    input_path = "лендинг дизайн/c0d0db61575ebf58415363b534e1bfee.jpg"
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found")
        return

    # 1. Load source image
    orig_img = Image.open(input_path).convert("RGB")
    w, h = orig_img.size
    print(f"Original image size: {w}x{h}")

    # Crop out slight perspective edge on the right if needed (clean up right margin)
    # The rightmost 2% has a slight perspective border
    crop_box = (0, 0, int(w * 0.985), h)
    orig_img = orig_img.crop(crop_box)
    w, h = orig_img.size

    # 2. High-Resolution 2.5x Upscaling with Lanczos + Smart Denoise
    target_w = 2200
    target_h = int(h * (2200 / w))
    upscaled = orig_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # Mild bilateral-like smoothing to eliminate JPEG compression blocks while preserving edges
    smooth_base = upscaled.filter(ImageFilter.MedianFilter(size=3))
    
    # 3. Convert to numpy array & HSV for surgical color remapping
    img_np = np.array(smooth_base, dtype=np.float32) / 255.0
    
    # RGB definition of target brand palette
    col_olive = hex_to_rgb("#858248") / 255.0      # Olive Brass
    col_amethyst = hex_to_rgb("#937C91") / 255.0   # Dusty Amethyst / Muted Plum
    col_parchment = hex_to_rgb("#D7CFBE") / 255.0  # Warm Parchment Bone
    col_mahogany = hex_to_rgb("#491B12") / 255.0   # Deep Mahogany
    col_gold = hex_to_rgb("#C5A059") / 255.0       # Antique Gold
    col_gold_light = hex_to_rgb("#E2BC6A") / 255.0 # Bright Gold
    col_charcoal = hex_to_rgb("#151312") / 255.0   # Dark Charcoal

    r = img_np[:, :, 0]
    g = img_np[:, :, 1]
    b = img_np[:, :, 2]

    # Calculate color attributes
    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    delta = max_c - min_c + 1e-6
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    sat = delta / (max_c + 1e-6)

    # Hue calculation in degrees 0-360
    hue = np.zeros_like(r)
    mask_r = (max_c == r)
    mask_g = (max_c == g) & (~mask_r)
    mask_b = (max_c == b) & (~mask_r) & (~mask_g)

    hue[mask_r] = (60.0 * ((g[mask_r] - b[mask_r]) / delta[mask_r])) % 360.0
    hue[mask_g] = (60.0 * ((b[mask_g] - r[mask_g]) / delta[mask_g]) + 120.0) % 360.0
    hue[mask_b] = (60.0 * ((r[mask_b] - g[mask_b]) / delta[mask_b]) + 240.0) % 360.0

    # Masks for color regions
    # (A) Blue / Cyan regions (Hue 160 - 260) -> Map to Dusty Amethyst (#937C91) & Parchment (#D7CFBE)
    mask_blue = (hue >= 150) & (hue <= 265) & (sat > 0.12)
    # (B) Green / Yellow-Green regions (Hue 65 - 150) -> Map to Olive Brass (#858248) & Gold (#C5A059)
    mask_green = (hue > 65) & (hue < 150) & (sat > 0.14)
    # (C) Red / Rust / Orange-Red regions (Hue 330 - 360 or 0 - 55) -> Map to Deep Mahogany (#491B12) & Warm Terracotta
    mask_red = ((hue >= 330) | (hue <= 55)) & (sat > 0.15) & (lum < 0.75)
    # (D) Deep dark blacks/browns (lum < 0.22) -> Deep Charcoal / Mahogany
    mask_dark = (lum < 0.22)
    # (E) Bright light highlights (lum > 0.75 & sat < 0.25) -> Warm Parchment Bone / Silk
    mask_light = (lum > 0.72) & (sat < 0.25)

    # Reconstructed Output Image Array
    out_np = np.copy(img_np)

    # 1. Transform Blue/Cyan -> Dusty Amethyst (#937C91) & Parchment
    blue_weight = np.clip((sat - 0.1) * 2.5, 0, 1)
    for c in range(3):
        # Blend amethyst according to luminance
        amethyst_tone = col_amethyst[c] * (lum * 0.9 + 0.2) + col_parchment[c] * (1.0 - sat) * 0.5
        out_np[:, :, c] = np.where(mask_blue, out_np[:, :, c] * (1 - blue_weight) + amethyst_tone * blue_weight, out_np[:, :, c])

    # 2. Transform Green -> Olive Brass (#858248) + Gold rib accents (#C5A059)
    green_weight = np.clip((sat - 0.12) * 2.2, 0, 1)
    for c in range(3):
        # Bright greens get gold tint, deeper greens get rich olive brass
        is_gold_accent = (lum > 0.5)
        olive_tone = np.where(is_gold_accent, col_gold[c] * (lum * 1.1), col_olive[c] * (lum * 1.2 + 0.15))
        out_np[:, :, c] = np.where(mask_green, out_np[:, :, c] * (1 - green_weight) + olive_tone * green_weight, out_np[:, :, c])

    # 3. Transform Red/Rust -> Deep Mahogany (#491B12) & Rich Terracotta
    red_weight = np.clip((sat - 0.1) * 2.0, 0, 1)
    for c in range(3):
        mahogany_tone = col_mahogany[c] * (lum * 1.8 + 0.1) + col_gold[c] * 0.15 * (lum)
        out_np[:, :, c] = np.where(mask_red, out_np[:, :, c] * (1 - red_weight) + mahogany_tone * red_weight, out_np[:, :, c])

    # 4. Enhance Dark Veins to Deep Charcoal Noir (#151312) & Dark Mahogany
    for c in range(3):
        dark_tone = col_charcoal[c] * 0.7 + col_mahogany[c] * 0.3
        out_np[:, :, c] = np.where(mask_dark, dark_tone, out_np[:, :, c])

    # 5. Tint light areas to warm Parchment Bone (#D7CFBE)
    for c in range(3):
        parchment_tone = col_parchment[c] * (lum * 0.9 + 0.15)
        out_np[:, :, c] = np.where(mask_light, parchment_tone, out_np[:, :, c])

    # 6. Add Antique Gold Shimmer along edge contours & feather ribs
    # Detect edges in the original feather region
    edge_filter = upscaled.filter(ImageFilter.FIND_EDGES).convert("L")
    edge_np = np.array(edge_filter, dtype=np.float32) / 255.0
    gold_highlight_mask = (edge_np > 0.45) & (mask_green | mask_blue | mask_red)
    for c in range(3):
        out_np[:, :, c] = np.where(gold_highlight_mask, out_np[:, :, c] * 0.4 + col_gold_light[c] * 0.6, out_np[:, :, c])

    # Clip & Convert back to PIL
    out_np = np.clip(out_np * 255.0, 0, 255).astype(np.uint8)
    final_img = Image.fromarray(out_np)

    # 7. Quality Enhancement: Unsharp Mask for ultra-crisp textile details + Contrast Boost
    final_img = final_img.filter(ImageFilter.UnsharpMask(radius=2, percent=140, threshold=3))
    
    # Enhance micro-contrast
    enhancer_contrast = ImageEnhance.Contrast(final_img)
    final_img = enhancer_contrast.enhance(1.12)
    
    enhancer_color = ImageEnhance.Color(final_img)
    final_img = enhancer_color.enhance(1.08)

    # 8. Save High-Resolution Master Outputs in moodboard/
    output_png = "moodboard/cherevichka_master_artwork_enhanced.png"
    output_jpg = "moodboard/cherevichka_master_artwork_enhanced.jpg"

    final_img.save(output_png, quality=98)
    final_img.save(output_jpg, quality=96)
    print(f"Master Artwork Successfully Created: {output_png} & {output_jpg} ({target_w}x{target_h})")

if __name__ == "__main__":
    enhance_and_recolor_artwork()
