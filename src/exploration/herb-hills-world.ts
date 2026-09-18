import type {Personality} from '../game-tactical-base';
import type {ExplorationInteractable,ExplorationStoryFrame,ExplorationWorldDefinition} from './exploration-types';
import type {LivingRegionProgress} from './living-region-state';

const herbAsset=(name:string)=>`/assets/exploration/herb-hills/${name}`;
export type HerbHillsContext={personality:Personality;affection:number;worldFacts:readonly string[];inheritedWorldFacts:readonly string[]};
export type HerbHillsExploration={world:ExplorationWorldDefinition;storyFrames:Record<string,ExplorationStoryFrame>;discoveryByInteraction:Readonly<Record<string,string>>;questStartInteractionId:string;questResolveInteractionId:string;postResolutionInteractionId:string};
const QUEST_START='herb-mira-request';
const QUEST_RESOLVE='herb-delivery-basket';
const POST_RESOLUTION='herb-restored-rack';
const discoveryByInteraction={'herb-mint-patch':'hill_mint','herb-sunleaf-patch':'sunleaf','herb-rare-bloom':'silver_bloom'} as const;

export function herbHillsExploration(progress:LivingRegionProgress,context:HerbHillsContext):HerbHillsExploration{
  const resolved=progress.phase==='mainQuestResolved'||progress.phase==='postResolution';
  const post=progress.phase==='postResolution';
  const kind=context.personality.kindness>=10;
  const bonded=context.affection>=55;
  const experienced=context.worldFacts.length>0||context.inheritedWorldFacts.length>0;
  const storyFrames:Record<string,ExplorationStoryFrame>={
    'herb-mira':{id:'herb-mira',eyebrow:'HERB HILLS · GATHERER',title:resolved?'다시 바빠진 약초밭':'미라의 작은 부탁',speaker:'채집가 미라',text:resolved?(bonded?'“루나가 다시 왔네! 네가 골라 준 약초 덕분에 마을 건조대가 다시 가득 찼어.”':'“바람이 좋아졌어. 네가 도와준 뒤로 채집 길도 다시 살아났단다.”'):(kind?'“조심히 따는 손을 보니 부탁해도 되겠네. 언덕 약초 두 가지를 살펴보고 희귀 꽃의 흔적도 찾아줄래?”':'“요즘 채집 길이 엉켰어. 언덕의 약초와 희귀 꽃을 확인해 주면 큰 도움이 될 거야.”'),artSrc:herbAsset('mira.svg'),frameSrc:herbAsset('story-frame.svg'),actionLabel:'미라와 이야기하기',progression:false},
    'herb-jun':{id:'herb-jun',eyebrow:'HERB HILLS · LOCAL',title:'바람길을 읽는 준',speaker:'약초꾼 준',text:experienced?'“멀리 다녀본 눈이네. 바람이 꺾이는 바위 뒤를 봐. 은빛 꽃은 평범한 길보다 그런 자리를 좋아해.”':'“언덕에서는 길보다 바람을 따라가. 풀이 한쪽으로 누운 곳 끝에 좋은 채집터가 있어.”',artSrc:herbAsset('jun.svg'),frameSrc:herbAsset('story-frame.svg'),actionLabel:'바람길 힌트 듣기',progression:false},
    'herb-sora':{id:'herb-sora',eyebrow:'HERB HILLS · DRYING RACK',title:resolved?'향긋한 건조대':'비어 있는 건조대',speaker:'관리인 소라',text:resolved?'“건조대가 다시 돌아가니 언덕 전체가 향긋해졌어. 다음에 오면 계절 약초도 보여줄게.”':'“채집량이 줄어서 건조대가 텅 비었어. 미라의 부탁이 끝나면 다시 손볼 수 있을 텐데.”',artSrc:herbAsset('sora.svg'),frameSrc:herbAsset('story-frame.svg'),actionLabel:'건조대 이야기 듣기',progression:false},
    'herb-request':{id:'herb-request',eyebrow:'MAIN QUEST · LOCAL REQUEST',title:'언덕의 세 가지 향기',speaker:'미라',text:'언덕민트와 햇잎초를 확인하고, 바람 능선 어딘가에 핀다는 은빛 꽃까지 찾아보자. 세 흔적을 모두 알면 미라의 채집 바구니를 채울 수 있다.',artSrc:herbAsset('basket.svg'),frameSrc:herbAsset('story-frame.svg'),actionLabel:'부탁 맡기',progression:false},
    'herb-mint':{id:'herb-mint',eyebrow:'DISCOVERY',title:'차가운 향의 언덕민트',speaker:'루나',text:'돌담 아래 푸른 잎을 문지르자 시원한 향이 번진다. 첫 번째 채집 지점을 기억했다.',artSrc:herbAsset('herb-patch.svg'),frameSrc:herbAsset('story-frame.svg'),actionLabel:'언덕민트 확인',progression:false},
    'herb-sunleaf':{id:'herb-sunleaf',eyebrow:'DISCOVERY',title:'햇빛을 머금은 햇잎초',speaker:'루나',text:'남쪽 비탈의 노란 잎은 햇빛이 강할수록 향이 짙다. 두 번째 채집 지점이다.',artSrc:herbAsset('herb-patch.svg'),frameSrc:herbAsset('story-frame.svg'),actionLabel:'햇잎초 확인',progression:false},
    'herb-rare':{id:'herb-rare',eyebrow:'RARE DISCOVERY',title:'바람 속 은빛 꽃',speaker:'루나',text:'바위 뒤 그늘에서 은빛 꽃 한 송이가 흔들린다. 뽑지 않고 위치만 표시해 두면 다음 계절에도 다시 만날 수 있다.',artSrc:herbAsset('rare-bloom.svg'),frameSrc:herbAsset('story-frame.svg'),actionLabel:'희귀 꽃 기록',progression:false},
    'herb-delivery':{id:'herb-delivery',eyebrow:'MAIN QUEST · COMPLETE',title:'다시 채워진 채집 바구니',speaker:'미라',text:'세 채집 지점을 확인한 덕분에 필요한 약초를 무리 없이 모을 수 있게 됐다. 미라와 소라는 비어 있던 건조대를 다시 정리하기 시작한다.',artSrc:herbAsset('basket.svg'),frameSrc:herbAsset('story-frame.svg'),actionLabel:'채집 정보 전하기',progression:false},
    'herb-revisit':{id:'herb-revisit',eyebrow:'REVISIT · HERB HILLS',title:'살아난 언덕의 향기',speaker:'루나',text:post?'건조대에는 새 약초 묶음이 늘었고 채집 길의 표지판도 정돈되어 있다. 언덕은 이제 다시 찾아올 이유가 있는 생활터가 됐다.':'미라가 새 바구니를 걸고 소라가 건조대를 손본다. 해결한 부탁이 언덕 풍경을 실제로 바꾸고 있다.',artSrc:herbAsset('restored-rack.svg'),frameSrc:herbAsset('story-frame.svg'),actionLabel:'달라진 언덕 보기',progression:false},
  };
  const interactables:ExplorationInteractable[]=[
    {id:'herb-exit',label:'여행자 교차로로 돌아가기',kind:'exit',position:{x:1200,y:1510},radius:115},
    {id:'herb-npc-mira',label:resolved?'미라와 다시 이야기하기':'채집가 미라에게 말 걸기',kind:'story',position:{x:730,y:1180},radius:120,storyFrameId:'herb-mira',artSrc:herbAsset('mira.svg'),repeatable:true},
    {id:'herb-npc-jun',label:'약초꾼 준에게 바람길 묻기',kind:'story',position:{x:1780,y:1040},radius:120,storyFrameId:'herb-jun',artSrc:herbAsset('jun.svg'),repeatable:true},
    {id:'herb-npc-sora',label:'관리인 소라와 이야기하기',kind:'story',position:{x:520,y:650},radius:120,storyFrameId:'herb-sora',artSrc:herbAsset('sora.svg'),repeatable:true},
  ];
  if(resolved){interactables.push({id:POST_RESOLUTION,label:'다시 가동된 약초 건조대 살펴보기',kind:'story',position:{x:1030,y:390},radius:145,storyFrameId:'herb-revisit',artSrc:herbAsset('restored-rack.svg'),repeatable:true});}
  else interactables.push(
    {id:QUEST_START,label:'미라의 약초 부탁 확인하기',kind:'story',position:{x:850,y:1240},radius:130,storyFrameId:'herb-request',artSrc:herbAsset('basket.svg')},
    {id:'herb-mint-patch',label:'돌담 아래 언덕민트 살펴보기',kind:'story',position:{x:390,y:830},radius:125,storyFrameId:'herb-mint',artSrc:herbAsset('herb-patch.svg'),requiresCompleted:[QUEST_START]},
    {id:'herb-sunleaf-patch',label:'남쪽 비탈 햇잎초 살펴보기',kind:'story',position:{x:1510,y:1240},radius:125,storyFrameId:'herb-sunleaf',artSrc:herbAsset('herb-patch.svg'),requiresCompleted:[QUEST_START]},
    {id:'herb-rare-bloom',label:'바람 능선의 은빛 꽃 기록하기',kind:'story',position:{x:1960,y:520},radius:135,storyFrameId:'herb-rare',artSrc:herbAsset('rare-bloom.svg'),requiresCompleted:['herb-mint-patch','herb-sunleaf-patch']},
    {id:QUEST_RESOLVE,label:'미라에게 채집 지점 알려주기',kind:'story',position:{x:930,y:1050},radius:135,storyFrameId:'herb-delivery',artSrc:herbAsset('basket.svg'),requiresCompleted:['herb-mint-patch','herb-sunleaf-patch','herb-rare-bloom']},
  );
  return {world:{id:'herb-hills',label:'약초 언덕',objective:resolved?(post?'달라진 채집터와 주민들의 이야기를 다시 확인하세요.':'다시 가동된 건조대와 주민들의 변화를 살펴보세요.'):(progress.phase==='mainQuestInProgress'?'언덕민트와 햇잎초를 확인하고 은빛 꽃의 위치를 찾아 미라에게 돌아가세요.':'미라의 부탁을 듣고 언덕의 채집 길을 탐색해보세요.'),width:2400,height:1600,playerRadius:22,playerSpeed:236,start:{x:1200,y:1320},layers:[{id:'ground',src:herbAsset('hills-ground.svg'),zIndex:0},...(resolved?[{id:'restored',src:herbAsset('restored-rack.svg'),zIndex:4}]:[])],obstacles:[{id:'west-rocks',x:80,y:240,width:260,height:700},{id:'east-rocks',x:2080,y:220,width:240,height:760},{id:'north-ridge',x:520,y:80,width:1360,height:210},{id:'shed',x:620,y:330,width:360,height:260},{id:'stone-wall',x:260,y:980,width:560,height:130},{id:'central-boulders',x:1120,y:650,width:300,height:250},{id:'east-slope',x:1680,y:760,width:400,height:170}],interactables},storyFrames,discoveryByInteraction,questStartInteractionId:QUEST_START,questResolveInteractionId:QUEST_RESOLVE,postResolutionInteractionId:POST_RESOLUTION};
}
