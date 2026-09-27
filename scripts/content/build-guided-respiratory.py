"""Read-only PDF extraction: verified section headings and explicit paragraph locators.
Run with PyMuPDF installed. This never modifies or re-exports the review PDF.
Only declared question/quote pairs become paragraph links; no keyword-based guesses.
"""
import hashlib, json, re
from pathlib import Path
import pymupdf

root=Path(__file__).resolve().parents[2]
course=json.loads((root/'public/study/reviews/term2-respiratory.json').read_text())
volume=course['volumes'][0]
pdf=root/'public'/volume['url'].split('?')[0].lstrip('/')
sha=hashlib.sha256(pdf.read_bytes()).hexdigest()
assert sha==volume['sha256'], 'Review map and PDF version disagree'
doc=pymupdf.open(pdf)
normalize=lambda s:re.sub(r'\s+',' ',s).strip()
heading_normalize=lambda s:normalize(s).replace('\u2013','-').replace('\u2014','-')
out={'version':1,'pdfSha256':sha,'sections':{},'questions':{}}
for section in course['sections']:
    page=doc[section['pdfPage']-1]
    blocks=page.get_text('dict')['blocks']
    matches=[]
    for block in blocks:
        if 'lines' not in block:continue
        spans=[s for line in block['lines'] for s in line['spans']]
        text=normalize(' '.join(s['text'] for s in spans))
        if heading_normalize(section['title']) in heading_normalize(text) and max(s['size'] for s in spans)>=13:
            matches.append(block)
    if len(matches)==1:
        out['sections'][section['id']]={'page':section['pdfPage'],'top':round(matches[0]['bbox'][1]/page.rect.height,5)}
paragraphs=[]
for name in ['respiratory-paragraphs.json','respiratory-past-paragraphs.json']:
    paragraphs.extend(json.loads((root/'data/guided-review'/name).read_text()))
for item in paragraphs:
    page=doc[item['page']-1]
    matches=[b for b in page.get_text('blocks') if item['quote'] in normalize(b[4])]
    assert len(matches)==1, item
    block=matches[0]
    for qid in item['questionIds']:
        assert qid not in out['questions'], 'Duplicate paragraph locator: '+qid
        section=course['questions'][qid]['sectionId']
        assert section
        out['questions'][qid]={'sectionId':section,'page':item['page'],'top':round(block[1]/page.rect.height,5),'quote':normalize(block[4]).lstrip('• ')}
dest=root/'public/study/guided/term2-respiratory.json'
dest.parent.mkdir(parents=True,exist_ok=True)
dest.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(f"Verified {len(out['sections'])} section headings and {len(out['questions'])} paragraph links; PDF unchanged.")
