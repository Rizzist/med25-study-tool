import type {MCQMedia,MCQQuestion} from '../mcq/types';
import {layoutCalloutBadges} from '../anatomy3d/callout-layout.mjs';
import {denyStudySession} from '../../../public/med25-auth-cache.mjs';
import {isPaperLocation,type PracticeFigure,type PracticeFigures} from './document';

/** Match the unanswered website: mask labels, never print answer-revealing captions. */
export function practiceImagePlan(q:MCQQuestion,m:MCQMedia){
  const regions=m.annotations??[];
  const masks=m.practicalCase?m.practicalCase.masks??[]:m.labelMasks??[];
  const markers=m.practicalCase?[]:q.kind==='dynamic_anatomy'
    ?regions.flatMap((a,i)=>isPaperLocation(q)?[{...a,text:String(i+1)}]:a.id===q.anatomy?.targetRegionId?[{...a,text:'A'}]:[])
    :regions.map((a,i)=>({...a,text:/^[A-Z0-9]{1,3}$/.test(a.label)?a.label:String.fromCharCode(65+i)}));
  return {masks,markers};
}
async function figure(q:MCQQuestion,m:MCQMedia):Promise<PracticeFigure>{
  const src=m.url??`/api/media?${new URLSearchParams({questionId:q.id,mediaId:m.id})}`;
  const url=new URL(src,location.origin);
  if(!['http:','https:'].includes(url.protocol))throw new Error(`Unsupported media URL for ${q.id}.`);
  if(m.type!=='image')return {link:url.href,label:`Play ${m.type} for question (online access required)`};
  const response=await fetch(url.href);
  if(response.status===401||response.status===403)throw denyStudySession();
  if(!response.ok)throw new Error(`The image for ${q.id} could not load. Reconnect and retry; no incomplete PDF was saved.`);
  const blob=await response.blob(),image=await createImageBitmap(blob);
  try{
    const scale=Math.min(1,1600/Math.max(image.width,image.height));
    const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image export is unavailable in this browser.');
    const w=canvas.width,h=canvas.height;
    ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(image,0,0,w,h);
    const {masks,markers}=practiceImagePlan(q,m);
    ctx.fillStyle='#fff';for(const mask of masks)ctx.fillRect(mask.x*w,mask.y*h,mask.width*w,mask.height*h);
    // Lay markers out at print scale, then draw at image resolution for crisp, readable badges.
    const factor=Math.max(w/495,h/280),pw=w/factor,ph=h/factor;
    const badges=layoutCalloutBadges(markers,pw,ph);
    badges.forEach((badge,i)=>{
      const x=badge.x*factor,y=badge.y*factor,r=badge.size*factor/2;
      ctx.strokeStyle='#126747';ctx.lineWidth=1.2*factor;ctx.beginPath();ctx.moveTo(badge.anchorX*factor,badge.anchorY*factor);ctx.lineTo(x,y);ctx.stroke();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle='#172a22';ctx.font=`bold ${10*factor}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(markers[i].text,x,y);
    });
    return {image:canvas.toDataURL('image/jpeg',.9)};
  }finally{image.close();}
}
export async function preparePracticeFigures(questions:MCQQuestion[],progress?:(text:string)=>void):Promise<PracticeFigures>{
  const result:PracticeFigures={};
  const withMedia=questions.filter(q=>q.media?.length);
  for(const [index,q] of withMedia.entries()){
    progress?.(`Preparing figures ${index+1}/${withMedia.length}…`);
    result[q.id]=[];
    for(const m of q.media??[])result[q.id].push(await figure(q,m));
  }
  return result;
}
