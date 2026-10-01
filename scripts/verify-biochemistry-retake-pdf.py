"""Read-only PDF checks and contact sheets for visual QA."""
from pathlib import Path
import json
import re
from pypdf import PdfReader
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
pdf=ROOT/'public/study/reviews/biochemistry-retake.pdf'
layout=json.loads((ROOT/'data/biochemistry-retake/pdf-layout.json').read_text())
reader=PdfReader(pdf)
normalize=lambda s: re.sub(r'\W+','',s).lower()
texts=[normalize(p.extract_text() or '') for p in reader.pages]
assert len(texts)==layout['pageCount']
review=json.loads((ROOT/'data/biochemistry-retake/review.json').read_text())
flat=lambda o:[y for x in o for y in (flat(x) if isinstance(x,list) else [x])]
assert len([x for x in flat(reader.outline)])==len(review['sections'])+len({s['unit'] for s in review['sections']}),'Bookmarks: one per unit and one per section'
for group in ['concepts','checkpoints']:
    for key,point in layout[group].items():
        quote=normalize(point['quote'])
        assert quote[:100] in texts[point['page']-1],(group,key,point['page'],'Anchor text absent from page')
for i,p in enumerate(reader.pages):
    # A page may be a full-width process figure with only its title and caption as text.
    has_image='/XObject' in (p.get('/Resources') or {})
    assert len(p.extract_text() or '')>100 or has_image,f'Unexpected empty page {i+1}'
folder=ROOT/'tmp/pdfs/retake'
files=sorted(folder.glob('all-*.png'))
if files:
    assert len(files)==len(reader.pages),'Render the current PDF before creating contact sheets'
    for start in range(0,len(files),16):
        sheet=Image.new('RGB',(1440,2100),'#dce5df')
        draw=ImageDraw.Draw(sheet)
        for i,file in enumerate(files[start:start+16]):
            im=Image.open(file).convert('RGB');im.thumbnail((344,490))
            x=(i%4)*360+8;y=(i//4)*525+22
            sheet.paste(im,(x,y));draw.text((x,y-17),str(start+i+1),fill='#000000')
        sheet.save(folder/f'contact-{start//16+1}.png')
print(f"PASS: {len(texts)} pages, {len(review['sections'])} section bookmarks, all {sum(len(layout[g]) for g in ['concepts','checkpoints'])} concept/paper paragraph anchors found on their actual pages.")
