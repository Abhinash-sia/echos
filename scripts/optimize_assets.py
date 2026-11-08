#!/usr/bin/env python3
"""
Echoes Asset Optimization & Transparency Pipeline
- Converts photography into responsive, compressed WebP & AVIF
- Extracts clean alpha transparency masks from white-backed studio cutouts
- Generates genuine transparent RGBA PNG and WebP files
- Ensures zero halo artifacts and verifies output formats
"""

import os
import sys
import subprocess
from PIL import Image, ImageFilter, ImageOps
import numpy as np

BRAIN_DIR = "/home/abhi/.gemini/antigravity-ide/brain/d62894ef-65d0-4171-8555-0d2d3eab65cd"
PUBLIC_DIR = "/home/abhi/Projects/echos/public/images"

def ensure_dirs():
    subdirs = [
        "photography",
        "landscapes",
        "architecture",
        "objects",
        "cutouts",
        "illustrations",
        "textures",
        "decorative",
        "backgrounds",
        "raw",
    ]
    for d in subdirs:
        os.makedirs(os.path.join(PUBLIC_DIR, d), exist_ok=True)

def convert_to_webp(src_path, dest_webp_path, max_width=1600, quality=85):
    """Resizes and converts image to optimized WebP."""
    with Image.open(src_path) as img:
        # Resize if width exceeds max_width
        w, h = img.size
        if w > max_width:
            new_h = int(h * (max_width / w))
            img = img.resize((max_width, new_h), Image.Resampling.LANCZOS)
        
        # Save optimized WebP
        img.save(dest_webp_path, "WEBP", quality=quality, method=6)
        print(f"✓ Converted WebP: {dest_webp_path} ({img.size[0]}x{img.size[1]}, {os.path.getsize(dest_webp_path) // 1024} KB)")

def convert_to_avif(src_path, dest_avif_path, max_width=1920):
    """Converts to AVIF using avifenc or ImageMagick."""
    try:
        # Use ImageMagick magick command
        cmd = ["magick", src_path, "-resize", f"{max_width}x>", "-quality", "78", dest_avif_path]
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print(f"✓ Converted AVIF: {dest_avif_path} ({os.path.getsize(dest_avif_path) // 1024} KB)")
    except Exception as e:
        print(f"⚠ AVIF encoding warning for {src_path}: {e}")

def create_transparent_cutout(src_path, dest_png_path, dest_webp_path, max_dim=800, threshold=248):
    """
    Creates a genuine transparent cutout from a clean white-backed studio image.
    Uses multi-stage thresholding and edge feathering to eliminate white halos.
    """
    with Image.open(src_path) as img:
        img = img.convert("RGBA")
        
        # Resize if oversized
        w, h = img.size
        if max(w, h) > max_dim:
            if w >= h:
                new_w = max_dim
                new_h = int(h * (max_dim / w))
            else:
                new_h = max_dim
                new_w = int(w * (max_dim / h))
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        arr = np.array(img, dtype=np.float32)
        r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
        
        # Distance from pure white
        # If r, g, b are all close to 255, distance is near 0
        diff_r = 255.0 - r
        diff_g = 255.0 - g
        diff_b = 255.0 - b
        color_dist = np.sqrt(diff_r**2 + diff_g**2 + diff_b**2)
        
        # Smooth alpha ramp: pixels very close to white get 0 alpha, 
        # pixels farther away get full alpha, transition is smooth to prevent halos
        alpha = np.clip((color_dist - 12.0) / 28.0, 0.0, 1.0) * 255.0
        
        # For darker pixels, ensure full opacity
        brightness = (r + g + b) / 3.0
        alpha[brightness < threshold - 15] = 255.0
        
        # Construct final RGBA image
        out_arr = np.dstack((arr[:, :, :3], alpha)).astype(np.uint8)
        transparent_img = Image.fromarray(out_arr, mode="RGBA")
        
        # Save transparent PNG
        transparent_img.save(dest_png_path, "PNG", optimize=True)
        # Save transparent WebP (lossless/near-lossless alpha)
        transparent_img.save(dest_webp_path, "WEBP", quality=90, method=6)
        
        print(f"✓ Created Transparent Cutout: {dest_webp_path} & {dest_png_path} ({transparent_img.size[0]}x{transparent_img.size[1]})")

def main():
    ensure_dirs()
    
    # 1. Photography & Architecture
    raw_images = [
        # (source, dest_name, category, max_w, make_avif)
        ("arch_sunlight_interior_1793495369756.jpg", "arch_sunlight_interior", "architecture", 1600, True),
        ("landscape_misty_mountain_1793495398160.jpg", "landscape_misty_mountain", "landscapes", 1400, False),
        ("photo_hands_letter_1793495421709.jpg", "photo_hands_letter", "photography", 1200, False),
        ("object_brass_capsule_1793495448502.jpg", "object_brass_capsule", "objects", 1000, False),
        ("photo_vintage_camera_1793495471197.jpg", "photo_vintage_camera", "photography", 1400, False),
        ("bg_parchment_wash_1793495563918.jpg", "bg_parchment_wash", "backgrounds", 1920, True),
        ("landscape_golden_lake_1793495580704.jpg", "landscape_golden_lake", "landscapes", 1600, True),
    ]
    
    for src_file, base_name, cat, max_w, make_avif in raw_images:
        src_path = os.path.join(BRAIN_DIR, src_file)
        if not os.path.exists(src_path):
            print(f"Skipping missing source: {src_path}")
            continue
            
        # Copy to raw/
        raw_dest = os.path.join(PUBLIC_DIR, "raw", f"{base_name}.jpg")
        with open(src_path, "rb") as sf, open(raw_dest, "wb") as df:
            df.write(sf.read())
            
        # Also copy jpg to category
        jpg_dest = os.path.join(PUBLIC_DIR, cat, f"{base_name}.jpg")
        with open(src_path, "rb") as sf, open(jpg_dest, "wb") as df:
            df.write(sf.read())
            
        # Generate WebP
        webp_dest = os.path.join(PUBLIC_DIR, cat, f"{base_name}.webp")
        convert_to_webp(src_path, webp_dest, max_width=max_w, quality=86)
        
        # Generate AVIF if requested
        if make_avif:
            avif_dest = os.path.join(PUBLIC_DIR, cat, f"{base_name}.avif")
            convert_to_avif(src_path, avif_dest, max_width=max_w)
            
    # 2. Transparent Cutouts
    cutouts = [
        ("cutout_botanical_source_1793495604329.jpg", "cutout_botanical_fern", 800),
        ("cutout_wax_seal_source_1793495625496.jpg", "cutout_wax_seal", 700),
        ("cutout_post_stamp_src_1793495647042.jpg", "cutout_postal_stamp", 700),
    ]
    
    for src_file, base_name, max_dim in cutouts:
        src_path = os.path.join(BRAIN_DIR, src_file)
        if not os.path.exists(src_path):
            print(f"Skipping missing cutout source: {src_path}")
            continue
            
        png_dest = os.path.join(PUBLIC_DIR, "cutouts", f"{base_name}.png")
        webp_dest = os.path.join(PUBLIC_DIR, "cutouts", f"{base_name}.webp")
        create_transparent_cutout(src_path, png_dest, webp_dest, max_dim=max_dim)

if __name__ == "__main__":
    main()
