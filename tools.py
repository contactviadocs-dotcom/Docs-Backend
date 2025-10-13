import sys
import subprocess
import os
import io
import zipfile
from pdf2docx import Converter
from PyPDF2 import PdfMerger, PdfReader, PdfWriter
from pdf2image import convert_from_path
from PIL import Image

# ✅ Configure paths
LIBREOFFICE_PATH = r"C:\Program Files\LibreOffice\program\soffice.exe"
POPPLER_PATH = r"C:\poppler\bin"  # Must contain pdftoppm.exe & pdfinfo.exe


# ------------------------------------------------------------
# 🧩 PDF → Word
# ------------------------------------------------------------
def pdf_to_word(input_file, output_file):
    try:
        cv = Converter(input_file)
        cv.convert(output_file, start=0, end=None)
        cv.close()
        print(output_file)
    except Exception as e:
        print(f"ERROR: PDF→Word failed - {e}")
        sys.exit(1)


# ------------------------------------------------------------
# 🧩 Word → PDF
# ------------------------------------------------------------
def word_to_pdf(input_file, output_file):
    try:
        subprocess.run(
            [
                LIBREOFFICE_PATH,
                "--headless",
                "--convert-to",
                "pdf",
                "--outdir",
                os.path.dirname(output_file),
                input_file,
            ],
            check=True,
        )
        generated_pdf = os.path.join(
            os.path.dirname(output_file),
            os.path.splitext(os.path.basename(input_file))[0] + ".pdf",
        )
        if os.path.exists(generated_pdf):
            os.replace(generated_pdf, output_file)
        print(output_file)
    except Exception as e:
        print(f"ERROR: Word→PDF failed - {e}")
        sys.exit(1)


# ------------------------------------------------------------
# 🧩 Excel → PDF
# ------------------------------------------------------------
def excel_to_pdf(input_file, output_file):
    try:
        subprocess.run(
            [
                LIBREOFFICE_PATH,
                "--headless",
                "--convert-to",
                "pdf",
                "--outdir",
                os.path.dirname(output_file),
                input_file,
            ],
            check=True,
        )
        generated_pdf = os.path.join(
            os.path.dirname(output_file),
            os.path.splitext(os.path.basename(input_file))[0] + ".pdf",
        )
        if os.path.exists(generated_pdf):
            os.replace(generated_pdf, output_file)
        print(output_file)
    except Exception as e:
        print(f"ERROR: Excel→PDF failed - {e}")
        sys.exit(1)


# ------------------------------------------------------------
# 🧩 PDF Merge
# ------------------------------------------------------------
def pdf_merge(input_files, output_file):
    try:
        merger = PdfMerger()
        for pdf in input_files:
            merger.append(pdf)
        merger.write(output_file)
        merger.close()
        print(output_file)
    except Exception as e:
        print(f"ERROR: PDF merge failed - {e}")
        sys.exit(1)


# ------------------------------------------------------------
# 🧩 Range Parser Helper
# ------------------------------------------------------------
def parse_ranges(ranges_str):
    result = []
    for part in ranges_str.split(","):
        part = part.strip()
        if "-" in part:
            a, b = part.split("-")
            result.append((int(a), int(b)))
        else:
            v = int(part)
            result.append((v, v))
    return result


# ------------------------------------------------------------
# 🧩 PDF Split
# ------------------------------------------------------------
def pdf_split(input_file, ranges_str, output_dir):
    try:
        reader = PdfReader(input_file)
        ranges = parse_ranges(ranges_str)
        os.makedirs(output_dir, exist_ok=True)

        if len(ranges) == 1:
            start, end = ranges[0]
            writer = PdfWriter()
            for i in range(start - 1, end):
                if i < len(reader.pages):
                    writer.add_page(reader.pages[i])
            output_file = os.path.join(output_dir, f"split_{start}-{end}.pdf")
            with open(output_file, "wb") as f_out:
                writer.write(f_out)
            print(output_file)
        else:
            zip_path = os.path.join(output_dir, "splits.zip")
            with zipfile.ZipFile(zip_path, "w") as zf:
                for (start, end) in ranges:
                    writer = PdfWriter()
                    for i in range(start - 1, end):
                        if i < len(reader.pages):
                            writer.add_page(reader.pages[i])
                    buf = io.BytesIO()
                    writer.write(buf)
                    buf.seek(0)
                    zf.writestr(f"split_{start}-{end}.pdf", buf.read())
            print(zip_path)
    except Exception as e:
        print(f"ERROR: PDF split failed - {e}")
        sys.exit(1)


# ------------------------------------------------------------
# 🧩 Image → PDF
# ------------------------------------------------------------
def image_to_pdf(input_files, output_file):
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
        from reportlab.lib.utils import ImageReader

        if not input_files:
            print("ERROR: No input images provided")
            sys.exit(1)

        page_width, page_height = A4
        c = canvas.Canvas(output_file, pagesize=A4)

        for img_path in input_files:
            img = Image.open(img_path)
            img_width, img_height = img.size
            aspect = img_width / img_height

            max_width, max_height = page_width - 50, page_height - 50
            if img_width > img_height:
                new_width = min(max_width, img_width)
                new_height = new_width / aspect
                if new_height > max_height:
                    new_height = max_height
                    new_width = new_height * aspect
            else:
                new_height = min(max_height, img_height)
                new_width = new_height * aspect
                if new_width > max_width:
                    new_width = max_width
                    new_height = new_width / aspect

            x = (page_width - new_width) / 2
            y = (page_height - new_height) / 2
            c.drawImage(ImageReader(img), x, y, width=new_width, height=new_height)
            c.showPage()

        c.save()
        print(output_file)
    except Exception as e:
        print(f"ERROR: Image→PDF failed - {e}")
        sys.exit(1)

# ------------------------------------------------------------
# 🧩 PDF → Image
# ------------------------------------------------------------
def pdf_to_image(input_file, output_dir):
    try:
        # ✅ Correct Poppler path for your system
        POPPLER_PATH = r"C:\poppler-25.07.0\Library\bin"

        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)

        # Convert PDF pages to images
        pages = convert_from_path(input_file, dpi=200, poppler_path=POPPLER_PATH)
        image_paths = []

        # Save each page as PNG
        for i, page in enumerate(pages):
            img_path = os.path.join(output_dir, f"page_{i+1}.png")
            page.save(img_path, "PNG")
            image_paths.append(img_path)

        # If multiple pages → create ZIP
        if len(image_paths) > 1:
            zip_path = os.path.join(output_dir, "images.zip")
            with zipfile.ZipFile(zip_path, "w") as zf:
                for img_path in image_paths:
                    zf.write(img_path, os.path.basename(img_path))
            print(zip_path)
        else:
            print(image_paths[0])

    except Exception as e:
        print(f"ERROR: PDF→Image failed - {e}")
        sys.exit(1)


# ------------------------------------------------------------
# 🧩 CLI Entry Point
# ------------------------------------------------------------
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python tools.py <tool> <args>")
        sys.exit(1)

    tool = sys.argv[1]

    try:
        if tool == "pdf-to-word" and len(sys.argv) == 4:
            pdf_to_word(sys.argv[2], sys.argv[3])

        elif tool == "word-to-pdf" and len(sys.argv) == 4:
            word_to_pdf(sys.argv[2], sys.argv[3])

        elif tool == "excel-to-pdf" and len(sys.argv) == 4:
            excel_to_pdf(sys.argv[2], sys.argv[3])

        elif tool == "pdf-merge" and len(sys.argv) >= 5:
            pdf_merge(sys.argv[2:-1], sys.argv[-1])

        elif tool == "pdf-split" and len(sys.argv) == 5:
            pdf_split(sys.argv[2], sys.argv[3], sys.argv[4])

        elif tool == "image-to-pdf" and len(sys.argv) >= 4:
            image_to_pdf(sys.argv[2:-1], sys.argv[-1])

        elif tool == "pdf-to-image" and len(sys.argv) == 4:
            pdf_to_image(sys.argv[2], sys.argv[3])

        else:
            print(f"ERROR: Invalid usage or unknown tool '{tool}'")
            sys.exit(1)

    except Exception as err:
        print(f"ERROR: {tool} failed - {err}")
        sys.exit(1)
