import type {LocationId,Season,Weather} from './scene-types';

type Point=readonly [number,number];

export type SceneRecipe={
  location:LocationId;
  composition:string;
  camera:{
    focalPoint:Point;
    horizon:number;
    zoom:number;
  };
  actor:{
    x:number;
    y:number;
    scale:number;
    facing:'left'|'right'|'front';
  };
  depth:{
    background:string;
    midground:string;
    foreground:string;
  };
  props:readonly string[];
  interactionSkin:string;
  chrome:{
    material:string;
    position:'top'|'bottom'|'edge';
  };
  lighting:string;
  ambient:string;
  compact:{
    actorScale:number;
    focalPoint:Point;
    simplifyProps:readonly string[];
  };
};

export type SceneRecipeInput={
  location:LocationId;
  season?:Season;
  weather?:Weather;
  worldFacts?:readonly string[];
  presentationTags?:readonly string[];
};

export type ResolvedSceneRecipe=Omit<SceneRecipe,'props'>&{props:readonly string[]};

export const SCENE_RECIPES:Record<LocationId,SceneRecipe>={
  home:{
    location:'home',composition:'lived-in-room',camera:{focalPoint:[50,54],horizon:42,zoom:1},actor:{x:50,y:67,scale:1,facing:'front'},
    depth:{background:'room-window',midground:'desk-wardrobe',foreground:'bedside-rug'},props:['bed','desk','wardrobe','window-light'],
    interactionSkin:'contextual-room',chrome:{material:'warm-wood',position:'edge'},lighting:'window-warmth',ambient:'home-dust-motes',
    compact:{actorScale:.9,focalPoint:[50,57],simplifyProps:['wardrobe']},
  },
  training_ground:{
    location:'training_ground',composition:'target-lane',camera:{focalPoint:[59,58],horizon:47,zoom:.94},actor:{x:26,y:70,scale:.92,facing:'right'},
    depth:{background:'training-yard',midground:'target-line',foreground:'grass-dust'},props:['target-dummy','weapon-rack','ground-lines'],
    interactionSkin:'target-hud',chrome:{material:'field-metal',position:'bottom'},lighting:'outdoor-hard',ambient:'training-dust',
    compact:{actorScale:.82,focalPoint:[62,59],simplifyProps:['weapon-rack']},
  },
  magic_classroom:{
    location:'magic_classroom',composition:'ritual-chamber',camera:{focalPoint:[55,53],horizon:44,zoom:.98},actor:{x:31,y:70,scale:.86,facing:'right'},
    depth:{background:'arcane-arches',midground:'rune-circle',foreground:'books-crystals'},props:['rune-circle','spell-books','crystals','candles','rune-sockets'],
    interactionSkin:'rune-socket',chrome:{material:'etched-arcane',position:'bottom'},lighting:'violet-rune-glow',ambient:'floating-motes',
    compact:{actorScale:.78,focalPoint:[57,55],simplifyProps:['candles','spell-books']},
  },
  herb_garden:{
    location:'herb_garden',composition:'greenhouse-workbench',camera:{focalPoint:[55,56],horizon:43,zoom:.97},actor:{x:31,y:71,scale:.88,facing:'right'},
    depth:{background:'greenhouse-glass',midground:'workbench-beds',foreground:'leaf-frame'},props:['specimen-card','field-notes','plant-pots','foreground-leaves'],
    interactionSkin:'botany-tag',chrome:{material:'paper-label',position:'bottom'},lighting:'soft-greenhouse',ambient:'leaf-sway',
    compact:{actorScale:.8,focalPoint:[56,58],simplifyProps:['plant-pots']},
  },
  forest:{
    location:'forest',composition:'deep-path',camera:{focalPoint:[59,54],horizon:40,zoom:.93},actor:{x:28,y:72,scale:.88,facing:'right'},
    depth:{background:'distant-path',midground:'forest-floor',foreground:'tree-trunks'},props:['trail-marks','old-tree','wild-herbs','path-stones'],
    interactionSkin:'exploration-marker',chrome:{material:'trail-map',position:'edge'},lighting:'canopy-dapple',ambient:'forest-breeze',
    compact:{actorScale:.78,focalPoint:[61,57],simplifyProps:['old-tree']},
  },
  village:{
    location:'village',composition:'street-plaza',camera:{focalPoint:[58,54],horizon:43,zoom:.95},actor:{x:31,y:73,scale:.88,facing:'right'},
    depth:{background:'village-street',midground:'stalls-signs',foreground:'street-edge'},props:['shop-sign','performance-banner','repair-sign','alley-lantern'],
    interactionSkin:'street-sign',chrome:{material:'painted-sign',position:'edge'},lighting:'warm-street',ambient:'market-motion',
    compact:{actorScale:.79,focalPoint:[60,57],simplifyProps:['performance-banner']},
  },
  lakeside:{
    location:'lakeside',composition:'wide-horizon',camera:{focalPoint:[59,47],horizon:38,zoom:.88},actor:{x:30,y:72,scale:.73,facing:'right'},
    depth:{background:'lake-horizon',midground:'water-ripples',foreground:'reeds'},props:['ripples','reeds','shore-stones','wind-lines'],
    interactionSkin:'quiet-ripple',chrome:{material:'translucent-water',position:'edge'},lighting:'open-sunset',ambient:'lake-wind',
    compact:{actorScale:.7,focalPoint:[60,51],simplifyProps:['shore-stones']},
  },
  old_shrine:{
    location:'old_shrine',composition:'symmetric-altar',camera:{focalPoint:[60,43],horizon:45,zoom:.94},actor:{x:32,y:74,scale:.72,facing:'right'},
    depth:{background:'shrine-gate',midground:'central-altar',foreground:'stone-threshold'},props:['altar','inscription','guardian-light','offering-stones'],
    interactionSkin:'inscription-seal',chrome:{material:'aged-stone',position:'edge'},lighting:'guardian-moonlight',ambient:'shrine-embers',
    compact:{actorScale:.68,focalPoint:[60,47],simplifyProps:['offering-stones']},
  },
  expedition_field:{
    location:'expedition_field',composition:'expedition-route',camera:{focalPoint:[59,54],horizon:42,zoom:.92},actor:{x:27,y:72,scale:.84,facing:'right'},
    depth:{background:'expedition-skyline',midground:'route-camp-ruin',foreground:'gear-and-terrain'},props:['camp-tent','route-map','field-gear','ruin-marker'],
    interactionSkin:'expedition-command',chrome:{material:'field-canvas',position:'bottom'},lighting:'expedition-contrast',ambient:'route-wind',
    compact:{actorScale:.76,focalPoint:[60,57],simplifyProps:['field-gear']},
  },
};

function stateProps(input:SceneRecipeInput):string[]{
  const props:string[]=[];
  if(input.weather==='rain'){
    if(input.location==='village') props.push('rain-eaves','wet-street');
    else props.push('wet-ground');
  }
  if(input.weather==='snow') props.push('snow-cover');
  if(input.season==='winter'&&input.location==='forest') props.push('snow-branches');
  if(input.worldFacts?.includes('rift_unstable')) props.push('rift-distortion');
  if(input.worldFacts?.includes('hollow_rift_entrenched')) props.push('rift-distortion','hollow-scar');
  if(input.location==='village'&&(input.worldFacts?.includes('festival_saved')||input.worldFacts?.includes('regional_alliance'))){
    props.push('festival-lanterns','alliance-flags');
  }
  return props;
}

function tagValue(tags:readonly string[]|undefined,prefix:string):string|undefined{
  return tags?.find(tag=>tag.startsWith(prefix))?.slice(prefix.length);
}

function resolveExpeditionRecipe(base:SceneRecipe,tags:readonly string[]|undefined):SceneRecipe{
  const phase=tagValue(tags,'expedition:');
  const node=tagValue(tags,'node:');

  if(phase==='reward'||phase==='done'||node==='return'){
    return {
      ...base,
      composition:'expedition-debrief',
      depth:{background:'expedition-skyline',midground:'record-table',foreground:'camp-foreground'},
      props:['record-scroll','return-map'],
      interactionSkin:'expedition-debrief',
      lighting:'expedition-return-glow',
      ambient:'camp-embers',
      compact:{...base.compact,simplifyProps:['return-map']},
    };
  }

  if(phase==='encounter'||node==='encounter'||node?.startsWith('combat_zone_')){
    return {
      ...base,
      composition:'expedition-battlefield',
      camera:{...base.camera,focalPoint:[58,52],zoom:.96},
      actor:{...base.actor,x:24,y:72,scale:.8},
      depth:{background:'battle-skyline',midground:'battle-center',foreground:'command-foreground'},
      props:['enemy-markers','battle-cover','command-lines'],
      interactionSkin:'expedition-tactical',
      chrome:{material:'field-metal',position:'bottom'},
      lighting:'battle-contrast',
      ambient:'battle-dust',
      compact:{...base.compact,focalPoint:[60,54],simplifyProps:['battle-cover']},
    };
  }

  if(phase==='node'&&node==='camp'){
    return {
      ...base,
      composition:'expedition-camp',
      props:['camp-tent','route-map','field-gear'],
      interactionSkin:'expedition-preparation',
      ambient:'camp-embers',
    };
  }

  return base;
}

export function resolveSceneRecipe(input:SceneRecipeInput):ResolvedSceneRecipe{
  const base=SCENE_RECIPES[input.location];
  const presented=input.location==='expedition_field'?resolveExpeditionRecipe(base,input.presentationTags):base;
  return {...presented,props:[...presented.props,...stateProps(input)]};
}