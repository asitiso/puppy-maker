import {weekKey} from '../weekly-calendar';
import type {Weather} from './scene-types';

const WEATHER:readonly Weather[]=['clear','cloudy','rain','snow','mist'];

function stableHash(input:string):number{
  let hash=2166136261;
  for(let index=0;index<input.length;index+=1){
    hash^=input.charCodeAt(index);
    hash=Math.imul(hash,16777619);
  }
  return hash>>>0;
}

export function weatherForWeek(year:number,month:number,week:number):Weather{
  const key=weekKey(year,month,week);
  return WEATHER[stableHash(key)%WEATHER.length] ?? 'clear';
}
