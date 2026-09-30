"""Render the retake manuscript and exact, hash-bound guided-study anchors."""
from pathlib import Path
import json
import hashlib
from html import escape
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether
from reportlab.platypus.tableofcontents import TableOfContents
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'data/biochemistry-retake/review.json'
data = json.loads(source.read_text())
dest = ROOT / 'public/study/reviews/biochemistry-retake.pdf'
for name, file in [('Body','NotoSans-Regular.ttf'),('Strong','NotoSans-Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(ROOT/'public/fonts'/file)))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Strong',italic='Body',boldItalic='Strong')
W,H=A4
INK=colors.HexColor('#18382e'); GREEN=colors.HexColor('#157451'); GRAY=colors.HexColor('#596b64'); PALE=colors.HexColor('#eef5ef')
styles={
 'body':ParagraphStyle('Body',fontName='Body',fontSize=9.2,leading=13.7,textColor=INK,spaceAfter=7),
 'title':ParagraphStyle('Title',fontName='Strong',fontSize=32,leading=39,textColor=INK,spaceAfter=16),
 'chapter':ParagraphStyle('Chapter',fontName='Strong',fontSize=20,leading=25,textColor=INK,spaceAfter=14,keepWithNext=True),
 'h2':ParagraphStyle('H2',fontName='Strong',fontSize=11.5,leading=16,textColor=GREEN,spaceBefore=10,spaceAfter=5,keepWithNext=True),
 'small':ParagraphStyle('Small',fontName='Body',fontSize=7.5,leading=10.5,textColor=GRAY,spaceAfter=7),
 'cell':ParagraphStyle('Cell',fontName='Body',fontSize=8,leading=11.5,textColor=INK),
 'toc':ParagraphStyle('TOC',fontName='Body',fontSize=9.5,leading=13,textColor=INK,leftIndent=0,firstLineIndent=0,spaceBefore=0),
}
def clean(text):
    return str(text).replace('\u2011','-').replace('–','-').replace('—','-')
def para(text,style='body',keys=None,section=None):
    p=Paragraph(escape(clean(text)).replace('\n','<br/>'),styles[style])
    p.anchor_keys=keys or []
    p.anchor_quote=clean(text)
    p.section_id=section
    return p
class ReviewDoc(BaseDocTemplate):
    def beforeDocument(self):
        self.sections={};self.concepts={};self.checkpoints={}
    def afterFlowable(self,f):
        if not isinstance(f,Paragraph):return
        top=max(0,min(.99,1-(self.frame._y+f.height)/H))
        if getattr(f,'section_id',None):
            key=f.section_id;self.canv.bookmarkPage(key);self.canv.addOutlineEntry(clean(f.getPlainText()),key,0)
            self.notify('TOCEntry',(0,f.getPlainText(),self.page,key));self.sections[key]={'page':self.page,'top':round(top,5)}
        for kind,key in getattr(f,'anchor_keys',[]):
            getattr(self,kind)[key]={'page':self.page,'top':round(top,5),'quote':f.anchor_quote}
def page_frame(canvas,doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor('#d5e3d9'));canvas.setLineWidth(.6);canvas.line(44,H-34,W-44,H-34)
    canvas.setFont('Strong',7);canvas.setFillColor(GRAY);canvas.drawString(44,H-26,'MED//25  ·  BIOCHEMISTRY RETAKE  ·  TERM 1')
    canvas.setFont('Body',7);canvas.drawString(44,25,'Source-based study review • Not an official retake announcement')
    canvas.drawRightString(W-44,25,str(doc.page));canvas.restoreState()
doc=ReviewDoc(str(dest),pagesize=A4,leftMargin=44,rightMargin=44,topMargin=47,bottomMargin=44,title='Biochemistry Retake - Cells and Molecules, Term 1',author='MED25 Study Review',pageCompression=1,invariant=1)
doc.addPageTemplates(PageTemplate(id='review',frames=[Frame(44,44,W-88,H-91,id='main',leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)],onPage=page_frame))
story=[Spacer(1,45),para('TERM 1 / CELLS AND MOLECULES','h2'),para('Biochemistry\nRetake','title'),para('Review • Practice • Source papers','h2'),para(data['scope']),Spacer(1,10),para('How to use this review','h2'),para('Start with the chapter explanation and comparison table. Answer a short practice set, then use its review mapping to repair weak points. Guided mode opens the matching paragraph after you answer; unguided mode leaves the reference closed. Past-paper checkpoints explain the tested relationship, including defects in the original wording.'),para('What is and is not included','h2'),para('The scope follows the latest confirmed original Term 1 record. A narrower retake announcement may change it. Integrated metabolism is retained where explicitly confirmed in Chapters 14-18 and 23-27; this is not the separate Biochemistry II pathway bank. Laboratory-derived theory is included as a dedicated section.'),para('Past-paper integrity','h2'),para('Four biochemistry sections contain 242 original question occurrences. The alternate February copy is treated as a duplicate. Some displayed choices are normalized; study answer letters need not match the source PDF order. Invalid source items are explicitly repaired or accept more than one scientifically valid answer. Study keys are not certified official keys.'),para('Edition and provenance','h2'),para('Lippincott Illustrated Reviews: Biochemistry, Ferrier, sixth edition, plus the original teacher slides and laboratory notes. Each concept cites its source. This is educational review, not patient-specific clinical guidance. Version: '+data['version'],'small'),PageBreak(),para('Review map','chapter')]
toc=TableOfContents();toc.levelStyles=[styles['toc']];story.extend([toc,PageBreak()])
for s in data['sections']:
    story.append(para(f"{s['order']:02d}  {s['title']}",'chapter',section=s['id']))
    story.append(para('Source basis: '+('Teacher foundations / laboratory material' if not s['id'].startswith('ch-') else 'Lippincott, Chapter '+s['id'][3:])+'; concept-specific teacher references below.','small'))
    for t in s.get('tables',[]):
        story.append(para(t['title'],'h2'))
        rows=[[para(c,'cell') for c in t['columns']]]+[[para(c,'cell') for c in row] for row in t['rows']]
        widths=[(W-88)/len(t['columns'])]*len(t['columns'])
        table=Table(rows,colWidths=widths,repeatRows=1,hAlign='LEFT')
        table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#dbeadb')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,PALE]),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('LINEBELOW',(0,0),(-1,0),.5,GREEN)]))
        story.extend([table,Spacer(1,8)])
    for c in s['concepts']:
        story.append(para(c['title'],'h2'))
        story.append(para(c['summary'],keys=[('concepts',c['id'])]))
        for bullet in c['keyPoints']:story.append(para('• '+bullet))
        if c.get('clinicalLinks'):story.append(para('Application: '+' '.join(c['clinicalLinks'])))
        story[-1].keepWithNext = True
        story.append(para('Sources: '+' '.join(c['sourceEvidence']),'small'))
    if s['checkpoints']:
        story.append(para('Past-paper checkpoints and wording traps','h2'))
        for c in s['checkpoints']:
            story.append(para(c['title'],'h2'))
            story.append(para(c['summary'],keys=[('checkpoints',qid) for qid in c['questionIds']]))
            story[-1].keepWithNext = True
            story.append(para('Source item: '+c['source'],'small'))
    story.append(PageBreak())
story.append(para('Sources and scope audit','chapter'))
for i,s in enumerate(data['sources'],1):story.append(para(f'{i}. {s}'))
story.append(para('Coverage limits','h2'))
story.append(para('This review covers the confirmed original biochemistry scaffold and the imported four-paper biochemistry sections. It does not certify a new retake announcement, predict future questions, include other-subject questions, or claim that the archive contains every historical sitting. Original textbook chapters remain the detailed reference.'))
dest.parent.mkdir(parents=True,exist_ok=True)
doc.multiBuild(story)
reader=PdfReader(dest)
layout={'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'manuscriptSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'pageCount':len(reader.pages),'sections':doc.sections,'concepts':doc.concepts,'checkpoints':doc.checkpoints}
assert len(layout['sections'])==26
assert len(layout['concepts'])==sum(len(s['concepts']) for s in data['sections'])
(ROOT/'data/biochemistry-retake/pdf-layout.json').write_text(json.dumps(layout,ensure_ascii=False,indent=2)+'\n')
print(f'Rendered {len(reader.pages)} pages; {len(doc.concepts)} concepts and {len(doc.checkpoints)} paper-question anchors.')
