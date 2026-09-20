"use client";
/* eslint-disable @next/next/no-img-element -- source media must preserve exact image geometry */
import {AnatomyImage} from './AnatomyImage';
import {PracticalCaseFigure} from './PracticalCaseFigure';
import type {MCQQuestion,MCQMedia} from '@/src/lib/mcq/types';
import {useState} from 'react';

function MediaItem({question,media,review=false,...location}:Props&{media:MCQMedia}) {
  const [failed,setFailed]=useState(false);
  const src=media.url??'/api/media?'+new URLSearchParams({questionId:question.id,mediaId:media.id});
  if(failed)return <p className="session-error" role="alert">The question media could not load. Reconnect or skip this question; do not guess from a missing figure.</p>;
  if(media.type==='image'&&question.kind==='dynamic_anatomy')return <AnatomyImage question={question} media={media} src={src} revealed={review} {...location}/>;
  if(media.type==='image'&&media.practicalCase)return <PracticalCaseFigure item={media.practicalCase} src={src} revealed={review}/>;
  return <figure className="mcq-media">
    {media.type==='audio'?<audio controls preload="none" src={src} onError={()=>setFailed(true)} aria-label={media.alt}/>:
    media.type==='video'?<video controls playsInline preload="none" src={src} onError={()=>setFailed(true)} aria-label={media.alt}/>:
    <div className="mcq-image-stage"><img src={src} alt={review?media.alt:'Source image for this question; interpret it before answering.'} onError={()=>setFailed(true)}/>{!review&&media.labelMasks?.map((m,i)=><span key={i} className="source-label-mask" style={{left:m.x*100+'%',top:m.y*100+'%',width:m.width*100+'%',height:m.height*100+'%'}}/>) }{media.annotations?.map((a,i)=><span key={a.id} className="mcq-image-marker" aria-label={review?a.label:`Marker ${/^[A-Z0-9]{1,3}$/.test(a.label)?a.label:String.fromCharCode(65+i)}`} style={{left:a.x*100+'%',top:a.y*100+'%',width:a.width*100+'%',height:a.height*100+'%'}}><b>{review?a.label:/^[A-Z0-9]{1,3}$/.test(a.label)?a.label:String.fromCharCode(65+i)}</b></span>)}</div>}
    {review&&<figcaption>{media.caption} {media.attribution}{media.transcript&&<details><summary>Transcript</summary><p>{media.transcript}</p></details>}</figcaption>}
  </figure>;
}
type Props={question:MCQQuestion;review?:boolean;onLocationSubmit?:(id?:string)=>void;locationAnswered?:boolean;savedRegionId?:string};
export function QuestionMedia(props:Props) {
  if(props.question.kind==='dynamic_anatomy_3d')return <p className="session-error">Archived 3D question. Its saved answer is preserved; new practice uses 2D source images instead.</p>;
  return <>{props.question.media?.map(media=><MediaItem {...props} key={props.question.id+'-'+media.id} media={media}/>)}</>;
}
