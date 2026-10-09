"""Rebuild the 14 biochemistry/theory Telegram imports from audited source transcripts.
Run with Python 3 from repository root. Source crops are preserved static assets.
The adjacent sources JSON stores machine transcripts; explicit repairs below were visually checked.
"""
import json,re,pathlib,difflib,unicodedata
ROOT=pathlib.Path.cwd(); CACHE=json.load(open(pathlib.Path(__file__).with_name('extract-term1-biochem-theory-sources.json'))); OUT=ROOT/'data/term1-telegram/questions'; OUT.mkdir(exist_ok=True)
IDS=['cell-jan2024','bio-jan2023','bio-sep2019','bio-nourozi','bio-marked-2023','bio-undated-t3','bio-dds-t2','bio-pharmd-jan2024','bio-dds-jul2023','cell-online-theory','cell-online-scan2022','cell-feb2021-answers','cell-final-docx','bio-kish-theory']
CAT={p['id']:p for p in json.load(open(ROOT/'data/term1-telegram/catalog.json'))['papers']}
PLAN={p['id']:p for p in json.load(open(ROOT/'data/term1-telegram/import-plan.json'))['papers']}
bank=[]
for f in (ROOT/'data/final-exams').glob('*.jsonl'):
 try: bank += [json.loads(l) for l in f.read_text().splitlines() if l.strip()]
 except Exception: pass
norm=lambda t:re.sub(r'[^a-z0-9]','',t.lower())
def ocr(id):return CACHE[id]
def question(n,p,prompt,opts,key=None,why=None,subject='biochemistry'):
 q=dict(number=str(n),page=p,prompt=prompt,options=[dict(id=chr(65+i),text=t) for i,t in enumerate(opts)],correctOptionId=key,explanation=why or ('Editorial study answer: '+opts[ord(key)-65]+'.' if key else 'No reliable answer has been established for this source occurrence; retained as an ungraded question.'),answerBasis='editorial' if key else 'unresolved',subject=subject)
 if key:q['answerEvidence']=['Editorial study key; not a certified university answer key.']
 return q
def reuse(q):
 if len(q['options'])<2 or q['correctOptionId'] is None:return q
 for b in bank:
  if norm(b.get('prompt',''))!=norm(q['prompt']):continue
  a=next((o['text'] for o in b['options'] if o['id']==b.get('correctOptionId')),None)
  if not a:continue
  # Require all option texts; avoids transferring keys across altered distractors.
  if sorted(norm(o['text']) for o in q['options'])!=sorted(norm(o['text']) for o in b['options']):continue
  found=next(o for o in q['options'] if norm(o['text'])==norm(a))
  if found['id']!=q['correctOptionId']:continue
  if q['options']==b['options'] and 'existingQuestionId' not in q:q['existingQuestionId']=b['id']
  q.update(correctOptionId=found['id'],explanation=b['explanation'],answerBasis='source-reviewed' if b.get('answerReview',{}).get('basis')=='source-reviewed' else 'editorial',answerEvidence=[b['id']])
  break
 return q
def save(id,qs,notes='',coverage=None):
 for i,q in enumerate(qs):
  q['sourceOrdinal']=i+1;reuse(q)
  if (id=='cell-jan2024' and q['number']=='76') or (id=='bio-kish-theory' and q.get('section')=='Physiology' and q['number']=='3'):q.update(correctOptionId=None,answerBasis='unresolved',explanation='The label K leak channels is ambiguous: textbook K–Na leak channels permit a small Na flux, which contributes to resting potential. No unique absent contribution follows without specifying channel selectivity.')
  if (id=='cell-online-theory' and q['number']=='32') or (id=='bio-pharmd-jan2024' and q['number']=='32') or (id=='bio-kish-theory' and q.get('section')=='Biochemistry' and q['number']=='39'):q.update(correctOptionId=None,answerBasis='unresolved',explanation='Most biologically active is not defined by an endpoint or vitamin-K subtype. Menaquinones and phylloquinone are active vitamin-K forms; phylloquinone and phytonadione are equivalent names. This ranking does not establish a unique study answer.')
  if id=='bio-sep2019' and q['number']=='14':q['explanation']+=' Editorial correction: buffer pH depends on pKa and the conjugate-base/weak-acid concentration ratio, not weak-acid concentration alone.'
  if id=='bio-sep2019' and q['number']=='45':q['explanation']+=' Editorial caveat: ionizing radiation causes DNA damage, notably strand breaks through direct effects and reactive oxygen species. Cross-linking alone does not describe its principal radiobiological mechanism.'
  if id=='cell-feb2021-answers' and q['number']=='67':q.update(acceptedOptionIds=['A','C'],answerBasis='editorial',explanation='Both the Na–glucose cotransporter and Na–K pump are electrogenic, moving net charge across the membrane. The generic Ca transporter label is insufficiently specified.',answerReferences=['https://pubmed.ncbi.nlm.nih.gov/20980548/'])
  if id=='cell-feb2021-answers' and q['number']=='61':q.update(correctOptionId=None,answerBasis='unresolved',sourceAnswer='A',explanation='The source selects integral-protein sides, which is not a well-defined location for lipid rafts. The item remains ungraded rather than treating this phrase as a precise anatomical definition.')
  if id=='bio-undated-t3' and q['number']=='57':q.update(acceptedOptionIds=['A','B'],answerBasis='editorial',explanation='DNA polymerases can proofread, and RNA polymerases can also proofread through backtracking and transcript cleavage. Both A and B are accepted for this broad question.',answerReferences=['https://pubmed.ncbi.nlm.nih.gov/28607053/'])
  if (id=='bio-pharmd-jan2024' and q['number']=='58') or (id=='bio-dds-jul2023' and q['number']=='48'):q.update(correctOptionId=None,answerBasis='unresolved',explanation='Xeroderma pigmentosum is associated with human nucleotide-excision repair defects. UvrABC is the bacterial repair complex, so none of the offered enzyme names provides a valid human answer.')
 d=dict(paperId=id,questions=qs,notes=notes or CAT[id]['note'],coverage=coverage or {})
 d['coverage'].update(sourceOccurrences=len(qs),graded=sum(q['correctOptionId'] is not None for q in qs),ungraded=sum(q['correctOptionId'] is None for q in qs),sourcePages=CAT[id]['pages'])
 (OUT/(id+'.json')).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
 print(id,len(qs),d['coverage']['graded'])
def feb():
 src=next(x for x in json.load(open(ROOT/'data/biochemistry-retake/full-source-extract.json')) if x['id']=='february-2021');qs=[]
 for r in src['questions']:
  b=next(x for x in bank if x['id']==f"retake-final-february-2021-q{r['number']:03}")
  q=question(r['number'],r['page'],b['prompt'],[o['text'] for o in b['options']],b['correctOptionId'],b['explanation'],b['subject'])
  q['answerBasis']='editorial' if b.get('answerReview',{}).get('basis')=='ai-inferred' else 'source-reviewed';q['sourceAnswer']=r.get('sourceKey');q['answerEvidence']=[b['id']];q['existingQuestionId']=b['id']
  if b.get('acceptedOptionIds'):q['acceptedOptionIds']=b['acceptedOptionIds']
  if b.get('media'):q['media']=[{'src':'/study/'+m['path'],'alt':m['alt']} for m in b['media']]
  qs.append(q)
 save('cell-feb2021-answers',qs,coverage={'completeSource':True,'expectedQuestions':80})
def online():
 qs=[]
 # Source screenshot order is intentionally preserved, including repeated Q3 and Q54.
 keys='B A B D A A C D A C B B A A C B C C D A B B D D D C C A A C B D D A A B B C B A B B C A D ? ? C D C B D D A D C C A A C D C B D D C B B D C D A C'.split()
 assert len(keys)==73
 for page in ocr('cell-online-theory'):
  p=page['page'];text=page['text'];lines=text.splitlines();start=next((i for i,l in enumerate(lines) if re.match(r'^\d{1,2}\.\s*',l)),None)
  if p==30:start=next(i for i,l in enumerate(lines) if l.startswith('Which of the following'));n=59
  elif start is not None:n=int(re.match(r'^(\d+)',lines[start])[1])
  else:raise ValueError(p)
  ls=lines[start:];ls[0]=re.sub(r'^\d+\.[J1]?\s*','',ls[0]);ls=[x for x in ls if x.strip()]
  end=next((i for i,l in enumerate(ls) if re.search(r'Next (Page|Fage)|Recheck Answers|Page\s*:|Exit|End of the Exam',l)),len(ls));ls=ls[:end]
  ls=[re.sub(r'^[•)]+\s*','',x).strip() for x in ls if x not in ['>','Ling','Song','...•']]
  if p==32:ls=['According to the figure, which letter shows a transport mechanism in which ATP is required?','A','B','C','D']
  if p==56:ls=[ls[0],'Fucose','Mannose','Deoxyribose','Deoxyglucose']
  if p==62:ls=[ls[0],'Linoleic acid','Linolenic acid','Arachidonic acid','Stearic acid']
  if p==25:ls[-2]='N-glycosidic bonds can be found in the structure of ATP.'
  if p==28:ls[-4:]=['pH = pKa ± 1','pH = pKa ± 2','pH = Ka ± 2','pH = Ka ± 1']
  if p==15:ls[-4:]=['Puromycin','Streptomycin','Rifamycin','Terramycin']
  if p==18:ls[-4:]=['DNA polymerase α','DNA polymerase γ','Telomerase','DNA polymerase β']
  if p==49:ls[-4:]=['Chromosome','Euchromatin','Heterochromatin','Nucleosome']
  prompt=' '.join(ls[:-4]);opts=ls[-4:]
  if p==21:prompt=prompt.lstrip('1 ').strip()
  q=question(n,p,prompt,opts,None if keys[p-1]=='?' else keys[p-1],subject='physiology' if 58<=n<=71 else 'histology' if n>=72 else 'biochemistry')
  if p in [32,37,38]:q['media']=[dict(src=f'/study/term1-telegram/figures/biochem-theory/online-p{p}.png',alt='Original question figure, excluding student selections')]
  qs.append(q)
 save('cell-online-theory',qs,'73 screenshot occurrences preserved in file order, including repeated Q3 and Q54. Covers 71 unique numbers; missing Q1, Q45–51 and Q61. Student selections are not treated as an official key. Editorial keys are labelled separately; ambiguous Q76 and Q77 remain ungraded.',{'completeSource':True,'completeSitting':False,'uniqueQuestionNumbers':71,'missingQuestionNumbers':['1','45','46','47','48','49','50','51','61']})
SCAN='''Which of the following is correct about the plasma membrane?|Providing a barrier for the cell|All are correct|It is a lipid/protein/carbohydrate complex|Containing transport and signaling systems
Which of the following is correct about amino acids?|None is correct|Contains amino group and carboxyl group functional groups|30 common amino acids are present in protein biosynthesis|Individual amino acids in protein are connected by glycosidic bonds
Biochemical studies:|Have illuminated many aspects of health|Have illuminated many aspects of disease|A and B|None
All the following have 18 carbon atoms except:|Linoleic acid|Stearic acid|Linolenic acid|Arachidonic acid
Which statement about metabolism is correct?|All are correct|Total sum of the chemical reactions happening in a living organism|Anabolism: energy-requiring biosynthetic pathways|Catabolism: degradation of fuel molecules and production of energy for cellular function
In amylopectin, the intervals of glucose units of each branch are:|40–50|24–30|30–40|10–20
Maltose can be formed by hydrolysis of:|Glycogen|All of these|Starch|Dextrin
The principles of biochemistry are as follows:|Certain important reactions, e.g. glycolysis, are found in almost all organisms|All are correct|Living processes contain thousands of chemical reactions. Precise regulation and integration are required to maintain life|All organisms use the same types of molecules: carbohydrates, proteins, lipids and nucleic acids
Glucose is a:|Hexose|Heptose|Pentose|Sucrose
Which of the following is correct about the cell?|Many cannot be seen with the naked eye|Smallest living unit of an organism|Grow, reproduce, use energy, adapt and respond to their environment|All are correct
The polysaccharide found in the exoskeleton of invertebrates is:|Glycogen|Chitin|Chondroitin sulphate|Cellulose
Cerebrosides contain all the following except:|Galactose|Sulphate|Fatty acid|Sphingosine
Which of the following is the smallest carbohydrate?|Ribose|Glucose|None of them|Glyceraldehyde
Sphingomyelin contains:|Plasmalogen|Glycerol|Sphingosine|Serine
Which of the following is an aldotriose?|Glyceraldehyde|Cellulose|Ribose|Glucose
Which of the following is correct about mitochondria?|Surrounded by a double membrane with a series of folds called cristae|Functions in energy production through metabolism|All are correct|Contains its own DNA and is believed to have originated as a captured bacterium
The carbohydrate in cerebrosides is:|Maltose|Fructose|Glucose|Lactose
The number of double bonds in arachidonic acid is:|1|4|2|3
Which carbohydrate cannot be digested and absorbed?|Cellulose|Glycogen|Starch|All of these
Amylopectin has:|β-1,4 and β-1,6 linkages|α-1,2 linkage|α-1,4 and α-1,6 linkages|β-1,2 linkage
Two sugars which differ from one another only in configuration around a single carbon atom are termed:|Optical isomers|Stereoisomers|Anomers|Epimers
Which one of the following is a phospholipid?|All of them|Cephalin|Lecithin|Sphingomyelin
What is the definition of biochemistry?|All are correct|The ways these molecules interact to form cells, tissues and whole organisms|Studying the structure and behavior of complex molecules found in biological material|Application of chemistry to the study of biological processes at the cellular and molecular level
The nitrogenous base in lecithin is:|Serine|Ethanolamine|Inositol|Choline
Functions of proteins include:|All are correct|Antibodies|Enzymes|Transport proteins
Nutritional polysaccharides are:|Starch and cellulose|Starch and chitin|Starch and glucose|Starch and glycogen
Which of the following is a polyunsaturated fatty acid?|Linoleic acid|Oleic acid|Palmitoleic acid|Palmitic acid
What are the objectives of biochemistry?|Know what biochemistry is and its principles|Know the components of a cell and its major types of biomolecules|Understand the role of cell organization and chemical reactions in maintaining a high degree of internal order|All are correct
Glycosphingolipids are a combination of:|Glycerol with galactose|Ceramide with one or more sugar residues|Sphingosine with galactose|Sphingosine with phosphoric acid
Which of the following is not an unsaturated fatty acid?|Palmitic acid|Palmitoleic acid|Linoleic acid|Oleic acid'''
def scan():
 keys='BBCDABB BADBBDCACC BACDAADADADBA'.replace(' ','');assert len(keys)==30
 qs=[]
 for i,line in enumerate(SCAN.splitlines()):
  prompt,*opts=line.split('|');qs.append(question(i+1,i+1,prompt,opts,keys[i]))
 save('cell-online-scan2022',qs,coverage={'completeSource':True,'completeSitting':'unconfirmed','expectedQuestions':30})
if __name__=='__main__':feb();online();scan()
def numbered(id,fixes={}):
 result=[]
 for page in ocr(id):
  p=page['page'];t=fixes.get(p,page['text'])
  matches=list(re.finditer(r'(?m)^\s*(\d{1,2})\s*[.\-]\s*(?=[A-Za-zαβ])',t))
  for i,m in enumerate(matches):
   n=int(m[1]);block=t[m.end():matches[i+1].start() if i+1<len(matches) else len(t)].strip()
   lines=block.splitlines();clean=[]
   for l in lines:
    if re.search(r'Page|Scanned with|University|International campus|Histology:|Physiology:',l):break
    if re.fullmatch(r'\d{1,3}',l.strip()):continue
    clean.append(l)
   block='\n'.join(clean)
   ms=list(re.finditer(r'(?m)^\s*\(?([a-dA-D])\s*[).\-]\s*',block))
   opts=[]
   for j,mm in enumerate(ms):opts.append(block[mm.end():ms[j+1].start() if j+1<len(ms) else len(block)].replace('\n',' ').strip())
   prompt=block[:ms[0].start()].replace('\n',' ') if ms else block.replace('\n',' ')
   result.append(question(n,p,prompt,opts))
 return result
CELLTAIL='''74|17|Assume that the concentration of ion X in extracellular fluid is 300 mEq/L and inside the cell is 20 mEq/L. The resting membrane potential is closer to: log10(15) = 1.17; log10(0.06) = −1.2.|+71 mV|−73 mV|+94 mV|−61 mV
75|17|Comparing the Goldman equation with the Nernst equation, which of the following is correct?|Membrane permeability to ions is only considered in the Nernst equation|The Nernst equation shows the simultaneous effect of several ions on membrane potential|Only the concentration gradient of positively charged ions is included in the Nernst equation|The Goldman equation describes real conditions, while the Nernst equation depicts imaginary conditions
76|17|Which of the following does not play any role in determining the resting membrane potential?|Leakage of K through K leak channels|Leakage of Na through K leak channels|Leakage of Na through Na leak channels|Na-K pump
77|18|The peak of an action potential in a large nerve cell is closer to the Nernst potential of which ion?|K|Na|Cl|HCO3
78|18|What is the main cause of the repolarization phase of an action potential?|Closure of voltage-gated K channels|Opening of voltage-gated K channels|Opening of voltage-gated Ca channels|Closure of voltage-gated Na channels
79|18|A new action potential cannot occur in an excitable fiber as long as its membrane is still depolarized from the preceding action potential. Why?|Inactivation of voltage-gated Na channels|Inactivation of voltage-gated K channels|Activation of voltage-gated Na channels|Activation of voltage-gated K channels
80|18|Saltatory conduction is of value for:|Decrease in conduction velocity|Conserving energy|Having a plateau phase|Existence of Schwann cells
81|18|In the plateau phase, calcium is transported inside the cardiac cell by:|Na+/Ca2+ exchanger|Ca2+-ATPase|Na+/K+-ATPase pump|Voltage-gated Ca channels
82|19|In which compartment is the largest amount of body water found?|ECF|ICF|Plasma|Interstitial fluid
83|19|Which of the following acts as a β-cell glucose sensor?|GLUT1|GLUT2|GLUT3|GLUT4
84|19|Which of the following transporters has the greatest number in the kidneys?|SGLT1|SGLT2|SGLT3|SGLT4
85|19|Simple diffusion of ions is based on:|Chemical gradient|Concentration gradient|Electrical gradient|Electrochemical gradient
86|19|Which of the following is negatively correlated with the rate of simple diffusion?|Lipid solubility|Thickness of membrane|Concentration gradient across membrane|Surface area of membrane
87|19|Which factor is most important in limiting lateral movement of proteins in the membrane of kidney epithelial cells?|Connecting proteins to the cell cortex|Connecting proteins to extracellular matrix|Connecting proteins of one cell to proteins of the adjacent cell|Tight junctions between cells'''
def cell2024():
 pages={p['page']:p['text'] for p in ocr('cell-jan2024')}
 pages[3]='7. '+pages[3].split('7. ',1)[1]
 pages[16]=re.sub(r'cheran University of[\s\S]*?(?=67-)', '',pages[16])
 pages[17]=pages[17].replace('12- Pale','72- Pale').split('Physiology:')[0]
 pages[18]=pages[19]=pages[20]=''
 qs=numbered('cell-jan2024',pages)
 keys='A D C B C C D B D D C A C C A B A B B D B B B D C C D A D A C A B C C B B A A A B D B B C D D A A C A C D B D D D B C B B A B C B A C D A A B D C ? D B B B A B D B B B D B D'.split();assert len(keys)==87
 for q in qs:
  n=int(q['number']);q['subject']='biochemistry' if n<=64 else 'histology'
  if n==4:q.update(prompt='Identify the compound which has carboxylic acid as the functional group.',options=[dict(id=chr(65+i),text=t)for i,t in enumerate(['Top left structure','Top right structure','Bottom left structure','Bottom right structure'])])
  if n==7:q['prompt']='Which of the following will be best to make a buffer of pH 7.20?';q['options']=[dict(id=chr(65+i),text=t)for i,t in enumerate(['CH3COOH and CH3COOK; pKa = 4.752','HClO3 and KClO3; pKa = 1.96','NH3 and NH4Cl; pKa = 9.2','HClO and KClO; pKa = 7.54'])]
  if n==18:q['prompt']='According to these values, what would be the pI for glutamic acid? pKa(R) = 4.2; pKa(COOH) = 2.3; pKa(NH2) = 9.3.'
  if n==34:q['prompt']='α-glucose and β-glucose are:';q['options']=[dict(id=chr(65+i),text=t)for i,t in enumerate(['Stereoisomers','Epimers','Anomers','Keto-aldo pairs'])]
  if n==37:q['options'][-1]['text']='It can be found mostly in milk'
  if n==50:q['prompt']='The binding of prokaryotic RNA polymerase to the promoter of genes is inhibited by which antibiotic?';q['options'][0]['text']='Puromycin'
  if n==51:q['options'][1]['text']='rRNA'
  if n==66:q['options']=[dict(id=chr(65+i),text=t)for i,t in enumerate(['Proteasome','Peroxisome','Lysosome','Endosome'])]
  if n==73:q['options'][-1]['text']='Mitochondria – Porin'
  if n in [35,62]:q['acceptedOptionIds']=['C','D'] if n==35 else ['A','C']
  if n in [4,37]:q['media']=[dict(src=f'/study/term1-telegram/figures/biochem-theory/cell2024-q{n}.png',alt='Original question structure')]
 qs += [question(5,3,'What is the name of the group shown as a question mark in the structure below?',['Carboxylic acid','Halide','Amide','Ketone']),question(6,3,'Aspirin is an acid with a pKa of 3.4. At blood pH 7.4, what is the ratio of A− to HA?',['4','4000','10000','1/10000'])]
 next(q for q in qs if q['number']=='5')['media']=[dict(src='/study/term1-telegram/figures/biochem-theory/cell2024-q5.png',alt='Original question structure')]
 for line in CELLTAIL.splitlines():
  n,p,prompt,*opts=line.split('|');qs.append(question(n,int(p),prompt,opts,subject='physiology'))
 qs.sort(key=lambda q:(q['page'],int(q['number'])))
 for q in qs:
  k=keys[int(q['number'])-1];q['correctOptionId']=None if k=='?' else k;q['answerBasis']='unresolved' if k=='?' else 'editorial';q['explanation']='The ion charge is not specified, so the signed Nernst potential is not uniquely determined.' if k=='?' else 'Editorial study answer: '+next(o['text'] for o in q['options']if o['id']==k)+'.'
  if q.get('acceptedOptionIds'):q['explanation']+=' Both listed answers are valid; this source item has more than one correct choice.'
  assert len(q['options'])==4,(q['number'],q['options'])
 save('cell-jan2024',qs,'87 unique numbered questions, plus the repeated source page containing Q56–60 (92 occurrences). All original occurrences retained. Q35 and Q62 have multiple valid choices; Q74 lacks the ion charge and is ungraded. Editorial keys are distinguished from the posted answer sheet.',{'completeSource':True,'expectedQuestions':87,'uniqueQuestionNumbers':87,'duplicateQuestionNumbers':['56','57','58','59','60']})
if __name__=='__main__':cell2024()
def dds_t2():
 fixes={p['page']:p['text'].replace('а.','a.').replace('à.','a.').replace('21. ...','21. AUG').replace('d..','d.') for p in ocr('bio-dds-t2')}
 qs=numbered('bio-dds-t2',fixes)
 keys='D C D D B B C A A A A C C B B D B D B C A B A C D D A A B B A'.split()
 answers={32:'Apoenzyme',33:'Covalent bond',34:'Nucleosome',35:'ppGpp (guanosine tetraphosphate)',36:'Rifampin (rifampicin)',37:'Telomerase',38:'RNA editing',39:'Increases/stabilizes',40:'Folate and vitamin B12'}
 for q in qs:
  n=int(q['number'])
  if n==1:q['prompt']='Vitamin B3 can be synthesized from … and its deficiency causes …'
  if n==19:q['options'][0]['text']='rRNA'
  if n==21:q['prompt']='… not only is the start codon, but also can …'
  if n==28:q['prompt']='When only lactose is available, it attaches to … and … its operon.';q['options'][-1]['text']='An activator – activate'
  if n==29:q['prompt']='In the absence of …, adenylyl cyclase is active and sufficient cAMP is made and binds to …, causing RNA polymerase to initiate transcription more efficiently.';q['options'][-1]['text']='Glucose, repressor'
  if n==38:q['prompt']='Production of apoB48 and apoB100 in intestine and liver, respectively, is because of …'
  if n==39:q['prompt']='Poly-A adenylation … the half-life of mRNA in eukaryotes.'
  if n<=31:
   assert len(q['options'])==4,(n,q['options']);q['correctOptionId']=keys[n-1];q['answerBasis']='editorial';q['explanation']='Editorial study answer: '+q['options'][ord(keys[n-1])-65]['text']+'.'
  else:q['options']=[];q['correctOptionId']=None;q['sourceAnswer']=answers[n];q['answerBasis']='editorial';q['explanation']='Editorial model response: '+answers[n]+'. This short-answer source item is reviewed without automatic scoring.'
 assert len(qs)==40
 save('bio-dds-t2',qs,coverage={'completeSource':True,'multipleChoice':31,'writtenResponse':9})
def pharm():
 fixes={p['page']:p['text'] for p in ocr('bio-pharmd-jan2024')}
 fixes[3]='6. '+fixes[3];fixes[5]=fixes[5].replace('0. In Lineweaver','20. In Lineweaver');fixes[7]=fixes[7].replace('16. Prostaglandins','46. Prostaglandins');fixes[12]=''
 for p,t in fixes.items():
  t=t.replace('→b)','b)').replace('→ Increase of CO','b) Increase of CO').replace('-a)','a)').replace('- a)','a)').replace('-b)','b)').replace('-c)','c)').replace('-€)','c)').replace('la)','a)')
  for prefix in ['Km is constant','Nystagmus','Cobalamin','Phylloquinone','Linoleic acid','Anomers','It is composed','Amylopectin has','Synthesis of DNA','Trp','DNA polymerase I!!']:t=t.replace(') '+prefix,'c) '+prefix).replace('() '+prefix,'c) '+prefix)
  t=t.replace(') Vitamin B and','a) Vitamin B and').replace('* Ribose','c) Ribose').replace(') Inhibits peptidyl','d) Inhibits peptidyl').replace('→ DNA ligase','c) DNA ligase').replace('\nSilent mutation','\na) Silent mutation').replace('с. 100','c. 100')
  fixes[p]=t
 qs=numbered('bio-pharmd-jan2024',fixes)
 keys='D B D C D D B D B B D A B B D C C C B B D C C C C A C ? D C C B B C C B B A A C C D C B C B A C C B D D D C A D C A C A C B ? A'.split();assert len(keys)==64
 for q in qs:
  n=int(q['number'])
  if n==4:q.update(prompt='Identify the compound which has alcohol as the functional group.',options=[dict(id=chr(65+i),text=['Top left structure','Top right structure','Bottom left structure','Bottom right structure'][i]) for i in range(4)])
  if n==5:q['options'][-1]['text']='Carboxylic acid'
  if n==10:q['prompt']='According to these values, what would be the pI for glutamic acid? pKa(COOH) = 2.3; pKa(NH2) = 9.3; pKa(R) = 4.2.'
  if n==12:q['prompt']='β-pleated sheets are examples of:';q['options']=[dict(id=chr(65+i),text=t)for i,t in enumerate(['Secondary structure','Tertiary structure','Primary structure','Quaternary structure'])]
  if n==20:q['options'][1]['text']='1/Vmax'
  if n==34:q['prompt']='α-D-glucose and β-D-glucose are:';q['options']=[dict(id=chr(65+i),text=t)for i,t in enumerate(['Stereoisomers','Epimers','Anomers','Keto-aldo pairs'])]
  if n==35:q['acceptedOptionIds']=['C','D']
  if n==37:q['options'][-1]['text']='It can be found mostly in milk'
  if n==51:q['options'][2]['text']='DNA polymerase III'
  if n==52:q['options'][-1]['text']='DNA gyrase'
  if n==59:q['prompt']=q['prompt'].replace('VAC','UAC')
  if n==57:q['acceptedOptionIds']=['C','D']
  if n==58:keys[n-1]='?'
  if n in [4,5,37]:q['media']=[dict(src=f'/study/term1-telegram/figures/biochem-theory/pharm-q{n}.png',alt='Original question structure, without answer marks')]
  assert len(q['options'])==4,(n,q['options'])
  k=keys[n-1];q['correctOptionId']=None if k=='?' else k;q['answerBasis']='unresolved' if k=='?' else 'editorial';q['explanation']='The source wording is insufficiently reliable for a single study key; retained ungraded.' if k=='?' else 'Editorial study answer: '+q['options'][ord(k)-65]['text']+'.'
  if q.get('acceptedOptionIds'):q['explanation']+=' Both listed answers are valid.'
 assert len(qs)==64
 save('bio-pharmd-jan2024',qs,'All 64 questions retained in source page order (Q46–52 precede Q39–45 and Q34–38). Q35 and Q57 have multiple valid choices; Q28 and Q63 are ungraded because their claims/wording are unreliable. Student annotations are not used as an official key.',{'completeSource':True,'expectedQuestions':64})
if __name__=='__main__':dds_t2();pharm()
T3='''1|1|In equilibrium mutarotation, what are the respective proportions of α and β anomers?|α 1/2, β 1/2|α 2/3, β 1/3|α 1/3, β 2/3|α 1/4, β 3/4|C
2|1|Which structure describes heparin?|Glucuronic acid – N-acetylglucosamine|Iduronic acid – N-acetylglucosamine|Glucuronic acid – N-acetylgalactosamine|Iduronic acid – N-acetylgalactosamine|B
3|1|Which of the following sugars is an aldose?|Ribulose|Dihydroxyacetone|Fructose|Galactose|D
4|1|Which of the following sugars has six carbon atoms?|Arabinose|Sorbose|Xylose|Xylulose|B
5|1|Which of the following is N-acetylneuraminic acid?|Mucic acid|Saccharic acid|Mannaric acid|Sialic acid|D
6|1|Which of the following reduced sugars is sorbitol?|Ribitol|Mannitol|Glucitol|Xylitol|C
19|2|What is the oxygen saturation of blood leaving the tissues (venous blood)?|0%|40%|60%|100%|?
20|2|Hemoglobin carrying CO2 in blood is called:|Oxyhemoglobin|Protonated hemoglobin|Carbaminohemoglobin|Deoxyhemoglobin|C
21|2|For hemoglobin, O2 is a:|Homotropic inhibitor|Heterotropic inhibitor|Homotropic activator|Heterotropic activator|C
22|2|Which of the following is cephalin?|Phosphatidylinositol|Phosphatidylcholine|Phosphatidylserine|Phosphatidylethanolamine|D
23|2|Which of the following is synthesized from arachidonic acid?|Cholesterol|Triglyceride|Lecithin|Leukotriene|D
24|2|Which lipoprotein transfers endogenous lipid in blood?|Chylomicron|VLDL|LDL|HDL|B
30|3|In the study of enzymes, a sigmoid plot of substrate concentration versus reaction velocity may indicate:|Michaelis–Menten kinetics|Myoglobin binding to oxygen|Competitive inhibition|Cooperative inhibition|?
31|3|Which proteolytic enzyme is activated by acid hydrolysis of the proenzyme form?|Pepsin|Chymotrypsin|Trypsin|Elastase|A
32|3|All the following correctly describe the active site of an enzyme except:|It is small relative to the entire enzyme|Specificity is defined by the arrangement of certain atoms|It is two-dimensional in structure|It is usually a crevice or cleft|C
33|3|Which correctly describes allosteric enzymes?|Regulatory molecules bind the active site|Binding substrate to one site can affect other sites|Regulatory molecules alter equilibrium but not activity|Hyperbolic plots are obtained when reaction velocity is plotted against substrate|B
34|3|Which coenzyme is required to incorporate the methyl group into thymidine, a prerequisite for DNA production?|Biotin|N5,N10-tetrahydrofolate|Pyridoxal phosphate|Pantothenic acid|B
35|3|Vitamin C is required for the production and maintenance of:|Collagen|Hormone|Ascorbic acid|Red blood cells|A
36|4|Spending 15 minutes in sunlight three times a week without sunscreen helps increase levels of which vitamin?|Vitamin C|Vitamin D|Vitamin B|Vitamin A|B
37|4|Vitamin B12 deficiency caused by lack of intrinsic factor is called:|Pernicious anemia|Poor circulation of red blood cells|Beriberi|Pellagra|A
38|4|Which is correct about NAD+?|NAD is a derivative of vitamin B2|Can accept two hydrogen atoms|Contains a pyridine ring|Deficiency causes scurvy|C
39|4|Which vitamin participates in transamination reactions?|Thiamine|Riboflavin|Pyridoxine|Cobalamin|C
40|4|Biotin attached to lysine is called:|Biotinidase|Biocytin|Apocarboxylase|Holocarboxylase|B
41|4|A common feature of thiamine, riboflavin and niacin is that:|They are used in synthesis of blood-clotting proteins|They all work as coenzymes in energy metabolism|They help strengthen blood vessels|They all stabilize cell membranes|B
42|4|The deficiency disorder associated with low levels of vitamin B1 is:|Dryness of skin|Beriberi|Night blindness|Neural tube defects|B
48|5|What is the function of the Shine–Dalgarno sequence?|Template for protein synthesis|Recruiting ribosome to the initiation site|Stop codon recognition|Reduces translation efficiency|B
49|5|Nonsense mutations are mutations that:|Change UAA to UGA|Change AAA to UGA|Delete one nucleotide|Insert one nucleotide|B
50|5|Rifampin inhibits:|Eukaryotic transcription|Prokaryotic transcription|Eukaryotic translation|Prokaryotic translation|B
51|5|During protein synthesis, the enzyme responsible for peptide-bond formation is:|Peptidyl transferase|Peptidyl translocase|Transpeptidase|Helicase|A
52|5|The sigma factor in prokaryotes is responsible for:|Termination of RNA chain|Initiation of RNA chain|Termination of protein chain|Initiation of protein chain|B
53|5|Ribozymes:|Are catalytic RNA|Catalyze ribosome synthesis|Remove exons from hnRNA|Are responsible enzymes in ribosome degradation|A
54|6|Post-transcriptional regulation in eukaryotes includes all except:|Splice-site choice|Poly-A-site choice|mRNA editing|Histone modification|D
55|6|All are true about enhancers in eukaryotes except:|They can be downstream from the promoter|They are in the coding region|They can be upstream from the promoter|They can be thousands of base pairs from the gene they regulate|?
56|6|What is found only in the lagging strand?|Primers|RNA polymerase|DNA polymerase|Okazaki fragments|D
57|6|Which enzyme has proofreading activity?|RNA polymerase|DNA polymerase|Topoisomerase|Helicase|B'''
def compact(id,rows,notes,coverage):
 qs=[]
 for line in rows.splitlines():
  n,p,prompt,*rest=line.split('|');key=rest.pop();q=question(n,int(p),prompt,rest,None if key=='?' else key);qs.append(q)
 save(id,qs,notes,coverage)
if __name__=='__main__':compact('bio-undated-t3',T3,'Six source pages contain 35 questions: Q1–6, Q19–24, Q30–42 and Q48–57. Missing pages/questions are not reconstructed. Q19 lacks the usual mixed-venous saturation value; Q30 has a defective cooperative-inhibition option and Q55 is not a uniquely valid claim. These remain ungraded. Q57 accepts both DNA- and RNA-polymerase proofreading.',{'completeSource':True,'completeSitting':False,'missingQuestionNumbers':list(map(str,list(range(7,19))+list(range(25,30))+list(range(43,48))))})
MARKED='''11|1|What is the name of the bond in poly- and disaccharides?|Hydrophobic bond|Electrostatic bond|Glycosidic bond|No bond|C
12|1|Which is a nonreducing disaccharide?|Sucrose|Maltose|Lactose|Lactose–maltose|A
13|1|Which is a heteropolysaccharide?|Cellulose|Glycogen|Amylose|Glycoproteins|?
14|1|What is the difference between amylose and amylopectin?|They are the same|Amylose has 1–4 and 1–6 glycosidic bonds|Amylopectin has 1–4 glycosidic bonds|Amylopectin has 1–4 and 1–6 glycosidic bonds|D
18|2|What is the name of the 18-carbon monounsaturated fatty acid?|Oleic acid|Linoleic acid|Palmitic acid|Linolenic acid|A
19|2|What is saponification?|Hydrolysis of TAG in a weak acid|Hydrolysis of TAG in a strong acid|Hydrolysis of TAG in a strong base|Hydrolysis of TAG in a weak base|C
20|2|What form do lipids take in water?|Micelle form|Ester form|Salt form|None|?
21|2|What is another name for cephalin?|Phosphatidylserine|Phosphatidylcholine|Phosphatidylethanolamine|None|C
15|3|What is a racemic solution?|An equal mixture of right- and left-handed lactic acid|An equal mixture of right- and left-handed pyruvic acid|An equal mixture of right- and left-handed carbonic acid|An equal mixture of right- and left-handed phosphoric acid|A
16|3|What are the components of hyaluronic acid?|D-glucuronic acid and N-acetyl-D-glucosamine|D-glucuronic acid and N-acetyl-D-galactosamine|D-urocuronic acid and N-acetyl-D-galactosamine|D-glucuronic acid and N-acetyl-D-mannosamine|A
17|3|What is not correct for lipids?|It is a hydrophobic molecule|It is a nonpolar molecule|It is a polar molecule|It is a water-insoluble molecule|?
26|5|How many amino acids are in each α-helix turn?|3.4|3.6|2.8|4.7|B
27|5|What is salting in?|Precipitate proteins by salt|Dissolve proteins by low concentration of salt|Dissolve proteins by high concentration of salt|Dissolve proteins by acid|B
28|5|Which option is correct for Ala–Ile–Tyr–Met, from left to right?|Nonpolar – nonpolar – polar uncharged – nonpolar|Nonpolar – nonpolar – polar uncharged – polar|Nonpolar – polar – polar uncharged – nonpolar|Polar – nonpolar – polar uncharged – nonpolar|A
29|5|Which option is correct for Phe–Asp–Glu–Trp, from left to right?|Ketogenic – glucogenic – glucogenic – gluco- and ketogenic|Gluco- and ketogenic – glucogenic – glucogenic – ketogenic|Gluco- and ketogenic – ketogenic – glucogenic – gluco- and ketogenic|Gluco- and ketogenic – glucogenic – glucogenic – gluco- and ketogenic|D
22|6|What is sphingosine?|It is a fatty acid|It is a glycolipid|It is a glycerol derivative|It is an unsaturated amino alcohol|D
23|6|Which option is not correct for protein?|It is a macromolecule|It is a micromolecule|It is an enzyme|It is a pathogen|B
24|6|What bond contributes most to formation of protein tertiary structure?|Hydrophobic bond|Hydrogen bond|Disulfide bond|Electrostatic bond|A
25|6|What is a motif?|Supersecondary structure of proteins|Primary structure of protein|Tertiary structure of proteins|Random-coil structure|A
1|7|What is a buffer's function?|Increase the pH|Decrease the pH|Prevent changes in pH|Does not affect pH|C
2|7|Which index is best to determine solvent quality?|Polarity|Hydrophobicity|Dielectric coefficient|All|?
3|7|What does physiological pH depend on?|Base/acid ratio|pK of a weak acid|pK of a weak base|All|?
4|7|Which option is not correct for protein?|It is a macromolecule|It is a micromolecule|It is an enzyme|It is a pathogen|B
5|8|Which contributes most to formation of a protein's tertiary structure?|Hydrogen bond|Hydrophobic bond|Disulfide bond|Electrostatic bond|B
6|8|What is a motif?|Supersecondary structure|Primary structure of protein|Tertiary structure of proteins|Random-coil structure|A
7|8|How many amino acids are in each α-helix turn?|4.6|2.6|3.6|3.4|C
8|8|What is salting in?|Precipitate proteins by salt|Dissolve proteins by low concentration of salt|Dissolve proteins by acid|Dissolve proteins by base|B
9|8|What is the term for helix–β-sheet–helix in a polypeptide?|Loop|Turn|Motif|Domain|C
10|8|What type of sugar is ribose?|Pentose|Hexose|Pentore [as printed]|Heptose|A'''
def marked():
 rows=MARKED.splitlines();rows += [line.replace('|1|','|4|',1) for line in rows[:4]];rows += [line.replace('|2|','|9|',1) for line in rows[4:8]]
 rows.sort(key=lambda l:int(l.split('|')[1]))
 compact('bio-marked-2023','\n'.join(rows),'Mixed annotated fragments, including two differently ordered question sets. Starts at Q11 (not Q10); source p10 is blank. Repeated photographed occurrences are preserved. Several broad/defective stems remain ungraded; annotation marks are not an official key.',{'completeSource':True,'completeSitting':False,'blankSourcePages':[10],'sourceQuestionSets':'Q11–29 plus alternate Q1–10; pages Q11–14 and Q18–21 repeated'})
if __name__=='__main__':marked()
def nourozi():
 import copy
 online=json.load(open(OUT/'cell-online-theory.json'))['questions'];by={q['number']:q for q in online}
 extra='''1|1|As the pKa of an acid decreases, the acid will be:|Weaker|Stronger|Converted to a neutral solution|None of them|B
45|8|Transcription of A, Y and Z genes of the lac operon is prevented by:|Lactose|Repressor|Allolactose|cAMP|B
46|8|Very low-density lipoproteins are also known as:|β-lipoproteins|Pre-β-lipoproteins|α-lipoproteins|Broad-β-lipoproteins|B
47|8|Which of the following forms a palindromic sequence?|AGTCCTGA|GTTCCAAG|ATTGCAAT|GTTGGAAC|C
48|8|The enzyme responsible for removal of supercoiling ahead of the replication fork is:|Topoisomerase|Primase|DNA polymerase|Helicase|A
49|8|Which of the following acts as lung surfactant?|Dipalmitoyl lecithin|Phosphatidylserine|Diphosphatidylglycerol|Cardiolipin|A
50|9|Which is a nonaromatic amino acid with a hydroxyl R-group?|Phenylalanine|Lysine|Threonine|Methionine|C
51|9|What is the structure of myoglobin?|Homodimer|Monomer|Heterodimer|Tetramer|B'''
 for line in extra.splitlines():
  n,p,pr,*rest=line.split('|');k=rest.pop();by[n]=question(n,int(p),pr,rest,k)
 groups=[[1,2,3,4],list(range(5,10)),list(range(10,15)),list(range(20,25)),list(range(25,30)),list(range(35,40)),list(range(40,45)),list(range(45,50)),list(range(50,55)),list(range(55,59))]
 qs=[]
 for p,nums in enumerate(groups,1):
  for n in nums:
   q=copy.deepcopy(by[str(n)]);q['page']=p
   if n==41:q['options'][-1]['text']='DNA polymerase II'
   qs.append(q)
 save('bio-nourozi',qs,'48 source-present questions: Q1–14 and Q20–29 and Q35–58. Q15–19 and Q30–34 are absent. The last Q58 is partially clipped but its complete wording/options are recovered from the matching online source. Kept in source order; not represented as a complete 58-question sitting.',{'completeSource':True,'completeSitting':False,'missingQuestionNumbers':list(map(str,list(range(15,20))+list(range(30,35))))})
JAN2023='''1|2|Which of the following is synthesized in the phosphogluconate pathway?|NADH|FADH|NADPH|GTP|C
2|2|Which of the following is a high-energy molecule?|Dihydroxyacetone phosphate|Glyceraldehyde 3-phosphate|1,3-Bisphosphoglycerate|2-Phosphoglycerate|C
3|2|Which enzyme is important in fermentation?|LDH|ALT|AST|ALP|A
4|2|Which enzyme is important in glycogenolysis?|Phosphorylase|Hexokinase|Glucokinase|Phosphatase|A
5|2|Which glucose transporter is active in liver tissues?|GLUT1|GLUT2|GLUT3|GLUT4|B
6|3|All the following enzymes are important in gluconeogenesis except:|PEPCK|Fructose 1,6-bisphosphatase|Glucose 6-phosphatase|Phosphorylase|D
7|3|How many pyruvate molecules are required for gluconeogenesis?|1|2|3|4|B
8|3|Where does glycolysis take place?|Cytosol|Mitochondria|Nucleus|Cell membrane|A
9|3|Oxidation of one glucose molecule yields how many ATP molecules?|26–28|30–32|34–36|38–40|B
10|3|For cellulose synthesis, which molecule is important in glucose activation?|ADP|CDP|GDP|TDP|?
11|4|Which molecule is synthesized in the HMP shunt?|NAD|NADH|FADH|NADPH|D
12|4|How many ATP molecules are synthesized in glycolysis?|1|2|3|4|?
13|4|HMG-CoA reductase activity is increased by administration of which hormone?|Insulin|Epinephrine|Glucagon|Glucocorticoids|A
14|4|Anti-inflammatory corticosteroids inhibit:|Phospholipase A1|Lipoxygenase|Phospholipase A2|Cyclooxygenase|C
15|4|Genetic deficiency of lipoprotein lipase causes which type of hyperlipoproteinemia?|Type I|Type IIa|Type IIb|Type V|A
16|5|Acetyl-CoA formed from pyruvate can be used for synthesis of all except:|Cholesterol|Fatty acids|Steroid hormones|Glucose|D
17|5|NADPH is produced when this enzyme acts:|Pyruvate dehydrogenase|Malic enzyme|Succinate dehydrogenase|Malate dehydrogenase|B
18|5|Long-chain fatty acyl-CoA esters are transported across the mitochondrial membrane by:|cAMP|Choline|Prostaglandin|Carnitine|D
19|5|During each cycle of β-oxidation of fatty acid, all the following are generated except:|NADH|H2O|FADH|Acyl-CoA|B
20|5|Acetyl-CoA required for fatty-acid synthesis is produced by:|Pyruvate dehydrogenase complex|Citrate lyase|Thiolase|Carnitine-acyl transferase|B
21|6|All statements about 3-hydroxy-3-methylglutaryl-CoA are true except:|It is formed in cytoplasm|Required in ketogenesis|Involved in fatty-acid synthesis|An intermediate in cholesterol biosynthesis|C
22|6|Which is an activator of fatty-acid synthesis?|Palmitate|Carnitine|Malonyl-CoA|Citrate|D
23|6|One palmitic-acid molecule fully oxidized to CO2 yields how many ATP molecules (high-energy bonds)?|119|129|146|154|?
24|6|β-oxidation of an odd-carbon fatty-acid chain produces:|Propionyl-CoA|Malonyl-CoA|Succinyl-CoA|Glutaryl-CoA|A
25|6|In the respiratory chain, cytochrome a3 is located in complex:|I|II|III|IV|D
26|7|Which part of the respiratory chain has the lowest oxidizing power?|FMN|Coenzyme Q|Cytochrome b|Cytochrome c|A
27|7|The ATP/ADP transporter in the inner mitochondrial membrane is inhibited by:|Oligomycin|CN−|Atractyloside|Barbiturates|C
28|7|Which respiratory-chain complex does not act as a proton pump?|Succinate-Q reductase|NADH dehydrogenase|Cytochrome-c oxidase|Cytochrome-c reductase|A
29|7|Deficiency or hereditary absence of which enzyme causes immunodeficiency in infants?|Thymidylate synthetase|Adenosine deaminase|Xanthine oxidase|Ribonucleotide reductase|B
30|7|All the following participate in pyrimidine nucleotide biosynthesis except:|Aspartate|Phosphoribosyl pyrophosphate|Carbamoyl phosphate|Glycine|D
31|8|In humans, the end product of purine catabolism is:|Urea|Xanthine|Uric acid|Allantoin|C
32|8|Lesch–Nyhan syndrome is due to deficiency of:|Hypoxanthine-guanine phosphoribosyltransferase|Adenosine deaminase|Xanthine oxidase|Adenine phosphoribosyltransferase|A
33|8|In which jaundice does conjugated bilirubin in blood increase the most?|Obstructive|Hepatitis|Hemolytic|Physiologic|A
34|8|The first nucleotide formed in purine de novo synthesis is:|PRPP|Uric acid|OMP|IMP|D
35|8|Allopurinol inhibits which enzyme to treat which disease?|Orotate decarboxylase; renal azotemia|Xanthine oxidase; gout|Orotate decarboxylase; gout|Xanthine oxidase; SCID|B
36|9|… donates its phosphate to ADP to yield ATP during muscle exertion.|Arginine-glycine amidinotransferase|Creatine phosphate|Creatine kinase|Guanidinoacetate|B
37|9|All the following are nonfunctional enzymes except:|Alkaline phosphatase|Acid phosphatase|Lipoprotein lipase|γ-Glutamyltranspeptidase|C
38|9|Which is not a pancreatic-specific enzyme?|Lipase|Aldolase|Trypsin|Amylase|B
39|9|Which is the only plasma enzyme normally found in urine?|Acid phosphatase|Nucleotidase|Nucleotidase|Amylase|D
40|9|Which is not a pancreatic-specific enzyme?|Lipase|Aldolase|Trypsin|Amylase|B
41|10|Which statement about the urea cycle is correct?|Argininosuccinate is lysed to urea and ornithine|Carbamoyl phosphate supplies both nitrogen atoms of urea|Arginine is hydrolyzed to urea and ornithine|Formation of urea yields energy|C
42|10|Which statement about transamination is correct?|It involves ATP hydrolysis|It is irreversible|It requires NAD+ or NADP+|It requires pyridoxal 5′-phosphate|D
43|10|Which amino acid cannot provide a substrate for gluconeogenesis?|Leucine|Tryptophan|Histidine|Isoleucine|A
44|10|Which is a nonessential amino acid?|Lysine|Serine|Leucine|Threonine|B
45|10|Which amino acid carries ammonia from skeletal muscle to liver?|Alanine|Methionine|Arginine|Glutamine|A
46|11|Amino acids are released into the portal system by:|Pinocytosis|Active transport|Facilitated transport|Passive transport|C
47|11|Which enzyme catalyzes the major mechanism for transporting ammonia in nontoxic form?|Aminotransferase|Amino-acid oxidase|Glutamine synthetase|Threonine dehydrogenase|C
48|11|Which enzyme is deficient in alkaptonuria?|Homogentisate dioxygenase|p-Hydroxyphenylpyruvate dioxygenase|Phenylalanine hydroxylase|Tyrosinase|A
49|11|A person with phenylketonuria cannot convert:|Phenylalanine to tyrosine|Phenylalanine to isoleucine|Phenol into ketones|Phenylalanine to lysine|A
50|11|An example of transamination is:|Glutamate → hexanoic acid + NH3|Aspartate + hexanoic acid → glutamate + oxaloacetate|Aspartate + α-ketoglutarate → glutamate + oxaloacetate|Glutamate → α-ketoglutarate + NH3|C'''
if __name__=='__main__':
 nourozi();compact('bio-jan2023',JAN2023,'All 50 numbered questions retained, including the repeated enzyme stem at Q38 and Q40. Q10 lacks the expected UDP option; Q12 does not specify net versus gross ATP; Q23 uses outdated ATP accounting. These remain ungraded instead of assigning a misleading modern key.',{'completeSource':True,'expectedQuestions':50})
def sep2019():
 pages=CACHE['bio-sep2019-native'];text='';offsets=[]
 for p in pages:offsets.append((len(text),p['page']));text+=p['text']+'\n'
 ms=list(re.finditer(r'(?m)^\s*(\d{1,2})\.\s*(?=[A-Za-z0])',text));qs=[]
 keys={5:'D',10:'B',15:'B',23:'D',26:'C',27:'B',28:'D',29:'A',30:'A',33:'E',37:'C',44:'B'}
 corrections={72:'Editorial correction: the centriole retains its structure through the cell cycle; the nucleolus disassembles during mitosis.',75:'Editorial correction: cAMP activates protein kinase A; DAG activates protein kinase C.',6:'Editorial correction: thiamine deficiency impairs pyruvate dehydrogenase (pyruvate to acetyl-CoA), not lactate dehydrogenase.',13:'Editorial correction: collagen is a triple helix; elastin is not.',19:'Editorial caution: gluconate is the anion of gluconic acid; the supplied answer does not satisfy this stem.',25:'Editorial correction: leukotrienes are potent bronchoconstrictors involved in asthma.',41:'Editorial correction: DNA polymerase polymerizes deoxyribonucleotides; DNA ligase seals strand breaks.',43:'Editorial correction: lesion recognition precedes incision, excision, replacement synthesis and ligation.'}
 for i,m in enumerate(ms):
  n=int(m[1]);p=next(p for off,p in reversed(offsets)if off<=m.start());raw=text[m.end():ms[i+1].start()if i+1<len(ms)else len(text)].strip();opts=list(re.finditer(r'(?m)^\s*([a-e])\.\s*',raw));answer=None
  if opts:
   pr=raw[:opts[0].start()].replace('\n',' ').strip();os=[(x[1].upper(),raw[x.end():opts[j+1].start()if j+1<len(opts)else len(raw)].replace('\n',' ').strip())for j,x in enumerate(opts)]
   if len(os)==1:answer=os[0][1];os=[]
   else:os.sort()
  else:
   parts=re.split(r'\n\s*-(?=\S)',raw,maxsplit=1);pr=parts[0].replace('\n',' ').strip();answer=parts[1].replace('\n',' ').strip()if len(parts)>1 else None;os=[]
  q=question(n,p,pr,[x[1]for x in os],keys.get(n));q['sourceOrdinal']=i+1
  if answer:q['sourceAnswer']=answer;q['explanation']='Source answer note (unverified): '+answer+'. '+corrections.get(n,'This recall has no complete set of choices and is retained for written self-review without automatic scoring.')
  if n==33:q['acceptedOptionIds']=['A','E'];q['explanation']='Isomerase is the general enzyme class; an epimerase is a type of isomerase and also satisfies the broad wording. Both A and E are accepted.'
  qs.append(q)
 save('bio-sep2019',qs,'Answer-note/recall compilation, not a complete sequential exam. 55 source-present stems retained in file order. Many have only one supplied answer and are represented as ungraded written responses. Opening orphan answer about G-C stability lacks its question stem and is recorded here only. Known incorrect source notes are flagged in explanations, not silently endorsed.',{'completeSource':True,'completeSitting':False,'orphanAnswerNotes':['G-C bonds are much more resistant to denaturation than A-T-rich regions (opening source line; no stem).']})
if __name__=='__main__':sep2019()
DDSJUL='''1|2|The primary structure of proteins is primarily maintained by:|Peptide bond|Hydrogen bond|Ionic bond|Hydrophobic bond|A
2|2|Polar amino acids in an aqueous solution are found:|On the surface of proteins|At the sides of proteins|Inside the core of proteins|Can be present anywhere in proteins|A
3|2|What is the pI of glutamic acid, given pKa(R)=4.2, pKa(COOH)=2.3 and pKa(NH2)=9.3?|6.75|3.25|5.8|4.25|B
4|2|Which factor increases hemoglobin affinity for oxygen?|Increase of CO2 pressure|Increase of CO|Decrease of pH|Increase of temperature|B
5|2|Which correctly describes the Bohr effect?|Effect of temperature on hemoglobin oxygen binding/release|Effect of 2,3-BPG on hemoglobin oxygen binding/release|Effect of carbon monoxide on hemoglobin oxygen binding/release|Effect of pH and CO2 on hemoglobin oxygen binding/release|D
6|2|RBC 2,3-BPG concentration does not increase in:|Chronic hypoxia|Maternal hyperoxygenation|High altitude|Chronic anemia|B
7|2|Which protein is defective in Marfan syndrome?|Collagen|Elastase|Fibrillin|Hemoglobin|C
8|2|When the pKa of an acid decreases, the acid becomes:|Weaker|Stronger|A neutral solution|A buffer|B
9|2|Which acid/base pair is an appropriate buffer in the human body?|Glutamate/glutamic acid|H2SO4/HSO4−|H2CO3/HCO3−|Aspartate/aspartic acid|C
10|3|A solution is an effective buffer when its pH is:|Within approximately ±1 pH unit of pKa|Within approximately ±2 pH units of pKa|Within approximately ±1 pH unit of Ka|Within approximately ±2 pH units of Ka|A
11|3|Which electrolyte has the highest concentration in ICF compared with ECF?|Potassium ion|Sodium ion|Chloride ion|Bicarbonate ion|A
12|3|Which statement about the buffering system is true?|It resists pH changes when large amounts of acid or base are added|It consists of a weak acid and its conjugate base|Buffering power of all conjugate acid/base pairs is the same|Buffers are needed only in pathological conditions|B
13|3|Which monosaccharide is the universal fuel of the fetus?|Xylulose|Glucose|Fructose|Arabinose|B
14|3|Which statement about cellulose is true?|Human intestinal enzymes can hydrolyze it|It is an important source of bulk in the diet|It is a heteropolysaccharide|It is the main human energy reserve|B
15|3|A researcher wants to make a wound-repair cream. Which carbohydrate is appropriate?|Hyaluronic acid|Heparin|Inulin|Maltose|A
16|3|Which biomolecule can be used as a mild osmotic laxative by increasing water in the bowels?|Inulin|Lactulose|Amylose|Isomaltose|B
17|3|A high concentration of xylulose is seen in an infant's urine. What is a possible diagnosis?|Pentosuria|Diabetes mellitus|Lactose intolerance|Sucrose intolerance|A
18|4|Which statement about carbohydrate isomerism is true?|Most naturally occurring monosaccharides are L isomers|Aldose–ketose isomers have different molecular formulas|Epimers are mirror images of each other|Sucrose is an invert sugar|?
19|4|Which carbohydrate is an important structural compound in flavin coenzymes?|Ribose|Arabinose|Xylose|Maltose|?
20|4|Which biomolecule can be used for biosynthesis of anticoagulants?|Keratan sulfate|Heparin|Heparan sulfate|Amylopectin|B
21|4|Which uses glucose as its only metabolic fuel in both fed and starving states?|Mature erythrocytes|Liver|Brain|Muscle|A
22|4|Which statement about fatty acids is correct?|One is the precursor of prostaglandins|They all contain double bonds|They are constituents of sterols|They are extremely hydrophilic|A
23|4|Which fatty acid has the lowest melting point?|Palmitic acid|Stearic acid|Arachidonic acid|Eicosapentaenoic acid|D
24|4|Which contains an ether bond?|Gangliosides|Phosphatidylserine|Platelet-activating factor|Sphingomyelin|C
25|4|Which lipoprotein is rich in cholesterol?|Chylomicron|VLDL|LDL|HDL|C
26|5|Sphingosine is a component of all except:|Gangliosides|Cardiolipin|Sphingomyelin|Ceramide|B
27|5|Which is an essential fatty acid?|Oleic acid|Arachidonic acid|Linolenic acid|Palmitoleic acid|C
28|5|The number of double bonds in arachidonic acid is:|1|2|4|6|C
29|5|Which statement about Km is not true?|It is lower for an enzyme with high substrate affinity|It is substrate concentration at half maximum reaction rate|It measures enzyme affinity for substrate|It is higher for an enzyme with high substrate affinity|D
30|5|Which is the definition of enzyme activity?|Amount catalyzing one micromole of substrate per second|Substrate molecules converted per enzyme molecule per second|Amount catalyzing one micromole of substrate per minute|Substrate molecules converted per enzyme molecule per minute|C
31|5|In modern enzyme nomenclature, which class occupies third position?|Hydrolase|Ligase|Oxidoreductase|Transferase|A
32|5|Which statement about enzymes is not true?|They lower activation energy|They are proteins whose three-dimensional form is key to function|They change reaction equilibrium|They do not change free energies of reactants or products|C
33|5|Which is not an example of competitive inhibition?|Methotrexate and dihydrofolate reductase|Atorvastatin and HMG-CoA reductase|Penicillin and transpeptidase|Malonate and succinate dehydrogenase|C
34|6|Which statement about isoenzymes is not true?|They display different regulatory properties|They have distinct physical properties|They catalyze different reactions|They may be expressed in a tissue-specific manner|C
35|6|In an allosteric enzyme, the effector-binding site is known as:|R-subunit|C-subunit|T-subunit|M-subunit|A
36|6|Biotin is a coenzyme for all except:|Pyruvate to oxaloacetate|Acetyl-CoA to malonyl-CoA|Propionyl-CoA to methylmalonyl-CoA|Glutamate to γ-carboxyglutamate|D
37|6|Name the coenzymes of riboflavin (B2):|NAD or NADP|FAD and FMN|Coenzyme A|Thiamine pyrophosphate|B
38|6|Which disease is caused by niacin deficiency?|Scurvy|Rickets|Pellagra|Pernicious anemia|C
39|6|Which is effective in premenstrual syndrome and diabetes?|Vitamin B12|Vitamin B9|Vitamin B6|Vitamin B3|?
40|6|Which vitamin deficiency causes neural-tube defects?|Vitamin C|Vitamin B12|Niacin|Folic acid|D
41|6|The coenzyme forms of vitamin B12 are:|Hydroxycobalamin and cyanocobalamin|Adenosylcobalamin and methylcobalamin|Cyanocobalamin and adenosylcobalamin|Methylcobalamin and hydroxycobalamin|B
42|6|Which organs activate vitamin D in the human body?|Intestine and liver|Kidney and pancreas|Liver and kidney|Stomach and brain|C
43|7|Increased RBC fragility is caused by:|Vitamin E deficiency|Vitamin D deficiency|Vitamin C deficiency|Vitamin A deficiency|A
44|7|DNA ligase:|Introduces superhelical twists|Connects the ends of two DNA chains|Unwinds the double helix|Synthesizes RNA primers|B
45|7|RNA primer is formed by:|Ribonuclease|Primase|DNA polymerase I|DNA polymerase III|B
46|7|During replication, unwinding the double helix is initiated by:|DnaA protein|DnaB protein|DnaC protein|Rep protein|?
47|7|Substitution of thymine by adenine in DNA is:|Transposition|Transition|Transversion|Frameshift mutation|C
48|7|Xeroderma pigmentosum results from a defect in:|UvrABC excinuclease|DNA polymerase I|DNA ligase|DNA polymerase III|?
49|7|The genetic code is:|Overlapping|Nonoverlapping|Not universal|Ambiguous|B
50|7|Aminoacyl-tRNA synthetase is involved in:|Dissociation of discharged tRNA from the 80S ribosome|Charging tRNA with specific amino acids|Termination of protein synthesis|Nucleophilic attack on esterified carboxyl group of peptidyl-tRNA|B
51|7|In prokaryotes, chloramphenicol:|Causes premature release of the polypeptide chain|Causes misreading of mRNA|Depolymerizes DNA|Inhibits peptidyl-transferase activity|D
52|8|Actinomycin D binds to:|Double-stranded DNA|Single-stranded DNA|Single-stranded RNA|DNA–RNA hybrid|A
53|8|The eukaryotic 40S pre-initiation complex contains all except:|eIF-1A|eIF-2|eIF-3|eIF-4|D
54|8|Tetracyclines inhibit aminoacyl-tRNA binding to:|30S ribosomal subunits|40S ribosomal subunits|50S ribosomal subunits|60S ribosomal subunits|A
55|8|Which lac-operon gene has constitutive expression?|i|c|z|p|A
56|8|Cis-acting elements include:|Steroid hormones|Calcitriol|Histones|Silencers|D
57|8|Which bacterial operon is not controlled by attenuation?|Arabinose|Tryptophan|Leucine|Histidine|A'''
if __name__=='__main__':compact('bio-dds-jul2023',DDSJUL,'All 57 numbered questions retained. Q18 has no correct isomerism statement, Q19 confuses ribose with ribitol, Q39 makes an unqualified treatment claim, Q46 blurs initiation with helicase action, and Q48 substitutes bacterial UvrABC for human nucleotide-excision repair; these remain ungraded.',{'completeSource':True,'expectedQuestions':57})
DOCX='''1|1|The active form of vitamin B3 is:|TPP|FAD|NAD|CoA-SH|C
2|1|Vitamin C is required for production and maintenance of:|Collagen|Hormone|Ascorbic acid|Red blood cells|A
3|1|Which is a function of vitamin B12?|Myelin sheath that protects nerve fibers|Red-blood-cell formation|Vision|A and B|D
4|1|Biotin is needed for:|Apocarboxylases|Biotinidase|Transaminases|Pyruvate dehydrogenase complex|A
5|1|Carotenoids are a good source of:|Vitamin E|Vitamin A|Vitamin D|Vitamin K|B
6|1|Vitamin D deficiency causes:|Hemorrhagic disease of the newborn|Hemolytic anemia in premature infants|Night blindness|Osteomalacia|D
7|1|Which form of vitamin B12 is a coenzyme for methionine synthase?|Methylcobalamin|Cyanocobalamin|Hydroxycobalamin|Adenosylcobalamin|A
8|2|Methotrexate interferes with activation of:|Calcitriol|Folic acid|Pyridoxine|Riboflavin|B
9|2|Night blindness is due to deficiency of:|Retinal|Retinoic acid|Tretinoin|Isotretinoin|A
10|2|Enzyme Commission number 2.5.3.21 belongs to:|Isomerases|Hydrolases|Transferases|Lyases|C
11|2|Which is not a property of enzymes?|High catalytic power|Stereospecificity|High efficiency|High Km|D
12|2|Chymotrypsin is specific for … amino acids.|Acidic|Basic|Nonpolar|Aromatic|D
13|2|In an enzymatic reaction, [S] = 2 mmol/L and V0 = 1/3 Vmax. What is Km in mmol/L?|2|4|6|8|B
14|2|In competitive inhibition, what happens to Km and Vmax?|Km decreases; Vmax increases|Km does not change; Vmax increases|Km increases; Vmax does not change|Km increases; Vmax decreases|C
15|3|A decrease in enzyme Km due to an allosteric regulator could be interpreted as:|Inhibition|Activation|Either A or B|None|B
16|3|One unit of enzyme activity is defined as:|mmol/L|μmol/min|mol/s|units/mg|B
17|3|Which compound irreversibly inhibits prostaglandin synthesis?|Diisopropyl fluorophosphate|Cyanide|Fluorouracil|Aspirin|D
18|3|Which is wrong about allosteric enzymes?|They have multiple subunits|The activity-versus-[S] curve is sigmoidal|Activators shift the activity curve to the right|They are usually regulated by feedback inhibition|C
19|4|What is the bond between successive nucleotides in DNA and RNA?|Hydrogen bond|Phosphodiester bond|Hydrophobic bond|Ionic bond|B
20|4|All are correct about the DNA double helix except:|The two chains coil around a common axis of symmetry|Grooves give regulatory proteins access to recognition sequences|AT-rich DNA has a much higher melting temperature than GC-rich DNA of equal length|Transitions between B and Z helices may help regulate gene expression|C
21|4|All are correct about the origin of replication except:|It is almost exclusively AT base pairs that facilitate DNA melting|Multiple origins increase replication speed|DnaB is the principal replication primase in E. coli|DnaA binds specific sequences at the replication origin|C
22|4|All are correct about topoisomerases except:|They have exonuclease activity for supercoiled DNA|They remove supercoils|They add supercoils|Bacterial DNA gyrase is inhibited by ciprofloxacin|A
23|4|All are used in replication except:|RNA polymerase|DNA polymerase|Poly-A polymerase|Topoisomerase|C
24|4|Telomeres are:|Complexes of noncoding DNA plus proteins at the ends of linear chromosomes|Important for preventing exonuclease attack|Several thousand tandem repeats of AGGGTT|A reverse-transcriptase enzyme responsible for preventing chromosome shortening|A
25|5|The diagram shows a C/T mismatch in prokaryotic DNA. Which answer is correct?|C is right and T should be replaced by G|T is right and C should be replaced by A|C/T should be replaced by G/T|The C/T base pair should be deleted|B
26|5|The DNA template for transcription is GATCTAC. What is the RNA sequence? All sequences are written 5′ to 3′.|CTAGATG|GTAGATC|GAUCUAC|GUAGAUC|D
27|5|DNA has equal guanine and cytosine content, but RNA does not. This means RNA is a:|Double-stranded molecule|Double-stranded helical molecule|Polymer of purine and pyrimidine ribonucleotides|Single-stranded molecule|D
28|5|DNA ligase:|Introduces superhelical twists|Connects ends of two DNA chains|Unwinds the double helix|Synthesizes RNA primers|B
29|5|Ribozymes are:|Enzymes present in ribosomes|Enzymes combining ribosomal subunits|Enzymes which dissociate|Enzymes made of RNA|D
30|5|After the replication fork forms:|Both new strands are synthesized discontinuously|One strand is synthesized continuously and the other discontinuously|Both new strands are synthesized continuously|An RNA primer is needed for only one new strand|B
31|6|All statements about introns are correct except:|They are present in human DNA|They are transcribed by RNA polymerase|They are translated by the ribosome|They are located between exons|C
32|6|Xeroderma pigmentosum is caused by a defect in:|DNA repair|DNA replication|RNA processing|Translation|A
33|6|Which RNA-processing step cannot be found in eukaryotes?|Addition of a guanylate cap|Addition of a poly-A tail|Removal of exons|Modification of some bases|?
34|6|In the presence of both lactose and glucose, the lac operon is … and its operator is …|On; occupied by repressor|Off; occupied by repressor|Off; not occupied by repressor|On; not occupied by repressor|?
35|6|In the presence of tryptophan, its operon is … and its operator is …|On; occupied by repressor|Off; occupied by repressor|Off; not occupied by repressor|On; not occupied by repressor|B
36|6|Which step occurs in cytosine-deamination repair but not thymine-dimer repair?|Endonuclease excision|Ligation by ligase|Base removal by glycosidase|DNA synthesis by DNA polymerase|C
37|6|The anticodon region is part of … and pairs with a codon in …|rRNA; mRNA|tRNA; mRNA|mRNA; tRNA|rRNA; tRNA|B'''
def docx():
 qs=[]
 for line in DOCX.splitlines():
  n,p,pr,*rest=line.split('|');k=rest.pop();q=question(n,int(p),pr,rest,None if k=='?' else k);q['sourceLocator']='Embedded image '+p;q['page']=int(p)
  if n=='24':q['acceptedOptionIds']=['A','B','C'];q['explanation']='A, B and C describe telomeres. D confuses telomeres with telomerase. The source does not provide a unique single-best answer.'
  if n=='25':q['media']=[dict(src='/study/term1-telegram/figures/biochem-theory/docx-q25.png',alt='Original methylated-template mismatch-repair diagram')]
  if n=='33':q['explanation']='Alternative splicing can remove/skip exons, so the absolute cannot-be-found wording is defective. The basic intended contrast is removal of introns, but this question remains ungraded.'
  if n=='34':q['explanation']='Lactose relieves repression while glucose lowers cAMP/CAP activation, allowing basal rather than simply on/off expression. The binary choices do not state this clearly.'
  qs.append(q)
 # The Word document separately repeats Q8 and Q9 as typed text between the first two images.
 import copy
 typed=[copy.deepcopy(qs[7]),copy.deepcopy(qs[8])]
 for q in typed:q['sourceLocator']='Typed duplicate after embedded image 1'
 qs[7:7]=typed
 save('cell-final-docx',qs,'39 source occurrences: 37 unique numbered questions in six embedded images plus typed duplicates of Q8 and Q9. Page numbers refer to embedded-image order. Student answer notes are not an official key; source mistakes (including Q23) are corrected only in labelled editorial keys. End-of-document vitamin study notes and an unfinished sample stem are not exam questions.',{'completeSource':True,'uniqueQuestionNumbers':37,'duplicateQuestionNumbers':['8','9'],'sourcePages':None})
if __name__=='__main__':docx()
KISHBIO='''1|5|Obese people tend to have a … percentage of body water than thin people, and females a … percentage than males.|Lower/higher|Higher/higher|Lower/lower|Higher/lower|C
2|5|All are major buffers regulating pH except:|Phosphate|Sulfuric acid|Bicarbonate|Hemoglobin|B
3|5|Molecules soluble in nonpolar solvents are:|Amphipathic|Hydrophilic|Hypotonic|Hydrophobic|D
4|5|What is the pH of a solution with [OH−] = 1 × 10−4 M?|4|10|6|8|B
5|5|All are functions of proteins except:|Antibodies|Catalysts|Insulation|Transporters|C
6|5|Which pairs contain individually strong chemical bonds?|Ionic/hydrophobic|Hydrophobic/covalent|Ionic/hydrogen|Disulfide/ionic|D
7|5|According to pK, which acid is strongest?|Acid 1: pK = −10.3|Acid 2: pK = −8.7|Acid 3: pK = −6.5|Acid 4: pK = −9.2|A
8|6|Which of the following is a monomer?|Protein|Vitamin|Nucleic acid|Polysaccharide|?
9|6|All statements about galactose are true except:|It is used for milk biosynthesis in mammary glands|It is a constituent of glycolipids|It is a ketoheptose|Galactose accumulation can cause cataracts|C
10|6|Choose an aldopentose:|Glyceraldehyde|Dihydroxyacetone|Erythrose|Ribose|D
11|6|Which monosaccharide is the precursor of glycogen synthesis in animals?|Fructose|Glucose|Ribose|Mannose|B
12|6|Which are enantiomers?|D-Galactose and L-glucose|D-Galactose and L-glucose|D-Mannose and L-mannose|α-Mannose and β-mannose|C
13|6|Which statement about polysaccharides is true?|Heteropolysaccharides contain one type of monosaccharide|Glycogen is a homopolysaccharide|All polysaccharides are linear|Chondroitin sulfate contains sugar alcohol|B
14|6|Which carbohydrate can determine glomerular filtration rate?|Inulin|Amylopectin|Hyaluronic acid|Amylose|A
15|7|Which biomolecule can control calcification in bone?|Hyaluronic acid|Keratan sulfate|Chondroitin sulfate|Dermatan sulfate|C
16|7|Maltose is a disaccharide of:|Fructose and lactose|Glucose and glucose|Glucose and galactose|Glucose and lactose|B
17|7|The slope of a Lineweaver–Burk plot is:|Vmax/Km|Km/Vmax|Vmax/[S]|[S]/Km|B
18|7|Which enzyme is a hydrolase?|Phosphatase|Dehydrogenase|Mutase|Phosphorylase|A
19|7|Which is the definition of enzyme activity?|Amount catalyzing one micromole substrate per second|Substrate molecules converted per enzyme molecule per second|Substrate molecules converted per enzyme molecule per minute|Amount catalyzing one micromole substrate per minute|D
20|7|Which reaction is catalyzed by a lyase?|Breaking bonds|Intramolecular rearrangement|Formation of bonds|Transfer of a group between molecules|A
21|8|All are examples of competitive inhibition except:|Methotrexate and dihydrofolate reductase|Atorvastatin and HMG-CoA reductase|Amoxicillin and transpeptidase|Malonate and succinate dehydrogenase|C
22|8|Which statement about allosteric enzymes is not true?|Activators increase enzyme activity|Inhibitors decrease activity after binding|They are generally multisubunit enzymes|They show hyperbolic dependence on substrate concentration|D
23|8|Reversible noncompetitive inhibitor binding outside the active site causes:|Increased Km; unchanged Vmax|Decreased Vmax; unchanged Km|Increased Vmax; unchanged Km|No change in Vmax or Km|B
24|8|An enzyme extract separates into two fractions in an electric field, each catalyzing the same reaction. The fractions are:|Coenzyme|Allosteric enzyme|Isoenzyme|Inducible enzyme|C
25|8|Which amino acid is not considered a site for phosphate attachment?|Serine|Threonine|Leucine|Tyrosine|C
26|8|Which amino acids contain hydroxyl groups?|Cysteine and methionine|Threonine and cysteine|Serine and methionine|Serine and threonine|D
27|8|Which characteristic applies to glycine?|Optically inactive|Hydrophilic, basic and charged|Hydrophilic, acidic and charged|Proton donor|A
28|9|Protein absorbance at 280 nm is due to:|Aliphatic amino acids|Aromatic amino acids|Acidic amino acids|Basic amino acids|B
29|9|All statements about myoglobin are correct except:|It consists of one polypeptide chain|Its secondary structure is rich in β-sheet|It is compact and spherical|It is present in skeletal muscle|B
30|9|Which amino acids are most common in collagen?|Tryptophan and proline|Glycine and lysine|Threonine and proline|Proline and glycine|D
31|9|Which increases P50 in hemoglobin's oxygen-dissociation curve?|Decreased CO2 pressure|Increased pH|Decreased temperature|Increased 2,3-BPG|D
32|9|Which protein is defective in Ehlers–Danlos syndrome?|Myoglobin|Elastase|Collagen|Hemoglobin|C
33|9|Which is correctly matched?|NADH–vitamin B2|FADH2–vitamin B3|PLP–vitamin B6|TPP–vitamin C|C
34|9|Thiamine deficiency causes all except:|Cheilosis|Ataxia|Nystagmus|Ophthalmoplegia|A
35|10|Which disease is caused by niacin deficiency?|Scurvy|Rickets|Pellagra|Pernicious anemia|C
36|10|Which is effective in premenstrual syndrome and diabetes?|Vitamin B12|Vitamin B9|Vitamin B6|Vitamin B3|?
37|10|Which vitamin provides a coenzyme for γ-carboxylation?|Vitamin A|Vitamin K|Vitamin C|Vitamin B7|B
38|10|Which deficiency causes megaloblastic anemia?|Pantothenic acid|Niacin|Folic acid|Retinol|C
39|10|The most biologically active form of vitamin K is:|Menadione|Menaquinone|Phylloquinone|Phytonadione|B
40|10|Which vitamin is a major lipid-soluble antioxidant in cell membranes?|Vitamin A|Vitamin D|Vitamin E|Vitamin K|C
41|11|Which is common to all phospholipids?|Glycerol backbone|Phosphate group|Two fatty-acid tails|Sphingosine backbone|B
42|11|Which lipid is a precursor of steroid hormones?|Sphingomyelin|Phosphatidylserine|Cholesterol|Triacylglycerol|C
43|11|The primary function of HDL is:|Transporting cholesterol to peripheral tissues|Transporting triglycerides to liver|Transporting cholesterol from peripheral tissues to liver|Storing excess cholesterol in adipose tissue|C
44|11|Besides membrane structure, cholesterol is involved in:|Energy storage|Signal transduction|Nerve impulse transmission|Regulation of membrane fluidity|?
45|11|Which fatty acid must be supplied in the diet?|Palmitic acid|Lauric acid|Linolenic acid|Palmitoleic acid|C
46|11|Cephalin consists of:|Glycerol, fatty acids, phosphoric acid and choline|Glycerol, fatty acids, phosphoric acid and ethanolamine|Sphingosine, two fatty acids, phosphoric acid and inositol|Sphingosine, fatty acids and serine|B
47|12|Glycosphingolipids combine:|Ceramide with one or more sugar residues|Glycerol with galactose|Sphingosine with galactose|Sphingosine with phosphoric acid|A
48|12|All have 18 carbon atoms except:|Linoleic acid|Linolenic acid|Arachidonic acid|Stearic acid|C'''
KISHHISTO='''1|3|In which case is the protein related to the relevant organelle?|Proteasome–ubiquitin|Peroxisome–porin|RER–clathrin|Mitochondria–catalase|A
2|3|During RER protein synthesis, which is not observed as part of the organelle's structure?|Ribosome receptor|Translocator complex|Signal-recognition-particle receptor|Signal peptide|D
3|3|Microfilaments are composed of … and play a role in …|Vimentin; endocytosis|Tubulin; cilia formation|Actin; mitotic division|Desmin; mitochondrial function|C
4|3|A pale, central, large, euchromatic nucleus shows:|The cell is active in protein synthesis|The cell starts apoptosis|The cell is differentiated|The cell is dead and necrotic|A
5|3|What are the outward-projecting surface oligosaccharide chains and their function?|Adherent glycoproteins; receptor|Glycocalyx; cell identification|Basal layer; active transport|Glycosaminoglycans; adhesion|B
6|3|In the Golgi organelle:|Cisternae are tubular|Secretory vesicles are on the cis face|Cis cisternae are adjacent to the RER|Golgi is near the nucleus|C
7|3|Which characteristic applies to mitochondria?|Outer membrane contains thermogenin|Inner membrane has porin particles|Cristae of the inner membrane enclose the matrix|Inner membrane contains ATPase|D
8|4|Which characteristic applies to a nucleosome?|It has a core of four histones|It has single-stranded DNA|It does not contribute to heterochromatin formation|Histone H1 is outside the nucleosome|D
9|4|In receptor-mediated endocytosis:|Clathrin is present in the membrane structure|Ligand binding activates ion channels|Clathrin forms the coated pit at a faster rate|Coated secretory vesicles have clathrin|?'''
def kish():
 import copy
 cell=json.load(open(OUT/'cell-jan2024.json'))['questions'];qs=[]
 for i,n in enumerate(range(74,88),1):
  q=copy.deepcopy(next(q for q in cell if q['number']==str(n)));q.update(number=str(i),page=1 if i<=6 else 2,section='Physiology')
  if i==1:q.update(prompt=q['prompt'].replace('ion X','ion X+'),correctOptionId='A',answerBasis='editorial',explanation='For the monovalent positive ion, the Nernst potential is about +61 log10(300/20) = +71 mV.')
  qs.append(q)
 for section,subject,rows in [('Histology','histology',KISHHISTO),('Biochemistry','biochemistry',KISHBIO)]:
  for line in rows.splitlines():
   n,p,pr,*rest=line.split('|');k=rest.pop();q=question(n,int(p),pr,rest,None if k=='?' else k,subject=subject);q['section']=section
   if section=='Histology' and n=='6':q['acceptedOptionIds']=['C','D'];q['explanation']='Both adjacency of the cis Golgi to the RER and a juxtanuclear location are correct.'
   if section=='Histology' and n=='8':q['explanation']='Linker histone H1 lies outside the nucleosome core; the core contains eight histone molecules (two each of four types).'
   qs.append(q)
 save('bio-kish-theory',qs,'71 source-present questions: physiology Q1–14, histology Q1–9 and biochemistry Q1–48. Numbering restarts in each section; sourceOrdinal is unique. The compilation is not evidence of one complete sitting. Ambiguous or invalid choices are left ungraded. Highlighted student answers are not treated as official.',{'completeSource':True,'completeSitting':'unconfirmed','sections':{'physiology':14,'histology':9,'biochemistry':48}})
if __name__=='__main__':kish()
