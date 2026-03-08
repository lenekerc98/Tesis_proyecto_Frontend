import sys
import os

try:
    from PIL import Image
    os.chdir(r"c:\LNCZ\Tesis_aves_2025\Tesis_Proyecto\FRONTEND\public")
    img = Image.open('ave.png')
    print(f"Size: {img.size}, Mode: {img.mode}")
    
    # Create an opaque white background version
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        img = img.convert("RGBA")
        bg = Image.new('RGBA', img.size, (255, 255, 255, 255))
        bg.paste(img, (0, 0), img)
        bg = bg.convert('RGB')
    else:
        bg = img.convert('RGB')
        
    width, height = bg.size
    
    # Save standard PWA icons (no padding)
    bg.resize((192, 192), Image.Resampling.LANCZOS).save('pwa-192x192.png', 'PNG')
    bg.resize((512, 512), Image.Resampling.LANCZOS).save('pwa-512x512.png', 'PNG')
    
    # Maskable icon needs padding so the logo doesn't get cut by Android
    # Safe zone is a circle with diameter 80% of the image size
    # So we pad the original image with 25% extra space
    new_size = int(max(width, height) * 1.4)
    padded = Image.new('RGB', (new_size, new_size), (255, 255, 255))
    padded.paste(bg, (int((new_size - width) / 2), int((new_size - height) / 2)))
    
    padded.resize((512, 512), Image.Resampling.LANCZOS).save('maskable-icon-512x512.png', 'PNG')
    
    print("Icons generated successfully!")
except ImportError:
    print("Pillow not installed. Attempting alternative approach...")
except Exception as e:
    print(f"Error: {e}")
