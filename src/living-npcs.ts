import type {CharacterId} from './campaign-model';
import type {LegacyWorldMarkerId,PublicProjectId} from './generational-world';

export type LivingNpcContext={
  activeCampaign:string|null;
  activeRoute:string|null;
  week:number;
  month:number;
  runNumber:number;
  inheritedFactCount:number;
  generation?:number;
  legacyMarkers?:readonly LegacyWorldMarkerId[];
  completedProjects?:readonly PublicProjectId[];
};

const campaignRepresentative:Record<string,CharacterId>={
  caretaker:'mira',
  pathfinder:'kael',
  vanguard:'rex',
  arcanist:'selene',
  true_path:'lyra',
};

const sharedRotation:Record<number,CharacterId[]>={
  1:['eiden','noa'],
  2:['noa','eiden'],
  3:['selene','noa'],
  4:['noa','eiden'],
};

export function weeklyNpcPresence(context:LivingNpcContext):CharacterId[]{
  const primary:CharacterId=context.activeRoute==='hollow'
    ? 'veyr'
    : campaignRepresentative[context.activeCampaign ?? ''] ?? 'noa';

  const result:CharacterId[]=[primary];
  const add=(id:CharacterId)=>{
    if(result.length<3&&!result.includes(id)) result.push(id);
  };

  if(context.runNumber>1&&context.inheritedFactCount>0&&primary!=='lyra'&&primary!=='veyr') add('lyra');

  const markers=context.legacyMarkers??[];
  const completed=context.completedProjects??[];
  if(completed.includes('guardian_academy')) add('eiden');
  if((context.generation??1)>1&&markers.includes('hollow_scar')&&context.activeRoute!=='hollow') add('lyra');
  if(markers.includes('regional_compact')||completed.includes('regional_council')) add('noa');

  const normalizedWeek=Math.min(4,Math.max(1,Number.isFinite(context.week)?Math.floor(context.week):1));
  for(const id of sharedRotation[normalizedWeek]) add(id);

  if(context.activeRoute==='hollow') add('lyra');
  else if(context.activeCampaign==='true_path') add('noa');

  return result;
}

export const livingNpcLabels:Record<CharacterId,string>={
  mira:'미라',
  kael:'카엘',
  rex:'렉스',
  selene:'셀레네',
  noa:'노아',
  eiden:'에이든',
  lyra:'리라',
  veyr:'베이르',
};
