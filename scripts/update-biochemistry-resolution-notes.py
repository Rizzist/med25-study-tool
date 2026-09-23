"""Refresh only the private review's grading-status prose; retain scientific cautions."""
import json
from pathlib import Path

root=Path('/Users/rizzist/Documents/MED SLIDES/TERM 2/10 Review Summaries')
author=root/'_build/content/biochemistry.json'
data=json.loads(author.read_text())
for i,text in enumerate(data['gaps']):
    if 'Twenty-three flawed or unresolved items remain ungraded' in text:
        data['gaps'][i]='The 15 collections contain 641 source occurrences, not 641 independent concepts. The 23 formerly ungraded items now have AI study resolutions: 22 explicitly repaired versions and one item accepting both defensible choices. Original source defects remain documented; these repairs are not authenticated examiner answers. One collection is an optional reconstruction.'
for section in data['sections']:
    for block in section['blocks']:
        if 'text' in block:
            block['text']=block['text'].replace('the rare hematologic distinctions proposed in two supplied questions were not verified and remain withheld.', 'the rare hematologic distinctions proposed in two supplied questions were not verified. The app now supplies explicitly repaired versions testing these established biochemical markers instead, while retaining the original questions.')
        if block.get('title')=='September 2026 coverage update':
            block['text']='The new audit adds clinical-diagnostic and endocrine topics and expands fine biochemical mechanisms. Every source occurrence has a review destination. All 641 items now have study keys, including 23 AI resolutions of previously defective questions. Edited stems or choices are flagged and the originals retained. A conceptual destination does not authenticate an official answer key.'
        if section['id']=='biochem-exam-corrections' and block['type']=='paragraph':
            block['text']='The papers test established metabolism and older clinical-laboratory conventions. The original 23 defective items are now answerable through 22 explicitly repaired study versions and one question accepting both defensible alternatives. Numbering, original text and printed marks are retained. Corrections below explain the underlying science; they are not claims that the source choices were valid or that examiner intent is known.'
        if section['id']=='biochem-exam-corrections' and block.get('title')=='Coverage is not an exam prediction':
            block['text']='All source occurrences have review destinations and study answers. For the 23 AI-resolved items, the app distinguishes edited study wording from the original and uses the darker answer styling. Repairs teach defensible concepts without certifying the source key, missing lectures or future exam coverage. The reconstruction remains optional.'
author.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('Updated grading-status notes; scientific defect explanations and source assets retained.')
