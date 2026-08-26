export type GuidedActionDomain='reward'|'weekly'|'world'|'raising'|'season'|'tactical'|'bond'|'records'|'schedule';
export type GuidedActionRoute='mail'|'attendance'|'achievement'|'weekly_planner'|'advance_week'|'schedule'|'outing'|'bond'|'expedition'|'tactical'|'season';
export type GuidedActionState='ready'|'blocked'|'complete';

export type GuidedAction={
  id:string;
  domain:GuidedActionDomain;
  label:string;
  detail:string;
  route:GuidedActionRoute;
  priority:number;
  state:GuidedActionState;
  reason?:string;
  resolveRoute?:GuidedActionRoute;
};

export type GuidedActionStack={
  primary:GuidedAction;
  secondary:GuidedAction[];
};

export function guidedActionStack(actions:readonly GuidedAction[]):GuidedActionStack{
  if(actions.length===0)throw new Error('guidedActionStack requires at least one action');

  const ranked=actions
    .map((action,index)=>({action,index}))
    .sort((left,right)=>right.action.priority-left.action.priority||left.index-right.index)
    .map(entry=>entry.action);
  const primary=ranked[0];
  const remaining=ranked.slice(1);
  const secondary:GuidedAction[]=[];
  const usedRoutes=new Set<GuidedActionRoute>([primary.route]);

  for(const action of remaining){
    if(secondary.length>=2)break;
    if(usedRoutes.has(action.route))continue;
    secondary.push(action);
    usedRoutes.add(action.route);
  }

  if(secondary.length<2){
    for(const action of remaining){
      if(secondary.length>=2)break;
      if(secondary.includes(action))continue;
      secondary.push(action);
    }
  }

  return {primary,secondary};
}
