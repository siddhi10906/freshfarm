import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Paths to the 5 uploaded images
brain_dir = r"C:\Users\WELCOME\.gemini\antigravity\brain\0ad8be4b-f281-4a0d-80a6-6fddf7102849"
img_paths = [
    os.path.join(brain_dir, ".user_uploaded", "media_1788458893987.png"), # 1. Homepage
    os.path.join(brain_dir, ".user_uploaded", "media_1788458894012.png"), # 2. Marketplace
    os.path.join(brain_dir, ".user_uploaded", "media_1788458894026.png"), # 3. How it works
    os.path.join(brain_dir, ".user_uploaded", "media_1788458894014.png"), # 4. Login
    os.path.join(brain_dir, ".user_uploaded", "media_1788458894028.png"), # 5. Farmer Dashboard
]

# Canvas Setup for High-Res Presentation Slide Image (16:9 2400x1350)
canvas_w = 2400
canvas_h = 1350
bg_color = "#F4F7F5"  # Soft fresh-farm background

canvas = Image.new("RGB", (canvas_w, canvas_h), color=bg_color)
draw = ImageDraw.Draw(canvas)

# Fonts setup
try:
    font_header = ImageFont.truetype("arialbd.ttf", 36)
    font_sub = ImageFont.truetype("arial.ttf", 22)
    font_label = ImageFont.truetype("arialbd.ttf", 20)
except Exception:
    font_header = ImageFont.load_default()
    font_sub = ImageFont.load_default()
    font_label = ImageFont.load_default()

# 1. Header Banner
banner_h = 100
draw.rectangle([0, 0, canvas_w, banner_h], fill="#0B6B3A")
draw.text((canvas_w / 2, 38), "FreshFarm – System Interface & User Workflows", fill="#FFFFFF", font=font_header, anchor="mm")
draw.text((canvas_w / 2, 75), "Direct Farm-to-Home Online Marketplace • Platform Screenshots Showcase", fill="#E6F4EA", font=font_sub, anchor="mm")

# Helper function to paste image with rounded corners, border & shadow
def add_card(image_path, title, x, y, target_w, target_h):
    if not os.path.exists(image_path):
        print(f"Warning: File not found {image_path}")
        return
    
    src = Image.open(image_path).convert("RGB")
    src = src.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # Outer Card Box with shadow effect
    padding = 6
    card_w = target_w + (padding * 2)
    card_h = target_h + 40 + (padding * 2) # title bar room
    
    # Card Background
    card_bg = Image.new("RGB", (card_w, card_h), color="#FFFFFF")
    cdraw = ImageDraw.Draw(card_bg)
    
    # Card Header
    cdraw.rectangle([0, 0, card_w, 36], fill="#065F46")
    cdraw.text((card_w / 2, 18), title, fill="#FFFFFF", font=font_label, anchor="mm")
    
    # Paste Screenshot
    card_bg.paste(src, (padding, 36 + padding))
    
    # Card Border
    cdraw.rectangle([0, 0, card_w - 1, card_h - 1], outline="#cbd5e1", width=2)
    
    canvas.paste(card_bg, (x, y))

# Layout Configuration:
# Top Row: 2 Big Screenshots (Homepage & Marketplace) -> Width 1140, Height 530
top_w = 1140
top_h = 530
y_top = 120

add_card(img_paths[0], "1. Customer Homepage & Featured Categories", 40, y_top, top_w, top_h)
add_card(img_paths[1], "2. Fresh Produce Marketplace & Filter Search", 1220, y_top, top_w, top_h)

# Bottom Row: 3 Feature Screenshots (How it works, Customer Login, Farmer Dashboard) -> Width 750, Height 510
bot_w = 750
bot_h = 510
y_bot = 730

add_card(img_paths[2], "3. How FreshFarm Works Workflow", 40, y_bot, bot_w, bot_h)
add_card(img_paths[3], "4. Secure Customer Sign-In Portal", 825, y_bot, bot_w, bot_h)
add_card(img_paths[4], "5. Farmer Inventory & Sales Dashboard", 1610, y_bot, bot_w, bot_h)

# Save Composite Image
output_path = os.path.join(brain_dir, "freshfarm_all_screenshots_showcase.png")
canvas.save(output_path, "PNG", quality=95)
print(f"Composite Showcase Image Successfully Created at: {output_path}")
