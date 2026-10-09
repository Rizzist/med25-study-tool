"""Reviewed OCR transcriptions and editorial answer adjudication. Run after native extractor."""
import importlib.util,json
from pathlib import Path
spec=importlib.util.spec_from_file_location('base',Path(__file__).with_name('extract-term1-biochem-practical.py'));b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
q,write=b.q,b.write

def manual(pid,rows,notes):
 qs=[]
 for row in rows.strip().split('\n'):
  n,p,k,prompt,*opts=row.split('|');qs.append(q(n,int(p),prompt,opts,None if k=='-' else k))
 return write(pid,qs,notes)
manual('bio-practical-jan2024','''1|2|B|In the presence of concentrated sulfuric acid, carbohydrates lose .... and form ....?|CO2, diazine|H2O, furfural|H2O, diazine|O2, furfural
2|2|A|The reagent used for distinguishing a reducing monosaccharide from a reducing disaccharide is ...|Barfoed's reagent|Fehling's reagent|Selwinoff's reagent|Benedict's reagent
3|2|C|Which of the following test can be used as a semi quantitative test for sugars?|Molisch test|Seliwanoff test|Benedict test|Barfoed test
4|2|D|If an amino acid solution has a positive result for the Hopkins-cole's test, so:|It has a guanidino group|It has a pyrrol ring|It has an imidazole group|It has an indole ring
5|2|D|If we add trichloro acetic acid to an unknown solution, we will observe a precipitation so:|The solution is monosaccharide|The solution is cholesterol|The solution is carbohydrate|The solution is protein
6|2|C|Which of the following tests are used for detection of histidine?|Xanthoproteic acid test|Biuret test|Pauly's diazo test|Sakaguchi test
7|3|B|Which part of spectrophotometer machine convert radiant energy (photons) into an electrical signal?|Light source|Detector|Monochromator|Cuvettes
8|3|D|In all of the following conditions cause hyperproteinemia, except:|Persistent vomiting|Chronic inflammation|Viral infections|Hepatic failure
9|3|C|Which of the following is not in the Beer's Law equation?|Molar absorptivity|Cell path length|Light wavelength|Concentration
10|3|A|The product of urease reaction is .... and for detection of this product we use ....|NH3, phenol red|H2O, phenolphthalein|H2O, phenol red|CO2, phenolphthalein
11|3|C|Which of the following is correct about “the effect of temperature on reaction rate” experiment:|Renin activity is constant at the different temperature.|Renin has a maximum activity at 80° C.|Renin has a maximum activity at 37° C.|At the lower temperatures, the rate of reaction will be increased.
12|3|A|The optimum pH for the action of pepsin is .... and salivary amylase is ....|acidic-neutral|basic-acidic|neutral-basic|basic-neutral
13|3|B|In chromatography, which of the following can the mobile phase be made of?|Solid or liquid|Liquid or gas|Gas only|Liquid only
14|4|B|Chromatography is a physical method that is used to separate and analyse|Simple mixtures|Complex mixtures|Viscous mixtures|Metals
15|4|B|What happens during the 'elution from the column' phase in chromatography?|Components with greatest affinity elute first|Components with least affinity elute first|Components elute in a random manner|Components elute according to their concentration in the mixture
16|4|A|In gel permeation chromatography separation is based on ....|Size of molecule|Solubility|Ion exchanging|Affinity
17|4|A|What is the color of Phenolphthalein in basic solutions:|Pink|Blue|Colorless|Yellow
18|4|A|In a titration experiment how do we know the end point has reached?|Using indicators|With an acid|With a base|Measuring pH
19|5|A|What is the color of Phenolphthalein in acidic solutions?|Colorless|Pink|Blue|Yellow
20|5|A|All the following is true regarding the basic principle of spectrophotometer except?|is one of the most useful qualitative analysis|It depends on how much a chemical substance absorbs light|It depends on how much a substance transmits light|Its done over a certain range of wavelength
21|5|A|Amax is defined as:|coloured compound absorbs maximum light at a particular wavelength|relationship between absorbance and concentration|explains the transmittance of light|it is useful for colorless compounds
22|5|A|The mobile phase in chromatography is:|Liqid-gas|Solid-gas|Liquid-solid|Solid-solid
23|5|A|Flame Photometry is for determining:|Concentration of metal ions|Concentration of colored solutions|Concentration of liquids|Concentration of organic solutions
24|6|A|Which of the following is used in inorganic chemical analysis?|Flame Photometry|Chromatography|Spetrophotometry|Colorimetry
25|6|A|A positive Benedict's test is not given by|Sucrose|Lactose|Maltose|Glucose''',['All 25 cover-declared questions transcribed. Question 13 continues onto source page 4. Handwritten choices are not treated as an official key; answers are editorial. Blank answer grid on page 7 contains no additional questions.'])
manual('bio-practical-dds2023','''1|2|B|In the presence of concentrated sulfuric acid, carbohydrates lose .... and form ....?|CO2, diazine|H2O, furfural|H2O, diazine|O2, furfural
2|2|C|Which of the following test can be used as a semi quantitative test for sugars?|Molisch test|Seliwanoff test|Benedict test|Barfoed test
3|2|D|Which of the following sugars has a positive result for Barfoed's test?|Starch, glucose, fructose|Lactose, galactose, fructose|Maltose, sucrose, glucose|xylose, arabinose, fructose
4|2|D|Which part of spectrophotometer machine convert radiant energy (photons) into an electrical signal?|Light source|Monochromator|Cuvettes|Detector
5|2|C|Beer Lambert's law gives the relation between which of the following?|Reflected radiation and concentration|Scattered radiation and concentration|Energy absorption and concentration|Energy absorption and reflected radiation
6|2|B|In chromatography, which of the following can be used as the mobile phase?|Solid or liquid|Liquid or gas|Gas only|Liquid only
7|2|C|In an anion exchange chromatography the stationary phase has .... charge and in cation exchange chromatography the stationary phase has .... charge.|positive-neutral|negative-positive|positive-negative|neutral-negative
8|2|D|In size exclusion chromatography, the stationary phase is ....|silica gel|adsorbents|cation exchange resin|porous matrix
9|3|D|IR spectrophotometer uses light over the|185|400|500|700
10|3|A|Flame Photometry is for determining:|Concentration of metal ions|Concentration of colored solutions|Concentration of liquids|Concentration of organic solutions
11|3|B|Which of the following is used in inorganic chemical analysis?|Chromatography|Flame Photometry|Spetrophotometry|colorimetry
12|3|A|In Mohr pipetes:|The graduation on these end before the tip|The graduation marks continue to the tip|Has a single graduation to deliver specific volume|Are disposable
13|3|B|Watch Glass is used to:|crush solids into powders|dry and weigh solid compounds|dissolve the solids|heat and evaporate liquids
14|3|A|Mortar and Pestle are used to:|crush solids into powders|dry and weigh solid compounds|dissolve the solids|heat and evaporate liquids
15|3|B|Which of the following is used to dispensing solid chemicals?|Forceps|Spatulas|Glass Rods|Mortar
16|3|A|In a titration experiment how do we know the end point has reached?|By using indicators|With an acid|With a base|Measuring pH
17|3|C|In DNA extraction which of the following is used for breaking the cell walls?|acid|base|soap|ammonium''',['All 17 cover-declared questions transcribed. Editorial keys; source contains no authoritative answer key. Question 9 omits wavelength units; the intended scale is nanometres. Question 17 says cell walls; detergent disrupts lipid membranes.'])
manual('bio-kish-practical','''1|1|D|All the following is true regarding Electrophoresis Except:|It's a separation technique|based on the differential migration|uses an electric field|uses uncharged molecules
2|1|D|All the following factors affect the rate of Ion mobility in electrophoresis except:|The net charge of the molecule|Size and shape of the molecule|Temperature and pH of the buffer|The mobile phase used
3|1|D|Electrophoresis is an analytical method which can not be used for separation of:|amino acids|peptides|nucleic acids|lipids
4|1|A|In DNA extraction why soap solution is used?|To break the cell membrane|To find the amount of DNA|To make the saliva watery|To decrease the heat
5|2|A|In DNA extraction where does the DNA in saliva come from?|cells in the cheeks|lung secretions|nose secretions|sputum
6|2|C|In a titration experiment how do we know the end point has reached?|With an acid|With a base|Using indicators|Measuring pH
7|2|A|In titration when do we add the indicators?|In the beginning of titration|In the end of titration|Sometimes it is added|In the middle of titration
8|2|A|Flame Photometry is for determining:|Concentration of metal ions|Concentration of colored solutions|Concentration of liquids|Concentration of organic solutions
9|3|B|Which of the following is used in inorganic chemical analysis?|Chromatography|Flame Photometry|Spectrophotometry|Colorimetry
10|3|A|What of the following is the Qualitative test for protein detection in urine?|Biuret|Hopkin's Cole|Urease|Ninhydrin
11|3|A|Which of the following is the Qualitative test for sugar detection in urine?|Benedict's test|Rothera's test|Sulphosalisylic Test|Sodium Nitroprusside
12|4|C|Which glassware is used for preparing accurate volume of a solution?|Beaker|Conical flask|Volumetric flask|Cylinder
13|4|-|What is the difference between serum and plasma?|Plasma doesn't contain cells|Serum contains cells|Plasma contains coagulant|Serum doesn't contain clotting factors
14|4|A|Lipemic serum appears|Milky|Pink|Red|Yellow
15|4|C|HbA1c levels reflect|average blood glucose concentrations during the previous 2 to 3 weeks|average blood glucose concentrations during the previous 4 to 6 weeks|average blood glucose concentrations during the previous 8 to 12 weeks|average blood glucose concentrations during the previous 16 to 24 weeks
16|5|-|What is the amount of HbA1c in a normal person?|Less than 5.6%|Less than 6.6%|Less than 7.6%|Less than 8.6%
17|5|B|What is the normal range for Specific gravity of urine?|1.011-1.012 gm/ml of urine|1.003-1.035 gm/ml of urine|1.015-1.017 gm/ml of urine|1.020-1.023 gm/ml of urine
18|5|-|Which of the following is used for separation of DNA particles?|Agarose-gel chromatography|Ion-exchange chromatography|Paper chromatography|gas-liquid chromatography
19|6|A|Which of the following flasks hold solids or liquids that may release gases?|Erlenmeyer|Beaker|Round bottom flask|Volumetric Flask
20|6|A|Stir rods are long cylinders made of:|Glass|Metal|Steel|Silver''',['All 20 questions from six source photos are transcribed. Answer highlighting does not appear in the question text. Defective or ambiguous items are retained ungraded.'])
manual('cell-practical-online','''30|1|C|Which of the following confirmed values meets the diagnostic threshold for diabetes?|fasting blood glucose: 140 mg/dl|2 hour post prandial glucose ≥ 126 mg/dl|fasting blood glucose ≥ 126 mg/dl|random glucose > 160 mg/dl
31|2|-|What kind of method is used to measure hemoglobin A2?|Affinity ChChromatographyChromatography|Anion Exchange Choromatography|Size exclusion chromatography|Column adsorption chromatography
32|3|-|Establishing a quality control system includes all of the following except:|Controlling|Directing|Calibration|Planning
33|4|C|Which of the following is not the thyroid hormone-binding proteins in the plasma?|Transthyretin|Albumin|Transferrin|Thyroid binding globulin
28|5|A|For measurement of which of the following tests we don't need fasting?|HbA1c|LDL|FBS|TG
23|6|A|IR spectrophotometer uses light over the|700|400|185|500
1|7|B|Which of the following cannot be used to make the conjugate pad in immunochromatography assay:|Glass fiber|Agarose|Cellulose|Polyester
2|8|-|In HDL Measurement, which of the following enzymes is not used?|Cholesterol Esterase (CHE)|Lipoprotein Lipase (LPL)|Catalase|Cholesterol Oxidase (CHO)
3|9|-|The rate of LDL per HDL is very important to the diagnosis of Atherosclerosis diseases, the best value for LDL/HDL ratio is less than ....|2|4|5|3
4|10|C|In a titration experiment how do we know the end point has reached?|With a base|Measuring pH|Using indicators|With an acid
5|11|B|In DNA extraction why soap solution is used?|To find the amount of DNA|To break the cell membrane|To decrease the heat|To make the saliva watery
6|12|A|Which of the following is a set of regulatory standards for clinical and medical labs that were created to help to make sure labs maintain quality assurance?|Clinical lab improvement amendments (CLIA)|Procedure Manual|Standard operating procedures (SOPs)|Health Insurance Portability and Accountability Act (HIPPA)
7|13|A|Which of the following is correct about “the effect of temperature on reaction rate” experiment:|Renin has a maximum activity at 37° C.|Renin has a maximum activity at 80° C.|Renin activity is constant at the different temperature.|At the lower temperatures, the rate of reaction will be increased.
8|14|A|The product of urease reaction is .... and for detection of this product we use ....|NH3, phenol red|H2O, phenolphthalein|CO2, phenolphthalein|H2O, phenol red
10|15|D|What is the Qualitative test for protein detection?|Hopkin's Cole|Ninhydrin|Urease|Biuret
11|16|D|Which of the following is correct about valid and positive result for HIV rapid test:|No colored line in control line and no colored line in test line|No colored line in control line and colored line in test line|Colored line in control line and no colored line in test line|Colored line in control line and colored line in test line
12|17|C|If an amino acid solution has a positive result for the Hopkins-cole test, so it contains:|Hydroxyl|Imidazole|Indole|Sulfhydryl
13|18|D|Which of the following metal ion is regarded as a constituent metal ion for alkaline phosphatase:|Mg2+|Mn2+|Co2+|Zn2+
15|19|B|Which test is specific for detection of ketoses in a solution?|Benedict's Test|Seliwanoff's Test|Fehling's Test|Barfoed's test
16|20|A|In DNA extraction where does the DNA in saliva come from?|cells in the cheeks|lung secretions|nose secretions|sputum
17|21|A|Flame Photometry is for determining:|Concentration of metal ions|Concentration of liquids|Concentration of organic solutions|Concentration of colored solutions
18|22|A|In titration when do we add the indicators?|In the beginning of titration|In the end of titration|In the middle of titration|Sometimes it is added
19|23|B|If we add trichloro acetic acid to an unknown solution, we will observe a precipitation so:|The solution is cholesterol|The solution is protein|The solution is amino acid|The solution is carbohydrate
20|24|B|In size exclusion chromatography, the stationary phase is ....|adsorbents|porous matrix|cation exchange resin|silica gel
21|25|D|Which of the following samples is suitable for measuring LDL?|Whole Blood|Urine|Stool|Serum
22|26|D|In chromatography, which of the following can the mobile phase be made of?|Liquid only|Solid or liquid|Gas only|Liquid or gas
24|27|A|The phenomenon by which part of the analyte present in a sample appears to be present in the next or following samples in the same analytic process is known as ....|Carry over|Precision|Analytical sensitivity|Analytical specificity
25|28|-|All of the following methods are used for FBS measurement, Except:|Chemical method|Fluorometric method|Oxidoreduction method|Enzymatic method
26|29|-|Which of the following disorders would typically result in decrease of alkaline phosphatase level in plasma:|Rickets|Paget's disease|Bone cancer|Celiac disease
27|30|B|Which of the following is correct about ELISA?|In a sandwich immunoassay, unlabeled analyte in a sample competes with labelled analyte to bind an antibody.|The sandwich immunoassay is applicable to antigens with at least two antigenic sites at an appropriate distance.|In the sandwich immunoassay, the amount of optical density (OD) is indirectly proportional to the concentration of the analyte.|The dose-response curve will be inverse (descending curve) in noncompetitive immunoassays.
29|31|A|In the presence of concentrated sulfuric acid, carbohydrates lose .... and form ....?|H2O, furfural|H2O, diazine|CO2, diazine|O2, furfural''',['All 31 source screenshots transcribed in PDF page order, preserving printed question numbers. The online exam reports 33 questions but source questions 9 and 14 are absent. Student selections are not an official key and were not used for grading.'])

def load(pid):return json.loads((b.OUT/(pid+'.json')).read_text())
def save(d):return write(d['paperId'],d['questions'],d['notes'])
def setkey(x,k,ex=None):
 x.update(correctOptionId=k,answerBasis='editorial' if k else 'unresolved',explanation=ex or ('Editorial answer: '+next(o['text'] for o in x['options'] if o['id']==k)+'.' if k else 'The source wording does not establish one unambiguous correct option; retained ungraded.'))
# Source-specific adjudications, including genuine multi-answer items.
for pid in ['cell-practical20203','cell-practical-flame','cell-practical-molisch','bio-practical-dds2023']:
 d=load(pid)
 for x in d['questions']:
  if 'اConcentration' in str(x):
   for o in x['options']:o['text']=o['text'].replace('اConcentration','Concentration')
  if 'Watch Glass' in x['prompt']:
   ids=[o['id'] for o in x['options'] if o['text'] in ['dry and weigh solid compounds','heat and evaporate liquids']]
   x['acceptedOptionIds']=ids;setkey(x,ids[0],'A watch glass can hold solids for drying/weighing and can also be used for evaporation; both corresponding choices are accepted.')
  if 'titration experiment' in x['prompt']:
   x['acceptedOptionIds']=[o['id'] for o in x['options'] if o['text'] in ['Using indicators','By using indicators','Measuring pH']]
   x['explanation']='The visual endpoint is detected using an indicator. Measuring the pH change can also locate an endpoint; either method is accepted.'
   x['answerBasis']='editorial'
 save(d)
for pid in ['bio-quiz2016','bio-quiz2016-variant']:
 d=load(pid)
 keys=('C C A B A C - C B B A B B A B E' if pid=='bio-quiz2016' else 'B B A C A - B C C A B E B B A A').split()
 for x,k in zip(d['questions'],keys):setkey(x,None if k=='-' else k)
 for x in d['questions']:
  if x['prompt']=='Which of the following is an amino acid?':
   x['acceptedOptionIds']=['A','B','C','D'];x['explanation']='All four listed substances are amino acids, so every listed option is accepted. The source is defective as a single-answer MCQ.'
  if 'pair of amino acid is polar and acidic' in x['prompt']:x['explanation']='The wording is ambiguous: Glu is acidic while Cys and Ser are polar uncharged, so two pairs fit one interpretation and no pair has two acidic residues. Ungraded.'
  if not x['options']:
   x['responseType']='written';x['explanation']='Written-response source item; self-assessment only. '
   if 'Henderson' in x['prompt']:x['explanation']+='CH3COOH ⇌ H+ + CH3COO−; pH = pKa + log10([CH3COO−]/[CH3COOH]).'
   elif 'Aspartate' in x['prompt']:x['explanation']+='At physiological pH: −OOC−CH(NH3+)−CH2−COO−.'
   elif 'tryptophan' in x['prompt']:x['explanation']+='At pH 7, the alpha amino group is NH3+ and the carboxyl group is COO−; the side chain is CH2–indole.'
   elif 'lysine' in x['prompt']:x['explanation']+='The predominant net-neutral form near the pI has COO−, an uncharged alpha NH2, and a protonated terminal side-chain NH3+.'
 save(d)
d=load('bio-dna-student-mcqs')
keys='A B B - C C A - E A A C - C D D D A D B D C C B B A A B - A B A D - A B - C D E A A A B D A A B C A A B D C - A - C A - A A - A - B C C B - A D C C C B A D A - B - B C B B A - B A C A C B D B D A A'.split()
assert len(keys)==len(d['questions']),(len(keys),len(d['questions']))
for x,k in zip(d['questions'],keys):setkey(x,None if k=='-' else k)
issues={
4:'Hybrid duplex stability depends on sequence and conditions; more than one comparative statement can be true. No unique single answer is established.',
8:'The stem reverses the template-reading direction. DNA polymerase reads 3′→5′ and synthesizes 5′→3′, a combination absent from the stated choices.',
13:'The wording does not distinguish unwinding by helicase from stabilization of separated strands by single-strand-binding proteins. Ungraded.',
29:'“Read” could mean conventional sequence notation (5′→3′) or template reading by polymerase (3′→5′). The context is unspecified.',
34:'The broad wording “gene expression mechanisms” does not provide enough context to exclude DNA editing uniquely.',
37:'Option B is also inaccurate as written: telomeres protect chromosome ends from being treated as DNA breaks, rather than marking an end to begin replication. D is the likely intended answer but no unique key is enforced.',
55:'The source does not identify whether the supplied DNA strand is coding or template; D is complementary RNA only under the template interpretation.',
57:'“Dimer” is not an RNA class, and replication primers are synthesized by primase, making the intended exception ambiguous.',
60:'The stem asks what enzymes are called, but no option names enzymes. “Template-directed” describes synthesis, not an enzyme name.',
63:'DNA polymerases proofread, but RNA polymerases can also proofread through transcript cleavage; the broad question is not uniquely answerable.',
65:'Deoxyribonucleases are the intended degradative enzymes, but topoisomerases also cleave DNA phosphodiester bonds transiently. The unqualified wording is ambiguous.',
70:'Superhelix handedness depends on whether the geometry is plectonemic or toroidal; the question does not specify the convention.',
80:'Poly(A) polymerase adds the tail without a template. The only intended option calls this transcription, which is inaccurate.',
82:'CAP occupancy promotes expression, but maximal lac operon expression also requires removal of lac repressor through lactose/allolactose. The stated condition alone is insufficient.',
88:'The source does not identify which kinases are meant. The intended eIF2α stress-kinase context cannot safely be inferred from the generic stem.'}
for i,ex in issues.items():setkey(d['questions'][i-1],None,ex)
x=d['questions'][84];x['acceptedOptionIds']=['B','C'];x['explanation']='For the lac operon, lactose permits expression with or without glucose; expression is strongest without glucose. Both lactose-present choices are accepted for “ON”.'
x=d['questions'][85];x['acceptedOptionIds']=['B','D'];x['explanation']='Transferrin transports iron; the source prints this answer twice, so both occurrences are accepted.'
x=d['questions'][80];x['explanation']='The intended answer is RNA polymerase II: TATA boxes are DNA promoter elements associated with many RNA polymerase II genes, not parts of the enzyme itself.'
x=d['questions'][95];x['explanation']='UTP is the pyrimidine nucleoside triphosphate energy donor. UDP-glucose is an activated sugar intermediate.'
save(d)
for pid in ['bio-practical-jan2024','bio-kish-practical','cell-practical-online']:
 d=load(pid)
 for x in d['questions']:
  if 'titration experiment' in x['prompt']:
   x['acceptedOptionIds']=[o['id'] for o in x['options'] if o['text'] in ['Using indicators','Measuring pH']]
   x['explanation']='The visual endpoint uses an indicator; pH measurement can also locate the endpoint. Both corresponding methods are accepted.'
  if 'Renin has' in str(x['options']):x['explanation']='37 °C is the intended optimum in this teaching experiment. The source spells the milk-clotting enzyme as “Renin”; rennin/chymosin is the likely intended enzyme.'
  if x['prompt'].startswith('Amax'):x['explanation']='The source’s “Amax” denotes λmax: the wavelength at which the compound absorbs most strongly.'
 if pid=='bio-kish-practical':
  for i,k,ex in [(13,None,'The source marks D, but serum retains many clotting proteins; fibrinogen is removed during clotting. C is also broadly true. The simplified options do not give one precise distinction.'),(16,None,'The source highlights A. The commonly used normal HbA1c category is below 5.7%, and all larger upper-bound choices also encompass normal values. No unique accurate boundary is supplied.'),(18,None,'The source highlights agarose-gel chromatography, apparently intending agarose-gel electrophoresis. Ion-exchange chromatography can also separate nucleic acids, so this wording is not uniquely answerable.')]:
   setkey(d['questions'][i-1],k,ex);d['questions'][i-1]['sourceAnswer']={13:'D',16:'A',18:'A'}[i]
  d['questions'][16]['explanation']='B is the broad urine range intended by the source. Specific gravity is a dimensionless ratio; the source incorrectly labels it gm/ml.'
 if pid=='cell-practical-online':
  issues={31:'Hemoglobin A2 is commonly quantified by cation-exchange HPLC or electrophoretic methods. The source offers anion exchange and does not establish the intended validated method.',32:'Planning, directing, controlling and calibration can all contribute to laboratory quality systems; the source provides no curriculum-specific exclusion.',2:'HDL assay enzyme systems vary by method. Without naming the assay, the listed enzyme exception cannot be reliably assigned.',3:'No universally diagnostic LDL/HDL cutoff is specified; the overlapping “less than” choices and absent assay/course context prevent a unique key.',25:'Glucose can be measured by chemical, enzymatic, redox and fluorometric methods; the options do not identify a uniquely excluded method.',26:'Rickets, Paget disease and bone cancer often raise ALP; celiac disease may also raise it through osteomalacia. A reliably decreased-ALP condition is not unambiguously offered.'}
  for x in d['questions']:
   if int(x['number']) in issues:setkey(x,None,issues[int(x['number'])])
   if x['number']=='30':x['acceptedOptionIds']=['A','C'];x['explanation']='Fasting plasma glucose ≥126 mg/dL meets the diagnostic criterion when appropriately confirmed. A fasting value of 140 also meets it, so A and C are accepted.'
   if x['number']=='13':x['acceptedOptionIds']=['A','D'];x['explanation']='Alkaline phosphatase has catalytic zinc ions and an associated magnesium ion. Both Zn2+ and Mg2+ are accepted because “constituent” does not distinguish their roles.'
 save(d)
# Provenance for adjudications checked against external authoritative sources.
d=load('bio-kish-practical')
d['questions'][15]['answerReferences']=[{'title':'NIDDK: The A1C Test & Diabetes','url':'https://www.niddk.nih.gov/health-information/diagnostic-tests/a1c-test'}]
save(d)
d=load('cell-practical-online')
for x in d['questions']:
 if x['number']=='30':x['answerReferences']=[{'title':'NIDDK: Diabetes Tests & Diagnosis','url':'https://www.niddk.nih.gov/health-information/diabetes/overview/tests-diagnosis'}]
 if x['number']=='13':x['answerReferences']=[{'title':'Effect of Zn(II) and Mg(II) on phosphohydrolytic activity of rat matrix-induced alkaline phosphatase','url':'https://pubmed.ncbi.nlm.nih.gov/2611837/'}]
save(d)
# Retain known defective source highlights separately from the editorial answer.
for pid in ['bio-quiz2016','bio-quiz2016-variant']:
 d=load(pid)
 for x in d['questions']:
  if x['prompt']=='Which of the following is an amino acid?':x['sourceAnswer']='D'
  if 'pair of amino acid is polar and acidic' in x['prompt']:x['sourceAnswer']='C'
 save(d)
for pid,declared,missing in [('cell-practical-online',33,['9','14']),('bio-practical-jan2024',25,[]),('bio-practical-dds2023',17,[])]:
 path=b.OUT/(pid+'.json');d=load(pid);d['coverage'].update(sourceDeclaredQuestionCount=declared,missingFromSource=missing,completeSourceTranscription=True)
 path.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
# Alternate quiz has no highlights: do not attribute the marked version's key to it.
d=load('bio-quiz2016-variant')
for x in d['questions']:x.pop('sourceAnswer',None)
save(d)

# Independent scientific review: preserve source wording/marks while declining
# to grade broad or malformed single-answer claims.
reviewed_repairs = {
 'bio-kish-practical': {3:'electrophoresis',9:'inorganic'},
 'bio-practical-jan2024': {14:'chromatography',20:'spectrophotometry',24:'inorganic'},
 'cell-practical20203': {3:'inorganic',9:'spectrophotometry'},
 'cell-practical-flame': {6:'inorganic',27:'spectrophotometry'},
 'cell-practical-molisch': {11:'inorganic',23:'spectrophotometry'},
 'bio-practical-dds2023': {11:'inorganic',17:'cell-wall'},
 'bio-dna-student-mcqs': {81:'tata'},
}
reviewed_explanations = {
 'inorganic':'Flame photometry is used for inorganic analysis, but spectrophotometry, colorimetry and chromatographic methods can also analyze inorganic substances. The unrestricted stem does not identify a unique method; this source item is ungraded.',
 'spectrophotometry':'Spectrophotometry supports qualitative identification as well as quantitative analysis. Calling qualitative analysis false is not justified by the unrestricted wording, so no unique exception is established; this source item is ungraded.',
 'electrophoresis':'Charged lipids can be separated by electrophoretic methods. Without specifying the method or lipid class, the blanket claim that electrophoresis cannot separate lipids is false; this source item is ungraded.',
 'chromatography':'Chromatography separates components of both simple and complex mixtures. The stem does not specify a restriction that makes complex mixtures uniquely correct; this source item is ungraded.',
 'cell-wall':'Soap disrupts lipid cell membranes in DNA extraction; it does not break down cell walls. The source says cell walls, so the intended membrane answer is not graded as a correct answer to this malformed stem.',
 'tata':'A TATA box is a DNA promoter sequence, not a component of RNA or DNA polymerase. RNA polymerase II is the likely intended association, but none of the printed choices answers the literal stem; this source item is ungraded.',
}
for pid,repairs in reviewed_repairs.items():
 path=b.OUT/(pid+'.json');d=json.loads(path.read_text())
 for ordinal,reason in repairs.items():
  x=d['questions'][ordinal-1]
  assert x['sourceOrdinal']==ordinal
  setkey(x,None,reviewed_explanations[reason]);x.pop('acceptedOptionIds',None)
  if reason=='cell-wall':
   x['answerReferences']=['https://www.genome.gov/about-genomics/teaching-tools/strawberry-dna-extraction','https://nhmu.utah.edu/sites/default/files/attachments/DNA%20Extraction%20Activity_0.pdf']
  if reason in ['inorganic','chromatography']:
   x['answerReferences']=['https://www.thermofisher.com/us/en/home/industrial/environmental/environmental-learning-center/contaminant-analysis-information/anion-analysis.html']
  if reason=='spectrophotometry':
   x['answerReferences']=['https://www.shimadzu.com/an/sites/shimadzu.com.an/files/pim/pim_document_file/applications/application_note/11407/l546.pdf']
  if reason=='electrophoresis':
   x['answerReferences']=['https://pubmed.ncbi.nlm.nih.gov/9707650/','https://pubmed.ncbi.nlm.nih.gov/16620855/']
  if reason=='tata':
   x['answerReferences']=['https://pubmed.ncbi.nlm.nih.gov/29785964/']
 d['coverage']['gradedQuestionOccurrences']=sum(x['correctOptionId'] is not None for x in d['questions'])
 d['coverage']['unresolvedQuestionOccurrences']=sum(x['correctOptionId'] is None for x in d['questions'])
 path.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
path=b.OUT/'bio-practical-jan2024.json';d=json.loads(path.read_text());x=d['questions'][3]
x['acceptedOptionIds']=['B','D']
x['explanation']='Hopkins–Cole detects the indole group of tryptophan. Indole contains a fused pyrrole ring, so both the broad pyrrole statement (B) and the specific indole statement (D) are true; both are accepted, with D preferred.'
x['answerBasis']='editorial'
x['answerReferences']=['https://pubchem.ncbi.nlm.nih.gov/compound/798']
path.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
for pid,number in [('cell-practical-online','20'),('bio-practical-dds2023','8')]:
 path=b.OUT/(pid+'.json');d=json.loads(path.read_text())
 x=next(q for q in d['questions'] if q['number']==number)
 x['acceptedOptionIds']=[o['id'] for o in x['options'] if o['text'] in ['porous matrix','silica gel']]
 x['explanation']='Size-exclusion chromatography uses a porous stationary matrix. Porous silica can be used as that matrix, so both porous matrix and silica gel are accepted for this unrestricted material question; porous matrix is the preferred general answer.'
 x['answerBasis']='editorial'
 x['answerReferences']=['https://documents.thermofisher.com/TFS-Assets/CMD/Specification-Sheets/PS-20985-MAbPac-SEC-1-PS20985-EN.pdf']
 path.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
path=b.OUT/'cell-practical-online.json';d=json.loads(path.read_text())
x=next(q for q in d['questions'] if q['number']=='28')
setkey(x,None,'HbA1c does not require fasting and is the likely intended answer. Routine lipid profiles, including LDL cholesterol and triglycerides, can also be measured without fasting; particular clinical or laboratory circumstances may call for a fasting sample. The unrestricted question therefore has no unique answer and is ungraded.')
x.pop('acceptedOptionIds',None)
x['answerReferences']=['https://pubmed.ncbi.nlm.nih.gov/27122601/','https://eas-society.org/wp-content/uploads/2022/05/2016_Consensus-lipid-profile-fasting.pdf']
d['coverage']['gradedQuestionOccurrences']=sum(q['correctOptionId'] is not None for q in d['questions'])
d['coverage']['unresolvedQuestionOccurrences']=sum(q['correctOptionId'] is None for q in d['questions'])
path.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
