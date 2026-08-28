import type {LocationId,SceneAnchor,SceneDefinition,SceneInteractionDefinition,TimeOfDay} from './scene-types';

const anchor=(id:string,x:number,y:number):SceneAnchor=>({id,x,y});
const interaction=(id:string,label:string,mode:SceneInteractionDefinition['mode'],anchorId=id,extra:Partial<SceneInteractionDefinition>={}):SceneInteractionDefinition=>({id,label,mode,anchorId,...extra});

function scene(location:LocationId,defaultTime:TimeOfDay,anchors:SceneAnchor[],interactions:SceneInteractionDefinition[],runaAnchor='runa'):SceneDefinition{
  return {id:`location:${location}`,location,defaultTime,anchors,cast:[{actorId:'runa',anchorId:runaAnchor,pose:'idle',motion:'idle'}],interactions,beats:[]};
}

export const SCENE_REGISTRY:Record<LocationId,SceneDefinition>={
  home:scene('home','day',[
    anchor('runa',50,67),anchor('bed',18,72),anchor('desk',78,63),anchor('wardrobe',12,42),anchor('bag',69,77),anchor('door',91,54),anchor('world_map',87,28),
  ],[
    interaction('runa','루나와 이야기하기','dialogue'),interaction('bed','잠깐 쉬기','rest'),interaction('desk','이번 주 계획 보기','training'),
    interaction('wardrobe','옷장 열기','inspect'),interaction('bag','가방 열기','inspect'),interaction('door','밖으로 나가기','travel'),interaction('world_map','월드맵 보기','travel'),
  ]),
  training_ground:scene('training_ground','day',[
    anchor('runa',28,70),anchor('dummy',68,62),anchor('rack',82,45),anchor('instructor',51,52),anchor('exit',8,57),
  ],[
    interaction('dummy','훈련 인형 사용','training'),interaction('rack','장비 살펴보기','inspect'),interaction('instructor','교관과 훈련하기','training'),interaction('exit','돌아가기','travel'),
  ]),
  magic_classroom:scene('magic_classroom','day',[
    anchor('runa',30,70),anchor('circle',58,68),anchor('books',78,42),anchor('practice_target',70,61),anchor('instructor',45,50),anchor('exit',8,57),
  ],[
    interaction('circle','마법진 연습','minigame'),interaction('books','마법책 읽기','inspect'),interaction('practice_target','주문 연습','training'),interaction('instructor','수업 듣기','training'),interaction('exit','돌아가기','travel'),
  ]),
  herb_garden:scene('herb_garden','day',[
    anchor('runa',31,71),anchor('herb_patch',64,70),anchor('pots',79,62),anchor('workbench',54,50),anchor('ingredient_rack',84,42),anchor('exit',8,57),
  ],[
    interaction('herb_patch','약초 돌보기','collect'),interaction('pots','화분 살펴보기','inspect'),interaction('workbench','약초 실습','training'),interaction('ingredient_rack','재료 살펴보기','inspect'),interaction('exit','돌아가기','travel'),
  ]),
  forest:scene('forest','day',[
    anchor('runa',28,72),anchor('trace',56,63),anchor('tree',76,47),anchor('herb',68,73),anchor('path',88,58),anchor('exit',8,60),
  ],[
    interaction('trace','빛나는 흔적 조사','explore'),interaction('tree','오래된 나무 살펴보기','inspect'),interaction('herb','약초 찾기','collect'),interaction('path','숲길 탐색','explore'),interaction('exit','돌아가기','travel'),
  ]),
  village:scene('village','day',[
    anchor('runa',31,73),anchor('square',52,67),anchor('shop',77,51),anchor('performance',62,58),anchor('repair',85,66),anchor('alley',91,39),anchor('exit',8,60),
  ],[
    interaction('square','광장 둘러보기','explore'),interaction('shop','상점 보기','shop'),interaction('performance','공연 구경하기','explore'),interaction('repair','수리점 돕기','explore'),interaction('alley','골목 살펴보기','explore'),interaction('exit','돌아가기','travel'),
  ]),
  lakeside:scene('lakeside','sunset',[
    anchor('runa',31,72),anchor('water',61,68),anchor('fish',72,63),anchor('rest',47,75),anchor('wind-crystal',82,49),anchor('exit',8,60),
  ],[
    interaction('water','물가 살펴보기','inspect'),interaction('fish','은빛 물고기 찾기','explore'),interaction('rest','바람을 맞으며 쉬기','rest'),interaction('wind-crystal','바람 결정 조사','explore'),interaction('exit','돌아가기','travel'),
  ]),
  old_shrine:scene('old_shrine','night',[
    anchor('runa',31,72),anchor('altar',61,52),anchor('inscription',76,43),anchor('guardian-light',54,36),anchor('exit',8,60),
  ],[
    interaction('altar','수호 제단에 다가가기','dialogue'),interaction('inscription','오래된 글 읽기','inspect'),interaction('guardian-light','빛의 흔적 살펴보기','explore'),interaction('exit','돌아가기','travel'),
  ]),
  expedition_field:scene('expedition_field','day',[
    anchor('runa',27,72),anchor('camp',22,55),anchor('path',52,63),anchor('crossroads',68,58),anchor('ruin',80,46),anchor('rift',88,31),anchor('treasure',61,43),anchor('encounter',73,69),anchor('return',8,60),
  ],[
    interaction('camp','야영지 정비','rest'),interaction('path','앞으로 탐험','explore'),interaction('crossroads','갈림길 선택','choice'),interaction('ruin','유적 조사','explore'),interaction('rift','균열 조사','explore'),interaction('treasure','발견물 확인','reward'),interaction('encounter','위협과 대치','battle'),interaction('return','원정 종료','travel'),
  ]),
};

export function sceneDefinition(location:LocationId):SceneDefinition{
  return SCENE_REGISTRY[location];
}
