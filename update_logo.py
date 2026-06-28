from PIL import Image

def remove_white_bg(input_path, output_png_path, output_ico_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    
    newData = []
    # Using a threshold to make white pixels transparent
    for item in datas:
        # If the pixel is mostly white/gray and bright
        if item[0] > 230 and item[1] > 230 and item[2] > 230:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    
    # Save the transparent PNG
    img.save(output_png_path, "PNG")
    
    # Create Favicon
    # Find bounding box to crop it tight
    bbox = img.getbbox()
    if bbox:
        img_cropped = img.crop(bbox)
        
        # Make square for favicon by padding
        max_dim = max(img_cropped.size)
        square_img = Image.new('RGBA', (max_dim, max_dim), (255, 255, 255, 0))
        offset = ((max_dim - img_cropped.width) // 2, (max_dim - img_cropped.height) // 2)
        square_img.paste(img_cropped, offset)
        
        # Resize to typical favicon sizes
        square_img = square_img.resize((64, 64), Image.Resampling.LANCZOS)
        square_img.save(output_ico_path, format='ICO', sizes=[(16,16), (32, 32), (64,64)])
        print(f"Success: Transparent PNG saved to {output_png_path} and Favicon saved to {output_ico_path}")
    else:
        print("Error: Image is empty after background removal")

remove_white_bg('public/logo-camara.png', 'public/logo-camara.png', 'src/app/favicon.ico')
