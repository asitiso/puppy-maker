export type Season='spring'|'summer'|'autumn'|'winter';
export type ProgressMilestone='first-quarter'|'half-year'|'final-quarter'|'final-month';
export function advanceCalendar(year:number,month:number){return month>=12?{year:year+1,month:1}:{year,month:month+1};}
export function seasonForMonth(month:number):Season{const m=((month-1)%12+12)%12+1;return m>=3&&m<=5?'spring':m>=6&&m<=8?'summer':m>=9&&m<=11?'autumn':'winter';}
export function milestoneForMonth(month:number):ProgressMilestone|null{return month===3?'first-quarter':month===6?'half-year':month===9?'final-quarter':month===12?'final-month':null;}
