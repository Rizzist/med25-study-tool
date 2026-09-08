// Display-only badge layout. Source annotation bounds and scoring IDs never move.
export function layoutCalloutBadges(regions,width,height){
  if(!width||!height)return [];
  const size=Math.min(22,Math.max(16,width/35)),gap=3,step=size+gap;
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const placed=[];
  return regions.map(region=>{
    const anchorX=(region.x+region.width/2)*width,anchorY=(region.y+region.height/2)*height;
    const origin={x:clamp(anchorX,size/2,width-size/2),y:clamp(anchorY,size/2,height-size/2)};
    let best;
    // Nearby slots first; fall back to a bounded grid for dense source keys.
    const candidates=[];
    for(let dy=-8;dy<=8;dy++)for(let dx=-3;dx<=3;dx++)candidates.push({x:clamp(origin.x+dx*step,size/2,width-size/2),y:clamp(origin.y+dy*step,size/2,height-size/2)});
    candidates.sort((a,b)=>(a.x-anchorX)**2+(a.y-anchorY)**2-((b.x-anchorX)**2+(b.y-anchorY)**2));
    const free=c=>placed.every(other=>Math.abs(c.x-other.x)>=size+gap||Math.abs(c.y-other.y)>=size+gap);
    best=candidates.find(free);
    if(!best)for(let y=size/2;y<=height-size/2&&!best;y+=step)for(let x=size/2;x<=width-size/2&&!best;x+=step)if(free({x,y}))best={x,y};
    best??=origin;
    const badge={id:region.id,...best,size,anchorX,anchorY};placed.push(badge);return badge;
  });
}
