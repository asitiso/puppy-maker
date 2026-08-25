export type WeekDate={year:number;month:number;week:number};
export type AdvancedWeekDate=WeekDate&{monthChanged:boolean;yearChanged:boolean};

const safeInt=(value:number,fallback:number)=>Number.isFinite(value)?Math.floor(value):fallback;

export function normalizeWeekDate(year:number,month:number,week:number):WeekDate{
  return {
    year:Math.max(1,safeInt(year,1)),
    month:Math.min(12,Math.max(1,safeInt(month,1))),
    week:Math.min(4,Math.max(1,safeInt(week,1))),
  };
}

export function weekKey(year:number,month:number,week:number):string{
  const date=normalizeWeekDate(year,month,week);
  return `${date.year}-${date.month}-${date.week}`;
}

export function isCanonicalWeekKey(value:unknown):value is string{
  if(typeof value!=='string') return false;
  const match=/^([1-9]\d*)-(1[0-2]|[1-9])-([1-4])$/.exec(value);
  if(!match) return false;
  return weekKey(Number(match[1]),Number(match[2]),Number(match[3]))===value;
}

export function advanceWeekDate(input:WeekDate):AdvancedWeekDate{
  const date=normalizeWeekDate(input.year,input.month,input.week);
  if(date.week<4) return {...date,week:date.week+1,monthChanged:false,yearChanged:false};
  if(date.month<12) return {year:date.year,month:date.month+1,week:1,monthChanged:true,yearChanged:false};
  return {year:date.year+1,month:1,week:1,monthChanged:true,yearChanged:true};
}
