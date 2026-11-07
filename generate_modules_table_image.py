import os
from PIL import Image, ImageDraw, ImageFont

# Canvas setup for Modules Table
width = 1100
row_height = 86
header_height = 80
num_rows = 6
height = header_height + (row_height * num_rows) + 4

img = Image.new('RGB', (width, height), color='#FFFFFF')
draw = ImageDraw.Draw(img)

# Try loading standard system fonts
try:
    font_header = ImageFont.truetype("arialbd.ttf", 26)
    font_col1 = ImageFont.truetype("arialbd.ttf", 23)
    font_col2 = ImageFont.truetype("arial.ttf", 21)
except Exception:
    font_header = ImageFont.load_default()
    font_col1 = ImageFont.load_default()
    font_col2 = ImageFont.load_default()

# Table dimensions
col1_width = 380
col2_width = width - col1_width

# Header Background (Royal Cobalt Blue)
header_bg = "#0047AB"
draw.rectangle([0, 0, width, header_height], fill=header_bg)

# Header Text
draw.text((col1_width / 2, header_height / 2), "MODULE", fill="#FFFFFF", font=font_header, anchor="mm")
draw.text((col1_width + (col2_width / 2), header_height / 2), "DESCRIPTION", fill="#FFFFFF", font=font_header, anchor="mm")

# Data Rows
rows = [
    ("1. Farmer Module", "Register/Login, add, edit, and manage vegetable listings with price, quantity, and images."),
    ("2. Customer Module", "Browse vegetables, search products, add to cart, place orders, and view order history."),
    ("3. Shopping Cart & Checkout", "Update quantities, calculate total bill, and choose payment methods."),
    ("4. Payment Module", "Supports UPI QR Code, Credit/Debit Card, and Cash on Delivery (COD)."),
    ("5. AI Chatbot & Multilingual Support", "Provides customer assistance and supports English, Hindi, and Marathi languages."),
    ("6. Admin Module", "Manage farmers, customers, vegetables, orders, payments, and delivery status.")
]

border_color = "#3b82f6"  # Blue grid lines
text_col1_color = "#003b8e" # Dark Royal Blue for Module Title
text_col2_color = "#1e293b" # Dark Slate for Description

for i, (name, desc) in enumerate(rows):
    y_start = header_height + (i * row_height)
    y_end = y_start + row_height
    
    # Alternating row background
    bg_color = "#F0F7FF" if i % 2 == 0 else "#FFFFFF"
    draw.rectangle([0, y_start, width, y_end], fill=bg_color)
    
    # Draw Col 1 (Module Title)
    if len(name) > 28:
        # Split module name into two lines if long (e.g. Shopping Cart / AI Chatbot)
        words = name.split()
        mid = len(words) // 2
        line1 = " ".join(words[:mid])
        line2 = " ".join(words[mid:])
        draw.text((35, y_start + (row_height / 2) - 14), line1, fill=text_col1_color, font=font_col1, anchor="lm")
        draw.text((35, y_start + (row_height / 2) + 14), line2, fill=text_col1_color, font=font_col1, anchor="lm")
    else:
        draw.text((35, y_start + (row_height / 2)), name, fill=text_col1_color, font=font_col1, anchor="lm")
    
    # Draw Col 2 (Description)
    if len(desc) > 65:
        words = desc.split()
        line1 = ""
        line2 = ""
        for word in words:
            if len(line1 + " " + word) <= 55:
                line1 += (" " if line1 else "") + word
            else:
                line2 += (" " if line2 else "") + word
        draw.text((col1_width + 30, y_start + (row_height / 2) - 13), line1, fill=text_col2_color, font=font_col2, anchor="lm")
        draw.text((col1_width + 30, y_start + (row_height / 2) + 15), line2, fill=text_col2_color, font=font_col2, anchor="lm")
    else:
        draw.text((col1_width + 30, y_start + (row_height / 2)), desc, fill=text_col2_color, font=font_col2, anchor="lm")
    
    # Horizontal divider line
    draw.line([(0, y_end), (width, y_end)], fill=border_color, width=1)

# Vertical divider lines & outer border
draw.line([(col1_width, 0), (col1_width, height)], fill=border_color, width=2)
draw.rectangle([0, 0, width - 1, height - 1], outline=border_color, width=3)

# Save output PNG image
output_dir = r"C:\Users\WELCOME\.gemini\antigravity\brain\0ad8be4b-f281-4a0d-80a6-6fddf7102849"
output_path = os.path.join(output_dir, "freshfarm_modules_table_image.png")
img.save(output_path, "PNG")
print("PNG Modules Table Image Generated Successfully at:", output_path)
