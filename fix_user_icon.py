import os
from PIL import Image

def analyze_and_fix(path):
    print(f"Analyzing {path}...")
    try:
        img = Image.open(path).convert("RGBA")
        data = img.getdata()
        
        target_bird_color = (255, 255, 255, 255) # Ave blana
        target_bg_color = (103, 112, 89, 255)    # BG #677059
        
        new_data = []
        for item in data:
            # item is (R, G, B, A)
            r, g, b, a = item
            
            if a < 128:
                # Transparent -> Background #677059
                new_data.append(target_bg_color)
            else:
                # Opaque pixel. Check if it's close to #677059
                # 103, 112, 89
                if abs(r - 103) < 50 and abs(g - 112) < 50 and abs(b - 89) < 50:
                    # It's the bird, make it white
                    new_data.append(target_bird_color)
                # If it's close to white or anything else
                elif r > 200 and g > 200 and b > 200:
                    # Actually, if it's white, the user might want it to be #677059?
                    # The user said: "si esta de ese color sean blancas o viceversa"
                    new_data.append(target_bg_color)
                else:
                    # Make it white by default if it's the bird
                    new_data.append(target_bird_color)
                
        
        img.putdata(new_data)
        final = img.convert("RGB")
        final.save(path, "PNG")
        print(f"Successfully fixed {path}")
    except Exception as e:
        print(f"Error {path}: {e}")

analyze_and_fix(r"c:\LNCZ\Tesis_aves_2025\Tesis_Proyecto\FRONTEND\public\ave.png")
analyze_and_fix(r"c:\LNCZ\Tesis_aves_2025\Tesis_Proyecto\FRONTEND\src\assets\ave.png")
