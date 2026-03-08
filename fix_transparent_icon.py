import os
from PIL import Image

def add_background(path, bg_color=(103, 112, 89)):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return
        
    try:
        img = Image.open(path)
        img = img.convert("RGBA")
        
        # Crear un nuevo fondo sólido (Color #677059)
        bg = Image.new('RGBA', img.size, bg_color + (255,))
        
        # Pegar la imagen original (el ave) usando su propia transparencia como máscara
        bg.paste(img, (0, 0), img)
        
        # Guardar como PNG ya con el fondo integrado (se convierte a RGB base para asegurar la pérdida de transparencia)
        bg = bg.convert('RGB')
        bg.save(path, format="PNG")
        
        print(f"Icono optimizado correctamente con el fondo relleno: {path}")
    except Exception as e:
        print(f"Error procesando {path}: {e}")

add_background(r"c:\LNCZ\Tesis_aves_2025\Tesis_Proyecto\FRONTEND\public\ave.png")
add_background(r"c:\LNCZ\Tesis_aves_2025\Tesis_Proyecto\FRONTEND\src\assets\ave.png")
