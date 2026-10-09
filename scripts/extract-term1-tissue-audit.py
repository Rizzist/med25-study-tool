"""Final independent-review corrections. Run LAST after all Tissue extraction stages.
Preserves source keys as provenance; applies corrections by prompt and option TEXT
so option permutations and all DDS occurrences receive the same scientific ruling.
"""
import json,re
from pathlib import Path
import pymupdf as fitz
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'data/term1-telegram/questions';FIG=ROOT/'public/study/term1-telegram/figures'
D={p.stem:json.loads(p.read_text()) for p in OUT.glob('tissue*.json')}
def norm(s):return re.sub(r'[^a-z0-9]','',s.lower())
def item(pid,n):return next(q for q in D[pid]['questions'] if q['sourceOrdinal']==n)
def rule(pid,n,answer,reason):
 target=item(pid,n);stem=norm(target['prompt']);hits=[]
 for d in D.values():
  for q in d['questions']:
   if norm(q['prompt'])!=stem:continue
   if answer is None:
    q.update(correctOptionId=None,answerBasis='unresolved',explanation=reason+' The original source mark is retained as provenance; this question is ungraded.')
   else:
    matches=[o['id'] for o in q['options'] if norm(o['text'])==norm(answer)]
    if len(matches)!=1:raise ValueError((d['paperId'],q['sourceOrdinal'],answer))
    has_mark=bool(q.get('sourceAnswer') and q['sourceAnswer'].get('optionId'))
    q.update(correctOptionId=matches[0],answerBasis='editorial',explanation=('Editorial correction of the source key: ' if has_mark else 'Editorial answer (no reliable source key): ')+reason+(' The original source mark is retained as provenance.' if has_mark else ''))
   hits.append((d['paperId'],q['sourceOrdinal']))
 print(pid,n,hits)
rule('tissue-sep2021',38,'zona pellucida','The zona pellucida must be shed before blastocyst implantation; cytotrophoblast is needed for implantation.')
rule('tissue-sep2021',41,'Week two','The first missed menstrual period usually occurs about two weeks after fertilization, corresponding to four gestational weeks.')
rule('tissue-sep2021',44,'Sclerotomes','Vertebrae develop from the sclerotomes of the somites.')
rule('tissue-sep2021',45,None,'Perichondrium is dense irregular connective tissue. None of the printed choices supplies the requested dense regular connective tissue.')
rule('tissue-test20162',51,None,'Ureter, gastrointestinal tract and bile duct are unitary smooth muscle; ciliary muscle is multi-unit. Three printed options fit the question.')
rule('tissue-test22204',40,'normally contains only fluid','The intraembryonic coelom is mesoderm-lined, not endoderm-lined. The fluid-containing cavity gives rise to pericardial, pleural and peritoneal cavities.')
rule('tissue-test22204',58,'is caused by a failure of the neural folds to meet and fuse','Myelomeningocele is a neural-tube closure defect. The original upper-limb paralysis statement is incorrect.')
rule('tissue-anatomy22196',29,'Discontinuous Ringle Form Hyalin cartilage tissue','The trachea contains discontinuous C-shaped rings of hyaline cartilage, open posteriorly.')
rule('tissue-anatomy22196',51,None,'Both the appendix and ascending colon belong to the large intestine; the printed item has more than one valid option.')
rule('tissue-anatomy22196',66,None,'Lateral sulcus and Sylvian sulcus are synonyms, and both printed options identify the groove separating the temporal and frontal lobes.')
rule('tissue-test20162',13,None,'Both elastic and hyaline cartilage contain type II collagen, so the printed item has more than one valid option.')
rule('tissue-jan2023',22,None,'Both hyaline and elastic cartilage contain type II collagen, so the printed item has more than one valid option.')
rule('tissue-jan2023',23,None,'Perichondrium has dense irregular collagenous connective tissue; the printed choices do not clearly supply the requested regular collagen arrangement.')
rule('tissue-jan2023',26,'Spongy Bone','Spongy bone is arranged in trabeculae and lacks the osteons (Haversian systems) characteristic of compact bone.')
rule('tissue-jan2023',41,'Cytotrophoblast','The mitotically active cytotrophoblast replenishes trophoblast cells during implantation; the syncytiotrophoblast itself does not divide.')
rule('tissue-jan2023',63,None,'The phrase “up to 2 weeks” makes this item timing-dependent: fetal villous vessels and their endothelium develop during the third week. The supplied key does not resolve this ambiguity.')
rule('tissue-sep2019',44,'Association','A nonrandom concurrence of anomalies without a demonstrated single cause is an association.')
rule('tissue-jan2025',41,None,'Blastocyst formation is a first-week event, and gastrulation normally begins in the third week. Both are exceptions to second-week events, so there is no unique printed answer.')
rule('tissue-test22204',38,'Meiosis I - prophase','Primary oocytes remain arrested in prophase I from fetal life until resumption of meiosis around ovulation.')
rule('tissue-test22204',57,'epiblast','Epiblast forms the floor of the amniotic cavity in the bilaminar embryonic disc.')
# Source transcription/numbering fixes retain source encounter order as sourceOrdinal.
item('tissue-sep2019',28)['prompt']='Maternal serum alpha-fetoprotein increases if the fetus has'
t=D['tissue-tehran2026']
for ordinal,number in {4:6,5:7,6:8,7:4,8:5}.items():item(t['paperId'],ordinal)['number']=number
item(t['paperId'],65)['options'][0]['text']='hours'
def crop(pid,ordinal,page,r):
 q=item(pid,ordinal);doc=fitz.open(ROOT/f'public/study/term1-telegram/{pid}.pdf');p=doc[page-1];box=fitz.Rect(r[0]*p.rect.width,r[1]*p.rect.height,r[2]*p.rect.width,r[3]*p.rect.height)
 name=f'{pid}-q{ordinal:03d}-figure.jpg';p.get_pixmap(matrix=fitz.Matrix(3,3),clip=box).save(FIG/name)
 q['media']=[{'src':f'/study/term1-telegram/figures/{name}','alt':f'Original figure for source question {q["number"]}, occurrence {ordinal}, page {page}.'}]
crop('tissue-tehran2026',4,2,(.615,.175,.915,.252))
crop('tissue-tehran2026',8,3,(.69,.477,.901,.548))
# February's broken embedded images are reconstructed from the identical question
# and complete option set in Test 22204; figure-only crops avoid source answer marks.
ref=fitz.open(ROOT/'public/study/term1-telegram/tissue-test22204.pdf')
for target,source,page,boxes in [(64,69,16,[(51.5,61.25,203.75,210.5)]),(70,65,15,[(51.5,61.25,73.25,81.5),(51.5,104,316.25,206.75)]),(73,71,17,[(51.5,136.25,246.5,280.25)])]:
 q=item('tissue-feb',target);s=item('tissue-test22204',source)
 assert norm(q['prompt'])==norm(s['prompt'])
 assert sorted(norm(o['text']) for o in q['options'])==sorted(norm(o['text']) for o in s['options'])
 q['media']=[]
 for i,box in enumerate(boxes):
  name=f'tissue-feb-q{target:03d}-restored-{i+1}.jpg';ref[page-1].get_pixmap(matrix=fitz.Matrix(3,3),clip=fitz.Rect(box)).save(FIG/name)
  q['media'].append({'src':f'/study/term1-telegram/figures/{name}','alt':f'Figure restored from the identical question in Tissue Test 22204, question {source}, page {page}; the February original contains a broken image placeholder.'})
 fig_note=' Figure reconstructed from the identical question and option set in Tissue Test 22204, question '+str(source)+', page '+str(page)+'. The February original has a broken image placeholder.'
 if fig_note not in q['explanation']:q['explanation']+=fig_note
# Correct subject sections that were absent in native PDF text extraction.
for pid,start in [('tissue-test22204',59),('tissue-feb',59)]:
 for q in D[pid]['questions']:
  if q['number']>=start:q['subject']='physiology'
for q in D['tissue-dds-compilation']['questions']:
 if q['sourceOrdinal']>=233+59:q['subject']='physiology'
for d in D.values():
 d['notes']=list(dict.fromkeys(d['notes']))
 note='Independent review corrected demonstrably wrong source keys and left multiple-answer or malformed original items ungraded. Original source marks remain in sourceAnswer provenance.'
 if note not in d['notes']:d['notes'].append(note)
 d['coverage'].update(unresolvedAnswers=sum(q['correctOptionId'] is None for q in d['questions']),editorialAnswers=sum(q['answerBasis']=='editorial' for q in d['questions']))
 for q in d['questions']:
  assert len(q['options'])==4 and all(o['text'].strip() for o in q['options']) and q['prompt'].strip()
  assert q['correctOptionId'] is None or q['correctOptionId'] in [o['id'] for o in q['options']]
  for m in q.get('media',[]):assert (ROOT/'public'/m['src'].lstrip('/')).is_file()
 (OUT/f"{d['paperId']}.json").write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print('Validated',sum(len(d['questions']) for d in D.values()),'occurrences across',len(D),'source files.')
