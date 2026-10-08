"""Rebuild only the physiology variant; the canonical full review is read-only."""
from pathlib import Path
import hashlib, importlib.util, json, shutil
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parent.parent
DATA=ROOT/'data/review-variants/cvs-physio'
OUT=ROOT/'public/study/reviews'
digest=lambda data:hashlib.sha256(data).hexdigest()
provenance=json.loads((DATA/'provenance.json').read_text())
for asset in provenance['assets']:
    assert digest((DATA/asset['path']).read_bytes())==asset['sha256'],asset['path']
source=json.loads((DATA/'source.json').read_text())
assert [s['id'] for s in source['sections']]==provenance['sectionIds']
spec=importlib.util.spec_from_file_location('review_renderer',ROOT/'scripts/review-variants/render_review.py')
renderer=importlib.util.module_from_spec(spec);spec.loader.exec_module(renderer)
(ROOT/'tmp/pdfs').mkdir(parents=True,exist_ok=True)
report=renderer.volume_pdf(source,'cvs-physio.pdf')
assert not report['mechanicalIssues'],report['mechanicalIssues']
pdf=ROOT/'tmp/pdfs/cvs-physio.pdf'
reader=PdfReader(pdf)
outline={item.title:reader.get_destination_page_number(item)+1 for item in reader.outline if not isinstance(item,list)}
assert len(outline)==len(source['sections'])
canonical=json.loads((ROOT/'data/review-curriculum/courses/term2-cvs.json').read_text())
sections=[]
for item in source['sections']:
    original=next(s for s in canonical['sections'] if s['id']=='cvs/'+item['id'])
    assert original['title']==item['title']
    sections.append({**original,'volumeId':'cvs-physio','pdfPage':outline[item['title']]})
sha=digest(pdf.read_bytes())
manifest={'schemaVersion':1,'examId':'term2-cvs','scope':'physio','sourceVolumeId':'cvs','sourcePdfSha256':provenance['sourcePdfSha256'],'authoringSha256':provenance['authoringSha256'],'contentSha256':digest((DATA/'source.json').read_bytes()),'rendererSha256':digest((ROOT/'scripts/review-variants/render_review.py').read_bytes()),'volume':{'id':'cvs-physio','title':'CVS Physiology Review','url':'/study/reviews/cvs-physio.pdf?v='+sha,'sha256':sha,'pageCount':len(reader.pages)},'sections':sections}
shutil.copyfile(pdf,OUT/'cvs-physio.pdf')
(OUT/'cvs-physio.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'pages':len(reader.pages),'sections':len(sections),'sha256':sha}))
