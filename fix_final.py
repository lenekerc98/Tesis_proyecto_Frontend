import os
from PIL import Image

def build_perfect_icons():
    # El archivo original inmaculado
    source_path = r"c:\LNCZ\Tesis_aves_2025\Tesis_Proyecto\FRONTEND\public\av_e.png"
    
    # Destinos
    dest_public = r"c:\LNCZ\Tesis_aves_2025\Tesis_Proyecto\FRONTEND\public\ave.png"
    dest_assets = r"c:\LNCZ\Tesis_aves_2025\Tesis_Proyecto\FRONTEND\src\assets\ave.png"
    
    try:
        img = Image.open(source_path).convert("RGBA")
        
        # Redimensionar para que no pese 1 MB, 512x512 es óptimo para web/PWA
        img = img.resize((512, 512), Image.Resampling.LANCZOS)
        
        # Color del background
        bg_color = (103, 112, 89)
        bg = Image.new("RGBA", img.size, bg_color + (255,))
        
        # Separar el canal alfa para usarlo como mascara
        r, g, b, mask = img.split()
        
        # Creamos una capa blanca que representa el ave
        white_layer = Image.new("RGBA", img.size, (255, 255, 255, 255))
        
        # Pegamos el ave blanca usando el canal alfa del original
        bg.paste(white_layer, (0, 0), mask)
        
        final = bg.convert("RGB")
        
        # Guardamos en los dos lados
        final.save(dest_public, "PNG")
        final.save(dest_assets, "PNG")
        
        print(f"Iconos regerados y guardados en:\n1. {dest_public}\n2. {dest_assets}")
        
    except Exception as e:
        print(f"Error: {e}")

build_perfect_icons()
