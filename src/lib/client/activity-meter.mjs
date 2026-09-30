export const IDLE_MS=120_000;
export const REPORT_INTERVAL_MS=300_000;
/** Counts foreground time up to two minutes after the most recent interaction.
 * Events are signals only: no key values, answer text, URLs or coordinates. */
export function createActivityMeter({now=()=>performance.now(),active=true}={}){
  let markedAt=now(),lastInteraction=markedAt,activeMs=0;
  function advance(){const at=Math.max(markedAt,now());if(active)activeMs+=Math.max(0,Math.min(at,lastInteraction+IDLE_MS)-markedAt);markedAt=at;}
  return {
    interact(){advance();lastInteraction=markedAt;},
    setActive(value){advance();active=value;if(active)lastInteraction=markedAt;},
    snapshot(){advance();return Math.floor(activeMs);},
  };
}
