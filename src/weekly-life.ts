import type {LegacyWorldMarkerId,PublicProjectId} from './generational-world';
import {lifeStageForYear,type HeritageTraitId} from './lineage';
import {isCanonicalWeekKey,weekKey} from './weekly-calendar';

export const weeklyFocusIds=['training','rest','outing','bond','world','tactical','season'] as const;
export type WeeklyFocusId=typeof weeklyFocusIds[number];

export const weeklyEventIds=['training_partner','quiet_rain','market_day','campfire_invitation','guardian_patrol','rival_challenge','festival_preparation','old_echo','rift_whisper','independent_patrol','veteran_patrol','ancestral_story','academy_drill','legacy_road_patrol','rift_watch_rounds','scarred_district'] as const;
export type WeeklyEventId=typeof weeklyEventIds[number];

export type WeeklyLifeState={
  focusKey:string|null;
  focus:WeeklyFocusId|null;
  completedWeekKey:string|null;
  resolvedEventKeys:string[];
  lastEvent:WeeklyEventId|null;
};

export type WeeklyLifeContext={
  year:number;
  month:number;
  week:number;
  focus:WeeklyFocusId;
  activeCampaign:string|null;
  activeRoute:string|null;
  runNumber:number;
  inheritedFactCount:number;
  heritageTraits?:readonly HeritageTraitId[];
  generation?:number;
  legacyMarkers?:readonly LegacyWorldMarkerId[];
  completedProjects?:readonly PublicProjectId[];
};

export type WeeklyEventEffect={
  gold:number;
  stats:Partial<Record<'strength'|'intelligence'|'magic'|'morality'|'affection'|'stress'|'fatigue',number>>;
};

const isRecord=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
const isFocus=(value:unknown):value is WeeklyFocusId=>typeof value==='string'&&(weeklyFocusIds as readonly string[]).includes(value);
const isEvent=(value:unknown):value is WeeklyEventId=>typeof value==='string'&&(weeklyEventIds as readonly string[]).includes(value);

export function emptyWeeklyLifeState():WeeklyLifeState{
  return {focusKey:null,focus:null,completedWeekKey:null,resolvedEventKeys:[],lastEvent:null};
}

function isResolutionKey(value:unknown):value is string{
  if(typeof value!=='string') return false;
  const split=value.lastIndexOf(':');
  if(split<=0) return false;
  const key=value.slice(0,split);
  const event=value.slice(split+1);
  return isCanonicalWeekKey(key)&&isEvent(event);
}

export function hydrateWeeklyLifeState(raw:unknown):WeeklyLifeState{
  if(!isRecord(raw)) return emptyWeeklyLifeState();
  const focusKey=isCanonicalWeekKey(raw.focusKey)?raw.focusKey:null;
  const focus=focusKey&&isFocus(raw.focus)?raw.focus:null;
  const completedWeekKey=isCanonicalWeekKey(raw.completedWeekKey)?raw.completedWeekKey:null;
  const resolvedEventKeys=Array.isArray(raw.resolvedEventKeys)
    ? [...new Set(raw.resolvedEventKeys.filter(isResolutionKey))].slice(-96)
    : [];
  const lastEvent=isEvent(raw.lastEvent)?raw.lastEvent:null;
  return {focusKey,focus,completedWeekKey,resolvedEventKeys,lastEvent};
}

export function selectWeeklyFocus(state:WeeklyLifeState,key:string,focus:WeeklyFocusId):WeeklyLifeState{
  if(!isCanonicalWeekKey(key)||!isFocus(focus)||state.completedWeekKey===key) return state;
  return {...state,focusKey:key,focus};
}

export function weeklyEventFor(context:WeeklyLifeContext):WeeklyEventId{
  if(context.activeRoute==='hollow') return 'rift_whisper';
  if(context.activeCampaign==='true_path') return 'old_echo';
  if(context.runNumber>1&&context.inheritedFactCount>0&&context.focus==='season') return 'old_echo';
  if(context.focus==='bond'&&(context.heritageTraits?.length??0)>0) return 'ancestral_story';
  if(context.focus==='world'){
    const markers=context.legacyMarkers??[];
    const completed=context.completedProjects??[];
    if(completed.includes('rift_watch')||markers.includes('restored_riftward')) return 'rift_watch_rounds';
    if(completed.includes('guardian_academy')) return 'academy_drill';
    if((context.generation??1)>1&&markers.includes('hollow_scar')) return 'scarred_district';
    if(completed.includes('ancient_road_restoration')||markers.includes('open_road_network')) return 'legacy_road_patrol';
    const stage=lifeStageForYear(context.year);
    if(stage==='young_guardian') return 'independent_patrol';
    if(stage==='seasoned_guardian') return 'veteran_patrol';
  }
  const byFocus:Record<WeeklyFocusId,WeeklyEventId>={
    training:'training_partner',rest:'quiet_rain',outing:'market_day',bond:'campfire_invitation',
    world:'guardian_patrol',tactical:'rival_challenge',season:'festival_preparation',
  };
  return byFocus[context.focus];
}

export function weeklyEventEffect(id:WeeklyEventId):WeeklyEventEffect{
  const effects:Record<WeeklyEventId,WeeklyEventEffect>={
    training_partner:{gold:0,stats:{strength:1}},
    quiet_rain:{gold:0,stats:{stress:-4,fatigue:-4}},
    market_day:{gold:60,stats:{}},
    campfire_invitation:{gold:0,stats:{affection:2,stress:-1}},
    guardian_patrol:{gold:0,stats:{morality:1,fatigue:1}},
    rival_challenge:{gold:0,stats:{strength:1,fatigue:2}},
    festival_preparation:{gold:40,stats:{morality:1}},
    old_echo:{gold:0,stats:{affection:1}},
    rift_whisper:{gold:0,stats:{magic:1,stress:2}},
    independent_patrol:{gold:0,stats:{morality:1}},
    veteran_patrol:{gold:0,stats:{morality:1,fatigue:1}},
    ancestral_story:{gold:0,stats:{affection:1}},
    academy_drill:{gold:0,stats:{strength:1,fatigue:1}},
    legacy_road_patrol:{gold:20,stats:{morality:1,fatigue:1}},
    rift_watch_rounds:{gold:0,stats:{magic:1,stress:1}},
    scarred_district:{gold:0,stats:{morality:1,stress:1}},
  };
  return effects[id];
}

export function weeklyEventResolutionKey(year:number,month:number,week:number,event:WeeklyEventId):string{
  return `${weekKey(year,month,week)}:${event}`;
}
