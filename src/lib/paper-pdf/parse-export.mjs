// Parses the generated past-paper Markdown exports (questions, answer key, or both)
// into questions, options and keys. The exports are machine generated with a stable
// shape: "# Title", intro paragraphs, "Collection ID:" / "Course:" lines,
// "## Original sources" bullets, "## Questions" and "## Answer key and provenance"
// with "### N · id" blocks. Shared by the browser PDF generator and the tests.

/** @typedef {{number:string;id:string;paragraphs:string[];options:Array<{letter:string;text:string}>;fields:Record<string,string>}} ExportBlock */
/** @typedef {{title:string;intro:string[];meta:Record<string,string>;sources:Array<{name:string;url:string;note:string}>;questions:ExportBlock[];keys:ExportBlock[];keyIntro:string[]}} ParsedExport */

const FIELD=/^(Source|Key|Key provenance|Provenance note|Existing answer note|Question source|Note|Original figure|Image|Figure|Status):\s*(.*)$/;

/** @param {string} markdown @returns {ParsedExport} */
export function parseExport(markdown) {
  const lines=String(markdown).replace(/\r/g,'').split('\n');
  /** @type {ParsedExport} */
  const doc={title:'',intro:[],meta:{},sources:[],questions:[],keys:[],keyIntro:[]};
  let section='intro';
  /** @type {ExportBlock|null} */
  let block=null;
  let paragraph=[];
  const flushParagraph=()=>{
    if(!paragraph.length)return;
    const text=paragraph.join(' ').trim();
    if(text)(block?block.paragraphs:section==='keys'?doc.keyIntro:doc.intro).push(text);
    paragraph=[];
  };
  const startBlock=(heading)=>{
    flushParagraph();
    const m=heading.match(/^###\s+(\S+)\s+·\s+(.*)$/);
    block={number:m?m[1]:heading.replace(/^###\s*/,''),id:m?m[2].trim():'',paragraphs:[],options:[],fields:{}};
    (section==='keys'?doc.keys:doc.questions).push(block);
  };
  for(const raw of lines){
    const line=raw.trimEnd();
    if(line.startsWith('# ')&&!doc.title){doc.title=line.slice(2).trim();continue;}
    if(line.startsWith('## ')){
      flushParagraph();block=null;
      const name=line.slice(3).trim().toLowerCase();
      section=name.startsWith('original sources')?'sources':name.startsWith('questions')?'questions':name.startsWith('answer key')?'keys':'intro';
      continue;
    }
    if(line.startsWith('### ')){startBlock(line);continue;}
    if(!line.trim()){flushParagraph();continue;}
    if(section==='sources'&&line.startsWith('- ')){
      const m=line.slice(2).match(/^(.*?):\s+(\/\S+)(?:\s+—\s+(.*))?$/);
      doc.sources.push(m?{name:m[1],url:m[2],note:m[3]??''}:{name:line.slice(2),url:'',note:''});
      continue;
    }
    if(section==='intro'){const m=line.match(/^(Collection ID|Course):\s*(.*)$/);if(m){doc.meta[m[1]]=m[2].trim();continue;}}
    if(block){
      const option=line.match(/^([A-F])\.\s+(.*)$/);
      if(option&&section==='questions'){flushParagraph();block.options.push({letter:option[1],text:option[2]});continue;}
      const field=line.match(FIELD);
      if(field){flushParagraph();block.fields[field[1]]=field[2].trim();continue;}
    }
    paragraph.push(line.trim());
  }
  flushParagraph();
  // Combined exports repeat the source list once per part; keep each source once.
  const seen=new Set();
  doc.sources=doc.sources.filter(src=>{const key=src.name+'|'+src.url;if(seen.has(key))return false;seen.add(key);return true;});
  return doc;
}

/** Splits "Key: D — text" into its letter and text. @param {ExportBlock} block */
export function keyOf(block) {
  const key=block.fields.Key??'';
  const m=key.match(/^([A-F])(?:\s+[—–-]\s+(.*))?$/);
  return m?{letter:m[1],text:m[2]??''}:{letter:'',text:key};
}
