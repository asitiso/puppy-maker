export type HomeAmbientBehavior={
  anchorId:string;
  pose:string;
  motion:string;
  tag:string;
};

export type CompanionAmbientBehavior={
  anchorBias:'near'|'watch'|'forward'|'prop';
  motion:string;
  tag:string;
};

function stableHash(parts:readonly string[]):number{
  let hash=2166136261;
  for(const part of parts){
    for(let index=0;index<part.length;index+=1){
      hash^=part.charCodeAt(index);
      hash=Math.imul(hash,16777619);
    }
  }
  return hash>>>0;
}

export function resolveHomeAmbientBehavior(input:{
  condition?:string;
  personality?:string;
  year:number;
  month:number;
  week:number;
}):HomeAmbientBehavior{
  const condition=input.condition?.trim().toLowerCase()??'';
  if(condition==='tired'){
    return {anchorId:'bed',pose:'tired',motion:'idle',tag:'ambient:resting'};
  }
  if(condition==='focused'){
    return {anchorId:'desk',pose:'focused',motion:'turn',tag:'ambient:focused'};
  }

  const anchors=['runa','desk','world_map'] as const;
  const motions=['idle','turn','bob'] as const;
  const seed=stableHash([
    String(input.year),String(input.month),String(input.week),
    input.personality?.trim().toLowerCase()??'neutral',condition||'steady',
  ]);
  const index=seed%anchors.length;
  const personality=input.personality?.trim().toLowerCase();
  return {
    anchorId:anchors[index],
    pose:personality==='curious'?'curious':'idle',
    motion:motions[index],
    tag:`ambient:${anchors[index]}`,
  };
}

export function resolveCompanionAmbient(input:{
  actorId:'bear'|'owl'|'wolf'|'cat';
  bondLevel:number;
}):CompanionAmbientBehavior{
  const role={
    bear:{anchorBias:'near',motion:'bob'},
    owl:{anchorBias:'watch',motion:'turn'},
    wolf:{anchorBias:'forward',motion:'approach'},
    cat:{anchorBias:'prop',motion:'hop'},
  } as const;
  const base=role[input.actorId];
  const bondBand=Number.isFinite(input.bondLevel)&&input.bondLevel>=4?'close':'steady';
  return {...base,tag:`companion:${input.actorId}:${bondBand}`};
}
