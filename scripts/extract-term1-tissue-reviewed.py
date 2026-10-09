"""Human-reviewed transcription repairs and source figure crops for Tissue imports."""
import json,copy,re
from pathlib import Path
import pymupdf as fitz
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'data/term1-telegram/questions';FIG=ROOT/'public/study/term1-telegram/figures'
def load(pid):
 d=json.load(open(OUT/f'{pid}.json'))
 for q in d['questions']:q.pop('media',None)
 return d
def save(d):
 qs=d['questions'];d['coverage'].update(questionOccurrences=len(qs),transcribedQuestions=len(qs),unresolvedAnswers=sum(q['correctOptionId'] is None for q in qs))
 (OUT/f"{d['paperId']}.json").write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def patch(d,n,prompt=None,options=None):
 q=next(q for q in d['questions'] if q['number']==n)
 if prompt is not None:q['prompt']=prompt
 if options is not None:q['options']=[{'id':chr(65+i),'text':x} for i,x in enumerate(options.split('|'))]
 return q
def fig(d,n,page,rect):
 pid=d['paperId'];doc=fitz.open(ROOT/f'public/study/term1-telegram/{pid}.pdf');p=doc[page-1];r=fitz.Rect(rect[0]*p.rect.width,rect[1]*p.rect.height,rect[2]*p.rect.width,rect[3]*p.rect.height);name=f'{pid}-q{n:03d}-figure.jpg';p.get_pixmap(matrix=fitz.Matrix(2,2),clip=r).save(FIG/name)
 next(q for q in d['questions'] if q['number']==n).setdefault('media',[]).append({'src':f'/study/term1-telegram/figures/{name}','alt':f'Original figure for question {n}, source page {page}.'})
def keyed(q,key,basis):
 q['correctOptionId']=key;q['answerBasis']='source-reviewed';q['explanation']=basis;q['sourceAnswer']={'kind':'source-key','optionId':key,'note':basis}
# January 2023: wording reviewed against both original photo and annotated copy.
d=load('tissue-2023-annotated')
patch(d,5,'What is the following is INCORRECT?','Striation was seen in longitudinal section of cardiac muscle and skeletal muscle|Cardiac muscle and smooth muscle nucleus located in center part|Cardiac muscle and skeletal muscle have sarcomere|Striation was seen in transverse section of cardiac muscle and skeletal muscle')
patch(d,22,'In which Type of the Cartilage Tissue is observed Collagen Fiber II?')
patch(d,24,options='Osteoblast - H+|Osteocyte - Ca2+|Mesenchymal - H+|Fibroblast - Ca2+')
patch(d,28,options='Synovial Cavity|Synovial Fluid|Nothing|Synovial Membrane')
patch(d,33,'Red blood cell is ........ because it has ........ in the wall.')
patch(d,50,'The primitive streak first appears at the beginning of the ........ week.')
patch(d,53,'Lanugo covers the body, some head hairs show, and fetal movements are felt by the mother when the fetus is about how many months old?','5|6|7|8')
patch(d,57,options='AB incompatibility|Rh+ baby born to Rh- mother|In utero Rubella infection|In utero HIV infection')
patch(d,64,'In a skeletal muscle, ........ is/are considered to be a functional unit.')
patch(d,65,options='Actin|Titin|Nebulin|Distrophin')
patch(d,67,options='Myosin filaments|Ca ions|Tropomyosin-troponin complex|Mg ions')
patch(d,75,'In neuro-muscular junction, calcium entry into the nerve ending following an action potential leads to ........','binding to troponin C and making contraction|phosphorylation of synapsin and transmitter release|opening of voltage gated Na channels|hyperpolarization')
# Posted key is preserved as source evidence; four entries conflict with the annotated copy.
keys='1 3 2 4 4 3 2 1 1 2 4 3 1 3 4 2 4 2 3 1 4 1 1 1 3 2 2 4 2 1 2 3 3 2 4 1 4 1 3 4 2 2 1 3 3 1 4 4 4 3 2 4 1 2 3 4 2 4 1 3 2 3 3 3 2 2 2 2 4 1 1 2 3 4 2 4 4 3 1 2'.split()
for q,k in zip(d['questions'],keys):
 keyed(q,chr(64+int(k)),'Transcribed from the posted January 2023 answer sheet (original PDF page 20). This is a source key, not an independently re-solved editorial answer.')
 # The annotation's clearly different highlighted choices are retained as unresolved conflicts.
 if q['number'] in [24,25,26]:
  q['correctOptionId']=None;q['answerBasis']='unresolved';q['explanation']='The posted answer sheet and annotated copy conflict for this question; it is ungraded pending review.'
fig(d,66,15,(.49,.06,.88,.163));fig(d,80,18,(.47,.68,.94,.845));save(d)
j=copy.deepcopy(d);j['paperId']='tissue-jan2023';j['notes']=['All 80 questions transcribed using the matching original photograph and annotated copy. Source question wording and option order match. Three conflicting answers remain ungraded.'];j['coverage']['sourcePages']=20
for q in j['questions']:
 q['page']+=1;q.pop('media',None)
fig(j,66,16,(.54,.147,.835,.215));fig(j,80,19,(.465,.548,.91,.64));save(j)
# January 2025 repairs: option letters in several photos were separate OCR fragments.
d=load('tissue-jan2025')
for q in d['questions']:
 if q['number']==17 and q['page']==12:q['number']=77
q=copy.deepcopy(d['questions'][0]);q.update(number=32,sourceOrdinal=32,page=5,prompt='In microscopic structure which part of the Diarthrosis joint is observed Hyalin cartilage tissue without perichondrium tissue?',options=[{'id':a,'text':t} for a,t in zip('ABCD',['Articular cartilage Tissues','End plate bone','Lamina propria synovial membrane','Nothing'])]);d['questions']=[x for x in d['questions'] if x['number']!=32];d['questions'].append(q);d['questions'].sort(key=lambda q:q['number'])
patch(d,11,'An exocrine gland that loses cell bodies during secretion, is further classified as a ........ gland that occurred in the ........')
patch(d,13,options='Oligodendrocyte|Astrocyte|Satellite cell|Schwann cell')
patch(d,22,'Which of muscle protein has three subunits (TnT, TnC, TnI)?')
patch(d,23,'In which muscle type(s) nucleus located in center part?')
patch(d,26,options='Stratum basale|Stratum spinosum|Stratum granulosum|Stratum corneum')
patch(d,40,'The following statements regarding the mesoderm differentiation are true:')
patch(d,43,'The events of the first week of the human embryonic development are as follows:')
patch(d,44,options='human chorionic gonadotropin (hCG)|human chorionic somatomammotropin (hCS)|relaxin|estrogens and progesterone')
patch(d,49,'The week of “two” is characterized by formation of the following structures except:')
patch(d,55,'Regarding Oogenesis all statements are true, Except:','begins in female before birth & completed after puberty|no primary oocyte form after birth in female|oocyte has the abundance of cytoplasm|usually two ovum mature every month')
patch(d,56,'Turner syndrome is due to:','Monosomy of the X chromosome|Trisomy of the 18 chromosomes|Monosomy Y chromosome|Trisomy of the 13 chromosomes')
patch(d,59,'Organogenesis is the period between','The 3rd and 7th weeks|The 4th and 8th weeks|The 2nd and 5th weeks|The 2nd and 8th weeks')
patch(d,62,"When a pregnant woman starts to feel their baby's movement in their uterus?",'Third month|Fifth month|Sixth month|Seventh month')
patch(d,64,'A single contraction of skeletal muscle is most likely to be terminated by which of the following actions?','Closure of the postsynaptic acetylcholine receptors|Removal of acetylcholine from the neuromuscular junction|Removal of sarcoplasmic Ca|Return of the dihydropyridine receptor to its resting conformation')
patch(d,65,'Smooth muscle contraction is terminated by which of the following?','Dephosphorylation of myosin kinase|Dephosphorylation of myosin light chain|Efflux of Ca ions across the plasma membrane|Inhibition of myosin phosphatase')
patch(d,66,'Which of the following best describes an attribute of visceral smooth muscle not shared by skeletal muscle?','Contraction is ATP dependent|Contracts in response to stretch|Does not contain actin filaments|High rate of cross-bridge cycling')
patch(d,67,options='G-actin|Myosin light chain|Tropomyosin|Troponin C')
patch(d,68,'The delayed onset and prolonged duration of smooth muscle contraction compared with skeletal muscle, are all consequences of which of the following?','Greater amount of myosin filaments present in smooth muscle|Higher energy requirement of smooth muscle|Physical arrangement of actin and myosin filaments|Slower cycling rate of the smooth muscle myosin cross-bridges')
patch(d,69,options='Thick filaments|Thin filaments|Z disks of the sarcomere|Sarcomere')
patch(d,70,'Which of the following best describes a physiological difference between the contraction of multi-unit smooth muscle compared with the contraction of skeletal muscle?','Ca independent|Does not require an action potential|Requires more energy|Shorter in duration')
patch(d,71,options='A|B|C|D');patch(d,74,options='A|B|C|D')
patch(d,72,options='The overall length of the muscle does not change.|In this contraction, tension remains constant.|load is greater than the force of the muscle contraction|it shows staircase effect')
patch(d,75,'Caveolae is ........')
patch(d,76,'Which of the following best describes the correct temporal order of events for skeletal muscle?','Muscle action potential, Muscle contraction, Nerve action potential|Muscle action potential, Nerve action potential, Muscle contraction|Muscle contraction, Muscle action potential, Nerve action potential|Nerve action potential, Muscle action potential, Muscle contraction')
patch(d,78,'During a contraction cycle, what does ATP bind to?')
patch(d,80,'In this type of muscle, the source of Ca ions needed for contraction is just from sarcoplasmic reticulum?','Biceps muscle|Uterus|Iris muscles of the eye|Blood vessels')
for q in d['questions']:q['sourceOrdinal']=q['number'];q['subject']='histology' if q['number']<=36 else 'embryology' if q['number']<=63 else 'physiology'
for n,p,r in [(71,11,(.54,.79,.91,.95)),(72,12,(.55,.14,.89,.32)),(74,12,(.56,.46,.92,.63)),(77,12,(.575,.86,.87,.98)),(79,13,(.59,.34,.995,.5))]:fig(d,n,p,r)
save(d)
# September 2019 paper.
d=load('tissue-sep2019');d['questions']=[q for q in d['questions'] if q['number']<=53]
patch(d,8,options='Phosphorylation of myosin light chain kinase|Activation of myosin phosphatase|Phosphorylation of synapsin|Muscle contraction')
patch(d,23,options='Dermis of skin|Tendon|Adipose tissue|Areolar tissue');patch(d,24,'Red blood cell is ........ because it has ........ in the wall.')
patch(d,28,options='oligohydramnios|Bochdalek hernia|anencephaly|Meningocele');patch(d,29,options='differentiation of syncytiotrophoblast|hatching from the zona pellucida|fragmentation of the primary yolk sac|development of amnioblast')
patch(d,32,options='it is fed by fetal arteries that travel along the secondary yolk sac|it is derived primarily from amnioblast and allantois|it is comprised of villous chorion and decidua basalis|it begins to secrete chorionic gonadotropin at the end of the first month')
patch(d,33,options='1 week|2 weeks|about 4 weeks|about 12 weeks');patch(d,35,options='A|B|C|D')
patch(d,37,'The placenta barrier that exists throughout most of pregnancy is composed of ........','endothelium and connective tissue|Endothelium and cytotrophoblast|Connective tissue and cytotrophoblast|syncytiotrophoblast and endothelium')
patch(d,50,options='Rubella|Cytomegalovirus|Herpes simplex|Toxoplasmosis')
for q in d['questions']:
 q['sourceOrdinal']=q['number'];q['subject']='physiology' if q['number']<=13 else 'histology' if q['number']<=26 else 'embryology'
 for o in q['options']:o['text']=re.sub(r'\b6[1Іl] ?Page\b','',o['text']).strip()
for n in [33,34,35,36]:fig(d,n,7,(.075,.424,.54,.625))
fig(d,13,4,(.61,.169,.89,.28));save(d)
# Clean OCR-only artifacts in September 2021 source.
d=load('tissue-sep2021');patch(d,1,'In the opposite figure, which of the letters points to “troponin C”?');patch(d,11,'Which of the following shows “Titin”?','D|B|C|A')
patch(d,19,'Which of the following develops from the multinucleated syncytium, the syncytiotrophoblast and serves as the beginnings of gas exchange between mother and embryo?')
patch(d,77,options='Mesenchymal - H+|Osteoblast - H+|Osteocyte - Ca2+|Fibroblast - Ca2+')
for q in d['questions']:q['subject']='physiology' if q['number']<=17 else 'embryology' if q['number']<=44 else 'histology'
fig(d,1,1,(.085,.075,.49,.199));fig(d,11,3,(.08,.23,.555,.361));fig(d,14,4,(.084,.076,.361,.184));save(d)
# Tehran 2026: resolve table/OCR artifacts against photographed rows, never infer answers.
d=load('tissue-tehran2026')
patch(d,1,options="Biceps muscle|Uterus|Iris muscle of the eye|Blood vessels' walls")
patch(d,3,'Which of the following best describes the significant difference between skeletal muscle and large nerve fibers?','Generation of action potential|Existence of voltage gated sodium channels|Amount of resting membrane potential|Velocity of conduction')['sourceContinuationPages']=[3]
patch(d,4,'In the opposite figure, which of the following refers to “Z discs”?','A|B|C|D')
patch(d,5,options='Myosin heads|ATP|Ca2+|Tropomyosin-troponin complex')
patch(d,7,'Through ........, action potentials spread to the interior of skeletal muscle fibers.','transverse tubules|terminal cisternae|longitudinal tubules|endoplasmic reticulum')
patch(d,8,'Which of the following represents voltage gated calcium channels?','A|B|C|D')
patch(d,11,'What state is shown in the opposite figure?')
patch(d,12,'Which phenomenon is shown in this figure?','Isotonic contraction|Tetanus|Staircase effect|Isometric contraction')
patch(d,13,'Where are dihydropyridine receptors found in?','In the membrane of sarcoplasmic reticulum in skeletal muscle fibers|In the membrane of T tubules in skeletal muscle fibers|In the synapse between skeletal muscle and nerve fibers|In multiple adherent points of smooth muscle fibers')['sourceContinuationPages']=[6]
patch(d,16,"Which of the following represents one of the electrical synapses' properties?",'Bidirectional transmission|Presynaptic vesicles|Synaptic delay|Chemical transmitter')['sourceContinuationPages']=[7]
patch(d,17,'An exocrine gland that loses cell bodies during secretion, is further classified as a ........ gland that occurred in the ........')
patch(d,21,options='TnT|TnM|TnC|TnI')
patch(d,23,'Nissl bodies in the perikaryon of neurons are composed of:','Ribosomes and Lysosomes|Ribosomes and RER|Golgi and RER|SER and Lysosomes')
patch(d,24,options='Ependymal cell|Schwann cell|Microglia|Oligodendrocyte')
patch(d,27,options='Astrocytes-perineurium|Oligodendrocytes-Schwann cells|Satellite cells-Ganglionic cells|Ependymal cells-endoneurium')
patch(d,29,options='2 SER+1TT|1 SER+2TT|1 SER+1TT|2 SER+2TT')
patch(d,37,'The following is true about platelets except','Their number is about 4500 to 11000|Contain actin and myosin|The life span is about 10 days.|Contain hyalomers')
patch(d,42,'The main component of loose connective tissue is:','cells|Ground substance|fibers|The content of all components is equal.')
patch(d,44,'Internal elastic lamina is more prominent in:','Sup Vena Cava|Arteriole|Muscular Artery|Medium sized vein')
patch(d,49,'Vasovasorum usually seen in:')
patch(d,51,'Cells of the small intestine glands include the following except','Kupffer cell|Goblet cells|Paneth cells|M cells')
patch(d,52,'IF produced by:')
patch(d,56,options='A Irregular Haversian system|Irregular Haversian system|Inner Layer of Endosteum|Extra layer of Endosteum')
patch(d,64,'The secondary oocyte is arrested at which stage','Prophase I|Metaphase I|Metaphase II|Anaphase II')
patch(d,65,'Spermatogenesis, from spermatogonium to mature spermatozoon, takes approximately','24 hours|1 week|64–74 days|6 months')
patch(d,67,'Which trophoblastic layer actively invades the endometrium?','Cytotrophoblast|Syncytiotrophoblast|Chorionic plate|Decidua basalis')
patch(d,71,'The lateral plate mesoderm splits into somatic and splanchnic layers because of formation of the:','Chorionic cavity|Intraembryonic coelom|Neural groove|Primitive streak')
patch(d,77,'The umbilical cord normally contains','One artery and one vein|Two veins and one artery|Two arteries and one vein|Three arteries')
patch(d,82,'The definitive placenta is formed by the fusion of')
for n,p,r in [(4,2,(.59,.175,.875,.254)),(8,3,(.64,.47,.87,.545)),(11,5,(.53,.16,.835,.238)),(12,5,(.568,.397,.875,.47))]:fig(d,n,p,r)
for q in d['questions']:
 for o in q['options']:o['text']=o['text'].replace('A TPase','ATPase').replace('figere','figure').replace('musele','muscle').replace('Elflux','Efflux').replace('Tropenin','Troponin').replace('Ttubules','T tubules')
 q['subject']='physiology' if q['number']<=16 else 'histology' if q['number']<=63 else 'embryology'
save(d)
