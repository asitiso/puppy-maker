import type { ActivityId, Personality, PersonalityKey } from '../game';
const clamp=(v:number)=>Math.max(0,Math.min(100,v));
export function applyPersonalityDelta(personality:Personality,delta:Partial<Personality>):Personality{const next={...personality};(Object.keys(delta) as PersonalityKey[]).forEach(key=>next[key]=clamp(next[key]+(delta[key]??0)));return next;}
export function dominantPersonality(personality:Personality):PersonalityKey{return (Object.keys(personality) as PersonalityKey[]).reduce((best,key)=>personality[key]>personality[best]?key:best,'courage');}
export function activityPersonalityDelta(id:ActivityId):Partial<Personality>{return id==='hunt'?{courage:2}:id==='magic'?{curiosity:2}:id==='rest'?{calmness:2}:{curiosity:1,calmness:1};}
