"""Extract editable candidates from native-text reports; requires editorial audit."""
from pathlib import Path
import json,re,unicodedata
import pymupdf as fitz
ROOT=Path(__file__).resolve().parents[2]
ARCHIVE=Path('/Users/rizzist/Documents/MED SLIDES/TERM 2/02 Respiratory/Past Exams')
OUT=Path('/tmp/med25-respiratory-import')
catalog=json.loads((ARCHIVE/'CATALOG.json').read_text())
def norm(t):return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',t)).strip()
def subject(t,old):
 t=norm(t).lower()
 if 'physiology'==t or 'فیزیولو' in t:return 'physiology'
 if 'anatomy'==t or 'آناتومی' in t:return 'anatomy'
 if t in ['histology','بافت']:return 'histology'
 if 'embryology'==t or 'جنین' in t:return 'embryology'
 return old
for n in [1,2,3,4,7,15]:
 c=catalog[n-1];doc=fitz.open(ARCHIVE/c['studyFiles'][0]);rows=[];sub='physiology';q=None
 for pi,page in enumerate(doc):
  blocks=page.get_text('dict')['blocks']
  if n<=4:
   ticks=[b['bbox'] for b in blocks if any('\ue013'in s['text']for l in b.get('lines',[])for s in l['spans'])]
   for b in sorted(blocks,key=lambda b:b['bbox'][1]):
    spans=[s for l in b.get('lines',[])for s in l['spans']]
    t=norm(' '.join(s['text']for s in spans))
    if not t or '\ue013'in t or b['bbox'][1]<30 or b['bbox'][1]>page.rect.height-30:continue
    sub=subject(t,sub)
    m=re.match(r'^(\d+)\s*[-–]\s*(.*)',t)
    if m and any('Bold'in s['font']for s in spans):
     q={'number':m[1],'sourceNumber':m[1],'page':pi+1,'prompt':m[2],'options':[],'providedKey':None,'key':None,'subject':sub,'note':'','reviewTerms':[],'evidence':[]};rows.append(q)
    elif q and not any('Bold'in s['font']for s in spans) and any(re.search('[A-Za-z0-9]',s['text'])for s in spans) and not re.search('http|ReportControl',t):
     q['options'].append(t)
     if any(b['bbox'][1]-2<=(tick[1]+tick[3])/2<=b['bbox'][3]+6 for tick in ticks):q['providedKey']=q['key']=chr(64+len(q['options']))
  else:
   for line in page.get_text(sort=True).splitlines():
    t=norm(line.replace('\u200b',''))
    if not t or re.match(r'^\d+\s*\|',t):continue
    old=sub;sub=subject(t,sub)
    if sub!=old or t.lower()in['anatomy','embryology','histology','physiology','histology and embriology']:continue
    m=re.match(r'^(\d+)\s*[-.]\s*(.*)',t)
    op=re.match(r'^([A-Ea-e])[).\-]\s*(.*)',t)
    if m:
     q={'number':m[1],'sourceNumber':m[1],'page':pi+1,'prompt':m[2],'options':[],'providedKey':None,'key':None,'subject':sub,'note':'','reviewTerms':[],'evidence':[]};rows.append(q)
    elif op and q:q['options'].append(op[2])
    elif q:
     if q['options']:q['options'][-1]+=' '+t
     else:q['prompt']+=' '+t
 ident=f'respiratory-{n:02}'
 data={'id':ident,'title':c['title'],'note':c['notes'],'defaultEligible':True,'kind':'supplied-source-paper','questions':rows,'excludedItems':[],'audit':{'status':'DRAFT','notes':'Native-text extraction; editorial review pending.'}}
 dest=OUT/ident/'candidate.json';dest.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 (OUT/ident/'candidates.txt').write_text('\n\n'.join(f'{r["number"]} [p{r["page"]} {r["subject"]}] {r["prompt"]}\n'+ '\n'.join(f'{chr(65+i)}. {o}'for i,o in enumerate(r['options']))+f'\nMARK {r["providedKey"]}'for r in rows))
 print(ident,len(rows),'items',[(r['number'],len(r['options']))for r in rows if len(r['options'])!=4])
