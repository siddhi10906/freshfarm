import os
from PIL import Image, ImageDraw, ImageFont

# Canvas setup
width = 1100
row_height = 80
header_height = 80
num_rows = 7
height = header_height + (row_height * num_rows) + 4

img = Image.new('RGB', (width, height), color='#FFFFFF')
draw = ImageDraw.Draw(img)

# Try loading standard system fonts, fallback to default font
try:
    font_header = ImageFont.truetype("arialbd.ttf", 26)
    font_col1 = ImageFont.truetype("arialbd.ttf", 23)
    font_col2 = ImageFont.truetype("arial.ttf", 21)
except Exception:
    font_header = ImageFont.load_default()
    font_col1 = ImageFont.load_default()
    font_col2 = ImageFont.load_default()

# Table dimensions
col1_width = 360
col2_width = width - col1_width

# Header Background (Royal Cobalt Blue matching uploaded sample image)
header_bg = "#0047AB"
draw.rectangle([0, 0, width, header_height], fill=header_bg)

# Header Text
draw.text((col1_width / 2, header_height / 2), "TABLE NAME", fill="#FFFFFF", font=font_header, anchor="mm")
draw.text((col1_width + (col2_width / 2), header_height / 2), "PURPOSE", fill="#FFFFFF", font=font_header, anchor="mm")

# Data Rows
rows = [
    ("1. customers", "Stores customer registration and profile details."),
    ("2. farmers", "Stores farmer information and login details."),
    ("3. vegetables", "Stores vegetable name, category, price, quantity, image, and farmer ID."),
    ("4. cart", "Stores products added to the customer's shopping cart."),
    ("5. orders", "Stores order details, payment method, address, and total amount."),
    ("6. order_items", "Stores individual vegetables included in each order."),
    ("7. delivery_status", "Stores order delivery status and tracking updates.")
]

border_color = "#3b82f6"  # Blue grid lines
text_col1_color = "#003b8e" # Dark Royal Blue for Table Name
text_col2_color = "#1e293b" # Dark Slate for Purpose

for i, (name, purpose) in enumerate(rows):
    y_start = header_height + (i * row_height)
    y_end = y_start + row_height
    
    # Alternating row background
    bg_color = "#F0F7FF" if i % 2 == 0 else "#FFFFFF"
    draw.rectangle([0, y_start, width, y_end], fill=bg_color)
    
    # Draw Col 1 (Table Name)
    draw.text((35, y_start + (row_height / 2)), name, fill=text_col1_color, font=font_col1, anchor="lm")
    
    # Draw Col 2 (Purpose)
    # Wrap text if long
    if len(purpose) > 65:
        # split into two lines
        words = purpose.split()
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
        draw.text((col1_width + 30, y_start + (row_height / 2)), purpose, fill=text_col2_color, font=font_col2, anchor="lm")
    
    # Horizontal divider line
    draw.line([(0, y_end), (width, y_end)], fill=border_color, width=1)

# Vertical divider lines & outer border
draw.line([(col1_width, 0), (col1_width, height)], fill=border_color, width=2)
draw.rectangle([0, 0, width - 1, height - 1], outline=border_color, width=3)

# Save output PNG image
output_dir = r"C:\Users\WELCOME\.gemini\antigravity\brain\0ad8be4b-f281-4a0d-80a6-6fddf7102849"
output_path = os.path.join(output_dir, "freshfarm_database_tables_image.png")
img.save(output_path, "PNG")
print("PNG Table Image Generated Successfully at:", output_path)
