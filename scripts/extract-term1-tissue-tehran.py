"""Transcribe the 84-question Tehran source photo sequence, retaining printed numbering."""
import json,re,os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'data/term1-telegram/questions'
WORK=Path(os.environ.get('TERM1_TISSUE_WORK_DIR','/tmp'))
D=json.load(open(WORK/'tissue-ocr-boxes.json'));allq={}
for d in D:
 if not d['file'].startswith('tissue-tehran'):continue
 pn=int(d['file'][-6:-4]);ls=sorted(d['lines'],key=lambda l:((l['box'][1]+l['box'][3])/2,l['box'][0]))
 hs=[l for l in ls if 'Place the name' in l['text']]
 if pn==5:hs=[{'text':'','box':[.119,.143,.5,.15]},{'text':'','box':[.141,.389,.5,.4]}]+hs
 if pn in [8,9]:hs=[{'text':'','box':[.13,.17,.5,.185]}]+hs
 nums={1:[1,2,3],2:[4,5,6],3:[7,8],4:[9,10,11],5:[11,12,13],6:[14,15,16],7:[17,18,19],8:[19,20,21,22],9:[22,23,24]}.get(pn,list(range(25+(pn-10)*3,28+(pn-10)*3)))
 for i,(h,n) in enumerate(zip(hs,nums)):
  top=h['box'][1]-.004;bot=hs[i+1]['box'][1]-.035 if i+1<len(hs) else .95
  cs=[]
  for l in ls:
   x,y,xx,yy=l['box'];cy=(y+yy)/2;t=l['text']
   if cy<top or cy>=bot or x<h['box'][0]-.025:continue
   if re.search(r'Place the name|Question ti|Quesion li|Questine ti|^Source|^Sourcc|^Descrip',t,re.I) or re.fullmatch(r'[0-9 .|•→\-]+',t):continue
   t=re.sub(r'^[1-4][ .|•L]*\s+(?=[A-Za-z])','',t)
   if len(t)>2:cs.append(t)
  q={'number':n,'sourceOrdinal':n,'page':pn,'prompt':' '.join(cs[:-4]),'options':[{'id':chr(65+i),'text':t} for i,t in enumerate(cs[-4:])],'correctOptionId':None,'answerBasis':'unresolved','explanation':'This source does not contain a verified answer key; handwritten selections are not used for grading.','subject':'physiology' if n<17 else 'histology' if n<67 else 'embryology'}
  allq[n]=q
qs=list(allq.values());d={'paperId':'tissue-tehran2026','questions':qs,'notes':['84 printed questions across 29 overlapping source photographs. Overlapping partial views are joined into one occurrence per printed question number. No unverified student selections are used as scored answers.'],'coverage':{'sourcePages':29,'questionOccurrences':len(qs),'transcribedQuestions':len(qs),'unresolvedAnswers':len(qs)}}
(OUT/'tissue-tehran2026.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
(WORK/'tissue-tehran-review.txt').write_text('\n'.join(f"{q['number']} p{q['page']} {q['prompt']}\n"+' | '.join(o['id']+': '+o['text'] for o in q['options']) for q in qs))
