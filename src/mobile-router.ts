export type MobileCategoryId='home'|'life'|'growth'|'adventure'|'bond'|'records';
export type MobileContentCategory=Exclude<MobileCategoryId,'home'>;

export type MobileFeatureId=
  |'schedule'
  |'mission'
  |'attendance'
  |'mail'
  |'raising'
  |'ambition'
  |'achievements'
  |'inventory'
  |'season'
  |'sanctuary'
  |'outing'
  |'expedition'
  |'world'
  |'bond'
  |'gifts'
  |'stories'
  |'archive'
  |'lineage'
  |'world_chronicle';

export type MobilePlayScreen='schedule'|'training'|'dialogue'|'result'|'tactical'|'choice_event';

export type MobileRoute=
  |{kind:'home'}
  |{kind:'category';category:MobileContentCategory}
  |{kind:'feature';category:MobileContentCategory;feature:MobileFeatureId}
  |{kind:'play';category:MobileCategoryId;screen:MobilePlayScreen};

export type MobileNavigationState={current:MobileRoute;stack:MobileRoute[]};

export type MobileNavigationAction=
  |{type:'OPEN_CATEGORY';category:MobileContentCategory}
  |{type:'OPEN_FEATURE';category:MobileContentCategory;feature:MobileFeatureId}
  |{type:'OPEN_PLAY';category:MobileCategoryId;screen:MobilePlayScreen}
  |{type:'BACK'}
  |{type:'HOME'}
  |{type:'FINISH_FEATURE'}
  |{type:'FINISH_PLAY'}
  |{type:'REPLACE';route:unknown};

const categories:readonly MobileContentCategory[]=['life','growth','adventure','bond','records'];
const features:readonly MobileFeatureId[]=[
  'schedule','mission','attendance','mail','raising','ambition','achievements','inventory','season','sanctuary',
  'outing','expedition','world','bond','gifts','stories','archive','lineage','world_chronicle',
];
const playScreens:readonly MobilePlayScreen[]=['schedule','training','dialogue','result','tactical','choice_event'];
const homeRoute:MobileRoute={kind:'home'};

export const initialMobileNavigationState:MobileNavigationState={current:homeRoute,stack:[]};

export const categoryForFeature:Record<MobileFeatureId,MobileContentCategory>={
  schedule:'life',mission:'life',attendance:'life',mail:'life',
  raising:'growth',ambition:'growth',achievements:'growth',inventory:'growth',season:'growth',sanctuary:'growth',
  outing:'adventure',expedition:'adventure',world:'adventure',
  bond:'bond',gifts:'bond',stories:'bond',
  archive:'records',lineage:'records',world_chronicle:'records',
};

function isRecord(value:unknown):value is Record<string,unknown>{
  return Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
}
function isCategory(value:unknown):value is MobileContentCategory{
  return typeof value==='string'&&categories.includes(value as MobileContentCategory);
}
function isMobileCategory(value:unknown):value is MobileCategoryId{
  return value==='home'||isCategory(value);
}
function isFeature(value:unknown):value is MobileFeatureId{
  return typeof value==='string'&&features.includes(value as MobileFeatureId);
}
function isPlayScreen(value:unknown):value is MobilePlayScreen{
  return typeof value==='string'&&playScreens.includes(value as MobilePlayScreen);
}
export function isMobileRoute(value:unknown):value is MobileRoute{
  if(!isRecord(value)||typeof value.kind!=='string')return false;
  if(value.kind==='home')return true;
  if(value.kind==='category')return isCategory(value.category);
  if(value.kind==='feature')return isCategory(value.category)&&isFeature(value.feature)&&categoryForFeature[value.feature]===value.category;
  if(value.kind==='play')return isMobileCategory(value.category)&&isPlayScreen(value.screen);
  return false;
}

function categoryState(category:MobileContentCategory):MobileNavigationState{
  return {current:{kind:'category',category},stack:[homeRoute]};
}
function featureState(category:MobileContentCategory,feature:MobileFeatureId):MobileNavigationState{
  if(categoryForFeature[feature]!==category)return initialMobileNavigationState;
  return {current:{kind:'feature',category,feature},stack:[homeRoute,{kind:'category',category}]};
}
function playState(category:MobileCategoryId,screen:MobilePlayScreen):MobileNavigationState{
  return {
    current:{kind:'play',category,screen},
    stack:category==='home'?[homeRoute]:[homeRoute,{kind:'category',category}],
  };
}

export function isGuardedActiveRoute(route:MobileRoute):boolean{
  return route.kind==='play'&&(['training','dialogue','tactical','choice_event'] as readonly MobilePlayScreen[]).includes(route.screen);
}

export function mobileNavigationReducer(state:MobileNavigationState,action:MobileNavigationAction):MobileNavigationState{
  switch(action.type){
    case 'OPEN_CATEGORY':
      if(state.current.kind==='category'&&state.current.category===action.category)return state;
      return categoryState(action.category);
    case 'OPEN_FEATURE':
      return featureState(action.category,action.feature);
    case 'OPEN_PLAY':
      return playState(action.category,action.screen);
    case 'BACK':
      if(state.current.kind==='home')return state;
      if(state.current.kind==='category')return initialMobileNavigationState;
      if(state.current.kind==='feature')return categoryState(state.current.category);
      if(state.current.kind==='play'&&state.current.category!=='home')return categoryState(state.current.category);
      return initialMobileNavigationState;
    case 'HOME':
    case 'FINISH_PLAY':
      return initialMobileNavigationState;
    case 'FINISH_FEATURE':
      return state.current.kind==='feature'?categoryState(state.current.category):state;
    case 'REPLACE':
      if(!isMobileRoute(action.route))return initialMobileNavigationState;
      if(action.route.kind==='home')return initialMobileNavigationState;
      if(action.route.kind==='category')return categoryState(action.route.category);
      if(action.route.kind==='feature')return featureState(action.route.category,action.route.feature);
      return playState(action.route.category,action.route.screen);
  }
}
