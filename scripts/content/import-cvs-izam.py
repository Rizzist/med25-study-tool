"""Deterministic content import; no app/UI tests or browser interactions.

Requires the locally preserved IZAM OCR workspace. Original downloads are never deleted.
Manual answer/transcription decisions live in data/cvs-izam-*.json.
"""
from pathlib import Path
import json, hashlib, shutil, re, difflib
import fitz
from PIL import Image

REPO=Path(__file__).resolve().parents[2]
WORK=Path('/Users/rizzist/Documents/Codex/2026-08-26/look/cvs-papers-work/izam')
MED=Path('/Users/rizzist/Documents/MED SLIDES/TERM 2/01 Cardiovascular/Past Exams')
PUBLIC=REPO/'public/study/cvs-past-papers'
ARCHIVE=MED/'IZAM - 2026-09-19'
def read(p):return json.loads(p.read_text())
def write(p,value):
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(value if isinstance(value,str) else json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def sha(b):return hashlib.sha256(b).hexdigest()
def question_hash(q):return sha(json.dumps({k:q[k] for k in ['prompt','options','issues']},ensure_ascii=False,separators=(',',':')).encode())
data=read(REPO/'data/cvs-izam-import.json');clear=read(REPO/'data/cvs-izam-clear-2023.json')
inv=read(WORK/'inventory.json');lookup={r['sha256'][:12]:r for r in inv}
catalog=read(PUBLIC/'index.json');overlay=read(PUBLIC/'ai-answers.json');mapping=read(PUBLIC/'topic-map.json')
# Rebuilding one import only replaces its own generated sidecar entries.
import_prefixes=tuple(s['id']+'-' for s in data['sets'])
overlay['questions']={k:v for k,v in overlay['questions'].items() if not k.startswith(import_prefixes)}
mapping['questions']={k:v for k,v in mapping['questions'].items() if not k.startswith(import_prefixes)}
topics={t['id']:t for t in mapping['topics']}
review=read(MED.parent.parent/'10 Review Summaries/_build/content/cvs.json')
review_sections={s['id']:s for s in review['sections']}
base='https://med25-study-tool.vercel.app/study/cvs-past-papers'
refs={
 'cardiac-ap':('CV Physiology: Non-pacemaker action potentials','https://cvphysiology.com/arrhythmias/a006'),
 'conduction-phys':('CV Physiology: Pacemaker activity','https://cvphysiology.com/arrhythmias/a005'),
 'cycle':('OpenStax: Cardiac cycle','https://openstax.org/books/anatomy-and-physiology-2e/pages/19-3-cardiac-cycle'),
 'pv-loop':('CV Physiology: Ventricular pressure–volume relationships','https://cvphysiology.com/cardiac-function/cf024'),
 'microexchange':('OpenStax: Capillary exchange','https://openstax.org/books/anatomy-and-physiology-2e/pages/20-3-capillary-exchange'),
 'flow-laws':('CV Physiology: Resistance to blood flow','https://cvphysiology.com/hemodynamics/h002'),
 'neural-pressure':('OpenStax: Regulation of the vascular system','https://openstax.org/books/anatomy-and-physiology-2e/pages/20-4-homeostatic-regulation-of-the-vascular-system'),
}
def references(topic):
    out=[dict(title='Course/book review locator: '+topics[topic]['title'],url=base+'/izam-reference-guide.md#'+topic)]
    if topic in refs:out.append(dict(title=refs[topic][0],url=refs[topic][1]))
    return out

# Preserve unique source files in one directory each, with the original source name.
ledger=read(MED/'_source-ledger.json')
for r in inv:
    dest=ARCHIVE/(r['sha256'][:12]+' - '+Path(r['filename']).stem.replace('/','-'))
    dest.mkdir(parents=True,exist_ok=True)
    original=dest/r['filename']
    if not original.exists():shutil.copy2(r['original'],original)
    assert sha(original.read_bytes())==r['sha256']
    r['archive']=str(dest)
    if not any(x['currentPath']==str(original) for x in ledger):ledger.append(dict(originalFilename=r['filename'],downloadPath=r['original'],currentPath=str(original),sha256=r['sha256'],provenance='IZAM',copiedNotMoved=True))
    shutil.copy2(Path(r['folder'])/'text.txt',dest/'Source transcription - OCR.txt')
write(MED/'_source-ledger.json',ledger)

used_topics=set()
def source_panel(record,page,questions,dest):
    """Extract the question area; do not publish browser account names/toolbars."""
    src=Path(record['folder'])/f'{page:03}.jpg'
    with Image.open(src) as raw:
        im=raw.convert('RGB')
        if record['sha256'][:12]=='0dc98395b327' and page==15:
            im=im.rotate(90,expand=True);box=(0,int(im.height*.32),im.width,int(im.height*.85))
        elif record['sha256'][:12] in ['02204ba513a3','cac159604328']:
            box=(0,0,im.width,im.height)
        else:
            lines=read(Path(record['folder'])/f'{page:03}-ocr.json')
            stop={'the','which','what','following','from','with','this','that','will','are','for','and','its','does','normal','usually'}
            norm=lambda s:{w.rstrip('s') for w in re.findall(r'[a-z]{3,}',s.lower().replace('isovolumetric','isovolumic').replace('ventricular','ventricle')) if w not in stop}
            stem=norm(questions[0]['prompt']);last=norm(questions[-1]['options'][-1])
            candidates=[]
            for l in lines:
                words=norm(l['text']); score=len(words&stem)/max(1,len(stem))
                if re.match(r'^[•○ОO©¢( 0]*[a-dA-D1-4][)\.]',l['text']):score*=.3
                if words&stem:candidates.append((score,len(words&stem),l))
            if not candidates:raise ValueError(f'No safe question crop: {src}')
            first=max(candidates,key=lambda x:(x[0],x[1]))[2]
            # Include preceding wrapped stem lines, but stop after visible account header.
            y0=first['y']-.04
            headers=[l for l in lines if re.search(r'Fatima|nabaa|Time left|Student.s Name|Test name|99→|Name of the Exam',l['text'],re.I) and l['y']<first['y']]
            if headers:y0=max(y0,max(l['y']+l['height'] for l in headers)+.008)
            ends=[l for l in lines if l['y']>first['y'] and (len(norm(l['text'])&last)>=1 or re.match(r'^[•○ОO©¢( 0]*[dD4][)\. ]',l['text']))]
            if not ends:raise ValueError(f'No safe end crop: {src}')
            y1=max(l['y']+l['height'] for l in ends)+.025
            footers=[l['y'] for l in lines if l['y']>first['y'] and re.search(r'Check the|Next Page|Type here|Browse answers',l['text'],re.I)]
            if footers:y1=min(y1,min(footers)-.004)
            box=(0,max(0,int(y0*im.height)),im.width,min(im.height,int(y1*im.height)))
        crop=im.crop(box);crop.thumbnail((1600,2200));dest.parent.mkdir(parents=True,exist_ok=True);crop.save(dest,quality=90)

def question_markdown(q,a):
    answer=f'**Answer: {a["answer"]}.**' if a['answer'] else '**Unresolved — not automatically graded.**'
    return [f'### Q{q["number"]} · source page {q["page"]}','',q['prompt'],'']+[f'{"ABCD"[i]}. {o}' for i,o in enumerate(q['options'])]+['',f'{answer} {a["explanation"]}',a.get('caveat',''),'']

source_numbers={
 'cvs-izam-cardiac-screens-a':{2:'2',6:'4',7:'6',8:'10',9:'7',11:'8',12:'1',13:'9',14:'17',15:'11',16:'11',18:'3',19:'1'},
 'cvs-izam-cardiac-screens-b':{2:'15',4:'12',7:'8',8:'7',9:'6',10:'5',13:'3',14:'2',15:'1',17:'17'},
}
new_ids=[];new_count=0
for spec in data['sets']:
    pid=spec['id'];new_ids.append(pid);r=lookup[spec['source']];out=PUBLIC/pid;out.mkdir(exist_ok=True)
    qs=[];md=[f'# {spec["title"]}','',spec['note'],'','## Source and answer status','','This is NOT an independently verified official university answer key. Answers are worked teaching answers checked against course/book references. Spelling, units and English phrasing are normalized for readability; clinically relevant qualifications are explicit. No question is generated to fill a missing source number.','']
    for i,row in enumerate(spec['qs'],1):
        page,prompt,options,key,topic,explanation,*extra=row
        confidence=extra[0] if extra else 'high';caveat=extra[1] if len(extra)>1 else ''
        number=str(page) if pid in ['cvs-izam-circulation','cvs-izam-cardiac-ions'] else source_numbers.get(pid,{}).get(page,f'unnumbered (PDF p{page})')
        if pid=='cvs-izam-mixed-cvs-fragments':
            m=re.search(r'Printed Q(\d+)',caveat);number=(m[1] if m else str(i))+f' (PDF p{page})'
        q=dict(id=f'{pid}-item{i}',number=number,page=page,prompt=prompt,options=options,providedKey=None,scoringKey=None,keyNote='Worked reference-based answer supplied in the answer overlay; no official answer key is claimed.',issues=[],sourcePage=f'/study/cvs-past-papers/{pid}/pages/{page:03}.jpg')
        assert key in 'ABCD' and len(options)==4 and all(options)
        a=dict(answer=key,explanation=explanation,confidence=confidence,references=references(topic),questionHash=question_hash(q),reviewStatus='verified',reviewer='primary-agent: source-text and course-reference review; not an independent human examiner')
        if caveat:a['caveat']=caveat
        overlay['questions'][q['id']]=a
        mapping['questions'][q['id']]=dict(subjectId=topics[topic]['subjectId'],topicId=topic)
        qs.append(q);used_topics.add(topic)
    for page in sorted({q['page'] for q in qs}):source_panel(r,page,[q for q in qs if q['page']==page],out/'pages'/f'{page:03}.jpg')
    fingerprint=sha(json.dumps(qs,sort_keys=True,ensure_ascii=False).encode())
    paper=dict(id=pid,title=spec['title'],note=spec['note'],questions=qs,fingerprint=fingerprint,keyStatus='Reference-reviewed teaching answers; source markings are not adopted as an official key',sourceUrl=qs[0]['sourcePage'],transcriptUrl=f'/study/cvs-past-papers/{pid}/exam.md')
    write(out/'paper.json',paper)
    md+=['## Answer key / status','','| Source question | PDF page | Answer |','|---|---|---|']+[f'| {q["number"]} | {q["page"]} | {overlay["questions"][q["id"]]["answer"]} |' for q in qs]+['','## Questions','']
    for q in qs:md+=question_markdown(q,overlay['questions'][q['id']])
    md+=['## Withheld source items','','These are not silently assigned a default answer. They remain in the local original; the reason for exclusion is explicit.','']+[f'- PDF page {p}: {reason}' for p,reason in spec['excluded'].items()]
    md+=['','## Complete source transcription appendix','','The playable question transcription is above. The full original PDF and unabridged OCR (including non-question account/toolbars) are preserved only in the local medical archive. The web copy contains question-only page crops to avoid publishing account details.','']+[f'- [Source question panel, PDF p{p}](pages/{p:03}.jpg)' for p in sorted({q['page'] for q in qs})]
    write(out/'exam.md','\n'.join(md)+'\n')
    local=Path(r['archive']);write(local/'Exam - Questions and Answer Key.md','\n'.join(md)+f'\n\n## Original file\n\n[{r["filename"]}](<{r["filename"]}>)\n\n## Unabridged OCR\n\n'+(Path(r['folder'])/'text.txt').read_text())
    shutil.copytree(out/'pages',local/'pages',dirs_exist_ok=True)
    entry=dict(id=pid,title=spec['title'],note=spec['note'],count=len(qs),keyed=0,file=f'/study/cvs-past-papers/{pid}/paper.json',fingerprint=fingerprint,category='IZAM · supplied test fragments (institution noted)')
    catalog['papers']=[p for p in catalog['papers'] if p['id']!=pid]+[entry]
    new_count+=len(qs)

# Repair the already-imported 99-item paper with its better alternate source.
# Keep original question bytes/IDs/fingerprint intact: the existing overlay revision
# mechanism handles corrected responses without resetting unrelated source papers.
pid='cvs-undated-student-2023';paper=read(PUBLIC/pid/'paper.json');r=lookup[clear['source']]
repair_md=['# February 2023 semester — clearer alternate copy (IZAM)','',clear['sourceNote'],'','Original paper/question IDs are retained. The cover lists eight short answers, but none is present in the supplied 20 pages.','', '## Answer key / status','','NOT an independently verified official key. Reference-based answers, not the erroneous supplied correction slide.','']
for cq in clear['questions']:
    q=next(q for q in paper['questions'] if q['number']==str(cq['number']))
    a=overlay['questions'][q['id']]
    a.update(correctedPrompt=cq['prompt'],correctedOptions=cq['options'],sourcePageVerified=True,reviewer='primary-agent: clearer IZAM source reconciliation; prior answer review retained except explicit repairs')
    repair=clear['answerRepairs'].get(str(cq['number']))
    if repair:
        a.update(answer=repair[0],explanation=repair[1],confidence=repair[2]);a.pop('caveat',None)
        if len(repair)>3:a['caveat']=repair[3]
    # Remove source-cropping warnings once restored, but retain medical qualifications.
    if a.get('caveat') and not repair and re.search('cropped|crop|missing.*(option|stem)|source photograph',a['caveat'],re.I) and a['answer']:a.pop('caveat')
    source_title=f'Clearer IZAM source, PDF page {cq["page"]}'
    a['references']=[ref for ref in a['references'] if not ref['title'].startswith('Clearer IZAM source')]+[dict(title=source_title,url=f'{base}/{pid}/izam-clearer-pages/{cq["page"]:03}.jpg')]
    if repair:
        topic=mapping['questions'][q['id']]['topicId'];a['references']+=references(topic);used_topics.add(topic)
    a['references']=list({ref['url']:ref for ref in a['references']}.values())
    dest=PUBLIC/pid/'izam-clearer-pages'/f'{cq["page"]:03}.jpg';dest.parent.mkdir(exist_ok=True)
    if not dest.exists():shutil.copy2(Path(r['folder'])/f'{cq["page"]:03}.jpg',dest)
    repair_md+=question_markdown(dict(q,prompt=cq['prompt'],options=cq['options'],page=cq['page']),a)
title='CVS Final · February 2023 semester · clearer copy (IZAM)'
note=clear['sourceNote']+' The 99 MCQs are not duplicated. Eleven previously unanswerable cropped items now have worked answers; two pre-existing defective questions remain qualified/ungraded. Eight short-answer questions named on the cover are absent.'
paper.update(title=title,note=note)
write(PUBLIC/pid/'paper.json',paper)
entry=next(e for e in catalog['papers'] if e['id']==pid);entry.update(title=title,note=note)
write(PUBLIC/pid/'izam-clearer-transcript.md','\n'.join(repair_md)+'\n')
write(Path(r['archive'])/'Exam - Questions and Answer Key.md','\n'.join(repair_md)+'\n\n## Complete source transcription appendix\n\n'+(Path(r['folder'])/'text.txt').read_text())

# Portable topic-to-book/lecture navigation, without publishing textbook files.
guide=['# IZAM answer reference guide','','These source locators point to the existing local CVS review and the user’s books/slides. They are not an official exam key.','']
for tid in sorted(used_topics):
    s=review_sections[tid];guide += [f'<a id="{tid}"></a>',f'## {s["title"]}','']
    guide += [f'- {src["title"]} — {src["locator"]}' for src in s.get('sources',[])]+['']
    guide += [b['text'] for b in s['blocks'] if b['type']=='paragraph'][:2]+['']
write(PUBLIC/'izam-reference-guide.md','\n'.join(guide)+'\n')
overlay['revision']=data['revision']
overlay['note']='Reference-based teaching answers, separate from supplied source marks. IZAM additions have source/course-reference review; no independent human or university certification is claimed.'
write(PUBLIC/'ai-answers.json',overlay);write(PUBLIC/'index.json',catalog)
summary={}
for e in catalog['papers']:
    p=read(REPO/('public'+e['file']));aa=[overlay['questions'].get(q['id']) for q in p['questions']];aa=[a for a in aa if a]
    summary[e['id']]=dict(proposed=sum(bool(a['answer']) for a in aa),unresolved=sum(not a['answer'] for a in aa),corrections=sum(bool(a.get('correctedPrompt') or a.get('correctedOptions')) for a in aa))
write(PUBLIC/'ai-summary.json',summary)
mapping['sourceFingerprints']=[dict(paperId=e['id'],sha256=sha((REPO/('public'+e['file'])).read_bytes())) for e in catalog['papers']]
write(PUBLIC/'topic-map.json',mapping)
print(json.dumps(dict(addedSets=len(new_ids),addedQuestions=new_count,recoveredAnswers=len(clear['answerRepairs']),totalPapers=len(catalog['papers']),totalQuestions=sum(e['count'] for e in catalog['papers']),remainingClearPaperUnresolved=summary[pid]['unresolved']),indent=2))
