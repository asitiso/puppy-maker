import {normalizeWeekDate} from '../weekly-calendar';
import type {Season} from './scene-types';

export function seasonForMonth(month:number):Season{
  const canonical=normalizeWeekDate(1,month,1).month;
  if(canonical<=3) return 'spring';
  if(canonical<=6) return 'summer';
  if(canonical<=9) return 'autumn';
  return 'winter';
}
