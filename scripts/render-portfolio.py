"""Render supplied PDF pages without redrawing architectural content.
Usage: python render-portfolio.py INTERNSHIP.pdf THESIS.pdf
Requires pymupdf and pillow. Run from the website directory.
"""
from pathlib import Path
import sys, json, io, shutil
import pymupdf
from PIL import Image

root = Path.cwd()
records = []
for group, source in zip(('internship', 'thesis'), sys.argv[1:3]):
    source = Path(source)
    document = pymupdf.open(source)
    folder = root / 'public' / 'portfolio-hd' / group
    folder.mkdir(parents=True, exist_ok=True)
    download = pymupdf.open()
    for index, page in enumerate(document):
        base = f'page-{index+1:02}'
        scale = 3840 / max(page.rect.width, page.rect.height)
        pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), colorspace=pymupdf.csRGB, alpha=False)
        photo = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
        for width in (3840,1600,800):
            sized = photo if width == 3840 else photo.resize((width,round(photo.height*width/photo.width)), Image.Resampling.LANCZOS)
            sized.save(folder/f'{base}-{width}.webp','WEBP',quality=88 if width==3840 else 83,method=4)
        flat = io.BytesIO(); photo.save(flat,'JPEG',quality=86,optimize=True)
        output_page=download.new_page(width=page.rect.width,height=page.rect.height)
        output_page.insert_image(output_page.rect,stream=flat.getvalue())
        records.append({'group':group,'page':index+1,'width':pix.width,'height':pix.height,'source_images':[(image[2],image[3]) for image in page.get_images()]})
        print(f'{group} {index+1}/{len(document)}: {pix.width} × {pix.height}',flush=True)
    target=root/'public'/'downloads';target.mkdir(parents=True,exist_ok=True)
    if group == 'internship': shutil.copy2(source,target/'internship-portfolio.pdf')
    else: download.save(target/'thesis-2026-portfolio.pdf',garbage=4,deflate=True)
    download.close();document.close()
(root/'src/content/media-manifest.json').write_text(json.dumps(records,indent=2))
