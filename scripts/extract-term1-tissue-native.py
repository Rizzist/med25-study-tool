"""Extract original native report questions, preserving source option order and printed keys.
Run with pymupdf installed. No medical/editorial answer inference is performed.
"""
import json,re
from pathlib import Path
import pymupdf as fitz
ROOT=Path(__file__).resolve().parents[1]
IDS=['tissue-test20162','tissue-test22204','tissue-feb','tissue-practical20172','tissue-anatomy22196','tissue-dds-compilation']
OUT=ROOT/'data/term1-telegram/questions'
FIG=ROOT/'public/study/term1-telegram/figures'
def clean(t):
 return re.sub(r'\s+',' ',t).strip()
for pid in IDS:
 doc=fitz.open(ROOT/f'public/study/term1-telegram/{pid}.pdf')
 lines=[]; marks=[]; starts=[]; imageRects={}
 for p in doc:
  imageRects[p.number]=[fitz.Rect(i['bbox']) for i in p.get_image_info()]
  for b in p.get_text('dict')['blocks']:
   for l in b.get('lines',[]):
    s=l['spans']; t=clean(''.join(x['text'] for x in s)); r=l['bbox']
    if not t:continue
    if '\ue013' in t:
     marks.append({'p':p.number,'r':r});continue
    if ('Arial' in s[0]['font'] and s[0]['size']<=8.1) or re.search(r'exam\.tums|آزﻣﻮن|آزمون|^\d+/\d+$',t):continue
    if not re.search('[a-zA-Z0-9+]',t):continue
    lines.append({'p':p.number,'r':r,'t':t,'font':s[0]['font'],'size':s[0]['size']})
 lines.sort(key=lambda l:(l['p'],l['r'][1],l['r'][0]))
 merged=[]
 for l in lines:
  if merged and merged[-1]['p']==l['p'] and abs(merged[-1]['r'][1]-l['r'][1])<3:
   old=merged[-1]; pair=sorted([old,l],key=lambda a:a['r'][0]);old['t']=' '.join(a['t'] for a in pair);old['r']=(min(old['r'][0],l['r'][0]),max(old['r'][1],l['r'][1]),max(old['r'][2],l['r'][2]),max(old['r'][3],l['r'][3]));old['size']=max(old['size'],l['size']);old['font']=l['font'] if l['size']>=old['size'] else old['font']
  else:merged.append(l.copy())
 lines=merged
 for i,l in enumerate(lines):
  m=re.match(r'^(\d+)\s*[-–]\s*(.*)',l['t'])
  if m and l['r'][0]<220:
   starts.append((i,int(m[1])))
 qs=[];issues=[]
 for z,(idx,num) in enumerate(starts):
  end=starts[z+1][0] if z+1<len(starts) else len(lines)
  ls=lines[idx:end]; prompt=[]; options=[]; orows=[]
  for k,l in enumerate(ls):
   t=l['t']
   if k==0:t=re.sub(r'^\d+\s*[-–]\s*','',t)
   t=re.sub(r'^[^A-Za-z0-9(]*ﺳﻮال\s*','',t).strip()
   if t in ['Histology','Embryology','Physiology','Anatomy'] or re.match(r'^\d{1,2}/\d{1,2}/20',t):continue
   if not t:continue
   # Native exam exports use bold font for stem and regular font for options.
   if l['size']>=ls[0]['size']-0.1 and not options:prompt.append(t)
   elif l['size']>=ls[0]['size']-0.1: # section title after options
    continue
   elif options and t.startswith(', but not'):options[-1]+=' '+t;orows[-1].append(l)
   elif not options or (l['p']!=orows[-1][-1]['p'] or l['r'][1]-orows[-1][-1]['r'][1]>l['size']*1.7):
    options.append(t);orows.append([l])
   else:options[-1]+=' '+t;orows[-1].append(l)
  # Source keys are checkmark glyphs aligned to the original option rows.
  hit=[]
  for oi,rows in enumerate(orows):
   if any(m['p']==r['p'] and abs(m['r'][1]-r['r'][1])<max(11,r['size']) for r in rows for m in marks):hit.append(oi)
  answer=chr(65+hit[0]) if len(hit)==1 and len(options)==4 else None
  media=[]
  first,last=ls[0],ls[-1]
  for pn in range(first['p'],last['p']+1):
   page=doc[pn];top=first['r'][1]-3 if pn==first['p'] else 25
   bottom=(lines[end]['r'][1]-5 if end<len(lines) and lines[end]['p']==pn else page.rect.height-28)
   clip=fitz.Rect(20,top,page.rect.width-20,bottom)
   imgs=[r for r in imageRects[pn] if r.intersects(clip) and r.width>25 and r.height>25]
   if imgs:
    # Strip printed key marks from the temporary in-memory question crop.
    cp=fitz.open();cp.insert_pdf(doc,from_page=pn,to_page=pn);pg=cp[0]
    for m in marks:
     if m['p']==pn:pg.add_redact_annot(fitz.Rect(m['r'])+(-1,-1,1,1),fill=(1,1,1))
    pg.apply_redactions(images=0)
    name=f'{pid}-{z+1:03d}-p{pn+1}.jpg'
    pg.get_pixmap(matrix=fitz.Matrix(1.7,1.7),clip=clip).save(FIG/name)
    media.append({'src':f'/study/term1-telegram/figures/{name}','alt':f'Original question {num}, source page {pn+1}; printed answer checkmarks removed.'})
  q={'number':num,'sourceOrdinal':z+1,'page':first['p']+1,'prompt':clean(' '.join(prompt)),'options':[{'id':chr(65+i),'text':clean(t)} for i,t in enumerate(options)],'correctOptionId':answer,'explanation':'The answer is the option marked in the original exam report.' if answer else 'No unambiguous source answer could be recovered; this question is ungraded.','answerBasis':'source-reviewed' if answer else 'unresolved','subject':next((l['t'].lower() for l in reversed(lines[:idx]) if l['t'] in ['Histology','Embryology','Physiology','Anatomy']),'histology'),'sourceAnswer':{'kind':'printed-checkmark','optionId':answer} if answer else None}
  if media:q['media']=media
  if len(options)!=4 or not prompt:
   issues.append({'ordinal':z+1,'number':num,'page':first['p']+1,'options':len(options),'prompt':q['prompt']})
  qs.append(q)
 result={'paperId':pid,'questions':qs,'notes':['Questions and options retain the original report wording and order. Printed checkmark keys are source answers, not independently re-solved editorial keys. Repeated question numbers in compilations are retained as separate source occurrences.'],'coverage':{'sourcePages':len(doc),'questionOccurrences':len(qs),'transcribedQuestions':len(qs),'unresolvedAnswers':sum(q['correctOptionId'] is None for q in qs),'parserIssues':issues}}
 (OUT/f'{pid}.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 print(pid,len(qs),'issues',issues)
