"""Deterministic review PDFs from editable content JSON. No network or original-source edits.

Design v2 (23 September 2026). Presentation only: the manuscripts in content/*.json, the
section IDs, section titles (PDF bookmarks), figures, sources and transcript attachments are
unchanged. The previous renderer is preserved in audit/before-design-v2-2026-09-23/build.py.

Layout: dark cover with the volume at a glance and a colour legend; numbered contents with
dot leaders; each section opens with a numbered kicker and its source basis; callouts carry a
coloured rule and a plain-language label; self-check questions are grouped into one panel;
tables use a light header and hairlines; figures are numbered and framed; per-section sources
are condensed into one small line; running header shows the book and current section.
"""
from pathlib import Path
import argparse, hashlib, html, json, re, shutil
from pypdf import PdfReader
import pdfplumber
from reportlab import rl_config
rl_config.invariant=1
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak, Table,
                                TableStyle, Image, KeepTogether, CondPageBreak, Flowable)
from reportlab.platypus.tableofcontents import TableOfContents

HERE=Path(__file__).resolve().parents[2]/'data/review-variants/cvs-physio'
OUT=Path(__file__).resolve().parents[2]/'tmp/pdfs'
PAGE_W,PAGE_H=A4
MARGIN=50
WIDTH=PAGE_W-MARGIN*2
TOP=58; BOTTOM=50
FONTS=HERE/'assets/fonts'
pdfmetrics.registerFont(TTFont('Sans',str(FONTS/'NotoSans-Regular.ttf')))
pdfmetrics.registerFont(TTFont('Sans-Bold',str(FONTS/'NotoSans-Bold.ttf')))
pdfmetrics.registerFont(TTFont('Fallback',str(FONTS/'DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('Fallback-Bold',str(FONTS/'DejaVuSans-Bold.ttf')))
pdfmetrics.registerFontFamily('Sans',normal='Sans',bold='Sans-Bold',italic='Sans',boldItalic='Sans-Bold')
pdfmetrics.registerFontFamily('Fallback',normal='Fallback',bold='Fallback-Bold',italic='Fallback',boldItalic='Fallback-Bold')
PRIMARY_GLYPHS=set(pdfmetrics.getFont('Sans').face.charToGlyph)
FALLBACK_GLYPHS=set(pdfmetrics.getFont('Fallback').face.charToGlyph)

# Palette shared with the MED//25 web app.
INK=colors.HexColor('#17251f'); MUTED=colors.HexColor('#5d6b63'); FAINT=colors.HexColor('#8a968f')
GREEN=colors.HexColor('#126747'); DEEP=colors.HexColor('#0f2a20'); LIME=colors.HexColor('#d9f06b')
LINE=colors.HexColor('#dde4da'); SOFT=colors.HexColor('#f4f7f1'); HEAD=colors.HexColor('#e8efe3')
KINDS={
 'key':      ('Key idea',        '#126747','#eef6ef'),
 'trap':     ('Exam trap',       '#c2512f','#fdf1ec'),
 'uncertain':('Check the source','#a87708','#fcf5e1'),
 'clinical': ('Clinical link',   '#3558a8','#eef2fb'),
 'lecture':  ('From the lecture','#0e7a73','#e9f5f3'),
}

def S(name,**kw):
    base=dict(fontName='Sans',fontSize=9.8,leading=14.6,textColor=INK,allowWidows=0,allowOrphans=0)
    base.update(kw); return ParagraphStyle(name,**base)
ST={
 'kicker':S('kicker',fontName='Sans-Bold',fontSize=7.2,leading=9,textColor=GREEN,spaceBefore=4,spaceAfter=3,keepWithNext=True),
 'h1':S('h1',fontName='Sans-Bold',fontSize=17,leading=21.5,spaceAfter=4,keepWithNext=True),
 'h2':S('h2',fontName='Sans-Bold',fontSize=11.2,leading=15,textColor=GREEN,spaceBefore=8,spaceAfter=5,keepWithNext=True),
 'body':S('body',spaceAfter=7),
 'lead':S('lead',fontSize=10.6,leading=16,textColor=INK,spaceAfter=8),
 'small':S('small',fontSize=7.8,leading=11,textColor=MUTED,spaceAfter=4),
 'tiny':S('tiny',fontSize=7.6,leading=10.6,textColor=MUTED,spaceAfter=0),
 'bullet':S('bullet',leftIndent=13,firstLineIndent=0,bulletIndent=2,spaceAfter=4.5),
 'cell':S('cell',fontSize=8.7,leading=12.2),
 'cell1':S('cell1',fontName='Sans-Bold',fontSize=8.6,leading=12.2),
 'th':S('th',fontName='Sans-Bold',fontSize=7,leading=9.4,textColor=GREEN),
 'caption':S('caption',fontSize=8.4,leading=12,textColor=INK,spaceBefore=6,spaceAfter=2),
 'calllabel':S('calllabel',fontName='Sans-Bold',fontSize=6.8,leading=8.6,spaceAfter=2),
 'calltitle':S('calltitle',fontName='Sans-Bold',fontSize=10,leading=13.6,spaceAfter=3),
 'calltext':S('calltext',fontSize=9.4,leading=13.9),
 'q':S('q',fontName='Sans-Bold',fontSize=9.3,leading=13.4,spaceAfter=2),
 'a':S('a',fontSize=9,leading=13.2,textColor=colors.HexColor('#33423a')),
 'num':S('num',fontName='Sans-Bold',fontSize=7.8,leading=10,textColor=GREEN,alignment=1),
 'toc':S('toc',fontSize=9,leading=12.6,spaceBefore=0),
 'tile_n':S('tile_n',fontName='Sans-Bold',fontSize=17,leading=20,textColor=GREEN),
 'tile_l':S('tile_l',fontName='Sans-Bold',fontSize=6.8,leading=8.6,textColor=MUTED),
 'legend':S('legend',fontSize=8.3,leading=11.6,textColor=INK),
 'cover_t':S('cover_t',fontName='Sans-Bold',fontSize=34,leading=39,textColor=colors.white),
 'cover_s':S('cover_s',fontSize=12.5,leading=18,textColor=colors.HexColor('#cfe0d5')),
 'cover_k':S('cover_k',fontName='Sans-Bold',fontSize=8,leading=10,textColor=LIME),
}

def clean(text):
    return str(text).replace('‑','-').replace('–','-').replace('—',' - ').replace(' ',' ').replace('­','')

# ReportLab does not shape Arabic script. The only Arabic in the manuscripts is the source filename
# "taghzieh" (nutrition); it is written in visual order with contextual presentation forms.
SHAPED={'تغذیه':'ﻪﯾﺬﻐﺗ'}

def glyph_safe(escaped):
    out=[]
    for ch in escaped:
        cp=ord(ch)
        if cp<128 or cp in PRIMARY_GLYPHS: out.append(ch)
        elif cp in FALLBACK_GLYPHS: out.append(f'<font name="Fallback">{ch}</font>')
        else: raise ValueError(f'No glyph for U+{cp:04X}')
    return ''.join(out)

def rich(text):
    t=clean(text)
    for word,shaped in SHAPED.items(): t=t.replace(word,shaped)
    t=html.escape(t)
    t=re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',t)
    return glyph_safe(t).replace('\n','<br/>')

def p(text,style='body'): return Paragraph(rich(text),ST[style])

class Kicker(Paragraph):
    """Small tracked label above a heading; ignored by the running-header logic."""
    def __init__(self,text,color=GREEN,style='kicker'):
        st=ParagraphStyle('k',parent=ST[style],textColor=color)
        super().__init__(f'<font>{glyph_safe(html.escape(clean(text).upper()))}</font>',st)
    def draw(self):
        self.canv.saveState()
        super().draw()
        self.canv.restoreState()

class Rule(Flowable):
    """Short accent bar under a section heading."""
    def __init__(self,width=34,height=3,color=LIME,space=10):
        super().__init__(); self.w=width; self.h=height; self.color=color; self.space=space
    def wrap(self,aw,ah): return (self.w,self.h+self.space)
    def draw(self):
        self.canv.setFillColor(self.color); self.canv.roundRect(0,self.space,self.w,self.h,1.5,fill=1,stroke=0)

class FitFigure(Flowable):
    """Framed figure that shrinks (to no less than 62%) to fit the space left on the page, keeping
    `reserve` points for its caption lines, instead of pushing to the next page and leaving a gap."""
    def __init__(self,path,w,h,reserve=64):
        super().__init__(); self.path=path; self.fw=w; self.fh=h; self.reserve=reserve; self.scale=1
    def wrap(self,aw,ah):
        need=self.fh+16
        room=ah-self.reserve
        self.scale=1 if need<=room else max(.62,(room-16)/self.fh) if room-16>=.62*self.fh else 1
        return (aw,self.fh*self.scale+16)
    def draw(self):
        c=self.canv; w,h=self.fw*self.scale,self.fh*self.scale
        c.saveState(); c.setStrokeColor(LINE); c.setLineWidth(.5); c.setFillColor(colors.white)
        c.roundRect(0,0,WIDTH,h+16,4,stroke=1,fill=1)
        c.drawImage(self.path,(WIDTH-w)/2,8,w,h,mask='auto'); c.restoreState()

class ReviewDoc(BaseDocTemplate):
    def __init__(self,path,v):
        super().__init__(str(path),pagesize=A4,leftMargin=MARGIN,rightMargin=MARGIN,topMargin=TOP,bottomMargin=BOTTOM,
                         title=v['title'],author='MED25 - Personal course review',allowSplitting=1)
        self.v=v; self.book_title=clean(v['title']); SourcesBlock.current_doc=self
        self.active=''; self.page_top=''; self.page_has_content=False
        cover=Frame(MARGIN,BOTTOM,WIDTH,PAGE_H*0.52-BOTTOM,id='cover',leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)
        body=Frame(MARGIN,BOTTOM,WIDTH,PAGE_H-TOP-BOTTOM,id='body',leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)
        self.addPageTemplates([PageTemplate(id='cover',frames=cover,onPage=self.cover_page,autoNextPageTemplate='main'),
                               PageTemplate(id='main',frames=body,onPage=self.page_start,onPageEnd=self.page_end)])
    def handle_documentBegin(self):
        self.active=''; self.page_top=''; self.page_has_content=False
        super().handle_documentBegin()
    # Cover ---------------------------------------------------------------
    def cover_page(self,c,doc):
        v=self.v; c.saveState()
        top=PAGE_H*0.52
        c.setFillColor(DEEP); c.rect(0,top,PAGE_W,PAGE_H-top,fill=1,stroke=0)
        c.setFillColor(LIME); c.rect(0,top,PAGE_W,3,fill=1,stroke=0)
        c.setFont('Sans-Bold',15); c.setFillColor(LIME); c.drawString(MARGIN,PAGE_H-62,'MED//25')
        c.setFont('Sans',8); c.setFillColor(colors.HexColor('#9fb8aa')); c.drawRightString(PAGE_W-MARGIN,PAGE_H-60,'TERM 2  ·  REVIEW BOOK')
        y=PAGE_H-150
        for text,style in [('Course review',  'cover_k'),(v['title'],'cover_t'),(v.get('subtitle',''),'cover_s')]:
            if not text: continue
            para=Paragraph(rich(text) if style!='cover_k' else html.escape(text.upper()),ST[style])
            w,h=para.wrap(WIDTH*0.86,400); para.drawOn(c,MARGIN,y-h); y-=h+(10 if style=='cover_k' else 14)
        c.setFont('Sans',8); c.setFillColor(colors.HexColor('#9fb8aa'))
        c.drawString(MARGIN,top+22,'Updated '+clean(v.get('updated','8 September 2026')))
        self.footer(c,doc,cover=True)
        c.restoreState()
    # Running header and footer ---------------------------------------------
    def page_start(self,c,doc):
        self.page_top=self.active; self.page_has_content=False
    def page_end(self,c,doc):
        c.saveState()
        if doc.page>2:
            c.setFont('Sans',7.2); c.setFillColor(MUTED); c.drawString(MARGIN,PAGE_H-34,self.book_title[:60])
            section=clean(self.page_top)
            if section:
                c.setFont('Sans-Bold',7.2); c.setFillColor(GREEN)
                while pdfmetrics.stringWidth(section,'Sans-Bold',7.2)>WIDTH*0.58 and len(section)>8: section=section[:-2].rstrip()+'…' if not section.endswith('…') else section[:-3].rstrip()+'…'
                c.drawRightString(PAGE_W-MARGIN,PAGE_H-34,section)
            c.setStrokeColor(LINE); c.setLineWidth(.5); c.line(MARGIN,PAGE_H-41,PAGE_W-MARGIN,PAGE_H-41)
        self.footer(c,doc)
        c.restoreState()
    def footer(self,c,doc,cover=False):
        c.setStrokeColor(LINE); c.setLineWidth(.5); c.line(MARGIN,34,PAGE_W-MARGIN,34)
        c.setFont('Sans-Bold',7); c.setFillColor(GREEN); c.drawString(MARGIN,22,'MED//25')
        c.setFont('Sans',7); c.setFillColor(MUTED); c.drawString(MARGIN+34,22,'·  Term 2 personal review  ·  not an official exam blueprint')
        if not cover:
            c.setFont('Sans-Bold',7.5); c.setFillColor(INK); c.drawRightString(PAGE_W-MARGIN,22,str(doc.page))
    def afterFlowable(self,flow):
        heading=getattr(flow,'section_key',None)
        # A heading drawn in the top band of the page names that page; otherwise the page
        # continues the section that was active when it began.
        if heading and self.frame._y>PAGE_H-TOP-170: self.page_top=flow.getPlainText()
        if heading:
            title=flow.getPlainText(); self.active=title
            self.canv.bookmarkPage(heading); self.canv.addOutlineEntry(title,heading,0,False)
            self.notify('TOCEntry',(0,getattr(flow,'toc_text',html.escape(title)),self.page,heading))

# Blocks ---------------------------------------------------------------------
def breakable(text,width,font,size):
    """A slash-joined word wider than its column gets a space after the slash, so the line breaks
    there instead of mid-word (ReportLab ignores zero-width spaces)."""
    def fix(m):
        w=m.group(0)
        return w.replace('/','/ ') if pdfmetrics.stringWidth(w,font,size)>width else w
    return re.sub(r'\S*/\S*',fix,str(text))

def table_block(headers,rows,width_ratios=None,split_in_row=True):
    if not headers: return []
    n=len(headers)
    if n==2: widths=[WIDTH*.30,WIDTH*.70]
    elif n==3: widths=[WIDTH*.24,WIDTH*.38,WIDTH*.38]
    elif n==4: widths=[WIDTH*.20,WIDTH*.29,WIDTH*.26,WIDTH*.25]
    else: widths=[WIDTH/n]*n
    if width_ratios:
        if len(width_ratios)!=n or abs(sum(width_ratios)-1)>0.001: raise ValueError('Invalid table width ratios')
        widths=[WIDTH*x for x in width_ratios]
    data=[[Paragraph(glyph_safe(html.escape(clean(h).upper())),ST['th']) for h in headers]]
    for row in rows:
        row=list(row)+['']*max(0,n-len(row))
        data.append([p(breakable(x,widths[i]-14,'Sans-Bold' if i==0 else 'Sans',8.7),'cell1' if i==0 else 'cell') for i,x in enumerate(row[:n])])
    t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT',splitByRow=1,splitInRow=int(split_in_row))
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),HEAD),('VALIGN',(0,0),(-1,-1),'TOP'),
        ('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),
        ('TOPPADDING',(0,0),(-1,0),5.5),('BOTTOMPADDING',(0,0),(-1,0),5),
        ('TOPPADDING',(0,1),(-1,-1),6),('BOTTOMPADDING',(0,1),(-1,-1),6.5),
        ('LINEBELOW',(0,0),(-1,0),.9,GREEN),('LINEBELOW',(0,1),(-1,-1),.4,LINE),
    ]))
    return [t,Spacer(1,11)]

def callout(b):
    label,bar,tint=KINDS.get(b.get('kind','key'),KINDS['key'])
    bar=colors.HexColor(bar); tint=colors.HexColor(tint)
    lab=ParagraphStyle('cl',parent=ST['calllabel'],textColor=bar)
    cell=[Paragraph(html.escape(label.upper()),lab)]
    if b.get('title'): cell.append(p(b['title'],'calltitle'))
    if b.get('text'): cell.append(p(b['text'],'calltext'))
    # One unsplittable cell, so a label and title never strand at a page foot.
    t=Table([[cell]],colWidths=[WIDTH],hAlign='LEFT',splitInRow=0)
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),tint),('LINEBEFORE',(0,0),(0,-1),3,bar),
        ('LEFTPADDING',(0,0),(-1,-1),13),('RIGHTPADDING',(0,0),(-1,-1),13),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),10)]))
    return [t,Spacer(1,10)]

def check_yourself(items):
    label=Paragraph('CHECK YOURSELF',ParagraphStyle('cy',parent=ST['calllabel'],textColor=GREEN,spaceAfter=5))
    rows=[]
    for i,b in enumerate(items,1):
        cell=[p(b.get('question',''),'q'),p(b.get('answer',''),'a')]
        rows.append([[Spacer(1,13),Paragraph(str(i),ST['num'])] if i==1 else Paragraph(str(i),ST['num']),([label] if i==1 else [])+cell])
    # Split between questions only; splitting inside a row can loop forever in ReportLab.
    t=Table(rows,colWidths=[24,WIDTH-24],hAlign='LEFT',splitByRow=1,splitInRow=0)
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),SOFT),('VALIGN',(0,0),(-1,-1),'TOP'),
        ('LEFTPADDING',(0,0),(0,-1),8),('RIGHTPADDING',(0,0),(0,-1),0),('LEFTPADDING',(1,0),(1,-1),6),('RIGHTPADDING',(1,0),(1,-1),13),
        ('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,0),10),('BOTTOMPADDING',(0,-1),(-1,-1),11),
        ('LINEABOVE',(0,1),(-1,-1),.4,LINE),('ROUNDEDCORNERS',[5,5,5,5])]))
    return [t,Spacer(1,11)]

def blocks_for(blocks,volume_id,assets_log,counter):
    result=[]; pending=[]
    def flush():
        if pending: result.extend(check_yourself(list(pending))); pending.clear()
    for b in blocks:
        typ=b.get('type','paragraph')
        if typ=='qa': pending.append(b); continue
        flush()
        if typ=='paragraph': result.append(p(b.get('text','')))
        elif typ=='heading': result.append(p(b.get('text',b.get('title','')),'h2'))
        elif typ=='bullets':
            for x in b.get('items',[]):
                result.append(Paragraph(rich(x),ST['bullet'],bulletText='•'))
            result.append(Spacer(1,3))
        elif typ=='table': result.extend(table_block(b.get('headers',[]),b.get('rows',[]),b.get('widthRatios'),b.get('splitInRow',volume_id!='nutrition')))
        elif typ=='callout': result.extend(callout(b))
        elif typ=='figure':
            source=Path(b['path'])
            if not source.is_absolute(): source=HERE/source
            if not source.exists(): raise FileNotFoundError(f'Missing figure {source}')
            if source.suffix.lower()=='.svg': raise ValueError(f'Raster/PDF extraction required: {source}')
            digest=hashlib.sha256(source.read_bytes()).hexdigest()
            frozen=HERE/'assets'/'frozen'/f'{digest[:16]}{source.suffix.lower()}'
            frozen.parent.mkdir(parents=True,exist_ok=True)
            if not frozen.exists(): shutil.copy2(source,frozen)
            counter['figure']+=1
            inner=WIDTH-16
            probe=Image(str(frozen))
            # Fit the column and maxHeight, but never enlarge a raster below 110 ppi (small sources stay sharp).
            ratio=min(inner/probe.imageWidth,b.get('maxHeight',500)/probe.imageHeight,72/110)
            dw,dh=probe.imageWidth*ratio,probe.imageHeight*ratio
            frame=FitFigure(str(display_copy(frozen,dw)),dw,dh)
            group=[frame,Paragraph(f'<font name="Sans-Bold" color="#126747">Figure {counter["figure"]}</font>&nbsp;&nbsp;'+rich(b.get('caption','')),ST['caption'])]
            if b.get('labels'): group.append(Paragraph('<font name="Sans-Bold">Identify</font>&nbsp;&nbsp;'+rich('; '.join(b['labels'])),ST['small']))
            group.append(Paragraph('Source: '+rich(b.get('source','See section references')),ST['tiny']))
            group.append(Spacer(1,10))
            result.append(KeepTogether(group))
            assets_log.append({'volume':volume_id,'sha256':digest,'path':str(frozen.relative_to(HERE)),'original':str(source),'source':b.get('source'),'caption':b.get('caption')})
        else: raise ValueError(f'Unknown block type: {typ}')
    flush()
    return result

def display_copy(frozen,draw_width,dpi=170):
    """Print-resolution copy of a frozen figure: at most `dpi` at its printed width (never upscaled),
    JPEG when that is under half the PNG size (shaded illustrations, photos, scans), else PNG
    (flat diagrams, transparency). Cached by source name and target width; originals untouched."""
    import io
    from PIL import Image as PILImage
    with PILImage.open(frozen) as im:
        target=min(im.width,round(draw_width/72*dpi))
        base=HERE/'assets'/'display'/f'{frozen.stem}-{target}'
        for ext in ('.jpg','.png'):
            if base.with_suffix(ext).exists(): return base.with_suffix(ext)
        alpha=im.mode in ('RGBA','LA','PA') or (im.mode=='P' and 'transparency' in im.info)
        small=im.convert('RGBA' if alpha else 'RGB')
        if target<im.width: small=small.resize((target,round(im.height*target/im.width)),PILImage.LANCZOS)
        png=io.BytesIO(); small.save(png,'PNG',optimize=True)
        choice=('.png',png.getvalue())
        if not alpha:
            jpg=io.BytesIO(); small.save(jpg,'JPEG',quality=85,optimize=True,progressive=True,subsampling=0)
            if jpg.tell()<png.tell()*0.5: choice=('.jpg',jpg.getvalue())
        base.parent.mkdir(parents=True,exist_ok=True)
        out=base.with_suffix(choice[0]); out.write_bytes(choice[1]); return out

def source_label(src):
    if isinstance(src,str): return src
    title=src.get('title',Path(src.get('path','Source')).name)
    return ' - '.join(str(s) for s in [title,src.get('edition'),src.get('chapter'),src.get('locator'),src.get('url')] if s)

class SourcesBlock(Flowable):
    """Condensed per-section source line. When it is drawn first on a page (its section ended on the
    previous page) a small label naming its section is drawn in the free band above the body frame,
    so the attribution is never ambiguous and the layout does not change."""
    current_doc=None
    def __init__(self,sources,section_title):
        super().__init__()
        self.title=clean(section_title)
        body='&nbsp;&nbsp;·&nbsp;&nbsp;'.join(rich(source_label(x)) for x in sources)
        self.para=Paragraph('<font name="Sans-Bold" color="#5d6b63">SOURCES</font>&nbsp;&nbsp;'+body,ST['tiny'])
    def wrap(self,aw,ah):
        w,h=self.para.wrap(aw,ah); self.h=h+6; return (aw,self.h+2)
    def split(self,aw,ah): return []
    def drawOn(self,canv,x,y,_sW=0):
        frame=getattr(SourcesBlock.current_doc,'frame',None)
        self.at_top=frame is not None and y+self.h+2>=frame._y2-frame._topPadding-14  # a carried spacer (<=11pt) may precede it
        super().drawOn(canv,x,y,_sW)
    def draw(self):
        c=self.canv; c.saveState(); c.setStrokeColor(LINE); c.setLineWidth(.4); c.line(0,self.h,WIDTH,self.h)
        if self.at_top:
            label='Continued from “'+self.title+'”'
            while pdfmetrics.stringWidth(label,'Sans-Bold',6.8)>WIDTH and len(label)>20: label=label[:-3]+'…”'
            c.setFont('Sans-Bold',6.8); c.setFillColor(MUTED); c.drawString(0,self.h+4,label)
        c.restoreState()
        self.para.drawOn(c,0,0)

def sources_line(sources,section_title=''):
    return [SourcesBlock(sources,section_title),Spacer(1,16)]

def section_heading(title,key,kicker,number=None,basis=None):
    h=p(title,'h1'); h.section_key=key
    if number: num=f'<font color="#126747" name="Sans-Bold">{number:02d}</font>&nbsp;&nbsp;&nbsp;'
    elif number==0: num=''
    else: num='<font color="#8a968f" name="Sans-Bold">—</font>&nbsp;&nbsp;&nbsp;'
    h.toc_text=num+rich(title)
    long_basis=bool(basis) and len(basis)>34
    out=[Kicker(kicker+(f'   ·   {basis}' if basis and not long_basis else '')),h,Rule(space=6 if long_basis else 10)]
    if long_basis:
        out.append(Paragraph('<font name="Sans-Bold">Source basis</font>&nbsp;&nbsp;'+rich(basis[0].upper()+basis[1:]),ParagraphStyle('basis',parent=ST['small'],spaceAfter=9)))
    return out

# Cover ------------------------------------------------------------------------
def cover_story(v,stats):
    story=[Spacer(1,26)]
    tiles=[(stats['sections'],'Sections'),(stats['figures'],'Figures'),(stats['checks'],'Self-checks'),(stats['tables'],'Tables')]
    cells=[[Paragraph(str(n),ST['tile_n']),Paragraph(html.escape(label.upper()),ST['tile_l'])] for n,label in tiles]
    t=Table([cells],colWidths=[WIDTH/4]*4,hAlign='LEFT')
    t.setStyle(TableStyle([('LINEBEFORE',(1,0),(-1,-1),.5,LINE),('LEFTPADDING',(0,0),(0,-1),0),('LEFTPADDING',(1,0),(-1,-1),14),('VALIGN',(0,0),(-1,-1),'TOP')]))
    story.extend([t,Spacer(1,20)])
    if v.get('scope'): story.extend([Kicker('Scope'),p(v['scope'],'body'),Spacer(1,8)])
    return story

def reading_page(v,used_kinds,medical):
    out=[Kicker('Before you start'),p('How to read this book','h1'),Rule()]
    rows=[]
    for kind in ['key','trap','uncertain','clinical','lecture']:
        if kind not in used_kinds: continue
        label,bar,tint=KINDS[kind]
        meaning={'key':'The idea to hold on to. Consolidates the section.','trap':'A common wrong answer or transcription error, and the correction.',
                 'uncertain':'Evidence is missing or ambiguous. Check the original before relying on it.','clinical':'Why it matters at the bedside; often a book extension.',
                 'lecture':'Taken directly from the lecture, slides or handwritten notes.'}[kind]
        swatch=Table([['']],colWidths=[20],rowHeights=[14]); swatch.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor(tint)),('LINEBEFORE',(0,0),(0,-1),3,colors.HexColor(bar))]))
        rows.append([swatch,Paragraph(f'<font name="Sans-Bold" color="{bar}">{label}</font>',ST['legend']),Paragraph(meaning,ST['legend'])])
    rows.append([Paragraph('1',ST['num']),Paragraph('<font name="Sans-Bold" color="#126747">Check yourself</font>',ST['legend']),Paragraph('Short retrieval questions with the answer directly below. Cover the answer, then test yourself.',ST['legend'])])
    t=Table(rows,colWidths=[34,110,WIDTH-144],hAlign='LEFT')
    t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),0),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('LINEBELOW',(0,0),(-1,-2),.4,LINE)]))
    out.extend([t,Spacer(1,14)])
    notes=['Lecture-grounded material and book extensions are distinguished in each section’s source line. This is a detailed review of the available sources, not an official exam blueprint.']
    if medical: notes.append('Original labelled figures remain important. Numerical laboratory ranges and procedures depend on the course method and local SOP.')
    notes.append('This physiology-only extract preserves the selected authored sections and their source references. Shared integrated appendices and lecture transcript attachments are not included. Personal study only: original book and lecture illustrations retain their owners’ rights.')
    out.extend(p(n,'small') for n in notes)
    return out

# Volume -------------------------------------------------------------------------
def volume_pdf(v,filename):
    assets=[]; story=[]; counter={'figure':0}
    small_volume=v.get('compactAppendices',len(v.get('sections',[]))<25)
    medical=v['id'] not in {'religion','divine-ethics','public-health','coverage'}
    sections=[s for s in v.get('sections',[]) if s.get('blocks')]
    all_blocks=[b for s in sections for b in s['blocks']]
    stats={'sections':len(sections),'figures':sum(b.get('type')=='figure' for b in all_blocks),
           'checks':sum(b.get('type')=='qa' for b in all_blocks),'tables':sum(b.get('type')=='table' for b in all_blocks)}
    used={b.get('kind','key') for b in all_blocks if b.get('type')=='callout'}
    story.extend(cover_story(v,stats))
    story.append(PageBreak())
    story.extend(reading_page(v,used,medical))
    story.extend([Spacer(1,18),Kicker('In this book'),p('Contents','h1'),Rule()])
    toc=TableOfContents(); toc.levelStyles=[ST['toc']]; toc.dotsMinLevel=0
    toc.tableStyle=TableStyle([('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),('TOPPADDING',(0,0),(-1,-1),1.5),('BOTTOMPADDING',(0,0),(-1,-1),1.5),('VALIGN',(0,0),(-1,-1),'TOP')])
    story.extend([toc,PageBreak()])
    seen=set()
    # Some manuscripts already number their titles ("02 / Nutrients..."); do not number them twice.
    numbered=sum(bool(re.match(r'^\d+\s*/',s['title'])) for s in sections)>len(sections)/2
    for i,s in enumerate(sections,1):
        key=s.get('id',str(i))
        if key in seen: raise ValueError(f'Duplicate section id {key}')
        seen.add(key)
        story.append(CondPageBreak(170))
        prefix=section_heading(s['title'],f'{v["id"]}-{key}',f'Section {i:02d}' if not numbered else '',i if not numbered else 0,s.get('basis','see sources'))
        body=blocks_for(s['blocks'],v['id'],assets,counter)
        if s['blocks'][0]['type']=='figure' and isinstance(body[0],KeepTogether):
            # Keep heading and opening figure together (a nested KeepTogether can strand the heading).
            opening=body.pop(0)
            for f in opening._content:
                if isinstance(f,FitFigure): f.reserve+=110
            story.append(KeepTogether(prefix+opening._content))
        else: story.extend(prefix)
        story.extend(body)
        if s.get('sources'):
            src=sources_line(s['sources'],s['title'])
            last=story[-1] if story and not isinstance(story[-1],Spacer) else (story[-2] if len(story)>1 else None)
            short=isinstance(last,Paragraph) or (isinstance(last,Table) and len(last._cellvalues)<=2)
            if short and last is not story[-1]:
                tail=[story.pop(-2),story.pop()]  # last block and its spacer
                story.append(KeepTogether(tail+src[:1])); story.append(src[1])
            elif short:
                story.append(KeepTogether([story.pop()]+src[:1])); story.append(src[1])
            else: story.extend(src)
    appendix=iter('ABCDEFG')
    def appendix_head(title,key):
        return [CondPageBreak(200) if small_volume else PageBreak()]+section_heading(title,f'{v["id"]}-{key}',f'Appendix {next(appendix)}')
    if v.get('gaps'):
        story.extend(appendix_head('Coverage limits and next sources','gaps'))
        story.extend(Paragraph(rich(x if isinstance(x,str) else json.dumps(x,ensure_ascii=False)),ST['bullet'],bulletText='•') for x in v['gaps'])
    transcripts=[]
    for name in sorted(set(v.get('transcriptFiles',[]))):
        src=Path(name)
        if not src.is_absolute(): src=HERE/src
        if not src.exists(): src=HERE/'transcripts'/v['id']/src.name
        if not src.exists(): raise FileNotFoundError(f'Missing transcript {src}')
        dest=HERE/'transcripts'/v['id']/src.name; dest.parent.mkdir(parents=True,exist_ok=True)
        if dest.exists() and src.resolve()!=dest.resolve() and src.read_bytes()!=dest.read_bytes():
            dest=dest.with_name(hashlib.sha256(src.read_bytes()).hexdigest()[:8]+'-'+src.name)
        if src.resolve()!=dest.resolve(): shutil.copy2(src,dest)
        transcripts.append((src,dest))
    if transcripts:
        story.extend(appendix_head('Lecture transcript archive','transcripts'))
        story.append(p('The full original files are embedded in this PDF. Open the attachments panel in a reader that supports it, or use _build/transcripts in the source folder. These are uncorrected source records, not an answer key.','body'))
        story.extend(two_column([src.name for src,_ in transcripts]))
    srcs=sorted(set(v.get('sourceFiles',[])))
    if srcs:
        story.extend([CondPageBreak(v.get('sourceInventoryMinimumSpace',200)) if small_volume else PageBreak()]+section_heading('Local source inventory',f'{v["id"]}-source-inventory',f'Appendix {next(appendix)}'))
        story.append(p('Exact paths and source hashes are stored in _build/source-manifest.json. Section source lines distinguish original evidence from book additions.','small'))
        story.extend(two_column([v.get('sourceDisplayNames',{}).get(x,Path(x).name) for x in srcs]))
    target=OUT/filename; draft=HERE/'qa'/f'{v["id"]}-unattached.pdf'; draft.parent.mkdir(exist_ok=True)
    doc=ReviewDoc(draft,v); doc.multiBuild(story,maxPasses=6)
    assert not transcripts, 'This isolated variant does not embed integrated transcript archives'
    shutil.copyfile(draft,target)
    check=PdfReader(target); count=len(check.pages)
    text_count=0; issues=[]
    for n,page in enumerate(check.pages):
        text=page.extract_text(); text_count+=len(text.split())
        if '�' in text or '■' in text: issues.append({'page':n+1,'issue':'replacement or black-square character'})
    with pdfplumber.open(target) as layout:
        for n,page in enumerate(layout.pages):
            for char in page.chars:
                if char['x0']<28 or char['x1']>PAGE_W-27 or char['top']<4 or char['bottom']>PAGE_H-4:
                    issues.append({'page':n+1,'issue':'text outside safe page bounds','text':char['text']})
    toc=check.outline
    report={'id':v['id'],'title':v['title'],'file':str(target),'pages':count,'words':text_count,'sections':len(v.get('sections',[])),'figures':len(assets),'transcriptAttachments':len(transcripts),'bookmarks':len(toc),'design':'v2-2026-09-23','mechanicalIssues':issues,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
    (HERE/'qa'/f'{v["id"]}.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    (HERE/'qa'/f'{v["id"]}-assets.json').write_text(json.dumps(assets,ensure_ascii=False,indent=2))
    print(json.dumps({k:report[k] for k in ['id','pages','figures','bookmarks','sha256']}|{'issues':len(issues),'MB':round(target.stat().st_size/1048576,1)},ensure_ascii=False))
    return report

def two_column(names):
    half=(len(names)+1)//2; cols=[names[:half],names[half:]]
    rows=[[Paragraph(rich(cols[0][i]),ST['small']) if i<len(cols[0]) else '',Paragraph(rich(cols[1][i]),ST['small']) if i<len(cols[1]) else ''] for i in range(half)]
    t=Table(rows,colWidths=[WIDTH/2,WIDTH/2],hAlign='LEFT',splitByRow=1)
    t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),1),('BOTTOMPADDING',(0,0),(-1,-1),1)]))
    return [t]
