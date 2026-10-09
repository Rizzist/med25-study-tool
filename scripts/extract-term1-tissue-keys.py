"""Recover visible source checkmarks/highlights, then conservative exact-text key reuse.
All pixel based answers retain a source provenance label; no clinical answer is inferred.
"""
import json,re,difflib,os
from pathlib import Path
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'data/term1-telegram/questions'
WORK=Path(os.environ.get('TERM1_TISSUE_WORK_DIR','/tmp'))
D={d['file']:d for d in json.load(open(WORK/'tissue-ocr-boxes.json'))}
def norm(t):return re.sub('[^a-z0-9]','',t.lower())
def put(q,key,basis,kind):
 q.update(correctOptionId=key,answerBasis='source-reviewed',explanation=basis,sourceAnswer={'kind':kind,'optionId':key,'note':basis})
def save(d):
 d['coverage']['unresolvedAnswers']=sum(q['correctOptionId'] is None for q in d['questions']);(OUT/f"{d['paperId']}.json").write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
for pid in ['tissue-sep2019','tissue-sep2021']:
 d=json.load(open(OUT/f'{pid}.json'))
 for q in d['questions']:
  fn=f"{pid}-{q['page']:02d}.jpg";ls=D[fn]['lines'];im=np.asarray(Image.open(WORK/'tissue-ocr-pages'/fn).convert('RGB'));H,W=im.shape[:2]
  starts=[]
  for l in ls:
   m=re.match(r'^(\d{1,2})\s*[.\-)]',l['text'])
   if m and l['box'][0]<.4:starts.append((int(m[1]),sum(l['box'][1::2])/2))
  cur=next((y for n,y in starts if n==q['number']),0);bottom=min([y for n,y in starts if n>q['number'] and y>cur] or [1]); scores=[]
  for o in q['options']:
   cand=[]
   for l in ls:
    cy=sum(l['box'][1::2])/2
    if cy<cur+.01 or cy>=bottom:continue
    if pid=='tissue-sep2021' and q['number']==11 and cy<.362:continue
    if pid=='tissue-sep2021' and q['number']==1 and cy<.215:continue
    txt=re.sub(r'^[a-dA-D]\s*[.)-]\s*','',l['text']) if pid=='tissue-sep2019' else l['text']
    ratio=difflib.SequenceMatcher(None,norm(txt),norm(o['text'])).ratio()
    cand.append((ratio,l))
   if not cand:scores.append(0);continue
   ratio,l=max(cand,key=lambda x:x[0]);x,y,xx,yy=l['box']
   if ratio<.62:scores.append(0);continue
   if pid=='tissue-sep2021':
    a=im[int((y-.004)*H):int((yy+.012)*H),int(.055*W):int(.083*W)]
    scores.append(int(np.sum(np.max(a,axis=2)<100)))
   else:
    a=im[max(0,int((y-.006)*H)):int((yy+.006)*H),max(0,int((x-.015)*W)):int(min(1,xx+.015)*W)].astype(float)
    yellow=(a[:,:,1]>160)&(a[:,:,0]>150)&(a[:,:,1]>a[:,:,2]*1.5)&(a[:,:,0]>a[:,:,2]*1.4)
    scores.append(round(float(yellow.mean()),4))
  order=sorted(range(4),key=lambda i:scores[i],reverse=True);threshold=25 if pid=='tissue-sep2021' else .04
  if scores[order[0]]>threshold and scores[order[0]]>max(scores[order[1]]*3,threshold):
   key=chr(65+order[0]);put(q,key,'Answer transcribed from the '+('printed checkmark' if pid=='tissue-sep2021' else 'highlighted source key')+f' in the original PDF, page {q["page"]}. This source answer has not been independently re-solved.','printed-checkmark' if pid=='tissue-sep2021' else 'source-highlight')
  print(pid,q['number'],scores,q['correctOptionId'])
 save(d)
# Visual review of all eight question pages overrides highlight/OCR geometry.
d=json.load(open(OUT/'tissue-sep2019.json'))
keys='A C C B C C A C C B C A D C A D C A D A B A A C A D D C A A C C C B D B D D C C C D D B C D C D C C B C B'.split()
assert len(keys)==53
for q,key in zip(d['questions'],keys):put(q,key,f"Visually transcribed highlighted source answer, original PDF page {q['page']}. Source key is retained as supplied, not an independently re-solved editorial answer.",'source-highlight-visually-reviewed')
save(d)
d=json.load(open(OUT/'tissue-sep2021.json'))
put(d['questions'][0],'A','Visually reviewed printed source checkmark beside the option C (first option), original PDF page 1.','printed-checkmark')
save(d)
# Conservative reuse: exact normalized prompt AND all four option texts must match.
# Use answer text, never a letter inferred from another paper's option position.
refs=[]
for p in OUT.glob('tissue*.json'):
 for q in json.load(open(p))['questions']:
  if q['correctOptionId']:
   refs.append((p.stem,q))
for p in OUT.glob('tissue*.json'):
 d=json.load(open(p))
 for q in d['questions']:
  if q['correctOptionId'] or 'conflict' in q.get('explanation',''):continue
  matches=[(src,r) for src,r in refs if norm(q['prompt'])==norm(r['prompt']) and sorted(norm(o['text']) for o in q['options'])==sorted(norm(o['text']) for o in r['options'])]
  answers={norm(next(o['text'] for o in r['options'] if o['id']==r['correctOptionId'])) for src,r in matches}
  if len(answers)==1:
   text=answers.pop();key=next(o['id'] for o in q['options'] if norm(o['text'])==text);src,r=matches[0]
   put(q,key,f'Exact question and all option texts match {src}, source question {r["number"]}; the answer was matched by option text, preserving this paper’s order.','exact-source-text-match')
 save(d)
