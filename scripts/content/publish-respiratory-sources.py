"""Import immutable study copies from the user's deduplicated archive.

Only a PDF above Git's single-file limit gets a clearly labelled web derivative;
the high-resolution archive is never modified. Publication is an explicit step.
"""
from pathlib import Path
import argparse,hashlib,json,shutil,io
import pymupdf as fitz
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

p=argparse.ArgumentParser();p.add_argument('--archive',type=Path,required=True);a=p.parse_args()
root=Path(__file__).resolve().parents[2]
catalog=json.loads((a.archive/'CATALOG.json').read_text());result=[]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for n,row in enumerate(catalog,1):
    ident=f'respiratory-{n:02}';sources=[]
    for i,rel in enumerate(row['studyFiles'],1):
        original=a.archive/rel;large=original.stat().st_size>95_000_000
        name=f'{i:02}'+('-web' if large else '')+original.suffix.lower()
        url=f'/study/respiratory/past-papers/{ident}/{name}'
        target=root/'public'/url.lstrip('/');target.parent.mkdir(parents=True,exist_ok=True)
        if large:
            doc=fitz.open(original)
            if not target.exists():
                out=canvas.Canvas(str(target));out.setTitle(row['title']+' - web study copy')
                out.setSubject('Reduced-size page images; high-resolution source preserved in local medical archive.')
                for page in doc:
                    pix=page.get_pixmap(matrix=fitz.Matrix(2.5,2.5),alpha=False)
                    jpeg=pix.tobytes('jpeg',jpg_quality=90)
                    out.setPageSize((page.rect.width,page.rect.height))
                    out.drawImage(ImageReader(io.BytesIO(jpeg)),0,0,width=page.rect.width,height=page.rect.height)
                    out.showPage()
                out.save()
            check=fitz.open(target);assert len(check)==len(doc)
            # Preserve orientation, aspect ratio and every source page.
            assert all(abs(x.rect.width/y.rect.width-x.rect.height/y.rect.height)<.001 for x,y in zip(doc,check))
        else:
            if not target.exists()or sha(target)!=sha(original):shutil.copy2(original,target)
            assert sha(target)==sha(original)
        sources.append({'title':original.name+(' (web copy)'if large else ''),'url':url,'sha256':sha(target),'bytes':target.stat().st_size,'archivePath':rel,'archiveSha256':sha(original),'webOptimized':large,'pageCount':len(fitz.open(target))if target.suffix=='.pdf'else 1})
    result.append({'id':ident,'title':row['title'],'note':row['notes'],'folder':row['folder'],'sources':sources})
    print(ident,len(sources),'sources',round(sum(s['bytes']for s in sources)/1e6,2),'MB',flush=True)
dest=root/'data/respiratory/source-manifest.json';dest.parent.mkdir(exist_ok=True)
dest.write_text(json.dumps({'version':1,'archiveDate':'2026-09-27','collections':result},ensure_ascii=False,indent=2)+'\n')
