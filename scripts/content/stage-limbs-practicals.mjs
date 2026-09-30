import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'../..'),scratch='/tmp/med25-limbs-import';
const read=p=>JSON.parse(fs.readFileSync(p));
const definitions=[
 {name:'practical2022',figures:'2022',id:'limbs-mixed-practical-2022',title:'Upper & lower limb practical · 22 January 2022 (filename)',source:['more',1],keys:'-BCBABDBBACABCACDCCA',sections:[26,23,29,30,35,30,30,28,39,22,20,14,14,8,18,16,20,9,19,15],note:'20 source prompts, with 19 original figures. Q1 has no figure in the downloaded report and is not graded. The date comes from the filename. Source cadaveric photographs are preserved, not replaced by substitute anatomy.',notes:[
 'The downloaded source omits the figure. It marks rectus femoris/sartorius, but the missing arrows cannot be reconstructed honestly; retained for reference only.',
 'The arrow points to the anterior distal femoral patellar surface, not the posterior intercondylar fossa.',
 'The indicated superficial nerve emerges in the distal anterolateral leg and branches over the dorsum: superficial fibular nerve.',
 'The medial long extensor is EHL; the artery beside it on the dorsum is dorsalis pedis.',
 'The indicated nerve is deep fibular; the larger medial anterior-leg muscle is tibialis anterior.',
 'The medial leg pairing is great saphenous vein with saphenous nerve. The source incorrectly prints lesser saphenous in the intended choice B; the study choice explicitly corrects that one word.',
 'The arrow indicates lateral circumflex femoral artery in the proximal anterior thigh.',
 'The indicated large vessel pair is femoral artery and femoral vein; nerve lies lateral and is not the green-marked vessel.',
 'Posterior to medial malleolus, tibialis posterior precedes FDL. The red and green arrows indicate those two tendons respectively.',
 'The arrow is at AIIS just above the acetabulum.',
 'The dorsal radial wrist nerve is the superficial radial branch.',
 'The arrow identifies FCU on the ulnar border of the anterior forearm.',
 'The oblique proximal anterior-forearm muscle is pronator teres.',
 'The labeled terminal nerves are musculocutaneous, median and ulnar in A–B–C order. Original “medial” wording means median here.',
 'The arrow identifies flexor pollicis brevis in the thenar region.',
 'The highlighted proximal radial carpal is scaphoid.',
 'The nerve following the spiral/radial groove is radial nerve.',
 'The vein in the deltopectoral groove is cephalic.',
 'The oblique superficial connection across the cubital region is median cubital vein.',
 'The arrow indicates the extensor digitorum tendon group on the hand dorsum.'
 ]},
 {name:'practical2021',figures:'2021',id:'limbs-upper-practical-2021',title:'Upper limb practical · report dated 17 April 2021',source:['more',2],region:'upper',keys:'ACDBCB BDBCAD'.replaceAll(' ',''),sections:[6,19,18,20,15,4,6,11,12,14,17,4],note:'TUMS TestId 19702; 12 original spotters across 18 report pages. The report date is not independently verified as the exam sitting date. Short Persian “question” headings are rendered as “Identify the indicated structure”.',notes:[
 'The probe indicates the spool-shaped humeral trochlea.',
 'The green-highlighted superficial palmar arch is the intended structure. The source choice calls it “palmar superficial carpal artery”; the study wording makes the intended arch explicit.',
 'The first dorsal interosseous occupies the first web space between thumb and index metacarpals.',
 'The ulnar nerve is at the ulnar side of the distal anterior forearm.',
 'The isolated deep extensor tendon to index belongs to extensor indicis.',
 'The probe is above the scapular spine in the supraspinous fossa.',
 'The probe indicates the medial epicondyle of humerus.',
 'The reflected anterior axillary fold muscle is pectoralis major.',
 'The lateral long-head biceps belly is indicated; its proximal tendon arises from the supraglenoid/labral region.',
 'FCU tendon lies at the ulnar border approaching the pisiform.',
 'The transverse band on the dorsal wrist is the extensor retinaculum.',
 'The probe indicates the flattened lateral/acromial clavicular end.'
 ]},
 {name:'lowerpractical2021',figures:'lower2021',id:'limbs-lower-practical-2021',title:'Lower limb practical · report dated 17 April 2021',source:['extra',5],region:'lower',keys:'BCDC DDACBA CCDA'.replaceAll(' ',''),sections:[23,26,35,29,27,38,30,40,40,27,37,31,28,25],note:'TUMS TestId 20375; 14 original image questions over 15 pages. Report dated 17 April 2021, not independent sitting-date evidence.',notes:[
 'The arrow indicates the posterior femoral linea aspera.',
 'The central superficial bipennate quadriceps belly indicated is rectus femoris, not the more lateral vastus lateralis.',
 'Fibularis longus runs behind lateral malleolus and crosses the sole; the source probe indicates its tendon.',
 'The nerve descending in the medial adductor compartment is obturator nerve.',
 'Pectineus forms the medial part of the proximal femoral-triangle floor.',
 'The indicated Y-shaped band on the anterior ankle is inferior extensor retinaculum.',
 'The deep branch descending behind adductor longus is profunda femoris/deep femoral artery.',
 'The purple slender structures arise from FDL tendons and pass medially to toes 2–5: lumbricals.',
 'The short dorsal toe-extensor muscle is extensor digitorum brevis.',
 'The long narrow muscle along medial thigh is gracilis.',
 'The arrow indicates medial cuneiform at the base of the first metatarsal.',
 'The anterior proximal tibial prominence is the tibial tuberosity.',
 'The large vein medial to femoral artery is femoral vein.',
 'The proximal lateral thigh muscle blending into IT tract is tensor fasciae latae.'
 ]}
];
for(const d of definitions){
 let rows=read(`${scratch}/${d.name}-rows.json`);
 if(d.name==='practical2021'){
  const last=rows[9],all=last.options;last.options=all.slice(0,4);
  rows.push({number:11,sourceNumber:'11',page:16,prompt:'Identify the indicated structure.',options:all.slice(4,8),providedKey:'A'}, {number:12,sourceNumber:'12',page:17,prompt:'Identify the indicated structure.',options:all.slice(8,12),providedKey:'D'});
 }
 assert.equal(rows.length,d.keys.length);assert.equal(rows.length,d.sections.length);assert.equal(rows.length,d.notes.length);
 const figures=read(`${scratch}/figures${d.figures}/images.json`).sort((a,b)=>Number(a.name.match(/(?:Im|X)(\d+)/)[1])-Number(b.name.match(/(?:Im|X)(\d+)/)[1]));
 assert.equal(figures.length,rows.length-(d.name==='practical2022'?1:0));
 const questions=rows.map((q,i)=>{
  const f=figures[i-(d.name==='practical2022'?1:0)];
  let media;
  if(f){const mediaPath=`limbs/figures/${d.id}/q${String(q.number).padStart(3,'0')}${path.extname(f.path)}`,dest=path.join(root,'public/study',mediaPath);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(f.path,dest);media={path:mediaPath,alt:`Original unlabeled anatomy figure for question ${q.number}`,width:f.width,height:f.height};}
  return {...q,prompt:d.name==='practical2021'?'Identify the indicated structure in the original figure.':q.prompt,sectionOrder:d.sections[i],key:d.keys[i]==='-'?null:d.keys[i],note:d.notes[i],region:d.region??(q.number<=10?'lower':'upper'),subject:'anatomy',...(media?{media}:{})};
 });
 if(d.name==='practical2022'){
  const q=questions[5];q.sourceOptions=[...q.options];q.options[1]='Red arrow to great saphenous vein and green to saphenous nerve';
 }
 if(d.name==='practical2021'){
  const q=questions[1];q.sourceOptions=[...q.options];q.options[2]='Superficial palmar arterial arch (source: “Palmar superficial carpal artey”)';
 }
 const result={id:d.id,title:d.title,kind:'dated-paper',defaultEligible:true,note:d.note,originalFiles:[read(`${scratch}/${d.source[0]}.json`)[d.source[1]-1]],questions,excludedItems:[],audit:{status:'reviewed',method:'Embedded original figures extracted without source answer ticks; visual identification compared with course regional anatomy.'}};
 fs.writeFileSync(path.join(root,'data/limbs/imports',d.id+'.json'),JSON.stringify(result,null,2)+'\n');console.log(d.id,questions.length);
}
