"""One-time import of the already reviewed sources. Normal builds are portable.

Use bundled PyMuPDF. Copies existing PDFs/images without modifying their content.
The canonical Religion Review and original Downloads remain unchanged.
"""
from pathlib import Path
import hashlib, json, re, shutil, sys
import pymupdf as fitz

ROOT=Path(__file__).resolve().parent.parent
SOURCE=Path(sys.argv[1])
OUT=ROOT/'data/religion'
PUBLIC=ROOT/'public/study/religion'
OUT.mkdir(parents=True,exist_ok=True)
(PUBLIC/'past-papers').mkdir(parents=True,exist_ok=True)
def load(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def clean(t):return re.sub(r'\s+',' ',t).strip()
review=load(SOURCE/'content/religion.json')
pdf=fitz.open(SOURCE.parent/'09 - Religion Review.pdf')
toc={title:page for _,title,page in pdf.get_toc()}
def references(section):
    return [{k:v for k,v in s.items() if k!='path'} | ({'filename':Path(s['path']).name} if s.get('path') else {}) for s in section['sources']]
modules=[{'id':s['id'],'title':s['title'],'reviewPage':toc[s['title']],
          'reviewSection':i+1,'basis':s['basis'],'references':references(s),'blocks':s['blocks']}
         for i,s in enumerate(review['sections'])
         if not re.search(r'reading-map|paper-map|revision-checklist|source-coverage|assessment',s['id'])]
definitions=[
 ('O','Original 40-item paper',SOURCE/'sources/religion-paper/render/1_28599620737.pdf','original-40.pdf','1_28599620737.docx',40),
 ('D','100-item compilation',SOURCE/'sources/religion-more-papers/render-docx/RELIGION_FINAL[1].pdf','compilation-100.pdf','RELIGION_FINAL[1].docx',100),
 ('A','Introduction to Religion · 2021/6/21',SOURCE/'sources/religion-more-papers/exam (inro to religion 1 ).pdf','intro-2021.pdf','exam (inro to religion 1 ).pdf',20),
 ('F','Religion February · year unconfirmed',SOURCE/'sources/religion-more-papers/religion feb.pdf','february.pdf','religion feb.pdf',20),
]
papers=[]; pages={}
for id,title,path,dest,original,count in definitions:
    assert path.exists(),path
    shutil.copy2(path,PUBLIC/'past-papers'/dest)
    doc=fitz.open(path)
    pages[id]=[p.get_text() for p in doc]
    papers.append({'id':id,'title':title,'file':'/study/religion/past-papers/'+dest,
                   'originalFilename':original,'itemCount':count,'pages':len(doc),'sha256':sha(path),'officialKey':False})
def page_for(id,n):
    matches=[i+1 for i,t in enumerate(pages[id]) if re.search(r'(?m)^\s*'+str(n)+r'\s*[.\-)]',t)]
    assert matches,(id,n)
    return matches[0]
records=[]
for q in load(SOURCE/'sources/religion-paper/question-review-map.json'):
    n=q['number']
    records.append({'id':f'O{n}','paperId':'O','number':n,'page':page_for('O',n),
                    'prompt':q['question'],'options':q['options'],'sectionId':q['reviewSection'],
                    'providedAnswer':q['markedAnswer'],'providedAnswerKind':'Highlighted choice; not an official key',
                    'priorReviewedAnswer':q['reviewedOption'],'qualification':q['explanation'] if q['qualified'] else '',
                    'priorExplanation':q['explanation'],'rawSourceText':None,'sameItemAs':None})
for q in load(SOURCE/'sources/religion-more-papers/item-teaching-map.json'):
    text=q['sourceText']; opts=list(re.finditer(r'(?m)^\s*([A-D])\s*[.\-]\s*',text))
    if q['source']=='F':
        # F omits printed A-D labels. Locate its own option boundaries using the
        # previously verified corresponding A item; never replace F's wording.
        peer=next(r for r in records if r['id']==q['sameItemAs'])
        flat=clean(re.split(r'[\ue000-\uf8ff]|آزمون:',text)[0])
        anchors=[clean(o).lstrip('. ').rstrip('.') for o in peer['options'].values()]
        starts=[flat.find(a) for a in anchors]
        assert min(starts)>=0 and starts==sorted(set(starts)),(q['id'],anchors,flat)
        prompt=re.sub(r'^\d+\s*[-.]\s*','',flat[:starts[0]])
        options={letter:flat[starts[i]:starts[i+1] if i<3 else len(flat)].strip() for i,letter in enumerate('ABCD')}
    else:
        assert [m[1] for m in opts]==list('ABCD'),q['id']
        prompt=re.sub(r'^\s*\d+\s*[.\-)]\s*','',text[:opts[0].start()])
        options={m[1]:clean(text[m.end():opts[i+1].start() if i<3 else len(text)]) for i,m in enumerate(opts)}
    records.append({'id':q['id'],'paperId':q['source'],'number':q['number'],'page':page_for(q['source'],q['number']),
                    'prompt':clean(prompt),'options':options,'sectionId':q['reviewSection'],
                    'providedAnswer':q.get('providedAnswerSheetLetter'),
                    'providedAnswerKind':'Compilation answer sheet; not an official key' if q['source']=='D' else 'See original marks; not an official key' if q['source']=='A' else 'No visible source key',
                    'qualification':q.get('qualification',''),'priorExplanation':'','rawSourceText':text,
                    'sameItemAs':q.get('sameItemAs')})
assert len(records)==180 and len({r['id'] for r in records})==180
shutil.copy2(SOURCE/'sources/religion-more-papers/image1.png',PUBLIC/'quran-3-85.png')
for r in records:
    r['locator']=f"Item {r['number']} · PDF page {r['page']}"
    if r['id']=='D100':r['media']={'path':'religion/quran-3-85.png','alt':'Original Arabic verse supplied with source item D100','attribution':'RELIGION_FINAL[1].docx · original embedded image'}
# Exact repeated question clusters, not merely similar concepts. A/F identities
# were established in the review's page-by-page comparison.
duplicates={'A1':'D56','A2':'D48','A10':'D57','A13':'D58','A16':'D49','A18':'D61'}
for r in records:
    if r['id'] in duplicates:r['sameItemAs']=duplicates[r['id']]
data={'version':1,'imported':'2026-09-15','review':{'title':'Religion Review','sha256':sha(SOURCE/'content/religion.json'),
      'pdfSha256':sha(SOURCE.parent/'09 - Religion Review.pdf'),'pages':len(pdf),'scope':review['scope'],'gaps':review['gaps']},
      'modules':modules,'papers':papers,'records':records,
      'policy':'Newly authored practice is separate. Source occurrences are preserved, duplicates linked; scored keys require explicit review. No official key or complete-current-syllabus claim.'}
(OUT/'sources.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print(f'Imported {len(records)} source occurrences and {len(modules)} teaching modules.')
