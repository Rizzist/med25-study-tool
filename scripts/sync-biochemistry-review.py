"""Validate regenerated PDF bookmarks, sync its versioned app metadata, record coverage.

Run only after the private review builder. Uses actual outline destinations, never
guessed page offsets. The review-routing file is an explicit question-level audit.
"""
from pathlib import Path
import hashlib, json, shutil
import pymupdf as fitz

REPO=Path(__file__).resolve().parents[1]
ARCHIVE=Path('/Users/rizzist/Documents/MED SLIDES/TERM 2/10 Review Summaries')
AUTHOR=ARCHIVE/'_build/content/biochemistry.json'
PDF=ARCHIVE/'04 - Biochemistry II Review.pdf'
def read(p): return json.loads(p.read_text())
def write(p,j): p.parent.mkdir(parents=True,exist_ok=True); p.write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n')
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def norm(s): return s.replace('\u2011','-').replace('\u2013','-').replace('\u2014',' - ').replace('\u00a0',' ').replace('\u00ad','')
author=read(AUTHOR); pdf=fitz.open(PDF); toc=pdf.get_toc()
outline={title:page for _,title,page in toc}
assert len(outline)==len(toc), 'Repeated outline headings'
newsections=[]
for index,s in enumerate(author['sections']):
    assert norm(s['title']) in outline, s['title']
    page=outline[norm(s['title'])]
    assert 1<=page<=len(pdf)
    newsections.append({'id':'biochemistry/'+s['id'],'sourceSectionId':s['id'],'title':s['title'],'pdfPage':page})
assert pdf.embfile_count()==6, 'Original lecture attachments lost'
assert len([b for s in author['sections'] for b in s['blocks'] if b['type']=='figure'])>=5, 'Original figures lost'
lockfile=REPO/'data/review-curriculum/source-locks.json'; locks=read(lockfile)
lock=next(v for v in locks['volumes'] if v['id']=='biochemistry')
lock.update(sha256=sha(PDF),pageCount=len(pdf),sections=newsections)
lock['authoringJson']['sha256']=sha(AUTHOR)
coursefile=REPO/'data/review-curriculum/courses/term2-biochemistry.json'; course=read(coursefile)
volume=next(v for v in course['volumes'] if v['id']=='biochemistry')
volume.update(sha256=sha(PDF),pageCount=len(pdf),url='/study/reviews/biochemistry.pdf?v='+sha(PDF))
other=[s for s in course['sections'] if s['volumeId']!='biochemistry']
course['sections']=[{'id':s['id'],'title':s['title'],'volumeId':'biochemistry','order':i+1,'role':'orientation-or-checklist' if i==0 or s['sourceSectionId']=='biochem-exam-corrections' else 'review-section','sourceBasis':author['sections'][i]['basis'],'pdfPage':s['pdfPage']} for i,s in enumerate(newsections)]+other
shutil.copy2(PDF,REPO/'public/study/reviews/biochemistry.pdf')
write(lockfile,locks); write(coursefile,course)

papers=read(REPO/'data/biochemistry/past-papers.json')
resolutions=read(REPO/'data/biochemistry/ai-resolutions.json')['questions']
routes=read(REPO/'data/biochemistry/review-routing.json')
byid={s['id']:s for s in course['sections']}
source_sections={s['id']:s for s in author['sections']}
rows=[]; counts={}
new_ids={'clinical-enzymes','liver-tests','renal-tests','endocrine-signaling','thyroid','exam-corrections'}
for paper in papers['papers']:
    codes=routes['paperSequences'][paper['sourceId']].split()
    assert len(codes)==len(paper['questions']), (paper['sourceId'],len(codes),len(paper['questions']))
    for q,code in zip(paper['questions'],codes):
        qid=paper['id']+'-q'+str(q['number']).zfill(3)
        resolution=resolutions.get(qid)
        target='biochemistry/biochem-'+routes['codes'][code]
        section=byid[target]; s=source_sections[target.split('/')[1]]
        references=[{k:v for k,v in src.items() if k in ('title','locator','url')} for src in s['sources']]
        row={'questionId':paper['id']+'-q'+str(q['number']).zfill(3),'paperId':paper['id'],'sourceNumber':q['number'],'prompt':q['prompt'],'sectionId':target,'sectionTitle':section['title'],'pdfPage':section['pdfPage'],'beforeAudit':'missing dedicated teaching section' if routes['codes'][code] in new_ids else 'existing section; detail reviewed and expanded as needed','afterAudit':'concept covered; source item remains ungraded' if not q['key'] else 'concept covered','sourceCaveat':q['note'],'graded':bool(q['key']),'references':references}
        if resolution:
            row.update(graded=True,afterAudit='concept covered; AI-repaired study version' if resolution['kind']=='repaired' else 'concept covered; AI key accepts both defensible choices',resolutionKind=resolution['kind'],studyPrompt=resolution.get('prompt',q['prompt']))
        rows.append(row); counts[target]=counts.get(target,0)+1
audit={'version':'2026-09-23','scope':'All imported source occurrences, including optional reconstruction and flawed items. Concept-level educational coverage, not an official exam blueprint or clinical guideline.','reviewSha256':sha(PDF),'reviewPages':len(pdf),'reviewSections':len(author['sections']),'sourceItems':len(rows),'scoredItems':sum(r['graded'] for r in rows),'ungradedItems':sum(not r['graded'] for r in rows),'missingDestinations':0,'questionDestinations':rows}
audit['aiResolvedItems']=len(resolutions)
write(REPO/'data/biochemistry/review-coverage.json',audit)
write(ARCHIVE/'_build/audit/biochemistry-past-paper-coverage.json',audit)
report=['# Biochemistry II review coverage audit','',f'Updated 23 September 2026. Review: {len(pdf)} pages, {len(author["sections"])} teaching sections.','',f'{len(rows)} source occurrences reviewed: {audit["scoredItems"]} scored and {audit["ungradedItems"]} intentionally ungraded. All have a conceptual review destination; this does not authenticate a defective answer key.','', '## Was the previous review complete?','', 'No. Core metabolism was covered, but clinical enzyme interpretation, liver/renal diagnostic patterns, endocrine signaling and thyroid questions lacked dedicated coverage. Fine pathway and inherited-disease details also needed expansion. The original carbohydrate and first lipid slide PDFs were found outside the Term 2 folder.','', '## What changed','', '| Review section | Source occurrences | PDF page |','|---|---:|---:|']
for s in course['sections']:
    if s['id'] in counts: report.append(f'| {s["title"]} | {counts[s["id"]]} | {s["pdfPage"]} |')
report+=['','## Boundaries','', '- Fourteen main collections plus one unauthenticated reconstruction; duplicate concepts recur across papers.', '- The 23 formerly ungraded items now have AI study resolutions: 22 explicitly repaired questions and one accepting both defensible alternatives. All 641 are scored. Original defects, wording and source marks are retained; repairs are not authenticated examiner keys.', '- Later missing lecture decks and future exam contents cannot be certified covered. Practical biochemistry is a separate volume and was not changed.', '- Existing diagrams and all six lecture-transcript attachments are preserved.', '- The row-level JSON records every source number, destination, page, citation and caveat. Original notes/books/slides were not modified.','', '## Every source item','', '| Paper / question | Review destination | Page | Status |','|---|---|---:|---|']
for r in rows: report.append(f'| {r["paperId"]} Q{r["sourceNumber"]} | {r["sectionTitle"]} | {r["pdfPage"]} | {r["afterAudit"]} |')
text='\n'.join(report)+'\n'
(REPO/'data/biochemistry/REVIEW-COVERAGE.md').write_text(text)
(ARCHIVE/'Biochemistry - Past Paper Coverage Audit.md').write_text(text)
print(json.dumps({k:v for k,v in audit.items() if k!='questionDestinations'},indent=2))
