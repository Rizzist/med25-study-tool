"""One-time audited IZAM source import. Re-running preserves the same paper IDs.

Requires the local, read-only extraction inventory at tmp/izam-biochem/inventory.json.
The resulting past-papers.json and source-audit.json are portable build inputs.
Original Downloads are never changed; screenshot derivatives exclude student rosters.
"""
import hashlib, json, re, shutil
from pathlib import Path
import pymupdf as fitz

ROOT=Path(__file__).resolve().parents[2]
WORK=ROOT/'tmp/izam-biochem'
DATA=ROOT/'data/biochemistry'
read=lambda p:json.loads(p.read_text())
write=lambda p,v:p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
inventory=read(WORK/'inventory.json')
byhash={r['sha256'][:12]:r for r in inventory}
data=read(DATA/'past-papers.json')
curriculum=read(ROOT/'data/review-curriculum/courses/term2-biochemistry.json')
sections={s['id'].split('biochem-')[-1]:s for s in curriculum['sections'] if s['id'].startswith('biochemistry/')}
newids=['biochemistry-2021-june-23-izam','biochemistry-2024-july-13-izam','biochemistry-2024-dec-05-izam','biochemistry-undated-50-izam']
data['papers']=[p for p in data['papers'] if p['id'] not in newids]
for p in data['papers']:
 p['sources']=[s for s in p['sources'] if s.get('importBatch')!= 'Biochemistry-Izaam-2026-09-24']
coverage=read(DATA/'review-coverage.json')
coverage['questionDestinations']=[r for r in coverage['questionDestinations'] if r['paperId'] not in newids]
resolutions=read(DATA/'ai-resolutions.json')
resolutions['questions']={k:v for k,v in resolutions['questions'].items() if not any(k.startswith(p+'-q') for p in newids)}
batch='Biochemistry-Izaam-2026-09-24'
audit={}
def disposition(h,kind,note,paper=None):
 r=byhash[h]
 audit[h]={'sha256':r['sha256'],'files':[p.split(batch+'/')[-1] if batch+'/' in p else 'Archives/'+p.split('/unzipped/')[-1] for p in r['files']], 'disposition':kind,'note':note,'canonicalPaperId':paper}
def source(r):
 return {'originalFilename':Path(r['files'][0]).name,'sha256':r['sha256'],'pages':len(r['pages']),'importBatch':batch}
def photos(numbers,prefix):
 return [next(r for r in inventory if any(Path(f).name.startswith(f'photo_{prefix}{n}') for f in r['files'])) for n in numbers]
def make_paper(pid,title,date,rows,refs,eligible=True,note=''):
 folder=ROOT/'public/study/biochemistry/past-papers'/pid
 folder.mkdir(parents=True,exist_ok=True)
 pdf=folder/'original.pdf'
 if pdf.exists():
  pass  # Keep verified derivatives byte-identical across reruns/cache updates.
 elif len(refs)==1 and refs[0]['files'][0].lower().endswith('.pdf'):
  if 'dec-05' in pid:
   doc=fitz.open(refs[0]['files'][0]);doc[0].add_redact_annot(fitz.Rect(342,420,430,438),fill=(1,1,1));doc[0].apply_redactions();doc.save(pdf,garbage=4,deflate=True)
  else:shutil.copyfile(refs[0]['files'][0],pdf)
 else:
  doc=fitz.open()
  for r in refs:
   image=fitz.open(r['files'][0]);page=doc.new_page(width=image[0].rect.width,height=image[0].rect.height);page.insert_image(page.rect,filename=r['files'][0])
  doc.save(pdf,garbage=4,deflate=True)
 paper={'id':pid,'sourceId':pid.removeprefix('biochemistry-'),'title':title,'note':note,'defaultEligible':eligible,'date':date,'importedAt':'2026-09-25',
   'kind':'supplied-source-paper' if eligible else 'supplied-undated-report','sources':[source(r) for r in refs],
   'original':{'title':title+' · source pages'+(' (cover name redacted)' if 'dec-05' in pid else ''),'url':'/'+str(pdf.relative_to(ROOT/'public')),'sha256':digest(pdf)},'missingSourceNumbers':[],'questions':rows}
 for r in refs:disposition(r['sha256'][:12],'new-source',note,pid)
 data['papers'].append(paper)
 for q in rows:
  sec=sections[q.pop('section')]
  coverage['questionDestinations'].append({'questionId':f'{pid}-q{q["number"]:03}','paperId':pid,'sourceNumber':q['number'],'prompt':q['prompt'],'sectionId':sec['id'],'sectionTitle':sec['title'],'pdfPage':sec['pdfPage'],'beforeAudit':'New IZAM source; existing PDF not rewritten.','afterAudit':'Topic mapped to existing review section; detailed source caveats remain with question.','sourceCaveat':q['note'],'graded':True,'references':[{'title':'Biochemistry II review','locator':f'PDF p. {sec["pdfPage"]}: {sec["title"]}'}]})
 return paper
def tsv(file):
 rows=[]
 for line in (DATA/file).read_text().splitlines():
  if not line or line.startswith('#'):continue
  n,page,key,section,prompt,*opts=line.split('|');assert len(opts)==4
  section='renal-tests' if section=='renal-npn' else section
  rows.append({'number':int(n),'page':int(page),'key':key,'providedKey':None,'acceptedOptionIds':[],'section':section,'prompt':prompt,'options':opts,'note':''})
 return rows

# The June 2021 file has clean embedded text; preserve all forty numbered stems/options.
june=[]
keys='B B D B B D D B A D A A B C C A A A C B A C C D C B B B C A B C B D B D A D D B'.split()
routes='glycolysis special-products gluconeogenesis aa-disorders nucleotides glycogen ppp special-products glucose-entry urea pdh-tca ppp special-products aa-carbon aa-disorders glycolysis urea nucleotides protein-nitrogen renal-tests lipid-digestion fatty-acid-synthesis beta-oxidation beta-oxidation liver-tests cholesterol cholesterol oxphos cholesterol cholesterol ketones beta-oxidation fatty-acid-synthesis ketones clinical-enzymes lipid-digestion oxphos heme nucleotides protein-nitrogen'.split()
for p in byhash['2bb3c716c194']['pages']:
 parts=re.split(r'(?m)^\s*(\d{1,2})\s*-',p['text'])
 for i in range(1,len(parts),2):
  n=int(parts[i]);bits=re.split(r'(?m)^\s*[A-D]\.\s*',parts[i+1]);assert len(bits)==5,(n,bits)
  clean=lambda x:re.sub(r'\s+',' ',x).strip()
  june.append({'number':n,'page':p['page'],'prompt':clean(bits[0]),'options':[clean(x) for x in bits[1:]],'key':keys[n-1],'providedKey':None,'acceptedOptionIds':[],'section':routes[n-1],'note':''})
assert [r['number'] for r in june]==list(range(1,41))
p1=make_paper(newids[0],'Biochemistry · Pharm.D · 23 June 2021 (IZAM)','2021-06-23',june,[byhash['2bb3c716c194']],note='Printed heading says Final Biochemistry (Pharm.D), 2021/6/23, 40 minutes. Related student screenshots and metabolismMM are alternate fragments of this paper, not extra sittings. Answers editorially checked; not an authenticated official key.')
julyrefs=photos(['9664','9665','9666','9667','9668','9669','9670','9672','9673'],'523100075227570')
p2=make_paper(newids[1],'Biochemistry II · 13 July 2024 (IZAM)','2024-07-13',tsv('izam-2024-july.tsv'),julyrefs,note='Cover explicitly gives 13 July 2024 and 52 questions; semester line says February 2023. Nine source photos assembled in question order. The unrelated student roster/answer sheet was excluded. Handwritten highlights are not authenticated keys.')
p3=make_paper(newids[2],'Biochemistry · Pharmacy · 5 December 2024 (IZAM)','2024-12-05',tsv('izam-2024-december.tsv'),[byhash['c6faf24811ec']],note='Cover explicitly gives 5 December 2024 and 36 questions; semester line says September 2023. The handwritten cover name is redacted in the downloadable copy. Original source remains unchanged in Downloads.')
report_order=['9295','9284','9289','9298','9296','9297','9276','9282','9291','9286','9287','9281','9279','9283','9294','9288','9277','9293','9292','9285','9280']
p4=make_paper(newids[3],'Biochemistry · undated 50-item report (IZAM)',None,tsv('izam-undated-report.tsv'),photos(report_order,'547002542328393'),eligible=False,note='Fifty-question photographed question-bank report with placeholder course/test headers, not a verified separate exam sitting. Included once as an optional supplement; excluded from Select all and Core recurrence counts. Split-page options were joined in source order.')

def q(p,n):return next(r for r in p['questions'] if r['number']==n)
def note(p,n,text,accepted=None):
 q(p,n)['note']=text
 if accepted:q(p,n)['acceptedOptionIds']=accepted
def repair(p,n,text,prompt=None,patch=None,key=None,refs=None):
 r=q(p,n);k=key or r['key'];r['key']=None;r['note']='Source wording requires an explicit editorial study repair; original choices retained.'
 resolution={'kind':'repaired','key':k,'confidence':'high','explanation':text,'evidence':refs or ['Biochemistry II review: '+sections[next(x['sectionId'].split('biochem-')[-1] for x in coverage['questionDestinations'] if x['questionId']==f'{p["id"]}-q{n:03}')]['title'],'Ferrier, Lippincott Illustrated Reviews: Biochemistry, 6th edition; corresponding pathway chapter.']}
 if prompt:resolution['prompt']=prompt
 if patch:resolution['optionPatches']=patch
 resolutions['questions'][f'{p["id"]}-q{n:03}']=resolution

note(p1,2,'B is the source-style shorthand. Creatinine forms by spontaneous nonenzymatic cyclization of creatine/phosphocreatine; dehydration and phosphate loss should not be mistaken for an enzyme-catalyzed energy pathway.')
repair(p1,5,'The precise term for elevated blood urate is hyperuricemia. The printed uricemia merely denotes urate in blood; option B is explicitly corrected.',patch={'B':'Hyperuricemia'})
note(p1,9,'Both hexokinase and glucokinase can phosphorylate glucose in liver. Glucokinase is the high-Km, high-capacity hepatic isoenzyme; it is not the only possible isoenzyme.')
note(p1,11,'GDP is the conventional GTP-forming TCA teaching answer. Mammals also have an ADP-dependent succinyl-CoA synthetase isoenzyme; either nucleotide is accepted for this unqualified stem.', ['A','B'])
note(p1,21,'Three statements are true: ezetimibe reduces intestinal cholesterol absorption; orlistat inhibits both gastric and pancreatic lipases. Accept A, B or D. Humans cannot completely degrade the steroid ring to CO2 and water.', ['A','B','D'])
note(p1,23,'C is correct: activation and propionyl-CoA carboxylation cost energy, and the final three-carbon fragment enters at succinyl-CoA rather than yielding another acetyl-CoA. Odd-chain C15 yields less net ATP than C14 under the stated complete-oxidation convention.')
note(p1,25,'Both A and C are defensible: ALT has a longer circulating half-life and is more liver-specific than AST. A blanket rule for all chronic liver disease is not valid; the AST/ALT ratio depends on etiology and stage.', ['A','C'])
repair(p1,26,'Insulin promotes HMG-CoA reductase activity in the fed state. The original blanket EXCEPT wording about cortisol/glucocorticoids is replaced with a direct regulatory question.',prompt='Which listed hormone promotes activation of HMG-CoA reductase in the fed state?')
repair(p1,27,'B is the compensatory hepatic pathway: loss of bile acids increases conversion of cholesterol to bile acids. Broad source alternatives about excretion/catabolism overlap, so the study stem asks for the specific pathway.',prompt='Which listed hepatic metabolic change compensates for interruption of enterohepatic bile-acid recycling by bile-acid sequestrants?')
note(p1,32,'Carnitine carries long-chain acyl groups across the inner mitochondrial membrane. This mechanistic exam answer does not establish a benefit from supplements in people without deficiency.')
note(p1,34,'Liver produces but does not oxidize ketone bodies. Brain adapts to their use; muscle can use them, although muscle increasingly relies on fatty acids during prolonged starvation.')
note(p1,35,'B is the historical enzyme panel among these options. Modern suspected MI evaluation uses cardiac troponin and clinical/ECG assessment; LDH and AST are not contemporary first-line diagnostic tests.')
note(p1,36,'D is the best classroom answer for uncomplicated diabetes. Diabetes can coexist with pancreatic insufficiency or other causes of malabsorption; the answer is not an absolute exclusion.')
repair(p1,37,'Aerobic glycolysis itself makes 2 ATP and 2 cytosolic NADH: 5 ATP equivalents with the glycerol-3-phosphate shuttle or 7 with malate-aspartate, using modern P/O values. None of the four source options correctly gives this; an explicit E is added. Complete glucose oxidation is a different question.',patch={'E':'5 or 7 ATP equivalents, depending on the cytosolic NADH shuttle'},key='E')
note(p1,40,'Alanine carries muscle nitrogen coupled to the glucose-alanine cycle, but glutamine is another major nontoxic nitrogen carrier. Both A and B are accepted for this unqualified wording.', ['A','B'])

note(p2,1,'G6PD supplies NADPH needed by glutathione reductase; it does not itself reduce GSSG. Glutathione reductase is not among the choices.')
note(p2,2,'The intended B refers to free fructose, not fructose-6-phosphate, which IS a nonoxidative PPP product. CO2, NADPH and pentose phosphates are PPP products.')
note(p2,9,'Two pyruvate molecules supply the six carbons for one glucose molecule.')
note(p2,11,'30-32 includes oxidation of the NADH/FADH2 through oxidative phosphorylation; glycolysis and the TCA cycle alone do not directly synthesize this many ATP.')
note(p2,14,'Of the choices, pyruvate is the carbon precursor via mitochondrial PDH. Acetyl units then leave mitochondria as citrate; pyruvate is not directly converted to acetyl-CoA by cytosolic PDH.')
note(p2,19,'The question explicitly uses legacy P/O values: stearate 146 net ATP minus one FADH2 (2 ATP) bypassed at the double bond gives 144. Modern accounting would give about 118.5, not 144.')
note(p2,23,'LDLR is the classic and most common cause, but pathogenic APOB variants also cause autosomal-dominant familial hypercholesterolemia. Both A and D are accepted for the broad source stem.', ['A','D'])
note(p2,28,'The distinctive final three-carbon fragment is propionyl-CoA; acetyl-CoA is also released during preceding cycles.')
note(p2,32,'Adipose has low physiologically relevant glycerol kinase activity, not an absolute absence under every condition; most liberated glycerol goes to the liver.')
repair(p2,33,'Ribonucleotide reductase supplies deoxyribonucleotide precursors and therefore contributes indirectly to dTMP production. The source D wording is too broad to call false. D is explicitly changed to a false direct-enzyme claim; thymidylate synthase, not RNR, directly methylates dUMP.',patch={'D':'Directly converts dUMP into dTMP by methylation'})
note(p2,37,'D is the clear mismatch: uricemia concerns urate, whereas urea relates to azotemia/renal nitrogen handling. Creatine in muscle disease is historical shorthand, not a substitute for creatine kinase in modern diagnosis.')
note(p2,40,'This source item concerns ruminant nutrition: rumen microbes can use urea nitrogen. It is not advice to consume urea and is not evidence of a human dietary nitrogen requirement.')
note(p3,5,'Basolateral release into portal blood is carrier-mediated facilitated transport. Passive transport is sometimes used as its broad umbrella; accept C or D, not apical sodium-dependent uptake.', ['C','D'])
repair(p3,20,'FMN has the lowest reduction potential among the listed respiratory carriers. The ambiguous phrase tendency to oxidize is clarified to oxidizing power.',prompt='Which listed respiratory-chain carrier has the lowest reduction potential (weakest tendency to accept electrons)?')
repair(p3,23,'CETP transfers neutral lipids between lipoproteins and can interact with triglyceride-rich particles. It is not an obligatory component of the canonical ApoC-II/LPL hydrolysis step; the original broad assertion that it has no role is avoided.',prompt='Which listed factor is NOT required for the canonical ApoC-II-activated LPL hydrolysis of chylomicron triglycerides, with HDL serving as an apoprotein donor?')
note(p3,30,'C (146) uses the legacy convention of 3 ATP/NADH and 2 ATP/FADH2: 9 acetyl-CoA x 12 + 8 cycles x 5 - 2 activation equivalents. Modern net yield for stearate is 120 ATP; the options imply the old convention.')
note(p3,36,'This refers to FAD in succinate dehydrogenase (complex II) and cytochromes a/a3 in complex IV. FAD also occurs in other flavoproteins, so the usual respiratory-chain context matters.')
note(p4,2,q(p2,2)['note'])
note(p4,9,'Per glucose from two pyruvates: 4 ATP plus 2 GTP and 2 NADH. Four counts ATP molecules specifically, not all six high-energy phosphate equivalents.')
repair(p4,13,'The original non-thiazide antihypertensive category is too broad (loop diuretics and some other drugs can increase urate). D is repaired to losartan, which can lower serum urate.',patch={'D':'Losartan, an angiotensin II receptor blocker with a uricosuric effect'},refs=['https://www.ncbi.nlm.nih.gov/books/NBK459284/'])
repair(p4,14,'ADA deficiency causes one form of SCID, not every SCID. The source is narrowed to that form; lymphopenia, not lymphocytosis, is expected.',prompt='All of the following statements about untreated ADA-deficiency SCID are correct, EXCEPT:')
repair(p4,15,'Ferrochelatase deficiency causes erythropoietic protoporphyria. Photosensitivity depends on the acute hepatic porphyria subtype and is absent in acute intermittent porphyria, making the original blanket EXCEPT stem unsafe.',prompt='Which statement identifies the enzyme defect of erythropoietic protoporphyria, rather than an acute hepatic porphyria?',refs=['https://www.ncbi.nlm.nih.gov/books/NBK22229/'])
note(p4,16,'Sulfamethoxazole inhibits bacterial dihydropteroate synthase and folate production, indirectly limiting nucleotide synthesis. It is not a direct pyrimidine-pathway-specific inhibitor.')
repair(p4,17,'Gilbert syndrome usually causes mild benign unconjugated hyperbilirubinemia with reduced UGT1A1 activity. An ancestry claim is not a reliable general diagnostic statement; C is explicitly replaced with the mechanism.',patch={'C':'Reduced UGT1A1 activity causes mild, usually benign unconjugated hyperbilirubinemia'},refs=['https://www.ncbi.nlm.nih.gov/books/NBK470200/'])
repair(p4,18,'Physiologic neonatal jaundice is predominantly unconjugated. Phototherapy uses visible blue light, not ultraviolet; the source UV distractor is corrected so D remains the sole false statement.',prompt='All of the following statements about physiologic neonatal jaundice are correct, EXCEPT:',patch={'C':'Visible blue-light phototherapy is used when treatment thresholds are reached.'},refs=['https://www.ncbi.nlm.nih.gov/books/NBK532930/'])
note(p4,24,q(p3,5)['note'],['C','D'])
note(p4,26,'Alanine is the glucose-alanine-cycle carrier; glutamine also transports skeletal-muscle nitrogen. Both A and D are accepted for the unqualified source wording.', ['A','D'])
note(p4,28,'CK is often markedly elevated in Duchenne muscular dystrophy, but diagnosis requires the appropriate clinical/genetic assessment; CK alone is not specific.')
note(p4,39,'LDL receptors recognize both apoB-100 and apoE. Accept A or C; apoB-48 lacks the LDL-receptor-binding domain.', ['A','C'])
note(p4,43,'Both A and B describe real inhibitory influences. Citrate and long-chain acyl-CoA are direct allosteric regulators; glucagon inhibits ACC through signaling/phosphorylation. Accept A or B because direct allostery is not specified.', ['A','B'])
note(p4,46,'The printed 127 ATP uses legacy 3/2 P/O values: palmitate 129 minus one FADH2 (2 ATP). Modern net accounting for palmitoleate is 104.5 ATP.')
note(p4,49,'HSL is the best listed hormone-regulated lipase; adipose triglyceride lipase (ATGL), absent from the options, initiates most TAG hydrolysis, with HSL especially important for diacylglycerol.')
note(p4,50,'Amino acids are gluconeogenic substrates among these options. Lactate and glycerol also contribute, and their relative importance changes with fasting duration; the stem does not establish a universal dominant substrate.')

# Group exact-byte and reviewed alternate scans under existing stable paper IDs.
known={s['sha256']:p['id'] for p in data['papers'] for s in p['sources']}
alternate={'cc89318eaeeb':'2017-kish','7501ac6939f2':'2017-kish','d04735735eb8':'theory-42','770bb61f535a':'theory-42','5ddc919467b0':'2023-jan-29','b8b93b6a34a7':'2023-jan-29','8e44e863b0ae':'2023-jan-29','f7ef17982010':'2022-jan-26','680cbff9e0c2':'2021-june-23-izam'}
for r in inventory:
 h=r['sha256'][:12];filename=Path(r['files'][0]).name
 if h in audit:continue
 pid=known.get(r['sha256'])
 if h in alternate:pid='biochemistry-'+alternate[h]
 if filename.startswith('photo_603713'):pid='biochemistry-2023-july-23'
 if filename.startswith('photo_595417'):pid=newids[0]
 if pid:
  p=next(p for p in data['papers'] if p['id']==pid)
  if not any(s['sha256']==r['sha256'] for s in p['sources']):p['sources'].append(source(r))
  disposition(h,'duplicate-source','Exact file or content-reviewed alternate scan/fragment of the canonical paper; no additional exam or recurrence vote.',pid)
 elif filename.startswith('photo_521529'):
  disposition(h,'out-of-scope','Foundations/structural biochemistry paper fragment (organic functional groups, enzyme kinetics, carbohydrates and vitamins), not a separate Metabolism II sitting.')
 elif filename.startswith(('photo_5231000752275709674','photo_620844')):
  disposition(h,'private-answer-sheet','Student roster/answer sheet; not an authoritative question key. Not published.')
 elif h=='8ba16346bd4f':
  disposition(h,'incomplete-source','2024 answer report supplies stems and keyed answers but omits all distractors; original MCQs cannot be reconstructed without inventing choices. Retained locally, not presented as a scored original paper.')
 elif h=='2cb23ace07a1':
  disposition(h,'reference-not-pyq','Undated edited 52-item compilation combining variants from the September 2025 material, the optional reconstruction, and July 2024. No exam cover or evidence of a separate sitting; NOT a duplicate of January 2023 and NOT counted as an independent exam.')
 elif filename.lower().endswith('.zip'):
  disposition(h,'archive','Archive unpacked and all members audited separately; not an exam itself.')
 elif 'practical' in filename.lower():
  disposition(h,'out-of-scope','Practical, not metabolism theory; same existing practical source.')
 else:
  disposition(h,'reference-not-pyq','Lecture/sample/Quizlet/textbook question collection or other-course material, without evidence of a separate past exam; not imported as another sitting or used to inflate recurrence.')

# Refresh exact mappings after answer caveats/repairs; the PDF itself is unchanged.
for p in data['papers']:
 if p['id'] not in newids:continue
 for r in p['questions']:
  m=next(x for x in coverage['questionDestinations'] if x['questionId']==f'{p["id"]}-q{r["number"]:03}')
  m['sourceCaveat']=resolutions['questions'].get(m['questionId'],{}).get('explanation',r['note'])
data['importedAt']='2026-09-23'  # Existing keys retain their actual prior audit date.
data['importBatches']=[b for b in data.get('importBatches',[]) if b.get('id')!=batch]+[{'id':batch,'audit':'data/biochemistry/izam-source-audit.json','newPaperIds':newids,'originalFilesPreserved':True}]
coverage.update(version='2026-09-25',sourceItems=sum(len(p['questions']) for p in data['papers']),scoredItems=sum(len(p['questions']) for p in data['papers']),aiResolvedItems=len(resolutions['questions']))
resolutions['version']='2026-09-25-izam-audit'
resolutions['policy']='Explicit editorial study repairs and accepted alternatives. Original text, choices and supplied marks are preserved; no official-key claim.'
write(DATA/'past-papers.json',data);write(DATA/'review-coverage.json',coverage);write(DATA/'ai-resolutions.json',resolutions)
write(DATA/'izam-source-audit.json',{'version':'2026-09-25','source':batch,'policy':'Deduplicate exams by exact bytes and reviewed question content, never by filename alone. Independent papers may share individual questions. Originals are preserved. Optional report does not establish independent recurrence.','records':list(audit.values())})
print('Imported',sum(len(p['questions']) for p in [p1,p2,p3,p4]),'items; total',coverage['sourceItems'],'audit records',len(audit))
