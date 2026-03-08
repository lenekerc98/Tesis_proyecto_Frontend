import os
import traceback
from PIL import Image

def process_image(path):
    try:
        img = Image.open(path).convert("RGBA")
        
        # Color del background
        bg_color = (103, 112, 89)
        bg = Image.new("RGBA", img.size, bg_color + (255,))
        
        # Capa blanca para el ave
        white_layer = Image.new("RGBA", img.size, (255, 255, 255, 255))
        
        # Máscara es el canal alfa: opaco=blanco, transparente=background original
        mask = img.split()[3]
        
        # Ponemos el ave blanca encima del bg
        bg.paste(white_layer, (0, 0), mask)
        
        # Guardamos sin transparencia
        final = bg.convert("RGB")
        final.save(path, "PNG")
        print(f"Processed: {path}")
    except Exception as e:
        print(f"Error {path}: {e}")
        traceback.print_exc()

process_image(r"c:\LNCZ\Tesis_aves_2025\Tesis_Proyecto\FRONTEND\public\ave.png")
process_image(r"c:\LNCZ\Tesis_aves_2025\Tesis_Proyecto\FRONTEND\src\assets\ave.png")
