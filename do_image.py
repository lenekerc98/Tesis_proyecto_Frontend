import sys
import traceback
import os

try:
    from PIL import Image

    print("Pillow imported successfully")
    color = (103, 112, 89) # Hex #677059
    
    paths = [
        r"c:\LNCZ\Tesis_aves_2025\Tesis_Proyecto\FRONTEND\public\ave.png",
        r"c:\LNCZ\Tesis_aves_2025\Tesis_Proyecto\FRONTEND\src\assets\ave.png"
    ]
    
    for p in paths:
        if not os.path.exists(p):
            print(f"File not found: {p}")
            continue
            
        print(f"Processing {p}")
        img = Image.open(p).convert("RGBA")
        
        # Opcion A: Fondo de color #677059, y el logo transparente encima
        bg = Image.new("RGBA", img.size, color + (255,))
        bg.paste(img, (0,0), img)
        
        # Eliminar el canal alfa guardando como RGB -> PNG sin transparencia
        final = bg.convert("RGB")
        final.save(p, "PNG")
        print(f"Successfully processed {p}")

except Exception as e:
    print("Error occurred:")
    traceback.print_exc()
