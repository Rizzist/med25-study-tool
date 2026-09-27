"""Read-only archive extraction for editorial transcription; never publishes OCR.

Reuses the archive's existing OCR and original page-order map. Outputs live under
an explicitly supplied scratch directory, not the published question bank.
"""
from pathlib import Path
import argparse, hashlib, json, re
import pymupdf as fitz

p=argparse.ArgumentParser()
p.add_argument('--archive',type=Path,required=True)
p.add_argument('--previous-work',type=Path,required=True)
p.add_argument('--output',type=Path,required=True)
a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
catalog=json.loads((a.archive/'CATALOG.json').read_text())
manifest=[]
for n,c in enumerate(catalog,1):
    ident=f'respiratory-{n:02d}'
    out=a.output/ident;out.mkdir(exist_ok=True)
    metadata=json.loads((a.archive/c['folder']/'_metadata/sources.json').read_text())
    pages=[]
    for file in c['studyFiles']:
        src=a.archive/file
        digest=hashlib.sha256(src.read_bytes()).hexdigest()
        if src.suffix.lower()=='.pdf':
            study=next((r for r in metadata.get('studyFiles',[])if r['archivePath']==file),None)
            source=next((r for r in metadata['sources']if r['sourceId']==study.get('sourceId')),None) if study else next((r for r in metadata['sources']if r['archivePath']==file),None)
            sha=source['sha256'] if source else digest
            doc=fitz.open(src)
            for i,page in enumerate(doc):
                originalPage=study['sourcePageOrder'][i] if study and 'sourcePageOrder'in study else i+1
                embedded=page.get_text(sort=True)
                ocr=next((a.previous_work/folder/sha[:12]/f'{originalPage:03}-ocr.json' for folder in ['dedup-audit','inspect'] if(a.previous_work/folder/sha[:12]/f'{originalPage:03}-ocr.json').exists()),None)
                lines=json.loads(ocr.read_text()) if ocr else []
                # VN bounding boxes use lower-left origins. Cluster rows before x-sort.
                lines.sort(key=lambda r:(-round((r['y']+r['height']/2)*90),r['x']))
                ocrtext='\n'.join(r['text']for r in lines)
                # Only long embedded text is a candidate transcript; OCR stays labeled.
                text=embedded if len(embedded.strip())>150 else ocrtext
                pages.append({'page':len(pages)+1,'file':file,'filePage':i+1,'text':text,'method':'embedded' if text==embedded else 'unverified-ocr','ocr':str(ocr)if ocr else None})
                (out/f'{len(pages):03}.txt').write_text(text)
        else:
            i=len(pages)+1
            ocr=a.archive/c['folder']/f'_metadata/ocr/{i:03}.txt'
            text=ocr.read_text()if ocr.exists()else''
            pages.append({'page':i,'file':file,'filePage':1,'text':text,'method':'unverified-ocr','ocr':str(ocr)})
            (out/f'{i:03}.txt').write_text(text)
    (out/'pages.json').write_text(json.dumps(pages,ensure_ascii=False,indent=2)+'\n')
    (out/'all.txt').write_text('\n\n'.join(f'### PAGE {r["page"]} ({r["method"]})\n{r["text"]}'for r in pages))
    row={**c,'id':ident,'pages':len(pages),'scratch':str(out),'missingTextPages':[r['page']for r in pages if len(r['text'].strip())<70]}
    manifest.append(row)
    print(ident,c['title'],len(pages),'pages; short/empty',row['missingTextPages'])
(a.output/'inventory.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
