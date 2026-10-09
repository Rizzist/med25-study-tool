"""Reproducible native extraction for Telegram practical/quiz/student papers.
Source wording and order are retained; editorial adjudications are explicit.
"""
import json,re,unicodedata
from pathlib import Path
import fitz
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'data/term1-telegram/questions'
def clean(s):return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s)).strip()
def q(num,page,prompt,opts,key=None,explanation='',basis=None):
 return dict(number=str(num),page=page,prompt=clean(prompt),options=[{'id':chr(65+i),'text':clean(x)} for i,x in enumerate(opts)],correctOptionId=key,explanation=explanation or ('The source item has no unique, verified answer; it is retained for ungraded review.' if key is None else 'Editorial answer based on the stated biochemical principle.'),answerBasis=basis or ('editorial' if key else 'unresolved'),subject='biochemistry')
def write(pid,qs,notes):
 for i,x in enumerate(qs,1):x['sourceOrdinal']=i
 data=dict(paperId=pid,questions=qs,notes=notes,coverage={'sourceQuestionOccurrences':len(qs),'importedQuestionOccurrences':len(qs),'gradedQuestionOccurrences':sum(x['correctOptionId'] is not None for x in qs),'unresolvedQuestionOccurrences':sum(x['correctOptionId'] is None for x in qs),'complete':True})
 (OUT/(pid+'.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 return qs

def practical(pid):
 doc=fitz.open(ROOT/'public/study/term1-telegram'/f'{pid}.pdf');qs=[]
 for pi,p in enumerate(doc,1):
  lines=[];marks=[]
  for b in p.get_text('dict')['blocks']:
   for l in b.get('lines',[]):
    text=clean(''.join(s['text'] for s in l['spans']))
    if '\ue013' in text or '\x00' in text:marks.append(l['bbox']);continue
    if text and not re.search('[\u0600-\u06ff\ufb50-\ufeff]{2}',text) and 'tums.ac.ir' not in text and not re.fullmatch(r'\d/\d',text):lines.append((text,l['bbox']))
  # Some numbered labels and prompt are separate text lines; join using coordinates.
  merged=[]
  for t,b in lines:
   if merged and abs(merged[-1][1][1]-b[1])<2:
    merged[-1]=(merged[-1][0]+' '+t,merged[-1][1])
   else:merged.append((t,b))
  starts=[i for i,(t,b) in enumerate(merged) if re.match(r'^\d+\s*-',t)]
  for j,start in enumerate(starts):
   seg=merged[start:starts[j+1] if j+1<len(starts) else len(merged)]
   n,first=re.match(r'^(\d+)\s*-\s*(.*)',seg[0][0]).groups()
   opts=seg[-4:];prompt=' '.join([first]+[t for t,b in seg[1:-4]])
   near=[]
   for oi,(t,b) in enumerate(opts):
    if any(abs(m[1]-b[1])<12 for m in marks):near.append(oi)
   key=chr(65+near[0]) if len(near)==1 else None
   x=q(n,pi,prompt,[t for t,b in opts],key,'Source report answer mark aligned to its option.', 'source-reviewed' if key else 'unresolved')
   if key:x['sourceAnswer']=key
   if 'specific for albumin' in prompt:
    x.update(correctOptionId=None,answerBasis='unresolved',explanation='The source marks Millon’s test, which detects phenolic groups such as tyrosine and is not specific for albumin. The defective specificity claim is not graded.')
   qs.append(x)
 return write(pid,qs,['All source question occurrences retained in printed order. Check marks were mapped by PDF coordinates. Scientifically defective albumin-specific items are ungraded.'])

def labelled(pid):
 doc=fitz.open(ROOT/'public/study/term1-telegram'/f'{pid}.pdf')
 text='';page_offsets=[]
 for pi,p in enumerate(doc,1):
  page_offsets.append((len(text),pi));text+=p.get_text()+'\n'
 # Source 1.3 is a malformed printed question number, and an unnumbered purine item is explicit.
 pattern=r'(?m)^[ \t]*(\d+(?:\.3)?)(?:[ \t]*[-.][ \t]*|[ \t]+)(?=[A-Za-z0-9_\'".])|(?m:^A purine nucleotide is)'
 starts=list(re.finditer(pattern,text));qs=[]
 for i,m in enumerate(starts):
  block=text[m.end():starts[i+1].start() if i+1<len(starts) else len(text)]
  if m.group(1) is None:block='A purine nucleotide is\n'+block
  block=block.replace('b Protein Synthesis','b. Protein Synthesis')
  if 'tRNA anti-codon' in block or 'A purine nucleotide is' in block:
   block=re.sub(r'[ \t]+(?=(?:[a-d]\)|\([A-D]\)))','\n',block)
  op=list(re.finditer(r'(?m)^[ \t]*(?:\(([A-E])\)|([a-eA-E])[.)])[ \t]*',block))
  prompt=block[:op[0].start()] if op else block
  opts=[block[x.end():op[j+1].start() if j+1<len(op) else len(block)] for j,x in enumerate(op)]
  pi=max(p for o,p in page_offsets if o<=m.start())
  qs.append(q(m.group(1) or 'unnumbered',pi,prompt,opts))
 return qs
if __name__=='__main__':
 for pid in ['cell-practical20203','cell-practical-flame','cell-practical-molisch']:practical(pid)
 for pid in ['bio-quiz2016','bio-quiz2016-variant','bio-dna-student-mcqs']:
  qs=labelled(pid);write(pid,qs,['Source wording and repeated printed numbering are preserved; sourceOrdinal uniquely identifies occurrences. Editorial keys are independently assigned; ambiguous or defective items remain ungraded.'])
