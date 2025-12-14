#!/usr/bin/env python3
"""
Merge cover image with PDF content.
Usage: python3 merge-cover.py cover.png content.pdf output.pdf

Requires: pip3 install pypdf Pillow
"""

import sys
import os

def check_dependencies():
    try:
        from pypdf import PdfReader, PdfWriter
        from PIL import Image
        return True
    except ImportError as e:
        print(f"Missing dependency: {e}")
        print("Install with: pip3 install pypdf Pillow")
        return False

def create_cover_pdf(image_path, output_path, page_size=(612, 792)):
    """Convert image to PDF."""
    from PIL import Image
    from pypdf import PdfWriter
    import io

    # Open and resize image
    img = Image.open(image_path)

    # Convert to RGB if necessary
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')

    # Calculate dimensions to fit page while maintaining aspect ratio
    page_width, page_height = page_size
    img_ratio = img.width / img.height
    page_ratio = page_width / page_height

    if img_ratio > page_ratio:
        new_width = page_width
        new_height = int(page_width / img_ratio)
    else:
        new_height = page_height
        new_width = int(page_height * img_ratio)

    img = img.resize((int(new_width), int(new_height)), Image.Resampling.LANCZOS)

    # Create new image with page size and paste centered
    page_img = Image.new('RGB', (int(page_width), int(page_height)), 'white')
    x = (int(page_width) - img.width) // 2
    y = (int(page_height) - img.height) // 2
    page_img.paste(img, (x, y))

    # Save as PDF
    page_img.save(output_path, 'PDF', resolution=100.0)
    return output_path

def merge_pdfs(cover_pdf, content_pdf, output_pdf):
    """Merge cover PDF with content PDF."""
    from pypdf import PdfReader, PdfWriter

    writer = PdfWriter()

    # Add cover page
    cover_reader = PdfReader(cover_pdf)
    for page in cover_reader.pages:
        writer.add_page(page)

    # Add content pages
    content_reader = PdfReader(content_pdf)
    for page in content_reader.pages:
        writer.add_page(page)

    # Write output
    with open(output_pdf, 'wb') as f:
        writer.write(f)

    return output_pdf

def main():
    if len(sys.argv) != 4:
        print("Usage: python3 merge-cover.py cover.png content.pdf output.pdf")
        sys.exit(1)

    if not check_dependencies():
        sys.exit(1)

    cover_image = sys.argv[1]
    content_pdf = sys.argv[2]
    output_pdf = sys.argv[3]

    if not os.path.exists(cover_image):
        print(f"Error: Cover image not found: {cover_image}")
        sys.exit(1)

    if not os.path.exists(content_pdf):
        print(f"Error: Content PDF not found: {content_pdf}")
        sys.exit(1)

    print(f"Creating cover PDF from {cover_image}...")
    cover_pdf = "/tmp/cover-temp.pdf"
    create_cover_pdf(cover_image, cover_pdf)

    print(f"Merging cover with {content_pdf}...")
    merge_pdfs(cover_pdf, content_pdf, output_pdf)

    # Cleanup
    os.remove(cover_pdf)

    print(f"Output: {output_pdf}")
    print(f"Size: {os.path.getsize(output_pdf) / 1024:.0f}K")

if __name__ == "__main__":
    main()
