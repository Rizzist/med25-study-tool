"""Build the reviewed Term 1 original-paper library from a local Telegram download archive.
Usage: python scripts/import-term1-telegram.py SOURCE_DIRECTORY
Requires PyMuPDF and Pillow. Never infers an answer key or modifies the scored MCQ banks.
"""
import hashlib,json,shutil,sys
from pathlib import Path
import pymupdf as fitz
from PIL import Image,ImageOps

root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]).resolve()
plan=json.loads((root/'data/term1-telegram/import-plan.json').read_text())
out=root/'public/study/term1-telegram';out.mkdir(parents=True,exist_ok=True)
sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest()
items=[]
for row in plan['papers']:
    originals=[source/f for f in row['files']]
    for f in originals:
        if not f.is_file():raise FileNotFoundError(f)
    ext='.pdf' if row.get('format')=='photo-pdf' else originals[0].suffix.lower()
    target=out/(row['id']+ext)
    if row.get('format')=='photo-pdf':
        doc=fitz.open()
        for f in originals:
            with Image.open(f) as im:
                w,h=ImageOps.exif_transpose(im).size
            # Embed the downloaded JPEG without resampling, keeping the full photographed page.
            page=doc.new_page(width=595,height=595*h/w)
            page.insert_image(page.rect,filename=str(f))
            if w>h:page.set_rotation(90)
        doc.set_metadata({'title':row['title'],'subject':row['note'],'creator':'MED25 source archive'})
        doc.save(target,garbage=4,deflate=True,no_new_id=True)
        doc.close()
    elif row['id']=='tissue-2023-annotated':
        # The 66 MB scan contains oversized page images. A reading copy capped at 3000 pixels on the long edge retains all pages.
        original=fitz.open(originals[0]);doc=fitz.open()
        for page in original:
            scale=3000/max(page.rect.width,page.rect.height)
            pix=page.get_pixmap(matrix=fitz.Matrix(scale,scale))
            copied=doc.new_page(width=595,height=595*page.rect.height/page.rect.width)
            copied.insert_image(copied.rect,stream=pix.tobytes('jpeg',jpg_quality=88))
        doc.set_metadata({'title':row['title'],'subject':'Reading copy; full-resolution original retained in local source archive.'})
        doc.save(target,garbage=4,deflate=True,no_new_id=True);doc.close()
    else:shutil.copyfile(originals[0],target)
    item={k:v for k,v in row.items() if k not in ('files','format')}
    item.update(url='/study/term1-telegram/'+target.name,format=ext[1:].upper(),bytes=target.stat().st_size,sha256=sha(target),pages=len(fitz.open(target)) if ext=='.pdf' else None,sourceFiles=[{'name':f.name,'sha256':sha(f)} for f in originals],mode='source-only')
    items.append(item)
catalog={'schemaVersion':1,'collectedOn':plan['collectedOn'],'coverage':plan['coverage'],'papers':items,'exclusions':plan['exclusions']}
(out/'catalog.json').write_text(json.dumps(catalog,indent=2,ensure_ascii=False)+'\n')
(root/'data/term1-telegram/catalog.json').write_text(json.dumps(catalog,indent=2,ensure_ascii=False)+'\n')
print(f"Built {len(items)} reviewed source entries, {sum(i['pages'] or 0 for i in items)} PDF pages. Scored banks unchanged.")
